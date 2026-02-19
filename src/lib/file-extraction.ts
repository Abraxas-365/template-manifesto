import mammoth from "mammoth";

export interface ExtractionResult {
  text: string;
  html?: string;
  fileName: string;
}

async function extractFromDocx(file: File): Promise<ExtractionResult> {
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.convertToHtml({ arrayBuffer });
  const html = result.value;

  // Strip HTML to get plain text
  const doc = new DOMParser().parseFromString(html, "text/html");
  const text = doc.body.textContent ?? "";

  return { text: text.trim(), html, fileName: file.name };
}

export async function extractTextFromFile(
  file: File,
): Promise<ExtractionResult> {
  const ext = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
  if (ext !== ".docx") {
    throw new Error("Unsupported file type. Please upload a .docx file.");
  }

  return extractFromDocx(file);
}
