'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFetch<T>(url: string, options: { refreshInterval?: number } = {}) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher, {
    refreshInterval: options.refreshInterval,
  });
  return { data, error, isLoading, isError: !!error, mutate };
}
