"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

export default function CompletarPerfilProfesional() {
  const router = useRouter();

  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState("");
  const [mensaje, setMensaje] = useState("");

  useEffect(() => {
    completarPerfil();
  }, []);

  async function completarPerfil() {
    setCargando(true);
    setError("");
    setMensaje("");

    try {
      /*
        USUARIO AUTENTICADO
      */

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login-profesional");
        return;
      }

      /*
        DATOS GUARDADOS DURANTE
        EL REGISTRO PROFESIONAL
      */

      const metadata =
        user.user_metadata || {};

      if (
        metadata.signup_type !== "provider"
      ) {
        throw new Error(
          "Esta cuenta no contiene información de registro profesional."
        );
      }

      const legalName = String(
        metadata.legal_name || ""
      ).trim();

      const businessName = String(
        metadata.business_name || ""
      ).trim();

      const phone = String(
        metadata.phone || ""
      ).trim();

      const trade = String(
        metadata.trade || ""
      ).trim();

      const bio = String(
        metadata.bio || ""
      ).trim();

      const yearsExperience =
        Number(
          metadata.years_experience ?? 0
        );

      const serviceRadiusMiles =
        Number(
          metadata.service_radius_miles ??
            25
        );

      const city = String(
        metadata.city || ""
      ).trim();

      const state = String(
        metadata.state || ""
      )
        .trim()
        .toUpperCase();

      const zipCode = String(
        metadata.zip_code || ""
      ).trim();

      const licenseRequired =
        metadata.license_required === true;

      const licenseNumber =
        metadata.license_number
          ? String(
              metadata.license_number
            ).trim()
          : null;

      const licenseState =
        metadata.license_state
          ? String(
              metadata.license_state
            )
              .trim()
              .toUpperCase()
          : null;

      const licenseExpiration =
        metadata.license_expiration
          ? String(
              metadata.license_expiration
            )
          : null;

      const insured =
        metadata.insured === true;

      const insuranceCompany =
        metadata.insurance_company
          ? String(
              metadata.insurance_company
            ).trim()
          : null;

      const insuranceExpiration =
        metadata.insurance_expiration
          ? String(
              metadata.insurance_expiration
            )
          : null;

      const bonded =
        metadata.bonded === true;

      /*
        VALIDACIÓN
      */

      if (
        !legalName ||
        !businessName ||
        !trade
      ) {
        throw new Error(
          "Faltan datos del registro profesional. Vuelve a registrarte o contacta con FixFlow."
        );
      }

      /*
        1. CREAR / ACTUALIZAR profiles
      */

      const {
        error: profileError,
      } = await supabase
        .from("profiles")
        .upsert(
          {
            id: user.id,
            role: "provider",
            full_name: legalName,
            phone:
              phone || null,
            email:
              user.email || null,
          },
          {
            onConflict: "id",
          }
        );

      if (profileError) {
        throw new Error(
          `No se pudo crear tu cuenta profesional: ${profileError.message}`
        );
      }

      /*
        2. COMPROBAR provider_profiles
      */

      const {
        data: existingProvider,
        error:
          existingProviderError,
      } = await supabase
        .from("provider_profiles")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

      if (existingProviderError) {
        throw new Error(
          `No se pudo comprobar tu perfil profesional: ${existingProviderError.message}`
        );
      }

      /*
        3. CREAR provider_profiles
        SOLO SI NO EXISTE
      */

      if (!existingProvider) {
        const {
          error:
            providerInsertError,
        } = await supabase
          .from(
            "provider_profiles"
          )
          .insert({
            user_id: user.id,

            business_name:
              businessName,

            bio,

            trade,

            years_experience:
              yearsExperience,

            service_radius_miles:
              serviceRadiusMiles,

            city,
            state,
            zip_code: zipCode,

            license_required:
              licenseRequired,

            license_number:
              licenseNumber,

            license_state:
              licenseState,

            license_expiration:
              licenseExpiration,

            insured,

            insurance_company:
              insuranceCompany,

            insurance_expiration:
              insuranceExpiration,

            bonded,

            verification_status:
              "pending",

            verified: false,

            active: false,

            average_rating: 0,

            completed_jobs: 0,
          });

        if (
          providerInsertError
        ) {
          throw new Error(
            `No se pudo crear tu perfil profesional: ${providerInsertError.message}`
          );
        }
      }

      /*
        4. BUSCAR EL SERVICIO
        CORRESPONDIENTE AL trade

        Ejemplo:
        plumbing -> Plumbing
        painting -> Painting
        hvac -> HVAC
      */

      const {
        data: servicio,
        error: servicioError,
      } = await supabase
        .from("services")
        .select(
          "id, name, slug"
        )
        .eq("slug", trade)
        .eq("active", true)
        .maybeSingle();

      if (servicioError) {
        throw new Error(
          `No se pudo identificar tu especialidad: ${servicioError.message}`
        );
      }

      if (!servicio) {
        throw new Error(
          `No existe un servicio activo para la especialidad "${trade}".`
        );
      }

      /*
        5. COMPROBAR SI YA EXISTE
        provider_services
      */

      const {
        data: relacion,
        error: relacionError,
      } = await supabase
        .from("provider_services")
        .select(
          "provider_id, service_id"
        )
        .eq(
          "provider_id",
          user.id
        )
        .eq(
          "service_id",
          servicio.id
        )
        .maybeSingle();

      if (relacionError) {
        throw new Error(
          `No se pudo comprobar tu servicio profesional: ${relacionError.message}`
        );
      }

      /*
        6. CREAR RELACIÓN
        PROFESIONAL -> SERVICIO
      */

      if (!relacion) {
        const {
          error:
            relacionInsertError,
        } = await supabase
          .from(
            "provider_services"
          )
          .insert({
            provider_id:
              user.id,

            service_id:
              servicio.id,
          });

        if (
          relacionInsertError
        ) {
          throw new Error(
            `Tu perfil fue creado, pero no se pudo asignar la especialidad: ${relacionInsertError.message}`
          );
        }
      }

      /*
        TODO CORRECTO
      */

      setMensaje(
        `Perfil profesional creado correctamente. Especialidad asignada: ${servicio.name}.`
      );

      /*
        AHORA PASA A SUBIR
        LOS DOCUMENTOS
      */

      setTimeout(() => {
        router.replace(
          "/completar-verificacion"
        );
      }, 1500);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setCargando(false);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.replace(
      "/login-profesional"
    );
  }

  if (cargando) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

        <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">

          <div className="text-5xl">
            👷
          </div>

          <h1 className="mt-5 text-2xl font-extrabold text-slate-900">
            Preparando tu perfil
          </h1>

          <p className="mt-3 text-slate-600">
            Estamos creando tu perfil profesional y asignando tu especialidad.
          </p>

          <div className="mx-auto mt-6 h-8 w-8 animate-spin rounded-full border-4 border-blue-200 border-t-blue-700" />

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4 py-10">

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">

        {error ? (
          <>
            <div className="text-5xl">
              ⚠️
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-red-700">
              No se pudo completar el perfil
            </h1>

            <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5 text-left text-red-700">
              {error}
            </div>

            <button
              type="button"
              onClick={
                completarPerfil
              }
              className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-4 font-extrabold text-white hover:bg-blue-800"
            >
              Intentar nuevamente
            </button>

            <button
              type="button"
              onClick={
                cerrarSesion
              }
              className="mt-3 w-full rounded-xl border border-slate-300 bg-white px-6 py-3 font-bold text-slate-700 hover:bg-slate-50"
            >
              Cerrar sesión
            </button>
          </>
        ) : (
          <>
            <div className="text-5xl">
              ✅
            </div>

            <h1 className="mt-5 text-2xl font-extrabold text-green-800">
              Perfil creado
            </h1>

            <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5 text-green-800">
              {mensaje}
            </div>

            <p className="mt-4 text-slate-600">
              Ahora continuaremos con la verificación de documentos.
            </p>
          </>
        )}

      </div>

    </main>
  );
}