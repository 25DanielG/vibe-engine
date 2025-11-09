import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Dashboard from "./sections/Dashboard";
import App from "./App";
import RequireAuth from "./components/RequireAuth";
import Onboarding from "./pages/Onboarding";
import GithubCallback from "./pages/GithubCallback";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/onboarding"
          element={
            <RequireAuth>
              <Onboarding />
            </RequireAuth>
          }
        />
        <Route
          path="/dashboard"
          element={
            <RequireAuth requireGitHub={true}>
              <Dashboard />
            </RequireAuth>
          }
        />
        <Route
          path="/auth/callback"
          element={
            <RequireAuth>
              <GithubCallback />
            </RequireAuth>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
