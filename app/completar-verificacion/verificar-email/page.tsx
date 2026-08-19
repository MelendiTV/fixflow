"use client";

import { useRouter } from "next/navigation";

import {
  useLanguage,
} from "@/app/components/LanguageProvider";

export default function VerificarEmailPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const text =
    language === "es"
      ? {
          marca: "RELYDO",
          titulo:
            "Correo verificado correctamente",
          descripcion:
            "Tu cuenta de RELYDO está lista. Ya puedes iniciar sesión y continuar.",
          seguridad:
            "Tu correo electrónico ha sido confirmado.",
          iniciarSesion:
            "Iniciar sesión",
          volverInicio:
            "Volver al inicio",
        }
      : {
          marca: "RELYDO",
          titulo:
            "Email verified successfully",
          descripcion:
            "Your RELYDO account is ready. You can now sign in and continue.",
          seguridad:
            "Your email address has been confirmed.",
          iniciarSesion:
            "Sign in",
          volverInicio:
            "Back to home",
        };

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

        {/* HEADER */}

        <div className="bg-blue-700 px-8 py-7 text-white">
          <div className="text-2xl font-black">
            {text.marca}
          </div>

          <p className="mt-2 text-blue-100">
            {language === "es"
              ? "Verificación de cuenta"
              : "Account verification"}
          </p>
        </div>

        {/* CONTENT */}

        <div className="p-8 text-center">

          <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-4xl">
            ✓
          </div>

          <h1 className="mt-6 text-3xl font-extrabold text-slate-900">
            {text.titulo}
          </h1>

          <p className="mt-4 text-lg leading-7 text-slate-600">
            {text.descripcion}
          </p>

          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5">
            <p className="font-semibold text-green-800">
              ✓ {text.seguridad}
            </p>
          </div>

          <button
            type="button"
            onClick={() =>
              router.push("/login-cliente")
            }
            className="mt-8 w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
          >
            {text.iniciarSesion}
          </button>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="mt-4 font-bold text-blue-700 hover:underline"
          >
            ← {text.volverInicio}
          </button>

        </div>
      </div>
    </main>
  );
}