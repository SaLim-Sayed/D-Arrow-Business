import { useState, useMemo } from "react";
import { Button, Input, Chip, Tooltip } from "@heroui/react";
import {
  FileText,
  Plus,
  Search,
  User,
  Calendar,
  Smile,
  Meh,
  AlertTriangle,
  Flame,
  Star,
  Clock,
  TrendingUp,
  Award,
  ShieldCheck,
  Lock,
  Eye,
  Edit,
  Share2,
  RefreshCw,
  X,
  Building,
  LayoutGrid,
  List as ListIcon,
  Trash2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useClientReportsQuery, useDeleteClientReportMutation } from "../hooks/use-client-reports";
import { ClientReportEditorModal } from "../components/ClientReportEditorModal";
import { ClientReportDetailModal } from "../components/ClientReportDetailModal";
import type { ClientReport, ClientMood } from "../types/client-reports.types";

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
  const [viewMode, setViewMode] = useState<"grid" | "list">("list");

  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editingReport, setEditingReport] = useState<ClientReport | null>(null);

  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [viewingReport, setViewingReport] = useState<ClientReport | null>(null);

  const { data: reports = [], isLoading, refetch } = useClientReportsQuery();
  const deleteMutation = useDeleteClientReportMutation();

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchSearch =
        !searchQuery ||
        r.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.contactName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.authorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.description && r.description.toLowerCase().includes(searchQuery.toLowerCase()));

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

    const avgRating =
      total > 0
        ? (reports.reduce((acc, r) => acc + (r.satisfactionRating || 5), 0) / total).toFixed(1)
        : "5.0";

    return { total, thisMonthCount, pendingActionItems, avgRating };
  }, [reports]);

  const handleOpenCreate = () => {
    setEditingReport(null);
    setIsEditorOpen(true);
  };

  const handleOpenEdit = (report: ClientReport, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setIsDetailOpen(false);
    setEditingReport(report);
    setIsEditorOpen(true);
  };

  const handleOpenDetail = (report: ClientReport) => {
    setViewingReport(report);
    setIsDetailOpen(true);
  };

  const handleCopyPublicLink = (report: ClientReport, e: React.MouseEvent) => {
    e.stopPropagation();
    const publicUrl = `${window.location.origin}/public/report/${report.companyId}/${report.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publicUrl);
      toast.success(isAr ? "تم نسخ رابط التقرير المباشر للحافظة" : "Public link copied to clipboard");
    }
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
    <div dir={isAr ? "rtl" : "ltr"} className="p-6 md:p-10 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      {/* Top Banner Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 p-6 rounded-3xl bg-gradient-to-r from-primary-500/10 via-purple-500/5 to-background border border-primary/20 shadow-sm backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="p-4 rounded-2xl bg-primary text-white shadow-lg shadow-primary/30 shrink-0">
            <FileText className="w-8 h-8" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
              {isAr ? "تقارير العملاء المستندية" : "Client Reports Center"}
              <Chip size="sm" color="primary" variant="flat" className="font-bold text-xs">
                {reports.length} {isAr ? "تقرير" : "reports"}
              </Chip>
            </h1>
            <p className="text-xs md:text-sm text-default-500 mt-1 max-w-2xl leading-relaxed">
              {isAr
                ? "توثيق واحترافية كتابة التقارير مع العملاء بمنسق مستندات وتفاصيل التفاعل وتوصيات المتابعة"
                : "Create, format, and share structured Word-style documents for client meetings and reviews."}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <Button
            size="sm"
            variant="flat"
            onPress={() => refetch()}
            className="rounded-2xl font-bold text-xs h-11"
            startContent={<RefreshCw className="w-4 h-4" />}
          >
            {isAr ? "تحديث" : "Refresh"}
          </Button>

          <Button
            color="primary"
            onClick={handleOpenCreate}
            startContent={<Plus className="w-5 h-5" />}
            className="rounded-2xl font-bold h-11 px-6 shadow-lg shadow-primary/25 text-white bg-gradient-to-r from-primary to-primary-600 hover:opacity-95 transition-all"
          >
            {isAr ? "كتابة تقرير عميل جديد" : "New Client Report"}
          </Button>
        </div>
      </div>

      {/* Analytics Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-3xl bg-background/80 backdrop-blur-xl border border-default-200/60 dark:border-default-100/40 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] hover:border-primary/40">
          <div>
            <span className="text-xs font-semibold text-default-400 block">
              {isAr ? "إجمالي التقارير" : "Total Reports"}
            </span>
            <span className="text-2xl font-black text-foreground mt-1 block">{stats.total}</span>
          </div>
          <div className="p-3 bg-primary/10 text-primary rounded-2xl border border-primary/20">
            <FileText className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background/80 backdrop-blur-xl border border-default-200/60 dark:border-default-100/40 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] hover:border-emerald-500/40">
          <div>
            <span className="text-xs font-semibold text-default-400 block">
              {isAr ? "تقارير هذا الشهر" : "This Month"}
            </span>
            <span className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1 block">{stats.thisMonthCount}</span>
          </div>
          <div className="p-3 bg-emerald-500/10 text-emerald-500 rounded-2xl border border-emerald-500/20">
            <TrendingUp className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background/80 backdrop-blur-xl border border-default-200/60 dark:border-default-100/40 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] hover:border-amber-500/40">
          <div>
            <span className="text-xs font-semibold text-default-400 block">
              {isAr ? "مهام متابعة معلقة" : "Pending Actions"}
            </span>
            <span className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1 block">{stats.pendingActionItems}</span>
          </div>
          <div className="p-3 bg-amber-500/10 text-amber-500 rounded-2xl border border-amber-500/20">
            <Clock className="w-6 h-6" />
          </div>
        </div>

        <div className="p-5 rounded-3xl bg-background/80 backdrop-blur-xl border border-default-200/60 dark:border-default-100/40 shadow-sm flex items-center justify-between transition-all hover:scale-[1.02] hover:border-purple-500/40">
          <div>
            <span className="text-xs font-semibold text-default-400 block">
              {isAr ? "مؤشر رضا العملاء" : "Satisfaction Index"}
            </span>
            <span className="text-2xl font-black text-foreground mt-1 flex items-center gap-1">
              {stats.avgRating} <Star className="w-5 h-5 text-amber-400 fill-amber-400" />
            </span>
          </div>
          <div className="p-3 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-2xl border border-purple-500/20">
            <Award className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Search & Filters Toolbar */}
      <div className="p-4 rounded-3xl bg-background/80 backdrop-blur-xl border border-default-200/60 dark:border-default-100/40 shadow-sm flex flex-col md:flex-row gap-4 justify-between items-center">
        <div className="w-full md:w-96">
          <Input
            placeholder={isAr ? "ابحث باسم التقرير، الموظف، العميل، أو الوصف..." : "Search title, author, client..."}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search className="w-4 h-4 text-default-400 ms-1" />}
            variant="bordered"
            size="sm"
            className="w-full"
            classNames={{ inputWrapper: "rounded-2xl bg-default-50/50" }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between md:justify-end gap-3 w-full md:w-auto">
          {/* Report Type Filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="bg-default-50/70 text-foreground border border-default-200 dark:border-default-100/60 text-xs font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-primary shadow-xs"
          >
            <option value="all">{isAr ? "جميع أنواع التقارير" : "All Report Types"}</option>
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
            className="bg-default-50/70 text-foreground border border-default-200 dark:border-default-100/60 text-xs font-semibold rounded-2xl px-4 py-2.5 focus:outline-none focus:border-primary shadow-xs"
          >
            <option value="all">{isAr ? "جميع حالات انطباع العملاء" : "All Moods"}</option>
            {Object.entries(MOOD_CONFIG).map(([k, v]) => (
              <option key={k} value={k}>
                {isAr ? v.labelAr : v.labelEn}
              </option>
            ))}
          </select>

          {(searchQuery || selectedType !== "all" || selectedMood !== "all") && (
            <Button
              size="sm"
              variant="light"
              color="danger"
              onPress={() => {
                setSearchQuery("");
                setSelectedType("all");
                setSelectedMood("all");
              }}
              className="font-bold text-xs rounded-xl"
              startContent={<X className="w-3.5 h-3.5" />}
            >
              {isAr ? "إلغاء الفلاتر" : "Reset Filters"}
            </Button>
          )}

          {/* View Mode Switcher */}
          <div className="flex items-center gap-1 bg-default-100 p-1 rounded-2xl border border-default-200/50">
            <Button
              size="sm"
              variant={viewMode === "list" ? "solid" : "light"}
              color={viewMode === "list" ? "primary" : "default"}
              onPress={() => setViewMode("list")}
              className="rounded-xl px-3 font-bold text-xs min-w-0"
              startContent={<ListIcon className="w-4 h-4" />}
            >
              {isAr ? "قائمة" : "List"}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "grid" ? "solid" : "light"}
              color={viewMode === "grid" ? "primary" : "default"}
              onPress={() => setViewMode("grid")}
              className="rounded-xl px-3 font-bold text-xs min-w-0"
              startContent={<LayoutGrid className="w-4 h-4" />}
            >
              {isAr ? "شبكة" : "Grid"}
            </Button>
          </div>
        </div>
      </div>

      {/* Reports Display Container */}
      {isLoading ? (
        <div className="text-center py-16 text-default-400">
          <FileText className="w-10 h-10 animate-bounce text-primary/40 mx-auto mb-3" />
          <p className="text-sm font-semibold">{isAr ? "جاري تحميل تقارير العملاء..." : "Loading client reports..."}</p>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="p-16 rounded-3xl bg-background/60 border border-default-200/60 text-center space-y-4">
          <div className="p-4 rounded-3xl bg-default-100 text-default-400 w-fit mx-auto">
            <FileText className="w-10 h-10" />
          </div>
          <h3 className="text-lg font-bold text-foreground">
            {isAr ? "لا توجد تقارير عملاء مطابقة" : "No client reports found"}
          </h3>
          <p className="text-xs text-default-400 max-w-md mx-auto">
            {isAr
              ? "لم نجد تقارير مطابقة للفلاتر المحددة. قم بإضافة تقرير جديد أو تعديل خيارات البحث."
              : "No reports match your current filter selection."}
          </p>
        </div>
      ) : viewMode === "list" ? (
        /* Full-Width List View Mode */
        <div className="space-y-4">
          {filteredReports.map((report) => {
            const mood = MOOD_CONFIG[report.clientMood] || MOOD_CONFIG.satisfied;
            const MoodIcon = mood.icon;
            const typeLabel = REPORT_TYPE_LABELS[report.reportType]?.[isAr ? "ar" : "en"] || report.reportType;
            const pendingTasksCount = report.actionItems?.filter((i) => !i.done).length || 0;

            return (
              <div
                key={report.id}
                onClick={() => handleOpenDetail(report)}
                className="group relative bg-background/80 dark:bg-content1/80 backdrop-blur-xl border border-default-200/70 dark:border-default-100/50 hover:border-primary/50 rounded-3xl p-5 md:p-6 transition-all duration-300 cursor-pointer hover:shadow-xl hover:-translate-y-0.5 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6"
              >
                {/* Left Info Column */}
                <div className="flex items-start gap-4 flex-1 min-w-0 w-full">
                  <div className="p-3.5 rounded-2xl bg-primary/10 text-primary border border-primary/20 shrink-0 mt-1">
                    <FileText className="w-6 h-6" />
                  </div>

                  <div className="space-y-2 flex-1 min-w-0">
                    {/* Badges line */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        {typeLabel}
                      </span>
                      <Chip size="sm" color={mood.color} variant="flat" className="gap-1 font-bold">
                        <MoodIcon className="w-3.5 h-3.5" />
                        {isAr ? mood.labelAr : mood.labelEn}
                      </Chip>
                      {report.status === "reviewed" && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {isAr ? "معتمد" : "Approved"}
                        </span>
                      )}
                      {report.internalNotes && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1">
                          <Lock className="w-3.5 h-3.5" />
                          {isAr ? "سري" : "Private"}
                        </span>
                      )}
                    </div>

                    {/* Title */}
                    <h3 className="text-base md:text-lg font-black text-foreground group-hover:text-primary transition-colors truncate">
                      {report.title}
                    </h3>

                    {/* Description Snippet */}
                    <p className="text-xs text-default-500 leading-relaxed line-clamp-1 font-medium">
                      {report.description || report.content.replace(/[#*>]/g, "") || (isAr ? "لا يوجد وصف" : "No description")}
                    </p>

                    {/* Client & Author Badges */}
                    <div className="flex items-center gap-4 text-xs text-default-400 font-semibold flex-wrap pt-1">
                      <span className="flex items-center gap-1 text-default-600">
                        <User className="w-3.5 h-3.5 text-primary" />
                        {isAr ? "العميل:" : "Client:"} <strong className="text-foreground">{report.contactName}</strong>
                      </span>
                      <span className="flex items-center gap-1 text-default-600">
                        <Building className="w-3.5 h-3.5 text-purple-500" />
                        {isAr ? "الموظف:" : "Author:"} <strong className="text-foreground">{report.authorName}</strong>
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {new Date(report.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Right Action Column */}
                <div className="flex items-center justify-between lg:justify-end gap-3 w-full lg:w-auto shrink-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-default-100">
                  <div className="flex items-center gap-2">
                    {pendingTasksCount > 0 && (
                      <Chip size="sm" color="warning" variant="flat" className="font-bold text-xs">
                        {pendingTasksCount} {isAr ? "معلقة" : "pending"}
                      </Chip>
                    )}
                    <div className="flex items-center gap-1 text-amber-500 font-black text-sm me-2">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      <span>{report.satisfactionRating || 5}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleOpenDetail(report)}
                      className="font-bold text-xs rounded-xl"
                      startContent={<Eye className="w-3.5 h-3.5" />}
                    >
                      {isAr ? "عرض التفاصيل" : "View"}
                    </Button>

                    <Tooltip content={isAr ? "نسخ رابط التقرير المباشر" : "Copy Public Link"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        color="success"
                        onPress={(e) => handleCopyPublicLink(report, e)}
                        className="rounded-xl"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>

                    <Tooltip content={isAr ? "تعديل التقرير" : "Edit Report"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        color="warning"
                        onPress={(e) => handleOpenEdit(report, e)}
                        className="rounded-xl"
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </Tooltip>

                    <Tooltip content={isAr ? "حذف التقرير" : "Delete Report"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        color="danger"
                        onPress={(e) => {
                          e.stopPropagation();
                          handleDelete(report.id);
                        }}
                        className="rounded-xl"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </Tooltip>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Grid View Mode */
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
                className="group relative bg-background/80 dark:bg-content1/80 backdrop-blur-xl border border-default-200/70 dark:border-default-100/50 hover:border-primary/50 rounded-3xl p-6 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:-translate-y-1 flex flex-col justify-between"
              >
                <div>
                  {/* Top Bar */}
                  <div className="flex items-center justify-between gap-2 mb-4">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-xs font-bold px-3 py-1 rounded-xl bg-primary/10 text-primary border border-primary/20">
                        {typeLabel}
                      </span>
                      {report.status === "reviewed" && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                          {isAr ? "معتمد" : "Approved"}
                        </span>
                      )}
                      {report.internalNotes && (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-xl bg-amber-500/10 text-amber-600 border border-amber-500/20 flex items-center gap-1" title="يحتوي على ملاحظات إدارية سرية">
                          <Lock className="w-3.5 h-3.5" />
                          {isAr ? "سري" : "Private"}
                        </span>
                      )}
                    </div>

                    <Chip size="sm" color={mood.color} variant="flat" className="gap-1 font-bold">
                      <MoodIcon className="w-3.5 h-3.5" />
                      {isAr ? mood.labelAr : mood.labelEn}
                    </Chip>
                  </div>

                  {/* Title */}
                  <h3 className="text-base md:text-lg font-black text-foreground group-hover:text-primary transition-colors line-clamp-2 mb-4 leading-snug">
                    {report.title}
                  </h3>

                  {/* Client & Author Box */}
                  <div className="space-y-2 text-xs mb-4 bg-default-50/80 dark:bg-default-50/30 p-3.5 rounded-2xl border border-default-200/60 dark:border-default-100/40">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-primary shrink-0" />
                      <span className="font-bold text-default-500">{isAr ? "العميل:" : "Client:"}</span>
                      <span className="text-foreground font-semibold truncate">{report.contactName}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-purple-500 shrink-0" />
                      <span className="font-bold text-default-500">{isAr ? "الموظف:" : "Author:"}</span>
                      <span className="text-foreground font-semibold truncate">{report.authorName}</span>
                    </div>
                  </div>

                  {/* Snippet / Description */}
                  <p className="text-xs text-default-500 leading-relaxed line-clamp-3 mb-4 font-medium">
                    {report.description || report.content.replace(/[#*>]/g, "") || (isAr ? "لا يوجد وصف أو ملخص نصي" : "No description")}
                  </p>
                </div>

                {/* Card Footer */}
                <div className="pt-4 border-t border-default-200/60 dark:border-default-100/40 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5 text-xs text-default-400 font-semibold">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(report.createdAt).toLocaleDateString(isAr ? "ar-EG" : "en-US")}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    {pendingTasksCount > 0 && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2 py-0.5 rounded-lg font-bold">
                        {pendingTasksCount} {isAr ? "مهام معلقة" : "pending"}
                      </span>
                    )}

                    <div className="flex items-center gap-1">
                      <Tooltip content={isAr ? "عرض التفاصيل" : "View Details"}>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="primary"
                          onPress={() => handleOpenDetail(report)}
                          className="rounded-xl h-8 w-8 min-w-0"
                        >
                          <Eye className="w-4 h-4" />
                        </Button>
                      </Tooltip>

                      <Tooltip content={isAr ? "نسخ رابط التقرير المباشر" : "Copy Public Link"}>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="success"
                          onPress={(e) => handleCopyPublicLink(report, e)}
                          className="rounded-xl h-8 w-8 min-w-0"
                        >
                          <Share2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>

                      <Tooltip content={isAr ? "تعديل التقرير" : "Edit Report"}>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="warning"
                          onPress={(e) => handleOpenEdit(report, e)}
                          className="rounded-xl h-8 w-8 min-w-0"
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                      </Tooltip>

                      <Tooltip content={isAr ? "حذف التقرير" : "Delete Report"}>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="flat"
                          color="danger"
                          onPress={(e) => {
                            e.stopPropagation();
                            handleDelete(report.id);
                          }}
                          className="rounded-xl h-8 w-8 min-w-0"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </Tooltip>
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
