"use client";

import {
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  useRouter,
} from "next/navigation";

import {
  useLanguage,
} from "@/app/components/LanguageProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function VerificarEmailPage() {
  const router = useRouter();
  const { language } = useLanguage();

  const [estado, setEstado] =
    useState<
      "loading" |
      "success" |
      "error"
    >("loading");

  const [mensaje, setMensaje] =
    useState("");

  const T = (
    es: string,
    en: string
  ) =>
    language === "es"
      ? es
      : en;

  useEffect(() => {
    async function verificar() {
      try {
        /*
          Supabase puede devolver la sesión
          en el hash de la URL:

          #access_token=...
        */

        const {
          data,
          error,
        } =
          await supabase.auth.getSession();

        if (error) {
          throw error;
        }

        if (
          data.session?.user
        ) {
          setEstado("success");

          setMensaje(
            T(
              "Tu correo electrónico fue verificado correctamente.",
              "Your email address was verified successfully."
            )
          );

          return;
        }

        /*
          Si todavía no aparece sesión,
          damos unos milisegundos para que
          Supabase procese el hash.
        */

        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              800
            )
        );

        const {
          data:
            secondSession,
          error:
            secondError,
        } =
          await supabase.auth.getSession();

        if (secondError) {
          throw secondError;
        }

        if (
          secondSession.session?.user
        ) {
          setEstado("success");

          setMensaje(
            T(
              "Tu correo electrónico fue verificado correctamente.",
              "Your email address was verified successfully."
            )
          );

          return;
        }

        setEstado("error");

        setMensaje(
          T(
            "No pudimos confirmar la sesión automáticamente. Tu correo puede haberse verificado correctamente; intenta iniciar sesión.",
            "We could not confirm the session automatically. Your email may have been verified successfully; try signing in."
          )
        );
      } catch (error) {
        console.error(
          "Error verificando email:",
          error
        );

        setEstado("error");

        setMensaje(
          T(
            "No pudimos completar la verificación del correo electrónico.",
            "We could not complete the email verification."
          )
        );
      }
    }

    verificar();
  }, [language]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">
      <div className="w-full max-w-xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

        <div className="bg-blue-700 p-8 text-white">
          <div className="text-2xl font-black">
            RELYDO
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            {T(
              "Verificación de correo",
              "Email verification"
            )}
          </h1>
        </div>

        <div className="p-8 text-center">

          {estado ===
            "loading" && (
            <>
              <div className="text-5xl">
                ⏳
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                {T(
                  "Verificando tu correo...",
                  "Verifying your email..."
                )}
              </h2>

              <p className="mt-3 text-slate-600">
                {T(
                  "Espera un momento.",
                  "Please wait a moment."
                )}
              </p>
            </>
          )}

          {estado ===
            "success" && (
            <>
              <div className="text-6xl">
                ✅
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-emerald-800">
                {T(
                  "Correo verificado",
                  "Email verified"
                )}
              </h2>

              <p className="mt-3 text-slate-600">
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/login-cliente"
                  )
                }
                className="mt-7 w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
              >
                {T(
                  "Iniciar sesión",
                  "Sign in"
                )}
              </button>
            </>
          )}

          {estado ===
            "error" && (
            <>
              <div className="text-6xl">
                ⚠️
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-amber-800">
                {T(
                  "Verificación incompleta",
                  "Verification incomplete"
                )}
              </h2>

              <p className="mt-3 text-slate-600">
                {mensaje}
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    "/login-cliente"
                  )
                }
                className="mt-7 w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
              >
                {T(
                  "Ir a iniciar sesión",
                  "Go to sign in"
                )}
              </button>
            </>
          )}

        </div>
      </div>
    </main>
  );
}