import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { AnalyticsData, DAY_NAMES, DAY_NAMES_FULL } from "./AnalyticsTypes";

// Helper to map DOI prefixes to publisher names
function getPublisherFromPrefix(prefix: string): string {
  const publishers: Record<string, string> = {
    "1016": "Elsevier",
    "1038": "Nature",
    "1126": "Science/AAAS",
    "1002": "Wiley",
    "1080": "Taylor & Francis",
    "1007": "Springer",
    "1093": "Oxford University Press",
    "1177": "SAGE",
    "1371": "PLOS",
    "3389": "Frontiers",
    "1136": "BMJ",
    "1056": "NEJM",
    "1001": "ACS Publications",
    "1021": "ACS Publications",
    "1039": "Royal Society of Chemistry",
    "1186": "BioMed Central",
    "1155": "Hindawi",
    "3390": "MDPI",
    "1515": "De Gruyter",
    "1097": "Lippincott Williams & Wilkins",
  };
  return publishers[prefix] || `Editorial (${prefix})`;
}

// Helper to extract keywords from title for journal hints
function extractKeywordsFromTitle(title: string): string | null {
  const lowerTitle = title.toLowerCase();
  const journals = [
    { keywords: ["nature"], name: "Nature" },
    { keywords: ["science", "scientific"], name: "Science" },
    { keywords: ["lancet"], name: "The Lancet" },
    { keywords: ["nejm", "new england"], name: "NEJM" },
    { keywords: ["jama"], name: "JAMA" },
    { keywords: ["bmj", "british medical"], name: "BMJ" },
    { keywords: ["plos"], name: "PLOS" },
    { keywords: ["cell"], name: "Cell" },
    { keywords: ["ieee"], name: "IEEE" },
    { keywords: ["acm"], name: "ACM" },
  ];

  for (const journal of journals) {
    if (journal.keywords.some((kw) => lowerTitle.includes(kw))) {
      return journal.name;
    }
  }
  return null;
}

