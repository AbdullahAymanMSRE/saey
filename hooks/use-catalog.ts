"use client"

import { useQuery } from "@tanstack/react-query"

import { api } from "@/lib/api"

export type CatalogModel = {
  id: string
  code: string
  nameAr: string
  nameEn: string
}

export type CatalogMake = CatalogModel & { models: CatalogModel[] }

/**
 * The whole catalog, fetched once and cached for the session. It is small
 * enough that the dependent make → model select can be instant rather than
 * firing a request every time someone picks a brand.
 */
export function useCatalog() {
  return useQuery({
    queryKey: ["catalog"],
    queryFn: () => api<{ makes: CatalogMake[] }>("/api/catalog"),
    staleTime: 30 * 60_000,
  })
}
