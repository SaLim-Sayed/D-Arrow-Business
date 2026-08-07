import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 8;

async function waitForImages(root: HTMLElement): Promise<void> {
  const images = Array.from(root.querySelectorAll("img"));
  await Promise.all(
    images.map(
      (img) =>
        new Promise<void>((resolve) => {
          if (img.complete && img.naturalWidth > 0) {
            resolve();
            return;
          }
          img.onload = () => resolve();
          img.onerror = () => resolve();
        })
    )
  );
}

/** Give ZatcaQrCode a moment to paint canvas → PNG img before capture. */
async function waitForZatcaQr(root: HTMLElement): Promise<void> {
  const deadline = Date.now() + 1500;
  while (Date.now() < deadline) {
    const qrImgs = root.querySelectorAll<HTMLImageElement>("img[data-zatca-qr]");
    if (qrImgs.length === 0) {
      // Still rendering from canvas fallback — brief wait then continue
      await new Promise((r) => setTimeout(r, 50));
      const canvases = root.querySelectorAll("canvas");
      if (canvases.length > 0 || root.querySelector("img[data-zatca-qr]")) break;
      break;
    }
    const ready = Array.from(qrImgs).every(
      (img) => img.complete && img.naturalWidth > 0
    );
    if (ready) return;
    await new Promise((r) => setTimeout(r, 50));
  }
}

async function waitForRender(element: HTMLElement): Promise<void> {
  await document.fonts.load('400 12px "IBM Plex Sans Arabic"');
  await document.fonts.load('700 12px "IBM Plex Sans Arabic"');
  await document.fonts.load('700 22px "IBM Plex Sans Arabic"');
  await document.fonts.ready;
  await waitForZatcaQr(element);
  await waitForImages(element);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

function normalizePrintClone(root: HTMLElement): void {
  root.style.letterSpacing = "normal";
  root.style.fontFamily =
    '"IBM Plex Sans Arabic", Tahoma, "Segoe UI", Arial, sans-serif';

  root.querySelectorAll<HTMLElement>("*").forEach((el) => {
    el.style.letterSpacing = "normal";
    const weight = Number.parseInt(el.style.fontWeight || "0", 10);
    if (weight > 700) {
      el.style.fontWeight = "700";
    }
  });
}

/** html2canvas often blanks <canvas>; copy pixels onto <img> in the clone. */
function replaceCanvasesWithImages(
  sourceRoot: HTMLElement,
  clonedRoot: HTMLElement
): void {
  const sources = sourceRoot.querySelectorAll("canvas");
  const clones = clonedRoot.querySelectorAll("canvas");
  sources.forEach((source, index) => {
    const cloneCanvas = clones[index];
    const parent = cloneCanvas?.parentNode;
    if (!cloneCanvas || !parent) return;
    try {
      const img = clonedRoot.ownerDocument.createElement("img");
      img.src = source.toDataURL("image/png");
      const w = source.width || source.clientWidth || 76;
      const h = source.height || source.clientHeight || 76;
      img.width = w;
      img.height = h;
      img.style.width = `${w}px`;
      img.style.height = `${h}px`;
      img.style.display = "block";
      parent.replaceChild(img, cloneCanvas);
    } catch {
      // tainted / empty canvas — leave as-is
    }
  });
}

function resolveCaptureTarget(element: HTMLElement): HTMLElement {
  const inner =
    element.querySelector<HTMLElement>("[data-invoice-print]") ??
    element.querySelector<HTMLElement>("[data-quotation-print]") ??
    (element.firstElementChild as HTMLElement | null);
  return inner ?? element;
}

/** Briefly move the print tree into the viewport so html2canvas can rasterize it. */
function prepareForCapture(root: HTMLElement): () => void {
  const saved = {
    position: root.style.position,
    left: root.style.left,
    top: root.style.top,
    zIndex: root.style.zIndex,
  };

  root.style.position = "fixed";
  root.style.left = "0";
  root.style.top = "0";
  root.style.zIndex = "9999";
  root.style.opacity = "1";
  root.style.pointerEvents = "none";

  return () => {
    root.style.position = saved.position;
    root.style.left = saved.left;
    root.style.top = saved.top;
    root.style.zIndex = saved.zIndex;
  };
}

export async function generateQuotationPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const pdf = await buildPdfDocument(element);
  pdf.save(filename);
}

/** Build a PDF Blob from a print element (for upload / share links). */
export async function generatePdfBlob(element: HTMLElement): Promise<Blob> {
  const pdf = await buildPdfDocument(element);
  return pdf.output("blob");
}

async function buildPdfDocument(element: HTMLElement) {
  const target = resolveCaptureTarget(element);
  const isInvoiceOrQuote = !!(
    target.closest("[data-invoice-print], [data-quotation-print]") ||
    target.matches("[data-invoice-print], [data-quotation-print]")
  );
  // Invoice/quotation sheets are already A4-sized with internal padding — don't shrink them.
  const margin = isInvoiceOrQuote ? 0 : MARGIN_MM;

  await waitForRender(target);

  const restore = prepareForCapture(element);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
      onclone: (_doc, cloned) => {
        normalizePrintClone(cloned);
        replaceCanvasesWithImages(target, cloned);
        // Ensure clone is full A4 width (ignore any parent CSS scale)
        cloned.style.transform = "none";
        cloned.style.width = `${A4_WIDTH_MM}mm`;
        cloned.style.minHeight = `${A4_HEIGHT_MM}mm`;
        cloned.style.boxSizing = "border-box";
        cloned.style.background = "#ffffff";
      },
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Empty canvas");
    }

    const imgData = canvas.toDataURL("image/png", 1);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const contentWidth = A4_WIDTH_MM - margin * 2;
    const contentHeight = A4_HEIGHT_MM - margin * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let offsetY = 0;
    let page = 0;

    while (offsetY < imgHeight - 0.5) {
      if (page > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        margin,
        margin - offsetY,
        contentWidth,
        imgHeight
      );

      offsetY += contentHeight;
      page += 1;
    }

    return pdf;
  } finally {
    restore();
  }
}
