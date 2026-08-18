"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import {
  useParams,
  useRouter,
  useSearchParams,
} from "next/navigation";

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

type Review = {
  id: string;
  rating: number;
  comment: string | null;
  created_at: string;
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
    other: "Otros servicios",
  };

  if (!trade) {
    return "Profesional";
  }

  return oficios[trade] || trade;
}

function formatearFecha(fecha: string) {
  return new Intl.DateTimeFormat("es-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  }).format(new Date(fecha));
}

export default function PerfilProfesional() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const searchParams = useSearchParams();

  const id = params.id;

  const returnTo =
    searchParams.get("returnTo");

  const [profesional, setProfesional] =
    useState<Profesional | null>(null);

  const [reviews, setReviews] =
    useState<Review[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [error, setError] =
    useState("");

  useEffect(() => {
    if (id) {
      cargarProfesional();
    }
  }, [id]);

  function destinoRegresoSeguro() {
    if (
      returnTo &&
      returnTo.startsWith("/") &&
      !returnTo.startsWith("//")
    ) {
      return returnTo;
    }

    return "/profesionales";
  }

  function volver() {
    router.push(
      destinoRegresoSeguro()
    );
  }

  async function cargarProfesional() {
    setLoading(true);
    setError("");

    const {
      data,
      error: profesionalError,
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
      .eq("user_id", id)
      .eq(
        "verification_status",
        "verified"
      )
      .eq("verified", true)
      .eq("active", true)
      .maybeSingle();

    if (profesionalError) {
      setError(
        `No se pudo cargar el profesional: ${profesionalError.message}`
      );

      setLoading(false);
      return;
    }

    if (!data) {
      setError(
        "Este profesional no existe, no está disponible o todavía no está verificado."
      );

      setLoading(false);
      return;
    }

    setProfesional(data);

    const {
      data: reviewsData,
      error: reviewsError,
    } = await supabase
      .from("reviews")
      .select(`
        id,
        rating,
        comment,
        created_at
      `)
      .eq(
        "reviewee_id",
        id
      )
      .order(
        "created_at",
        {
          ascending: false,
        }
      );

    if (reviewsError) {
      console.error(
        "Error cargando reseñas:",
        reviewsError
      );

      setReviews([]);
    } else {
      setReviews(
        reviewsData || []
      );
    }

    setLoading(false);
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            Cargando profesional...
          </p>
        </div>
      </main>
    );
  }

  if (error || !profesional) {
    return (
      <main className="min-h-screen bg-slate-100 flex items-center justify-center px-4">

        <div className="w-full max-w-xl rounded-3xl border border-slate-200 bg-white p-9 text-center shadow-xl">

          <div className="text-5xl">
            👷
          </div>

          <h1 className="mt-5 text-3xl font-extrabold text-slate-900">
            Profesional no disponible
          </h1>

          <p className="mt-3 text-slate-600">
            {error}
          </p>

          <button
            type="button"
            onClick={volver}
            className="mt-7 rounded-xl bg-blue-700 px-6 py-3 font-extrabold text-white hover:bg-blue-800"
          >
            {returnTo
              ? "Volver a la oferta"
              : "Volver a profesionales"}
          </button>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">

      <div className="mx-auto max-w-4xl">

        {/* VOLVER ARRIBA */}

        <button
          type="button"
          onClick={volver}
          className="mb-5 font-bold text-blue-700 hover:underline"
        >
          ←{" "}
          {returnTo
            ? "Volver a la oferta"
            : "Volver a profesionales"}
        </button>

        <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-blue-700 p-8 text-white md:p-10">

            <div className="flex flex-col gap-6 sm:flex-row sm:items-center">

              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-3xl bg-white/15 text-5xl">
                👷
              </div>

              <div className="flex-1">

                <div className="mb-3">
                  <span className="rounded-full bg-green-100 px-4 py-2 text-sm font-extrabold text-green-800">
                    ✓ Profesional verificado
                  </span>
                </div>

                <h1 className="text-3xl font-extrabold md:text-4xl">
                  {profesional.business_name ||
                    "Profesional RELYDO"}
                </h1>

                <p className="mt-2 text-xl font-semibold text-blue-100">
                  {nombreOficio(
                    profesional.trade
                  )}
                </p>

              </div>

            </div>

          </div>

          {/* CONTENIDO */}

          <div className="p-7 md:p-10">

            {/* DATOS */}

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Calificación
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  ⭐{" "}
                  {Number(
                    profesional.average_rating ??
                      0
                  ).toFixed(1)}
                </p>

                <p className="mt-1 text-sm text-slate-500">
                  {reviews.length}{" "}
                  {reviews.length === 1
                    ? "reseña"
                    : "reseñas"}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Trabajos realizados
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {profesional.completed_jobs ??
                    0}
                </p>

              </div>

              <div className="rounded-2xl bg-slate-50 p-5">

                <p className="text-sm text-slate-500">
                  Experiencia
                </p>

                <p className="mt-1 text-2xl font-extrabold text-slate-900">
                  {profesional.years_experience ??
                    0}{" "}
                  años
                </p>

              </div>

            </div>

            {/* SOBRE */}

            <section className="mt-9">

              <h2 className="text-2xl font-extrabold text-slate-900">
                Sobre este profesional
              </h2>

              <p className="mt-3 whitespace-pre-wrap leading-7 text-slate-600">
                {profesional.bio ||
                  "Este profesional todavía no ha añadido una descripción."}
              </p>

            </section>

            {/* INFORMACIÓN */}

            <section className="mt-9">

              <h2 className="text-2xl font-extrabold text-slate-900">
                Información profesional
              </h2>

              <div className="mt-5 grid gap-4 sm:grid-cols-2">

                <div className="rounded-2xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Especialidad
                  </p>

                  <p className="mt-1 font-extrabold text-slate-900">
                    {nombreOficio(
                      profesional.trade
                    )}
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Radio de servicio
                  </p>

                  <p className="mt-1 font-extrabold text-slate-900">
                    {profesional.service_radius_miles ??
                      0}{" "}
                    millas
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Estado
                  </p>

                  <p className="mt-1 font-extrabold text-green-700">
                    Verificado por RELYDO
                  </p>

                </div>

                <div className="rounded-2xl border border-slate-200 p-5">

                  <p className="text-sm text-slate-500">
                    Cuenta
                  </p>

                  <p className="mt-1 font-extrabold text-green-700">
                    Activa
                  </p>

                </div>

              </div>

            </section>

            {/* RESEÑAS */}

            <section className="mt-10 border-t border-slate-200 pt-8">

              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <h2 className="text-2xl font-extrabold text-slate-900">
                    Reseñas de clientes
                  </h2>

                  <p className="mt-2 text-slate-600">
                    Opiniones de clientes que contrataron a este profesional.
                  </p>

                </div>

                {reviews.length > 0 && (
                  <div className="w-fit rounded-2xl bg-yellow-50 px-5 py-3">

                    <p className="text-sm font-bold text-yellow-700">
                      Promedio
                    </p>

                    <p className="text-xl font-extrabold text-yellow-900">
                      ⭐{" "}
                      {Number(
                        profesional.average_rating ??
                          0
                      ).toFixed(1)}
                    </p>

                  </div>
                )}

              </div>

              {reviews.length === 0 ? (
                <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-7 text-center">

                  <div className="text-4xl">
                    ⭐
                  </div>

                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    Todavía no hay reseñas
                  </h3>

                  <p className="mt-2 text-slate-600">
                    Las reseñas aparecerán después de trabajos completados.
                  </p>

                </div>
              ) : (
                <div className="mt-6 space-y-4">

                  {reviews.map(
                    (review) => (
                      <article
                        key={review.id}
                        className="rounded-2xl border border-slate-200 bg-white p-6"
                      >

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">

                          <div className="flex gap-1 text-2xl">

                            {[1, 2, 3, 4, 5].map(
                              (estrella) => (
                                <span
                                  key={
                                    estrella
                                  }
                                  className={
                                    estrella <=
                                    review.rating
                                      ? "text-yellow-400"
                                      : "text-slate-300"
                                  }
                                >
                                  ★
                                </span>
                              )
                            )}

                          </div>

                          <p className="text-sm text-slate-500">
                            {formatearFecha(
                              review.created_at
                            )}
                          </p>

                        </div>

                        {review.comment ? (
                          <p className="mt-4 whitespace-pre-wrap leading-7 text-slate-700">
                            {review.comment}
                          </p>
                        ) : (
                          <p className="mt-4 italic text-slate-500">
                            El cliente no dejó comentario.
                          </p>
                        )}

                        <div className="mt-4 border-t border-slate-100 pt-4">

                          <span className="text-sm font-bold text-green-700">
                            ✓ Servicio realizado mediante RELYDO
                          </span>

                        </div>

                      </article>
                    )
                  )}

                </div>
              )}

            </section>

            {/* AVISO */}

            <div className="mt-9 rounded-2xl border border-green-200 bg-green-50 p-5">

              <h3 className="font-extrabold text-green-900">
                ✓ Cuenta verificada por RELYDO
              </h3>

              <p className="mt-2 text-sm leading-6 text-green-800">
                Este profesional completó el proceso de verificación requerido por RELYDO.
              </p>

            </div>

            {/* SOLICITAR */}

            <section className="mt-10 border-t border-slate-200 pt-8">

              <h2 className="text-2xl font-extrabold text-slate-900">
                ¿Necesitas este servicio?
              </h2>

              <p className="mt-2 text-slate-600">
                Describe el trabajo que necesitas para iniciar una solicitud.
              </p>

              <button
                type="button"
                onClick={() =>
                  router.push(
                    `/solicitar-trabajo?profesional=${profesional.user_id}`
                  )
                }
                className="mt-6 w-full rounded-xl bg-blue-700 py-4 text-lg font-extrabold text-white transition hover:bg-blue-800"
              >
                Solicitar trabajo
              </button>

            </section>

            {/* VOLVER ABAJO */}

            <div className="mt-7 text-center">

              <button
                type="button"
                onClick={volver}
                className="font-bold text-blue-700 hover:underline"
              >
                ←{" "}
                {returnTo
                  ? "Volver a la oferta"
                  : "Volver a profesionales"}
              </button>

            </div>

          </div>

        </div>

      </div>

    </main>
  );
}