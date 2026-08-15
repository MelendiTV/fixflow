"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function LoginProfesional() {
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  const [cargando, setCargando] = useState(false);
  const [recuperando, setRecuperando] = useState(false);

  /*
    ASEGURAR QUE LA ESPECIALIDAD
    EXISTA EN provider_services
  */

  async function asegurarServicioProfesional(
    providerId: string,
    trade: string | null
  ) {
    if (!trade) {
      return;
    }

    const {
      data: servicio,
      error: servicioError,
    } = await supabase
      .from("services")
      .select("id, slug")
      .eq("slug", trade)
      .eq("active", true)
      .maybeSingle();

    if (servicioError) {
      console.error(
        "Error buscando servicio:",
        servicioError
      );
      return;
    }

    if (!servicio) {
      console.warn(
        `No existe un servicio activo con slug "${trade}".`
      );
      return;
    }

    const {
      data: relacionExistente,
      error: relacionError,
    } = await supabase
      .from("provider_services")
      .select("provider_id, service_id")
      .eq("provider_id", providerId)
      .eq("service_id", servicio.id)
      .maybeSingle();

    if (relacionError) {
      console.error(
        "Error comprobando provider_services:",
        relacionError
      );
      return;
    }

    if (relacionExistente) {
      return;
    }

    const {
      error: insertError,
    } = await supabase
      .from("provider_services")
      .insert({
        provider_id: providerId,
        service_id: servicio.id,
      });

    if (insertError) {
      console.error(
        "Error asignando especialidad:",
        insertError
      );
    }
  }

  async function handleLogin(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    setError("");
    setMensaje("");
    setCargando(true);

    try {
      const emailLimpio =
        email.trim().toLowerCase();

      /*
        INICIAR SESIÓN
      */

      const {
        data,
        error: loginError,
      } = await supabase.auth.signInWithPassword({
        email: emailLimpio,
        password,
      });

      if (loginError) {
        throw new Error(
          loginError.message
        );
      }

      if (!data.user) {
        throw new Error(
          "No se pudo iniciar sesión."
        );
      }

      const user = data.user;

      /*
        BUSCAR profiles

        IMPORTANTE:
        Un profesional recién registrado
        puede todavía NO tener profiles.

        En ese caso comprobamos los metadata
        guardados durante el registro.
      */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `No se pudo comprobar tu cuenta: ${profileError.message}`
        );
      }

      /*
        PERFIL TODAVÍA NO CREADO

        Si viene del registro profesional,
        lo mandamos a completar su perfil.
      */

      if (!profile) {
        const signupType =
          user.user_metadata?.signup_type;

        if (
          signupType === "provider"
        ) {
          router.replace(
            "/completar-perfil-profesional"
          );

          return;
        }

        await supabase.auth.signOut();

        throw new Error(
          "No se encontró un perfil válido para esta cuenta."
        );
      }

      /*
        ADMIN
      */

      if (
        profile.role === "admin"
      ) {
        router.replace(
          "/admin"
        );

        return;
      }

      /*
        PROFESIONAL
      */

      if (
        profile.role === "provider"
      ) {
        const {
          data: providerProfile,
          error: providerError,
        } = await supabase
          .from("provider_profiles")
          .select(`
            user_id,
            trade,
            verification_status,
            verified,
            active
          `)
          .eq(
            "user_id",
            user.id
          )
          .maybeSingle();

        if (providerError) {
          throw new Error(
            `No se pudo cargar el perfil profesional: ${providerError.message}`
          );
        }

        /*
          SI profiles EXISTE
          PERO provider_profiles NO,
          TERMINAMOS DE CREAR EL PERFIL.
        */

        if (!providerProfile) {
          router.replace(
            "/completar-perfil-profesional"
          );

          return;
        }

        /*
          ASEGURAR provider_services

          Esto también repara automáticamente
          cuentas antiguas a las que les falte
          la relación con su especialidad.
        */

        await asegurarServicioProfesional(
          user.id,
          providerProfile.trade
        );

        /*
          PANEL PROFESIONAL
        */

        router.replace(
          "/panel-profesional"
        );

        router.refresh();

        return;
      }

      /*
        OTROS ROLES
      */

      await supabase.auth.signOut();

      throw new Error(
        "Esta cuenta no tiene acceso al portal profesional."
      );
    } catch (err) {
      console.error(err);

      if (err instanceof Error) {
        setError(
          err.message
        );
      } else {
        setError(
          "Ocurrió un error inesperado al iniciar sesión."
        );
      }

      setCargando(false);
    }
  }

  async function recuperarContrasena() {
    setError("");
    setMensaje("");

    const emailLimpio =
      email.trim().toLowerCase();

    if (!emailLimpio) {
      setError(
        "Escribe primero tu email para recuperar la contraseña."
      );
      return;
    }

    setRecuperando(true);

    try {
      const redirectTo =
        `${window.location.origin}/recuperar-contrasena`;

      const {
        error: resetError,
      } =
        await supabase.auth.resetPasswordForEmail(
          emailLimpio,
          {
            redirectTo,
          }
        );

      if (resetError) {
        throw new Error(
          resetError.message
        );
      }

      setMensaje(
        "Te enviamos un correo para cambiar tu contraseña. Revisa también Spam o Correo no deseado."
      );
    } catch (err) {
      if (err instanceof Error) {
        if (
          err.message
            .toLowerCase()
            .includes("rate limit")
        ) {
          setError(
            "Se han solicitado demasiados correos en poco tiempo. Espera un poco antes de intentarlo nuevamente."
          );
        } else {
          setError(
            `No se pudo enviar el correo: ${err.message}`
          );
        }
      } else {
        setError(
          "No se pudo enviar el correo de recuperación."
        );
      }
    } finally {
      setRecuperando(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-md overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

        {/* HEADER */}

        <div className="bg-blue-700 px-8 py-8 text-white">

          <div className="text-2xl font-black">
            FixFlow
          </div>

          <h1 className="mt-2 text-3xl font-extrabold">
            Acceso profesional
          </h1>

          <p className="mt-2 text-blue-100">
            Inicia sesión para acceder a tu cuenta.
          </p>

        </div>

        {/* FORM */}

        <form
          onSubmit={handleLogin}
          className="space-y-6 p-8"
        >

          <div>

            <label className="mb-2 block font-bold text-slate-900">
              Email
            </label>

            <input
              type="email"
              required
              autoComplete="email"
              value={email}
              onChange={(e) =>
                setEmail(
                  e.target.value
                )
              }
              placeholder="tu@email.com"
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

          </div>

          <div>

            <label className="mb-2 block font-bold text-slate-900">
              Contraseña
            </label>

            <input
              type="password"
              required
              autoComplete="current-password"
              value={password}
              onChange={(e) =>
                setPassword(
                  e.target.value
                )
              }
              placeholder="Tu contraseña"
              className="w-full rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none transition focus:border-blue-600 focus:ring-2 focus:ring-blue-100"
            />

            <div className="mt-3 text-right">

              <button
                type="button"
                onClick={
                  recuperarContrasena
                }
                disabled={
                  recuperando
                }
                className="text-sm font-bold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {recuperando
                  ? "Enviando correo..."
                  : "¿Olvidaste tu contraseña?"}
              </button>

            </div>

          </div>

          {error && (
            <div className="rounded-xl border border-red-300 bg-red-50 p-4 text-sm font-medium text-red-700">
              {error}
            </div>
          )}

          {mensaje && (
            <div className="rounded-xl border border-green-300 bg-green-50 p-4 text-sm font-medium text-green-700">
              {mensaje}
            </div>
          )}

          <button
            type="submit"
            disabled={
              cargando ||
              recuperando
            }
            className="w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {cargando
              ? "Entrando..."
              : "Iniciar sesión"}
          </button>

          <div className="border-t border-slate-200 pt-6">

            <p className="text-center text-slate-600">
              ¿Todavía no tienes cuenta?{" "}

              <a
                href="/registro-profesional"
                className="font-bold text-blue-700 hover:underline"
              >
                Regístrate como profesional
              </a>

            </p>

          </div>

        </form>

      </div>

    </main>
  );
}