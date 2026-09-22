import { useEffect, useRef, useState } from "react";
import { useDebouncedValue } from "./useDebouncedValue";
import { PlaceResult, NoResultsError, searchPlaces } from "@/lib/places";

export type SearchStatus = "idle" | "loading" | "success" | "empty" | "error";

interface UsePlaceSearchResult {
  status: SearchStatus;
  results: PlaceResult[];
  errorMessage: string | null;
}

const DEBOUNCE_MS = 300;
const MIN_QUERY_LENGTH = 2;

// Stable reference so the "not eligible to search yet" return value doesn't
// create a new array identity on every render (which would otherwise defeat
// the caller's `results !== prevResults` render-time comparison).
const EMPTY_RESULTS: PlaceResult[] = [];

export function usePlaceSearch(rawQuery: string): UsePlaceSearchResult {
  const query = rawQuery.trim();
  const debouncedQuery = useDebouncedValue(query, DEBOUNCE_MS);
  const isEligible = debouncedQuery.length >= MIN_QUERY_LENGTH;

  const [status, setStatus] = useState<SearchStatus>("idle");
  const [results, setResults] = useState<PlaceResult[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const latestRequestId = useRef(0);
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current?.abort();

    if (!isEligible) {
      return;
    }

    const requestId = ++latestRequestId.current;
    const controller = new AbortController();
    abortControllerRef.current = controller;

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setStatus("loading");
    setErrorMessage(null);

    searchPlaces(debouncedQuery, controller.signal)
      .then((data) => {
        if (requestId !== latestRequestId.current) return;
        setResults(data);
        setStatus("success");
      })
      .catch((err: unknown) => {
        if (requestId !== latestRequestId.current) return;
        if (err instanceof DOMException && err.name === "AbortError") return;
        if (err instanceof NoResultsError) {
          setResults([]);
          setStatus("empty");
          return;
        }
        setResults([]);
        setStatus("error");
        setErrorMessage(
          err instanceof Error ? err.message : "Something went wrong",
        );
      });

    return () => controller.abort();
  }, [debouncedQuery, isEligible]);

  if (!isEligible) {
    return { status: "idle", results: EMPTY_RESULTS, errorMessage: null };
  }

  return { status, results, errorMessage };
}
