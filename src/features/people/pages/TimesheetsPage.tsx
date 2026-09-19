import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Avatar,
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Pagination,
  Select,
  SelectItem,
  Table,
  TableHeader,
  TableColumn,
  TableBody,
  TableRow,
  TableCell,
  Tooltip,
} from "@heroui/react";
import {
  Download,
  Clock,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  MapPin,
  Timer,
} from "lucide-react";
import { useEmployeesQuery, useAllAttendanceQuery } from "../hooks/use-people";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useTranslation } from "react-i18next";
import { TimeTrackerWidget } from "../components/TimeTrackerWidget";
import { employeeDisplayName } from "../utils/geo";
import { selectFieldProps } from "@/components/shared/select-field";
import { initialsFromName } from "@/lib/localized-name";
import { avatarSrc } from "@/lib/image-utils";
import { alternatingDayKeys } from "@/lib/alternating-day-keys";
import type { Attendance, Employee } from "../types/people.types";

const ROWS_PER_PAGE = 25;
/** How often open shifts refresh their elapsed hours. */
const LIVE_TICK_MS = 30_000;
const MS_PER_HOUR = 3_600_000;
/** Friday + Saturday. Days off are never counted as an absence. */
const WEEKEND_DAYS = new Set([5, 6]);

/** `working` = shift still open today, `open` = a past day never checked out. */
type RowStatus = "working" | "present" | "late" | "open" | "absent";

type StatusFilter = "all" | "attended" | "working" | "open" | "absent";

interface Person {
  name: string;
  email: string;
  avatar?: string;
  department: string;
  /** Set when the punch belongs to no current employee record. */
  unlinked?: boolean;
}

interface TimesheetRow extends Person {
  id: string;
  /** Employee document id, or the account uid for unlinked punches. */
  ownerId: string;
  date: string;
  checkIn: number | null;
  checkOut: number | null;
  hours: number;
  sessions: number;
  location: string | null;
  status: RowStatus;
}

/**
 * `YYYY-MM-DD` from the local calendar date. Attendance documents store `date`
 * as a UTC day, which lands on the previous day for any positive UTC offset, so
 * both sides of the lookup are rebuilt from local time instead.
 */
