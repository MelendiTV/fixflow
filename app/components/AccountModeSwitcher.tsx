"use client";

import { useRouter } from "next/navigation";
import { useLanguage } from "@/app/components/LanguageProvider";
import { useAccountMode } from "@/app/components/AccountModeProvider";

export function AccountModeSwitcher() {
  const router = useRouter();
  const { language } = useLanguage();

  const {
    mode,
    setMode,
    canUseProviderMode,
  } = useAccountMode();

  if (!canUseProviderMode) {
    return null;
  }

  const text =
    language === "es"
      ? {
          label: "Modo RELYDO",
          customer: "Cliente",
          provider: "Profesional",
        }
      : {
          label: "RELYDO mode",
          customer: "Customer",
          provider: "Professional",
        };

  function cambiarModo(
    nextMode: "customer" | "provider"
  ) {
    setMode(nextMode);

    if (nextMode === "provider") {
      router.push("/pro");
      return;
    }

    router.push("/mis-solicitudes");
  }

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-bold">
        {text.label}
      </span>

      <select
        value={mode}
        onChange={(e) =>
          cambiarModo(
            e.target.value as
              | "customer"
              | "provider"
          )
        }
        className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm font-bold text-slate-900 outline-none"
      >
        <option value="provider">
          {text.provider}
        </option>

        <option value="customer">
          {text.customer}
        </option>
      </select>
    </div>
  );
}