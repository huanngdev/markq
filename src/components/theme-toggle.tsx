"use client";

import { Moon, Sun } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { useThemeToggle } from "@/features/theme/hooks/use-theme-toggle";

export function ThemeToggle() {
  const { toggleTheme } = useThemeToggle();

  return (
    <Tooltip>
      <TooltipTrigger
        render={(
          <Button
            type="button"
            variant="outline"
            size="icon-lg"
            aria-label="Toggle color theme"
            onClick={toggleTheme}
          >
            <Sun className="rotate-0 scale-100 transition-transform dark:-rotate-90 dark:scale-0" aria-hidden="true" />
            <Moon className="absolute rotate-90 scale-0 transition-transform dark:rotate-0 dark:scale-100" aria-hidden="true" />
          </Button>
        )}
      />
      <TooltipContent>Toggle theme <Kbd>⌥T</Kbd></TooltipContent>
    </Tooltip>
  );
}
