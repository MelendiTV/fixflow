"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function RecuperarContrasena() {
  const router = useRouter();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [recoveryValid, setRecoveryValid] =
    useState(false);

  useEffect(() => {
    let mounted = true;

    async function comprobarRecuperacion() {
      setError("");

      try {
        /*
          SOPORTE PARA EL FLUJO ANTIGUO/IMPLICIT:

          #access_token=...
          &refresh_token=...
        */

        const hash = window.location.hash;

        if (hash) {
          const params = new URLSearchParams(
            hash.startsWith("#")
              ? hash.substring(1)
              : hash
          );

          const accessToken =
            params.get("access_token");

          const refreshToken =
            params.get("refresh_token");

          const type =
            params.get("type");

          if (
            accessToken &&
            refreshToken
          ) {
            const {
              error: sessionError,
            } =
              await supabase.auth.setSession({
                access_token:
                  accessToken,

                refresh_token:
                  refreshToken,
              });

            if (sessionError) {
              throw new Error(
                `No se pudo validar el enlace: ${sessionError.message}`
              );
            }

            if (
              type === "recovery" &&
              mounted
            ) {
              setRecoveryValid(true);
            }

            window.history.replaceState(
              {},
              document.title,
              "/recuperar-contrasena"
            );
          }
        }

        /*
          SI SUPABASE YA CREÓ LA SESIÓN,
          COMPROBAMOS AL USUARIO.
        */

        const {
          data: { user },
          error: userError,
        } =
          await supabase.auth.getUser();

        if (userError || !user) {
          if (mounted) {
            setError(
              "El enlace de recuperación no es válido o ha expirado. Solicita uno nuevo."
            );

            setRecoveryValid(false);
          }

          return;
        }

        if (mounted) {
          setRecoveryValid(true);
        }
      } catch (err) {
        if (!mounted) {
          return;
        }

        if (err instanceof Error) {
          setError(err.message);
        } else {
          setError(
            "No se pudo validar el enlace de recuperación."
          );
        }

        setRecoveryValid(false);
      } finally {
        if (mounted) {
          setChecking(false);
        }
      }
    }

    /*
      Supabase también emite
      PASSWORD_RECOVERY cuando entra
      mediante un enlace de recuperación.
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
            "PASSWORD_RECOVERY"
          ) {
            setRecoveryValid(true);
            setChecking(false);
            setError("");
          }
        }
      );

    comprobarRecuperacion();

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");

    if (!recoveryValid) {
      setError(
        "El enlace de recuperación ya no es válido. Solicita uno nuevo."
      );
      return;
    }

    if (password.length < 8) {
      setError(
        "La contraseña debe tener al menos 8 caracteres."
      );
      return;
    }

    if (
      password !==
      confirmPassword
    ) {
      setError(
        "Las contraseñas no coinciden."
      );
      return;
    }

    setLoading(true);

    try {
      const {
        error: updateError,
      } =
        await supabase.auth.updateUser({
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
        "Contraseña actualizada correctamente."
      );

      /*
        Cerramos la sesión de recuperación
        para que el usuario vuelva a entrar
        normalmente con su nueva contraseña.
      */

      await supabase.auth.signOut();

      setTimeout(() => {
        router.replace(
          "/login-profesional"
        );
      }, 1800);
    } catch (err) {
      if (err instanceof Error) {
        setError(
          `No se pudo cambiar la contraseña: ${err.message}`
        );
      } else {
        setError(
          "No se pudo cambiar la contraseña."
        );
      }
    } finally {
      setLoading(false);
    }
  }

  if (checking) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            Verificando enlace...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

        {/* HEADER */}

        <div className="bg-blue-700 px-8 py-7 text-white">

          <div className="text-2xl font-black">
            RELYDO
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            Nueva contraseña
          </h1>

          <p className="mt-2 text-blue-100">
            Crea una nueva contraseña para tu cuenta.
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
                Redirigiendo al inicio de sesión...
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
                    Nueva contraseña
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
                    placeholder="Mínimo 8 caracteres"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <div>

                  <label className="mb-2 block font-bold text-slate-900">
                    Confirmar contraseña
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
                    placeholder="Repite la contraseña"
                    className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
                  />

                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {loading
                    ? "Actualizando..."
                    : "Cambiar contraseña"}
                </button>

              </form>
            )}

          {!recoveryValid &&
            !mensaje && (
              <button
                type="button"
                onClick={() =>
                  router.replace(
                    "/login-profesional"
                  )
                }
                className="w-full rounded-xl bg-blue-700 px-6 py-4 font-extrabold text-white hover:bg-blue-800"
              >
                Volver al inicio de sesión
              </button>
            )}

        </div>

      </div>

    </main>
  );
}
