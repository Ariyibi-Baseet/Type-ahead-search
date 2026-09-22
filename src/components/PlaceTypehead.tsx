"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { usePlaceSearch } from "@/hooks/usePlaceSearch";
import { PlaceResult } from "@/lib/places";

function formatLocation(option: PlaceResult): string {
  return [option.admin1, option.country].filter(Boolean).join(", ");
}

export default function PlaceTypeahead() {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [highlightedIndex, setHighlightedIndex] = useState(-1);
  const [selected, setSelected] = useState<PlaceResult | null>(null);

  const { status, results, errorMessage } = usePlaceSearch(query);
  const listboxId = "place-listbox";
  const inputRef = useRef<HTMLInputElement>(null);
  const optionRefs = useRef<Array<HTMLLIElement | null>>([]);

  useEffect(() => {
    if (highlightedIndex < 0) return;
    optionRefs.current[highlightedIndex]?.scrollIntoView({ block: "nearest" });
  }, [highlightedIndex]);

  const [prevResults, setPrevResults] = useState(results);
  if (results !== prevResults) {
    setPrevResults(results);
    setHighlightedIndex(results.length > 0 ? 0 : -1);
  }

  const showListbox = isOpen && query.trim().length >= 2;

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setQuery(e.target.value);
    setSelected(null);
    setIsOpen(true);
  }

  function selectOption(option: PlaceResult) {
    setSelected(option);
    setQuery(option.name);
    setIsOpen(false);
    setHighlightedIndex(-1);
    inputRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!showListbox || results.length === 0) {
      if (e.key === "ArrowDown" && query.trim().length >= 2) setIsOpen(true);
      return;
    }

    switch (e.key) {
      case "ArrowDown":
        e.preventDefault();
        setHighlightedIndex((prev) => (prev + 1) % results.length);
        break;
      case "ArrowUp":
        e.preventDefault();
        setHighlightedIndex(
          (prev) => (prev - 1 + results.length) % results.length,
        );
        break;
      case "Enter":
        e.preventDefault();
        if (highlightedIndex >= 0) selectOption(results[highlightedIndex]);
        break;
      case "Escape":
        e.preventDefault();
        setIsOpen(false);
        break;
      case "Home":
        e.preventDefault();
        setHighlightedIndex(0);
        break;
      case "End":
        e.preventDefault();
        setHighlightedIndex(results.length - 1);
        break;
      default:
        break;
    }
  }

  const activeDescendant = useMemo(
    () =>
      highlightedIndex >= 0 ? `place-option-${highlightedIndex}` : undefined,
    [highlightedIndex],
  );

  return (
    <div className="w-full max-w-md">
      <label
        htmlFor="place-input"
        className="mb-2 block text-sm font-medium text-zinc-700"
      >
        Search for a city
      </label>

      <div className="relative">
        <input
          id="place-input"
          ref={inputRef}
          type="text"
          role="combobox"
          aria-expanded={showListbox}
          aria-controls={listboxId}
          aria-autocomplete="list"
          aria-activedescendant={activeDescendant}
          autoComplete="off"
          placeholder="Type a city name (e.g. lagos, paris, tokyo)…"
          className="text-black w-full rounded-lg border border-zinc-300 px-4 py-2.5 text-base shadow-sm outline-none focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onFocus={() => query.trim().length >= 2 && setIsOpen(true)}
          onBlur={() => setTimeout(() => setIsOpen(false), 100)}
        />

        {status === "loading" && showListbox && (
          <span
            className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-zinc-400"
            aria-hidden="true"
          >
            Loading…
          </span>
        )}

        {showListbox && (
          <ul
            id={listboxId}
            role="listbox"
            aria-label="City suggestions"
            className="absolute z-10 mt-1 max-h-72 w-full overflow-auto rounded-lg border border-zinc-200 bg-white shadow-lg"
          >
            {status === "loading" && (
              <li className="px-4 py-3 text-sm text-zinc-500" role="status">
                Searching…
              </li>
            )}

            {status === "error" && (
              <li className="px-4 py-3 text-sm text-red-600" role="alert">
                {errorMessage ?? "Something went wrong. Please try again."}
              </li>
            )}

            {status === "empty" && (
              <li className="px-4 py-3 text-sm text-zinc-500" role="status">
                No places match &ldquo;{query}&rdquo;.
              </li>
            )}

            {status === "success" &&
              results.map((option, index) => (
                <li
                  key={option.id}
                  id={`place-option-${index}`}
                  ref={(el) => {
                    optionRefs.current[index] = el;
                  }}
                  role="option"
                  aria-selected={index === highlightedIndex}
                  className={`flex cursor-pointer items-center gap-3 px-4 py-2.5 text-sm ${
                    index === highlightedIndex ? "bg-zinc-100" : "bg-white"
                  }`}
                  onMouseDown={(e) => e.preventDefault()}
                  onMouseEnter={() => setHighlightedIndex(index)}
                  onClick={() => selectOption(option)}
                >
                  <span className="flex-1">
                    <span className="font-medium text-zinc-900">
                      {option.name}
                    </span>
                    <span className="ml-2 text-zinc-500">
                      {formatLocation(option)}
                    </span>
                  </span>
                  {option.population && (
                    <span className="text-xs text-zinc-400">
                      pop. {option.population.toLocaleString()}
                    </span>
                  )}
                </li>
              ))}
          </ul>
        )}
      </div>

      {selected && (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm">
          <p className="font-medium text-zinc-900">{selected.name}</p>
          <p className="text-zinc-500">
            {formatLocation(selected)} · {selected.latitude.toFixed(2)},{" "}
            {selected.longitude.toFixed(2)}
          </p>
        </div>
      )}
    </div>
  );
}
