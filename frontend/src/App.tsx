import { HashRouter, Routes, Route, Navigate } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import Landing from "./pages/Landing";
import AuthPage from "./pages/auth/Auth.jsx";
import ResetPasswordPage from "./pages/auth/ResetPassword.jsx";
import AuthVerifyPage from "./pages/auth/AuthVerify.jsx";
import AuthActionPage from "./pages/auth/AuthAction.jsx";
import InvitationExpiredPage from "./pages/auth/InvitationExpired.jsx";
import BetaNoAccessPage from "./pages/auth/BetaNoAccess.jsx";
import "./App.css";

function App() {
  return (
    <MantineProvider defaultColorScheme="dark">
      <HashRouter>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/auth/login" element={<AuthPage login />} />
          <Route path="/auth/signup" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/auth/action" element={<AuthActionPage />} />
          <Route path="/auth/invitation-expired" element={<InvitationExpiredPage />} />
          <Route path="/auth/beta-no-access" element={<BetaNoAccessPage />} />
          <Route path="/recordings" element={<Navigate to="/" replace />} />
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  );
}

export default App;
