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

export function createDefaultContractForm(
  overrides?: Partial<ContractFormDraft>
): ContractFormDraft {
  const today = toContractDateIso();
  return {
    title: "عقد اتفاق خدمات تسويقية",
    contractNumber: formatContractNumber(),
    contractDateIso: today,
    preamble: DEFAULT_CONTRACT_PREAMBLE,
    provider: defaultProviderParty(),
    client: emptyClientParty(),
    fields: defaultContractFields(),
    clauses: defaultContractClauses(),
    pageCount: "4",
    signatureDateIso: today,
    ...overrides,
  };
}
