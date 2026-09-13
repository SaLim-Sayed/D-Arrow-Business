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
  Star, 
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
import { DailyReportsService } from "../api/daily-reports.service";
import type { DailyReport } from "../types/daily-report.types";

export default function DailyReportsPage() {
  const { t } = useTranslation("people");
  const { companyId } = useCompany();
  const { user } = useAuth();

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
    setLoading(true);
    try {
      const res = await DailyReportsService.getDailyReports(companyId);
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
  }, [companyId]);

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
    });
  }, [reports, searchQuery, statusFilter, selectedDate]);

  // Key Statistics
  const stats = useMemo(() => {
    const total = reports.length;
    const submitted = reports.filter((r) => !r.isSkipped).length;
    const skipped = reports.filter((r) => r.isSkipped).length;
    const withBlockers = reports.filter((r) => !!r.blockers && r.blockers.trim().length > 0).length;

    const ratedReports = reports.filter((r) => !r.isSkipped && r.productivityRating > 0);
    const avgRating = ratedReports.length > 0 
      ? (ratedReports.reduce((acc, curr) => acc + curr.productivityRating, 0) / ratedReports.length).toFixed(1)
      : "5.0";

    return { total, submitted, skipped, withBlockers, avgRating };
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
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary">
              <ClipboardCheck size={28} />
            </div>
            {t("daily_report.page_title")}
          </h1>
          <p className="text-sm text-default-400 mt-1">
            {t("daily_report.page_subtitle")}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="flat" 
            color="primary" 
            onPress={fetchReports} 
            isLoading={loading}
            startContent={<RefreshCw size={16} />}
            className="font-bold text-xs rounded-xl"
          >
            {t("daily_report.refresh")}
          </Button>
        </div>
      </div>

      {/* KPI Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
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
            <div className="p-3 rounded-2xl bg-amber-500/10 text-amber-500">
              <Star size={22} />
            </div>
            <div>
              <p className="text-xs text-default-400 font-bold uppercase tracking-wider">{t("daily_report.avg_productivity")}</p>
              <h3 className="text-2xl font-black text-foreground mt-0.5">{stats.avgRating} <span className="text-xs text-default-400">/ 5</span></h3>
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
        <CardBody className="p-4 flex flex-col md:flex-row items-center gap-4 justify-between">
          <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto flex-1">
            <Input
              placeholder={t("daily_report.search_placeholder")}
              value={searchQuery}
              onValueChange={setSearchQuery}
              startContent={<Search size={16} className="text-default-400" />}
              variant="bordered"
              size="sm"
              className="w-full md:w-80"
              classNames={{ inputWrapper: "rounded-2xl" }}
            />

            <Input
              type="date"
              value={selectedDate}
              onValueChange={setSelectedDate}
              size="sm"
              variant="bordered"
              className="w-full md:w-48"
              classNames={{ inputWrapper: "rounded-2xl" }}
            />

            <Select
              selectedKeys={[statusFilter]}
              onSelectionChange={(keys) => setStatusFilter(Array.from(keys)[0] as string)}
              size="sm"
              variant="bordered"
              className="w-full md:w-44"
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
          <Table aria-label="جدول تقارير العمل اليومية" className="w-full">
            <TableHeader>
              <TableColumn>{t("daily_report.col_employee")}</TableColumn>
              <TableColumn>{t("daily_report.col_date_time")}</TableColumn>
              <TableColumn>{t("daily_report.col_status")}</TableColumn>
              <TableColumn>{t("daily_report.col_tasks")}</TableColumn>
              <TableColumn>{t("daily_report.col_summary")}</TableColumn>
              <TableColumn>{t("daily_report.col_rating")}</TableColumn>
              <TableColumn align="center">{t("daily_report.col_actions")}</TableColumn>
            </TableHeader>
            <TableBody emptyContent="لا توجد تقارير عمل يومية تطابق البحث الحالية">
              {filteredReports.map((report) => (
                <TableRow key={report.id} className="hover:bg-default-50/50 transition-colors">
                  <TableCell>
                    <User
                      name={report.employeeName}
                      description={report.employeeId}
                      avatarProps={{
                        src: report.userPhotoUrl,
                        name: report.employeeName.slice(0, 2),
                        size: "sm",
                        className: "bg-primary/20 text-primary font-bold"
                      }}
                    />
                  </TableCell>

                  <TableCell>
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
                    <p className="text-xs text-foreground truncate font-medium">
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
                    {!report.isSkipped ? (
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={14}
                            fill={star <= report.productivityRating ? "currentColor" : "none"}
                            className={star <= report.productivityRating ? "text-amber-500" : "text-default-200"}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="text-xs text-default-300">—</span>
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
                      التفاصيل والتقييم
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
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
                        src: selectedReport.userPhotoUrl,
                        name: selectedReport.employeeName.slice(0, 2),
                        size: "md",
                        className: "bg-primary/20 text-primary font-bold"
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

                      {/* Manager Feedback Form */}
                      <div className="space-y-3">
                        <label className="text-xs font-black uppercase text-default-500 tracking-wider flex items-center gap-1.5">
                          <MessageSquare size={14} className="text-primary" />
                          ملاحظات وتقييم الإدارة / الموارد البشرية
                        </label>
                        <Textarea
                          placeholder="اكتب توجيهاتك أو ملاحظات التقييم للموظف..."
                          value={managerComment}
                          onValueChange={setManagerComment}
                          variant="bordered"
                          minRows={3}
                          classNames={{ inputWrapper: "rounded-2xl" }}
                        />
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
                  {!selectedReport.isSkipped && (
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
