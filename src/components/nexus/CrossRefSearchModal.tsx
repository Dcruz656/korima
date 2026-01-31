import { useState } from "react";
import { useCrossRef } from "@/hooks/useCrossRef";
import type { CrossRefResult } from "@/hooks/useCrossRef";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Search, FileText, Calendar, Users, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

interface CrossRefSearchModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSelect: (result: CrossRefResult) => void;
  initialQuery?: string;
}

export function CrossRefSearchModal({
  open,
  onOpenChange,
  onSelect,
  initialQuery = "",
}: CrossRefSearchModalProps) {
  const [query, setQuery] = useState(initialQuery);
  const [searchType, setSearchType] = useState<"title" | "doi">("title");
  const { isLoading, error, results, searchByDOI, searchByTitle, clearResults } = useCrossRef();

  const handleSearch = async () => {
    if (!query.trim()) return;

    if (searchType === "doi" || query.startsWith("10.") || query.includes("doi.org")) {
      await searchByDOI(query);
    } else {
      await searchByTitle(query);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const handleSelect = (result: CrossRefResult) => {
    onSelect(result);
    onOpenChange(false);
    setQuery("");
    clearResults();
  };

  const handleClose = () => {
    onOpenChange(false);
    setQuery("");
    clearResults();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Search className="w-5 h-5" />
            Buscar en CrossRef
          </DialogTitle>
          <DialogDescription>
            Busca documentos académicos por título o DOI para autocompletar los datos
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Search Type Toggle */}
          <div className="flex gap-2">
            <Button
              type="button"
              variant={searchType === "title" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("title")}
            >
              Por Título
            </Button>
            <Button
              type="button"
              variant={searchType === "doi" ? "default" : "outline"}
              size="sm"
              onClick={() => setSearchType("doi")}
            >
              Por DOI
            </Button>
          </div>

          {/* Search Input */}
          <div className="flex gap-2">
            <div className="flex-1">
              <Label htmlFor="crossref-query" className="sr-only">
                Buscar
              </Label>
              <Input
                id="crossref-query"
                placeholder={
                  searchType === "doi"
                    ? "Ej: 10.1000/xyz123 o https://doi.org/..."
                    : "Ej: Machine Learning Introduction"
                }
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
              />
            </div>
            <Button onClick={handleSearch} disabled={isLoading || !query.trim()}>
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Search className="w-4 h-4" />
              )}
            </Button>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-destructive text-center py-2">{error}</p>
          )}

          {/* Results */}
          <div className="overflow-y-auto max-h-[400px] space-y-2">
            {results && results.length === 0 && !isLoading && !error && (
              <p className="text-sm text-muted-foreground text-center py-8">
                {query ? "No se encontraron resultados" : "Ingresa un título o DOI para buscar"}
              </p>
            )}

            {results && results.map((result, index) => (
              <button
                key={index}
                onClick={() => handleSelect(result)}
                className={cn(
                  "w-full text-left p-4 rounded-lg border border-border",
                  "hover:bg-secondary hover:border-primary/50 transition-all",
                  "focus:outline-none focus:ring-2 focus:ring-primary"
                )}
              >
                <div className="space-y-2">
                  <h4 className="font-medium text-foreground line-clamp-2">
                    {result.title || "Sin título"}
                  </h4>
                  
                  <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                    {result.authors && (
                      <span className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span className="line-clamp-1 max-w-[200px]">{result.authors}</span>
                      </span>
                    )}
                    {result.year && (
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {result.year}
                      </span>
                    )}
                    {result.journal && (
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3 h-3" />
                        <span className="line-clamp-1 max-w-[150px]">{result.journal}</span>
                      </span>
                    )}
                  </div>

                  {result.doi && (
                    <p className="text-xs text-primary font-mono">
                      DOI: {result.doi}
                    </p>
                  )}
                </div>
              </button>
            ))}

            {isLoading && (
              <div className="flex justify-center py-8">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
