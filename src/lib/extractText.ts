// Browser-side resume text extraction.
// Lazy-imports pdfjs/mammoth so SSR isn't affected.

export async function extractResumeText(file: File): Promise<string> {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) {
    return extractPdf(file);
  }
  if (
    file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    name.endsWith(".docx")
  ) {
    return extractDocx(file);
  }
  if (file.type === "application/msword" || name.endsWith(".doc")) {
    // Legacy .doc — best-effort: try mammoth (works for some), else return empty.
    try {
      return await extractDocx(file);
    } catch {
      return "";
    }
  }
  return "";
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.mjs`;

  const buf = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: buf }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text +=
      content.items
        .map((it: unknown) => {
          const item = it as { str?: string };
          return item.str ?? "";
        })
        .join(" ") + "\n";
  }
  return text.trim();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import("mammoth");
  const buf = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer: buf });
  return (result.value ?? "").trim();
}
