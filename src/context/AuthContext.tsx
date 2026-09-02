import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export interface SSOUser {
  wp_user_id: number;
  email: string;
  name: string;
  first_name?: string;
  last_name?: string;
  phone?: string;
  fpo_name?: string;
  registration_no?: string;
  state?: string;
  district?: string;
  main_commodity?: string;
  avatar_url?: string;
  wp_role?: string;
}

interface AuthState {
  user: SSOUser | null;
  token: string | null;
  loading: boolean;
  logout: () => void;
}

const AuthContext = createContext<AuthState>({
  user: null,
  token: null,
  loading: true,
  logout: () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SSOUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me", { credentials: "same-origin" })
      .then((r) => r.json())
      .then((data) => {
        setUser(data.user ?? null);
        setToken(data.token ?? null);
      })
      .catch(() => {
        setUser(null);
        setToken(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const logout = () => {
    window.location.href = "/api/auth/logout";
  };

  return (
    <AuthContext.Provider value={{ user, token, loading, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
