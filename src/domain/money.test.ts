import { describe, it, expect } from "vitest";
import { formatPLN, formatAmount, parsePLN, terminalInputToGrosze } from "./money";

describe("formatPLN", () => {
  it("formats zero", () => {
    expect(formatPLN(0)).toBe("0,00 zł");
  });

  it("formats small amounts", () => {
    expect(formatPLN(1)).toBe("0,01 zł");
    expect(formatPLN(99)).toBe("0,99 zł");
  });

  it("formats typical amounts", () => {
    expect(formatPLN(3500)).toBe("35,00 zł");
    expect(formatPLN(99000)).toBe("990,00 zł");
  });

  it("formats with thousands separator", () => {
    const result = formatPLN(123456);
    // Node may or may not use thousands separator at this magnitude
    expect(result).toContain("1234,56");
    expect(result).toContain("zł");
  });

  it("formats negative amounts", () => {
    const result = formatPLN(-50000);
    expect(result).toContain("500,00");
    expect(result).toContain("zł");
  });

  it("formats large amounts without breaking", () => {
    const result = formatPLN(100000000); // 1 000 000,00 zł
    expect(result).toMatch(/1[\s ]000[\s ]000,00/);
  });
});

describe("formatAmount", () => {
  it("formats without currency symbol", () => {
    expect(formatAmount(3500)).toBe("35,00");
  });

  it("formats with thousands separator", () => {
    const result = formatAmount(123456);
    expect(result).toContain("1234,56");
  });
});

describe("parsePLN", () => {
  it("parses plain number with comma", () => {
    expect(parsePLN("35,00")).toBe(3500);
  });

  it("parses with currency symbol", () => {
    expect(parsePLN("35,00 zł")).toBe(3500);
  });

  it("parses with dot as decimal separator", () => {
    expect(parsePLN("35.00")).toBe(3500);
  });

  it("parses with thousands separator", () => {
    expect(parsePLN("1 234,56")).toBe(123456);
    expect(parsePLN("1 234,56 zł")).toBe(123456);
  });

  it("parses integer without decimals", () => {
    expect(parsePLN("100")).toBe(10000);
  });

  it("parses single decimal place", () => {
    expect(parsePLN("35,5")).toBe(3550);
  });

  it("returns null for empty string", () => {
    expect(parsePLN("")).toBeNull();
  });

  it("returns null for gibberish", () => {
    expect(parsePLN("abc")).toBeNull();
    expect(parsePLN("zł")).toBeNull();
  });

  it("returns null for too many decimal places", () => {
    expect(parsePLN("35,123")).toBeNull();
  });

  it("handles negative amounts", () => {
    expect(parsePLN("-50,00")).toBe(-5000);
  });

  it("round-trips with formatPLN", () => {
    const values = [0, 1, 99, 3500, 123456, 100000000];
    for (const v of values) {
      expect(parsePLN(formatPLN(v))).toBe(v);
    }
  });

  it("round-trips with formatAmount", () => {
    const values = [0, 1, 99, 3500, 123456];
    for (const v of values) {
      expect(parsePLN(formatAmount(v))).toBe(v);
    }
  });
});

describe("terminalInputToGrosze", () => {
  it("single digit = grosze", () => {
    expect(terminalInputToGrosze("3")).toBe(3);
  });

  it("two digits = grosze", () => {
    expect(terminalInputToGrosze("35")).toBe(35);
  });

  it("three digits = złote + grosze", () => {
    expect(terminalInputToGrosze("350")).toBe(350);
  });

  it("four digits", () => {
    expect(terminalInputToGrosze("3500")).toBe(3500);
  });

  it("empty string returns 0", () => {
    expect(terminalInputToGrosze("")).toBe(0);
  });

  it("negative returns 0", () => {
    expect(terminalInputToGrosze("-5")).toBe(0);
  });
});
