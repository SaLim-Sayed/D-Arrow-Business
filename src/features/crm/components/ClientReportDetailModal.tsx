import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button, Chip } from "@heroui/react";
import {
  FileText,
  Printer,
  Edit,
  Trash2,
  Calendar,
  User,
  Building,
  Star,
  CheckCircle,
  Smile,
  Meh,
  AlertTriangle,
  Flame,
  Briefcase,
  Share2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { ClientReport } from "../types/client-reports.types";

interface ClientReportDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: ClientReport | null;
  onEdit?: (report: ClientReport) => void;
  onDelete?: (reportId: string) => void;
}

const MOOD_CONFIG: Record<string, { labelAr: string; labelEn: string; color: "success" | "default" | "warning" | "danger"; icon: any }> = {
  satisfied: { labelAr: "مرتاح / راضٍ", labelEn: "Satisfied", color: "success", icon: Smile },
  neutral: { labelAr: "محايد", labelEn: "Neutral", color: "default", icon: Meh },
  needs_attention: { labelAr: "يحتاج متابعة", labelEn: "Needs Attention", color: "warning", icon: AlertTriangle },
  at_risk: { labelAr: "في خطر / معترض", labelEn: "At Risk", color: "danger", icon: Flame },
};

const REPORT_TYPES: Record<string, { ar: string; en: string }> = {
  meeting_summary: { ar: "ملخص اجتماع", en: "Meeting Summary" },
  status_update: { ar: "تحديث حالة", en: "Status Update" },
  sales_pitch: { ar: "عرض مبيعات", en: "Sales Pitch" },
  complaint_resolution: { ar: "معالجة شكوى", en: "Complaint Resolution" },
  quarterly_review: { ar: "مراجعة دورية", en: "Quarterly Review" },
  general: { ar: "تقرير عام", en: "General Report" },
};

