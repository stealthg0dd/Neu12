import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/api";

interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}

export function useAuth() {
  const queryClient = useQueryClient();

  const { data: user, isLoading, error } = useQuery<User>({
    queryKey: ["/api/auth/me"],
    queryFn: async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      
      const response = await apiRequest("GET", "/api/auth/me");
      return response.json();
    },
    retry: false,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      localStorage.removeItem("token");
      queryClient.clear();
    },
    onSuccess: () => {
      window.location.reload();
    },
  });

  const logout = () => {
    logoutMutation.mutate();
  };

  return {
    user: error ? null : user,
    isLoading,
    isAuthenticated: !!user && !error,
    logout,
  };
}
