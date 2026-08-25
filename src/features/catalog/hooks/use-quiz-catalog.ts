"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export type CatalogTab = "available" | "completed";

export function useQuizCatalog(initialTab: CatalogTab) {
  const router = useRouter();
  const [tab, setTab] = useState(initialTab);

  function changeTab(value: string) {
    const nextTab = value === "completed" ? "completed" : "available";
    setTab(nextTab);
    router.replace(nextTab === "completed" ? "/?status=completed" : "/", { scroll: false });
  }

  return { tab, changeTab };
}
