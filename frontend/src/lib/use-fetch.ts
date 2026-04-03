'use client';

import useSWR from 'swr';

const fetcher = (url: string) => fetch(url).then((r) => r.json());

export function useFetch<T>(url: string) {
  const { data, error, isLoading, mutate } = useSWR<T>(url, fetcher);
  return { data, error, isLoading, isError: !!error, mutate };
}