function toDayKey(date: Date): string {
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${month}-${day}`;
}

/** Reads a day key back as a local calendar date so it never shifts a day. */
function fromDayKey(key: string): Date {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, (month ?? 1) - 1, day ?? 1);
}

function toMillis(value: unknown): number | null {
  if (!value) return null;
  if (value instanceof Date) return value.getTime();
  if (typeof value === "string") {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? null : parsed;
  }
  if (typeof value === "object" && typeof (value as { toDate?: unknown }).toDate === "function") {
    return (value as { toDate: () => Date }).toDate().getTime();
  }
  return null;
}

/**
 * Folds every punch of one employee-day into a single row. A day can hold
 * several attendance documents because each break closes one and resuming
 * opens another, so hours are summed instead of read off a single record.
 */
function summarizeDay(
  sessions: Attendance[],
  dayKey: string,
  todayKey: string,
  nowMs: number
): Pick<TimesheetRow, "checkIn" | "checkOut" | "hours" | "sessions" | "location" | "status"> {
  let checkIn: number | null = null;
  let checkOut: number | null = null;
  let hours = 0;
  let location: string | null = null;
  let hasOpenShift = false;
  let isLate = false;

  for (const session of sessions) {
    const startedAt = toMillis(session.checkIn);
    const endedAt = toMillis(session.checkOut);

    if (startedAt !== null && (checkIn === null || startedAt < checkIn)) {
      checkIn = startedAt;
      location = session.checkInLocationName || session.location || null;
    }

    if (endedAt !== null) {
      checkOut = checkOut === null ? endedAt : Math.max(checkOut, endedAt);
      hours +=
        typeof session.totalHours === "number"
          ? session.totalHours
          : startedAt !== null
            ? (endedAt - startedAt) / MS_PER_HOUR
            : 0;
    } else if (startedAt !== null) {
      hasOpenShift = true;
      // Only a shift opened today is still running; older ones were abandoned.
      if (dayKey === todayKey) hours += Math.max(0, (nowMs - startedAt) / MS_PER_HOUR);
    }

    if (session.status === "late") isLate = true;
  }

  const status: RowStatus = !sessions.length
    ? "absent"
    : hasOpenShift
      ? dayKey === todayKey
        ? "working"
        : "open"
      : isLate
        ? "late"
        : "present";

  return { checkIn, checkOut, hours, sessions: sessions.length, location, status };
}

export default function TimesheetsPage() {
  const { t, i18n } = useTranslation("people");
  const isAr = i18n.language === "ar";
  const { data: employeesResponse, isLoading: isEmployeesLoading } = useEmployeesQuery();
  const { data: attendanceResponse, isLoading: isAttendanceLoading } = useAllAttendanceQuery();

  const { data: allUsers } = useAllUsers();

  const [searchQuery, setSearchQuery] = useState("");
  // Real punches by default; absent days are a deliberate opt-in because they
  // outnumber attendance rows by far and bury them.
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("attended");
  const [monthOffset, setMonthOffset] = useState(0);
  const [page, setPage] = useState(1);

  // Keeps the hours of running shifts moving without refetching.
  const [nowMs, setNowMs] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNowMs(Date.now()), LIVE_TICK_MS);
    return () => clearInterval(id);
  }, []);

  const locale = isAr ? "ar-EG" : "en-US";
  const timeFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { hour: "2-digit", minute: "2-digit" }),
    [locale]
  );
  const dayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { day: "numeric", month: "short" }),
    [locale]
  );
  const weekdayFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { weekday: "long" }),
    [locale]
  );
  const monthFormatter = useMemo(
    () => new Intl.DateTimeFormat(locale, { month: "long", year: "numeric" }),
    [locale]
  );
  const numberFormatter = useMemo(() => new Intl.NumberFormat(locale), [locale]);

  const targetDate = useMemo(() => {
    const date = new Date();
    date.setDate(1);
    date.setMonth(date.getMonth() + monthOffset);
    return date;
  }, [monthOffset]);

  const monthRange = useMemo(() => {
    const today = new Date();
    const startOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth(), 1);
    const endOfMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0);
    return {
      startOfMonth,
      lastDay: endOfMonth > today ? today : endOfMonth,
      todayKey: toDayKey(today),
    };
  }, [targetDate]);

  const localizeDepartment = useCallback(
    (raw?: string) => {
      const value = raw?.trim();
      if (!value) return "—";
      return t(`departments.${value}`, {
        defaultValue: t(`departments.${value.toUpperCase()}`, { defaultValue: value }),
      });
    },
    [t]
  );

  /** Every id a punch may carry (employee document id or account uid) → person. */
  const peopleById = useMemo(() => {
    const employees: Employee[] = employeesResponse?.data ?? [];
    const map = new Map<string, Person>();

    for (const employee of employees) {
      const resolved = employeeDisplayName(employee, i18n.language);
      const person: Person = {
        name: !resolved || resolved === "—" ? t("timesheets.unnamed_employee") : resolved,
        email: employee.email || "",
        avatar: avatarSrc(employee.avatarUrl),
        department: localizeDepartment(employee.department),
      };
      map.set(employee.id, person);
      if (employee.userId) map.set(employee.userId, person);
    }

    // Punches left behind by a deleted or re-created employee record can still
    // be traced through the account that made them.
    for (const user of allUsers ?? []) {
      if (map.has(user.id)) continue;
      map.set(user.id, {
        name: user.name || user.email || t("timesheets.unnamed_employee"),
        email: user.email || "",
        avatar: avatarSrc(user.avatar),
        department: "—",
        unlinked: true,
      });
    }

    return map;
  }, [allUsers, employeesResponse, i18n.language, localizeDepartment, t]);

  /** Rows built from real punches. Never dropped, even when unlinked. */
  const attendanceRows = useMemo<TimesheetRow[]>(() => {
    const allLogs: Attendance[] = attendanceResponse?.data ?? [];
    const { startOfMonth, lastDay, todayKey } = monthRange;

    // One bucket per owner-day, keyed by the local day the shift started.
    const sessionsByDay = new Map<string, { ownerId: string; dayKey: string; sessions: Attendance[] }>();
    for (const log of allLogs) {
      if (!log.employeeId) continue;
      const startedAt = toMillis(log.checkIn);
      const dayKey = startedAt !== null ? toDayKey(new Date(startedAt)) : log.date;
      if (!dayKey) continue;

      const day = fromDayKey(dayKey);
      if (day < startOfMonth || day > lastDay) continue;

      const key = `${log.employeeId}_${dayKey}`;
      const bucket = sessionsByDay.get(key);
      if (bucket) bucket.sessions.push(log);
      else sessionsByDay.set(key, { ownerId: log.employeeId, dayKey, sessions: [log] });
    }

    return Array.from(sessionsByDay.values()).map(({ ownerId, dayKey, sessions }) => {
      const person = peopleById.get(ownerId) ?? {
        name: t("timesheets.unnamed_employee"),
        email: "",
        department: "—",
        unlinked: true,
      };

      return {
        id: `${ownerId}-${dayKey}`,
        ownerId,
        date: dayKey,
        ...person,
        ...summarizeDay(sessions, dayKey, todayKey, nowMs),
      };
    });
  }, [attendanceResponse, monthRange, nowMs, peopleById, t]);

  /** Days an employee never punched. Built only when they are actually shown. */
  const absentRows = useMemo<TimesheetRow[]>(() => {
    const employees: Employee[] = employeesResponse?.data ?? [];
    const { startOfMonth, lastDay } = monthRange;
    const punchedDays = new Set(attendanceRows.map((row) => row.id));
    const built: TimesheetRow[] = [];

    for (const employee of employees) {
      const joinedAt = toMillis(employee.joiningDate);
      const joiningDate = joinedAt !== null ? new Date(joinedAt) : startOfMonth;
      const start = startOfMonth > joiningDate ? startOfMonth : joiningDate;
      // Start from local midnight so every generated key is a clean local day.
      const firstDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
      if (firstDay > lastDay) continue;

      const person = peopleById.get(employee.id);
      if (!person) continue;

      for (const cursor = new Date(firstDay); cursor <= lastDay; cursor.setDate(cursor.getDate() + 1)) {
        if (WEEKEND_DAYS.has(cursor.getDay())) continue;
        const dayKey = toDayKey(cursor);
        if (punchedDays.has(`${employee.id}-${dayKey}`)) continue;
        if (employee.userId && punchedDays.has(`${employee.userId}-${dayKey}`)) continue;

        built.push({
          id: `${employee.id}-${dayKey}`,
          ownerId: employee.id,
          date: dayKey,
          ...person,
          checkIn: null,
          checkOut: null,
          hours: 0,
          sessions: 0,
          location: null,
          status: "absent",
        });
      }
    }

    return built;
  }, [attendanceRows, employeesResponse, monthRange, peopleById]);

  const filteredRows = useMemo(() => {
    const pool =
      statusFilter === "absent"
        ? absentRows
        : statusFilter === "all"
          ? [...attendanceRows, ...absentRows]
          : attendanceRows;

    const needle = searchQuery.trim().toLowerCase();
    return pool
      .filter((row) => {
        const matchesSearch =
          !needle ||
          row.name.toLowerCase().includes(needle) ||
          row.email.toLowerCase().includes(needle);
        const matchesStatus =
          statusFilter === "all" ||
          statusFilter === "absent" ||
          statusFilter === "attended" ||
          row.status === statusFilter;
        return matchesSearch && matchesStatus;
      })
      .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
  }, [absentRows, attendanceRows, searchQuery, statusFilter]);

  const metrics = useMemo(() => {
    const employees: Employee[] = employeesResponse?.data ?? [];
    const attended = attendanceRows.length;
    const workingNow = attendanceRows.filter((row) => row.status === "working").length;
    const openShifts = attendanceRows.filter((row) => row.status === "open").length;
    const unlinked = attendanceRows.filter((row) => row.unlinked).length;
    const totalHours = attendanceRows.reduce((sum, row) => sum + row.hours, 0);
    const absent = absentRows.length;
    const workdays = attended + absent;
    const rate = workdays ? Math.round((attended / workdays) * 100) : 100;

    // Who has not punched at all this month — the list worth acting on.
    const punched = new Set(attendanceRows.map((row) => row.ownerId));
    const idle = employees.filter(
      (employee) =>
        !punched.has(employee.id) && !(employee.userId && punched.has(employee.userId))
    ).length;

    return { attended, workingNow, openShifts, absent, totalHours, unlinked, rate, idle };
  }, [absentRows, attendanceRows, employeesResponse]);

  const totalPages = Math.max(1, Math.ceil(filteredRows.length / ROWS_PER_PAGE));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice(
    (currentPage - 1) * ROWS_PER_PAGE,
    currentPage * ROWS_PER_PAGE
  );
  const tintedDays = alternatingDayKeys(filteredRows, (row) => row.date);

  const formatHours = (hours: number) => {
    if (hours <= 0) return "—";
    const totalMinutes = Math.round(hours * 60);
    const h = numberFormatter.format(Math.floor(totalMinutes / 60));
    const m = numberFormatter.format(totalMinutes % 60);
    if (totalMinutes < 60) return isAr ? `${m}د` : `${m}m`;
    if (totalMinutes % 60 === 0) return isAr ? `${h}س` : `${h}h`;
    return isAr ? `${h}س ${m}د` : `${h}h ${m}m`;
  };

  const formatTime = (value: number | null) => (value === null ? "—" : timeFormatter.format(value));

  // `present` stays neutral because it is the common case; the states that need
  // attention are the ones that get colour.
  const statusMeta: Record<
    RowStatus,
    { label: string; color: "success" | "warning" | "danger" | "default" }
  > = {
    working: { label: t("timesheets.status_working"), color: "success" },
    present: { label: t("timesheets.status_present"), color: "default" },
    late: { label: t("timesheets.status_late"), color: "warning" },
    open: { label: t("timesheets.status_open"), color: "warning" },
    absent: { label: t("timesheets.status_absent"), color: "danger" },
  };

  const statusOptions: { key: StatusFilter; label: string }[] = [
    { key: "attended", label: t("timesheets.filter_attended") },
    { key: "working", label: t("timesheets.status_working") },
    { key: "open", label: t("timesheets.status_open") },
    { key: "absent", label: t("timesheets.status_absent") },
    { key: "all", label: t("timesheets.filter_all") },
  ];

  const downloadCSV = () => {
    if (filteredRows.length === 0) return;

    const headers = [
      t("timesheets.col_date"),
      t("timesheets.col_employee"),
      t("timesheets.col_department"),
      t("timesheets.col_checkin"),
      t("timesheets.col_checkout"),
      t("timesheets.col_sessions"),
      t("timesheets.col_location"),
      t("timesheets.col_hours"),
      t("timesheets.col_status"),
    ];

    const csvRows = filteredRows.map((row) =>
      [
        row.date,
        row.name,
        row.department,
        formatTime(row.checkIn),
        formatTime(row.checkOut),
        String(row.sessions),
        row.location ?? "",
        row.hours > 0 ? row.hours.toFixed(2) : "0",
        statusMeta[row.status].label,
      ]
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(",")
    );

    // BOM keeps Arabic readable when Excel opens the file.
    const csvContent = `\uFEFF${[headers.join(","), ...csvRows].join("\n")}`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `timesheet_${toDayKey(new Date())}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const isLoading = isEmployeesLoading || isAttendanceLoading;

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="mx-auto w-full min-w-0 max-w-7xl space-y-6 pb-12 animate-in fade-in duration-500 sm:space-y-8">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-foreground flex items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary border border-primary/20">
              <Clock size={28} />
            </div>
            {t("timesheets.title")}
          </h1>
          <p className="text-default-400 font-medium text-xs md:text-sm mt-1">
            {t("timesheets.subtitle")}
          </p>
        </div>

        <Button
          color="primary"
          variant="shadow"
          onPress={downloadCSV}
          startContent={<Download size={18} />}
          isDisabled={filteredRows.length === 0}
          className="font-bold rounded-2xl h-11 px-6 shadow-lg shadow-primary/25"
        >
          {t("timesheets.download_csv")}
        </Button>
      </div>

      {/* Live Punch TimeTracker Widget Integration */}
      <div className="w-full max-w-md">
        <TimeTrackerWidget />
      </div>

      {/* KPI Metrics */}
      <div className="grid grid-cols-1 gap-3 min-[420px]:grid-cols-2 lg:grid-cols-4 lg:gap-4">
        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-3 rounded-2xl bg-emerald-500/10 text-emerald-500 shrink-0">
              <CheckCircle2 size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-default-400 font-bold">{t("timesheets.metric_attended")}</p>
              <h3 className="text-xl font-black text-emerald-600 dark:text-emerald-400">
                {numberFormatter.format(metrics.attended)}
              </h3>
              <p className="text-[10px] text-default-400 font-semibold">
                {t("timesheets.metric_rate", { rate: metrics.rate })}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-3 rounded-2xl bg-primary/10 text-primary shrink-0">
              <Timer size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-default-400 font-bold">{t("timesheets.metric_working_now")}</p>
              <h3 className="text-xl font-black text-primary flex items-center gap-2">
                {numberFormatter.format(metrics.workingNow)}
                {metrics.workingNow > 0 ? (
                  <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                ) : null}
              </h3>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-3 rounded-2xl bg-danger-500/10 text-danger shrink-0">
              <XCircle size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-default-400 font-bold">{t("timesheets.metric_idle")}</p>
              <h3 className="text-xl font-black text-danger">{numberFormatter.format(metrics.idle)}</h3>
              <p className="text-[10px] text-default-400 font-semibold">
                {t("timesheets.metric_absent_days", { count: metrics.absent })}
              </p>
            </div>
          </CardBody>
        </Card>

        <Card className="border border-default-200/60 shadow-sm rounded-3xl bg-background/80 backdrop-blur-xl">
          <CardBody className="p-4 flex flex-row items-center gap-3">
            <div className="p-3 rounded-2xl bg-sky-500/10 text-sky-500 shrink-0">
              <Clock size={24} />
            </div>
            <div className="min-w-0">
              <p className="text-xs text-default-400 font-bold">{t("timesheets.metric_total_hours")}</p>
              <h3 className="text-xl font-black text-sky-600 dark:text-sky-400">
                {formatHours(metrics.totalHours)}
              </h3>
            </div>
          </CardBody>
        </Card>
      </div>

      {metrics.openShifts > 0 || metrics.unlinked > 0 ? (
        <div className="flex items-start gap-3 rounded-3xl border border-warning-200 bg-warning-50/60 dark:bg-warning-500/10 p-4">
          <AlertTriangle size={18} className="text-warning-600 shrink-0 mt-0.5" />
          <div className="text-xs font-semibold text-warning-700 dark:text-warning-400 space-y-1">
            {metrics.openShifts > 0 ? (
              <p>{t("timesheets.open_shifts_warning", { count: metrics.openShifts })}</p>
            ) : null}
            {metrics.unlinked > 0 ? (
              <p>{t("timesheets.unlinked_warning", { count: metrics.unlinked })}</p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/* Filter Bar & Timesheet Table */}
      <Card className="border border-default-200/60 shadow-sm rounded-3xl overflow-hidden bg-background/80 backdrop-blur-xl">
        <CardBody className="p-0">
          <div className="flex flex-col sm:flex-row p-4 border-b border-default-200/60 bg-default-50/50 gap-3 justify-between items-stretch sm:items-center">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 flex-1">
              <Input
                isClearable
                placeholder={t("timesheets.search_placeholder")}
                startContent={<Search size={16} className="text-default-400" />}
                value={searchQuery}
                onValueChange={(value) => {
                  setSearchQuery(value);
                  setPage(1);
                }}
                className="w-full sm:w-72"
                variant="bordered"
                size="sm"
                classNames={{ inputWrapper: "rounded-2xl bg-background" }}
              />

              <Select
                {...selectFieldProps({ compact: true, classNames: { trigger: "rounded-2xl bg-background min-h-9" } })}
                aria-label={t("timesheets.col_status")}
                size="sm"
                className="w-full sm:w-48"
                startContent={<Filter size={14} className="text-default-400 shrink-0" />}
                disallowEmptySelection
                selectedKeys={[statusFilter]}
                onSelectionChange={(keys) => {
                  const next = Array.from(keys as Set<string>)[0] as StatusFilter | undefined;
                  setStatusFilter(next || "all");
                  setPage(1);
                }}
              >
                {statusOptions.map((option) => (
                  <SelectItem key={option.key} textValue={option.label}>
                    {option.label}
                  </SelectItem>
                ))}
              </Select>
            </div>

            {/* Month Navigation */}
            <div className="flex items-center gap-2 bg-background rounded-2xl p-1.5 shadow-xs border border-default-200/60 self-center">
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={t("timesheets.previous_month")}
                onPress={() => {
                  setMonthOffset((prev) => prev - 1);
                  setPage(1);
                }}
              >
                {isAr ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
              </Button>
              <span className="text-xs font-bold w-36 text-center text-foreground">
                {monthFormatter.format(targetDate)}
              </span>
              <Button
                isIconOnly
                size="sm"
                variant="light"
                aria-label={t("timesheets.next_month")}
                isDisabled={monthOffset >= 0}
                onPress={() => {
                  setMonthOffset((prev) => prev + 1);
                  setPage(1);
                }}
              >
                {isAr ? <ChevronLeft size={16} /> : <ChevronRight size={16} />}
              </Button>
            </div>
          </div>

          {isLoading ? (
            <div className="p-12 text-center text-default-400 font-medium">{t("timesheets.loading")}</div>
          ) : filteredRows.length === 0 ? (
            <div className="p-12 text-center text-default-400 flex flex-col items-center gap-2">
              <Clock size={36} className="text-default-300" />
              <p className="text-sm font-semibold">{t("timesheets.no_logs")}</p>
            </div>
          ) : (
            <div className="w-full overflow-x-auto">
            <Table
              aria-label={t("timesheets.title")}
              removeWrapper
              isHeaderSticky
              className="min-w-[920px]"
              classNames={{
                th: "bg-default-100/70 text-default-500 text-[11px] font-black uppercase tracking-wide",
                td: "py-3 border-b border-default-100 group-data-[last=true]/tr:border-0",
                tr: "group hover:bg-default-50/70 transition-colors",
              }}
              bottomContent={
                totalPages > 1 ? (
                  <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-default-200/60">
                    <span className="text-[11px] font-semibold text-default-400">
                      {t("timesheets.row_count", { count: filteredRows.length })}
                    </span>
                    <Pagination
                      showControls
                      size="sm"
                      page={currentPage}
                      total={totalPages}
                      onChange={setPage}
                      classNames={{ cursor: "font-bold" }}
                    />
                  </div>
                ) : null
              }
            >
              <TableHeader>
                <TableColumn>{t("timesheets.col_date")}</TableColumn>
                <TableColumn>{t("timesheets.col_employee")}</TableColumn>
                <TableColumn>{t("timesheets.col_department")}</TableColumn>
                <TableColumn>{t("timesheets.col_checkin")}</TableColumn>
                <TableColumn>{t("timesheets.col_checkout")}</TableColumn>
                <TableColumn>{t("timesheets.col_location")}</TableColumn>
                <TableColumn>{t("timesheets.col_hours")}</TableColumn>
                <TableColumn>{t("timesheets.col_status")}</TableColumn>
              </TableHeader>
              <TableBody>
                {pageRows.map((row, index) => {
                  const rowDate = fromDayKey(row.date);
                  const meta = statusMeta[row.status];
                  const startsNewDay = index > 0 && row.date !== pageRows[index - 1].date;

                  return (
                    <TableRow
                      key={row.id}
                      className={[
                        startsNewDay && "attendance-day-divider",
                        tintedDays.has(row.date) && "day-group-tinted",
                      ].filter(Boolean).join(" ")}
                    >
                      <TableCell>
                        <div className="flex flex-col leading-tight">
                          <span className="font-bold text-xs text-foreground">{dayFormatter.format(rowDate)}</span>
                          <span className="text-[10px] font-medium text-default-400">
                            {weekdayFormatter.format(rowDate)}
                          </span>
                        </div>
                      </TableCell>

                      <TableCell>
                        <div className="flex items-center gap-2.5 min-w-0">
                          <Avatar
                            size="sm"
                            src={row.avatar}
                            fallback={initialsFromName(row.name || row.email, "?")}
                            showFallback
                            className="h-8 w-8 text-[10px] shrink-0"
                          />
                          <div className="flex flex-col leading-tight min-w-0">
                            <span className="flex items-center gap-1.5">
                              <span className="font-bold text-xs text-foreground truncate max-w-[150px]" title={row.name}>
                                {row.name}
                              </span>
                              {row.unlinked ? (
                                <Tooltip content={t("timesheets.unlinked_hint")} size="sm">
                                  <AlertTriangle size={11} className="text-warning shrink-0" />
                                </Tooltip>
                              ) : null}
                            </span>
                            {row.email ? (
                              <span
                                className="text-[10px] font-medium text-default-400 truncate max-w-[160px]"
                                title={row.email}
                                dir="ltr"
                              >
                                {row.email}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      </TableCell>

                      <TableCell>
                        <Chip size="sm" variant="flat" className="h-5 text-[10px] font-semibold">
                          {row.department}
                        </Chip>
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-foreground">
                        {formatTime(row.checkIn)}
                      </TableCell>

                      <TableCell className="text-xs font-semibold text-foreground">
                        {row.status === "working" ? (
                          <span className="inline-flex items-center gap-1.5 font-bold text-emerald-600 dark:text-emerald-400">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {t("timesheets.still_working")}
                          </span>
                        ) : (
                          formatTime(row.checkOut)
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-default-500">
                        {row.location ? (
                          <span className="flex items-center gap-1">
                            <MapPin size={12} className="text-primary shrink-0" />
                            <span className="truncate max-w-[120px]" title={row.location}>
                              {row.location}
                            </span>
                          </span>
                        ) : (
                          "—"
                        )}
                      </TableCell>

                      <TableCell>
                        <span className="flex items-center gap-1.5">
                          <span
                            className={`font-bold text-xs tabular-nums ${
                              row.status === "working"
                                ? "text-emerald-600 dark:text-emerald-400"
                                : "text-foreground"
                            }`}
                          >
                            {formatHours(row.hours)}
                          </span>
                          {row.sessions > 1 ? (
                            <Tooltip content={t("timesheets.sessions_hint", { count: row.sessions })} size="sm">
                              <Chip size="sm" variant="flat" className="h-4 px-1 text-[9px] font-bold">
                                ×{numberFormatter.format(row.sessions)}
                              </Chip>
                            </Tooltip>
                          ) : null}
                        </span>
                      </TableCell>

                      <TableCell>
                        <Chip
                          size="sm"
                          variant="flat"
                          color={meta.color}
                          startContent={row.status === "open" ? <AlertTriangle size={11} className="ms-1" /> : undefined}
                          className="font-bold text-[10px]"
                        >
                          {meta.label}
                        </Chip>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
