import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi } from "vitest";

import { ModeToggle } from "./mode-toggle";

const setTheme = vi.fn();
let currentTheme: "light" | "dark" | "system" = "light";

vi.mock("next-themes", () => ({
  useTheme: () => ({
    theme: currentTheme,
    setTheme,
  }),
}));

describe("ModeToggle", () => {
  beforeEach(() => {
    setTheme.mockClear();
    currentTheme = "light";
  });

  it("opens the menu and allows selecting a theme", async () => {
    const user = userEvent.setup();
    render(<ModeToggle />);

    const trigger = screen.getByRole("button", { name: "Toggle theme" });
    await user.click(trigger);

    await screen.findByText("Light ✓");
    const darkItem = screen.getByText("Dark");
    screen.getByText("System");

    await user.click(darkItem);
    expect(setTheme).toHaveBeenCalledWith("dark");

    await user.click(trigger);
    await user.click(screen.getByText("Light ✓"));
    expect(setTheme).toHaveBeenCalledWith("light");

    await user.click(trigger);
    await user.click(screen.getByText("System"));
    expect(setTheme).toHaveBeenCalledWith("system");
  });

  it("marks the active theme", async () => {
    const user = userEvent.setup();
    currentTheme = "system";

    render(<ModeToggle />);

    const trigger = screen.getByRole("button", { name: "Toggle theme" });
    await user.click(trigger);

    expect(await screen.findByText("System ✓")).toBeInTheDocument();
  });

  it("marks dark theme as active", async () => {
    const user = userEvent.setup();
    currentTheme = "dark";

    render(<ModeToggle />);

    const trigger = screen.getByRole("button", { name: "Toggle theme" });
    await user.click(trigger);

    expect(await screen.findByText("Dark ✓")).toBeInTheDocument();
  });
});
