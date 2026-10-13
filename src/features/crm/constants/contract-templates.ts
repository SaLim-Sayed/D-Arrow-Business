import type {
  ContractClause,
  ContractDynamicField,
  ContractFormDraft,
  ContractParty,
} from "../types/contract.types";

function uid(prefix: string): string {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function field(
  key: string,
  label: string,
  value: string
): ContractDynamicField {
  return { id: uid("fld"), key, label, value };
}

function bullet(text: string) {
  return { id: uid("blt"), text };
}

function clause(title: string, bullets: string[], body?: string): ContractClause {
  return {
    id: uid("cls"),
    title,
    body,
    bullets: bullets.map(bullet),
  };
}

export function formatContractNumber(n = Date.now() % 1000000): string {
  return String(n).padStart(6, "0");
}

export function toContractDateIso(date = new Date()): string {
  return date.toISOString().slice(0, 10);
}

export function formatContractDateAr(iso: string): string {
  if (!iso) return "";
  const [y, m, d] = iso.split("-");
  if (!y || !m || !d) return iso;
  return `${y}/${m}/${d}م`;
}

/** Replace {{key}} placeholders with field values. */
export function interpolateContractText(
  text: string,
  values: Record<string, string>
): string {
  return text.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_, key: string) => {
    const v = values[key];
    return v != null && v !== "" ? v : `{{${key}}}`;
  });
}

export function contractFieldMap(
  fields: ContractDynamicField[]
): Record<string, string> {
  return Object.fromEntries(fields.map((f) => [f.key, f.value]));
}

export function defaultProviderParty(): ContractParty {
  return {
    name: "شركة دي آرو للتسويق",
    commercialRegister: "7053575184",
    taxNumber: "314611548300003",
    address: "حي الياسمين، الأحساء، المملكة العربية السعودية",
    representative: "علي المسلم",
    phone: "050066349",
    email: "info@d-arrow.com",
  };
}

export function emptyClientParty(): ContractParty {
  return {
    name: "",
    commercialRegister: "",
    taxNumber: "",
    address: "",
    representative: "",
    idNumber: "",
    phone: "",
    email: "",
  };
}

/** Default dynamic fields matching the sample marketing services contract. */
export function defaultContractFields(): ContractDynamicField[] {
  return [
    field("startDate", "تاريخ بدء التنفيذ", "2026/05/10م"),
    field("durationDays", "مدة العقد (أيام)", "15"),
    field("serviceSummary", "ملخص الخدمة", "رفع صور المنتجات وكتابة اسم المنتج فقط"),
    field("imageCount", "عدد الصور", "917"),
    field("storeUrl", "رابط المتجر", "mrsinisa.com"),
    field("amountExclVat", "القيمة بدون ضريبة", "700"),
    field("vatRate", "نسبة الضريبة %", "15"),
    field("amountInclVat", "القيمة شامل الضريبة", "805"),
    field("extraImagePrice", "سعر الصورة الإضافية", "3"),
    field("minExtraImages", "الحد الأدنى للصور الإضافية", "10"),
    field("reviewDays", "مدة المراجعة (أيام عمل)", "1"),
    field("forceMajeureDays", "مدة القوة القاهرة (أيام)", "90"),
    field("cureDays", "مهلة معالجة الإخلال (أيام)", "15"),
    field("disputeDays", "مهلة التسوية الودية (أيام)", "15"),
    field("jurisdictionCity", "مدينة الاختصاص", "الأحساء"),
  ];
}

/**
 * Default Arabic clauses from the D-Arrow marketing services agreement sample,
 * with {{placeholders}} for dynamic editing.
 */
