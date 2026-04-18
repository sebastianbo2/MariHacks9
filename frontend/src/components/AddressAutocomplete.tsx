import { useState, useEffect, useRef } from "react";

interface Suggestion {
  label: string;
  lat: number;
  lon: number;
}

interface AddressAutocompleteProps {
  onSelect: (result: { address: string; lat: number; lon: number }) => void;
  placeholder?: string;
}

// Montreal/Laval/Longueuil bounding box (min_lon, min_lat, max_lon, max_lat)
const MONTREAL_VIEWBOX = "-74.2,45.3,-73.3,45.8";

export default function AddressAutocomplete({
  onSelect,
  placeholder = "Enter your address...",
}: AddressAutocompleteProps) {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [isOpen, setIsOpen] = useState(false);
  const [selected, setSelected] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch suggestions with debounce
  useEffect(() => {
    if (query.length < 3 || selected) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          q: `${query}, Quebec, Canada`,
          format: "json",
          limit: "6",
          addressdetails: "1",
          viewbox: MONTREAL_VIEWBOX,
          bounded: "1",
        });
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?${params}`,
          { headers: { "User-Agent": "my-supermarket-app/1.0" } }
        );
        const data = await res.json();

        const results: Suggestion[] = data.map((item: any) => ({
          label: [
            item.address?.house_number,
            item.address?.road,
            item.address?.city ?? item.address?.town ?? item.address?.village ?? item.address?.suburb,
          ]
            .filter(Boolean)
            .join(", "),
          lat: parseFloat(item.lat),
          lon: parseFloat(item.lon),
        }));

        // Deduplicate by label
        const seen = new Set<string>();
        const unique = results.filter((r) => {
          if (seen.has(r.label)) return false;
          seen.add(r.label);
          return true;
        });

        setSuggestions(unique);
        setIsOpen(unique.length > 0);
        setActiveIndex(-1);
      } catch (err) {
        console.error("Autocomplete error:", err);
      } finally {
        setLoading(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (s: Suggestion) => {
    setQuery(s.label);
    setSuggestions([]);
    setIsOpen(false);
    setActiveIndex(-1);
    setSelected(true);
    onSelect({ address: s.label, lat: s.lat, lon: s.lon });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIndex((i) => Math.min(i + 1, suggestions.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIndex((i) => Math.max(i - 1, -1));
    } else if (e.key === "Enter" && activeIndex >= 0) {
      e.preventDefault();
      handleSelect(suggestions[activeIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500&display=swap');

        .aac-wrapper {
          position: relative;
          width: 100%;
          max-width: 520px;
          font-family: 'DM Sans', sans-serif;
        }

        .aac-input-row {
          display: flex;
          align-items: center;
          background: #fff;
          border: 1.5px solid #e0e0e0;
          border-radius: 12px;
          padding: 0 14px;
          gap: 10px;
          transition: border-color 0.15s, box-shadow 0.15s;
        }

        .aac-input-row:focus-within {
          border-color: #2563eb;
          box-shadow: 0 0 0 3px rgba(37,99,235,0.12);
        }

        .aac-icon {
          color: #9ca3af;
          flex-shrink: 0;
          transition: color 0.15s;
        }

        .aac-input-row:focus-within .aac-icon {
          color: #2563eb;
        }

        .aac-input {
          flex: 1;
          border: none;
          outline: none;
          font-size: 15px;
          font-family: inherit;
          color: #111827;
          background: transparent;
          padding: 13px 0;
        }

        .aac-input::placeholder {
          color: #b0b7c3;
        }

        .aac-spinner {
          width: 16px;
          height: 16px;
          border: 2px solid #e5e7eb;
          border-top-color: #2563eb;
          border-radius: 50%;
          animation: aac-spin 0.6s linear infinite;
          flex-shrink: 0;
        }

        @keyframes aac-spin {
          to { transform: rotate(360deg); }
        }

        .aac-clear {
          background: none;
          border: none;
          cursor: pointer;
          color: #9ca3af;
          padding: 0;
          display: flex;
          align-items: center;
          transition: color 0.15s;
          flex-shrink: 0;
        }

        .aac-clear:hover { color: #374151; }

        .aac-dropdown {
          position: absolute;
          top: calc(100% + 6px);
          left: 0;
          right: 0;
          background: #fff;
          border: 1.5px solid #e5e7eb;
          border-radius: 12px;
          box-shadow: 0 8px 24px rgba(0,0,0,0.10);
          overflow: hidden;
          z-index: 1000;
          animation: aac-fade 0.12s ease;
        }

        @keyframes aac-fade {
          from { opacity: 0; transform: translateY(-4px); }
          to   { opacity: 1; transform: translateY(0); }
        }

        .aac-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 11px 14px;
          cursor: pointer;
          transition: background 0.1s;
          border-bottom: 1px solid #f3f4f6;
        }

        .aac-item:last-child { border-bottom: none; }

        .aac-item:hover,
        .aac-item.active {
          background: #eff6ff;
        }

        .aac-item-icon {
          color: #9ca3af;
          flex-shrink: 0;
          transition: color 0.1s;
        }

        .aac-item:hover .aac-item-icon,
        .aac-item.active .aac-item-icon {
          color: #2563eb;
        }

        .aac-item-label {
          font-size: 14px;
          color: #1f2937;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .aac-footer {
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 4px;
          padding: 6px 14px;
          background: #f9fafb;
          border-top: 1px solid #f3f4f6;
          font-size: 11px;
          color: #9ca3af;
        }
      `}</style>

      <div className="aac-wrapper" ref={containerRef}>
        <div className="aac-input-row">
          {/* Pin icon */}
          <svg className="aac-icon" width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
            <circle cx="12" cy="10" r="3"/>
          </svg>

          <input
            ref={inputRef}
            className="aac-input"
            value={query}
            onChange={(e) => { setQuery(e.target.value); setSelected(false); }}
            onKeyDown={handleKeyDown}
            onFocus={() => suggestions.length > 0 && setIsOpen(true)}
            placeholder={placeholder}
            autoComplete="off"
            spellCheck={false}
          />

          {loading && <div className="aac-spinner" />}

          {query && !loading && (
            <button
              className="aac-clear"
              onClick={() => { setQuery(""); setSuggestions([]); setIsOpen(false); setSelected(false); inputRef.current?.focus(); }}
              tabIndex={-1}
              aria-label="Clear"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
              </svg>
            </button>
          )}
        </div>

        {isOpen && suggestions.length > 0 && (
          <div className="aac-dropdown" role="listbox">
            {suggestions.map((s, i) => (
              <div
                key={i}
                className={`aac-item${i === activeIndex ? " active" : ""}`}
                role="option"
                aria-selected={i === activeIndex}
                onMouseDown={(e) => { e.preventDefault(); handleSelect(s); }}
                onMouseEnter={() => setActiveIndex(i)}
              >
                <svg className="aac-item-icon" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                  <circle cx="12" cy="10" r="3"/>
                </svg>
                <span className="aac-item-label">{s.label}</span>
              </div>
            ))}
            <div className="aac-footer">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/></svg>
              Powered by OpenStreetMap
            </div>
          </div>
        )}
      </div>
    </>
  );
}