export function ClientReportDetailModal({
  isOpen,
  onClose,
  report,
  onEdit,
  onDelete,
}: ClientReportDetailModalProps) {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  if (!report) return null;

  const moodInfo = MOOD_CONFIG[report.clientMood] || MOOD_CONFIG.satisfied;
  const MoodIcon = moodInfo.icon;
  const typeLabel = REPORT_TYPES[report.reportType]?.[isAr ? "ar" : "en"] || report.reportType;

  const handlePrint = () => {
    window.print();
  };

  const renderContentLines = (raw: string) => {
    if (!raw) return <p className="text-slate-400 italic">{isAr ? "لا يوجد محتوى تفصيلي" : "No content written"}</p>;

    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl font-black text-slate-900 dark:text-white mt-6 mb-3 border-b pb-2 border-slate-200 dark:border-slate-800">
            {trimmed.replace("# ", "")}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-5 mb-2">
            {trimmed.replace("## ", "")}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">
            {trimmed.replace("### ", "")}
          </h3>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="p-4 my-4 bg-amber-500/10 border-r-4 border-amber-500 rounded-lg text-amber-900 dark:text-amber-200 font-medium">
            {trimmed.replace("> ", "")}
          </blockquote>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="ms-6 list-disc text-slate-700 dark:text-slate-300 my-1">
            {trimmed.substring(2)}
          </li>
        );
      }
      if (!trimmed) return <div key={idx} className="h-3" />;

      return (
        <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed my-1.5 text-base">
          {trimmed}
        </p>
      );
    });
  };

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
        <ModalHeader className="flex justify-between items-center border-b border-slate-800/80 pb-4 bg-slate-950/60 print:hidden">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-600/20 border border-blue-500/30 text-blue-400">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                  {typeLabel}
                </span>
                <Chip size="sm" color={moodInfo.color} variant="flat" className="gap-1 font-semibold">
                  <MoodIcon className="w-3.5 h-3.5" />
                  {isAr ? moodInfo.labelAr : moodInfo.labelEn}
                </Chip>
              </div>
              <h3 className="text-lg font-bold text-slate-100 mt-1">{report.title}</h3>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button size="sm" variant="flat" color="primary" onClick={handlePrint} className="rounded-xl font-semibold">
              <Printer className="w-4 h-4" />
              {isAr ? "طباعة / PDF" : "Print / PDF"}
            </Button>
            {onEdit && (
              <Button size="sm" variant="flat" color="warning" onClick={() => onEdit(report)} className="rounded-xl font-semibold">
                <Edit className="w-4 h-4" />
                {isAr ? "تعديل" : "Edit"}
              </Button>
            )}
            {onDelete && (
              <Button size="sm" variant="flat" color="danger" onClick={() => onDelete(report.id)} className="rounded-xl font-semibold">
                <Trash2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </ModalHeader>

        <ModalBody className="p-6 md:p-8 bg-slate-950 overflow-y-auto">
          {/* Printable Word Document Sheet */}
          <div className="bg-white text-slate-900 rounded-xl p-8 md:p-12 shadow-2xl border border-slate-200 print:shadow-none print:border-none font-sans min-h-[700px]">
            {/* Header Document Bar */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-8 border-b-2 border-slate-900 gap-4">
              <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">{report.title}</h1>
                <p className="text-sm font-bold text-blue-600 mt-1">
                  {typeLabel} - {isAr ? "تقرير توثيقي للعميل" : "Official Client Report Document"}
                </p>
              </div>
              <div className="text-end text-xs text-slate-500 font-medium">
                <div>{isAr ? "تاريخ التقرير:" : "Report Date:"} {new Date(report.createdAt).toLocaleDateString("ar-SA")}</div>
                <div className="mt-0.5">{isAr ? "معرف التقرير:" : "Report ID:"} #{report.id.substring(0, 8)}</div>
              </div>
            </div>

            {/* Meta Cards: Client & Author Info */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-xl border border-slate-200 text-slate-700 text-sm">
              <div className="flex items-center gap-3">
                <User className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <span className="text-xs text-slate-400 block font-medium">{isAr ? "العميل المستهدف:" : "Client Contact:"}</span>
                  <span className="font-bold text-slate-900">{report.contactName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Building className="w-5 h-5 text-indigo-600 shrink-0" />
                <div>
                  <span className="text-xs text-slate-400 block font-medium">{isAr ? "مُعد التقرير (الموظف):" : "Author (Staff):"}</span>
                  <span className="font-bold text-slate-900">{report.authorName}</span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Briefcase className="w-5 h-5 text-amber-500 shrink-0" />
                <div>
                  <span className="text-xs text-slate-400 block font-medium">{isAr ? "الصفقة المرتبطة:" : "Linked Deal:"}</span>
                  <span className="font-bold text-slate-900">{report.dealTitle || (isAr ? "عام" : "General")}</span>
                </div>
              </div>
            </div>

            {/* Satisfaction & Mood Ribbon */}
            <div className="flex items-center justify-between bg-blue-50 border border-blue-200 p-4 rounded-xl mb-8">
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600">{isAr ? "انطباع العميل:" : "Client Impression:"}</span>
                <span className="text-sm font-bold text-blue-900 flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-blue-200">
                  <MoodIcon className="w-4 h-4 text-amber-500" />
                  {isAr ? moodInfo.labelAr : moodInfo.labelEn}
                </span>
              </div>

              {report.satisfactionRating && (
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`w-4 h-4 ${
                        star <= report.satisfactionRating!
                          ? "text-amber-400 fill-amber-400"
                          : "text-slate-300"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Main Word Content */}
            <div className="prose max-w-none mb-10">
              {renderContentLines(report.content)}
            </div>

            {/* Key Outcomes Section */}
            {report.keyOutcomes && report.keyOutcomes.length > 0 && (
              <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <h4 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-600" />
                  {isAr ? "أهم مخرجات وتوصيات التقرير:" : "Key Outcomes & Takeaways:"}
                </h4>
                <ul className="space-y-1.5">
                  {report.keyOutcomes.map((out, idx) => (
                    <li key={idx} className="flex items-center gap-2 text-sm font-medium text-emerald-950">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      {out}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Items Checklist Section */}
            {report.actionItems && report.actionItems.length > 0 && (
              <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-xl">
                <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-blue-600" />
                  {isAr ? "خطة المتابعة والمهام (Action Items):" : "Action Items & Next Steps:"}
                </h4>
                <div className="space-y-2">
                  {report.actionItems.map((item) => (
                    <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 p-2.5 rounded-lg">
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" readOnly checked={item.done} className="w-4 h-4 rounded text-blue-600" />
                        <span className={`text-sm font-medium ${item.done ? "line-through text-slate-400" : "text-slate-800"}`}>
                          {item.text}
                        </span>
                      </div>
                      {item.dueDate && (
                        <span className="text-xs font-semibold bg-slate-100 text-slate-600 px-2.5 py-1 rounded-md border border-slate-200">
                          {item.dueDate}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Official Document Footer */}
            <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
              <div>
                <div>{isAr ? "تم الإنشاء بواسطة نظام إدارة علاقات العملاء (D-Arrow CRM)" : "Generated via D-Arrow CRM System"}</div>
                <div>{new Date().toLocaleDateString("ar-SA")}</div>
              </div>
              <div className="text-end">
                <div className="font-bold text-slate-700">{report.authorName}</div>
                <div>{isAr ? "توقيع ومصادقة الموظف" : "Staff Author Signature"}</div>
              </div>
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="border-t border-slate-800 bg-slate-950/60 p-4 flex justify-between print:hidden">
          <Button variant="flat" color="default" onClick={onClose} className="rounded-xl">
            {isAr ? "إغلاق" : "Close"}
          </Button>
          <Button color="primary" onClick={handlePrint} className="rounded-xl font-semibold">
            <Printer className="w-4 h-4" />
            {isAr ? "طباعة التقرير المستندي" : "Print Word Document"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
