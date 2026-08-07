"use client";

import { useEffect, useRef, useState } from "react";
import { searchProducts, type ProductSearchResult } from "@/lib/product-search-client";

export default function ProductNameSearch({
  onSelect,
  className,
}: {
  onSelect: (product: ProductSearchResult) => void;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<ProductSearchResult[]>([]);
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const skipNextSearchRef = useRef(false);

  useEffect(() => {
    if (skipNextSearchRef.current) {
      skipNextSearchRef.current = false;
      return;
    }
    const q = query.trim();
    if (q === "") return;
    let cancelled = false;
    const timer = setTimeout(async () => {
      const r = await searchProducts(q);
      if (!cancelled) {
        setResults(r);
        setOpen(r.length > 0);
      }
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [query]);

  function handleQueryChange(value: string) {
    setQuery(value);
    if (value.trim() === "") {
      setResults([]);
      setOpen(false);
    }
  }

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className="relative">
      <input
        type="text"
        value={query}
        onChange={(e) => handleQueryChange(e.target.value)}
        onFocus={() => results.length > 0 && setOpen(true)}
        placeholder="商品名で検索（部分一致）"
        autoComplete="off"
        className={className}
      />
      {open && (
        <ul className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded-md border border-slate-300 bg-white py-1 shadow-lg">
          {results.map((p) => (
            <li key={`${p.makerCode}-${p.productCode}`}>
              <button
                type="button"
                onClick={() => {
                  onSelect(p);
                  skipNextSearchRef.current = true;
                  setQuery(p.productName);
                  setOpen(false);
                }}
                className="block w-full px-3 py-1.5 text-left text-sm hover:bg-slate-100"
              >
                <span className="font-medium text-slate-800">{p.productName}</span>
                <span className="ml-2 text-xs text-slate-400">
                  {p.makerCode} / {p.productCode}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
