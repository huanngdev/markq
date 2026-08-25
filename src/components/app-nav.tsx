import { BarChart3, ClipboardList, Library } from "lucide-react";
import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const items = [
  { id: "quizzes", href: "/", label: "Quizzes", icon: Library },
  { id: "analytics", href: "/analytics", label: "Analytics", icon: BarChart3 },
  { id: "history", href: "/attempts", label: "History", icon: ClipboardList },
] as const;

export function AppNav({ active }: { active: (typeof items)[number]["id"] }) {
  return (
    <nav aria-label="Primary navigation" className="flex flex-wrap gap-1 rounded-lg bg-muted p-1">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = item.id === active;
        return (
          <Link
            key={item.id}
            href={item.href}
            aria-current={isActive ? "page" : undefined}
            className={cn(buttonVariants({ variant: isActive ? "secondary" : "ghost", size: "sm" }), "gap-1.5")}
          >
            <Icon className="size-4" aria-hidden="true" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
