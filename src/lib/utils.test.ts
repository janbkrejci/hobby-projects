import { cn } from "./utils";

describe("cn", () => {
  it("merges class names and removes conflicts", () => {
    const result = cn("p-2", "p-4", false && "hidden", "text-sm");

    expect(result).toBe("p-4 text-sm");
  });
});
