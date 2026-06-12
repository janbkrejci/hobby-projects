"use client";

export default function MorphicWidgetsPage() {
  const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="h-screen w-full pt-6">
        <iframe
          title="Morphic Widgets"
          src={`${basePath}/morphic-widgets/index.html`}
          className="h-full w-full border-0"
        />
      </div>
    </div>
  );
}
