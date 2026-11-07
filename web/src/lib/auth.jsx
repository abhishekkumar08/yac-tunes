import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useNotifications } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api, errorText, setUnauthorizedHandler } from "@/lib/api.js";
import { PageLoading } from "@/components/PageState.jsx";

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(undefined);
  const { notify } = useNotifications();

  useEffect(() => {
    api.get("/api/me").then(
      (d) => setUser(d.user),
      () => setUser(null),
    );
    setUnauthorizedHandler(() => setUser(null));
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post("/api/auth/logout");
      setUser(null);
      notify(COPY.AUTH.LOGGED_OUT, "info");
    } catch (err) {
      notify(errorText(err), "error");
    }
  }, [notify]);

  const value = useMemo(() => ({ user, setUser, logout }), [user, logout]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function RequireAuth({ children }) {
  const { user } = useAuth();
  const location = useLocation();
  if (user === undefined) return <PageLoading />;
  if (!user) return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />;
  return children;
}
