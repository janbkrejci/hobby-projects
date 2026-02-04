"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home } from "lucide-react";

import { Button } from "@/components/ui/button";

export function HomeFab() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  return (
    <Button
      asChild
      variant="outline"
      size="icon"
      className="fixed left-6 top-6 z-50 bg-card/70 text-muted-foreground shadow-sm backdrop-blur transition hover:-translate-y-0.5 hover:text-foreground hover:shadow-md"
    >
      <Link href="/" aria-label="Zpět na homepage">
        <Home className="h-5 w-5" />
      </Link>
    </Button>
  );
}
