import { describe, expect, it } from "vitest";
import { courses } from "../src/data/catalog";
import { parseTranscriptPdf, parseTranscriptText } from "../src/data/transcript";

describe("synthetic transcript extraction", () => {
  it("identifies supported completed courses as review candidates", () => {
    expect(parseTranscriptText("ITCS 2214 Data Structures A", courses)).toEqual([
      {
        code: "ITCS 2214",
        title: "Data Structures",
        grade: "A",
        courseId: "itcs-2214",
        status: "candidate",
        reason: null,
      },
    ]);
  });

  it("does not credit failed, in-progress, incomplete, withdrawn, or unrecognized courses", () => {
    const parsed = parseTranscriptText(
      "ITCS 2214 Data Structures F ITIS 3200 Info Security IP ITCS 9999 Unknown A ITCS 3155",
      courses,
    );

    expect(parsed.map((item) => item.status)).toEqual([
      "excluded",
      "excluded",
      "excluded",
      "excluded",
    ]);
    expect(parsed[2].courseId).toBeNull();
    expect(parsed[3].reason).toMatch(/grade/i);
  });

  it("reports empty and unsupported files before attempting to parse them", async () => {
    await expect(
      parseTranscriptPdf(new File([], "empty.pdf", { type: "application/pdf" }), courses),
    ).rejects.toThrow(/empty/i);
    await expect(
      parseTranscriptPdf(new File(["sample"], "transcript.txt", { type: "text/plain" }), courses),
    ).rejects.toThrow(/pdf/i);
  });
});