export function defaultContractClauses(): ContractClause[] {
  return [
    clause("مدة العقد", [
      "اتفق الطرفان على أن يبدأ تنفيذ الخدمات المتفق عليها من تاريخ {{startDate}}.",
      "مدة العقد {{durationDays}} يوم من تاريخه لرفع صور منتجات مع التسمية للمنتج فقط، بدون تصميم أو وصف.",
    ]),
    clause("موضوع العقد (الخدمات)", [
      "بموجب هذا العقد يوافق مقدم الخدمة على تقديم خدمات {{serviceSummary}} للعميل، وذلك وفقاً للخدمات المحددة أدناه. وفي حال طلب خدمات أخرى سيتم إلحاقها بالعقد.",
      "خدمة رفع صور منتجات بعدد {{imageCount}} صورة فقط من غير تصميم.",
      "رابط المتجر ({{storeUrl}}).",
    ]),
    clause("قيمة العقد وشروط الدفع", [
      "القيمة الإجمالية: تبلغ القيمة الإجمالية لهذا العقد مبلغ وقدره {{amountExclVat}} \u20C1، غير شامل ضريبة القيمة المضافة ({{vatRate}}%).",
      "جدول الدفع: الدفعة تدفع بالكامل بقيمة {{amountInclVat}} \u20C1 شامل القيمة المضافة عند التوقيع.",
    ]),
    clause("التزامات مقدم الخدمة", [
      "الحفاظ على سرية البيانات الخاصة بالعميل.",
    ]),
    clause("التزامات العميل", [
      "المتطلبات: توفير جميع المعلومات والشعارات والصور وبيانات الدخول اللازمة لأداء الخدمة خلال المدة المتفق عليها.",
      "المراجعة والاعتماد: مراجعة واعتماد المخرجات خلال {{reviewDays}} يوم عمل. إذا لم يتم الاعتراض خلال هذه الفترة تعتبر المخرجات مقبولة.",
      "الموافقات: يتحمل العميل المسؤولية الكاملة عن الموافقة النهائية على أي صورة. ولا يتحمل مقدم الخدمة المسؤولية عن أي غرامات نظامية ناتجة عن محتوى وافق عليه العميل صراحة أو في حال تواجد حقوق ملكية لأي صورة.",
      "العدد: يلتزم العميل بالعدد المذكور سابقاً وفي حال إضافة أي صورة إضافية يتم دفع قيمة {{extraImagePrice}} \u20C1 عن كل صورة وبحد أدنى لا يقل عن {{minExtraImages}} صور.",
    ]),
    clause("حقوق الملكية الفكرية", [
      "مسؤولية الطرف الثاني عن أي صورة من صور المنتجات ولا يتحملها مقدم الخدمة إذا كانت مخالفة.",
    ]),
    clause("القوة القاهرة (الظروف الطارئة)", [
      "لا يُعتبر أي من الطرفين مسؤولاً عن عدم الوفاء بالالتزامات إذا نتج هذا الفشل عن ظروف قاهرة (كوارث طبيعية، حروب، أوامر حكومية) كما هو معرف في نظام المعاملات المدنية السعودي. إذا استمرت الظروف الطارئة لأكثر من {{forceMajeureDays}} يوماً، يحق لكل طرف إنهاء العقد.",
    ]),
    clause("الشروط الجزائية", [
      "لا يحق للعميل في حال مضي الفترة المتفق عليها بالمطالبة بأي مستحقات أو تعويضات في حال تأخر في تسليم صور المنتجات لمقدم الخدمة.",
      "لا يحق للعميل المطالبة بأي مبلغ بعد الدفع في حال التراجع، ويعتبر العقد موافقة نهائية من العميل.",
      "لا يحق للعميل بالتراجع عن العدد أو تقليل الصور، وفي حال تقليل عدد الصور لا يحق له المطالبة بأي مستحقات أو مبالغ مالية.",
    ]),
    clause("إنهاء العقد", [
      "يحق لأي من الطرفين إنهاء العقد بإخطار كتابي إذا أخل الطرف الآخر بأي التزام جوهري من التزاماته بموجب هذا العقد ولم يقم بمعالجة هذا الإخلال خلال {{cureDays}} يوماً من تاريخ إخطاره بذلك.",
    ]),
    clause("القانون الحاكم وتسوية النزاعات", [
      "القانون الحاكم: يخضع هذا العقد لأحكام القوانين في المملكة العربية السعودية، وتحديداً نظام المعاملات المدنية وأحكام الشريعة الإسلامية.",
      "تسوية النزاعات: يحاول الطرفان أولاً تسوية النزاعات ودّياً خلال {{disputeDays}} يوماً. في حالة فشل التسوية الودية تُحال القضية إلى المحاكم المختصة في مدينة {{jurisdictionCity}}. أو بالاتفاق يمكن اللجوء إلى التحكيم عبر مركز الرياض للتجارة الدولية (SCCA).",
    ]),
    clause("ملحقات العقد (إن وجدت)", [
      "يلحق بهذا العقد المستندات الآتية: لا يوجد.",
    ]),
    clause("أحكام ختامية", [
      "يمثل هذا العقد الاتفاق الكامل بين الطرفين ويتكون من {{pageCount}} صفحات.",
      "أي تعديل على العقد يجب أن يكون كتابياً وموقّعاً من الطرفين.",
      "إذا وُجد أن أي حكم من أحكام هذا العقد غير صحيح أو باطل بموجب الشريعة تظل الأحكام المتبقية نافذة المفعول.",
    ]),
  ];
}

