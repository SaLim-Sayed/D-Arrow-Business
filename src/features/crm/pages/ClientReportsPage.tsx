import { useState, useMemo } from "react";
import { Button, Input, Chip, Card, CardBody } from "@heroui/react";
import {
  FileText,
  Plus,
  Search,
  Filter,
  User,
  Calendar,
  Smile,
  Meh,
  AlertTriangle,
  Flame,
  Star,
  CheckCircle,
  Clock,
  TrendingUp,
  Award,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useClientReportsQuery, useDeleteClientReportMutation } from "../hooks/use-client-reports";
import { ClientReportEditorModal } from "../components/ClientReportEditorModal";
import { ClientReportDetailModal } from "../components/ClientReportDetailModal";
import type { ClientReport, ClientMood, ClientReportType } from "../types/client-reports.types";

const MOOD_CONFIG: Record<ClientMood, { labelAr: string; labelEn: string; color: "success" | "default" | "warning" | "danger"; icon: any }> = {
  satisfied: { labelAr: "مرتاح / راضٍ", labelEn: "Satisfied", color: "success", icon: Smile },
  neutral: { labelAr: "محايد", labelEn: "Neutral", color: "default", icon: Meh },
  needs_attention: { labelAr: "يحتاج متابعة", labelEn: "Needs Attention", color: "warning", icon: AlertTriangle },
  at_risk: { labelAr: "في خطر / معترض", labelEn: "At Risk", color: "danger", icon: Flame },
};

const REPORT_TYPE_LABELS: Record<string, { ar: string; en: string }> = {
  meeting_summary: { ar: "ملخص اجتماع", en: "Meeting Summary" },
  status_update: { ar: "تحديث حالة", en: "Status Update" },
  sales_pitch: { ar: "عرض مبيعات", en: "Sales Pitch" },
  complaint_resolution: { ar: "معالجة شكوى", en: "Complaint Resolution" },
  quarterly_review: { ar: "مراجعة دورية", en: "Quarterly Review" },
  general: { ar: "تقرير عام", en: "General Report" },
};

