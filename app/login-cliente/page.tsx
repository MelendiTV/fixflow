"use client";

import {
  Suspense,
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

function LoginClienteContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { language } = useLanguage();

  const redirectParam =
    searchParams.get("redirect");

  const [email, setEmail] =
    useState("");

  const [password, setPassword] =
    useState("");

  const [loading, setLoading] =
    useState(false);

  const [error, setError] =
    useState("");

  const text =
    language === "es"
      ? {
          volverInicio: "Volver al inicio",
          iniciarSesion: "Iniciar sesión",
          descripcion:
            "Accede a tus solicitudes y trabajos.",
          continuar:
            "Inicia sesión para continuar.",
          email: "Email",
          password: "Contraseña",
          passwordPlaceholder:
            "Tu contraseña",
          iniciando:
            "Iniciando sesión...",
          noCuenta:
            "¿No tienes una cuenta?",
          registrate:
            "Regístrate como cliente",
          cargando: "Cargando...",

          errorUsuario:
            "No se pudo identificar el usuario.",
          errorPerfil:
            "No se encontró el perfil de esta cuenta.",
          errorRol:
            "Esta cuenta no está registrada como cliente.",
          errorLogin:
            "No se pudo iniciar sesión",
          errorInesperado:
            "Ocurrió un error inesperado.",
        }
      : {
          volverInicio: "Back to home",
          iniciarSesion: "Sign in",
          descripcion:
            "Access your requests and jobs.",
          continuar:
            "Sign in to continue.",
          email: "Email",
          password: "Password",
          passwordPlaceholder:
            "Your password",
          iniciando:
            "Signing in...",
          noCuenta:
            "Don't have an account?",
          registrate:
            "Register as a customer",
          cargando: "Loading...",

          errorUsuario:
            "Unable to identify the user.",
          errorPerfil:
            "No profile was found for this account.",
          errorRol:
            "This account is not registered as a customer.",
          errorLogin:
            "Unable to sign in",
          errorInesperado:
            "An unexpected error occurred.",
        };

  /*
    DESTINO SEGURO

    Solo permitimos rutas internas.
  */

  function obtenerDestinoSeguro() {
    if (
      redirectParam &&
      redirectParam.startsWith("/") &&
      !redirectParam.startsWith("//")
    ) {
      return redirectParam;
    }

    return "/mis-solicitudes";
  }

  /*
    INICIAR SESIÓN
  */

  async function iniciarSesion(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (loading) {
      return;
    }

    setLoading(true);
    setError("");

    try {
      /*
        1. LOGIN EN SUPABASE
      */

      const {
        data,
        error: loginError,
      } =
        await supabase.auth.signInWithPassword({
          email:
            email
              .trim()
              .toLowerCase(),

          password,
        });

      if (loginError) {
        throw new Error(
          loginError.message
        );
      }

      const user =
        data.user;

      if (!user) {
        throw new Error(
          text.errorUsuario
        );
      }

      /*
        2. COMPROBAR PERFIL
      */

      const {
        data: profile,
        error: profileError,
      } = await supabase
        .from("profiles")
        .select(`
          id,
          role
        `)
        .eq(
          "id",
          user.id
        )
        .maybeSingle();

      if (
        profileError ||
        !profile
      ) {
        await supabase.auth.signOut();

        throw new Error(
          text.errorPerfil
        );
      }

      /*
        3. SOLO CLIENTES
      */

      if (
        profile.role !==
        "customer"
      ) {
        await supabase.auth.signOut();

        throw new Error(
          text.errorRol
        );
      }

      /*
        4. DESTINO DESPUÉS DEL LOGIN
      */

      const destino =
        obtenerDestinoSeguro();

      window.location.href =
        destino;
    } catch (err) {
      console.error(
        "Error iniciando sesión del cliente:",
        err
      );

      setError(
        err instanceof Error
          ? `${text.errorLogin}: ${err.message}`
          : text.errorInesperado
      );

      setLoading(false);
    }
  }

  /*
    IR A REGISTRO
  */

  function irARegistro() {
    const destino =
      obtenerDestinoSeguro();

    router.push(
      `/registro-cliente?redirect=${encodeURIComponent(
        destino
      )}`
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto w-full max-w-md">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() =>
            router.push("/")
          }
          className="font-bold text-blue-700 hover:underline"
        >
          ← {text.volverInicio}
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 p-8 text-white">
            <div className="text-2xl font-black">
              RELYDO
            </div>

            <h1 className="mt-2 text-3xl font-extrabold">
              {text.iniciarSesion}
            </h1>

            <p className="mt-2 text-blue-100">
              {text.descripcion}
            </p>
          </div>

          {/* CONTENIDO */}

          <div className="p-8">

            {/* AVISO DE REDIRECCIÓN */}

            {redirectParam && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                {text.continuar}
              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 text-red-700">
                {error}
              </div>
            )}

            {/* FORMULARIO */}

            <form
              onSubmit={iniciarSesion}
              className="space-y-5"
            >

              {/* EMAIL */}

              <div>
                <label
                  htmlFor="email"
                  className="mb-2 block font-bold text-slate-900"
                >
                  {text.email}
                </label>

                <input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) =>
                    setEmail(
                      e.target.value
                    )
                  }
                  required
                  disabled={loading}
                  autoComplete="email"
                  placeholder="cliente@email.com"
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* CONTRASEÑA */}

              <div>
                <label
                  htmlFor="password"
                  className="mb-2 block font-bold text-slate-900"
                >
                  {text.password}
                </label>

                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) =>
                    setPassword(
                      e.target.value
                    )
                  }
                  required
                  disabled={loading}
                  autoComplete="current-password"
                  placeholder={
                    text.passwordPlaceholder
                  }
                  className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100 disabled:cursor-not-allowed disabled:bg-slate-100"
                />
              </div>

              {/* BOTÓN LOGIN */}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading
                  ? text.iniciando
                  : text.iniciarSesion}
              </button>
            </form>

            {/* REGISTRO */}

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">
              <p className="text-sm text-slate-600">
                {text.noCuenta}
              </p>

              <button
                type="button"
                onClick={irARegistro}
                disabled={loading}
                className="mt-2 font-bold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                {text.registrate}
              </button>
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}

function LoginClienteFallback() {
  const { language } = useLanguage();

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

export default function LoginClientePage() {
  return (
    <Suspense
      fallback={
        <LoginClienteFallback />
      }
    >
      <LoginClienteContenido />
    </Suspense>
  );
}