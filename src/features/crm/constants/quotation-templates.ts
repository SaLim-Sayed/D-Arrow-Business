import type { QuotationLineItem } from "../types/quotation.types";

/** Base package from D Arrow quotation template */
export const QUOTATION_BASE_PACKAGE: Omit<QuotationLineItem, "id"> = {
  nameAr: "تصميم موقع إلكتروني متجاوب + استضافة لمدة سنة + نطاق دولي + بريد إلكتروني رسمي",
  nameEn: "Responsive website + 1-year hosting + international domain + business email",
  descriptionAr:
    "تصميم موقع إلكتروني متجاوب مع جميع الأجهزة، يشمل استضافة لمدة سنة، نطاقاً دولياً، وبريداً إلكترونياً رسمياً باسم النطاق.",
  descriptionEn:
    "Responsive website design for all devices, including one year of hosting, an international domain, and a business email on your domain.",
  quantity: 1,
  unitPrice: 9000,
  optional: false,
};

/**
 * Optional add-ons from the PDF template — only selected items appear in the quote.
 */
export const QUOTATION_OPTIONAL_ADDONS: Omit<QuotationLineItem, "id">[] = [
  {
    nameAr: "استضافة إضافية لمدة سنة",
    nameEn: "Additional hosting (1 year)",
    descriptionAr: "تمديد استضافة الموقع لسنة إضافية مع الدعم الفني.",
    descriptionEn: "Extend website hosting for one additional year with technical support.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "نطاق دولي",
    nameEn: "International domain",
    descriptionAr: "تسجيل نطاق دولي وربطه باسم العلامة التجارية.",
    descriptionEn: "Register an international domain and connect it to your brand.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "بريد إلكتروني رسمي",
    nameEn: "Business email",
    descriptionAr: "إنشاء بريد إلكتروني رسمي باسم النطاق للتواصل المؤسسي.",
    descriptionEn: "Set up a professional email address on your domain for business communication.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "صفحة رئيسية إضافية",
    nameEn: "Additional home page",
    descriptionAr: "تصميم صفحة رئيسية إضافية بتخطيط ومحتوى مخصصين.",
    descriptionEn: "Design an additional home page with a custom layout and content.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "صفحات مخصصة للمنتجات",
    nameEn: "Dedicated product pages",
    descriptionAr: "إنشاء صفحة مستقلة لكل منتج مع تفاصيله وصوره.",
    descriptionEn: "Create a dedicated page for each product with details and images.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "صفحات الرعاة والكتب",
    nameEn: "Sponsor and book pages",
    descriptionAr: "صفحات مخصصة لعرض الرعاة والكتب بشكل منظم وجذاب.",
    descriptionEn: "Dedicated pages to showcase sponsors and books in a clear, attractive layout.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "تصنيف الكتب حسب الفئات",
    nameEn: "Book categorization",
    descriptionAr: "تنظيم وعرض الكتب حسب التصنيفات والفئات المختلفة.",
    descriptionEn: "Organize and display books by categories and genres.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "ربط منصة ثبت للكتب",
    nameEn: "Thabat platform integration",
    descriptionAr: "ربط الكتب بمنصة ثبت لشراء النسخ الإلكترونية أو الورقية.",
    descriptionEn: "Link books to the Thabat platform for digital or print purchases.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "نسخة إلكترونية لموقع الكتب",
    nameEn: "Digital book site copy",
    descriptionAr: "إتاحة نسخة إلكترونية من موقع الكتب للقراءة أو التحميل.",
    descriptionEn: "Provide a digital copy of the book site for reading or download.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "تاريخ انتهاء عروض الكتب",
    nameEn: "Book offer expiry dates",
    descriptionAr: "عرض تاريخ انتهاء عروض الكتب والعروض الخاصة.",
    descriptionEn: "Display expiry dates for book offers and special promotions.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "تصميم متجاوب مع الجوال",
    nameEn: "Mobile-responsive design",
    descriptionAr: "ضمان توافق الموقع مع الهواتف الذكية والأجهزة اللوحية.",
    descriptionEn: "Ensure full compatibility with smartphones and tablets.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "تحسين محركات البحث (SEO)",
    nameEn: "Search engine optimization (SEO)",
    descriptionAr: "تحسين الموقع لمحركات البحث لزيادة الظهور وعدد الزيارات.",
    descriptionEn: "Optimize the site for search engines to improve visibility and traffic.",
    quantity: 1,
    unitPrice: 0,
    optional: true,
  },
  {
    nameAr: "هوية بصرية احترافية",
    nameEn: "Professional brand identity",
    descriptionAr: "تصميم هوية بصرية تشمل الشعار والألوان والخطوط.",
    descriptionEn: "Design a visual identity including logo, colors, and typography.",
    quantity: 1,
    unitPrice: 1000,
    optional: true,
  },
  {
    nameAr: "تطبيق جوال أو ويب",
    nameEn: "Mobile or web application",
    descriptionAr: "تطوير تطبيق جوال أو ويب وفق متطلبات المشروع.",
    descriptionEn: "Develop a mobile or web application based on project requirements.",
    quantity: 1,
    unitPrice: 4000,
    optional: true,
  },
];

export const QUOTATION_DEFAULT_TERMS_AR = [
  "عرض السعر ساري لمدة 3 أشهر من تاريخه.",
];

export const QUOTATION_DEFAULT_TERMS_EN = [
  "This quotation is valid for 3 months from the date of issue.",
];
