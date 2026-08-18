"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NotificationsBell from "@/app/components/NotificationsBell";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type ProviderProfile = {
  user_id: string;
  business_name: string | null;
  company_logo_url: string | null;
  bio: string | null;
  trade: string | null;
  years_experience: number | null;
  service_radius_miles: number | null;
  license_required: boolean | null;
  license_number: string | null;
  license_state: string | null;
  license_expiration: string | null;
  insured: boolean | null;
  insurance_company: string | null;
  insurance_expiration: string | null;
  bonded: boolean | null;
  verification_status: string | null;
  verified: boolean | null;
  active: boolean | null;
  average_rating: number | null;
  completed_jobs: number | null;
};

type TrabajoContratado = {
  id: string;
  title: string;
  description: string;
  city: string;
  state: string;
  zip_code: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  job_stage: string | null;
  customer_name: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
  created_at: string;
};

type OfertaAceptada = {
  request_id: string;
  price: number;
  arrival_minutes: number | null;
  estimated_job_minutes: number | null;
  message: string | null;
  status: string;
};

type PagoProfesional = {
  request_id: string;
  job_amount: number;
  provider_commission_percent: number;
  provider_commission_amount: number;
  provider_net_amount: number;
  platform_revenue_amount: number;
  currency: string;
  status: string;
};

type TrabajoConOferta = TrabajoContratado & {
  oferta: OfertaAceptada | null;
  pago: PagoProfesional | null;
};

type ReclamoProfesional = {
  id: string;
  request_id: string;
  provider_id: string;
  reason: string | null;
  description: string | null;
  status: string;
  resolution_notes: string | null;
  created_at: string;
};

function nombreOficio(trade: string | null) {
  const nombres: Record<string, string> = {
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

  if (!trade) return "No indicada";
  return nombres[trade] || trade;
}

function nombreEtapa(etapa: string | null, status: string) {
  if (status === "completed") return "Completado";
  if (status === "cancelled") return "Cancelado";
  if (etapa === "on_the_way") return "En camino";
  if (etapa === "arrived") return "Ya llegó";
  if (etapa === "working") return "Trabajo iniciado";
  return "Contratado";
}

function estiloEtapa(etapa: string | null, status: string) {
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "cancelled") return "bg-red-100 text-red-800";
  if (etapa === "working") return "bg-amber-100 text-amber-800";
  if (etapa === "arrived") return "bg-purple-100 text-purple-800";
  if (etapa === "on_the_way") return "bg-blue-100 text-blue-800";
  return "bg-green-100 text-green-800";
}

function mostrarMinutos(minutos: number | null) {
  if (minutos === null || minutos === undefined) return "No indicado";
  if (minutos < 60) return `${minutos} min`;

  const horas = Math.floor(minutos / 60);
  const restantes = minutos % 60;

  if (restantes === 0) {
    return `${horas} ${horas === 1 ? "hora" : "horas"}`;
  }

  return `${horas} h ${restantes} min`;
}

