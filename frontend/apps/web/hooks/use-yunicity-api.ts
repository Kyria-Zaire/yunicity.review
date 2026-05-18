"use client";

import { useAuth } from "@/lib/auth/auth-provider";

export function useYunicityApi() {
  return useAuth().yunicityApi;
}
