import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import { ThemeProvider } from "./theme-provider";

describe("ThemeProvider", () => {
  beforeAll(() => {
    if (!window.matchMedia) {
      Object.defineProperty(window, "matchMedia", {
        writable: true,
        value: vi.fn().mockImplementation((query) => ({
          matches: query.includes("dark"),
          media: query,
          onchange: null,
          addListener: vi.fn(),
          removeListener: vi.fn(),
          addEventListener: vi.fn(),
          removeEventListener: vi.fn(),
          dispatchEvent: vi.fn(),
        })),
      });
    }
  });

  it("renders children", () => {
    render(
      <ThemeProvider attribute="class" defaultTheme="light">
        <div>Content</div>
      </ThemeProvider>,
    );

    expect(screen.getByText("Content")).toBeInTheDocument();
  });
});