export function ClientReportsPage() {
  const { i18n } = useTranslation();
  const isAr = i18n.language === "ar";

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<string>("all");
  const [selectedMood, setSelectedMood] = useState<string>("all");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ClientReport | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ClientReport | null>(null);

  const { data: reports = [], isLoading } = useClientReportsQuery();
  const deleteMutation = useDeleteClientReportMutation();

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.authorName.toLowerCase().includes(searchQuery.toLowerCase());

      const matchType = selectedType === "all" || r.reportType === selectedType;
      const matchMood = selectedMood === "all" || r.clientMood === selectedMood;

      return matchSearch && matchType && matchMood;
    });
  }, [reports, searchQuery, selectedType, selectedMood]);

  // Analytics Stats
  const stats = useMemo(() => {
    const total = reports.length;
    const thisMonthCount = reports.filter((r) => {
      const d = new Date(r.createdAt);
      const now = new Date();
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    }).length;

    let pendingActionItems = 0;
    reports.forEach((r) => {
      if (r.actionItems) {
        pendingActionItems += r.actionItems.filter((item) => !item.done).length;
      }
    });

    const avgRating = total > 0 ? (reports.reduce((acc, r) => acc + (r.satisfactionRating || 5), 0) / total).toFixed(1) : "5.0";

    return { total, thisMonthCount, pendingActionItems, avgRating };
  }, [reports]);

  const handleOpenCreate = () => {
    setEditingReport(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (report: ClientReport) => {
    setIsDetailOpen(false);
    setEditingReport(report);
    setIsEditorOpen(true);
  };

  const handleOpenDetail = (report: ClientReport) => {
    setViewingReport(report);
    setIsDetailOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm(isAr ? "هل أنت تأكد من حذف هذا التقرير المستندي؟" : "Are you sure you want to delete this report?")) {
      await deleteMutation.mutateAsync(id);
      if (viewingReport?.id === id) {
        setIsDetailOpen(false);
        setViewingReport(null);
      }
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-slate-900/60 border border-slate-800 p-6 rounded-2xl backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-3.5 bg-gradient-to-tr from-blue-600 to-indigo-600 text-white rounded-2xl shadow-lg shadow-blue-500/20">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-100">
              {isAr ? "تقارير العملاء المستندية" : "Client Reports Center"}
            </h1>
            <p className="text-sm text-slate-400 mt-1">
              {isAr
                ? "نظام توثيق وكتابة تقارير احترافية لكل موظف مع العملاء بمنسق مستندات Word وخطوات متابعة"
                : "Create, view and manage structured Word reports authored by employees for clients."}
            </p>
          </div>
        </div>

        <Button
          color="primary"
          onClick={handleOpenCreate}
          className="rounded-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/20 px-6 py-6"
        >
          <Plus className="w-5 h-5" />
          {isAr ? "كتابة تقرير عميل جديد" : "New Client Report"}
        </Button>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-slate-900/60 border border-slate-800 rounded-2xl">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">
                {isAr ? "إجمالي التقارير" : "Total Reports"}
              </span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">{stats.total}</span>
            </div>
            <div className="p-3 bg-blue-500/10 text-blue-400 rounded-xl border border-blue-500/20">
              <FileText className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-slate-900/60 border border-slate-800 rounded-2xl">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">
                {isAr ? "تقارير هذا الشهر" : "This Month"}
              </span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block">{stats.thisMonthCount}</span>
            </div>
            <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-xl border border-emerald-500/20">
              <TrendingUp className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-slate-900/60 border border-slate-800 rounded-2xl">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">
                {isAr ? "مهام متابعة معلقة" : "Pending Actions"}
              </span>
              <span className="text-2xl font-bold text-amber-400 mt-1 block">{stats.pendingActionItems}</span>
            </div>
            <div className="p-3 bg-amber-500/10 text-amber-400 rounded-xl border border-amber-500/20">
              <Clock className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>

        <Card className="bg-slate-900/60 border border-slate-800 rounded-2xl">
          <CardBody className="p-5 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-slate-400 block">
                {isAr ? "مؤشر رضا العملاء" : "Satisfaction Index"}
              </span>
              <span className="text-2xl font-bold text-slate-100 mt-1 block flex items-center gap-1">
                {stats.avgRating} <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
              </span>
            </div>
            <div className="p-3 bg-purple-500/10 text-purple-400 rounded-xl border border-purple-500/20">
              <Award className="w-6 h-6" />
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-slate-900/40 p-4 rounded-2xl border border-slate-800">
        <div className="w-full md:w-80">
          <Input
            placeholder={isAr ? "ابحث باسم التقرير، الموظف، أو العميل..." : "Search reports, staff or client..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={<Search className="w-4 h-4 text-slate-400" />}
            className="w-full bg-slate-950 border-slate-800 text-slate-100 rounded-xl"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Report Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">{isAr ? "كل أنواع التقارير" : "All Report Types"}</option>
            {Object.entries(REPORT_TYPE_LABELS).map(([k, v]) => (
              <option key={k} value={k}>
                {isAr ? v.ar : v.en}
              </option>
            ))}
          </select>

          {/* Client Mood Filter */}
          <select
            value={selectedMood}
            onChange={(e) => setSelectedMood(e.target.value)}
            className="bg-slate-950 border border-slate-800 text-slate-200 text-sm rounded-xl px-3 py-2 focus:outline-none"
          >
            <option value="all">{isAr ? "كل حالات انطباع العملاء" : "All Moods"}</option>
            {Object.entries(MOOD_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {isAr ? v.labelAr : v.labelEn}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Reports Grid List */}
      {isLoading ? (
        <div className="text-center py-12 text-slate-400">
          {isAr ? "جاري تحميل تقارير العملاء..." : "Loading client reports..."}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/30 border border-slate-800/80 rounded-2xl">
          <FileText className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-slate-300">
            {isAr ? "لا توجد تقارير عملاء مطابقة" : "No client reports found"}
          </h3>
          <p className="text-sm text-slate-500 max-w-md mx-auto mt-1">
            {isAr
              ? "قم بإضافة تقرير عميل جديد عبر زر المحرر أعلاه لتوثيق تفاصيل وتوصيات التفاعل مع العميل."
              : "Click the new report button to create your first client document report."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const mood = MOOD_CONFIG[report.clientMood] || MOOD_CONFIG.satisfied;
            const MoodIcon = mood.icon;
            const typeLabel = REPORT_TYPE_LABELS[report.reportType]?.[isAr ? "ar" : "en"] || report.reportType;

            const pendingTasksCount = report.actionItems?.filter((i) => !i.done).length || 0;

            return (
              <div
                key={report.id}
                onClick={() => handleOpenDetail(report)}
                className="group relative bg-slate-900/80 border border-slate-800 hover:border-blue-500/50 rounded-2xl p-6 transition-all cursor-pointer hover:shadow-xl hover:shadow-blue-500/5 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <span className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {typeLabel}
                    </span>
                    <Chip size="sm" color={mood.color} variant="flat" className="gap-1 font-medium">
                      <MoodIcon className="w-3.5 h-3.5" />
                      {isAr ? mood.labelAr : mood.labelEn}
                    </Chip>
                  </div>

                  {/* Title */}
                  <h3 className="text-lg font-bold text-slate-100 group-hover:text-blue-400 transition-colors line-clamp-2 mb-3">
                    {report.title}
                  </h3>

                  {/* Client & Author Badges */}
                  <div className="space-y-2 text-xs text-slate-400 mb-4 bg-slate-950/60 p-3 rounded-xl border border-slate-800/80">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-blue-400 shrink-0" />
                      <span className="font-semibold text-slate-300">{isAr ? "العميل:" : "Client:"}</span>
                      <span className="text-slate-100 truncate">{report.contactName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <FileText className="w-4 h-4 text-indigo-400 shrink-0" />
                      <span className="font-semibold text-slate-300">{isAr ? "الموظف:" : "Author:"}</span>
                      <span className="text-slate-100 truncate">{report.authorName}</span>
                    </div>
                  </div>

                  {/* Snippet */}
                  <p className="text-xs text-slate-400 line-clamp-3 leading-relaxed mb-4">
                    {report.content.replace(/[#*>]/g, "") || (isAr ? "لا يوجد ملخص نصي" : "No summary")}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString("ar-SA")}</span>
                  </div>

                  <div className="flex items-center gap-3">
                    {pendingTasksCount > 0 && (
                      <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2 py-0.5 rounded-md font-semibold">
                        {pendingTasksCount} {isAr ? "مهام" : "tasks"}
                      </span>
                    )}
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      <span className="text-xs font-bold text-slate-300">{report.satisfactionRating || 5}</span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Editor Modal */}
      {isEditorOpen && (
        <ClientReportEditorModal
          isOpen={isEditorOpen}
          onClose={() => setIsEditorOpen(false)}
          initialReport={editingReport}
        />
      )}

      {/* Detail Viewer Modal */}
      {isDetailOpen && (
        <ClientReportDetailModal
          isOpen={isDetailOpen}
          onClose={() => setIsDetailOpen(false)}
          report={viewingReport}
          onEdit={handleOpenEdit}
          onDelete={handleDelete}
        />
      )}
    </div>
  );
}
