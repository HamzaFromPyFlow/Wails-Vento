import { useEffect } from "react";
import { HashRouter, Routes, Route, Navigate, useLocation } from "react-router-dom";
import { MantineProvider } from "@mantine/core";
import { onAuthStateChanged, type Auth } from "firebase/auth";
import * as firebaseLib from "./lib/firebase";

const firebaseAuth = firebaseLib.auth as Auth | undefined;
import { useAuth } from "./stores/authStore";
import webAPI from "./lib/webapi";
import Landing from "./pages/Landing";
import RecordingsPage from "./pages/recordings/Recordings.jsx";
import FolderPage from "./pages/recordings/FolderPage.jsx";
import ViewRecording from "./pages/view/ViewRecording.jsx";
import RecordNew from "./pages/record/RecordNew.jsx";
import Profile from "./pages/profile/Profile.jsx";
import AuthPage from "./pages/auth/Auth.jsx";
import ResetPasswordPage from "./pages/auth/ResetPassword.jsx";
import AuthVerifyPage from "./pages/auth/AuthVerify.jsx";
import AuthActionPage from "./pages/auth/AuthAction.jsx";
import InvitationExpiredPage from "./pages/auth/InvitationExpired.jsx";
import BetaNoAccessPage from "./pages/auth/BetaNoAccess.jsx";
import "./App.css";

function HomeOrRedirect() {
  const ventoUser = useAuth((s) => s.ventoUser);
  if (ventoUser) return <Navigate to="/recordings" replace />;
  return <Landing />;
}

function RequireAuth({ children }: { children: React.ReactNode }) {
  const ventoUser = useAuth((s) => s.ventoUser);
  const location = useLocation();
  if (!ventoUser) {
    return <Navigate to="/" replace state={{ from: location }} />;
  }
  return <>{children}</>;
}

function App() {
  const setVentoUser = useAuth((s) => s.setVentoUser);

  useEffect(() => {
    if (!firebaseAuth) return;
    return onAuthStateChanged(firebaseAuth, async (firebaseUser) => {
      if (!firebaseUser) {
        setVentoUser(null);
        return;
      }
      try {
        // @ts-expect-error - userGet expects uid when backend is wired
        const ventoUser = await webAPI.user.userGet(firebaseUser.uid);
        setVentoUser(ventoUser || null);
      } catch {
        setVentoUser({
          id: firebaseUser.uid,
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName,
          name: firebaseUser.displayName || firebaseUser.email,
          profilePhotoUrl: firebaseUser.photoURL,
        });
      }
    });
  }, [setVentoUser]);

  return (
    <MantineProvider defaultColorScheme="dark">
      <HashRouter>
        <Routes>
          <Route path="/" element={<HomeOrRedirect />} />
          <Route path="/auth/login" element={<AuthPage login />} />
          <Route path="/auth/signup" element={<AuthPage />} />
          <Route path="/login" element={<Navigate to="/auth/login" replace />} />
          <Route path="/signup" element={<Navigate to="/auth/signup" replace />} />
          <Route path="/auth/reset-password" element={<ResetPasswordPage />} />
          <Route path="/auth/verify" element={<AuthVerifyPage />} />
          <Route path="/auth/action" element={<AuthActionPage />} />
          <Route path="/auth/invitation-expired" element={<InvitationExpiredPage />} />
          <Route path="/auth/beta-no-access" element={<BetaNoAccessPage />} />
          <Route path="/recordings" element={<RequireAuth><RecordingsPage /></RequireAuth>} />
          <Route path="/recordings/folder/:folderId" element={<RequireAuth><FolderPage /></RequireAuth>} />
          <Route path="/view/:id" element={<RequireAuth><ViewRecording /></RequireAuth>} />
          <Route path="/record/new" element={<RecordNew />} />
          <Route path="/profile" element={<RequireAuth><Profile /></RequireAuth>} />
          <Route path="/pricing" element={<Navigate to="/" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </HashRouter>
    </MantineProvider>
  );
}

export default App;
