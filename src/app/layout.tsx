import type { Metadata } from "next";
import "leaflet/dist/leaflet.css";
import "leaflet-defaulticon-compatibility/dist/leaflet-defaulticon-compatibility.css";
import "./globals.css";

import { ModeToggle } from "@/components/mode-toggle";
import { HomeFab } from "@/components/home-fab";
import { ThemeProvider } from "@/components/theme-provider";

export const metadata: Metadata = {
  title: "Hobby projects",
  description: "A collection of my personal hobby projects.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          <div className="relative min-h-screen">
            <div className="fixed right-6 top-6 z-50">
              <ModeToggle />
            </div>
            <HomeFab />
            {children}
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
