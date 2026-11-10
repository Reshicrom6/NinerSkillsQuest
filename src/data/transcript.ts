import * as pdfjsLib from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import type { Course } from "../types";

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

const MAX_FILE_BYTES = 5_000_000;
const MAX_PAGE_COUNT = 20;

export interface TranscriptCourseCandidate {
  code: string;
  title: string;
  grade: string | null;
  courseId: string | null;
  status: "candidate" | "excluded";
  reason: string | null;
}

export function parseTranscriptText(
  text: string,
  catalog: readonly Course[],
): TranscriptCourseCandidate[] {
  const matches = [...text.matchAll(/\b(ITCS|ITIS)\s*(\d{4})\b/gi)];
  return matches.map((match, index) => {
    const code = `${match[1].toUpperCase()} ${match[2]}`;
    const nextMatch = matches[index + 1];
    const rowEnd = nextMatch?.index ?? text.length;
    const remainder = text.slice((match.index ?? 0) + match[0].length, rowEnd).trim();
    const gradeMatch = remainder.match(/\b(A|B|C|D|F|P|CR|S|IP|I|W)\b/i);
    const grade = gradeMatch?.[1].toUpperCase() ?? null;
    const title = (gradeMatch ? remainder.slice(0, gradeMatch.index) : remainder).trim();
    const course = catalog.find((item) => item.code.toUpperCase() === code);

    if (!course) {
      return {
        code,
        title,
        grade,
        courseId: null,
        status: "excluded",
        reason: "This course is not in the supported demo catalog.",
      };
    }

    if (!grade) {
      return {
        code,
        title: title || course.title,
        grade,
        courseId: course.id,
        status: "excluded",
        reason: "A recognized completion grade was not found.",
      };
    }

    if (grade === "F" || grade === "IP" || grade === "I" || grade === "W") {
      return {
        code,
        title: title || course.title,
        grade,
        courseId: course.id,
        status: "excluded",
        reason: "Failed, in-progress, incomplete, or withdrawn courses are not credited.",
      };
    }

    return {
      code,
      title: title || course.title,
      grade,
      courseId: course.id,
      status: "candidate",
      reason: null,
    };
  });
}

export async function parseTranscriptPdf(
  file: File,
  catalog: readonly Course[],
  signal?: AbortSignal,
): Promise<TranscriptCourseCandidate[]> {
  if (file.size === 0) {
    throw new Error("The selected PDF is empty.");
  }
  if (file.size > MAX_FILE_BYTES) {
    throw new Error("The PDF is larger than the 5 MB demo limit.");
  }
  if (file.type !== "" && file.type !== "application/pdf") {
    throw new Error("Choose a PDF file.");
  }
  if (!file.name.toLowerCase().endsWith(".pdf")) {
    throw new Error("Choose a file with a .pdf extension.");
  }

  const bytes = new Uint8Array(await file.arrayBuffer());
  let loadingTask: ReturnType<typeof pdfjsLib.getDocument> | null = null;
  let destroyPromise: Promise<void> | null = null;
  let destroyError: unknown = null;
  const destroyDocument = () => {
    destroyPromise ??= loadingTask?.destroy() ?? Promise.resolve();
    return destroyPromise;
  };
  const abortParsing = () => {
    void destroyDocument().catch((error: unknown) => {
      destroyError = error;
    });
  };
  try {
    loadingTask = pdfjsLib.getDocument({ data: bytes.slice(), isEvalSupported: false });
    signal?.addEventListener("abort", abortParsing, { once: true });
    signal?.throwIfAborted();
    const document = await loadingTask.promise;
    signal?.throwIfAborted();
    if (document.numPages > MAX_PAGE_COUNT) {
      throw new Error("The PDF exceeds the 20-page demo limit.");
    }
    const textParts: string[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      signal?.throwIfAborted();
      const content = await page.getTextContent();
      textParts.push(
        content.items
          .map((item) => ("str" in item ? item.str : ""))
          .filter(Boolean)
          .join(" "),
      );
    }
    return parseTranscriptText(textParts.join(" "), catalog);
  } finally {
    signal?.removeEventListener("abort", abortParsing);
    bytes.fill(0);
    await destroyDocument();
    if (destroyError) {
      throw new Error("The PDF processing task could not be released.");
    }
  }
}
