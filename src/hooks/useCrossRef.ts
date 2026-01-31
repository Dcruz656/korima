import { useState } from "react";

export interface CrossRefResult {
  title: string;
  authors?: string;
  year?: string;
  doi?: string;
  journal?: string;
  publisher?: string;
  subjects?: string[];
  abstract?: string;
}

interface CrossRefWork {
  DOI?: string;
  title?: string[];
  author?: { given?: string; family?: string }[];
  published?: { "date-parts"?: number[][] };
  "container-title"?: string[];
  publisher?: string;
  type?: string;
  abstract?: string;
  subject?: string[];
}

interface CrossRefResponse {
  message: {
    items?: CrossRefWork[];
    DOI?: string;
    title?: string[];
    author?: { given?: string; family?: string }[];
    published?: { "date-parts"?: number[][] };
    "container-title"?: string[];
    publisher?: string;
    type?: string;
    abstract?: string;
    subject?: string[];
  };
}

export const useCrossRef = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<CrossRefResult[] | null>(null);

  const formatAuthors = (authors?: { given?: string; family?: string }[]): string => {
    if (!authors || authors.length === 0) return "";
    
    const formattedAuthors = authors
      .slice(0, 3)
      .map((author) => {
        const given = author.given || "";
        const family = author.family || "";
        return `${given} ${family}`.trim();
      })
      .filter((name) => name.length > 0);

    if (authors.length > 3) {
      return `${formattedAuthors.join(", ")} et al.`;
    }
    
    return formattedAuthors.join(", ");
  };

  const formatWork = (work: CrossRefWork): CrossRefResult => {
    return {
      title: work.title?.[0] || "Sin título",
      authors: formatAuthors(work.author),
      year: work.published?.["date-parts"]?.[0]?.[0]?.toString() || undefined,
      doi: work.DOI || undefined,
      journal: work["container-title"]?.[0] || undefined,
      publisher: work.publisher || undefined,
      subjects: work.subject || undefined,
      abstract: work.abstract || undefined,
    };
  };

  const searchByTitle = async (query: string) => {
    if (!query.trim()) {
      setError("Por favor ingresa un título");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      const response = await fetch(
        `https://api.crossref.org/works?query.title=${encodeURIComponent(query)}&rows=10&select=DOI,title,author,published,container-title,publisher,subject,abstract`,
        {
          headers: {
            "User-Agent": "Korima/1.0 (mailto:contact@korima.app)",
          },
        }
      );

      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: CrossRefResponse = await response.json();
      
      if (data.message.items && data.message.items.length > 0) {
        const formattedResults = data.message.items.map(formatWork);
        setResults(formattedResults);
      } else {
        setResults([]);
        setError("No se encontraron resultados");
      }
    } catch (err) {
      console.error("CrossRef error:", err);
      setError(err instanceof Error ? err.message : "Error al conectar con CrossRef");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const searchByDOI = async (doi: string) => {
    if (!doi.trim()) {
      setError("Por favor ingresa un DOI");
      return;
    }

    setIsLoading(true);
    setError(null);
    setResults(null);

    try {
      // Clean DOI
      let cleanDOI = doi.trim();
      if (cleanDOI.includes("doi.org/")) {
        cleanDOI = cleanDOI.split("doi.org/")[1];
      }
      if (!cleanDOI.startsWith("10.")) {
        throw new Error("DOI inválido. Debe comenzar con 10.");
      }

      const response = await fetch(
        `https://api.crossref.org/works/${encodeURIComponent(cleanDOI)}`,
        {
          headers: {
            "User-Agent": "Korima/1.0 (mailto:contact@korima.app)",
          },
        }
      );

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error("DOI no encontrado");
        }
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      const data: CrossRefResponse = await response.json();
      
      if (data.message) {
        const work: CrossRefWork = {
          DOI: data.message.DOI,
          title: data.message.title,
          author: data.message.author,
          published: data.message.published,
          "container-title": data.message["container-title"],
          publisher: data.message.publisher,
          type: data.message.type,
          abstract: data.message.abstract,
          subject: data.message.subject,
        };
        
        setResults([formatWork(work)]);
      } else {
        setResults([]);
        setError("No se encontró información para este DOI");
      }
    } catch (err) {
      console.error("CrossRef DOI error:", err);
      setError(err instanceof Error ? err.message : "Error al buscar el DOI");
      setResults([]);
    } finally {
      setIsLoading(false);
    }
  };

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return {
    isLoading,
    error,
    results,
    searchByTitle,
    searchByDOI,
    clearResults,
  };
};
