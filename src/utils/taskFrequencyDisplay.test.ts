import { describe, expect, it } from "vitest";
import { formatTaskFrequency } from "./taskFrequencyDisplay";

describe("formatTaskFrequency", () => {
  it("formats singular day frequency", () => {
    expect(formatTaskFrequency("day", 1)).toBe("Fréquence: tous les jours");
  });

  it("formats plural day frequency", () => {
    expect(formatTaskFrequency("day", 3)).toBe("Fréquence: tous les 3 jours");
  });

  it("formats singular week frequency", () => {
    expect(formatTaskFrequency("week", 1)).toBe(
      "Fréquence: toutes les semaines",
    );
  });

  it("formats plural month frequency without extra s", () => {
    expect(formatTaskFrequency("month", 2)).toBe("Fréquence: tous les 2 mois");
  });

  it("formats plural year frequency", () => {
    expect(formatTaskFrequency("year", 2)).toBe("Fréquence: tous les 2 ans");
  });
});
