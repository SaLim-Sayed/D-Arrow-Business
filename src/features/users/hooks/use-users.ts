import { useQuery } from "@tanstack/react-query";
import { useAuthStore } from "@/stores/auth.store";
import { useTasksStore } from "@/stores/tasks.store";
import { toast } from "sonner";
import type { User } from "@/lib/schemas";

// Mock users data - in a real app, this would come from an API
const mockUsers: User[] = [
  {
    id: "user-1",
    name: "John Doe",
    email: "john.doe@example.com",
    role: "admin",
    avatar: "https://avatar.vercel.sh/john",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-2",
    name: "Jane Smith",
    email: "jane.smith@example.com",
    role: "user",
    avatar: "https://avatar.vercel.sh/jane",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-3",
    name: "Bob Johnson",
    email: "bob.johnson@example.com",
    role: "manager",
    avatar: "https://avatar.vercel.sh/bob",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-4",
    name: "Alice Williams",
    email: "alice.williams@example.com",
    role: "user",
    avatar: "https://avatar.vercel.sh/alice",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "user-5",
    name: "Charlie Brown",
    email: "charlie.brown@example.com",
    role: "user",
    avatar: "https://avatar.vercel.sh/charlie",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function useAllUsers() {
  const { user: currentUser } = useAuthStore();
  const { setAvailableUsers, setLoadingUsers } = useTasksStore();

  return useQuery({
    queryKey: ["users", "all"],
    queryFn: async () => {
      setLoadingUsers(true);
      try {
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // For now, return mock users
        const users = mockUsers;
        
        // Include current user if not already in the list
        const allUsers = currentUser 
          ? users.some((u: User) => u.id === currentUser.id) 
            ? users 
            : [...users, {
                id: currentUser.id,
                name: currentUser.name,
                email: currentUser.email,
                role: currentUser.role === 'member' ? 'user' : currentUser.role as "admin" | "manager" | "user",
                avatar: currentUser.avatar,
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
              }]
          : users;
        
        setAvailableUsers(allUsers);
        return allUsers;
      } catch (error) {
        console.error("Failed to fetch users:", error);
        toast.error("Failed to load users");
        throw error;
      } finally {
        setLoadingUsers(false);
      }
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
