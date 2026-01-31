import { useState } from "react";
import { Search, Wand2, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface SearchBarProps {
  onSearch: (query: string) => void;
  onCrossRefLookup?: (query: string) => void;
  placeholder?: string;
}

export function SearchBar({
  onSearch,
  onCrossRefLookup,
  placeholder = "Buscar por título o DOI...",
}: SearchBarProps) {
  const [query, setQuery] = useState("");
  const [isFocused, setIsFocused] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      onSearch(query.trim());
    }
  };

  const handleClear = () => {
    setQuery("");
    onSearch("");
  };

  const isDOI = query.startsWith("10.") || query.includes("doi.org");

  return (
    <form onSubmit={handleSubmit} className="w-full">
      <div
        className={cn(
          "relative flex items-center gap-2 p-2 rounded-[2rem] bg-card border-2 transition-all duration-300",
          isFocused ? "border-primary shadow-nexus" : "border-border"
        )}
      >
        <div className="flex items-center gap-2 flex-1 pl-4">
          <Search className="w-5 h-5 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={placeholder}
            className="flex-1 bg-transparent outline-none text-foreground placeholder:text-muted-foreground font-medium"
          />
          {query && (
            <button
              type="button"
              onClick={handleClear}
              className="p-1 rounded-full hover:bg-secondary transition-colors"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          {isDOI && onCrossRefLookup && (
            <Button
              type="button"
              onClick={() => onCrossRefLookup(query)}
              variant="ghost"
              size="sm"
              className="rounded-full text-primary hover:bg-primary/10"
            >
              <Wand2 className="w-4 h-4 mr-1" />
              CrossRef
            </Button>
          )}
          <Button type="submit" className="rounded-full px-6">
            Buscar
          </Button>
        </div>
      </div>
    </form>
  );
}
