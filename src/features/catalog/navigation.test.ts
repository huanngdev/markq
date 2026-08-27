import { describe, expect, it } from "bun:test";

import AnalyticsPage from "@/app/analytics/page";
import AttemptsPage from "@/app/attempts/page";

import { analyticsSubjectFrom, catalogHref, catalogTabFrom } from "./navigation";

describe("catalog navigation", () => {
  it("normalizes URL values and links all three tabs to the catalog", () => {
    for (const value of [undefined, "history", ["analytics"]]) {
      expect(catalogTabFrom(value)).toBe("available");
    }
    expect(catalogTabFrom("completed")).toBe("completed");
    expect(catalogTabFrom("analytics")).toBe("analytics");
    expect(catalogHref("available")).toBe("/");
    expect(catalogHref("completed")).toBe("/?status=completed");
    expect(catalogHref("analytics")).toBe("/?status=analytics");
    for (const subject of ["english", "iq", "computer-networks"] as const) {
      expect(analyticsSubjectFrom(subject)).toBe(subject);
      expect(catalogHref("analytics", subject)).toBe(`/?status=analytics&subject=${subject}`);
    }
    expect(analyticsSubjectFrom(["english"])).toBe("all");
    expect(analyticsSubjectFrom("not valid")).toBe("all");
    expect(analyticsSubjectFrom("../../secret")).toBe("all");
  });

  it("replaces the former History page with a redirect to Completed", () => {
    expect(AttemptsPage).toThrow(expect.objectContaining({ digest: "NEXT_REDIRECT;replace;/?status=completed;307;" }));
  });

  it("redirects old Analytics bookmarks while retaining a valid subject", async () => {
    for (const subject of [undefined, "english", "iq", "invalid"] as const) {
      await expect(AnalyticsPage({ searchParams: Promise.resolve({ subject }) })).rejects.toMatchObject({
        digest: `NEXT_REDIRECT;replace;${catalogHref("analytics", analyticsSubjectFrom(subject))};307;`,
      });
    }
  });
});
