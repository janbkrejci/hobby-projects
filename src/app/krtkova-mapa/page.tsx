"use client";

import Link from "next/link";
import dynamic from "next/dynamic";
import { Database } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle } from "@/components/ui/card";

const MapView = dynamic(() => import("./components/MapView"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-muted-foreground">
      Načítám mapu…
    </div>
  ),
});

export default function KrtkovaMapaPage() {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <Card className="relative z-10 mx-auto w-full max-w-6xl rounded-none border-x-0 border-t-0 bg-transparent">
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
          <div>
            <CardTitle>Mapa památných míst</CardTitle>
            <p className="text-sm text-muted-foreground">
              Přehled lokalit uložených v databázi Krtkovy mapy.
            </p>
          </div>
          <Button asChild className="w-full md:w-auto">
            <Link href="/krtkova-mapa/crud">
              <Database className="mr-2 h-4 w-4" />
              Spravovat data
            </Link>
          </Button>
        </CardHeader>
      </Card>
      <div className="relative z-0 h-[calc(100vh-120px)] w-full">
        <MapView />
      </div>
    </div>
  );
}