function formatearFecha(fecha: string | null) {
  if (!fecha) return "No disponible";

  return new Intl.DateTimeFormat("es-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(fecha));
}

export default function PanelProfesional() {
  const router = useRouter();
  const logoInputRef = useRef<HTMLInputElement | null>(null);

  const [profile, setProfile] = useState<ProviderProfile | null>(null);
  const [email, setEmail] = useState("");
  const [trabajosContratados, setTrabajosContratados] = useState<TrabajoConOferta[]>([]);
  const [reclamos, setReclamos] = useState<ReclamoProfesional[]>([]);
  const [loading, setLoading] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [subiendoLogo, setSubiendoLogo] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let mounted = true;

    cargarPanel();

    const channel = supabase
      .channel("panel-profesional-service-requests")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
        },
        async (payload) => {
          console.log("Cambio detectado en service_requests:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "payments",
        },
        async (payload) => {
          console.log("Cambio detectado en payments:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "job_claims",
        },
        async (payload) => {
          console.log("Cambio detectado en job_claims:", payload);

          if (mounted) {
            await cargarPanel(false);
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime panel profesional:", status);
      });

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
    };
  }, []);

  async function cargarPanel(mostrarCarga = true) {
    if (mostrarCarga) {
      setLoading(true);
    } else {
      setActualizando(true);
    }

    setError("");

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        router.replace("/login-profesional");
        return;
      }

      setEmail(user.email || "");

      const { data: baseProfile, error: baseProfileError } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (baseProfileError || !baseProfile) {
        throw new Error("No se encontró tu cuenta en RELYDO.");
      }

      if (baseProfile.role === "admin") {
        router.replace("/admin");
        return;
      }

      if (baseProfile.role !== "provider") {
        await supabase.auth.signOut();
        router.replace("/login-profesional");
        return;
      }

      const { data: providerProfile, error: profileError } = await supabase
        .from("provider_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (profileError) {
        throw new Error(
          `No se pudo cargar tu perfil profesional: ${profileError.message}`
        );
      }

      if (!providerProfile) {
        router.replace("/completar-perfil-profesional");
        return;
      }

      setProfile(providerProfile as ProviderProfile);

      const estaVerificado =
        providerProfile.verification_status === "verified" &&
        providerProfile.verified === true &&
        providerProfile.active === true;

      if (!estaVerificado) {
        setTrabajosContratados([]);
        setReclamos([]);
        return;
      }

      const { data: reclamosData, error: reclamosError } = await supabase
        .from("job_claims")
        .select(`
          id,
          request_id,
          provider_id,
          reason,
          description,
          status,
          resolution_notes,
          created_at
        `)
        .eq("provider_id", user.id)
        .order("created_at", { ascending: false });

      if (reclamosError) {
        console.error("Error cargando reclamos del profesional:", reclamosError);
        setReclamos([]);
      } else {
        setReclamos((reclamosData || []) as ReclamoProfesional[]);
      }

      const { data: trabajosData, error: trabajosError } = await supabase
        .from("service_requests")
        .select(`
          id,
          title,
          description,
          city,
          state,
          zip_code,
          preferred_date,
          preferred_time,
          status,
          job_stage,
          customer_name,
          cancellation_reason,
          cancelled_at,
          created_at
        `)
        .eq("preferred_provider_id", user.id)
        .in("status", ["in_progress", "completed", "cancelled"])
        .order("created_at", { ascending: false });

      if (trabajosError) {
        throw new Error(
          `No se pudieron cargar tus trabajos: ${trabajosError.message}`
        );
      }

      const trabajosBase = (trabajosData || []) as TrabajoContratado[];

      if (trabajosBase.length === 0) {
        setTrabajosContratados([]);
        return;
      }

      const requestIds = trabajosBase.map((trabajo) => trabajo.id);

      const { data: ofertasData, error: ofertasError } = await supabase
        .from("offers")
        .select(`
          request_id,
          price,
          arrival_minutes,
          estimated_job_minutes,
          message,
          status
        `)
        .eq("professional_id", user.id)
        .in("request_id", requestIds);

      if (ofertasError) {
        console.error("Error cargando presupuestos:", ofertasError);
      }

      const ofertas = (ofertasData || []) as OfertaAceptada[];

      const { data: pagosData, error: pagosError } = await supabase
        .from("payments")
        .select(`
          request_id,
          job_amount,
          provider_commission_percent,
          provider_commission_amount,
          provider_net_amount,
          platform_revenue_amount,
          currency,
          status
        `)
        .eq("provider_id", user.id)
        .in("request_id", requestIds);

      if (pagosError) {
        console.error("Error cargando pagos del profesional:", pagosError);
      }

      const pagos = (pagosData || []) as PagoProfesional[];

      const combinados = trabajosBase.map((trabajo) => ({
        ...trabajo,
        oferta:
          ofertas.find((oferta) => oferta.request_id === trabajo.id) || null,
        pago:
          pagos.find((pago) => pago.request_id === trabajo.id) || null,
      }));

      setTrabajosContratados(combinados);
    } catch (err) {
      console.error("Error cargando panel:", err);

      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      if (mostrarCarga) {
        setLoading(false);
      }

      setActualizando(false);
    }
  }

  async function subirLogo(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !profile) return;

    setError("");

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      setError("El logo debe ser JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("El logo no puede superar 5 MB.");
      event.target.value = "";
      return;
    }

    setSubiendoLogo(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Tu sesión ya no está disponible.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "png";
      const ruta = `${user.id}/company-logo-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("provider-logos")
        .upload(ruta, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`No se pudo subir el logo: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("provider-logos").getPublicUrl(ruta);

      const { error: updateError } = await supabase
        .from("provider_profiles")
        .update({
          company_logo_url: publicUrl,
        })
        .eq("user_id", user.id);

      if (updateError) {
        throw new Error(
          `El logo subió, pero no se pudo guardar en el perfil: ${updateError.message}`
        );
      }

      setProfile((actual) =>
        actual
          ? {
              ...actual,
              company_logo_url: publicUrl,
            }
          : actual
      );
    } catch (err) {
      console.error("Error subiendo logo:", err);
      setError(
        err instanceof Error ? err.message : "No se pudo subir el logo."
      );
    } finally {
      setSubiendoLogo(false);
      event.target.value = "";
    }
  }

  function irASeccion(id: string) {
    window.setTimeout(() => {
      document.getElementById(id)?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/login-profesional";
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            Cargando panel profesional...
          </p>
        </div>
      </main>
    );
  }

  if (error && !profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 shadow-xl">
          <h1 className="text-2xl font-extrabold text-red-700">
            No se pudo cargar el panel
          </h1>

          <p className="mt-4 text-slate-700">{error}</p>

          <button
            type="button"
            onClick={cerrarSesion}
            className="mt-6 w-full rounded-xl bg-slate-900 px-5 py-3 font-bold text-white hover:bg-slate-700"
          >
            Cerrar sesión
          </button>
        </div>
      </main>
    );
  }

  if (!profile) return null;

  const estaRechazado = profile.verification_status === "rejected";

  const estaSuspendido =
    profile.verification_status === "verified" &&
    profile.verified === true &&
    profile.active !== true;

  const estaVerificado =
    !estaRechazado &&
    profile.verification_status === "verified" &&
    profile.verified === true &&
    profile.active === true;

  function obtenerEstado() {
    if (estaRechazado) {
      return {
        titulo: "Verificación rechazada",
        descripcion:
          "Tu verificación necesita correcciones. Revisa o vuelve a enviar tus documentos.",
        estilo: "border-red-300 bg-red-50 text-red-900",
        badge: "bg-red-100 text-red-800",
        textoBadge: "Rechazado",
      };
    }

    if (estaSuspendido) {
      return {
        titulo: "Cuenta suspendida",
        descripcion:
          "Tu cuenta profesional está temporalmente suspendida. No puedes acceder a nuevos trabajos mientras permanezca suspendida.",
        estilo: "border-red-300 bg-red-50 text-red-900",
        badge: "bg-red-100 text-red-800",
        textoBadge: "Suspendido",
      };
    }

    if (estaVerificado) {
      return {
        titulo: "Verificado ✅",
        descripcion: "Tu cuenta ha sido revisada y aprobada por RELYDO.",
        estilo: "border-green-300 bg-green-50 text-green-900",
        badge: "bg-green-100 text-green-800",
        textoBadge: "Verificado",
      };
    }

    return {
      titulo: "Pendiente de verificación",
      descripcion: "Tu cuenta todavía está pendiente de revisión.",
      estilo: "border-amber-300 bg-amber-50 text-amber-900",
      badge: "bg-amber-100 text-amber-800",
      textoBadge: "Pendiente",
    };
  }

  const estado = obtenerEstado();

  const trabajosActivos = trabajosContratados.filter(
    (trabajo) => trabajo.status === "in_progress"
  );

  const trabajosCompletados = trabajosContratados.filter(
    (trabajo) => trabajo.status === "completed"
  );

  const trabajosCancelados = trabajosContratados.filter(
    (trabajo) => trabajo.status === "cancelled"
  );

  const reclamosActivos = reclamos.filter(
    (reclamo) =>
      reclamo.status === "open" ||
      reclamo.status === "reviewing" ||
      reclamo.status === "in_review"
  );

  const totalHistorial =
    trabajosActivos.length +
    trabajosCompletados.length +
    trabajosCancelados.length;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <section className="relative z-30 overflow-visible rounded-[32px] border border-blue-500/20 bg-gradient-to-br from-blue-700 via-blue-700 to-indigo-700 text-white shadow-xl shadow-blue-900/10">
          <div className="relative px-7 py-8 md:px-10 md:py-10">
            <div className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-24 left-10 h-52 w-52 rounded-full bg-cyan-300/10 blur-3xl" />

            <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
              <div className="max-w-2xl">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-black uppercase tracking-[0.16em] text-blue-100">
                  <span className="h-2 w-2 rounded-full bg-emerald-300" />
                  Panel profesional
                </div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-lg">
                    {profile.company_logo_url ? (
                      <img
                        src={profile.company_logo_url}
                        alt={`Logo de ${profile.business_name || "la compañía"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                        {(profile.business_name || "F").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1.5 text-[10px] font-black uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      {subiendoLogo ? "Subiendo..." : "Cambiar logo"}
                    </button>
                  </div>

                  <input
                    ref={logoInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={subirLogo}
                    className="hidden"
                  />

                  <div>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      {profile.business_name || "Profesional RELYDO"}
                    </h1>

                    <button
                      type="button"
                      disabled={subiendoLogo}
                      onClick={() => logoInputRef.current?.click()}
                      className="mt-2 text-sm font-bold text-blue-100 underline decoration-white/40 underline-offset-4 transition hover:text-white disabled:opacity-60"
                    >
                      {subiendoLogo
                        ? "Subiendo logo..."
                        : profile.company_logo_url
                        ? "Cambiar imagen de la compañía"
                        : "Añadir imagen de la compañía"}
                    </button>
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
                  Administra tus oportunidades, trabajos activos, reputación y estado de cuenta desde un solo lugar.
                </p>

                <div className="mt-5 flex flex-wrap gap-2">
                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    {nombreOficio(profile.trade)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    ⭐ {Number(profile.average_rating || 0).toFixed(1)}
                  </span>

                  <span className="rounded-full bg-white/10 px-3 py-1.5 text-sm font-bold text-white">
                    {profile.completed_jobs ?? 0} trabajos completados
                  </span>
                </div>
              </div>

              <div className="relative z-[100] flex items-start gap-3 md:items-center">
                <div className="relative z-[110]">
                  <NotificationsBell modo="profesional" />
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-200">
                    Cuenta
                  </p>
                  <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-white">
                    {email}
                  </p>

                  <button
                    type="button"
                    onClick={cerrarSesion}
                    className="mt-3 w-full rounded-xl border border-white/20 bg-white/10 px-4 py-2.5 text-sm font-black text-white transition hover:bg-white/20"
                  >
                    Cerrar sesión
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* RESUMEN */}

        <section className="relative z-10 mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Resumen
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Tu actividad en RELYDO
              </h2>

              <p className="mt-2 text-slate-600">
                Una vista rápida de tus trabajos y reputación.
              </p>
            </div>

            <button
              type="button"
              onClick={() => cargarPanel(false)}
              disabled={actualizando}
              className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actualizando ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <ResumenCard
              titulo="Activos"
              valor={String(trabajosActivos.length)}
              clase="text-blue-700"
              icono="⚡"
              fondo="bg-blue-50"
              onClick={() => irASeccion("trabajos-activos")}
            />

            <ResumenCard
              titulo="Completados"
              valor={String(profile.completed_jobs ?? trabajosCompletados.length)}
              clase="text-emerald-700"
              icono="✓"
              fondo="bg-emerald-50"
              onClick={() => irASeccion("trabajos-completados")}
            />

            <ResumenCard
              titulo="Cancelados"
              valor={String(trabajosCancelados.length)}
              clase="text-red-700"
              icono="×"
              fondo="bg-red-50"
              onClick={() => irASeccion("trabajos-cancelados")}
            />

            <ResumenCard
              titulo="Reclamos"
              valor={String(reclamosActivos.length)}
              clase="text-rose-700"
              icono="⚠"
              fondo="bg-rose-50"
              onClick={() => irASeccion("reclamos-profesional")}
            />

            <ResumenCard
              titulo="Calificación"
              valor={Number(profile.average_rating || 0).toFixed(1)}
              clase="text-amber-700"
              icono="★"
              fondo="bg-amber-50"
              onClick={() => irASeccion("perfil-profesional")}
            />

            <ResumenCard
              titulo="Historial"
              valor={String(totalHistorial)}
              clase="text-violet-700"
              icono="↺"
              fondo="bg-violet-50"
              onClick={() => irASeccion("historial-completo")}
            />
          </div>
        </section>

        {/* ALERTA TRABAJO ACTIVO */}

        {estaVerificado && trabajosActivos.length > 0 && (
          <section className="mt-6 rounded-3xl border border-blue-300 bg-blue-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  Atención
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-blue-950">
                  {trabajosActivos.length === 1
                    ? "Tienes un trabajo activo"
                    : `Tienes ${trabajosActivos.length} trabajos activos`}
                </h2>

                <p className="mt-1 text-blue-800">
                  Revisa el estado y mantenlo actualizado para que el cliente pueda seguir el servicio en vivo.
                </p>
              </div>

              <button
                type="button"
                onClick={() => irASeccion("trabajos-activos")}
                className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
              >
                {trabajosActivos.length === 1
                  ? "Ver trabajo activo"
                  : `Ver ${trabajosActivos.length} trabajos activos`}
              </button>
            </div>
          </section>
        )}

        {/* ESTADO */}

        <section className={`mt-6 rounded-3xl border p-7 shadow-sm ${estado.estilo}`}>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide">
                Estado de la cuenta
              </p>

              <h2 className="mt-2 text-2xl font-extrabold">{estado.titulo}</h2>
              <p className="mt-2">{estado.descripcion}</p>
            </div>

            <span className={`w-fit rounded-full px-5 py-2 font-bold ${estado.badge}`}>
              {estado.textoBadge}
            </span>
          </div>
        </section>

        {/* VERIFICACIÓN */}

        {!estaVerificado && !estaSuspendido && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow">
            <h2 className="text-xl font-extrabold text-slate-900">
              Verificación profesional
            </h2>

            <p className="mt-2 text-slate-600">
              {estaRechazado
                ? "Tu verificación fue rechazada. Puedes corregir y volver a enviar tus documentos."
                : "Completa la verificación para comenzar a recibir trabajos."}
            </p>

            <button
              type="button"
              onClick={() => router.push("/completar-verificacion")}
              className={`mt-5 rounded-xl px-6 py-3 font-extrabold text-white ${
                estaRechazado
                  ? "bg-red-600 hover:bg-red-700"
                  : "bg-blue-700 hover:bg-blue-800"
              }`}
            >
              {estaRechazado
                ? "Corregir verificación"
                : "Completar verificación"}
            </button>
          </section>
        )}

        {/* SUSPENDIDO */}

        {estaSuspendido && (
          <section className="mt-6 rounded-3xl border border-red-200 bg-white p-7 shadow">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-100 text-2xl">
                ⛔
              </div>

              <div>
                <h2 className="text-xl font-extrabold text-red-900">
                  Acceso a trabajos suspendido
                </h2>

                <p className="mt-2 leading-6 text-slate-600">
                  Tu perfil continúa existiendo, pero mientras la cuenta esté suspendida no podrás recibir ni aceptar nuevos trabajos.
                </p>
              </div>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 font-medium text-red-700">
            {error}
          </div>
        )}

        {/* RECLAMOS */}

        {estaVerificado && (
          <section
            id="reclamos-profesional"
            className="mt-6 scroll-mt-6 rounded-3xl border border-rose-200 bg-white p-7 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-rose-700">
                  Protección
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Mis reclamos
                </h2>

                <p className="mt-2 text-slate-600">
                  Revisa los reclamos relacionados con tus trabajos y entra al detalle para adjuntar fotos o videos.
                </p>
              </div>

              <span className="w-fit rounded-full bg-rose-100 px-4 py-2 font-extrabold text-rose-800">
                {reclamosActivos.length} activos
              </span>
            </div>

            {reclamos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  No tienes reclamos registrados.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {reclamos.map((reclamo) => {
                  const trabajoRelacionado = trabajosContratados.find(
                    (trabajo) => trabajo.id === reclamo.request_id
                  );

                  const activo =
                    reclamo.status === "open" ||
                    reclamo.status === "reviewing" ||
                    reclamo.status === "in_review";

                  return (
                    <button
                      key={reclamo.id}
                      type="button"
                      onClick={() => router.push(`/trabajos/${reclamo.request_id}`)}
                      className="flex w-full flex-col gap-4 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-rose-300 hover:bg-rose-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-black text-slate-900">
                            {trabajoRelacionado?.title || "Trabajo con reclamo"}
                          </p>

                          <span
                            className={`rounded-full px-3 py-1 text-xs font-extrabold ${
                              activo
                                ? "bg-rose-100 text-rose-800"
                                : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {reclamo.status === "open"
                              ? "Abierto"
                              : reclamo.status === "reviewing" ||
                                reclamo.status === "in_review"
                              ? "En revisión"
                              : "Resuelto"}
                          </span>
                        </div>

                        <p className="mt-2 font-bold text-slate-700">
                          {reclamo.reason || "Reclamo del cliente"}
                        </p>

                        {reclamo.description && (
                          <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                            {reclamo.description}
                          </p>
                        )}
                      </div>

                      <div className="shrink-0 text-right">
                        <p className="text-sm font-black text-blue-700">
                          Ver reclamo →
                        </p>

                        <p className="mt-1 text-xs text-slate-400">
                          {formatearFecha(reclamo.created_at)}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {/* PERFIL */}

        <section
          id="perfil-profesional"
          className="mt-6 scroll-mt-6 overflow-hidden rounded-[30px] border border-slate-200 bg-white shadow-sm"
        >
          <div className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-blue-50/60 px-7 py-6">
            <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 shrink-0 overflow-hidden rounded-2xl border border-slate-200 bg-blue-700 shadow-lg shadow-blue-700/20">
                  {profile.company_logo_url ? (
                    <img
                      src={profile.company_logo_url}
                      alt={`Logo de ${profile.business_name || "la compañía"}`}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                      {(profile.business_name || "F").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>

                <div>
                  <p className="text-xs font-black uppercase tracking-[0.15em] text-blue-700">
                    Perfil profesional
                  </p>

                  <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                    {profile.business_name || "Profesional RELYDO"}
                  </h2>

                  <p className="mt-1 font-bold text-slate-500">
                    {nombreOficio(profile.trade)}
                  </p>
                </div>
              </div>

              {estaVerificado && (
                <span className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-black text-emerald-800">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[11px] text-white">
                    ✓
                  </span>
                  Profesional verificado
                </span>
              )}
            </div>
          </div>

          <div className="p-7">
            {profile.bio && (
              <div className="rounded-2xl border border-slate-200 bg-slate-50/70 p-5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                  Sobre tu negocio
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                  {profile.bio}
                </p>
              </div>
            )}

            <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <DatoPerfil
                titulo="Especialidad"
                valor={nombreOficio(profile.trade)}
                icono="🛠️"
              />

              <DatoPerfil
                titulo="Experiencia"
                valor={`${profile.years_experience ?? 0} años`}
                icono="🏅"
              />

              <DatoPerfil
                titulo="Radio de servicio"
                valor={`${profile.service_radius_miles ?? 0} millas`}
                icono="📍"
              />

              <DatoPerfil
                titulo="Trabajos completados"
                valor={String(profile.completed_jobs ?? 0)}
                icono="✅"
              />

              <DatoPerfil
                titulo="Calificación"
                valor={`⭐ ${Number(profile.average_rating || 0).toFixed(1)}`}
                icono="⭐"
              />

              <DatoPerfil
                titulo="Cuenta"
                valor={profile.active ? "Activa" : "Suspendida"}
                icono="🛡️"
              />
            </div>
          </div>
        </section>

        {/* OPORTUNIDADES */}

        <section className="mt-6 overflow-hidden rounded-[30px] border border-blue-200 bg-white p-7 shadow-sm">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                Oportunidades
              </p>

              <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                Nuevos trabajos
              </h2>

              <p className="mt-2 text-slate-600">
                Revisa nuevas solicitudes disponibles y envía tus presupuestos.
              </p>
            </div>

            <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-blue-100 text-3xl">
              🔎
            </div>
          </div>

          {estaVerificado ? (
            <button
              type="button"
              onClick={() => router.push("/trabajos")}
              className="mt-5 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
            >
              Ver trabajos disponibles →
            </button>
          ) : (
            <div className="mt-5 rounded-xl border border-amber-200 bg-amber-50 p-5 text-amber-900">
              {estaSuspendido
                ? "No puedes recibir nuevos trabajos mientras tu cuenta esté suspendida."
                : "Los trabajos estarán disponibles cuando tu cuenta quede verificada."}
            </div>
          )}
        </section>

        {/* ACTIVOS */}

        {estaVerificado && (
          <section
            id="trabajos-activos"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-green-700">
                  Trabajo activo
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Trabajos en progreso
                </h2>

                <p className="mt-2 text-slate-600">
                  Controla desde aquí todos los trabajos que ya fueron contratados.
                </p>
              </div>

              {trabajosActivos.length > 0 && (
                <span className="w-fit rounded-full bg-green-100 px-4 py-2 font-extrabold text-green-800">
                  {trabajosActivos.length}
                </span>
              )}
            </div>

            {trabajosActivos.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  No tienes trabajos en progreso.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-5">
                {trabajosActivos.map((trabajo) => (
                  <article
                    key={trabajo.id}
                    className="rounded-3xl border border-green-200 bg-green-50/40 p-6"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                            En progreso
                          </span>

                          <span
                            className={`rounded-full px-3 py-1 text-sm font-extrabold ${estiloEtapa(
                              trabajo.job_stage,
                              trabajo.status
                            )}`}
                          >
                            {nombreEtapa(trabajo.job_stage, trabajo.status)}
                          </span>
                        </div>

                        <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
                          {trabajo.title}
                        </h3>

                        <p className="mt-2 text-slate-600">
                          {trabajo.description}
                        </p>
                      </div>

                      {trabajo.pago ? (
                        <div className="min-w-[230px] rounded-2xl border border-emerald-200 bg-white px-6 py-4 shadow-sm">
                          <p className="text-center text-sm font-bold text-emerald-700">
                            Recibirás
                          </p>

                          <p className="mt-1 text-center text-3xl font-extrabold text-emerald-900">
                            ${Number(trabajo.pago.provider_net_amount).toFixed(2)}
                          </p>

                          <div className="mt-3 border-t border-slate-100 pt-3 text-xs">
                            <div className="flex items-center justify-between gap-4 text-slate-600">
                              <span>Valor del servicio</span>
                              <span className="font-bold text-slate-900">
                                ${Number(trabajo.pago.job_amount).toFixed(2)}
                              </span>
                            </div>

                            <div className="mt-1.5 flex items-center justify-between gap-4 text-slate-600">
                              <span>
                                Tarifa FixFlow ({Number(
                                  trabajo.pago.provider_commission_percent
                                ).toFixed(2)}%)
                              </span>
                              <span className="font-bold text-slate-900">
                                ${Number(
                                  trabajo.pago.provider_commission_amount
                                ).toFixed(2)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ) : trabajo.oferta ? (
                        <div className="rounded-2xl bg-white px-6 py-4 text-center shadow-sm">
                          <p className="text-sm font-bold text-slate-500">
                            Precio acordado
                          </p>

                          <p className="mt-1 text-3xl font-extrabold text-slate-900">
                            ${Number(trabajo.oferta.price).toFixed(2)}
                          </p>

                          <p className="mt-2 text-xs font-semibold text-amber-700">
                            Cálculo de tarifa pendiente
                          </p>
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <InfoBox
                        titulo="Cliente"
                        valor={trabajo.customer_name || "Cliente RELYDO"}
                      />

                      <InfoBox
                        titulo="Ubicación"
                        valor={`${trabajo.city}, ${trabajo.state} ${trabajo.zip_code}`}
                      />

                      <InfoBox
                        titulo="Fecha"
                        valor={trabajo.preferred_date || "Flexible"}
                      />

                      <InfoBox
                        titulo="Hora"
                        valor={trabajo.preferred_time || "Flexible"}
                      />
                    </div>

                    {trabajo.oferta && (
                      <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <InfoBox
                          titulo="Tiempo estimado de llegada"
                          valor={mostrarMinutos(trabajo.oferta.arrival_minutes)}
                          borde
                        />

                        <InfoBox
                          titulo="Duración estimada"
                          valor={mostrarMinutos(
                            trabajo.oferta.estimated_job_minutes
                          )}
                          borde
                        />
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                      className="mt-5 w-full rounded-2xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-lg shadow-blue-700/15 transition hover:-translate-y-0.5 hover:bg-blue-800"
                    >
                      Ver trabajo y actualizar estado →
                    </button>

                    <p className="mt-3 text-center text-sm text-slate-500">
                      Cambia el estado a En camino, Llegué, Trabajo iniciado o Completado.
                    </p>
                  </article>
                ))}
              </div>
            )}
          </section>
        )}

        {/* COMPLETADOS */}

        {estaVerificado && trabajosCompletados.length > 0 && (
          <section
            id="trabajos-completados"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                  Historial
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Trabajos completados
                </h2>
              </div>

              <span className="rounded-full bg-blue-100 px-4 py-2 font-extrabold text-blue-800">
                {trabajosCompletados.length}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {trabajosCompletados.map((trabajo) => (
                <article
                  key={trabajo.id}
                  className="rounded-2xl border border-slate-200 bg-slate-50 p-6"
                >
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <span className="rounded-full bg-green-100 px-3 py-1 text-sm font-extrabold text-green-800">
                        ✓ Completado
                      </span>

                      <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                        {trabajo.title}
                      </h3>

                      <p className="mt-2 text-slate-600">
                        {trabajo.description}
                      </p>

                      <p className="mt-2 text-sm text-slate-500">
                        {trabajo.city}, {trabajo.state} {trabajo.zip_code}
                      </p>
                    </div>

                    {trabajo.pago ? (
                      <div className="rounded-xl border border-emerald-200 bg-white px-4 py-3 text-right">
                        <p className="text-xs font-bold text-emerald-700">
                          Tu ingreso neto
                        </p>

                        <p className="mt-1 text-xl font-black text-emerald-800">
                          ${Number(trabajo.pago.provider_net_amount).toFixed(2)}
                        </p>

                        <p className="mt-1 text-xs text-slate-500">
                          Valor ${Number(trabajo.pago.job_amount).toFixed(2)}
                          {" · "}
                          Tarifa ${Number(
                            trabajo.pago.provider_commission_amount
                          ).toFixed(2)}
                        </p>
                      </div>
                    ) : trabajo.oferta ? (
                      <div className="rounded-xl bg-white px-4 py-3 text-right">
                        <p className="text-xs font-bold text-slate-500">
                          Precio acordado
                        </p>

                        <p className="mt-1 text-xl font-black text-green-800">
                          ${Number(trabajo.oferta.price).toFixed(2)}
                        </p>
                      </div>
                    ) : null}
                  </div>

                  <button
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="mt-5 rounded-xl border-2 border-blue-700 px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
                  >
                    Ver detalles
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* CANCELADOS */}

        {estaVerificado && trabajosCancelados.length > 0 && (
          <section
            id="trabajos-cancelados"
            className="mt-6 scroll-mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow"
          >
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-red-700">
                  Historial
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Trabajos cancelados
                </h2>
              </div>

              <span className="rounded-full bg-red-100 px-4 py-2 font-extrabold text-red-800">
                {trabajosCancelados.length}
              </span>
            </div>

            <div className="mt-6 space-y-4">
              {trabajosCancelados.map((trabajo) => (
                <article
                  key={trabajo.id}
                  className="rounded-2xl border border-red-200 bg-red-50/40 p-6"
                >
                  <span className="rounded-full bg-red-100 px-3 py-1 text-sm font-extrabold text-red-800">
                    ✕ Cancelado
                  </span>

                  <h3 className="mt-3 text-xl font-extrabold text-slate-900">
                    {trabajo.title}
                  </h3>

                  <p className="mt-2 text-slate-600">{trabajo.description}</p>

                  {trabajo.cancellation_reason && (
                    <div className="mt-4 rounded-xl border border-red-200 bg-white p-4">
                      <p className="text-sm font-bold text-red-700">
                        Motivo de cancelación
                      </p>

                      <p className="mt-1 font-semibold text-slate-800">
                        {trabajo.cancellation_reason}
                      </p>

                      {trabajo.cancelled_at && (
                        <p className="mt-2 text-xs text-slate-500">
                          {formatearFecha(trabajo.cancelled_at)}
                        </p>
                      )}
                    </div>
                  )}

                  {trabajo.pago ? (
                    <div className="mt-3 rounded-xl border border-red-200 bg-white p-4">
                      <p className="text-sm font-bold text-red-800">
                        Precio acordado: ${Number(
                          trabajo.pago.job_amount
                        ).toFixed(2)}
                      </p>

                      <p className="mt-1 text-xs text-slate-500">
                        El trabajo fue cancelado. El tratamiento de reembolsos y comisiones se definirá en la fase de cancelaciones del sistema de pagos.
                      </p>
                    </div>
                  ) : trabajo.oferta ? (
                    <p className="mt-3 font-bold text-red-800">
                      Precio acordado: ${Number(trabajo.oferta.price).toFixed(2)}
                    </p>
                  ) : null}

                  <button
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="mt-5 rounded-xl border-2 border-red-600 px-5 py-3 font-extrabold text-red-700 hover:bg-red-50"
                  >
                    Ver detalles
                  </button>
                </article>
              ))}
            </div>
          </section>
        )}

        {/* HISTORIAL COMPLETO */}

        {estaVerificado && (
          <section
            id="historial-completo"
            className="mt-6 scroll-mt-6 rounded-3xl border border-violet-200 bg-white p-7 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
                  Historial completo
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Todos tus trabajos
                </h2>

                <p className="mt-2 text-slate-600">
                  Activos, completados y cancelados en una sola vista.
                </p>
              </div>

              <span className="w-fit rounded-full bg-violet-100 px-4 py-2 font-extrabold text-violet-800">
                {totalHistorial}
              </span>
            </div>

            {trabajosContratados.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  Todavía no tienes trabajos en el historial.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {trabajosContratados.map((trabajo) => (
                  <button
                    key={trabajo.id}
                    type="button"
                    onClick={() => router.push(`/trabajos/${trabajo.id}`)}
                    className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {trabajo.title}
                      </p>
                      <p className="mt-1 text-sm text-slate-500">
                        {trabajo.city}, {trabajo.state} · {formatearFecha(trabajo.created_at)}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-extrabold ${estiloEtapa(
                        trabajo.job_stage,
                        trabajo.status
                      )}`}
                    >
                      {nombreEtapa(trabajo.job_stage, trabajo.status)}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </section>
        )}

      </div>
    </main>
  );
}

function ResumenCard({
  titulo,
  valor,
  clase,
  icono,
  fondo,
  onClick,
}: {
  titulo: string;
  valor: string;
  clase: string;
  icono: string;
  fondo: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="group w-full cursor-pointer rounded-2xl border border-slate-200 bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold text-slate-500 transition group-hover:text-slate-800">
          {titulo}
        </p>

        <div className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${fondo}`}>
          {icono}
        </div>
      </div>

      <div className="mt-3 flex items-end justify-between gap-3">
        <p className={`text-3xl font-black tracking-tight ${clase}`}>
          {valor}
        </p>

        <span className="text-lg font-black text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
          →
        </span>
      </div>
    </button>
  );
}

function InfoBox({
  titulo,
  valor,
  borde = false,
}: {
  titulo: string;
  valor: string;
  borde?: boolean;
}) {
  return (
    <div
      className={`rounded-2xl bg-white p-4 ${
        borde ? "border border-slate-200" : "border border-white"
      }`}
    >
      <p className="text-xs font-black uppercase tracking-wide text-slate-400">
        {titulo}
      </p>
      <p className="mt-1.5 font-extrabold text-slate-900">{valor}</p>
    </div>
  );
}

function DatoPerfil({
  titulo,
  valor,
  icono,
}: {
  titulo: string;
  valor: string;
  icono: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-lg">
          {icono}
        </div>

        <div>
          <p className="text-sm font-medium text-slate-500">{titulo}</p>
          <p className="mt-1 font-black text-slate-950">{valor}</p>
        </div>
      </div>
    </div>
  );
}