import type { RemediationSession } from "./types";

// ── pdfjs lazy loader (browser-only) ─────────────────────────────────────────

let _pdfjs: typeof import("pdfjs-dist") | null = null;

async function getPdfjs() {
  if (_pdfjs) return _pdfjs;
  const pdfjs = await import("pdfjs-dist");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
  _pdfjs = pdfjs;
  return pdfjs;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

type Matrix = [number, number, number, number, number, number];

function multiplyMatrix(a: Matrix, b: Matrix): Matrix {
  return [
    a[0] * b[0] + a[2] * b[1],
    a[1] * b[0] + a[3] * b[1],
    a[0] * b[2] + a[2] * b[3],
    a[1] * b[2] + a[3] * b[3],
    a[0] * b[4] + a[2] * b[5] + a[4],
    a[1] * b[4] + a[3] * b[5] + a[5],
  ];
}

function transformPoint(m: Matrix, x: number, y: number): [number, number] {
  return [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function extractImageBboxes(page: any): Promise<Array<{ x: number; y: number; width: number; height: number } | null>> {
  const bboxes: Array<{ x: number; y: number; width: number; height: number } | null> = [];
  try {
    const ops = await page.getOperatorList();
    const OPS = (await import("pdfjs-dist")).OPS;
    const identity: Matrix = [1, 0, 0, 1, 0, 0];
    const stack: Matrix[] = [identity];
    let current: Matrix = identity;

    for (let i = 0; i < ops.fnArray.length; i++) {
      const fn = ops.fnArray[i];
      const args = ops.argsArray[i];

      if (fn === OPS.save) {
        stack.push(current);
      } else if (fn === OPS.restore) {
        current = stack.pop() ?? identity;
      } else if (fn === OPS.transform) {
        const m: Matrix = [args[0], args[1], args[2], args[3], args[4], args[5]];
        current = multiplyMatrix(current, m);
      } else if (fn === OPS.paintImageXObject || fn === OPS.paintInlineImageXObject || fn === OPS.paintImageMaskXObject) {
        // Image occupies unit square [0,1]x[0,1] in current CTM space
        const corners: [number, number][] = [
          transformPoint(current, 0, 0),
          transformPoint(current, 1, 0),
          transformPoint(current, 0, 1),
          transformPoint(current, 1, 1),
        ];
        const xs = corners.map((c) => c[0]);
        const ys = corners.map((c) => c[1]);
        const x = Math.min(...xs);
        const y = Math.min(...ys);
        const width = Math.max(...xs) - x;
        const height = Math.max(...ys) - y;
        bboxes.push({ x, y, width, height });
      }
    }
  } catch {
    // operator list unavailable
  }
  return bboxes;
}

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

export async function analyzePdf(
  file: File,
  onProgress?: (current: number, total: number) => void
): Promise<RemediationSession> {
  const pdfjs = await getPdfjs();
  const buffer = await file.arrayBuffer();
  const data = new Uint8Array(buffer);

  // Load document
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let pdf: any;
  try {
    pdf = await pdfjs.getDocument({ data }).promise;
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
    onProgress?.(i + 1, numPages);

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
      const bboxes = figureNodes.length > 0 ? await extractImageBboxes(page) : [];
      for (let j = 0; j < figureNodes.length; j++) {
        const node = figureNodes[j];
        const hasAlt = typeof node.alt === "string" && node.alt.trim().length > 0;
        images.push({
          id: `img-p${i}-${images.length}`,
          pageIndex: i,
          preview: "",
          hasAlt,
          currentAlt: node.alt ?? null,
          bbox: bboxes[j] ?? null,
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
