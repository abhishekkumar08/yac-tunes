import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { NotificationProvider, ThemeProvider } from "@kasumi/ui";
import "@kasumi/ui/font";
import "@/index.css";
import "@/brand/theme.css";
import { App } from "@/App.jsx";
import { AuthProvider } from "@/lib/auth.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <ThemeProvider defaultTheme="dark" defaultMaterial="solid" storageKey="yac-tunes-theme">
      <NotificationProvider>
        <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </NotificationProvider>
    </ThemeProvider>
  </React.StrictMode>,
);
