/* eslint-disable @next/next/no-img-element */
import type { ComponentProps } from "react";
import { render, screen } from "@testing-library/react";
import { vi } from "vitest";

import Home from "./page";

vi.mock("next/image", () => ({
  default: (props: ComponentProps<"img"> & { priority?: boolean }) => {
    const { priority, alt, ...rest } = props;
    void priority;
    return <img alt={alt ?? ""} {...rest} />;
  },
}));

describe("Home page", () => {
  it("renders the main heading", () => {
    render(<Home />);

    expect(
      screen.getByRole("heading", { name: /projekty/i }),
    ).toBeInTheDocument();
  });
});
