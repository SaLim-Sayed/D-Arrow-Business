from reportlab.lib import colors
from reportlab.lib.enums import TA_RIGHT, TA_CENTER, TA_LEFT
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, Image, Table, TableStyle, HRFlowable
from reportlab.lib.utils import ImageReader
import sys

sys.path.insert(0, "/Users/salemsayed/Library/Python/3.9/lib/python/site-packages")
import arabic_reshaper

OUT = "/Users/salemsayed/1-Work/FREE/DArrow/D-Arrow-Business/output/pdf/resignation-salem-sayed.pdf"
LOGO = "/Users/salemsayed/1-Work/FREE/DArrow/D-Arrow-Business/public/DR_LOGO__2_-2-01-removebg-preview.png"

pdfmetrics.registerFont(TTFont("Tahoma", "/System/Library/Fonts/Supplemental/Tahoma.ttf"))
pdfmetrics.registerFont(TTFont("Tahoma-Bold", "/System/Library/Fonts/Supplemental/Tahoma Bold.ttf"))
pdfmetrics.registerFontFamily("Tahoma", normal="Tahoma", bold="Tahoma-Bold", italic="Tahoma", boldItalic="Tahoma-Bold")

ORANGE = colors.HexColor("#F46A4E")
INK = colors.HexColor("#24252B")
MUTED = colors.HexColor("#777B85")
PALE = colors.HexColor("#FFF3F0")

def ar(text):
    # ReportLab's string renderer is left-to-right; shaping plus visual-order
    # reversal keeps these Arabic-only runs readable with embedded Tahoma.
    return arabic_reshaper.reshape(text)[::-1]

def draw_frame(canvas, doc):
    canvas.saveState()
    w, h = A4
    canvas.setFillColor(ORANGE)
    canvas.rect(0, h - 7*mm, w, 7*mm, stroke=0, fill=1)
    canvas.setFillColor(colors.HexColor("#F7B29F"))
    canvas.rect(0, 0, w, 2*mm, stroke=0, fill=1)
    canvas.setStrokeColor(colors.HexColor("#ECEDEF"))
    canvas.setLineWidth(0.6)
    canvas.line(19*mm, 18*mm, w - 19*mm, 18*mm)
    canvas.setFont("Tahoma", 8)
    canvas.setFillColor(MUTED)
    canvas.drawRightString(w - 20*mm, 12*mm, ar("سالم سيد سالم | خطاب استقالة"))
    canvas.restoreState()

doc = SimpleDocTemplate(OUT, pagesize=A4, rightMargin=22*mm, leftMargin=22*mm,
                        topMargin=19*mm, bottomMargin=25*mm,
                        title="خطاب استقالة - سالم سيد سالم", author="سالم سيد سالم")

styles = {
    "body": ParagraphStyle("body", fontName="Tahoma", fontSize=12.3, leading=23,
                            textColor=INK, alignment=TA_RIGHT, spaceAfter=12),
    "small": ParagraphStyle("small", fontName="Tahoma", fontSize=10, leading=17,
                             textColor=MUTED, alignment=TA_RIGHT),
    "title": ParagraphStyle("title", fontName="Tahoma-Bold", fontSize=23, leading=30,
                             textColor=INK, alignment=TA_CENTER),
    "label": ParagraphStyle("label", fontName="Tahoma-Bold", fontSize=11, leading=17,
                             textColor=ORANGE, alignment=TA_RIGHT),
    "signature": ParagraphStyle("signature", fontName="Tahoma", fontSize=11, leading=20,
                                 textColor=INK, alignment=TA_RIGHT),
}

story = []
logo = Image(LOGO, width=30*mm, height=22*mm, kind="proportional", hAlign="CENTER")
brand = Paragraph(f'<font name="Tahoma-Bold" size="15" color="#25262B">{ar("شركة دي آرو")}</font><br/>'
                  f'<font name="Tahoma" size="9" color="#777B85">D-Arrow Business</font>',
                  ParagraphStyle("brand", fontName="Tahoma", fontSize=10, leading=16, alignment=TA_RIGHT))
