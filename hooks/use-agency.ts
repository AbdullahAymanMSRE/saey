"use client"

import { useQuery } from "@tanstack/react-query"

import type { Agency, AgencyLink } from "@/db/schema"
import { api } from "@/lib/api"

export type AgencyProfile = {
  agency: Agency
  links: AgencyLink[]
  /** Published cars that would drop to drafts if English were switched on. */
  wouldDemote: number
}

export function useAgency() {
  return useQuery({
    queryKey: ["agency-profile"],
    queryFn: () => api<AgencyProfile>("/api/agency/profile"),
  })
}
