import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button, Spinner, Chip } from "@heroui/react";
import {
  FileText,
  Printer,
  Share2,
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
  ShieldCheck,
  Check,
  Globe,
} from "lucide-react";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import type { ClientReport, ClientMood } from "../types/client-reports.types";

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

export default function PublicClientReportPage() {
  const { companyId, reportId } = useParams<{ companyId: string; reportId: string }>();
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [report, setReport] = useState<ClientReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!companyId || !reportId) {
      setError(isAr ? "رابط التقرير غير مكتمل" : "Invalid report link");
      setLoading(false);
      return;
    }

    const fetchPublicReport = async () => {
      try {
        const docRef = doc(db, "companies", companyId, "client_reports", reportId);
        const snap = await getDoc(docRef);
        if (!snap.exists()) {
          setError(isAr ? "التقرير غير موجود أو تم إزالته" : "Report not found");
        } else {
          const data = snap.data();
          setReport({
            id: snap.id,
            companyId: (data.companyId as string) || companyId,
            contactId: (data.contactId as string) || "",
            contactName: (data.contactName as string) || "",
            dealId: data.dealId as string | undefined,
            dealTitle: data.dealTitle as string | undefined,
            authorId: (data.authorId as string) || "",
            authorName: (data.authorName as string) || "",
            authorEmail: data.authorEmail as string | undefined,
            title: (data.title as string) || "",
            description: data.description as string | undefined,
            internalNotes: undefined, // Always strip internal confidential notes for public views
            reportType: (data.reportType as ClientReport["reportType"]) || "general",
            content: (data.content as string) || "",
            keyOutcomes: Array.isArray(data.keyOutcomes) ? data.keyOutcomes : [],
            actionItems: Array.isArray(data.actionItems) ? data.actionItems : [],
            clientMood: (data.clientMood as ClientMood) || "satisfied",
            satisfactionRating: typeof data.satisfactionRating === "number" ? data.satisfactionRating : 5,
            status: (data.status as ClientReport["status"]) || "submitted",
            reviewedBy: data.reviewedBy as string | undefined,
            reviewedByName: data.reviewedByName as string | undefined,
            reviewedAt: data.reviewedAt as string | undefined,
            createdAt: (data.createdAt?.toDate?.()?.toISOString()) || new Date().toISOString(),
            updatedAt: (data.updatedAt?.toDate?.()?.toISOString()) || new Date().toISOString(),
          });
        }
      } catch (err: any) {
        setError(err.message || (isAr ? "فشل تحميل التقرير" : "Failed to load report"));
      } finally {
        setLoading(false);
      }
    };

    fetchPublicReport();
  }, [companyId, reportId, isAr]);

  const handlePrint = () => {
    const el = document.getElementById("public-printable-sheet");
    if (!el) {
      window.print();
      return;
    }

    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    iframe.style.zIndex = "-1000";

    document.body.appendChild(iframe);

    const docObj = iframe.contentWindow?.document;
    if (!docObj) return;

    const styles = Array.from(document.querySelectorAll("style, link[rel='stylesheet']"))
      .map((s) => s.outerHTML)
      .join("\n");

    docObj.open();
    docObj.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}" lang="${isAr ? "ar" : "en"}">
        <head>
          <title>${report?.title || "Report"}</title>
          ${styles}
          <style>
            body {
              font-family: "IBM Plex Sans Arabic", "Inter", sans-serif !important;
              background: #ffffff !important;
              color: #000000 !important;
              margin: 0 !important;
              padding: 12mm !important;
              direction: ${isAr ? "rtl" : "ltr"};
              text-align: ${isAr ? "right" : "left"};
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
            }
            * {
              color: #000000 !important;
              -webkit-text-fill-color: #000000 !important;
              box-shadow: none !important;
            }
            .print\\:hidden { display: none !important; }
            @page {
              size: A4 portrait;
              margin: 10mm;
            }
          </style>
        </head>
        <body dir="${isAr ? "rtl" : "ltr"}">
          <div style="width: 100%; background: #ffffff; color: #000000; direction: ${isAr ? "rtl" : "ltr"}; text-align: ${isAr ? "right" : "left"};">
            ${el.innerHTML}
          </div>
        </body>
      </html>
    `);
    docObj.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) {
          document.body.removeChild(iframe);
        }
      }, 1000);
    }, 350);
  };

  const handleCopyLink = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const renderFormattedText = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith("**") && part.endsWith("**")) {
        return (
          <strong key={i} className="font-bold text-slate-900 dark:text-white">
            {part.slice(2, -2)}
          </strong>
        );
      }
      return part;
    });
  };

  const renderContentLines = (raw: string) => {
    if (!raw) return <p className="text-slate-400 italic">{isAr ? "لا يوجد محتوى تفصيلي" : "No content written"}</p>;

    const lines = raw.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (trimmed.startsWith("# ")) {
        return (
          <h1 key={idx} className="text-2xl font-black text-slate-900 dark:text-white mt-6 mb-3 border-b pb-2 border-slate-200 dark:border-slate-800">
            {renderFormattedText(trimmed.replace("# ", ""))}
          </h1>
        );
      }
      if (trimmed.startsWith("## ")) {
        return (
          <h2 key={idx} className="text-xl font-bold text-slate-800 dark:text-slate-100 mt-5 mb-2">
            {renderFormattedText(trimmed.replace("## ", ""))}
          </h2>
        );
      }
      if (trimmed.startsWith("### ")) {
        return (
          <h3 key={idx} className="text-lg font-semibold text-slate-800 dark:text-slate-200 mt-4 mb-2">
            {renderFormattedText(trimmed.replace("### ", ""))}
          </h3>
        );
      }
      if (trimmed.startsWith("> ")) {
        return (
          <blockquote key={idx} className="p-4 my-4 bg-amber-500/10 border-r-4 border-amber-500 rounded-lg text-amber-900 dark:text-amber-200 font-medium">
            {renderFormattedText(trimmed.replace("> ", ""))}
          </blockquote>
        );
      }
      if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
        return (
          <li key={idx} className="ms-6 list-disc text-slate-700 dark:text-slate-300 my-1">
            {renderFormattedText(trimmed.substring(2))}
          </li>
        );
      }
      if (!trimmed) return <div key={idx} className="h-3" />;

      return (
        <p key={idx} className="text-slate-700 dark:text-slate-300 leading-relaxed my-1.5 text-base">
          {renderFormattedText(trimmed)}
        </p>
      );
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center text-white gap-3 p-6">
        <Spinner size="lg" color="primary" />
        <p className="text-sm font-semibold">{isAr ? "جاري تحميل التقرير المستندي..." : "Loading report..."}</p>
      </div>
    );
  }

  if (error || !report) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-slate-200 gap-4 p-6 text-center">
        <div className="p-4 rounded-2xl bg-danger/10 text-danger border border-danger/20">
          <FileText className="w-12 h-12" />
        </div>
        <h2 className="text-xl font-bold">{error || (isAr ? "التقرير غير متاح" : "Report Unavailable")}</h2>
        <p className="text-sm text-slate-400 max-w-sm">
          {isAr ? "تأكد من صحة الرابط أو اطلب من مبيعات الشركة تزويدك برابط مباشر جديد." : "Check the URL or request a new direct share link."}
        </p>
      </div>
    );
  }

  const moodInfo = MOOD_CONFIG[report.clientMood] || MOOD_CONFIG.satisfied;
  const MoodIcon = moodInfo.icon;
  const typeLabel = REPORT_TYPES[report.reportType]?.[isAr ? "ar" : "en"] || report.reportType;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-slate-950 text-slate-100 font-sans pb-16">
      {/* Top Floating Header Bar */}
      <div className="sticky top-0 z-30 bg-slate-900/90 backdrop-blur-md border-b border-slate-800 px-4 py-3 print:hidden">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-blue-600 text-white shadow-md">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-xs text-blue-400 font-semibold block">{isAr ? "D-Arrow CRM - تقرير رسمي" : "D-Arrow Official Report"}</span>
              <h1 className="text-sm md:text-base font-bold text-white truncate max-w-[200px] md:max-w-xs">{report.title}</h1>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="flat"
              onClick={() => i18n.changeLanguage(isAr ? "en" : "ar")}
              className="rounded-xl font-bold text-xs bg-slate-800 text-slate-200 border border-slate-700"
            >
              <Globe className="w-3.5 h-3.5" />
              {isAr ? "English" : "عربي"}
            </Button>

            <Button size="sm" variant="flat" color={copied ? "success" : "default"} onClick={handleCopyLink} className="rounded-xl font-semibold text-xs">
              {copied ? <Check className="w-3.5 h-3.5" /> : <Share2 className="w-3.5 h-3.5" />}
              {copied ? (isAr ? "تم النسخ" : "Copied") : (isAr ? "نسخ الرابط" : "Copy Link")}
            </Button>

            <Button size="sm" color="primary" onClick={handlePrint} className="rounded-xl font-bold text-xs bg-blue-600 text-white">
              <Printer className="w-3.5 h-3.5" />
              {isAr ? "طباعة / PDF" : "Print PDF"}
            </Button>
          </div>
        </div>
      </div>

      {/* Main Document Content */}
      <div className="max-w-4xl mx-auto p-4 md:p-8">
        <div id="public-printable-sheet" className="bg-white text-slate-900 rounded-3xl p-8 md:p-14 shadow-2xl border border-slate-200 font-sans min-h-[750px]">
          {/* Header Bar */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center pb-6 mb-8 border-b-2 border-slate-900 gap-4">
            <div>
              <h1 className="text-3xl font-black text-slate-900 tracking-tight">{report.title}</h1>
              <p className="text-sm font-bold text-blue-600 mt-1">
                {typeLabel} - {isAr ? "تقرير موثق ومطابق للمواصفات" : "Official Client Report Document"}
              </p>
            </div>
            <div className="text-end text-xs text-slate-500 font-medium">
              <div>{isAr ? "تاريخ التقرير:" : "Report Date:"} {new Date(report.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</div>
              <div className="mt-0.5">{isAr ? "معرف التقرير:" : "Report ID:"} #{report.id.substring(0, 8)}</div>
            </div>
          </div>

          {/* Meta Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 bg-slate-50 p-4 rounded-2xl border border-slate-200 text-slate-900 text-sm">
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
              <Briefcase className="w-5 h-5 text-amber-600 shrink-0" />
              <div>
                <span className="text-xs text-slate-400 block font-medium">{isAr ? "الصفقة المرتبطة:" : "Linked Deal:"}</span>
                <span className="font-bold text-slate-900">{report.dealTitle || (isAr ? "عام" : "General")}</span>
              </div>
            </div>
          </div>

          {/* Satisfaction Ribbon & Approval Status */}
          <div className="flex items-center justify-between bg-blue-50/70 border border-blue-200 p-4 rounded-2xl mb-8">
            <div className="flex items-center gap-3">
              <span className="text-xs font-bold text-slate-600">{isAr ? "انطباع العميل:" : "Client Impression:"}</span>
              <span className="text-sm font-bold text-blue-700 flex items-center gap-1.5 bg-white px-3 py-1 rounded-lg border border-blue-200 shadow-xs">
                <MoodIcon className="w-4 h-4 text-amber-500" />
                {isAr ? moodInfo.labelAr : moodInfo.labelEn}
              </span>
              {report.status === "reviewed" && (
                <Chip size="sm" color="success" variant="flat" className="gap-1 font-bold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                  {isAr ? `معتمد رسمياً (${report.reviewedByName || "الإدارة"})` : "Approved Document"}
                </Chip>
              )}
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

          {/* Description Callout */}
          {report.description && (
            <div className="mb-8 p-5 bg-gradient-to-r from-blue-50 to-indigo-50/50 border-s-4 border-blue-600 rounded-e-2xl border-y border-e border-blue-100">
              <h4 className="text-xs font-bold uppercase tracking-wider text-blue-700 mb-2 flex items-center gap-2">
                <FileText className="w-4 h-4" />
                {isAr ? "وصف التقرير والموجز التنفيذي" : "Report Description & Executive Summary"}
              </h4>
              <p className="text-sm md:text-base font-medium text-slate-800 leading-relaxed">
                {report.description}
              </p>
            </div>
          )}

          {/* Main Content */}
          <div className="prose max-w-none mb-10 text-slate-900">
            {renderContentLines(report.content)}
          </div>

          {/* Key Outcomes Section */}
          {report.keyOutcomes && report.keyOutcomes.length > 0 && (
            <div className="mb-8 p-5 bg-emerald-50 border border-emerald-200 rounded-2xl">
              <h4 className="text-sm font-bold text-emerald-700 mb-3 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-600" />
                {isAr ? "أهم مخرجات وتوصيات التقرير:" : "Key Outcomes & Takeaways:"}
              </h4>
              <ul className="space-y-1.5">
                {report.keyOutcomes.map((out, idx) => (
                  <li key={idx} className="flex items-center gap-2 text-sm font-medium text-slate-900">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    {out}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Action Items Section */}
          {report.actionItems && report.actionItems.length > 0 && (
            <div className="mb-8 p-5 bg-slate-50 border border-slate-200 rounded-2xl">
              <h4 className="text-sm font-bold text-slate-900 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                {isAr ? "خطة المتابعة والمهام (Action Items):" : "Action Items & Next Steps:"}
              </h4>
              <div className="space-y-2">
                {report.actionItems.map((item) => (
                  <div key={item.id} className="flex items-center justify-between bg-white border border-slate-200 p-3 rounded-xl shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <input type="checkbox" readOnly checked={item.done} className="w-4 h-4 rounded text-blue-600" />
                      <span className={`text-sm font-medium ${item.done ? "line-through text-slate-400" : "text-slate-900"}`}>
                        {item.text}
                      </span>
                    </div>
                    {item.dueDate && (
                      <span className="text-xs font-semibold bg-slate-100 text-slate-700 px-2.5 py-1 rounded-md border border-slate-200">
                        {item.dueDate}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Footer Signature */}
          <div className="mt-12 pt-6 border-t border-slate-200 flex justify-between items-end text-xs text-slate-400">
            <div>
              <div>{isAr ? "تم التوثيق بواسطة نظام إدارة علاقات العملاء (D-Arrow CRM)" : "Generated via D-Arrow CRM System"}</div>
              <div>{new Date().toLocaleDateString(isAr ? "ar-EG" : "en-US")}</div>
            </div>
            <div className="text-end">
              <div className="font-bold text-slate-900 text-sm">{report.authorName}</div>
              <div>{isAr ? "توقيع ومصادقة الموظف" : "Staff Author Signature"}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
