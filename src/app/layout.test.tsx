import { vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("next/font/google", () => ({
  Geist: () => ({ variable: "font-sans" }),
  Geist_Mono: () => ({ variable: "font-mono" }),
}));

vi.mock("@/components/mode-toggle", () => ({
  ModeToggle: () => <button aria-label="Toggle theme">Toggle theme</button>,
}));

import RootLayout from "./layout";

describe("RootLayout", () => {
  it("renders children and theme toggle", () => {
    const markup = renderToStaticMarkup(
      <RootLayout>
        <div>Inner content</div>
      </RootLayout>,
    );

    expect(markup).toContain("Inner content");
    expect(markup).toContain("Toggle theme");
  });
});
