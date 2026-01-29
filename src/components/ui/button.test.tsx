import { render, screen } from "@testing-library/react";

import { Button } from "./button";

describe("Button", () => {
  it("renders the provided label", () => {
    render(<Button>Save</Button>);

    expect(screen.getByRole("button", { name: "Save" })).toBeInTheDocument();
  });

  it("renders as a link when asChild is true", () => {
    render(
      <Button asChild>
        <a href="/docs">Docs</a>
      </Button>
    );

    const link = screen.getByRole("link", { name: "Docs" });
    expect(link).toHaveAttribute("href", "/docs");
  });

  it("sets variant and size data attributes", () => {
    render(
      <Button variant="destructive" size="lg">
        Delete
      </Button>
    );

    const button = screen.getByRole("button", { name: "Delete" });
    expect(button).toHaveAttribute("data-variant", "destructive");
    expect(button).toHaveAttribute("data-size", "lg");
  });
});
