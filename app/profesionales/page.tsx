"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Profesional = {
  user_id: string;
  business_name: string | null;
  bio: string | null;
  trade: string | null;
  years_experience: number | null;
  service_radius_miles: number | null;
  average_rating: number | null;
  completed_jobs: number | null;
  verification_status: string | null;
  verified: boolean | null;
  active: boolean | null;
};

function nombreOficio(trade: string | null) {
  const oficios: Record<string, string> = {
    plumbing: "Plomería",
    electrical: "Electricidad",
    hvac: "HVAC / Aire acondicionado",
    carpentry: "Carpintería",
    painting: "Pintura",
    landscaping: "Jardinería",
    cleaning: "Limpieza",
    moving: "Mudanzas",
    "appliance-repair": "Reparación de electrodomésticos",
    handyman: "Handyman",
    other: "Otros servicios",
  };

  if (!trade) {
    return "Profesional";
  }

  return oficios[trade] || trade;
}

export default function ProfesionalesPage() {
  const router = useRouter();

  const [profesionales, setProfesionales] =
    useState<Profesional[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    cargarProfesionales();
  }, []);

  async function cargarProfesionales() {
    setLoading(true);
    setError("");

    const {
      data,
      error: profesionalesError,
    } = await supabase
      .from("provider_profiles")
      .select(`
        user_id,
        business_name,
        bio,
        trade,
        years_experience,
        service_radius_miles,
        average_rating,
        completed_jobs,
        verification_status,
        verified,
        active
      `)
      .eq("verification_status", "verified")
      .eq("verified", true)
      .eq("active", true)
      .order("average_rating", {
        ascending: false,
      });

    if (profesionalesError) {
      console.error(
        "Error cargando profesionales:",
        profesionalesError
      );

      setError(
        `No se pudieron cargar los profesionales: ${profesionalesError.message}`
      );

      setLoading(false);
      return;
    }

    setProfesionales(data || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">

          <p className="font-bold text-slate-700">
            Cargando profesionales...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div>

          <button
            type="button"
            onClick={() =>
              router.push("/")
            }
            className="font-bold text-blue-700 hover:underline"
          >
            ← Volver al inicio
          </button>

          <h1 className="mt-5 text-4xl font-extrabold text-slate-900">
            Profesionales
          </h1>

          <p className="mt-2 text-lg text-slate-600">
            Encuentra profesionales verificados para realizar tu trabajo.
          </p>

        </div>

        {/* ERROR */}

        {error && (
          <div className="mt-7 rounded-2xl border border-red-300 bg-red-50 p-5 text-red-700">
            {error}
          </div>
        )}

        {/* SIN PROFESIONALES */}

        {!error &&
          profesionales.length === 0 && (
            <div className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">

              <div className="text-5xl">
                👷
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                Todavía no hay profesionales disponibles
              </h2>

              <p className="mt-2 text-slate-600">
                Los profesionales aparecerán aquí cuando estén verificados y activos.
              </p>

            </div>
          )}

        {/* LISTA */}

        {profesionales.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-6 md:grid-cols-2">

            {profesionales.map(
              (profesional) => (
                <article
                  key={profesional.user_id}
                  className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
                >

                  {/* CABECERA */}

                  <div className="bg-blue-700 p-6 text-white">

                    <div className="flex items-start gap-4">

                      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-3xl">
                        👷
                      </div>

                      <div className="flex-1">

                        <span className="inline-block rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
                          ✓ Verificado
                        </span>

                        <h2 className="mt-3 text-2xl font-extrabold">
                          {profesional.business_name ||
                            "Profesional RELYDO"}
                        </h2>

                        <p className="mt-1 font-semibold text-blue-100">
                          {nombreOficio(
                            profesional.trade
                          )}
                        </p>

                      </div>

                    </div>

                  </div>

                  {/* CONTENIDO */}

                  <div className="p-6">

                    {profesional.bio && (
                      <p className="line-clamp-3 leading-7 text-slate-600">
                        {profesional.bio}
                      </p>
                    )}

                    <div className="mt-5 grid grid-cols-3 gap-3">

                      <div className="rounded-xl bg-slate-50 p-3 text-center">

                        <p className="text-xs text-slate-500">
                          Calificación
                        </p>

                        <p className="mt-1 font-extrabold text-slate-900">
                          ⭐{" "}
                          {Number(
                            profesional.average_rating ??
                              0
                          ).toFixed(1)}
                        </p>

                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-center">

                        <p className="text-xs text-slate-500">
                          Trabajos
                        </p>

                        <p className="mt-1 font-extrabold text-slate-900">
                          {profesional.completed_jobs ??
                            0}
                        </p>

                      </div>

                      <div className="rounded-xl bg-slate-50 p-3 text-center">

                        <p className="text-xs text-slate-500">
                          Experiencia
                        </p>

                        <p className="mt-1 font-extrabold text-slate-900">
                          {profesional.years_experience ??
                            0}{" "}
                          años
                        </p>

                      </div>

                    </div>

                    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/profesionales/${profesional.user_id}`
                          )
                        }
                        className="rounded-xl border-2 border-blue-700 px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
                      >
                        Ver perfil
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/solicitar-trabajo?profesional=${profesional.user_id}`
                          )
                        }
                        className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white hover:bg-blue-800"
                      >
                        Solicitar trabajo
                      </button>

                    </div>

                  </div>

                </article>
              )
            )}

          </div>
        )}

      </div>

    </main>
  );
}
