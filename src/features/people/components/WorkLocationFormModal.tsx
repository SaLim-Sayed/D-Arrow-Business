import { useEffect, useState } from "react";
import {
  Button,
  Input,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
  Slider,
  Switch,
} from "@heroui/react";
import { MapPin, Navigation, Search } from "lucide-react";
import { useTranslation } from "react-i18next";
import { toast } from "sonner";
import type { WorkLocation } from "../types/people.types";
import {
  getCurrentCoordinates,
  osmEmbedUrl,
  searchNominatim,
} from "../utils/geo";

const DEFAULT_RADIUS = 150;

export interface WorkLocationFormValues {
  name: string;
  address: string;
  lat: number;
  lng: number;
  radiusMeters: number;
  isActive: boolean;
}

interface WorkLocationFormModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  location?: WorkLocation | null;
  isSaving?: boolean;
  onSave: (values: WorkLocationFormValues) => Promise<void> | void;
}

export function WorkLocationFormModal({
  isOpen,
  onOpenChange,
  location,
  isSaving,
  onSave,
}: WorkLocationFormModalProps) {
  const { t } = useTranslation("people");
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [radius, setRadius] = useState(DEFAULT_RADIUS);
  const [isActive, setIsActive] = useState(true);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<{ label: string; lat: number; lng: number }[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    setName(location?.name ?? "");
    setAddress(location?.address ?? "");
    setLat(location?.lat ?? null);
    setLng(location?.lng ?? null);
    setRadius(location?.radiusMeters ?? DEFAULT_RADIUS);
    setIsActive(location?.isActive ?? true);
    setSearch("");
    setResults([]);
  }, [isOpen, location]);

  const handleUseGps = async () => {
    setLocating(true);
    try {
      const coords = await getCurrentCoordinates();
      setLat(coords.lat);
      setLng(coords.lng);
      toast.success(t("attendance_settings.gps_captured"));
    } catch {
      toast.error(t("attendance_settings.gps_failed"));
    } finally {
      setLocating(false);
    }
  };

  const handleSearch = async () => {
    setSearching(true);
    try {
      const found = await searchNominatim(search || address);
      setResults(found);
      if (found.length === 0) toast.error(t("attendance_settings.search_empty"));
    } catch {
      toast.error(t("attendance_settings.search_failed"));
    } finally {
      setSearching(false);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim() || lat == null || lng == null) {
      toast.error(t("attendance_settings.location_required"));
      return false;
    }
    await onSave({
      name: name.trim(),
      address: address.trim(),
      lat,
      lng,
      radiusMeters: radius,
      isActive,
    });
    return true;
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="lg" scrollBehavior="inside">
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader>
              {location
                ? t("attendance_settings.edit_location")
                : t("attendance_settings.add_location")}
            </ModalHeader>
            <ModalBody className="gap-4">
              <Input
                label={t("attendance_settings.location_name")}
                placeholder={t("attendance_settings.location_name_placeholder")}
                variant="bordered"
                value={name}
                onValueChange={setName}
                isRequired
              />
              <div className="flex flex-col gap-2">
                <Input
                  label={t("attendance_settings.address")}
                  placeholder={t("attendance_settings.address_placeholder")}
                  variant="bordered"
                  value={search || address}
                  onValueChange={(v) => {
                    setSearch(v);
                    setAddress(v);
                  }}
                  startContent={<Search className="h-4 w-4 text-default-400" />}
                />
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="flat" isLoading={searching} onPress={handleSearch}>
                    {t("attendance_settings.search_map")}
                  </Button>
                  <Button
                    size="sm"
                    color="primary"
                    variant="flat"
                    startContent={<Navigation className="h-4 w-4" />}
                    isLoading={locating}
                    onPress={handleUseGps}
                  >
                    {t("attendance_settings.use_current_gps")}
                  </Button>
                </div>
                {results.length > 0 && (
                  <div className="max-h-36 overflow-y-auto rounded-lg border border-default-200">
                    {results.map((r) => (
                      <button
                        key={`${r.lat}-${r.lng}-${r.label}`}
                        type="button"
                        className="block w-full px-3 py-2 text-start text-sm hover:bg-default-100"
                        onClick={() => {
                          setLat(r.lat);
                          setLng(r.lng);
                          setAddress(r.label);
                          setSearch(r.label);
                          setResults([]);
                        }}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {lat != null && lng != null && (
                <div className="overflow-hidden rounded-xl border border-default-200">
                  <iframe
                    title={t("attendance_settings.map_preview")}
                    src={osmEmbedUrl(lat, lng, radius)}
                    className="h-48 w-full border-0"
                  />
                  <p className="px-3 py-2 text-xs text-default-500" dir="ltr">
                    {lat.toFixed(6)}, {lng.toFixed(6)}
                  </p>
                </div>
              )}

              <Slider
                label={t("attendance_settings.radius", { meters: radius })}
                minValue={50}
                maxValue={1000}
                step={10}
                value={radius}
                onChange={(v) => setRadius(Array.isArray(v) ? v[0] : v)}
              />
              <p className="text-xs text-default-500">
                {t("attendance_settings.radius_hint")}
              </p>

              <Switch isSelected={isActive} onValueChange={setIsActive}>
                {t("attendance_settings.location_active")}
              </Switch>
            </ModalBody>
            <ModalFooter>
              <Button variant="light" onPress={onClose}>
                {t("attendance_settings.cancel")}
              </Button>
              <Button
                color="primary"
                startContent={<MapPin className="h-4 w-4" />}
                isLoading={isSaving}
                onPress={async () => {
                  const ok = await handleSubmit();
                  if (ok) onClose();
                }}
              >
                {t("attendance_settings.save")}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
