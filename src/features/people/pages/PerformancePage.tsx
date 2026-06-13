import { Button, Card, CardBody, Chip, Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, useDisclosure, Input, Select, SelectItem, Avatar } from "@heroui/react";
import { useState } from "react";
import { Plus, Target, Star, Loader2 } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { db } from "@/lib/firebase";
import { collection, addDoc, getDocs, getDoc, query, orderBy, serverTimestamp, setDoc, doc } from "firebase/firestore";
import { useEffect } from "react";
import { useAllUsers } from "@/features/users/hooks/use-users";
import { useTranslation } from "react-i18next";
import { useAppPermissions } from "@/features/companies/hooks/use-app-permissions";

interface PerformanceCycle {
  id: string;
  name: string;
  type: string;
  start?: string;
  end?: string;
  status?: string;
}

export default function PerformancePage() {
  const { t } = useTranslation("people");
  const { user } = useAuthStore();
  const { isOpen, onOpen, onOpenChange } = useDisclosure();
  const { isOpen: isManageOpen, onOpen: onManageOpen, onOpenChange: onManageOpenChange } = useDisclosure();
  
  const [activeCycles, setActiveCycles] = useState<any[]>([]);
  const [newCycle, setNewCycle] = useState({ name: "", type: "", start: "", end: "" });
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [selectedCycle, setSelectedCycle] = useState<any>(null);
  const [appraisals, setAppraisals] = useState<Record<string, { grade: string, points: number }>>({});
  const [isSavingAppraisals, setIsSavingAppraisals] = useState(false);
  
  const [myAppraisals, setMyAppraisals] = useState<any[]>([]);
  const [isLoadingMyAppraisals, setIsLoadingMyAppraisals] = useState(true);
  
  const { data: users, isLoading: isLoadingUsers } = useAllUsers();

  const { canViewPerformance } = useAppPermissions();

  const fetchCycles = async () => {
    try {
      const q = query(collection(db, "performance_cycles"), orderBy("createdAt", "desc"));
      const snapshot = await getDocs(q);
      const cyclesData: PerformanceCycle[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as PerformanceCycle[];
      setActiveCycles(cyclesData);

      if (user?.id && cyclesData.length > 0) {
        setIsLoadingMyAppraisals(true);
        try {
          const promises = cyclesData.map(async (cycle) => {
            const docSnap = await getDoc(doc(db, "performance_cycles", cycle.id, "appraisals", user.id));
            if (docSnap.exists()) {
              return { cycleName: cycle.name, cycleType: cycle.type, ...docSnap.data() };
            }
            return null;
          });
          const results = await Promise.all(promises);
          setMyAppraisals(results.filter(Boolean));
        } catch (e) {
          console.error("Error fetching my appraisals", e);
        } finally {
          setIsLoadingMyAppraisals(false);
        }
      } else {
        setIsLoadingMyAppraisals(false);
      }
    } catch (error) {
      console.error("Error fetching performance cycles:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCycles();
  }, []);

  const handleStartCycle = async (onClose: () => void) => {
    if (newCycle.name && newCycle.type) {
      setIsSubmitting(true);
      try {
        await addDoc(collection(db, "performance_cycles"), {
          ...newCycle,
          createdBy: user?.id,
          createdAt: serverTimestamp(),
          status: "active"
        });
        setNewCycle({ name: "", type: "", start: "", end: "" });
        await fetchCycles();
        onClose();
      } catch (error) {
        console.error("Error creating cycle:", error);
      } finally {
        setIsSubmitting(false);
      }
    }
  };

  const handleOpenManage = async (cycle: any) => {
    setSelectedCycle(cycle);
    onManageOpen();
    
    // Fetch existing appraisals
    try {
      const q = query(collection(db, "performance_cycles", cycle.id, "appraisals"));
      const snapshot = await getDocs(q);
      const data: Record<string, { grade: string, points: number }> = {};
      snapshot.docs.forEach(doc => {
        const docData = doc.data();
        data[doc.id] = { grade: docData.grade, points: docData.points };
      });
      setAppraisals(data);
    } catch (error) {
      console.error("Error fetching appraisals:", error);
    }
  };

  const saveAppraisals = async (onClose: () => void) => {
    if (!selectedCycle) return;
    setIsSavingAppraisals(true);
    try {
      for (const [empId, data] of Object.entries(appraisals)) {
        if (!data.grade && !data.points) continue;
        
        await setDoc(doc(db, "performance_cycles", selectedCycle.id, "appraisals", empId), {
          ...data,
          updatedAt: serverTimestamp(),
          updatedBy: user?.id
        }, { merge: true });
      }
      onClose();
    } catch (error) {
      console.error("Error saving appraisals:", error);
    } finally {
      setIsSavingAppraisals(false);
    }
  };
  
  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              {t("performance.title")}
            </h1>
            <Chip size="sm" variant="flat" color="primary" className="font-bold">
              <span className="flex items-center gap-1">
                <Target size={12} /> {t("performance.appraisals")}
              </span>
            </Chip>
          </div>
          <p className="text-default-500 font-medium">
            {t("performance.subtitle")}
          </p>
        </div>
        <div className="flex gap-2">
          {canViewPerformance && (
            <Button 
              color="primary" 
              variant="shadow" 
              onPress={onOpen}
              startContent={<Plus size={18} />} 
              className="font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              {t("performance.start_cycle")}
            </Button>
          )}
        </div>
      </div>

      <Modal isOpen={isOpen} onOpenChange={onOpenChange} placement="top-center">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Start New Review Cycle</ModalHeader>
              <ModalBody>
                <Input
                  autoFocus
                  label="Cycle Name"
                  placeholder="e.g. Q3 2026 Performance Review"
                  variant="bordered"
                  value={newCycle.name}
                  onValueChange={(val) => setNewCycle({...newCycle, name: val})}
                />
                <Select
                  label="Review Type"
                  placeholder="Select type"
                  variant="bordered"
                  selectedKeys={newCycle.type ? [newCycle.type] : []}
                  onSelectionChange={(keys) => setNewCycle({...newCycle, type: Array.from(keys)[0] as string})}
                >
                  <SelectItem key="360">360 Feedback</SelectItem>
                  <SelectItem key="manager">Manager Review</SelectItem>
                  <SelectItem key="peer">Peer Review</SelectItem>
                </Select>
                <div className="flex gap-2">
                  <Input 
                    label="Start Date" 
                    type="date" 
                    variant="bordered" 
                    value={newCycle.start}
                    onValueChange={(val) => setNewCycle({...newCycle, start: val})}
                  />
                  <Input 
                    label="End Date" 
                    type="date" 
                    variant="bordered" 
                    value={newCycle.end}
                    onValueChange={(val) => setNewCycle({...newCycle, end: val})}
                  />
                </div>
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} isDisabled={isSubmitting}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => handleStartCycle(onClose)} isLoading={isSubmitting}>
                  Start Cycle
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <Modal isOpen={isManageOpen} onOpenChange={onManageOpenChange} size="3xl" scrollBehavior="inside">
        <ModalContent>
          {(onClose) => (
            <>
              <ModalHeader className="flex flex-col gap-1">Manage Cycle: {selectedCycle?.name}</ModalHeader>
              <ModalBody>
                {isLoadingUsers ? (
                  <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={32} /></div>
                ) : (
                  <div className="space-y-4">
                    {users?.map(emp => (
                      <div key={emp.id} className="flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 border border-default-100 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                          <Avatar src={emp.avatar} name={emp.name} className="shrink-0" />
                          <div>
                            <p className="font-bold text-sm text-foreground">{emp.name}</p>
                            <p className="text-xs text-default-500">{emp.role}</p>
                          </div>
                        </div>
                        <div className="flex gap-3 items-center w-full sm:w-auto">
                          <Select 
                            className="w-48 shrink-0" 
                            size="sm" 
                            label="Grade" 
                            variant="bordered"
                            selectedKeys={appraisals[emp.id]?.grade ? [appraisals[emp.id].grade] : []}
                            onSelectionChange={(keys) => setAppraisals({...appraisals, [emp.id]: {...appraisals[emp.id], grade: Array.from(keys)[0] as string}})}
                          >
                            <SelectItem key="A">Grade A (Excellent)</SelectItem>
                            <SelectItem key="B">Grade B (Good)</SelectItem>
                            <SelectItem key="C">Grade C (Average)</SelectItem>
                            <SelectItem key="D">Grade D (Poor)</SelectItem>
                          </Select>
                          <Input 
                            type="number" 
                            className="w-24 shrink-0" 
                            size="sm" 
                            label="Points" 
                            variant="bordered"
                            placeholder="0-100"
                            value={appraisals[emp.id]?.points?.toString() || ""}
                            onValueChange={(val) => setAppraisals({...appraisals, [emp.id]: {...appraisals[emp.id], points: Number(val)}})}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </ModalBody>
              <ModalFooter>
                <Button color="danger" variant="flat" onPress={onClose} isDisabled={isSavingAppraisals}>
                  Cancel
                </Button>
                <Button color="primary" onPress={() => saveAppraisals(onClose)} isLoading={isSavingAppraisals}>
                  Save Appraisals
                </Button>
              </ModalFooter>
            </>
          )}
        </ModalContent>
      </Modal>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border border-default-100 shadow-sm">
          {isLoading ? (
            <CardBody className="p-8 flex items-center justify-center min-h-[300px]">
              <Loader2 className="animate-spin text-primary" size={32} />
            </CardBody>
          ) : activeCycles.length === 0 ? (
            <CardBody className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
              <div className="p-4 bg-primary/10 rounded-full text-primary">
                <Target size={40} />
              </div>
              <h3 className="text-xl font-black">{t("performance.no_active_cycles")}</h3>
              <p className="text-default-500 max-w-sm">
                {t("performance.no_active_cycles_desc")}
              </p>
            </CardBody>
          ) : (
            <CardBody className="p-6 space-y-4">
              <h3 className="font-bold text-lg mb-4">{t("performance.active_cycles")}</h3>
              <div className="space-y-4">
                {activeCycles.map((cycle) => (
                  <div key={cycle.id} className="flex flex-col md:flex-row justify-between items-start md:items-center p-4 border border-default-200 rounded-xl hover:border-primary/50 transition-colors">
                    <div>
                      <h4 className="font-bold text-primary">{cycle.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <Chip size="sm" variant="flat">{cycle.type === '360' ? '360 Feedback' : cycle.type === 'manager' ? 'Manager Review' : 'Peer Review'}</Chip>
                        <span className="text-xs text-default-500">{cycle.start} to {cycle.end}</span>
                      </div>
                    </div>
                    <Button size="sm" variant="flat" color="primary" className="mt-4 md:mt-0" onPress={() => handleOpenManage(cycle)}>
                      Manage Cycle
                    </Button>
                  </div>
                ))}
              </div>
            </CardBody>
          )}
        </Card>

        <Card className="col-span-1 border border-default-100 shadow-sm bg-default-50/50">
          <CardBody className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Star size={18} className="text-amber-500" /> 
              {t("performance.recent_appraisals")}
            </h3>
            {isLoadingMyAppraisals ? (
              <div className="flex justify-center p-8"><Loader2 className="animate-spin text-primary" size={24} /></div>
            ) : myAppraisals.length === 0 ? (
              <div className="text-center py-10">
                 <p className="text-default-400 text-sm">No recent appraisals found.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {myAppraisals.map((appraisal, idx) => (
                  <div key={idx} className="p-4 bg-white border border-default-200 rounded-xl shadow-sm">
                    <p className="text-xs text-default-500 mb-1">{appraisal.cycleName}</p>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-xl font-black text-primary">Grade {appraisal.grade || '?'}</p>
                        <p className="text-xs font-bold text-default-600">{appraisal.points || 0} Points</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                        {appraisal.grade || '-'}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
