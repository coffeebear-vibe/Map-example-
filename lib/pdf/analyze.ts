import type { RemediationSession } from "./types";

// ── pdfjs lazy loader (browser-only) ─────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pdfjs: any = null;

async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  _pdfjs = await import("pdfjs-dist");
  // pdfjs 5.x ships an ESM worker — point at the CDN copy so Next.js
  // doesn't try to bundle the worker file itself.
  if (!_pdfjs.GlobalWorkerOptions.workerSrc) {
    _pdfjs.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${_pdfjs.version}/build/pdf.worker.min.mjs`;
  }
  return _pdfjs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function findNodes(node: any, roles: string[], out: any[] = []): any[] {
  if (!node) return out;
  if (roles.includes(node.role)) out.push(node);
  if (Array.isArray(node.children)) {
    for (const child of node.children) {
      if (child && typeof child.role === "string") findNodes(child, roles, out);
    }
  }
  return out;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function renderThumb(page: any, width = 220): Promise<string> {
  try {
    const vp = page.getViewport({ scale: 1 });
    const scale = width / vp.width;
    const scaled = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(scaled.width);
    canvas.height = Math.round(scaled.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) return "";
    await page.render({ canvasContext: ctx, viewport: scaled }).promise;
    return canvas.toDataURL("image/jpeg", 0.75);
  } catch {
    return "";
  }
}

function emptySession(
  file: File,
  flags: Pick<RemediationSession["file"], "isPasswordProtected" | "isScanned">
): RemediationSession {
  return {
    file: { name: file.name, size: file.size, ...flags },
    analysis: {
      metadata: { title: null, author: null, language: null },
      images: [],
      hasStructureTree: false,
      hasMarkInfo: false,
      formFields: [],
      tables: [],
    },
    fixes: {
      metadata: null,
      altText: {},
      contrastConfirmed: false,
      formFields: {},
      tablesAcknowledged: false,
    },
    currentStep: "metadata",
    completedSteps: [],
  };
}

// ── Main export ───────────────────────────────────────────────────────────────

export async function analyzePdf(file: File): Promise<RemediationSession> {
  const pdfjs = await getPdfjs();
  const buffer = await file.arrayBuffer();

  // Load document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdf: any;
  try {
    pdf = await pdfjs.getDocument({ data: buffer }).promise;
  } catch (err: unknown) {
    const e = err as { name?: string };
    if (e?.name === "PasswordException") {
      return emptySession(file, { isPasswordProtected: true, isScanned: false });
    }
    throw err;
  }

  const numPages: number = pdf.numPages;

  // ── Scanned detection ─────────────────────────────────────────────────────
  let totalTextItems = 0;
  for (let i = 0; i < Math.min(numPages, 3); i++) {
    try {
      const page = await pdf.getPage(i + 1);
      const tc = await page.getTextContent();
      totalTextItems += tc.items.length;
    } catch { /* skip */ }
  }
  const isScanned = totalTextItems === 0;

  // ── Metadata ──────────────────────────────────────────────────────────────
  let metaInfo: Record<string, unknown> = {};
  try {
    const result = await pdf.getMetadata();
    metaInfo = (result?.info ?? {}) as Record<string, unknown>;
  } catch { /* skip */ }

  const metadata = {
    title: (metaInfo.Title as string) || null,
    author: (metaInfo.Author as string) || null,
    language: (metaInfo.Language as string) || null,
  };

  // ── Structure tree, images, tables ────────────────────────────────────────
  let hasStructureTree = false;
  let hasMarkInfo = false;
  const images: RemediationSession["analysis"]["images"] = [];
  const tables: RemediationSession["analysis"]["tables"] = [];

  for (let i = 0; i < numPages; i++) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let page: any;
    try {
      page = await pdf.getPage(i + 1);
    } catch { continue; }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    let structTree: any = null;
    try {
      structTree = await page.getStructTree();
    } catch { /* untagged */ }

    if (structTree?.children?.length) {
      hasStructureTree = true;
      hasMarkInfo = true;

      // Figures / images
      const figureNodes = findNodes(structTree, ["Figure", "Image", "Formula"]);
      for (const node of figureNodes) {
        const hasAlt = typeof node.alt === "string" && node.alt.trim().length > 0;
        const preview = await renderThumb(page);
        images.push({
          id: `img-p${i}-${images.length}`,
          pageIndex: i,
          preview,
          hasAlt,
          currentAlt: node.alt ?? null,
        });
      }

      // Tables
      const tableNodes = findNodes(structTree, ["Table"]);
      for (const node of tableNodes) {
        const thNodes = findNodes(node, ["TH"]);
        tables.push({
          id: `table-p${i}-${tables.length}`,
          hasHeaders: thNodes.length > 0,
        });
      }
    }
  }

  // ── Form fields ───────────────────────────────────────────────────────────
  const formFields: RemediationSession["analysis"]["formFields"] = [];
  for (let i = 0; i < numPages; i++) {
    try {
      const page = await pdf.getPage(i + 1);
      const annotations = await page.getAnnotations();
      for (const ann of annotations) {
        if (ann.subtype === "Widget" && ann.fieldType) {
          formFields.push({
            id: `field-p${i}-${formFields.length}`,
            name: ann.fieldName || `Field ${formFields.length + 1}`,
            type: ann.fieldType,
            hasAccessibleName: typeof ann.alternativeText === "string"
              && ann.alternativeText.trim().length > 0,
          });
        }
      }
    } catch { /* skip */ }
  }

  return {
    file: { name: file.name, size: file.size, isScanned, isPasswordProtected: false },
    analysis: { metadata, images, hasStructureTree, hasMarkInfo, formFields, tables },
    fixes: {
      metadata: null,
      altText: {},
      contrastConfirmed: false,
      formFields: {},
      tablesAcknowledged: false,
    },
    currentStep: "metadata",
    completedSteps: [],
  };
}
