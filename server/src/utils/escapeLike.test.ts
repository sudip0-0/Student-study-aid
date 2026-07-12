import { describe, expect, it } from "vitest";
import { escapeLikePattern } from "./escapeLike";

describe("escapeLikePattern", () => {
  it("escapes percent, underscore, and backslash", () => {
    expect(escapeLikePattern("100%_done\\x")).toBe("100\\%\\_done\\\\x");
  });

  it("leaves plain text unchanged", () => {
    expect(escapeLikePattern("photosynthesis")).toBe("photosynthesis");
  });
});
