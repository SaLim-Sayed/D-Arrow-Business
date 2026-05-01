import { useQuery } from "@tanstack/react-query";
import { useTasksStore } from "@/stores/tasks.store";
import { toast } from "sonner";
import type { User } from "@/features/auth/types/auth.types";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useCompany } from "@/features/companies/context/company-context";

export function useAllUsers() {
  const { setAvailableUsers, setLoadingUsers } = useTasksStore();
  const { companyId } = useCompany();

  return useQuery({
    queryKey: ["users", "all", companyId],
    queryFn: async () => {
      if (!companyId) return [];
      setLoadingUsers(true);
      try {
        const usersRef = collection(db, "users");
        const q = query(
          usersRef, 
          where("companyId", "==", companyId)
        );
        const querySnapshot = await getDocs(q);
        
        let users: User[] = querySnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        } as User));

        // Client-side sorting to avoid index requirement during development
        users.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
        
        setAvailableUsers(users);
        return users;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
        throw error;
      } finally {
        setLoadingUsers(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    enabled: !!companyId,
  });
}

export function useUsersByRole(role?: string) {
  const query = useAllUsers();
  
  return {
    ...query,
    data: role ? query.data?.filter((user: User) => user.role === role) : query.data,
  };
}

export function useActiveUsers() {
  const query = useAllUsers();
  
  return {
    ...query,
    data: query.data?.filter((user: User) => (user.role as string) !== 'inactive'),
  };
}
