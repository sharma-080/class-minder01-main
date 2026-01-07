// src/hooks/use-auth.ts
import { useFirebase } from "@/contexts/FirebaseContext";

export function useAuth() {
  const { user, loading } = useFirebase();

  return {
    user,
    isLoading: loading,
  };
}
