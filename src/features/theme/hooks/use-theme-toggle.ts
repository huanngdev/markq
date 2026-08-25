"use client";

import { useTheme } from "next-themes";
import { useEffect, useEffectEvent } from "react";

function isTypingTarget(target: EventTarget | null) {
  return target instanceof HTMLElement && (
    target.isContentEditable || target.matches("input, textarea, select")
  );
}

export function useThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  function toggleTheme() {
    setTheme(resolvedTheme === "dark" ? "light" : "dark");
  }

  const handleShortcut = useEffectEvent((event: KeyboardEvent) => {
    if (
      event.defaultPrevented ||
      !event.altKey ||
      event.ctrlKey ||
      event.metaKey ||
      event.key.toLowerCase() !== "t" ||
      isTypingTarget(event.target)
    ) return;
    event.preventDefault();
    toggleTheme();
  });

  useEffect(() => {
    window.addEventListener("keydown", handleShortcut);
    return () => window.removeEventListener("keydown", handleShortcut);
  }, []);

  return { toggleTheme };
}
