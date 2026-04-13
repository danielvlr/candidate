import { useState, useEffect, useCallback, useRef } from 'react';

interface UseInfiniteScrollOptions<T> {
  fetchFn: (page: number) => Promise<{ content: T[]; totalElements: number; totalPages: number }>;
  pageSize?: number;
  deps?: any[];
}

interface UseInfiniteScrollResult<T> {
  items: T[];
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
  totalElements: number;
  hasMore: boolean;
  sentinelRef: (node: HTMLDivElement | null) => void;
  reset: () => void;
}

export function useInfiniteScroll<T>({ fetchFn, pageSize = 20, deps = [] }: UseInfiniteScrollOptions<T>): UseInfiniteScrollResult<T> {
  const [items, setItems] = useState<T[]>([]);
  const [page, setPage] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalElements, setTotalElements] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const fetchingRef = useRef(false);

  const hasMore = page + 1 < totalPages;

  const loadPage = useCallback(async (pageNum: number, append: boolean) => {
    if (fetchingRef.current) return;
    fetchingRef.current = true;

    try {
      if (append) setLoadingMore(true);
      else setLoading(true);
      setError(null);

      const result = await fetchFn(pageNum);
      setTotalElements(result.totalElements);
      setTotalPages(result.totalPages);

      if (append) {
        setItems(prev => [...prev, ...result.content]);
      } else {
        setItems(result.content);
      }
      setPage(pageNum);
    } catch (err) {
      setError('Erro ao carregar dados');
    } finally {
      setLoading(false);
      setLoadingMore(false);
      fetchingRef.current = false;
    }
  }, [fetchFn]);

  // Reset when deps change
  useEffect(() => {
    setItems([]);
    setPage(0);
    setTotalPages(0);
    setTotalElements(0);
    loadPage(0, false);
  }, [...deps]);

  // Load next page
  const loadNext = useCallback(() => {
    if (hasMore && !fetchingRef.current) {
      loadPage(page + 1, true);
    }
  }, [hasMore, page, loadPage]);

  // Sentinel ref for intersection observer
  const sentinelRef = useCallback((node: HTMLDivElement | null) => {
    if (observerRef.current) observerRef.current.disconnect();
    if (!node) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          loadNext();
        }
      },
      { rootMargin: '200px' }
    );
    observerRef.current.observe(node);
  }, [loadNext]);

  const reset = useCallback(() => {
    setItems([]);
    setPage(0);
    loadPage(0, false);
  }, [loadPage]);

  return { items, loading, loadingMore, error, totalElements, hasMore, sentinelRef, reset };
}
