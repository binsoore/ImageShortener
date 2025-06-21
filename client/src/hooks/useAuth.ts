import { useQuery } from "@tanstack/react-query";

export function useAuth() {
  const { data: authStatus, isLoading: statusLoading } = useQuery({
    queryKey: ["/api/auth/status"],
    retry: false,
  });

  const { data: user, isLoading: userLoading } = useQuery({
    queryKey: ["/api/auth/user"],
    retry: false,
    enabled: authStatus?.isAuthenticated || false,
  });

  return {
    user,
    isLoading: statusLoading || userLoading,
    isAuthenticated: authStatus?.isAuthenticated || false,
  };
}