date = Paragraph(f'<font name="Tahoma-Bold">{ar("التاريخ")}: </font><font name="Tahoma">08 / 10 / 2026</font>', styles["small"])
head = Table([[brand, logo, date]], colWidths=[60*mm, 48*mm, 60*mm], rowHeights=[25*mm])
head.setStyle(TableStyle([
    ("VALIGN", (0,0), (-1,-1), "MIDDLE"),
    ("ALIGN", (0,0), (0,0), "RIGHT"),
    ("ALIGN", (1,0), (1,0), "CENTER"),
    ("ALIGN", (2,0), (2,0), "RIGHT"),
    ("LEFTPADDING", (0,0), (-1,-1), 0), ("RIGHTPADDING", (0,0), (-1,-1), 0),
]))
story += [head, Spacer(1, 4*mm), HRFlowable(width="100%", thickness=2.2, color=ORANGE), Spacer(1, 16*mm)]
story += [Paragraph(ar("خطاب استقالة"), styles["title"]), Spacer(1, 3*mm),
          Paragraph(ar("طلب إنهاء علاقة العمل"), ParagraphStyle("subtitle", parent=styles["small"], alignment=TA_CENTER)),
          Spacer(1, 13*mm)]

story += [Paragraph(ar("السادة / إدارة شركة دي آرو المحترمين"), styles["label"]),
          Spacer(1, 7*mm),
          Paragraph(ar("تحية طيبة وبعد،"), styles["body"]),
          Paragraph(ar("أتقدم إلى سيادتكم بطلب قبول استقالتي من عملي لدى شركة دي آرو، على أن يكون آخر يوم عمل لي بتاريخ: ____________________."), styles["body"]),
          Paragraph(ar("أرجو التكرم باستكمال إجراءات إنهاء العلاقة الوظيفية وتسوية المستحقات، وإصدار ما يلزم من مستندات، وفقًا للسياسات والإجراءات المعمول بها في الشركة."), styles["body"]),
          Paragraph(ar("أتقدم بالشكر لإدارة الشركة وفريق العمل على ما وجدته من تعاون وخبرة خلال فترة عملي، وأتمنى للشركة دوام التوفيق والنجاح."), styles["body"]),
          Spacer(1, 5*mm),
          Paragraph(ar("وتفضلوا بقبول فائق الاحترام والتقدير،"), styles["body"]),
          Spacer(1, 8*mm)]

sig = Table([
    [Paragraph(ar("مقدم الطلب"), styles["label"])],
    [Paragraph(ar("سالم سيد سالم"), ParagraphStyle("name", fontName="Tahoma-Bold", fontSize=13, leading=20, textColor=INK, alignment=TA_RIGHT))],
    [Paragraph(ar("المسمى الوظيفي: ____________________"), styles["signature"])],
    [Spacer(1, 10*mm)],
    [Paragraph(ar("التوقيع: __________________________"), styles["signature"])],
], colWidths=[72*mm])
sig.setStyle(TableStyle([
    ("BACKGROUND", (0,0), (-1,-1), PALE),
    ("BOX", (0,0), (-1,-1), 0.7, colors.HexColor("#F7D5CC")),
    ("LINEBEFORE", (0,0), (0,-1), 3, ORANGE),
    ("LEFTPADDING", (0,0), (-1,-1), 9*mm), ("RIGHTPADDING", (0,0), (-1,-1), 9*mm),
    ("TOPPADDING", (0,0), (-1,-1), 3*mm), ("BOTTOMPADDING", (0,0), (-1,-1), 3*mm),
]))
story.append(sig)
doc.build(story, onFirstPage=draw_frame, onLaterPages=draw_frame)
print(OUT)
