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
  TableCell 
} from "@heroui/react";
import { 
  ListTodo, 
  Calendar, 
  Search, 
  RefreshCw, 
  AlertTriangle 
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useCompany } from "@/features/companies/context/company-context";
import { DailyReportsService } from "@/features/people/api/daily-reports.service";
import type { DailyReport } from "@/features/people/types/daily-report.types";

export default function TaskDailyReportsPage() {
  const { t } = useTranslation("people");
  const { companyId } = useCompany();
  const [reports, setReports] = useState<DailyReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

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
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [companyId]);

  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      const hasTaskMatch = r.tasksCompleted.some((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase())) ||
        r.tasksInProgress.some((t) => t.title.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesText = 
        r.employeeName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.summary.toLowerCase().includes(searchQuery.toLowerCase());

      return !searchQuery || hasTaskMatch || matchesText;
    });
  }, [reports, searchQuery]);

  return (
    <div className="p-6 md:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <ListTodo size={28} />
            </div>
            {t("daily_report.page_title")}
          </h1>
          <p className="text-sm text-default-400 mt-1">
            {t("daily_report.page_subtitle")}
          </p>
        </div>

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

      {/* Filter Bar */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl">
        <CardBody className="p-4">
          <Input
            placeholder={t("daily_report.search_placeholder")}
            value={searchQuery}
            onValueChange={setSearchQuery}
            startContent={<Search size={16} className="text-default-400" />}
            variant="bordered"
            size="sm"
            className="w-full md:w-96"
            classNames={{ inputWrapper: "rounded-2xl" }}
          />
        </CardBody>
      </Card>

      {/* Reports Table */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/60 backdrop-blur-xl overflow-hidden">
        <CardBody className="p-0">
          <Table aria-label="جدول تقارير إنجاز المهام" className="w-full">
            <TableHeader>
              <TableColumn>{t("daily_report.col_employee")}</TableColumn>
              <TableColumn>{t("daily_report.col_date_time")}</TableColumn>
              <TableColumn>{t("daily_report.col_tasks")}</TableColumn>
              <TableColumn>{t("daily_report.task_in_progress")}</TableColumn>
              <TableColumn>{t("daily_report.col_summary")}</TableColumn>
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
                        className: "bg-purple-500/20 text-purple-600 font-bold"
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <span className="text-xs font-bold text-foreground flex items-center gap-1">
                      <Calendar size={13} className="text-default-400" />
                      {report.date}
                    </span>
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

                  <TableCell className="max-w-md">
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardBody>
      </Card>
    </div>
  );
}
