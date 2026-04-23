export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen" style={{ background: "#09090B" }}>
      {/* Left — Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #09090B 0%, #18181B 100%)" }}>
        <div className="relative z-10 flex flex-col justify-between p-14 w-full">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "linear-gradient(135deg, #6366F1, #8B5CF6)" }}>
              <span className="text-white text-sm font-semibold">O</span>
            </div>
            <span className="text-lg font-medium text-white tracking-tight">OpenPortal</span>
          </div>

          <div>
            <h1 className="text-[32px] font-medium leading-[1.2] tracking-tight" style={{ color: "#FAFAFA" }}>
              Colaborare,<br />documente, video, AI.<br />
              <span style={{ color: "#71717A" }}>Totul într-un singur loc.</span>
            </h1>
            <p className="mt-4 text-sm leading-relaxed max-w-md" style={{ color: "#52525B" }}>
              Platforma open-source care unifică și depășește funcționalitățile oferite de SharePoint. Pentru orice organizație, orice industrie.
            </p>
          </div>

          <p className="text-xs" style={{ color: "#3F3F46" }}>
            © {new Date().getFullYear()} OpenPortal · Open Source, AGPL-3.0
          </p>
        </div>

        {/* Grid pattern */}
        <div className="absolute inset-0 opacity-[0.03]">
          <svg width="100%" height="100%">
            <defs>
              <pattern id="grid" width="60" height="60" patternUnits="userSpaceOnUse">
                <path d="M 60 0 L 0 0 0 60" fill="none" stroke="white" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#grid)" />
          </svg>
        </div>

        {/* Gradient orb */}
        <div className="absolute bottom-[-200px] right-[-100px] w-[500px] h-[500px] rounded-full opacity-[0.06]"
          style={{ background: "radial-gradient(circle, #6366F1, transparent 70%)" }} />
      </div>

      {/* Right — Form */}
      <div className="flex w-full lg:w-1/2 items-center justify-center p-8" style={{ background: "#FAFAFA" }}>
        <div className="w-full max-w-sm">
          {children}
        </div>
      </div>
    </div>
  );
}
