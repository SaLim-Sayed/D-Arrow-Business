import { useState, useEffect, useMemo } from "react";
import { 
  Card, 
  CardBody, 
  Button, 
  Input, 
  Select, 
  SelectItem, 
  Table, 
  TableHeader, 
  TableColumn, 
  TableBody, 
  TableRow, 
  TableCell, 
  Chip, 
  User, 
  Modal, 
  ModalContent, 
  ModalHeader, 
  ModalBody, 
  ModalFooter, 
  Textarea, 
  Divider 
} from "@heroui/react";
import { 
  ClipboardCheck, 
  Calendar, 
  Search, 
  AlertTriangle, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Sparkles, 
  RefreshCw, 
  AlertCircle 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import { useCompany } from "@/features/companies/context/company-context";
import { useAuth } from "@/features/auth/context/auth-context";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";
import { DailyReportsService } from "../api/daily-reports.service";
import type { DailyReport } from "../types/daily-report.types";
import { useReportAvatar } from "../hooks/use-report-avatar";
import { initialsFromName } from "@/lib/localized-name";
import { dayToneByKey } from "@/lib/day-tone-by-key";

export default function DailyReportsPage() {
  const { t } = useTranslation("people");
  const { companyId } = useCompany();
  const { user } = useAuth();
  const { canViewAllReports } = useAppPermissions();
  const reportAvatar = useReportAvatar();

  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [selectedDate, setSelectedDate] = useState<string>("");

  // Review Modal State
  const [selectedReport, setSelectedReport] = useState<DailyReport | null>(null);
  const [managerComment, setManagerComment] = useState("");
  const [managerRating, setManagerRating] = useState<number>(5);
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const fetchReports = async () => {
    if (!companyId) return;
    // Without the org-wide permission the query itself is narrowed to the signed-in
    // user, so other members' reports never reach the client.
    if (!canViewAllReports && !user?.id) return;
    setLoading(true);
    try {
      const res = await DailyReportsService.getDailyReports(
        companyId,
        canViewAllReports ? undefined : { employeeId: user!.id }
      );
      if (res.data) {
        setReports(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch daily reports:", err);
      toast.error("حدث خطأ أثناء تحميل تقارير العمل اليومية");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [companyId, canViewAllReports, user?.id]);

  // Filtered reports
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const matchesSearch = 
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (r.blockers && r.blockers.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesStatus = statusFilter === "all" || r.status === statusFilter;
      const matchesDate = !selectedDate || r.date === selectedDate;

      return matchesSearch && matchesStatus && matchesDate;
    }).sort((a, b) => b.date.localeCompare(a.date) || a.employeeName.localeCompare(b.employeeName));
  }, [reports, searchQuery, statusFilter, selectedDate]);
  const reportDayTones = dayToneByKey(filteredReports, (report) => report.date);

  // Key Statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const submitted = reports.filter((r) => !r.isSkipped).length;
    const skipped = reports.filter((r) => r.isSkipped).length;
    const withBlockers = reports.filter((r) => !!r.blockers && r.blockers.trim().length > 0).length;

    const reviewed = reports.filter((r) => r.status === "reviewed").length;

    return { total, submitted, skipped, withBlockers, reviewed };
  }, [reports]);

  const handleOpenReviewModal = (report: DailyReport) => {
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
      toast.success("تم إدراج تقييم الإدارة وملاحظات المتابعة بنجاح");
      setSelectedReport(null);
      fetchReports();
    } catch (err) {
      console.error("Failed to save manager review:", err);
      toast.error("حدث خطأ أثناء حفظ ملاحظات التقييم");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col gap-4 rounded-3xl border border-default-200/70 bg-content1 p-4 shadow-sm sm:p-6 md:flex-row md:items-center md:justify-between">
        <div className="min-w-0">
          <h1 className="flex items-center gap-3 text-xl font-black tracking-tight text-foreground sm:text-2xl md:text-3xl">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck size={28} />
            </div>
            {t("daily_report.page_title")}
          </h1>
          <p className="mt-2 flex flex-wrap items-center gap-2 text-sm text-default-500">
            {t("daily_report.page_subtitle")}
            {!canViewAllReports && (
              <Chip size="sm" variant="flat" color="primary" className="font-bold text-[10px]">
                {t("daily_report.scope_own")}
              </Chip>
            )}
          </p>
        </div>

        <div className="flex w-full items-center gap-3 md:w-auto">
          <Button 
            variant="flat" 
            color="primary" 
            onPress={fetchReports} 
            isLoading={loading}
            startContent={<RefreshCw size={16} />}
            className="w-full rounded-xl font-bold text-xs md:w-auto"
          >
            {t("daily_report.refresh")}
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 xl:grid-cols-5">
        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
          <CardBody className="p-5 flex flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase tracking-wider">{t("daily_report.total_reports")}</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.total}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
          <CardBody className="p-5 flex flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-success/10 text-success">
              <CheckCircle2 size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase tracking-wider">{t("daily_report.completed_reports")}</p>
              <h3 className="text-2xl font-black text-success mt-0.5">{stats.submitted}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
          <CardBody className="p-5 flex flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-warning/10 text-warning">
              <AlertCircle size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase tracking-wider">{t("daily_report.skipped_reports")}</p>
              <h3 className="text-2xl font-black text-warning mt-0.5">{stats.skipped}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
          <CardBody className="p-5 flex flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-secondary/10 text-secondary">
              <MessageSquare size={22} />
            </div>
            <div>
              <p className="text-xs text-default-500 font-bold">{t("daily_report.reviewed_reports")}</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.reviewed}</h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
          <CardBody className="p-5 flex flex-row items-center gap-4">
            <div className="p-3 rounded-2xl bg-danger/10 text-danger">
              <AlertTriangle size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase tracking-wider">{t("daily_report.blockers_reported")}</p>
              <h3 className="text-2xl font-black text-danger mt-0.5">{stats.withBlockers}</h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Filter Bar */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
        <CardBody className="flex flex-col items-stretch gap-3 p-4 lg:flex-row lg:items-center">
          <div className="grid w-full min-w-0 grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(220px,1fr)_180px_180px]">
            <Input
              placeholder={t("daily_report.search_placeholder")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-400" />}
              variant="bordered"
              size="sm"
              className="w-full min-w-0"
              classNames={{ inputWrapper: "rounded-2xl" }}
            />

            <Input
              type="date"
              value={selectedDate}
              onValueChange={setSelectedDate}
              size="sm"
              variant="bordered"
              className="w-full min-w-0"
              classNames={{ inputWrapper: "rounded-2xl" }}
            />

            <Select
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              size="sm"
              variant="bordered"
              className="w-full min-w-0"
              classNames={{ trigger: "rounded-2xl" }}
            >
              <SelectItem key="all">{t("daily_report.all_statuses")}</SelectItem>
              <SelectItem key="submitted">{t("daily_report.status_submitted")}</SelectItem>
              <SelectItem key="skipped">{t("daily_report.status_skipped")}</SelectItem>
              <SelectItem key="reviewed">{t("daily_report.status_reviewed")}</SelectItem>
            </Select>
          </div>
        </CardBody>
      </Card>

      {/* Daily Reports Table */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl overflow-hidden">
        <CardBody className="p-0">
          <div className="w-full overflow-x-auto">
          <Table
            aria-label={t("daily_report.page_title")}
            className="min-w-[820px]"
            classNames={{
              th: "h-12 bg-default-50/80 text-xs font-bold text-default-600",
              td: "py-3.5",
            }}
          >
            <TableHeader>
              <TableColumn className="min-w-[180px]">{t("daily_report.col_employee")}</TableColumn>
              <TableColumn className="min-w-[125px]">{t("daily_report.col_date_time")}</TableColumn>
              <TableColumn>{t("daily_report.col_status")}</TableColumn>
              <TableColumn>{t("daily_report.col_tasks")}</TableColumn>
              <TableColumn className="min-w-[220px]">{t("daily_report.col_summary")}</TableColumn>
              <TableColumn align="center">{t("daily_report.col_actions")}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="لا توجد تقارير عمل يومية تطابق البحث الحالية">
              {filteredReports.map((report, index) => (
                <TableRow
                  key={report.id}
                  tabIndex={0}
                  aria-label={`عرض تفاصيل تقرير ${report.employeeName} بتاريخ ${report.date}`}
                  onClick={(event) => {
                    if ((event.target as HTMLElement).closest("button, a, [role='button']")) return;
                    handleOpenReviewModal(report);
                  }}
                  onKeyDown={(event) => {
                    if (event.target !== event.currentTarget) return;
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      handleOpenReviewModal(report);
                    }
                  }}
                  className={[
                    "report-clickable-row",
                    index > 0 && report.date !== filteredReports[index - 1].date && "attendance-day-divider",
                    `day-group-tone-${reportDayTones.get(report.date) ?? 0}`,
                  ].filter(Boolean).join(" ")}
                >
                  <TableCell>
                    <User
                      name={<span className="block max-w-[160px] truncate font-semibold" title={report.employeeName}>{report.employeeName}</span>}
                      avatarProps={{
                        src: reportAvatar(report),
                        name: report.employeeName,
                        fallback: initialsFromName(report.employeeName),
                        showFallback: true,
                        size: "sm",
                        className: "bg-primary/10 text-primary font-bold"
                      }}
                    />
                  </TableCell>

                  <TableCell className="whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-foreground flex items-center gap-1">
                        <Calendar size={13} className="text-default-400" />
                        {report.date}
                      </span>
                      <span className="text-[11px] text-default-400 flex items-center gap-1 mt-0.5">
                        <Clock size={12} />
                        {report.totalHours ? `${report.totalHours} ساعة` : "—"}
                      </span>
                    </div>
                  </TableCell>

                  <TableCell>
                    {report.isSkipped ? (
                      <Chip size="sm" color="warning" variant="flat" className="font-bold text-[10px]">
                        تخطي مؤقت
                      </Chip>
                    ) : report.status === "reviewed" ? (
                      <Chip size="sm" color="primary" variant="flat" className="font-bold text-[10px]">
                        مُقَيَّم
                      </Chip>
                    ) : (
                      <Chip size="sm" color="success" variant="flat" className="font-bold text-[10px]">
                        مُقدَّم
                      </Chip>
                    )}
                  </TableCell>

                  <TableCell>
                    <div className="flex items-center gap-1.5">
                      <Chip size="sm" variant="dot" color="success" className="text-[11px] border-none font-bold">
                        {report.tasksCompleted.length} منجزة
                      </Chip>
                      {report.tasksInProgress.length > 0 && (
                        <Chip size="sm" variant="dot" color="warning" className="text-[11px] border-none font-bold">
                          {report.tasksInProgress.length} قيد العمل
                        </Chip>
                      )}
                    </div>
                  </TableCell>

                  <TableCell className="max-w-xs">
                    <p dir="auto" className="truncate text-xs font-medium text-foreground">
                      {report.summary}
                    </p>
                    {report.blockers && (
                      <span className="inline-flex items-center gap-1 text-[10px] text-danger font-bold mt-0.5">
                        <AlertTriangle size={10} />
                        يوجد معوقات مسجلة
                      </span>
                    )}
                  </TableCell>

                  <TableCell>
                    <Button
                      size="sm"
                      variant="flat"
                      color="primary"
                      onPress={() => handleOpenReviewModal(report)}
                      className="font-bold text-xs rounded-xl"
                    >
                      {canViewAllReports ? "التفاصيل والتقييم" : "التفاصيل"}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          </div>
        </CardBody>
      </Card>

      {/* Report Details & Review Modal */}
      {selectedReport && (
        <Modal
          isOpen={!!selectedReport}
          onClose={() => setSelectedReport(null)}
          size="2xl"
          scrollBehavior="inside"
          backdrop="blur"
          className="bg-background/95 backdrop-blur-2xl border border-default-200/50 shadow-2xl rounded-3xl"
        >
          <ModalContent>
            {() => (
              <>
                <ModalHeader className="flex flex-col gap-1 border-b border-default-100/60 pb-4 pt-6 px-6">
                  <div className="flex items-center justify-between">
                    <User
                      name={selectedReport.employeeName}
                      description={`تقرير يوم: ${selectedReport.date}`}
                      avatarProps={{
                        src: reportAvatar(selectedReport),
                        name: selectedReport.employeeName,
                        fallback: initialsFromName(selectedReport.employeeName),
                        showFallback: true,
                        size: "md",
                        className: "bg-primary/10 text-primary font-bold"
                      }}
                    />
                    <Chip 
                      size="sm" 
                      color={selectedReport.isSkipped ? "warning" : "success"} 
                      variant="flat" 
                      className="font-bold text-xs"
                    >
                      {selectedReport.isSkipped ? "تخطي إدخال التقرير" : "تقرير مكتمل"}
                    </Chip>
                  </div>
                </ModalHeader>

                <ModalBody className="py-6 px-6 space-y-6">
                  {!selectedReport.isSkipped ? (
                    <>
                      {/* Completed Tasks List */}
                      <div className="space-y-2">
                        <label className="text-xs font-black uppercase text-default-500 tracking-wider">
                          المهام المنجزة والجاري العمل عليها
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {selectedReport.tasksCompleted.map((t) => (
                            <Chip key={t.id} color="success" variant="flat" size="sm" className="font-bold">
                              ✓ {t.title}
                            </Chip>
                          ))}
                          {selectedReport.tasksInProgress.map((t) => (
                            <Chip key={t.id} color="warning" variant="flat" size="sm" className="font-bold">
                              ⏳ {t.title}
                            </Chip>
                          ))}
                          {selectedReport.tasksCompleted.length === 0 && selectedReport.tasksInProgress.length === 0 && (
                            <span className="text-xs text-default-400">لم يتم تحديد مهام من القائمة</span>
                          )}
                        </div>
                      </div>

                      {/* Summary */}
                      <div className="p-4 rounded-2xl bg-default-50 border border-default-100 space-y-1">
                        <span className="text-xs font-bold text-primary block">ملخص الإنجازات اليومية:</span>
                        <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                          {selectedReport.summary}
                        </p>
                      </div>

                      {/* Blockers */}
                      {selectedReport.blockers && (
                        <div className="p-4 rounded-2xl bg-danger/5 border border-danger/20 space-y-1">
                          <span className="text-xs font-bold text-danger flex items-center gap-1.5">
                            <AlertTriangle size={14} />
                            التحديات والمعوقات المسجلة:
                          </span>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {selectedReport.blockers}
                          </p>
                        </div>
                      )}

                      {/* Plan for Tomorrow */}
                      {selectedReport.planTomorrow && (
                        <div className="p-4 rounded-2xl bg-primary/5 border border-primary/20 space-y-1">
                          <span className="text-xs font-bold text-primary flex items-center gap-1.5">
                            <Sparkles size={14} />
                            خطة العمل للغد:
                          </span>
                          <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {selectedReport.planTomorrow}
                          </p>
                        </div>
                      )}

                      <Divider />

                      {/* Manager Feedback — editable for managers, read-only for the report owner */}
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-primary" />
                          ملاحظات وتقييم الإدارة / الموارد البشرية
                        </label>
                        {canViewAllReports ? (
                          <Textarea
                            placeholder="اكتب توجيهاتك أو ملاحظات التقييم للموظف..."
                            value={managerComment}
                            onValueChange={setManagerComment}
                            variant="bordered"
                            minRows={3}
                            classNames={{ inputWrapper: "rounded-2xl" }}
                          />
                        ) : (
                          <p className="p-4 rounded-2xl bg-default-50 border border-default-100 text-sm text-foreground leading-relaxed whitespace-pre-line">
                            {selectedReport.managerComment?.trim() || "لم تُضف ملاحظات من الإدارة بعد"}
                          </p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="p-4 rounded-2xl bg-warning/10 border border-warning/20 text-center space-y-2">
                      <AlertTriangle size={24} className="text-warning mx-auto" />
                      <h4 className="text-sm font-bold text-foreground">قام الموظف بتخطي التقرير اليومي</h4>
                      <p className="text-xs text-default-400">
                        سبب التخطي المسجل: {selectedReport.skipReason || "خروج طارئ"}
                      </p>
                    </div>
                  )}
                </ModalBody>

                <ModalFooter className="border-t border-default-100/60 pt-4 pb-6 px-6 flex items-center justify-between">
                  <Button variant="flat" color="default" onPress={() => setSelectedReport(null)}>
                    إغلاق
                  </Button>
                  {!selectedReport.isSkipped && canViewAllReports && (
                    <Button 
                      color="primary" 
                      variant="shadow"
                      onPress={handleSaveReview}
                      isLoading={isSubmittingReview}
                      className="font-bold text-xs"
                    >
                      حفظ التقييم والملاحظات
                    </Button>
                  )}
                </ModalFooter>
              </>
            )}
          </ModalContent>
        </Modal>
      )}
    </div>
  );
}
