import { useMemo, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import {
  Button,
  Card,
  CardBody,
  Chip,
  Input,
  Tab,
  Tabs,
} from "@heroui/react";
import { Clock, MapPin, Pencil, Plus, Search, Trash2, UserCog } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";
import {
  useAssignAttendanceLocationMutation,
  useAttendanceLatePolicyQuery,
  useCreateWorkLocationMutation,
  useDeleteWorkLocationMutation,
  useEmployeesQuery,
  useUpdateAttendanceLatePolicyMutation,
  useUpdateWorkLocationMutation,
  useWorkLocationsQuery,
} from "../hooks/use-people";
import { WorkLocationFormModal } from "../components/WorkLocationFormModal";
import { AssignAttendanceLocationModal } from "../components/AssignAttendanceLocationModal";
import type { Employee, WorkLocation } from "../types/people.types";
import { employeeDisplayName, osmEmbedUrl } from "../utils/geo";

export default function AttendanceSettingsPage() {
  const { t, i18n } = useTranslation("people");
  const navigate = useNavigate();
  const { canManageEmployees } = useAppPermissions();
  const { data: locationsRes, isLoading: loadingLocations } = useWorkLocationsQuery();
  const { data: employeesRes, isLoading: loadingEmployees } = useEmployeesQuery();
  const createLocation = useCreateWorkLocationMutation();
  const updateLocation = useUpdateWorkLocationMutation();
  const deleteLocation = useDeleteWorkLocationMutation();
  const assignMutation = useAssignAttendanceLocationMutation();
  const { data: latePolicyRes, isLoading: loadingLatePolicy } = useAttendanceLatePolicyQuery();
  const updateLatePolicy = useUpdateAttendanceLatePolicyMutation();

  const locations = locationsRes?.data ?? [];
  const employees = employeesRes?.data ?? [];

  const [locationModalOpen, setLocationModalOpen] = useState(false);
  const [editingLocation, setEditingLocation] = useState<WorkLocation | null>(null);
  const [assignOpen, setAssignOpen] = useState(false);
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(null);
  const [search, setSearch] = useState("");

  const serverLatePolicy = latePolicyRes?.data;
  const [latePolicyDraft, setLatePolicyDraft] = useState<{
    lateCutoffTime: string;
    lateThreshold: string;
  } | null>(null);

  const lateCutoffTime = latePolicyDraft?.lateCutoffTime ?? serverLatePolicy?.lateCutoffTime ?? "11:30";
  const lateThreshold = latePolicyDraft?.lateThreshold ?? String(serverLatePolicy?.lateThreshold ?? 3);

  const setLateCutoffTime = (value: string) =>
    setLatePolicyDraft({ lateCutoffTime: value, lateThreshold });
  const setLateThreshold = (value: string) =>
    setLatePolicyDraft({ lateCutoffTime, lateThreshold: value });

  const thresholdNumber = Math.max(1, parseInt(lateThreshold, 10) || 3);
  const latePolicyDirty =
    !!serverLatePolicy &&
    (serverLatePolicy.lateCutoffTime !== lateCutoffTime ||
      serverLatePolicy.lateThreshold !== thresholdNumber);

  const handleSaveLatePolicy = () => {
    updateLatePolicy.mutate(
      { lateCutoffTime, lateThreshold: thresholdNumber },
      { onSuccess: () => setLatePolicyDraft(null) }
    );
  };

  const filteredEmployees = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return employees;
    return employees.filter((e) =>
      `${employeeDisplayName(e, i18n.language)} ${e.department ?? ""} ${e.jobTitle ?? ""}`
        .toLowerCase()
        .includes(q)
    );
  }, [employees, search, i18n.language]);

  if (!canManageEmployees) {
    return <Navigate to="/people" replace />;
  }

  const locationNameById = (id: string) =>
    locations.find((l) => l.id === id)?.name ?? id;

  return (
    <div className="animate-in fade-in w-full min-w-0 space-y-6 pb-16 duration-300">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{t("attendance_settings.title")}</h1>
          <p className="mt-1 max-w-2xl text-sm text-default-500">
            {t("attendance_settings.subtitle")}
          </p>
        </div>
        <Button
          color="primary"
          className="w-full rounded-xl font-semibold sm:w-auto"
          startContent={<Plus className="h-4 w-4" />}
          onPress={() => {
            setEditingLocation(null);
            setLocationModalOpen(true);
          }}
        >
          {t("attendance_settings.add_location")}
        </Button>
      </div>

      <Tabs aria-label={t("attendance_settings.title")} variant="underlined">
        <Tab key="locations" title={t("attendance_settings.tab_locations")}>
          <div className="mt-4 grid gap-4 md:grid-cols-2">
            {loadingLocations ? (
              <p className="text-sm text-default-400">{t("attendance_settings.loading")}</p>
            ) : locations.length === 0 ? (
              <Card className="border border-dashed border-default-200 md:col-span-2">
                <CardBody className="items-center gap-2 py-12 text-center">
                  <MapPin className="h-8 w-8 text-default-300" />
                  <p className="font-medium">{t("attendance_settings.no_locations")}</p>
                  <p className="text-sm text-default-500">
                    {t("attendance_settings.no_locations_hint")}
                  </p>
                </CardBody>
              </Card>
            ) : (
              locations.map((loc) => (
                <Card key={loc.id} className="overflow-hidden border border-default-200 shadow-sm">
                  <iframe
                    title={loc.name}
                    src={osmEmbedUrl(loc.lat, loc.lng, loc.radiusMeters)}
                    className="h-40 w-full border-0"
                  />
                  <CardBody className="gap-2">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-bold">{loc.name}</h3>
                        {loc.address ? (
                          <p className="text-xs text-default-500">{loc.address}</p>
                        ) : null}
                      </div>
                      <Chip size="sm" color={loc.isActive ? "success" : "default"} variant="flat">
                        {loc.isActive
                          ? t("attendance_settings.active")
                          : t("attendance_settings.inactive")}
                      </Chip>
                    </div>
                    <p className="text-sm text-default-600">
                      {t("attendance_settings.radius_short", { meters: loc.radiusMeters })}
                    </p>
                    <div className="flex gap-2 pt-1">
                      <Button
                        size="sm"
                        variant="flat"
                        startContent={<Pencil className="h-3.5 w-3.5" />}
                        onPress={() => {
                          setEditingLocation(loc);
                          setLocationModalOpen(true);
                        }}
                      >
                        {t("attendance_settings.edit")}
                      </Button>
                      <Button
                        size="sm"
                        color="danger"
                        variant="light"
                        startContent={<Trash2 className="h-3.5 w-3.5" />}
                        isLoading={deleteLocation.isPending}
                        onPress={() => deleteLocation.mutate(loc.id)}
                      >
                        {t("attendance_settings.delete")}
                      </Button>
                    </div>
                  </CardBody>
                </Card>
              ))
            )}
          </div>
        </Tab>

        <Tab key="policy" title={t("attendance_settings.tab_policy")}>
          <div className="mt-4 max-w-xl space-y-4">
            <Card className="border border-default-200 shadow-sm">
              <CardBody className="gap-5">
                <div className="flex items-start gap-3">
                  <div className="mt-0.5 rounded-lg bg-primary/10 p-2">
                    <Clock className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{t("attendance_settings.late_policy_title")}</h3>
                    <p className="text-sm text-default-500">
                      {t("attendance_settings.late_policy_hint")}
                    </p>
                  </div>
                </div>

                {loadingLatePolicy ? (
                  <p className="text-sm text-default-400">{t("attendance_settings.loading")}</p>
                ) : (
                  <>
                    <Input
                      type="time"
                      label={t("attendance_settings.late_cutoff_label")}
                      description={t("attendance_settings.late_cutoff_hint")}
                      variant="bordered"
                      value={lateCutoffTime}
                      onValueChange={setLateCutoffTime}
                      className="max-w-xs"
                    />

                    <Input
                      type="number"
                      min={1}
                      label={t("attendance_settings.late_threshold_label")}
                      description={t("attendance_settings.late_threshold_hint")}
                      variant="bordered"
                      value={lateThreshold}
                      onValueChange={setLateThreshold}
                      className="max-w-xs"
                    />

                    <div className="flex items-center gap-3 pt-1">
                      <Button
                        color="primary"
                        className="rounded-xl font-semibold"
                        isDisabled={!latePolicyDirty}
                        isLoading={updateLatePolicy.isPending}
                        onPress={handleSaveLatePolicy}
                      >
                        {t("attendance_settings.save_policy")}
                      </Button>
                      {latePolicyDirty ? (
                        <span className="text-xs text-default-400">
                          {t("attendance_settings.unsaved_changes")}
                        </span>
                      ) : null}
                    </div>
                  </>
                )}
              </CardBody>
            </Card>
          </div>
        </Tab>

        <Tab key="employees" title={t("attendance_settings.tab_employees")}>
          <div className="mt-4 space-y-3">
            <Input
              size="sm"
              variant="bordered"
              placeholder={t("attendance_settings.search_employees")}
              value={search}
              onValueChange={setSearch}
              startContent={<Search className="h-4 w-4 text-default-400" />}
              className="max-w-md"
            />
            {loadingEmployees ? (
              <p className="text-sm text-default-400">{t("attendance_settings.loading")}</p>
            ) : (
              <div className="overflow-x-auto rounded-xl border border-default-200">
                <table className="min-w-[660px] w-full text-start text-sm">
                  <thead>
                    <tr className="border-b border-default-200 bg-default-50 text-xs uppercase text-default-500">
                      <th className="px-3 py-2.5 font-semibold">
                        {t("timesheets.col_employee")}
                      </th>
                      <th className="hidden px-3 py-2.5 font-semibold md:table-cell">
                        {t("timesheets.col_department")}
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        {t("attendance_settings.check_mode")}
                      </th>
                      <th className="px-3 py-2.5 font-semibold">
                        {t("attendance_settings.assigned_locations")}
                      </th>
                      <th className="w-28 px-3 py-2.5" />
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEmployees.map((emp) => {
                      const mode = emp.attendanceCheckMode ?? "geofence";
                      const ids = emp.attendanceLocationIds ?? [];
                      return (
                        <tr key={emp.id} className="border-b border-default-100">
                          <td className="px-3 py-2.5 font-medium">
                            <button
                              type="button"
                              className="text-start hover:text-primary"
                              onClick={() => navigate(`/people/${emp.id}`)}
                            >
                              {employeeDisplayName(emp, i18n.language)}
                            </button>
                          </td>
                          <td className="hidden px-3 py-2.5 text-default-500 md:table-cell">
                            {emp.department || "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Chip
                              size="sm"
                              variant="flat"
                              color={mode === "flexible" ? "warning" : ids.length ? "success" : "danger"}
                            >
                              {mode === "flexible"
                                ? t("attendance_settings.mode_flexible")
                                : ids.length
                                  ? t("attendance_settings.mode_geofence")
                                  : t("attendance_settings.not_set")}
                            </Chip>
                          </td>
                          <td className="px-3 py-2.5 text-default-600">
                            {mode === "flexible"
                              ? t("attendance_settings.anywhere")
                              : ids.length
                                ? ids.map(locationNameById).join(" · ")
                                : "—"}
                          </td>
                          <td className="px-3 py-2.5">
                            <Button
                              size="sm"
                              variant="flat"
                              startContent={<UserCog className="h-3.5 w-3.5" />}
                              onPress={() => {
                                setSelectedEmployee(emp);
                                setAssignOpen(true);
                              }}
                            >
                              {t("attendance_settings.assign")}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </Tab>
      </Tabs>

      <WorkLocationFormModal
        isOpen={locationModalOpen}
        onOpenChange={setLocationModalOpen}
        location={editingLocation}
        isSaving={createLocation.isPending || updateLocation.isPending}
        onSave={async (values) => {
          if (editingLocation) {
            await updateLocation.mutateAsync({
              locationId: editingLocation.id,
              data: values,
            });
          } else {
            await createLocation.mutateAsync(values);
          }
        }}
      />

      <AssignAttendanceLocationModal
        isOpen={assignOpen}
        onOpenChange={setAssignOpen}
        employee={selectedEmployee}
        locations={locations}
        isSaving={assignMutation.isPending}
        onSave={async (payload) => {
          await assignMutation.mutateAsync(payload);
        }}
      />
    </div>
  );
}
