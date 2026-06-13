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

async function waitForRender(element: HTMLElement): Promise<void> {
  await document.fonts.ready;
  await waitForImages(element);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));
}

function resolveCaptureTarget(element: HTMLElement): HTMLElement {
  const inner =
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
  root.style.zIndex = "-1";

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
  const target = resolveCaptureTarget(element);
  await waitForRender(target);

  const restore = prepareForCapture(element);
  await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)));

  try {
    const canvas = await html2canvas(target, {
      scale: 2,
      useCORS: true,
      backgroundColor: "#ffffff",
      logging: false,
    });

    if (canvas.width === 0 || canvas.height === 0) {
      throw new Error("Empty canvas");
    }

    const imgData = canvas.toDataURL("image/png", 1);
    const pdf = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });

    const contentWidth = A4_WIDTH_MM - MARGIN_MM * 2;
    const contentHeight = A4_HEIGHT_MM - MARGIN_MM * 2;
    const imgHeight = (canvas.height * contentWidth) / canvas.width;

    let offsetY = 0;
    let page = 0;

    while (offsetY < imgHeight) {
      if (page > 0) pdf.addPage();

      pdf.addImage(
        imgData,
        "PNG",
        MARGIN_MM,
        MARGIN_MM - offsetY,
        contentWidth,
        imgHeight
      );

      offsetY += contentHeight;
      page += 1;
    }

    pdf.save(filename);
  } finally {
    restore();
  }
}
