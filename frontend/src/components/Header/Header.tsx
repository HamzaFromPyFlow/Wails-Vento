import React from "react";
import { useNavigate } from "react-router-dom";

type HeaderProps = {
  onLogin?: () => void;
  onSignup?: () => void;
  onStartStreaming?: () => void;
  logoHref?: string;
  hideSignInButton?: boolean;
  hideNewRecordingButton?: boolean;
};

function Header({
  onLogin,
  onSignup,
  onStartStreaming,
  logoHref = "#/",
  hideSignInButton = false,
  hideNewRecordingButton = false,
}: HeaderProps) {
  const navigate = useNavigate();
  const handleLogin = onLogin ?? (() => navigate("/auth/login"));
  const handleSignup = onSignup ?? (() => navigate("/auth/signup"));
  const handleStartStreaming = onStartStreaming ?? (() => navigate("/"));

  return (
    <header className="sticky top-0 z-50 border-b border-slate-800/50 bg-slate-950/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
        <a
          href={logoHref}
          className="flex items-center gap-2 hover:opacity-90 transition-opacity"
        >
          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white">
            V
          </div>
          <span className="text-xl font-semibold tracking-tight">Vento</span>
        </a>
        <nav className="flex items-center gap-6">
          {!hideSignInButton && (
            <>
              <button
                onClick={handleLogin}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Login
              </button>
              <button
                onClick={handleSignup}
                className="text-slate-400 hover:text-white transition-colors text-sm"
              >
                Signup
              </button>
            </>
          )}
          {!hideNewRecordingButton && (
            <button
              onClick={handleStartStreaming}
              className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors text-sm"
            >
              Start Streaming
            </button>
          )}
        </nav>
      </div>
    </header>
  );
}

export default Header;
