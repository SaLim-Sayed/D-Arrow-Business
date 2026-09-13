import { useState, useEffect, useRef } from "react";
import {
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  Button,
  Input,
  Select,
  SelectItem,
  Chip,
  Divider,
} from "@heroui/react";
import {
  FileText,
  Bold,
  Italic,
  Underline,
  List,
  ListOrdered,
  Heading1,
  Heading2,
  Heading3,
  Quote,
  Smile,
  Meh,
  AlertTriangle,
  Flame,
  Star,
  Plus,
  Trash2,
  CheckCircle,
  Save,
  Send,
  Calendar,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useContactsQuery, useDealsQuery } from "../hooks";
import {
  useCreateClientReportMutation,
  useUpdateClientReportMutation,
} from "../hooks/use-client-reports";
import type {
  ClientReport,
  ClientReportType,
  ClientMood,
  ReportActionItem,
} from "../types/client-reports.types";

interface ClientReportEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialReport?: ClientReport | null;
  initialContactId?: string;
  initialDealId?: string;
}

const MOOD_OPTIONS: { key: ClientMood; labelAr: string; labelEn: string; color: "success" | "default" | "warning" | "danger"; icon: any }[] = [
  { key: "satisfied", labelAr: "مرتاح / راضٍ", labelEn: "Satisfied", color: "success", icon: Smile },
  { key: "neutral", labelAr: "محايد", labelEn: "Neutral", color: "default", icon: Meh },
  { key: "needs_attention", labelAr: "يحتاج متابعة", labelEn: "Needs Attention", color: "warning", icon: AlertTriangle },
  { key: "at_risk", labelAr: "في خطر / معترض", labelEn: "At Risk", color: "danger", icon: Flame },
];

const REPORT_TYPES: { key: ClientReportType; labelAr: string; labelEn: string }[] = [
  { key: "meeting_summary", labelAr: "ملخص اجتماع عميل", labelEn: "Meeting Summary" },
  { key: "status_update", labelAr: "متابعة وتحديث حالة", labelEn: "Status Update" },
  { key: "sales_pitch", labelAr: "تقرير عرض مبيعات", labelEn: "Sales Pitch" },
  { key: "complaint_resolution", labelAr: "معالجة شكوى", labelEn: "Complaint Resolution" },
  { key: "quarterly_review", labelAr: "مراجعة دورية / ربع سنوية", labelEn: "Quarterly Review" },
  { key: "general", labelAr: "تقرير عام", labelEn: "General Report" },
];

