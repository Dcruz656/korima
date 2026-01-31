import { useState, useEffect } from "react";

interface OpenAccessInfo {
  isOpenAccess: boolean;
  pdfUrl: string | null;
  version: string | null;
  source: string | null;
  loading: boolean;
}

export function useOpenAccessCheck(doi: string | null | undefined): OpenAccessInfo {
  const [info, setInfo] = useState<OpenAccessInfo>({
    isOpenAccess: false,
    pdfUrl: null,
    version: null,
    source: null,
    loading: false,
  });

  useEffect(() => {
    if (!doi) {
      setInfo({
        isOpenAccess: false,
        pdfUrl: null,
        version: null,
        source: null,
        loading: false,
      });
      return;
    }

    let cancelled = false;

    const checkOpenAccess = async () => {
      if (cancelled) return;
      
      setInfo(prev => ({ ...prev, loading: true }));

      try {
        // Limpiar el DOI
        let cleanDoi = doi.trim();
        cleanDoi = cleanDoi.replace(/^(https?:\/\/)?(dx\.)?doi\.org\//, '');
        
        console.log('[OpenAccess] Checking DOI:', cleanDoi);
        
        // Llamar a Unpaywall API con timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 segundos timeout
        
        const response = await fetch(
          `https://api.unpaywall.org/v2/${encodeURIComponent(cleanDoi)}?email=contact@korima.app`,
          {
            headers: {
              'Accept': 'application/json'
            },
            signal: controller.signal
          }
        );

        clearTimeout(timeoutId);

        if (cancelled) return;

        console.log('[OpenAccess] Response status:', response.status);

        if (!response.ok) {
          if (response.status === 404) {
            console.log('[OpenAccess] ❌ DOI not found in Unpaywall');
          } else {
            console.error('[OpenAccess] Error:', response.status, response.statusText);
          }
          
          if (cancelled) return;
          
          setInfo({
            isOpenAccess: false,
            pdfUrl: null,
            version: null,
            source: null,
            loading: false,
          });
          return;
        }

        const data = await response.json();
        
        if (cancelled) return;

        console.log('[OpenAccess] Full response:', data);
        console.log('[OpenAccess] is_oa:', data.is_oa);
        console.log('[OpenAccess] best_oa_location:', data.best_oa_location);

        // Verificar si es Open Access
        if (data.is_oa && data.best_oa_location) {
          const oaLocation = data.best_oa_location;
          const pdfUrl = oaLocation.url_for_pdf || oaLocation.url;
          
          console.log('[OpenAccess] ✅ Open Access found!');
          console.log('[OpenAccess] PDF URL:', pdfUrl);
          console.log('[OpenAccess] Version:', oaLocation.version);
          console.log('[OpenAccess] Host type:', oaLocation.host_type);

          if (cancelled) return;

          setInfo({
            isOpenAccess: true,
            pdfUrl: pdfUrl,
            version: oaLocation.version || 'publishedVersion',
            source: oaLocation.host_type || 'publisher',
            loading: false,
          });
        } else {
          console.log('[OpenAccess] ❌ Not Open Access (is_oa:', data.is_oa, ')');
          
          if (cancelled) return;
          
          setInfo({
            isOpenAccess: false,
            pdfUrl: null,
            version: null,
            source: null,
            loading: false,
          });
        }
      } catch (error: any) {
        if (error.name === 'AbortError') {
          console.error('[OpenAccess] Request timeout');
        } else {
          console.error('[OpenAccess] Error:', error);
        }
        
        if (cancelled) return;
        
        setInfo({
          isOpenAccess: false,
          pdfUrl: null,
          version: null,
          source: null,
          loading: false,
        });
      }
    };

    // Ejecutar inmediatamente
    checkOpenAccess();
    
    return () => {
      cancelled = true;
    };
  }, [doi]);

  return info;
}
