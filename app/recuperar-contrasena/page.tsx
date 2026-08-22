"use client";

import {
  Suspense,
  useEffect,
  useState,
} from "react";

import {
  createClient,
} from "@supabase/supabase-js";

import {
  useRouter,
  useSearchParams,
} from "next/navigation";

import {
  useLanguage,
} from "@/app/components/LanguageProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type TipoCuenta =
  | "cliente"
  | "profesional";

function RecuperarContrasenaContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const tipoParam =
    searchParams.get("tipo");

  const tipo: TipoCuenta =
    tipoParam === "profesional"
      ? "profesional"
      : "cliente";

  const loginDestino =
    tipo === "profesional"
      ? "/login-profesional"
      : "/login-cliente";

  const [password, setPassword] =
    useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  const [loading, setLoading] =
    useState(false);

  const [checking, setChecking] =
    useState(true);

  const [error, setError] =
    useState("");

  const [mensaje, setMensaje] =
    useState("");

  const [
    recoveryValid,
    setRecoveryValid,
  ] = useState(false);

  const text =
    language === "es"
      ? {
          verificando:
            "Verificando enlace...",
          titulo:
            "Nueva contraseña",
          descripcion:
            "Crea una nueva contraseña para tu cuenta.",
          nuevaPassword:
            "Nueva contraseña",
          confirmarPassword:
            "Confirmar contraseña",
          minimo:
            "Mínimo 8 caracteres",
          repetir:
            "Repite la contraseña",
          actualizando:
            "Actualizando...",
          cambiar:
            "Cambiar contraseña",
          actualizado:
            "Contraseña actualizada correctamente.",
          redirigiendo:
            "Redirigiendo al inicio de sesión...",
          volver:
            "Volver al inicio de sesión",
          enlaceInvalido:
            "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo.",
          enlaceYaNoValido:
            "El enlace de recuperación ya no es válido. Solicita uno nuevo.",
          minimoError:
            "La contraseña debe tener al menos 8 caracteres.",
          noCoinciden:
            "Las contraseñas no coinciden.",
          noValidar:
            "No se pudo validar el enlace de recuperación.",
          noCambiar:
            "No se pudo cambiar la contraseña",
        }
      : {
          verificando:
            "Verifying link...",
          titulo:
            "New password",
          descripcion:
            "Create a new password for your account.",
          nuevaPassword:
            "New password",
          confirmarPassword:
            "Confirm password",
          minimo:
            "Minimum 8 characters",
          repetir:
            "Repeat your password",
          actualizando:
            "Updating...",
          cambiar:
            "Change password",
          actualizado:
            "Password updated successfully.",
          redirigiendo:
            "Redirecting to sign in...",
          volver:
            "Back to sign in",
          enlaceInvalido:
            "The recovery link is invalid or has expired. Request a new one.",
          enlaceYaNoValido:
            "The recovery link is no longer valid. Request a new one.",
          minimoError:
            "The password must contain at least 8 characters.",
          noCoinciden:
            "The passwords do not match.",
          noValidar:
            "We could not validate the recovery link.",
          noCambiar:
            "We could not change the password",
        };

  useEffect(() => {
    let mounted = true;

    /*
      IMPORTANTE:

      Escuchamos PASSWORD_RECOVERY antes
      de procesar el enlace.
    */

    const {
      data: {
        subscription,
      },
    } =
      supabase.auth.onAuthStateChange(
        (event) => {
          if (
            event ===
              "PASSWORD_RECOVERY" &&
            mounted
          ) {
            setRecoveryValid(true);
            setChecking(false);
            setError("");
          }
        }
      );

    async function comprobarRecuperacion() {
      setError("");

      try {
        /*
          1. FLUJO PKCE ACTUAL DE SUPABASE

          URL:
          /recuperar-contrasena?code=...
        */

        const url =
          new URL(
            window.location.href
          );

        const code =
          url.searchParams.get(
            "code"
          );

        if (code) {
          const {
            error:
              exchangeError,
          } =
            await supabase.auth
              .exchangeCodeForSession(
                code
              );

          if (exchangeError) {
            throw new Error(
              exchangeError.message
            );
          }

          /*
            Quitamos el code de la URL
            después de usarlo.

            Conservamos tipo para saber
            a qué login regresar.
          */

          window.history.replaceState(
            {},
            document.title,
            `/recuperar-contrasena?tipo=${tipo}`
          );
        }

        /*
          2. SOPORTE PARA FLUJO
             IMPLICIT ANTIGUO

          #access_token=...
          &refresh_token=...
          &type=recovery
        */

        const hash =
          window.location.hash;

        if (hash) {
          const params =
            new URLSearchParams(
              hash.startsWith("#")
                ? hash.substring(1)
                : hash
            );

          const accessToken =
            params.get(
              "access_token"
            );

          const refreshToken =
            params.get(
              "refresh_token"
            );

          if (
            accessToken &&
            refreshToken
          ) {
            const {
              error:
                sessionError,
            } =
              await supabase.auth
                .setSession({
                  access_token:
                    accessToken,
                  refresh_token:
                    refreshToken,
                });

            if (sessionError) {
              throw new Error(
                sessionError.message
              );
            }

            window.history.replaceState(
              {},
              document.title,
              `/recuperar-contrasena?tipo=${tipo}`
            );
          }
        }

        /*
          3. COMPROBAR SESIÓN
        */

        const {
          data: {
            session,
          },
          error:
            sessionCheckError,
        } =
          await supabase.auth
            .getSession();

        if (
          sessionCheckError ||
          !session
        ) {
          if (mounted) {
            setRecoveryValid(false);
            setError(
              text.enlaceInvalido
            );
          }

          return;
        }

        /*
          4. CONFIRMAR USUARIO
        */

        const {
          data: {
            user,
          },
          error:
            userError,
        } =
          await supabase.auth
            .getUser();

        if (
          userError ||
          !user
        ) {
          if (mounted) {
            setRecoveryValid(false);
            setError(
              text.enlaceInvalido
            );
          }

          return;
        }

        if (mounted) {
          setRecoveryValid(true);
          setError("");
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        console.error(
          "Error validando recuperación:",
          err
        );

        setRecoveryValid(false);

        setError(
          err instanceof Error &&
          err.message
            ? `${text.noValidar}: ${err.message}`
            : text.noValidar
        );
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    comprobarRecuperacion();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [tipo]);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!recoveryValid) {
      setError(
        text.enlaceYaNoValido
      );

      return;
    }

    if (password.length < 8) {
      setError(
        text.minimoError
      );

      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        text.noCoinciden
      );

      return;
    }

    setLoading(true);

    try {
      const {
        error:
          updateError,
      } =
        await supabase.auth
          .updateUser({
            password,
          });

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setPassword("");
      setConfirmPassword("");

      setMensaje(
        text.actualizado
      );

      /*
        Cerramos la sesión temporal
        de recuperación.

        El usuario vuelve a iniciar
        sesión normalmente.
      */

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace(
          loginDestino
        );
      }, 1800);
    } catch (err) {
      setError(
        err instanceof Error
          ? `${text.noCambiar}: ${err.message}`
          : text.noCambiar
      );
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            {text.verificando}
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4 py-10">

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

        {/* HEADER */}

        <div className="bg-blue-700 px-8 py-7 text-white">

          <div className="text-2xl font-black">
            RELYDO
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            {text.titulo}
          </h1>

          <p className="mt-2 text-blue-100">
            {text.descripcion}
          </p>

        </div>

        <div className="p-8">

          {/* ERROR */}

          {error && (
            <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
              {error}
            </div>
          )}

          {/* SUCCESS */}

          {mensaje && (
            <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 text-green-700">

              {mensaje}

              <p className="mt-2 text-sm">
                {text.redirigiendo}
              </p>

            </div>
          )}

          {recoveryValid &&
            !mensaje && (
              <form
                onSubmit={
                  handleSubmit
                }
                className="space-y-6"
              >

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    {text.nuevaPassword}
                  </label>

                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) =>
                      setPassword(
                        e.target.value
                      )
                    }
                    placeholder={
                      text.minimo
                    }
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    {text.confirmarPassword}
                  </label>

                  <input
                    type="password"
                    required
                    minLength={8}
                    autoComplete="new-password"
                    value={
                      confirmPassword
                    }
                    onChange={(e) =>
                      setConfirmPassword(
                        e.target.value
                      )
                    }
                    placeholder={
                      text.repetir
                    }
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? text.actualizando
                    : text.cambiar}
                </button>

              </form>
            )}

          {!recoveryValid &&
            !mensaje && (
              <button
                type="button"
                onClick={() =>
                  router.replace(
                    loginDestino
                  )
                }
                className="w-full rounded-xl bg-blue-700 px-6 py-4 font-extrabold text-white hover:bg-blue-800"
              >
                {text.volver}
              </button>
            )}

        </div>

      </div>

    </main>
  );
}

function RecuperarContrasenaFallback() {
  const { language } =
    useLanguage();

  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-2xl bg-white px-8 py-7 shadow-lg">
        <p className="font-bold text-slate-700">
          {language === "es"
            ? "Cargando..."
            : "Loading..."}
        </p>
      </div>
    </main>
  );
}

export default function RecuperarContrasena() {
  return (
    <Suspense
      fallback={
        <RecuperarContrasenaFallback />
      }
    >
      <RecuperarContrasenaContenido />
    </Suspense>
  );
}