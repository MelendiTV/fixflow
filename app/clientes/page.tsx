"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useLanguage } from "@/app/components/LanguageProvider";

const LOGO_SRC = "/relydo-logo.png";

function BrandLogo() {
  return (
    <div className="flex items-center gap-3">
      <img
        src={LOGO_SRC}
        alt="RELYDO"
        className="h-10 w-auto object-contain sm:h-11"
        onError={(event) => {
          event.currentTarget.style.display = "none";
          const fallback = event.currentTarget.nextElementSibling as HTMLElement | null;
          if (fallback) fallback.style.display = "inline";
        }}
      />
      <span
        style={{ display: "none" }}
        className="text-2xl font-black tracking-[0.06em] text-slate-950"
      >
        RELY<span className="text-blue-600">DO</span>
      </span>
    </div>
  );
}