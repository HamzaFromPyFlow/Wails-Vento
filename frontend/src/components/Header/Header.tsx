import React from "react";

type HeaderProps = {
  onLogin?: () => void;
  onSignup?: () => void;
  onStartStreaming?: () => void;
  /** Optional home URL for the logo - defaults to # */
  logoHref?: string;
};

function Header({
  onLogin,
  onSignup,
  onStartStreaming,
  logoHref = "#",
}: HeaderProps) {
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
          <button
            onClick={onLogin}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Login
          </button>
          <button
            onClick={onSignup}
            className="text-slate-400 hover:text-white transition-colors text-sm"
          >
            Signup
          </button>
          <button
            onClick={onStartStreaming}
            className="px-5 py-2.5 bg-indigo-500 hover:bg-indigo-400 text-white font-medium rounded-lg transition-colors text-sm"
          >
            Start Streaming
          </button>
        </nav>
      </div>
    </header>
  );
}

export default Header;
