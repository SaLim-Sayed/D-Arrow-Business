import { useRef, useState, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@/features/auth/context/auth-context";
import { ProfileService } from "@/features/auth/api/profile.service";
import {
  Avatar,
  Button,
  Card,
  Chip,
  useDisclosure
} from "@heroui/react";
import { Camera, Mail, User, Clock, Shield } from "lucide-react";
import { toast } from "sonner";
import type { UserRole } from "@/features/auth/types/auth.types";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { doc, updateDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { useEmployeesQuery, useLeaveRequestsQuery } from "@/features/people/hooks/use-people";
import { motion, AnimatePresence } from "framer-motion";
import { ApplyLeaveModal } from "@/features/people/components/ApplyLeaveModal";

// Sub-components
import { GeneralSection } from "../components/profile/GeneralSection";
import { HRStatusSection } from "../components/profile/HRStatusSection";
import { SecuritySection } from "../components/profile/SecuritySection";

export function ProfilePage() {
  const { t: tp } = useTranslation("profile");
  const { user, updateUser } = useAuth();
  const { data: employeesRes } = useEmployeesQuery();
  const employee = employeesRes?.data?.find(e => e.userId === user?.id);
  
  const { data: leaveRes } = useLeaveRequestsQuery();
  const myLeaves = leaveRes?.data?.filter(l => l.employeeId === employee?.id) || [];
  const approvedLeaves = myLeaves.filter(l => l.status === 'approved');



  const [activeTab, setActiveTab] = useState<"general" | "hr" | "security">("general");
  const { isOpen: isLeaveModalOpen, onOpen: onOpenLeave, onOpenChange: onLeaveOpenChange } = useDisclosure();

  const [name, setName] = useState(user?.name ?? "");
  const [nameAr, setNameAr] = useState(user?.nameAr ?? "");
  const [role, setRole] = useState<UserRole>(user?.role ?? "employee");
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const initials = (user?.name ?? "U")
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  const handleAvatarChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;
      if (file.size > 5 * 1024 * 1024) {
        toast.error(tp("avatarTooLarge"));
        return;
      }
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    },
    [tp],
  );

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error(tp("nameRequired"));
      return;
    }
    setIsSaving(true);
    try {
      const updated = await ProfileService.updateProfile({
        name: name.trim(),
        nameAr: nameAr.trim(),
        avatarFile,
      });

      const firebaseUser = auth.currentUser;
      if (firebaseUser && role !== user?.role) {
        await updateDoc(doc(db, "users", firebaseUser.uid), {
          role,
          updatedAt: new Date().toISOString(),
        });
      }

      updateUser({
        name: updated.name,
        nameAr: updated.nameAr,
        role,
        ...(avatarFile ? { avatar: updated.avatar } : {}),
      });

      setAvatarFile(null);
      toast.success(tp("saveSuccess"));
    } catch (err) {
      console.error(err);
      toast.error(tp("saveError"));
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!currentPassword) {
      toast.error(tp("invalidCurrentPassword"));
      return;
    }
    if (!newPassword || newPassword !== confirmPassword) {
      toast.error(tp("passwordMismatch"));
      return;
    }
    if (newPassword.length < 6) {
      toast.error(tp("passwordTooShort"));
      return;
    }
    
    setIsChangingPassword(true);
    try {
      if (auth.currentUser && user?.email) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(auth.currentUser, credential);
        
        await updatePassword(auth.currentUser, newPassword);
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");
        toast.success(tp("passwordSuccess"));
      }
    } catch (err: any) {
      console.error("Change password error:", err);
      if (err.code === "auth/requires-recent-login") {
        toast.error(tp("requiresRecentLogin"));
      } else if (err.code === "auth/invalid-credential") {
        toast.error(tp("invalidCurrentPassword"));
      } else {
        toast.error(tp("passwordError"));
      }
    } finally {
      setIsChangingPassword(false);
    }
  };

  const displayAvatar = avatarPreview ?? user?.avatar;

  return (
    <div className="container max-w-6xl mx-auto py-8 px-4 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div className="flex items-center gap-6">
          <div className="relative group">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="relative p-1 rounded-full bg-gradient-to-tr from-primary via-purple-500 to-pink-500 shadow-2xl"
            >
              <Avatar
                src={displayAvatar}
                fallback={initials}
                showFallback
                className="h-24 w-24 md:h-32 md:w-32 text-3xl border-4 border-background"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-1 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer z-10"
              >
                <Camera className="h-8 w-8 text-white" />
              </button>
            </motion.div>
          </div>
          
          <div className="space-y-1">
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-foreground flex items-center gap-3">
              {user?.name}
              <Chip size="sm" variant="flat" color="primary" className="font-black text-[10px] uppercase tracking-widest">
                {user?.role}
              </Chip>
            </h1>
            <p className="text-default-500 font-medium flex items-center gap-2">
              <Mail size={16} />
              {user?.email}
            </p>
          </div>
        </div>
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleAvatarChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Navigation Sidebar */}
        <Card className="lg:col-span-3 rounded-3xl shadow-premium border-default-100/50 bg-background/60 backdrop-blur-xl p-2 h-fit sticky top-24">
          <div className="flex flex-col gap-1">
            {[
              { id: "general", label: tp("generalInfo"), icon: <User size={18} /> },
              { id: "hr", label: tp("hrStatus", "HR Status"), icon: <Clock size={18} /> },
              { id: "security", label: tp("security"), icon: <Shield size={18} /> },
            ].map((tab) => (
              <Button
                key={tab.id}
                variant={activeTab === tab.id ? "shadow" : "light"}
                color={activeTab === tab.id ? "primary" : "default"}
                className={`justify-start h-12 px-4 rounded-2xl font-bold transition-all ${activeTab === tab.id ? "shadow-primary/30" : "text-default-500"}`}
                onPress={() => setActiveTab(tab.id as any)}
                startContent={tab.icon}
              >
                {tab.label}
              </Button>
            ))}
          </div>
        </Card>

        {/* Content Area */}
        <div className="lg:col-span-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
            >
              {activeTab === "general" && (
                <GeneralSection 
                  name={name}
                  setName={setName}
                  nameAr={nameAr}
                  setNameAr={setNameAr}
                  role={role}
                  setRole={setRole}
                  isSaving={isSaving}
                  onSave={handleSave}
                  tp={tp}
                />
              )}

              {activeTab === "hr" && (
                <HRStatusSection 
                  approvedLeaves={approvedLeaves}
                  myLeaves={myLeaves}
                  onOpenLeave={onOpenLeave}
                  tp={tp}
                />
              )}

              {activeTab === "security" && (
                <SecuritySection 
                  currentPassword={currentPassword}
                  setCurrentPassword={setCurrentPassword}
                  newPassword={newPassword}
                  setNewPassword={setNewPassword}
                  confirmPassword={confirmPassword}
                  setConfirmPassword={setConfirmPassword}
                  isChangingPassword={isChangingPassword}
                  onChangePassword={handleChangePassword}
                  tp={tp}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      <ApplyLeaveModal isOpen={isLeaveModalOpen} onOpenChange={onLeaveOpenChange} />
    </div>
  );
}