export function ClientReportEditorModal({
  isOpen,
  onClose,
  initialReport,
  initialContactId,
  initialDealId,
}: ClientReportEditorModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const { data: contactsData } = useContactsQuery();
  const { data: dealsData } = useDealsQuery();

  const contacts = contactsData?.data || [];
  const deals = dealsData?.data || [];

  const createMutation = useCreateClientReportMutation();
  const updateMutation = useUpdateClientReportMutation();

  const [contactId, setContactId] = useState(initialContactId || "");
  const [dealId, setDealId] = useState(initialDealId || "");
  const [title, setTitle] = useState("");
  const [reportType, setReportType] = useState<ClientReportType>("meeting_summary");
  const [content, setContent] = useState("");
  const [clientMood, setClientMood] = useState<ClientMood>("satisfied");
  const [satisfactionRating, setSatisfactionRating] = useState<number>(5);
  const [outcomes, setOutcomes] = useState<string[]>([]);
  const [newOutcome, setNewOutcome] = useState("");
  const [actionItems, setActionItems] = useState<ReportActionItem[]>([]);
  const [newActionText, setNewActionText] = useState("");
  const [newActionDate, setNewActionDate] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (initialReport) {
      setContactId(initialReport.contactId);
      setDealId(initialReport.dealId || "");
      setTitle(initialReport.title);
      setReportType(initialReport.reportType);
      setContent(initialReport.content);
      setClientMood(initialReport.clientMood);
      setSatisfactionRating(initialReport.satisfactionRating || 5);
      setOutcomes(initialReport.keyOutcomes || []);
      setActionItems(initialReport.actionItems || []);
    } else {
      setContactId(initialContactId || (contacts.length > 0 ? contacts[0].id : ""));
      setDealId(initialDealId || "");
      setTitle("");
      setReportType("meeting_summary");
      setContent("");
      setClientMood("satisfied");
      setSatisfactionRating(5);
      setOutcomes([]);
      setActionItems([]);
    }
  }, [initialReport, initialContactId, initialDealId, isOpen]);

  const insertFormatting = (prefix: string, suffix: string = "") => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selectedText = content.substring(start, end);

    const replacement = prefix + (selectedText || (isAr ? "نص مكتوب" : "text")) + suffix;
    const updated = content.substring(0, start) + replacement + content.substring(end);

    setContent(updated);

    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + selectedText.length);
    }, 50);
  };

  const addOutcome = () => {
    if (!newOutcome.trim()) return;
    setOutcomes((prev) => [...prev, newOutcome.trim()]);
    setNewOutcome("");
  };

  const removeOutcome = (idx: number) => {
    setOutcomes((prev) => prev.filter((_, i) => i !== idx));
  };

  const addActionItem = () => {
    if (!newActionText.trim()) return;
    const newItem: ReportActionItem = {
      id: "act_" + Date.now(),
      text: newActionText.trim(),
      done: false,
      dueDate: newActionDate || undefined,
    };
    setActionItems((prev) => [...prev, newItem]);
    setNewActionText("");
    setNewActionDate("");
  };

  const removeActionItem = (id: string) => {
    setActionItems((prev) => prev.filter((item) => item.id !== id));
  };

  const toggleActionDone = (id: string) => {
    setActionItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, done: !item.done } : item))
    );
  };

  const handleSave = async (status: "draft" | "submitted") => {
    if (!contactId) {
      alert(isAr ? "الرجاء اختيار العميل" : "Please select a client contact");
      return;
    }
    if (!title.trim()) {
      alert(isAr ? "الرجاء إدخال عنوان التقرير" : "Please enter report title");
      return;
    }

    const selectedContact = contacts.find((c) => c.id === contactId);
    const selectedDeal = deals.find((d) => d.id === dealId);

    const contactName = selectedContact
      ? `${selectedContact.firstName} ${selectedContact.lastName}`.trim() || selectedContact.email
      : isAr
      ? "عميل"
      : "Client";

    const payload = {
      contactId,
      contactName,
      dealId: dealId || undefined,
      dealTitle: selectedDeal ? selectedDeal.title : undefined,
      title: title.trim(),
      reportType,
      content,
      keyOutcomes: outcomes,
      actionItems,
      clientMood,
      satisfactionRating,
      status,
    };

    if (initialReport) {
      await updateMutation.mutateAsync({ id: initialReport.id, data: payload });
    } else {
      await createMutation.mutateAsync(payload);
    }
    onClose();
  };

  const isSaving = createMutation.isPending || updateMutation.isPending;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="4xl"
      scrollBehavior="inside"
      backdrop="blur"
      className="max-h-[92vh]"
    >
      <ModalContent className="bg-slate-900 text-slate-100 border border-slate-800">
        <ModalHeader className="flex flex-col gap-1 border-b border-slate-800/80 pb-4 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-slate-100">
                {initialReport
                  ? isAr
                    ? "تعديل تقرير العميل"
                    : "Edit Client Report"
                  : isAr
                  ? "محرر تقارير العملاء احترافي (مستند Word)"
                  : "Professional Client Report Editor (Word Document)"}
              </h3>
              <p className="text-xs text-slate-400">
                {isAr
                  ? "اكتب تقريراً مهيكلاً وموثقاً للعميل مع تنسيق مستندات متكامل وتحديد التوصيات والخطوات القادمة"
                  : "Draft a structured, formatted Word report for the client with action items and key outcomes."}
              </p>
            </div>
          </div>
        </ModalHeader>

        <ModalBody className="p-6 gap-6 bg-slate-900 overflow-y-auto">
          {/* Section 1: Client & Metadata Selection */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            {/* Select Contact */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "العميل / جهة الاتصال *" : "Client Contact *"}
              </label>
              <select
                value={contactId}
                onChange={(e) => setContactId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">{isAr ? "-- اختر العميل --" : "-- Select Client --"}</option>
                {contacts.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.firstName} {c.lastName} ({c.companyName || c.email})
                  </option>
                ))}
              </select>
            </div>

            {/* Select Deal */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "الصفقة المرتبطة (اختياري)" : "Linked Deal (Optional)"}
              </label>
              <select
                value={dealId}
                onChange={(e) => setDealId(e.target.value)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                <option value="">{isAr ? "بدون صفقة محددة" : "No Specific Deal"}</option>
                {deals.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.title} ({d.value?.toLocaleString()} SAR)
                  </option>
                ))}
              </select>
            </div>

            {/* Select Report Type */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "نوع التقرير *" : "Report Type *"}
              </label>
              <select
                value={reportType}
                onChange={(e) => setReportType(e.target.value as ClientReportType)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                {REPORT_TYPES.map((rt) => (
                  <option key={rt.key} value={rt.key}>
                    {isAr ? rt.labelAr : rt.labelEn}
                  </option>
                ))}
              </select>
            </div>

            {/* Client Mood */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                {isAr ? "انطباع / حالة العميل" : "Client Mood / Impression"}
              </label>
              <select
                value={clientMood}
                onChange={(e) => setClientMood(e.target.value as ClientMood)}
                className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2.5 focus:outline-none focus:border-blue-500"
              >
                {MOOD_OPTIONS.map((m) => (
                  <option key={m.key} value={m.key}>
                    {isAr ? m.labelAr : m.labelEn}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Title and Satisfaction Rating */}
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="flex-1 w-full">
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                {isAr ? "عنوان التقرير المستندي *" : "Report Title *"}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={
                  isAr
                    ? "مثال: تقرير اجتماع مراجعة المتطلبات - شركة الأمل"
                    : "e.g. Requirements Review Meeting Summary - Al-Amal Co."
                }
                className="w-full bg-slate-950 border border-slate-700 text-slate-100 text-base font-semibold rounded-xl px-4 py-2.5 focus:outline-none focus:border-blue-500 placeholder-slate-500"
              />
            </div>

            {/* Star Rating */}
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-3">
              <span className="text-xs text-slate-400 whitespace-nowrap font-medium">
                {isAr ? "تقييم العميل:" : "Satisfaction:"}
              </span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setSatisfactionRating(star)}
                    className="p-1 hover:scale-110 transition-transform"
                  >
                    <Star
                      className={`w-5 h-5 ${
                        star <= satisfactionRating
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-600"
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Section 2: Word-like Document Canvas */}
          <div className="rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl">
            {/* Word Formatting Toolbar */}
            <div className="bg-slate-900 border-b border-slate-800 p-2 flex flex-wrap items-center gap-1.5 text-slate-300">
              <div className="text-xs font-bold text-blue-400 px-2 py-1 bg-blue-500/10 rounded-md border border-blue-500/20">
                Word Editor
              </div>
              <div className="h-5 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => insertFormatting("**", "**")}
                title="Bold (غليظ)"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Bold className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("*", "*")}
                title="Italic (مائل)"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Italic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("<u>", "</u>")}
                title="Underline (تحته خط)"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Underline className="w-4 h-4" />
              </button>

              <div className="h-5 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => insertFormatting("# ")}
                title="Heading 1"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Heading1 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("## ")}
                title="Heading 2"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Heading2 className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("### ")}
                title="Heading 3"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <Heading3 className="w-4 h-4" />
              </button>

              <div className="h-5 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => insertFormatting("- ")}
                title="Bullet List"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => insertFormatting("1. ")}
                title="Numbered List"
                className="p-2 hover:bg-slate-800 rounded-lg text-slate-300 hover:text-white transition-colors"
              >
                <ListOrdered className="w-4 h-4" />
              </button>

              <div className="h-5 w-[1px] bg-slate-800 mx-1" />

              <button
                type="button"
                onClick={() => insertFormatting("\n> 💡 **ملاحظة رئيسية:** ", "\n")}
                title="Callout Box"
                className="p-2 hover:bg-slate-800 rounded-lg text-amber-400 hover:text-amber-300 transition-colors"
              >
                <Quote className="w-4 h-4" />
              </button>
            </div>

            {/* Simulated Word Sheet Canvas */}
            <div className="p-6 md:p-8 bg-slate-900/40 min-h-[300px] flex justify-center">
              <div className="w-full max-w-3xl bg-slate-950 border border-slate-800/80 rounded-xl p-6 md:p-8 shadow-inner font-sans">
                <textarea
                  ref={textareaRef}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  rows={12}
                  placeholder={
                    isAr
                      ? "اكتب تفاصيل التقرير هنا...\n\n# 1. تفاصيل الاجتماع\nتمت مناقشة النقاط الرئيسية والاتفاق على الخطة التشغيلية.\n\n# 2. الملاحظات الهامة\n> 💡 ملاحظة: يبدي العميل اهتماماً كبيراً بتسريع التنفيذ."
                      : "Write detailed report here...\n\n# 1. Meeting Details\nDiscussed key requirements and finalized project plan.\n\n> 💡 Note: Client expressed strong interest in accelerated delivery."
                  }
                  className="w-full h-full bg-transparent border-0 focus:ring-0 focus:outline-none text-slate-200 placeholder-slate-600 resize-y leading-relaxed text-sm md:text-base font-normal font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 3: Key Outcomes / Highlights */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-emerald-400" />
              {isAr ? "أهم نتائج ومخرجات الاجتماع/التقرير" : "Key Outcomes & Takeaways"}
            </h4>

            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newOutcome}
                onChange={(e) => setNewOutcome(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addOutcome())}
                placeholder={isAr ? "أضف نتيجة أ ومخرج رئيسي..." : "Add a key outcome..."}
                className="flex-1 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <Button color="primary" variant="flat" size="sm" onClick={addOutcome} className="rounded-xl font-semibold">
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة" : "Add"}
              </Button>
            </div>

            <div className="flex flex-wrap gap-2">
              {outcomes.map((out, idx) => (
                <Chip
                  key={idx}
                  onClose={() => removeOutcome(idx)}
                  variant="flat"
                  color="success"
                  className="bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 py-1"
                >
                  {out}
                </Chip>
              ))}
              {outcomes.length === 0 && (
                <span className="text-xs text-slate-500 italic">
                  {isAr ? "لم يتم إضافة نتائج رئيسية بعد" : "No outcomes added yet"}
                </span>
              )}
            </div>
          </div>

          {/* Section 4: Action Items & Follow-ups Checklist */}
          <div className="p-4 rounded-2xl bg-slate-950/60 border border-slate-800">
            <h4 className="text-sm font-bold text-slate-200 mb-3 flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              {isAr ? "قائمة المهام والخطوات القادمة للعميل (Action Items)" : "Action Items & Follow-ups"}
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-2 mb-4">
              <input
                type="text"
                value={newActionText}
                onChange={(e) => setNewActionText(e.target.value)}
                placeholder={isAr ? "الوصف: إرسال عرض السعر المعدل..." : "Description: Send updated proposal..."}
                className="md:col-span-7 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <input
                type="date"
                value={newActionDate}
                onChange={(e) => setNewActionDate(e.target.value)}
                className="md:col-span-3 bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none focus:border-blue-500"
              />
              <Button color="secondary" variant="flat" size="sm" onClick={addActionItem} className="md:col-span-2 rounded-xl font-semibold">
                <Plus className="w-4 h-4" />
                {isAr ? "إضافة مهمة" : "Add Task"}
              </Button>
            </div>

            <div className="space-y-2">
              {actionItems.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-slate-900/80 border border-slate-800 rounded-xl p-3"
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={item.done}
                      onChange={() => toggleActionDone(item.id)}
                      className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 bg-slate-950 border-slate-700"
                    />
                    <span
                      className={`text-sm ${
                        item.done ? "line-through text-slate-500" : "text-slate-200"
                      }`}
                    >
                      {item.text}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    {item.dueDate && (
                      <span className="text-xs text-blue-400 bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 rounded-lg">
                        {item.dueDate}
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => removeActionItem(item.id)}
                      className="text-slate-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
              {actionItems.length === 0 && (
                <span className="text-xs text-slate-500 italic block">
                  {isAr ? "لم يتم تحديد خطوات متابعة بعد" : "No action items added yet"}
                </span>
              )}
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-slate-800 bg-slate-950/60 p-4 flex justify-between">
          <Button variant="flat" color="default" onClick={onClose} className="rounded-xl">
            {isAr ? "إلغاء" : "Cancel"}
          </Button>

          <div className="flex gap-2">
            <Button
              variant="flat"
              color="warning"
              isLoading={isSaving}
              onClick={() => handleSave("draft")}
              className="rounded-xl font-semibold"
            >
              <Save className="w-4 h-4" />
              {isAr ? "حفظ كمسودة" : "Save Draft"}
            </Button>
            <Button
              color="primary"
              isLoading={isSaving}
              onClick={() => handleSave("submitted")}
              className="rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20"
            >
              <Send className="w-4 h-4" />
              {isAr ? "إعتماد وإرسال التقرير" : "Submit Report"}
            </Button>
          </div>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
