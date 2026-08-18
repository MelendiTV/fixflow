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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

function LoginClienteContenido() {
  const router = useRouter();
  const searchParams = useSearchParams();

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

  /*
    DESTINO SEGURO

    Solo permitimos rutas internas.
    Por ejemplo:

    /mis-solicitudes
    /solicitar-trabajo
    /mis-solicitudes/ID

    No permitimos:
    https://otro-sitio.com
    //otro-sitio.com
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
          "No se pudo identificar el usuario."
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
          "No se encontró el perfil de esta cuenta."
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
          "Esta cuenta no está registrada como cliente."
        );
      }

      /*
        4. DESTINO DESPUÉS DEL LOGIN

        Si el cliente vino desde otra página,
        regresamos allí.

        Si abrió el login normalmente:
        /mis-solicitudes
      */

      const destino =
        obtenerDestinoSeguro();

      /*
        IMPORTANTE

        Usamos navegación completa del navegador
        en lugar de:

        router.replace(...)
        router.refresh()

        para evitar que Next.js se quede
        trabado en "Rendering..."
      */

      window.location.href =
        destino;
    } catch (err) {
      console.error(
        "Error iniciando sesión del cliente:",
        err
      );

      setError(
        err instanceof Error
          ? `No se pudo iniciar sesión: ${err.message}`
          : "Ocurrió un error inesperado."
      );

      setLoading(false);
    }
  }

  /*
    IR A REGISTRO

    Conservamos el redirect para que,
    después del registro,
    pueda continuar donde estaba.
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
          ← Volver al inicio
        </button>

        <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 p-8 text-white">

            <div className="text-2xl font-black">
              RELYDO
            </div>

            <h1 className="mt-2 text-3xl font-extrabold">
              Iniciar sesión
            </h1>

            <p className="mt-2 text-blue-100">
              Accede a tus solicitudes y trabajos.
            </p>

          </div>

          {/* CONTENIDO */}

          <div className="p-8">

            {/* AVISO DE REDIRECCIÓN */}

            {redirectParam && (
              <div className="mb-6 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                Inicia sesión para continuar.
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
                  Email
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
                  Contraseña
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
                  placeholder="Tu contraseña"
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
                  ? "Iniciando sesión..."
                  : "Iniciar sesión"}
              </button>

            </form>

            {/* REGISTRO */}

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">

              <p className="text-sm text-slate-600">
                ¿No tienes una cuenta?
              </p>

              <button
                type="button"
                onClick={irARegistro}
                disabled={loading}
                className="mt-2 font-bold text-blue-700 hover:underline disabled:cursor-not-allowed disabled:opacity-50"
              >
                Regístrate como cliente
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}

export default function LoginClientePage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen items-center justify-center bg-slate-100">

          <div className="rounded-2xl bg-white px-8 py-7 shadow-lg">

            <p className="font-bold text-slate-700">
              Cargando...
            </p>

          </div>

        </main>
      }
    >
      <LoginClienteContenido />
    </Suspense>
  );
}