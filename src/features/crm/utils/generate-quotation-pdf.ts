import html2canvas from "html2canvas";
import { jsPDF } from "jspdf";

const A4_WIDTH_MM = 210;
const A4_HEIGHT_MM = 297;
const MARGIN_MM = 8;

export async function generateQuotationPdf(
  element: HTMLElement,
  filename: string
): Promise<void> {
  const canvas = await html2canvas(element, {
    scale: 2,
    useCORS: true,
    backgroundColor: "#ffffff",
    logging: false,
    windowWidth: element.scrollWidth,
    height: element.scrollHeight,
  });

  const imgData = canvas.toDataURL("image/png");
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
}
