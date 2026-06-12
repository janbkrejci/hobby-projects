import { describe, expect, it } from "vitest";

import { getFloodDataSourceUrls } from "./page";

describe("flood-scraper data sources", () => {
  it("does not depend on internal backend API route", () => {
    const sources = getFloodDataSourceUrls();

    expect(sources).toContain(
      "https://hydro.chmi.cz/hppsoldv/hpps_prfdata.php?seq=307024",
    );
    expect(
      sources.some((source) => source.includes("/api/flood-scraper")),
    ).toBe(false);
    expect(sources.some((source) => source.includes("allorigins.win"))).toBe(
      true,
    );
  });
});
