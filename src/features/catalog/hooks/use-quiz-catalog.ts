"use client";

import { useRouter } from "next/navigation";

import { catalogHref, catalogTabFrom, type CatalogTab } from "@/features/catalog/navigation";

export function useQuizCatalog(initialTab: CatalogTab) {
  const router = useRouter();

  function changeTab(value: string) {
    router.replace(catalogHref(catalogTabFrom(value)), { scroll: false });
  }

  return { tab: initialTab, changeTab };
}
