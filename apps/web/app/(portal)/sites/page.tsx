"use client";

import { useState } from "react";

export default function SitesPage() {
  const [showCreate, setShowCreate] = useState(false);

  return (
    <div className="animate-fade-in space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Site-uri</h1>
          <p className="mt-1 text-slate-500">Gestionează site-urile organizației tale.</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Site nou
        </button>
      </div>

      {/* Empty state */}
      <div className="card p-12 text-center">
        <div className="mx-auto h-20 w-20 rounded-full bg-slate-100 flex items-center justify-center mb-6">
          <svg className="h-10 w-10 text-slate-300" fill="none" viewBox="0 0 24 24" strokeWidth={1} stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 21a9.004 9.004 0 0 0 8.716-6.747M12 21a9.004 9.004 0 0 1-8.716-6.747M12 21c2.485 0 4.5-4.03 4.5-9S14.485 3 12 3m0 18c-2.485 0-4.5-4.03-4.5-9S9.515 3 12 3m0 0a8.997 8.997 0 0 1 7.843 4.582M12 3a8.997 8.997 0 0 0-7.843 4.582m15.686 0A11.953 11.953 0 0 1 12 10.5c-2.998 0-5.74-1.1-7.843-2.918m15.686 0A8.959 8.959 0 0 1 21 12c0 .778-.099 1.533-.284 2.253m0 0A17.919 17.919 0 0 1 12 16.5c-3.162 0-6.133-.815-8.716-2.247m0 0A9.015 9.015 0 0 1 3 12c0-1.605.42-3.113 1.157-4.418" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Niciun site încă</h3>
        <p className="text-slate-500 text-sm max-w-sm mx-auto mb-6">
          Site-urile sunt spații de lucru pentru echipele tale. Creează primul site pentru a începe colaborarea.
        </p>
        <button onClick={() => setShowCreate(true)} className="btn-primary">
          Creează primul site
        </button>
      </div>
    </div>
  );
}
