import { useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { AuthShell, CredentialsForm } from "@kasumi/ui";
import { COPY } from "@/copy.js";
import { api, errorText } from "@/lib/api.js";
import { useAuth } from "@/lib/auth.jsx";

export function Login() {
  const { user, setUser } = useAuth();
  const location = useLocation();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  if (user) return <Navigate to={location.state?.from ?? "/"} replace />;

  const submit = async ({ email, password, displayName }, { signupMode }) => {
    setBusy(true);
    setError("");
    try {
      const res = signupMode
        ? await api.post("/api/auth/signup", { email, password, name: displayName })
        : await api.post("/api/auth/login", { email, password });
      setUser(res.user);
    } catch (err) {
      setError(errorText(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthShell
      appName={COPY.APP_NAME}
      tagline={COPY.AUTH.TAGLINE}
      highlights={COPY.AUTH.HIGHLIGHTS}
      logo={<img src="/favicon.svg" alt="" className="h-10 w-10" />}
      assurance={COPY.AUTH.DEMO}
    >
      <CredentialsForm copy={COPY.AUTH} busy={busy} error={error} onSubmit={submit} onGoogle={null} />
    </AuthShell>
  );
}
