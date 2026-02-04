"use client";

export default function MorphicWidgetsPage() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-screen w-full pt-6">
        <iframe
          title="Morphic Widgets"
          src="/morphic-widgets/index.html"
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
