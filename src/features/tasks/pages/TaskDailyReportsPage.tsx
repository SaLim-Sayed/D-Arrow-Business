import { useState, useEffect, useMemo } from "react";
import {
  Card,
  CardBody,
  Button,
  Input,
  Chip,
  User,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerFooter,
  Select,
  SelectItem,
  Textarea,
  Tooltip,
} from "@heroui/react";
import {
  ListTodo,
  Calendar,
  Search,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Star,
  Eye,
  Printer,
  Share2,
  LayoutGrid,
  Table as TableIcon,
  Check,
  Sparkles,
  MessageSquare,
  UserCheck,
  Briefcase,
  Copy,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { DailyReportsService } from "@/features/people/api/daily-reports.service";
import type { DailyReport } from "@/features/people/types/daily-report.types";

export default function TaskDailyReportsPage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { companyId } = useCompany();
  const { user } = useAuth();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & State
  const [searchQuery, setSearchQuery] = useState("");
  const [blockersFilter, setBlockersFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [viewMode, setViewMode] = useState<"grid" | "table">("grid");

  // Selected Detail Drawer State
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [managerComment, setManagerComment] = useState("");
  const [managerRating, setManagerRating] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReports = async () => {
    if (!companyId) return;
    setLoading(true);
    try {
      const res = await DailyReportsService.getDailyReports(companyId);
      if (res.data) {
        setReports(res.data.filter((r) => !r.isSkipped));
      }
    } catch (err) {
      console.error("Failed to fetch task daily reports:", err);
      toast.error(isAr ? "حدث خطأ أثناء تحميل تقارير المهام اليومية" : "Failed to load daily task reports");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [companyId]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const hasTaskMatch =
        r.tasksCompleted.some((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.tasksInProgress.some((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesText =
        !searchQuery ||
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.blockers && r.blockers.toLowerCase().includes(searchQuery.toLowerCase())) ||
        hasTaskMatch;

      const hasBlocker = !!r.blockers && r.blockers.trim().length > 0;
      const matchesBlocker =
        blockersFilter === "all" ||
        (blockersFilter === "with_blockers" && hasBlocker) ||
        (blockersFilter === "no_blockers" && !hasBlocker);

      const matchesDate = !selectedDate || r.date === selectedDate;

      return matchesText && matchesBlocker && matchesDate;
    });
  }, [reports, searchQuery, blockersFilter, selectedDate]);

  // KPI Metrics Calculation
  const metrics = useMemo(() => {
    const totalReports = reports.length;

    let totalCompletedTasks = 0;
    let totalInProgressTasks = 0;
    let reportsWithBlockers = 0;
    let totalRatingSum = 0;
    let ratedCount = 0;

    reports.forEach((r) => {
      totalCompletedTasks += r.tasksCompleted?.length || 0;
      totalInProgressTasks += r.tasksInProgress?.length || 0;
      if (r.blockers && r.blockers.trim().length > 0) {
        reportsWithBlockers += 1;
      }
      if (r.productivityRating && r.productivityRating > 0) {
        totalRatingSum += r.productivityRating;
        ratedCount += 1;
      }
    });

    const avgProductivity = ratedCount > 0 ? (totalRatingSum / ratedCount).toFixed(1) : "5.0";

    return {
      totalReports,
      totalCompletedTasks,
      totalInProgressTasks,
      reportsWithBlockers,
      avgProductivity,
    };
  }, [reports]);

  const handleOpenDetail = (report: DailyReport) => {
    setSelectedReport(report);
    setManagerComment(report.managerComment || "");
    setManagerRating(report.managerRating || 5);
  };

  const handleSaveReview = async () => {
    if (!selectedReport || !companyId || !user?.id) return;
    setIsSubmittingReview(true);
    try {
      await DailyReportsService.updateManagerReview(
        companyId,
        selectedReport.id,
        { comment: managerComment, rating: managerRating },
        { id: user.id, name: user.name || "المدير" }
      );
      toast.success(isAr ? "تم حفظ تقييم وملاحظات الإدارة بنجاح" : "Manager review saved successfully");

      // Update local state
      setReports((prev) =>
        prev.map((r) =>
          r.id === selectedReport.id
            ? {
                ...r,
                managerComment,
                managerRating,
                reviewedBy: user.id,
                reviewedByName: user.name || "المدير",
                reviewedAt: new Date().toISOString(),
                status: "reviewed",
              }
            : r
        )
      );

      setSelectedReport((prev) =>
        prev
          ? {
              ...prev,
              managerComment,
              managerRating,
              reviewedBy: user.id,
              reviewedByName: user.name || "المدير",
              reviewedAt: new Date().toISOString(),
              status: "reviewed",
            }
          : null
      );
    } catch (err) {
      console.error("Failed to save review:", err);
      toast.error(isAr ? "فشل حفظ التقييم" : "Failed to save review");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handlePrintReport = (report: DailyReport) => {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0px";
    iframe.style.height = "0px";
    iframe.style.border = "0";
    iframe.style.zIndex = "-1000";

    document.body.appendChild(iframe);
    const doc = iframe.contentWindow?.document;
    if (!doc) return;

    const completedListHtml = report.tasksCompleted.length > 0
      ? report.tasksCompleted.map((t) => `<li style="margin-bottom:4px; font-weight:600; color:#15803d;">✓ ${t.title}</li>`).join("")
      : "<p style='color:#64748b;'>لا توجد مهام مكتملة</p>";

    const inProgressListHtml = report.tasksInProgress.length > 0
      ? report.tasksInProgress.map((t) => `<li style="margin-bottom:4px; font-weight:600; color:#b45309;">⏳ ${t.title}</li>`).join("")
      : "<p style='color:#64748b;'>لا توجد مهام قيد التنفيذ</p>";

    doc.open();
    doc.write(`
      <!DOCTYPE html>
      <html dir="${isAr ? "rtl" : "ltr"}">
        <head>
          <title>تقرير إنجاز المهام اليومي - ${report.employeeName}</title>
          <style>
            body {
              font-family: 'IBM Plex Sans Arabic', 'Inter', sans-serif;
              padding: 20px;
              color: #1e293b;
              background: #fff;
            }
            .header {
              border-bottom: 2px solid #e2e8f0;
              padding-bottom: 12px;
              margin-bottom: 20px;
            }
            .title { font-size: 22px; font-weight: 800; color: #0f172a; }
            .meta { font-size: 13px; color: #64748b; margin-top: 4px; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 15px; font-weight: 700; color: #334155; margin-bottom: 8px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px; }
            .blocker-box { background: #fef2f2; border: 1px solid #fca5a5; border-radius: 8px; padding: 12px; color: #991b1b; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="title">📋 تقرير إنجاز المهام اليومي</div>
            <div class="meta">الموظف: <strong>${report.employeeName}</strong> | التاريخ: <strong>${report.date}</strong> ${report.totalHours ? `| ساعات العمل: ${report.totalHours} ساعة` : ''}</div>
          </div>

          <div class="section">
            <div class="section-title">✅ المهام المنجزة (${report.tasksCompleted.length})</div>
            <ul style="padding-right: 20px; margin: 0;">${completedListHtml}</ul>
          </div>

          <div class="section">
            <div class="section-title">⏳ المهام قيد التنفيذ (${report.tasksInProgress.length})</div>
            <ul style="padding-right: 20px; margin: 0;">${inProgressListHtml}</ul>
          </div>

          <div class="section">
            <div class="section-title">📝 ملخص الإنجاز</div>
            <div class="box">${report.summary || "لا يوجد ملخص"}</div>
          </div>

          ${report.blockers ? `
            <div class="section">
              <div class="section-title">⚠️ المعوقات والتحديات</div>
              <div class="blocker-box">${report.blockers}</div>
            </div>
          ` : ''}

          ${report.planTomorrow ? `
            <div class="section">
              <div class="section-title">📌 خطة عمل الغد</div>
              <div class="box">${report.planTomorrow}</div>
            </div>
          ` : ''}
        </body>
      </html>
    `);
    doc.close();

    iframe.contentWindow?.focus();
    setTimeout(() => {
      iframe.contentWindow?.print();
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 1000);
    }, 300);
  };

  const handleCopyReportText = (report: DailyReport) => {
    const text = `📋 *تقرير إنجاز المهام اليومي*\n👤 الموظف: ${report.employeeName}\n📅 التاريخ: ${report.date}\n\n✅ *المهام المكتملة (${report.tasksCompleted.length}):*\n${report.tasksCompleted.map((t) => `• ${t.title}`).join("\n") || "لا توجد"}\n\n⏳ *المهام قيد التنفيذ (${report.tasksInProgress.length}):*\n${report.tasksInProgress.map((t) => `• ${t.title}`).join("\n") || "لا توجد"}\n\n📝 *الملخص:*\n${report.summary}\n\n_D-Arrow Business Suite_`;

    if (navigator.clipboard) {
      navigator.clipboard.writeText(text);
      toast.success(isAr ? "تم نسخ نص التقرير للحافظة بنجاح" : "Report text copied to clipboard");
    }
  };

  const handleShareWhatsApp = (report: DailyReport) => {
    const text = `📋 *تقرير إنجاز المهام اليومي*\n👤 الموظف: ${report.employeeName}\n📅 التاريخ: ${report.date}\n\n✅ *المهام المكتملة (${report.tasksCompleted.length}):*\n${report.tasksCompleted.map((t) => `• ${t.title}`).join("\n") || "لا توجد"}\n\n⏳ *المهام قيد التنفيذ (${report.tasksInProgress.length}):*\n${report.tasksInProgress.map((t) => `• ${t.title}`).join("\n") || "لا توجد"}\n\n📝 *الملخص:*\n${report.summary}\n\n_D-Arrow Business Suite_`;
    const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Top Banner & Title */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-3.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 shadow-sm">
              <ListTodo size={28} />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-2">
                {t("daily_report.page_title", "تقارير إنجاز المهام اليومية")}
                <Chip size="sm" color="secondary" variant="flat" className="font-bold text-xs">
                  {filteredReports.length} {isAr ? "تقرير" : "reports"}
                </Chip>
              </h1>
              <p className="text-sm text-default-400 mt-1">
                {t("daily_report.page_subtitle", "متابعة إنجازات الفريق والمهام المكتملة والمعوقات اليومية")}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="flat"
            color="primary"
            onPress={fetchReports}
            isLoading={loading}
            startContent={<RefreshCw size={16} />}
            className="font-bold text-xs rounded-2xl h-11"
          >
            {t("daily_report.refresh", "تحديث البيانات")}
          </Button>
        </div>
      </div>

      {/* Analytics KPI Section */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl hover:border-purple-500/30 transition-all">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <Briefcase size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-semibold">{isAr ? "إجمالي التقارير" : "Total Reports"}</p>
              <h3 className="text-xl font-black text-foreground">{metrics.totalReports}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl hover:border-emerald-500/30 transition-all">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-semibold">{isAr ? "المهام المنجزة" : "Tasks Done"}</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {metrics.totalCompletedTasks}
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl hover:border-amber-500/30 transition-all">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-semibold">{isAr ? "قيد التنفيذ" : "In Progress"}</p>
              <h3 className="text-xl font-black text-amber-600 dark:text-amber-400">
                {metrics.totalInProgressTasks}
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl hover:border-danger-500/30 transition-all">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-danger-500/10 text-danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-semibold">{isAr ? "المعوقات والمخاطر" : "Blockers"}</p>
              <h3 className="text-xl font-black text-danger">
                {metrics.reportsWithBlockers}
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="col-span-2 lg:col-span-1 border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl hover:border-primary-500/30 transition-all">
          <CardBody className="p-4 flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <Star size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-semibold">{isAr ? "متوسط الإنتاجية" : "Avg Rating"}</p>
              <div className="flex items-center gap-1">
                <h3 className="text-xl font-black text-foreground">{metrics.avgProductivity}</h3>
                <span className="text-xs text-amber-500">★</span>
              </div>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Search & Filter Toolbar */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl p-2">
        <CardBody className="p-3 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex flex-col sm:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <Input
              placeholder={t("daily_report.search_placeholder", "ابحث باسم الموظف، عنوان المهمة، أو الملخص...")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={18} className="text-default-400 ms-1" />}
              variant="bordered"
              size="sm"
              className="w-full sm:w-80"
              classNames={{ inputWrapper: "rounded-2xl bg-default-50/50" }}
            />

            <Select
              aria-label="تصفية المعوقات"
              size="sm"
              selectedKeys={[blockersFilter]}
              onChange={(e) => setBlockersFilter(e.target.value)}
              className="w-full sm:w-48"
              classNames={{ trigger: "rounded-2xl bg-default-50/50" }}
            >
              <SelectItem key="all">
                {isAr ? "جميع التقارير" : "All Reports"}
              </SelectItem>
              <SelectItem key="with_blockers">
                {isAr ? "⚠️ تقارير بها معوقات" : "With Blockers"}
              </SelectItem>
              <SelectItem key="no_blockers">
                {isAr ? "✅ تقارير بدون معوقات" : "No Blockers"}
              </SelectItem>
            </Select>

            <Input
              type="date"
              aria-label="تصفية باليوم"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              size="sm"
              className="w-full sm:w-44"
              classNames={{ inputWrapper: "rounded-2xl bg-default-50/50" }}
            />

            {(searchQuery || blockersFilter !== "all" || selectedDate) && (
              <Button
                size="sm"
                variant="light"
                color="danger"
                onPress={() => {
                  setSearchQuery("");
                  setBlockersFilter("all");
                  setSelectedDate("");
                }}
                className="font-bold text-xs rounded-xl"
              >
                {isAr ? "إلغاء الفلاتر" : "Reset"}
              </Button>
            )}
          </div>

          {/* View Mode Toggle Switcher */}
          <div className="flex items-center gap-1 bg-default-100 p-1 rounded-2xl border border-default-200/50">
            <Button
              size="sm"
              variant={viewMode === "grid" ? "solid" : "light"}
              color={viewMode === "grid" ? "primary" : "default"}
              onPress={() => setViewMode("grid")}
              className="rounded-xl px-3 font-bold text-xs min-w-0"
              startContent={<LayoutGrid size={15} />}
            >
              {isAr ? "بطاقات" : "Grid"}
            </Button>
            <Button
              size="sm"
              variant={viewMode === "table" ? "solid" : "light"}
              color={viewMode === "table" ? "primary" : "default"}
              onPress={() => setViewMode("table")}
              className="rounded-xl px-3 font-bold text-xs min-w-0"
              startContent={<TableIcon size={15} />}
            >
              {isAr ? "جدول" : "Table"}
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Empty State */}
      {filteredReports.length === 0 && !loading && (
        <Card className="border border-default-200/60 shadow-sm rounded-3xl p-12 text-center bg-background/60">
          <CardBody className="flex flex-col items-center justify-center gap-3">
            <div className="p-4 rounded-3xl bg-default-100 text-default-400">
              <ListTodo size={40} />
            </div>
            <h3 className="text-lg font-bold text-foreground">
              {isAr ? "لا توجد تقارير مطابقة للشروط" : "No matching reports found"}
            </h3>
            <p className="text-xs text-default-400 max-w-sm">
              {isAr
                ? "لم نجد تقارير تناسب معايير البحث المحددة. جرب اختيار تاريخ آخر أو إزالة الفلاتر."
                : "No daily reports match the applied filter options."}
            </p>
          </CardBody>
        </Card>
      )}

      {/* Grid View */}
      {viewMode === "grid" && filteredReports.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredReports.map((report) => {
            const hasBlockers = !!report.blockers && report.blockers.trim().length > 0;
            return (
              <Card
                key={report.id}
                className="border border-default-200/60 shadow-md hover:shadow-xl transition-all rounded-3xl bg-background/80 backdrop-blur-xl overflow-hidden flex flex-col justify-between"
              >
                <CardBody className="p-6 space-y-4">
                  {/* Employee & Date Header */}
                  <div className="flex items-start justify-between gap-3">
                    <User
                      name={report.employeeName}
                      description={
                        <span className="text-[11px] text-default-400 flex items-center gap-1 mt-0.5">
                          <Calendar size={12} />
                          {report.date}
                          {report.totalHours ? ` • ${report.totalHours}h` : ""}
                        </span>
                      }
                      avatarProps={{
                        src: report.userPhotoUrl,
                        name: report.employeeName.slice(0, 2),
                        size: "md",
                        className: "bg-purple-500/20 text-purple-600 font-bold border border-purple-500/30",
                      }}
                    />

                    <div className="flex flex-col items-end gap-1">
                      <div className="flex items-center gap-0.5 text-amber-500 text-xs font-black">
                        <Star size={13} className="fill-amber-500" />
                        <span>{report.productivityRating || 5}/5</span>
                      </div>
                      {report.status === "reviewed" ? (
                        <Chip size="sm" color="success" variant="flat" className="font-bold text-[10px] h-5">
                          {isAr ? "مقيّم الإدارة" : "Reviewed"}
                        </Chip>
                      ) : (
                        <Chip size="sm" color="default" variant="flat" className="font-bold text-[10px] h-5">
                          {isAr ? "مُقدّم" : "Submitted"}
                        </Chip>
                      )}
                    </div>
                  </div>

                  {/* Summary Snippet */}
                  <p className="text-xs text-foreground/90 font-medium line-clamp-2 leading-relaxed bg-default-50/60 p-3 rounded-2xl border border-default-100">
                    {report.summary || (isAr ? "لا يوجد ملخص مدون" : "No summary provided")}
                  </p>

                  {/* Tasks Summary Chips */}
                  <div className="space-y-2">
                    {report.tasksCompleted.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 block mb-1">
                          {isAr ? `إنجازات مكتملة (${report.tasksCompleted.length})` : `Completed (${report.tasksCompleted.length})`}
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                          {report.tasksCompleted.slice(0, 3).map((t) => (
                            <Chip
                              key={t.id}
                              size="sm"
                              color="success"
                              variant="flat"
                              className="font-bold text-[10px] truncate max-w-[200px]"
                            >
                              ✓ {t.title}
                            </Chip>
                          ))}
                          {report.tasksCompleted.length > 3 && (
                            <Chip size="sm" color="success" variant="dot" className="font-bold text-[10px]">
                              +{report.tasksCompleted.length - 3}
                            </Chip>
                          )}
                        </div>
                      </div>
                    )}

                    {report.tasksInProgress.length > 0 && (
                      <div>
                        <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 block mb-1">
                          {isAr ? `قيد التنفيذ (${report.tasksInProgress.length})` : `In Progress (${report.tasksInProgress.length})`}
                        </span>
                        <div className="flex flex-wrap gap-1 max-h-16 overflow-hidden">
                          {report.tasksInProgress.slice(0, 2).map((t) => (
                            <Chip
                              key={t.id}
                              size="sm"
                              color="warning"
                              variant="flat"
                              className="font-bold text-[10px] truncate max-w-[200px]"
                            >
                              ⏳ {t.title}
                            </Chip>
                          ))}
                          {report.tasksInProgress.length > 2 && (
                            <Chip size="sm" color="warning" variant="dot" className="font-bold text-[10px]">
                              +{report.tasksInProgress.length - 2}
                            </Chip>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Blockers Banner if present */}
                  {hasBlockers && (
                    <div className="p-3 rounded-2xl bg-danger-500/10 border border-danger-500/20 text-danger text-[11px] font-semibold flex items-start gap-2">
                      <AlertTriangle size={14} className="shrink-0 mt-0.5" />
                      <span className="line-clamp-2">{report.blockers}</span>
                    </div>
                  )}

                  {/* Footer Actions */}
                  <div className="pt-2 border-t border-default-100 flex items-center justify-between gap-2">
                    <Button
                      size="sm"
                      variant="flat"
                      color="secondary"
                      onPress={() => handleOpenDetail(report)}
                      startContent={<Eye size={15} />}
                      className="font-bold text-xs rounded-xl flex-1"
                    >
                      {isAr ? "التفاصيل والتقييم" : "View Details"}
                    </Button>

                    <Tooltip content={isAr ? "طباعة التقرير" : "Print"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        onPress={() => handlePrintReport(report)}
                        className="rounded-xl"
                      >
                        <Printer size={15} />
                      </Button>
                    </Tooltip>

                    <Tooltip content={isAr ? "نسخ نص التقرير" : "Copy Text"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        onPress={() => handleCopyReportText(report)}
                        className="rounded-xl"
                      >
                        <Copy size={15} />
                      </Button>
                    </Tooltip>

                    <Tooltip content={isAr ? "مشاركة عبر واتساب" : "Share WhatsApp"}>
                      <Button
                        size="sm"
                        isIconOnly
                        variant="flat"
                        color="success"
                        onPress={() => handleShareWhatsApp(report)}
                        className="rounded-xl"
                      >
                        <Share2 size={15} />
                      </Button>
                    </Tooltip>
                  </div>
                </CardBody>
              </Card>
            );
          })}
        </div>
      )}

      {/* Table View */}
      {viewMode === "table" && filteredReports.length > 0 && (
        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl overflow-hidden">
          <CardBody className="p-0">
            <Table aria-label="جدول تقارير إنجاز المهام" className="w-full">
              <TableHeader>
                <TableColumn>{t("daily_report.col_employee", "الموظف")}</TableColumn>
                <TableColumn>{t("daily_report.col_date_time", "التاريخ والوقت")}</TableColumn>
                <TableColumn>{t("daily_report.col_tasks", "المهام المكتملة")}</TableColumn>
                <TableColumn>{t("daily_report.task_in_progress", "قيد التنفيذ")}</TableColumn>
                <TableColumn>{t("daily_report.col_summary", "الملخص والمعوقات")}</TableColumn>
                <TableColumn align="center">{isAr ? "الإجراءات" : "Actions"}</TableColumn>
              </TableHeader>
              <TableBody emptyContent="لا توجد تقارير مهام مطابقة">
                {filteredReports.map((report) => (
                  <TableRow key={report.id} className="hover:bg-default-50/50 transition-colors">
                    <TableCell>
                      <User
                        name={report.employeeName}
                        avatarProps={{
                          src: report.userPhotoUrl,
                          name: report.employeeName.slice(0, 2),
                          size: "sm",
                          className: "bg-purple-500/20 text-purple-600 font-bold",
                        }}
                      />
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-foreground flex items-center gap-1">
                          <Calendar size={13} className="text-default-400" />
                          {report.date}
                        </span>
                        {report.totalHours && (
                          <span className="text-[10px] text-default-400 font-medium">
                            {report.totalHours} {isAr ? "ساعة عمل" : "hours"}
                          </span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {report.tasksCompleted.length > 0 ? (
                          report.tasksCompleted.map((t) => (
                            <Chip key={t.id} size="sm" color="success" variant="flat" className="font-bold text-[10px]">
                              ✓ {t.title}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-300">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell>
                      <div className="flex flex-wrap gap-1">
                        {report.tasksInProgress.length > 0 ? (
                          report.tasksInProgress.map((t) => (
                            <Chip key={t.id} size="sm" color="warning" variant="flat" className="font-bold text-[10px]">
                              ⏳ {t.title}
                            </Chip>
                          ))
                        ) : (
                          <span className="text-xs text-default-300">—</span>
                        )}
                      </div>
                    </TableCell>

                    <TableCell className="max-w-xs">
                      <p className="text-xs text-foreground font-medium line-clamp-2">
                        {report.summary}
                      </p>
                      {report.blockers && (
                        <div className="mt-1 flex items-center gap-1 text-[10px] text-danger font-bold">
                          <AlertTriangle size={11} />
                          معوقات: {report.blockers}
                        </div>
                      )}
                    </TableCell>

                    <TableCell align="center">
                      <div className="flex items-center justify-center gap-1">
                        <Button
                          size="sm"
                          variant="flat"
                          color="primary"
                          onPress={() => handleOpenDetail(report)}
                          startContent={<Eye size={14} />}
                          className="font-bold text-xs rounded-xl"
                        >
                          {isAr ? "عرض" : "View"}
                        </Button>
                        <Button
                          size="sm"
                          isIconOnly
                          variant="light"
                          onPress={() => handlePrintReport(report)}
                        >
                          <Printer size={15} />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardBody>
        </Card>
      )}

      {/* Report Detail Side Drawer */}
      <Drawer
        isOpen={!!selectedReport}
        onClose={() => setSelectedReport(null)}
        placement={isAr ? "left" : "right"}
        size="4xl"
        backdrop="blur"
        classNames={{
          base: "bg-background dark:bg-content1 text-foreground border-s border-default-200 dark:border-default-100 shadow-2xl h-full",
        }}
      >
        <DrawerContent dir={isAr ? "rtl" : "ltr"}>
          {selectedReport && (
            <>
              <DrawerHeader className="flex justify-between items-center border-b border-default-200/60 pb-4 bg-default-100/40">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                    <ListTodo className="w-6 h-6" />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-foreground">
                      {isAr ? "تفاصيل تقرير المهام اليومي" : "Daily Task Report Details"}
                    </h2>
                    <p className="text-xs text-default-400">
                      {selectedReport.employeeName} • {selectedReport.date}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="flat"
                    color="primary"
                    onPress={() => handlePrintReport(selectedReport)}
                    startContent={<Printer size={15} />}
                    className="font-bold text-xs rounded-xl"
                  >
                    {isAr ? "طباعة" : "Print"}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="default"
                    onPress={() => handleCopyReportText(selectedReport)}
                    startContent={<Copy size={15} />}
                    className="font-bold text-xs rounded-xl"
                  >
                    {isAr ? "نسخ النص" : "Copy Text"}
                  </Button>
                  <Button
                    size="sm"
                    variant="flat"
                    color="success"
                    onPress={() => handleShareWhatsApp(selectedReport)}
                    startContent={<Share2 size={15} />}
                    className="font-bold text-xs rounded-xl"
                  >
                    {isAr ? "واتساب" : "WhatsApp"}
                  </Button>
                </div>
              </DrawerHeader>

              <DrawerBody className="p-6 space-y-6 overflow-y-auto">
                {/* Employee Header Profile */}
                <div className="p-5 rounded-3xl bg-default-50/70 border border-default-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <User
                    name={selectedReport.employeeName}
                    description={
                      <div className="space-y-1 mt-1">
                        <p className="text-xs text-default-400 flex items-center gap-1">
                          <Calendar size={13} /> {selectedReport.date}
                          {selectedReport.checkInTime && ` • الحضور: ${selectedReport.checkInTime}`}
                          {selectedReport.checkOutTime && ` - والانصراف: ${selectedReport.checkOutTime}`}
                        </p>
                      </div>
                    }
                    avatarProps={{
                      src: selectedReport.userPhotoUrl,
                      name: selectedReport.employeeName.slice(0, 2),
                      size: "lg",
                      className: "bg-purple-500/20 text-purple-600 font-bold border-2 border-purple-500/30",
                    }}
                  />

                  <div className="flex flex-col items-start sm:items-end gap-1.5">
                    <span className="text-xs text-default-400 font-semibold">{isAr ? "تقييم الإنتاجية الذاتي:" : "Self Productivity:"}</span>
                    <div className="flex items-center gap-1 text-amber-500 font-black text-lg">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={18}
                          className={star <= selectedReport.productivityRating ? "fill-amber-500 text-amber-500" : "text-default-300"}
                        />
                      ))}
                      <span className="ms-2 text-foreground text-sm">({selectedReport.productivityRating}/5)</span>
                    </div>
                  </div>
                </div>

                {/* Completed Tasks */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
                    <CheckCircle2 size={16} />
                    {isAr ? `المهام المنجزة بنجاح (${selectedReport.tasksCompleted.length})` : `Completed Tasks (${selectedReport.tasksCompleted.length})`}
                  </h3>
                  {selectedReport.tasksCompleted.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedReport.tasksCompleted.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-900 dark:text-emerald-200 text-xs font-bold flex items-center gap-2"
                        >
                          <Check size={14} className="text-emerald-500 shrink-0" />
                          <span>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-default-400 italic p-3 bg-default-50 rounded-2xl">
                      {isAr ? "لم تدرج مهام مكتملة في هذا التقرير" : "No completed tasks listed"}
                    </p>
                  )}
                </div>

                {/* In Progress Tasks */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-amber-600 dark:text-amber-400 flex items-center gap-2">
                    <Clock size={16} />
                    {isAr ? `المهام الجاري العمل عليها (${selectedReport.tasksInProgress.length})` : `Tasks In Progress (${selectedReport.tasksInProgress.length})`}
                  </h3>
                  {selectedReport.tasksInProgress.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedReport.tasksInProgress.map((t) => (
                        <div
                          key={t.id}
                          className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-900 dark:text-amber-200 text-xs font-bold flex items-center gap-2"
                        >
                          <Clock size={14} className="text-amber-500 shrink-0" />
                          <span>{t.title}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-default-400 italic p-3 bg-default-50 rounded-2xl">
                      {isAr ? "لا توجد مهام قيد التنفيذ" : "No in-progress tasks"}
                    </p>
                  )}
                </div>

                {/* Summary */}
                <div className="space-y-2">
                  <h3 className="text-sm font-bold text-foreground flex items-center gap-2">
                    <MessageSquare size={16} className="text-primary" />
                    {isAr ? "ملخص الإنجاز اليومي" : "Daily Accomplishment Summary"}
                  </h3>
                  <div className="p-4 rounded-3xl bg-default-50 border border-default-200/60 text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {selectedReport.summary || (isAr ? "لا يوجد ملخص مدون" : "No summary written")}
                  </div>
                </div>

                {/* Blockers & Challenges */}
                {selectedReport.blockers && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-danger flex items-center gap-2">
                      <AlertTriangle size={16} />
                      {isAr ? "المعوقات والتحديات" : "Blockers & Issues"}
                    </h3>
                    <div className="p-4 rounded-3xl bg-danger-500/10 border border-danger-500/20 text-danger text-sm font-semibold leading-relaxed">
                      {selectedReport.blockers}
                    </div>
                  </div>
                )}

                {/* Plan Tomorrow */}
                {selectedReport.planTomorrow && (
                  <div className="space-y-2">
                    <h3 className="text-sm font-bold text-purple-600 dark:text-purple-400 flex items-center gap-2">
                      <Sparkles size={16} />
                      {isAr ? "خطة عمل الغد" : "Plan for Tomorrow"}
                    </h3>
                    <div className="p-4 rounded-3xl bg-purple-500/10 border border-purple-500/20 text-purple-900 dark:text-purple-200 text-sm font-medium leading-relaxed">
                      {selectedReport.planTomorrow}
                    </div>
                  </div>
                )}

                {/* Manager Review Box */}
                <div className="p-5 rounded-3xl bg-primary-50/40 border border-primary/20 space-y-4">
                  <h3 className="text-sm font-black text-primary flex items-center gap-2">
                    <UserCheck size={18} />
                    {isAr ? "تقييم وتوجيهات الإدارة / المشرف" : "Manager Review & Feedback"}
                  </h3>

                  {selectedReport.reviewedByName && (
                    <p className="text-xs text-default-500 font-semibold">
                      {isAr ? `تم التقييم بواسطة: ${selectedReport.reviewedByName}` : `Reviewed by: ${selectedReport.reviewedByName}`}
                    </p>
                  )}

                  <div className="space-y-2">
                    <label className="text-xs font-bold text-foreground block">
                      {isAr ? "درجة التقييم:" : "Rating:"}
                    </label>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onClick={() => setManagerRating(star)}
                          className="focus:outline-none transition-transform hover:scale-110"
                        >
                          <Star
                            size={24}
                            className={star <= managerRating ? "fill-amber-500 text-amber-500" : "text-default-300"}
                          />
                        </button>
                      ))}
                    </div>
                  </div>

                  <Textarea
                    label={isAr ? "ملاحظات الإدارة والتعليمات:" : "Manager Comments:"}
                    placeholder={isAr ? "اكتب توجيهات المتابعة للموظف..." : "Add supervisor comments..."}
                    value={managerComment}
                    onValueChange={setManagerComment}
                    variant="bordered"
                    minRows={2}
                    classNames={{ inputWrapper: "rounded-2xl bg-background" }}
                  />

                  <Button
                    color="primary"
                    onPress={handleSaveReview}
                    isLoading={isSubmittingReview}
                    className="font-bold text-xs rounded-2xl"
                    startContent={<Check size={16} />}
                  >
                    {isAr ? "حفظ تقييم الإدارة" : "Save Review"}
                  </Button>
                </div>
              </DrawerBody>

              <DrawerFooter className="border-t border-default-200/60 p-4 bg-default-100/30">
                <Button
                  variant="flat"
                  onPress={() => setSelectedReport(null)}
                  className="font-bold text-xs rounded-2xl"
                >
                  {isAr ? "إغلاق" : "Close"}
                </Button>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </div>
  );
}