export function useAnalyticsData() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all data in parallel
      const [
        { data: solicitudes },
        { data: profiles },
        { data: respuestas },
        { data: comentarios },
      ] = await Promise.all([
        supabase.from("solicitudes").select("*"),
        supabase.from("profiles").select("*"),
        supabase.from("respuestas").select("*"),
        supabase.from("comentarios").select("solicitud_id"),
      ]);

      if (!solicitudes || !profiles) {
        setLoading(false);
        return;
      }

      const profileMap = new Map(profiles.map((p) => [p.id, p]));

      // ========== EXISTING METRICS ==========
      
      // Process category counts
      const categoryMap = new Map<string, number>();
      solicitudes.forEach((s) => {
        const cat = s.category || "General";
        categoryMap.set(cat, (categoryMap.get(cat) || 0) + 1);
      });
      const categoryCounts = Array.from(categoryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Process country counts
      const countryMap = new Map<string, number>();
      solicitudes.forEach((s) => {
        const profile = profileMap.get(s.user_id);
        const country = profile?.country || "Sin especificar";
        countryMap.set(country, (countryMap.get(country) || 0) + 1);
      });
      const countryCounts = Array.from(countryMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Process hourly distribution
      const hourMap = new Map<number, number>();
      solicitudes.forEach((s) => {
        const hour = new Date(s.created_at).getHours();
        hourMap.set(hour, (hourMap.get(hour) || 0) + 1);
      });
      const hourlyDistribution = Array.from({ length: 24 }, (_, i) => ({
        hour: `${i.toString().padStart(2, "0")}:00`,
        count: hourMap.get(i) || 0,
      }));

      // Process daily distribution
      const dayMap = new Map<number, number>();
      solicitudes.forEach((s) => {
        const day = new Date(s.created_at).getDay();
        dayMap.set(day, (dayMap.get(day) || 0) + 1);
      });
      const dailyDistribution = DAY_NAMES_FULL.map((name, i) => ({
        day: name,
        count: dayMap.get(i) || 0,
      }));

      // Process journal/DOI patterns
      const journalMap = new Map<string, number>();
      solicitudes.forEach((s) => {
        if (s.doi) {
          const match = s.doi.match(/10\.(\d+)/);
          if (match) {
            const prefix = match[1];
            const publisher = getPublisherFromPrefix(prefix);
            journalMap.set(publisher, (journalMap.get(publisher) || 0) + 1);
          }
        } else {
          const keywords = extractKeywordsFromTitle(s.title);
          if (keywords) {
            journalMap.set(keywords, (journalMap.get(keywords) || 0) + 1);
          }
        }
      });
      const journalCounts = Array.from(journalMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 8);

      // Process monthly trend (last 6 months)
      const monthMap = new Map<string, number>();
      const now = new Date();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        monthMap.set(key, 0);
      }
      solicitudes.forEach((s) => {
        const date = new Date(s.created_at);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        if (monthMap.has(key)) {
          monthMap.set(key, (monthMap.get(key) || 0) + 1);
        }
      });
      const monthlyTrend = Array.from(monthMap.entries()).map(([month, count]) => ({
        month,
        count,
      }));

      // ========== PERFORMANCE METRICS ==========
      
      const totalResolved = solicitudes.filter((s) => s.is_resolved).length;
      const totalPending = solicitudes.length - totalResolved;
      const resolutionRate = solicitudes.length > 0 ? (totalResolved / solicitudes.length) * 100 : 0;

      // Average response time (hours until first response)
      let totalResponseTime = 0;
      let countWithResponses = 0;
      if (respuestas) {
        const responsesBySolicitud = new Map<string, Date>();
        respuestas.forEach((r) => {
          const existing = responsesBySolicitud.get(r.solicitud_id);
          const current = new Date(r.created_at);
          if (!existing || current < existing) {
            responsesBySolicitud.set(r.solicitud_id, current);
          }
        });
        
        solicitudes.forEach((s) => {
          const firstResponse = responsesBySolicitud.get(s.id);
          if (firstResponse) {
            const solicitudDate = new Date(s.created_at);
            const diffHours = (firstResponse.getTime() - solicitudDate.getTime()) / (1000 * 60 * 60);
            totalResponseTime += diffHours;
            countWithResponses++;
          }
        });
      }
      const avgResponseTime = countWithResponses > 0 ? totalResponseTime / countWithResponses : 0;

      // Responses per request
      const responsesCount = respuestas?.length || 0;
      const avgResponsesPerRequest = solicitudes.length > 0 ? responsesCount / solicitudes.length : 0;

      // Best answer rate
      const bestAnswerCount = respuestas?.filter((r) => r.is_best_answer).length || 0;
      const bestAnswerRate = responsesCount > 0 ? (bestAnswerCount / responsesCount) * 100 : 0;

      // ========== USER METRICS ==========
      
      // Level distribution
      const levelMap = new Map<string, number>();
      profiles.forEach((p) => {
        const level = p.level || "novato";
        levelMap.set(level, (levelMap.get(level) || 0) + 1);
      });
      const levelDistribution = Array.from(levelMap.entries())
        .map(([name, value]) => ({ name, value }));

      // User growth (by profile created_at)
      const userGrowthMap = new Map<string, number>();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        userGrowthMap.set(key, 0);
      }
      profiles.forEach((p) => {
        const date = new Date(p.created_at);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        if (userGrowthMap.has(key)) {
          userGrowthMap.set(key, (userGrowthMap.get(key) || 0) + 1);
        }
      });
      const userGrowth = Array.from(userGrowthMap.entries()).map(([month, count]) => ({
        month,
        count,
      }));

      // Top active users
      const userActivityMap = new Map<string, { requests: number; responses: number }>();
      solicitudes.forEach((s) => {
        const existing = userActivityMap.get(s.user_id) || { requests: 0, responses: 0 };
        existing.requests++;
        userActivityMap.set(s.user_id, existing);
      });
      respuestas?.forEach((r) => {
        const existing = userActivityMap.get(r.user_id) || { requests: 0, responses: 0 };
        existing.responses++;
        userActivityMap.set(r.user_id, existing);
      });
      const topActiveUsers = Array.from(userActivityMap.entries())
        .map(([userId, activity]) => {
          const profile = profileMap.get(userId);
          return {
            name: profile?.full_name || profile?.email || "Usuario",
            requests: activity.requests,
            responses: activity.responses,
            total: activity.requests + activity.responses,
          };
        })
        .sort((a, b) => b.total - a.total)
        .slice(0, 10);

      // Institution distribution
      const institutionMap = new Map<string, number>();
      profiles.forEach((p) => {
        if (p.institution) {
          institutionMap.set(p.institution, (institutionMap.get(p.institution) || 0) + 1);
        }
      });
      const institutionDistribution = Array.from(institutionMap.entries())
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 10);

      // ========== POINTS ECONOMY ==========
      
      const totalPointsDistributed = profiles.reduce((sum, p) => sum + (p.points || 0), 0);
      const avgPointsPerUser = profiles.length > 0 ? totalPointsDistributed / profiles.length : 0;

      // Points flow (estimate based on activity)
      const pointsFlowMap = new Map<string, { earned: number; spent: number }>();
      for (let i = 5; i >= 0; i--) {
        const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        pointsFlowMap.set(key, { earned: 0, spent: 0 });
      }
      
      // Points spent on solicitudes
      solicitudes.forEach((s) => {
        const date = new Date(s.created_at);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        if (pointsFlowMap.has(key)) {
          const existing = pointsFlowMap.get(key)!;
          existing.spent += s.is_urgent ? 10 : 5;
          pointsFlowMap.set(key, existing);
        }
      });
      
      // Points earned from best answers
      respuestas?.filter((r) => r.is_best_answer).forEach((r) => {
        const date = new Date(r.created_at);
        const key = date.toLocaleDateString("es-ES", { month: "short", year: "2-digit" });
        if (pointsFlowMap.has(key)) {
          const existing = pointsFlowMap.get(key)!;
          existing.earned += 20;
          pointsFlowMap.set(key, existing);
        }
      });
      
      const pointsFlow = Array.from(pointsFlowMap.entries()).map(([month, flow]) => ({
        month,
        earned: flow.earned,
        spent: flow.spent,
      }));

      // ========== EXTRA ANALYSIS ==========
      
      // Heatmap data
      const heatmapDataMap = new Map<string, number>();
      solicitudes.forEach((s) => {
        const date = new Date(s.created_at);
        const day = DAY_NAMES[date.getDay()];
        const hour = date.getHours();
        const key = `${day}-${hour}`;
        heatmapDataMap.set(key, (heatmapDataMap.get(key) || 0) + 1);
      });
      const heatmapData: { day: string; hour: number; count: number }[] = [];
      DAY_NAMES.forEach((day) => {
        for (let hour = 0; hour < 24; hour++) {
          heatmapData.push({
            day,
            hour,
            count: heatmapDataMap.get(`${day}-${hour}`) || 0,
          });
        }
      });

      // Urgent analysis
      const urgentSolicitudes = solicitudes.filter((s) => s.is_urgent);
      const normalSolicitudes = solicitudes.filter((s) => !s.is_urgent);
      const urgentResolved = urgentSolicitudes.filter((s) => s.is_resolved).length;
      const normalResolved = normalSolicitudes.filter((s) => s.is_resolved).length;
      
      const urgentAnalysis = {
        urgentCount: urgentSolicitudes.length,
        normalCount: normalSolicitudes.length,
        urgentResolutionRate: urgentSolicitudes.length > 0 ? (urgentResolved / urgentSolicitudes.length) * 100 : 0,
        normalResolutionRate: normalSolicitudes.length > 0 ? (normalResolved / normalSolicitudes.length) * 100 : 0,
      };

      // DOI analysis
      const withDoi = solicitudes.filter((s) => s.doi && s.doi.trim() !== "").length;
      const doiAnalysis = {
        withDoi,
        withoutDoi: solicitudes.length - withDoi,
      };

      // Average comments per request
      const commentsCount = comentarios?.length || 0;
      const avgCommentsPerRequest = solicitudes.length > 0 ? commentsCount / solicitudes.length : 0;

      setData({
        // Existing
        categoryCounts,
        countryCounts,
        hourlyDistribution,
        dailyDistribution,
        journalCounts,
        monthlyTrend,
        // Performance
        resolutionRate,
        avgResponseTime,
        avgResponsesPerRequest,
        bestAnswerRate,
        totalResolved,
        totalPending,
        // Users
        levelDistribution,
        userGrowth,
        topActiveUsers,
        institutionDistribution,
        // Points
        totalPointsDistributed,
        avgPointsPerUser,
        pointsFlow,
        // Extra
        heatmapData,
        urgentAnalysis,
        doiAnalysis,
        avgCommentsPerRequest,
      });
    } catch (error) {
      console.error("Error fetching analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  return { loading, data };
}