export const DEFAULT_CONTRACT_PREAMBLE =
  "حيث أن الطرف الأول شركة تجارية متخصصة في التسويق والدعاية والإعلان والتصميم والبرمجة وحيث أن الطرف الثاني يرغب في الاستفادة من خدمات الطرف الأول فقد التقت إرادة الطرفان على أن يتعاقد الطرفان وذلك حسب البنود التالية:";

export interface ContractTemplateDefinition {
  id: string;
  name: string;
  title: string;
  department: string;
  defaultServices: ContractServiceItem[];
  fields: ContractDynamicField[];
}

export const CONTRACT_TEMPLATES: Record<string, ContractTemplateDefinition> = {
  marketing: {
    id: "marketing",
    name: "عقد خدمات تسويقية وحملات إعلانية",
    title: "عقد اتفاق خدمات تسويقية وإعلانية",
    department: "التسويق الرقمي",
    fields: defaultContractFields(),
    defaultServices: [
      {
        id: uid("srv"),
        name: "إعداد الخطة التسويقية وتحديد الجمهور المستهدف",
        department: "التسويق الرقمي",
        description: "تحليل المنافسين، دراسة الجمهور المستهدف، ووضع استراتيجية الحملات",
        estimatedHours: 15,
        durationDays: 7,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "تحليل السوق والمنافسين", sequenceOrder: 1, estimatedHours: 5 },
          { id: uid("st"), title: "صياغة الرسائل التسويقية", sequenceOrder: 2, estimatedHours: 5 },
          { id: uid("st"), title: "تحديد قنوات الإعلان والميزانيات", sequenceOrder: 3, estimatedHours: 5 },
        ],
      },
      {
        id: uid("srv"),
        name: "إدارة وإطلاق الحملات الإعلانية الممولة",
        department: "التسويق الرقمي",
        description: "إدارة إعلانات سناب شات، إنستغرام، تيك توك، وجوجل",
        estimatedHours: 30,
        durationDays: 30,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "تجهيز الحسابات الإعلانية وتتبع التحويلات", sequenceOrder: 1, estimatedHours: 5 },
          { id: uid("st"), title: "إطلاق الحملات وضبط الاستهداف", sequenceOrder: 2, estimatedHours: 10 },
          { id: uid("st"), title: "تحسين الأداء اليومي وA/B Testing", sequenceOrder: 3, estimatedHours: 15 },
        ],
      },
      {
        id: uid("srv"),
        name: "التقارير الدورية وتحليل العائد على الإنفاق (ROAS)",
        department: "التسويق الرقمي",
        description: "تقديم تقارير أسبوعية وشهرية بأداء الحملات والنتائج",
        estimatedHours: 10,
        durationDays: 30,
        selected: true,
      },
    ],
  },
  ecommerce: {
    id: "ecommerce",
    name: "عقد إدارة ورفع صور متجر إلكتروني",
    title: "عقد اتفاق خدمات إدارة ورفع صور المتجر",
    department: "الإنتاج والتسويق",
    fields: defaultContractFields(),
    defaultServices: [
      {
        id: uid("srv"),
        name: "رفع صور وتسمية المنتجات على المتجر",
        department: "الإنتاج والتسويق",
        description: "رفع صور المنتجات بعدد محدد مع كتابة المسميات بدقة",
        estimatedHours: 25,
        durationDays: 15,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "استلام الصور وتدقيق الجودة والمقاسات", sequenceOrder: 1, estimatedHours: 5 },
          { id: uid("st"), title: "رفع المنتجات وتسميتها على لوحة التحكم", sequenceOrder: 2, estimatedHours: 15 },
          { id: uid("st"), title: "مراجعة الروابط والأسعار وتأكيد الاعتماد", sequenceOrder: 3, estimatedHours: 5 },
        ],
      },
      {
        id: uid("srv"),
        name: "ترتيب وتنسيق تصنيفات المتجر الإلكتروني",
        department: "البرمجة والتطوير",
        description: "تنظيم الأقسام والتصنيفات وتسهيل تجربة التصفح",
        estimatedHours: 10,
        durationDays: 5,
        selected: true,
      },
    ],
  },
  web_development: {
    id: "web_development",
    name: "عقد تصميم وتطوير موقع / متجر إلكتروني",
    title: "عقد اتفاق تصميم وتطوير متجر إلكتروني",
    department: "البرمجة والتطوير",
    fields: [
      field("startDate", "تاريخ بدء التنفيذ", toContractDateIso()),
      field("durationDays", "مدة المشروع (أيام)", "30"),
      field("serviceSummary", "ملخص الخدمة", "تصميم وتطوير متجر إلكتروني متكامل"),
      field("storeUrl", "النطاق المطلوب", "example.com"),
      field("amountExclVat", "القيمة بدون ضريبة", "5000"),
      field("vatRate", "نسبة الضريبة %", "15"),
      field("amountInclVat", "القيمة شامل الضريبة", "5750"),
      field("reviewDays", "مدة المراجعة (أيام عمل)", "3"),
      field("cureDays", "مهلة المعالجة (أيام)", "15"),
      field("disputeDays", "مهلة التسوية الودية (أيام)", "15"),
      field("jurisdictionCity", "مدينة الاختصاص", "الأحساء"),
    ],
    defaultServices: [
      {
        id: uid("srv"),
        name: "تصميم واجهات وتجربة المستخدم UI/UX للمتجر",
        department: "التصميم والهوية",
        description: "تصميم الهيكل التفاعلي وتجربة التصفح المتجاوبة للهواتف والشاشات",
        estimatedHours: 20,
        durationDays: 10,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "تصميم الصفحة الرئيسية وصفحات الأقسام", sequenceOrder: 1, estimatedHours: 8 },
          { id: uid("st"), title: "تصميم صفحات المنتجات وسلة الشراء", sequenceOrder: 2, estimatedHours: 7 },
          { id: uid("st"), title: "اعتماد النموذج المبدئي مع العميل", sequenceOrder: 3, estimatedHours: 5 },
        ],
      },
      {
        id: uid("srv"),
        name: "برمجة وتطوير المتجر وربط بوابات الدفع والشحن",
        department: "البرمجة والتطوير",
        description: "برمجة القوالب وربط بوابات مدى، فيزا، تابي، تمارا، وشركات الشحن",
        estimatedHours: 40,
        durationDays: 15,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "إعداد بيئة العمل وتركيب وتخصيص القالب", sequenceOrder: 1, estimatedHours: 10 },
          { id: uid("st"), title: "تكامل بوابات الدفع الإلكتروني وحسابات الشحن", sequenceOrder: 2, estimatedHours: 15 },
          { id: uid("st"), title: "إعداد صفحات الشروط وسياسات الاسترجاع", sequenceOrder: 3, estimatedHours: 5 },
          { id: uid("st"), title: "فحص الأداء وتوافق المتصفحات والأجهزة", sequenceOrder: 4, estimatedHours: 10 },
        ],
      },
      {
        id: uid("srv"),
        name: "فحص الجودة والإطلاق الرسمي للمتجر",
        department: "البرمجة والتطوير",
        description: "اختبار عمليات الشراء التجريبية وإطلاق المتجر رسمياً",
        estimatedHours: 10,
        durationDays: 5,
        selected: true,
      },
    ],
  },
  social_media: {
    id: "social_media",
    name: "عقد إدارة حسابات التواصل الاجتماعي وصناعة المحتوى",
    title: "عقد اتفاق إدارة وسائل التواصل وصناعة المحتوى",
    department: "صناعة المحتوى",
    fields: [
      field("startDate", "تاريخ بدء التنفيذ", toContractDateIso()),
      field("durationDays", "مدة العقد (أيام)", "30"),
      field("serviceSummary", "ملخص الخدمة", "إدارة حسابات التواصل وصناعة المحتوى والتصاميم"),
      field("amountExclVat", "القيمة الشهرية بدون ضريبة", "3000"),
      field("vatRate", "نسبة الضريبة %", "15"),
      field("amountInclVat", "القيمة شامل الضريبة", "3450"),
      field("reviewDays", "مدة المراجعة (أيام عمل)", "2"),
      field("cureDays", "مهلة المعالجة (أيام)", "15"),
      field("disputeDays", "مهلة التسوية الودية (أيام)", "15"),
      field("jurisdictionCity", "مدينة الاختصاص", "الأحساء"),
    ],
    defaultServices: [
      {
        id: uid("srv"),
        name: "كتابة وإعداد خطة المحتوى الشهري",
        department: "صناعة المحتوى",
        description: "كتابة نصوص البوستات، السيناريوهات، وجدول النشر الشهري",
        estimatedHours: 15,
        durationDays: 7,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "العصف الذهني وموضوعات الشهر", sequenceOrder: 1, estimatedHours: 5 },
          { id: uid("st"), title: "كتابة الكابشنز ونصوص الستوري والريلز", sequenceOrder: 2, estimatedHours: 7 },
          { id: uid("st"), title: "اعتماد خطة النشر مع العميل", sequenceOrder: 3, estimatedHours: 3 },
        ],
      },
      {
        id: uid("srv"),
        name: "تصميم المنشورات والستوريات الإبداعية",
        department: "التصميم والهوية",
        description: "تصميم بوستات، إنفوجرافيك، وبوسترات تفاعلية متناسقة مع الهوية",
        estimatedHours: 25,
        durationDays: 20,
        selected: true,
      },
      {
        id: uid("srv"),
        name: "النشر وإدارة الحسابات والتفاعل مع المتابعين",
        department: "صناعة المحتوى",
        description: "جدولة المنشورات والرد على التعليقات والرسائل الخاصة",
        estimatedHours: 20,
        durationDays: 30,
        selected: true,
      },
    ],
  },
  video_production: {
    id: "video_production",
    name: "عقد إنتاج مرئي وتصوير فوتوغرافي وفيديو",
    title: "عقد اتفاق خدمات الإنتاج والتصوير المرئي",
    department: "الإنتاج والتصوير",
    fields: [
      field("startDate", "تاريخ بدء التنفيذ", toContractDateIso()),
      field("durationDays", "مدة العمل (أيام)", "14"),
      field("serviceSummary", "ملخص الخدمة", "تصوير إعلاني احترافي مع المونتاج وتعديل الألوان"),
      field("amountExclVat", "القيمة بدون ضريبة", "4000"),
      field("vatRate", "نسبة الضريبة %", "15"),
      field("amountInclVat", "القيمة شامل الضريبة", "4600"),
      field("reviewDays", "مدة المراجعة (أيام عمل)", "2"),
      field("cureDays", "مهلة المعالجة (أيام)", "15"),
      field("disputeDays", "مهلة التسوية الودية (أيام)", "15"),
      field("jurisdictionCity", "مدينة الاختصاص", "الأحساء"),
    ],
    defaultServices: [
      {
        id: uid("srv"),
        name: "التصوير الميداني للمنتجات والمقر والمشاهد",
        department: "الإنتاج والتصوير",
        description: "جلسات تصوير سينمائي وفوتوغرافي باستخدام كاميرات وإضاءات احترافية",
        estimatedHours: 12,
        durationDays: 3,
        selected: true,
        subtasks: [
          { id: uid("st"), title: "تجهيز موقع التصوير والإضاءات", sequenceOrder: 1, estimatedHours: 3 },
          { id: uid("st"), title: "تنفيذ جلسة التصوير وتسجيل اللقطات", sequenceOrder: 2, estimatedHours: 7 },
          { id: uid("st"), title: "فرز واختيار أفضل اللقطات", sequenceOrder: 3, estimatedHours: 2 },
        ],
      },
      {
        id: uid("srv"),
        name: "المونتاج وتعديل الألوان والمؤثرات الصوتية",
        department: "المونتاج والإنتاج",
        description: "تحرير الفيديو، إضافة المؤثرات البصرية، والموسيقى المرخصة",
        estimatedHours: 18,
        durationDays: 7,
        selected: true,
      },
    ],
  },
};

export function createDefaultContractForm(
  overrides?: Partial<ContractFormDraft>,
  templateId = "marketing"
): ContractFormDraft {
  const today = toContractDateIso();
  const tmpl = CONTRACT_TEMPLATES[templateId] || CONTRACT_TEMPLATES.marketing;

  return {
    title: tmpl.title,
    contractType: tmpl.id,
    contractNumber: formatContractNumber(),
    contractDateIso: today,
    preamble: DEFAULT_CONTRACT_PREAMBLE,
    provider: defaultProviderParty(),
    client: emptyClientParty(),
    fields: tmpl.fields,
    clauses: defaultContractClauses(),
    services: tmpl.defaultServices,
    pageCount: "4",
    signatureDateIso: today,
    ...overrides,
  };
}
