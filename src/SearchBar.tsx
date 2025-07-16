import { useState, useEffect } from "react";
import { useQuery } from "convex/react";
import { api } from "../convex/_generated/api";

interface SearchBarProps {
  onSearchResults: (results: any[]) => void;
  onClearSearch: () => void;
}

export function SearchBar({ onSearchResults, onClearSearch }: SearchBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState("");

  // Debounce search term to avoid too many API calls
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchTerm]);

  const searchResults = useQuery(
    api.images.searchImages,
    debouncedSearchTerm.trim() ? { searchTerm: debouncedSearchTerm } : "skip"
  );

  useEffect(() => {
    if (debouncedSearchTerm.trim() && searchResults) {
      onSearchResults(searchResults);
    } else if (!debouncedSearchTerm.trim()) {
      onClearSearch();
    }
  }, [searchResults, debouncedSearchTerm, onSearchResults, onClearSearch]);

  const handleClear = () => {
    setSearchTerm("");
    setDebouncedSearchTerm("");
    onClearSearch();
  };

  return (
    <div className="search-container">
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Rechercher de services..."
          className="search-input"
        />
        <svg
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
          strokeWidth={1.5}
          stroke="currentColor"
          className="absolute left-2 sm:left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 sm:w-5 sm:h-5 text-muted-foreground"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="m21 21-5.197-5.197m0 0A7.5 7.5 0 1 0 5.196 5.196a7.5 7.5 0 0 0 10.607 10.607Z"
          />
        </svg>
        {searchTerm && (
          <button
            onClick={handleClear}
            className="absolute right-2 sm:right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 focus-visible"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className="w-4 h-4 sm:w-5 sm:h-5"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M6 18 18 6M6 6l12 12"
              />
            </svg>
          </button>
        )}
      </div>
      {debouncedSearchTerm.trim() && searchResults !== undefined && (
        <div className="absolute top-full left-0 right-0 mt-1 text-xs sm:text-sm text-muted-foreground text-center bg-background/90 backdrop-blur-sm rounded-md py-1 px-2">
          {searchResults.length === 0 
            ? "Aucun résultat trouvé" 
            : `${searchResults.length} résultat${searchResults.length > 1 ? 's' : ''} trouvé${searchResults.length > 1 ? 's' : ''}`
          }
        </div>
      )}
    </div>
  );
}
