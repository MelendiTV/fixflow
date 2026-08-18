"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import NotificationsBell from "@/app/components/NotificationsBell";
import { AccountModeSwitcher } from "@/app/components/AccountModeSwitcher";
import { useAccountMode } from "@/app/components/AccountModeProvider";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Solicitud = {
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
  created_at: string;
};

type ClienteProfile = {
  full_name: string | null;
  role: string | null;
  avatar_url: string | null;
};

type ReclamoCliente = {
  id: string;
  request_id: string;
  reason: string | null;
  description: string | null;
  status: string;
  created_at: string;
};

function nombreEstado(status: string, jobStage: string | null) {
  if (status === "open") return "Abierta";
  if (status === "completed") return "Completada";
  if (status === "cancelled") return "Cancelada";

  if (status === "in_progress") {
    if (jobStage === "on_the_way") return "Profesional en camino";
    if (jobStage === "arrived") return "Profesional llegó";
    if (jobStage === "working") return "Trabajo iniciado";
    return "Profesional contratado";
  }

  return status;
}

function estiloEstado(status: string, jobStage: string | null) {
  if (status === "open") return "bg-blue-100 text-blue-800";
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "cancelled") return "bg-red-100 text-red-800";

  if (status === "in_progress") {
    if (jobStage === "working") return "bg-amber-100 text-amber-800";
    if (jobStage === "arrived") return "bg-purple-100 text-purple-800";
    if (jobStage === "on_the_way") return "bg-blue-100 text-blue-800";
    return "bg-green-100 text-green-800";
  }

  return "bg-slate-100 text-slate-700";
}

function iconoEstado(status: string, jobStage: string | null) {
  if (status === "completed") return "✅";
  if (status === "cancelled") return "✕";
  if (status === "open") return "📋";
  if (jobStage === "working") return "🛠️";
  if (jobStage === "arrived") return "📍";
  if (jobStage === "on_the_way") return "🚗";
  return "🤝";
}

export default function MisSolicitudesPage() {
  const router = useRouter();
  const { setAccountRole } = useAccountMode();
  const avatarInputRef = useRef<HTMLInputElement | null>(null);

  const [solicitudes, setSolicitudes] = useState<Solicitud[]>([]);
  const [cliente, setCliente] = useState<ClienteProfile | null>(null);
  const [email, setEmail] = useState("");
  const [cargando, setCargando] = useState(true);
  const [actualizando, setActualizando] = useState(false);
  const [subiendoAvatar, setSubiendoAvatar] = useState(false);
  const [error, setError] = useState("");
  const [userId, setUserId] = useState<string | null>(null);
  const [realtimeConectado, setRealtimeConectado] = useState(false);
  const [reclamos, setReclamos] = useState<ReclamoCliente[]>([]);

  useEffect(() => {
    cargarPanelCliente();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const canal = supabase
      .channel(`panel-cliente-${userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "service_requests",
          filter: `customer_id=eq.${userId}`,
        },
        (payload) => {
          console.log("Cambio recibido en panel cliente:", payload);

          if (payload.eventType === "INSERT") {
            const nueva = payload.new as Solicitud;

            setSolicitudes((actuales) => {
              const existe = actuales.some((item) => item.id === nueva.id);
              if (existe) return actuales;
              return [nueva, ...actuales];
            });

            return;
          }

          if (payload.eventType === "UPDATE") {
            const actualizada = payload.new as Solicitud;

            setSolicitudes((actuales) =>
              actuales.map((item) =>
                item.id === actualizada.id
                  ? {
                      ...item,
                      ...actualizada,
                    }
                  : item
              )
            );

            return;
          }

          if (payload.eventType === "DELETE") {
            const eliminada = payload.old as { id?: string };

            if (!eliminada.id) return;

            setSolicitudes((actuales) =>
              actuales.filter((item) => item.id !== eliminada.id)
            );
          }
        }
      )
      .subscribe((status) => {
        console.log("Realtime panel cliente:", status);

        if (status === "SUBSCRIBED") {
          setRealtimeConectado(true);
        } else if (
          status === "CHANNEL_ERROR" ||
          status === "TIMED_OUT" ||
          status === "CLOSED"
        ) {
          setRealtimeConectado(false);
        }
      });

    return () => {
      supabase.removeChannel(canal);
    };
  }, [userId]);

  async function cargarPanelCliente(mostrarCarga = true) {
    if (mostrarCarga) {
      setCargando(true);
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
        router.replace("/login-cliente");
        return;
      }

      setUserId(user.id);
      setEmail(user.email || "");

      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select(`
          full_name,
          role,
          avatar_url
        `)
        .eq("id", user.id)
        .maybeSingle();

      if (profileError || !profileData) {
        throw new Error("No se encontró tu perfil de cliente.");
      }

      if (
        profileData.role !== "customer" &&
        profileData.role !== "provider"
      ) {
        throw new Error("Esta cuenta no tiene acceso al modo cliente.");
      }

      setAccountRole(
        profileData.role === "provider"
          ? "provider"
          : "customer"
      );

      setCliente(profileData);

      const { data, error: solicitudesError } = await supabase
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
          created_at
        `)
        .eq("customer_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (solicitudesError) {
        throw new Error(
          `No pudimos cargar tus solicitudes: ${solicitudesError.message}`
        );
      }

      setSolicitudes((data || []) as Solicitud[]);

      const { data: reclamosData, error: reclamosError } = await supabase
        .from("job_claims")
        .select(`
          id,
          request_id,
          reason,
          description,
          status,
          created_at
        `)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false });

      if (reclamosError) {
        throw new Error(
          `No pudimos cargar tus reclamos: ${reclamosError.message}`
        );
      }

      setReclamos((reclamosData || []) as ReclamoCliente[]);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    } finally {
      if (mostrarCarga) {
        setCargando(false);
      }

      setActualizando(false);
    }
  }

  async function cerrarSesion() {
    await supabase.auth.signOut();
    window.location.href = "/login-cliente";
  }

  async function subirAvatar(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];

    if (!file || !cliente) return;

    setError("");

    const tiposPermitidos = ["image/jpeg", "image/png", "image/webp"];

    if (!tiposPermitidos.includes(file.type)) {
      setError("La foto debe ser JPG, PNG o WEBP.");
      event.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("La foto no puede superar 5 MB.");
      event.target.value = "";
      return;
    }

    setSubiendoAvatar(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Tu sesión ya no está disponible.");
      }

      const extension = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const ruta = `${user.id}/avatar-${Date.now()}.${extension}`;

      const { error: uploadError } = await supabase.storage
        .from("customer-avatars")
        .upload(ruta, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) {
        throw new Error(`No se pudo subir la foto: ${uploadError.message}`);
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from("customer-avatars").getPublicUrl(ruta);

      const { error: updateError } = await supabase
        .from("profiles")
        .update({
          avatar_url: publicUrl,
        })
        .eq("id", user.id);

      if (updateError) {
        throw new Error(
          `La foto subió, pero no se pudo guardar en tu perfil: ${updateError.message}`
        );
      }

      setCliente((actual) =>
        actual
          ? {
              ...actual,
              avatar_url: publicUrl,
            }
          : actual
      );
    } catch (err) {
      console.error("Error subiendo foto de cliente:", err);

      setError(
        err instanceof Error ? err.message : "No se pudo subir la foto."
      );
    } finally {
      setSubiendoAvatar(false);
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

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            Cargando panel del cliente...
          </p>
        </div>
      </main>
    );
  }

  const abiertas = solicitudes.filter(
    (solicitud) => solicitud.status === "open"
  );

  const enProgreso = solicitudes.filter(
    (solicitud) => solicitud.status === "in_progress"
  );

  const completadas = solicitudes.filter(
    (solicitud) => solicitud.status === "completed"
  );

  const canceladas = solicitudes.filter(
    (solicitud) => solicitud.status === "cancelled"
  );

  const totalHistorial =
    abiertas.length +
    enProgreso.length +
    completadas.length +
    canceladas.length;

  const reclamosActivos = reclamos.filter(
    (reclamo) =>
      reclamo.status === "open" ||
      reclamo.status === "reviewing" ||
      reclamo.status === "in_review"
  );

  function renderSolicitud(solicitud: Solicitud) {
    const nombre = nombreEstado(solicitud.status, solicitud.job_stage);
    const estilo = estiloEstado(solicitud.status, solicitud.job_stage);
    const icono = iconoEstado(solicitud.status, solicitud.job_stage);

    return (
      <article
        key={solicitud.id}
        className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
      >
        <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <span
              className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-bold ${estilo}`}
            >
              <span>{icono}</span>
              {nombre}
            </span>

            <h3 className="mt-3 text-2xl font-extrabold text-slate-900">
              {solicitud.title}
            </h3>

            <p className="mt-2 text-slate-600">{solicitud.description}</p>
          </div>
        </div>

        <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoBox
            titulo="Ubicación"
            valor={`${solicitud.city}, ${solicitud.state} ${solicitud.zip_code}`}
            icono="📍"
          />

          <InfoBox
            titulo="Fecha"
            valor={solicitud.preferred_date || "Flexible"}
            icono="📅"
          />

          <InfoBox
            titulo="Hora"
            valor={solicitud.preferred_time || "Flexible"}
            icono="🕐"
          />
        </div>

        {solicitud.status === "in_progress" && (
          <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-blue-700 text-lg text-white">
                {icono}
              </div>

              <div>
                <p className="text-sm font-bold text-blue-700">
                  Estado actual
                </p>
                <p className="font-extrabold text-blue-950">{nombre}</p>
              </div>
            </div>
          </div>
        )}

        <button
          type="button"
          onClick={() => router.push(`/mis-solicitudes/${solicitud.id}`)}
          className={`mt-6 rounded-xl px-6 py-3 font-bold transition ${
            solicitud.status === "cancelled"
              ? "border-2 border-red-600 bg-white text-red-700 hover:bg-red-50"
              : "bg-blue-700 text-white hover:bg-blue-800"
          }`}
        >
          {solicitud.status === "open"
            ? "Ver presupuestos"
            : solicitud.status === "in_progress"
            ? "Ver seguimiento"
            : "Ver detalles"}
        </button>
      </article>
    );
  }

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
                  Panel del cliente
                </div>

                <div className="mt-4 text-2xl font-black">RELYDO</div>

                <div className="mt-5 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <div className="group relative h-20 w-20 shrink-0 overflow-hidden rounded-full border-2 border-white/25 bg-white/10 shadow-lg">
                    {cliente?.avatar_url ? (
                      <img
                        src={cliente.avatar_url}
                        alt={`Foto de ${cliente.full_name || "cliente"}`}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-3xl font-black text-white">
                        {(cliente?.full_name || "C").charAt(0).toUpperCase()}
                      </div>
                    )}

                    <button
                      type="button"
                      disabled={subiendoAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="absolute inset-x-0 bottom-0 bg-slate-950/75 px-2 py-1.5 text-[9px] font-black uppercase tracking-wide text-white opacity-0 transition group-hover:opacity-100 disabled:cursor-not-allowed"
                    >
                      {subiendoAvatar ? "Subiendo..." : "Cambiar"}
                    </button>
                  </div>

                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={subirAvatar}
                    className="hidden"
                  />

                  <div>
                    <h1 className="text-3xl font-black tracking-tight md:text-5xl">
                      Hola, {cliente?.full_name || "Cliente"}
                    </h1>

                    <button
                      type="button"
                      disabled={subiendoAvatar}
                      onClick={() => avatarInputRef.current?.click()}
                      className="mt-2 text-sm font-bold text-blue-100 underline decoration-white/40 underline-offset-4 transition hover:text-white disabled:opacity-60"
                    >
                      {subiendoAvatar
                        ? "Subiendo foto..."
                        : cliente?.avatar_url
                        ? "Cambiar foto de perfil"
                        : "Añadir foto de perfil"}
                    </button>
                  </div>
                </div>

                <p className="mt-4 max-w-xl text-base leading-7 text-blue-100 md:text-lg">
                  Administra tus solicitudes, sigue tus trabajos y encuentra profesionales desde un solo lugar.
                </p>

                <div className="mt-5">
                  <span
                    className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold ${
                      realtimeConectado
                        ? "bg-green-100 text-green-800"
                        : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        realtimeConectado ? "bg-green-500" : "bg-amber-500"
                      }`}
                    />

                    {realtimeConectado
                      ? "Actualización en vivo activa"
                      : "Conectando actualización en vivo..."}
                  </span>
                </div>
              </div>

              <div className="relative z-[100] flex items-start gap-3 md:items-center">
                <div className="relative z-[110]">
                  <NotificationsBell modo="cliente" />
                </div>

                <div className="rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur-sm">
                  <p className="text-xs font-black uppercase tracking-wide text-blue-200">
                    Cuenta
                  </p>

                  <p className="mt-1 max-w-[220px] truncate text-sm font-bold text-white">
                    {email}
                  </p>

                  {cliente?.role === "provider" && (
                    <div className="mt-3 rounded-xl bg-white/95 p-2 text-slate-900">
                      <AccountModeSwitcher />
                    </div>
                  )}

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

        {/* ACCIONES */}

        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
          <button
            type="button"
            onClick={() => router.push("/solicitar-trabajo")}
            className="rounded-2xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white shadow transition hover:-translate-y-0.5 hover:bg-blue-800"
          >
            + Solicitar nuevo trabajo
          </button>

          <button
            type="button"
            onClick={() => router.push("/profesionales")}
            className="rounded-2xl border-2 border-blue-700 bg-white px-6 py-4 text-lg font-extrabold text-blue-700 shadow transition hover:-translate-y-0.5 hover:bg-blue-50"
          >
            Ver profesionales
          </button>
        </section>

        {/* RESUMEN */}

        <section className="mt-7">
          <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-700">
                Resumen
              </p>

              <h2 className="mt-1 text-2xl font-black tracking-tight text-slate-950 md:text-3xl">
                Tu actividad en RELYDO
              </h2>

              <p className="mt-2 text-slate-600">
                Pulsa cualquier tarjeta para ir directamente a esa sección.
              </p>
            </div>

            <button
              type="button"
              onClick={() => cargarPanelCliente(false)}
              disabled={actualizando}
              className="w-fit rounded-xl border border-slate-300 bg-white px-5 py-3 font-black text-slate-800 shadow-sm transition hover:border-blue-300 hover:bg-blue-50 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {actualizando ? "Actualizando..." : "↻ Actualizar"}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
            <ResumenCard
              titulo="Abiertas"
              valor={String(abiertas.length)}
              clase="text-blue-700"
              icono="📋"
              fondo="bg-blue-50"
              onClick={() => irASeccion("solicitudes-abiertas")}
            />

            <ResumenCard
              titulo="En progreso"
              valor={String(enProgreso.length)}
              clase="text-amber-700"
              icono="⚡"
              fondo="bg-amber-50"
              onClick={() => irASeccion("trabajos-en-progreso")}
            />

            <ResumenCard
              titulo="Completadas"
              valor={String(completadas.length)}
              clase="text-emerald-700"
              icono="✓"
              fondo="bg-emerald-50"
              onClick={() => irASeccion("trabajos-completados")}
            />

            <ResumenCard
              titulo="Canceladas"
              valor={String(canceladas.length)}
              clase="text-red-700"
              icono="×"
              fondo="bg-red-50"
              onClick={() => irASeccion("solicitudes-canceladas")}
            />

            <ResumenCard
              titulo="Reclamos"
              valor={String(reclamosActivos.length)}
              clase="text-rose-700"
              icono="⚠"
              fondo="bg-rose-50"
              onClick={() => irASeccion("mis-reclamos")}
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

        {/* ALERTA EN PROGRESO */}

        {enProgreso.length > 0 && (
          <section className="mt-6 rounded-3xl border border-blue-300 bg-blue-50 p-6 shadow-sm">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  Seguimiento
                </p>

                <h2 className="mt-1 text-xl font-extrabold text-blue-950">
                  {enProgreso.length === 1
                    ? "Tienes un trabajo en progreso"
                    : `Tienes ${enProgreso.length} trabajos en progreso`}
                </h2>

                <p className="mt-1 text-blue-800">
                  Revisa aquí el avance que reporta cada profesional.
                </p>
              </div>

              <button
                type="button"
                onClick={() => irASeccion("trabajos-en-progreso")}
                className="shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800"
              >
                {enProgreso.length === 1
                  ? "Ver seguimiento"
                  : `Ver ${enProgreso.length} trabajos`}
              </button>
            </div>
          </section>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 font-bold text-red-700">
            {error}
          </div>
        )}

        {!error && solicitudes.length === 0 && (
          <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">
            <div className="text-5xl">📋</div>

            <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
              Todavía no tienes solicitudes
            </h2>

            <p className="mt-2 text-slate-600">
              Cuando solicites un trabajo aparecerá aquí.
            </p>

            <button
              type="button"
              onClick={() => router.push("/solicitar-trabajo")}
              className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
            >
              Solicitar un trabajo
            </button>
          </section>
        )}

        {!error && abiertas.length > 0 && (
          <section id="solicitudes-abiertas" className="mt-8 scroll-mt-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Solicitudes abiertas
            </h2>

            <p className="mt-2 text-slate-600">
              Esperando presupuestos de profesionales.
            </p>

            <div className="mt-5 space-y-5">
              {abiertas.map(renderSolicitud)}
            </div>
          </section>
        )}

        {!error && enProgreso.length > 0 && (
          <section id="trabajos-en-progreso" className="mt-10 scroll-mt-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Trabajos en progreso
            </h2>

            <p className="mt-2 text-slate-600">
              Sigue aquí el estado actual de todos tus trabajos.
            </p>

            <div className="mt-5 space-y-5">
              {enProgreso.map(renderSolicitud)}
            </div>
          </section>
        )}

        {!error && completadas.length > 0 && (
          <section id="trabajos-completados" className="mt-10 scroll-mt-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Trabajos completados
            </h2>

            <p className="mt-2 text-slate-600">
              Historial de trabajos terminados.
            </p>

            <div className="mt-5 space-y-5">
              {completadas.map(renderSolicitud)}
            </div>
          </section>
        )}

        {!error && canceladas.length > 0 && (
          <section id="solicitudes-canceladas" className="mt-10 scroll-mt-6">
            <h2 className="text-3xl font-extrabold text-slate-900">
              Solicitudes canceladas
            </h2>

            <p className="mt-2 text-slate-600">
              Historial de solicitudes que fueron canceladas.
            </p>

            <div className="mt-5 space-y-5">
              {canceladas.map(renderSolicitud)}
            </div>
          </section>
        )}

        {!error && (
          <section
            id="mis-reclamos"
            className="mt-10 scroll-mt-6 rounded-3xl border border-rose-200 bg-white p-7 shadow-sm"
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
                  Revisa tus reclamos abiertos, en revisión y resueltos.
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
                  const solicitud = solicitudes.find(
                    (item) => item.id === reclamo.request_id
                  );

                  const activo =
                    reclamo.status === "open" ||
                    reclamo.status === "reviewing" ||
                    reclamo.status === "in_review";

                  return (
                    <button
                      key={reclamo.id}
                      type="button"
                      onClick={() =>
                        router.push(`/mis-solicitudes/${reclamo.request_id}`)
                      }
                      className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-rose-300 hover:bg-rose-50 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="font-black text-slate-900">
                          {reclamo.reason || "Reclamo de trabajo"}
                        </p>
                        <p className="mt-1 text-sm text-slate-600">
                          {solicitud?.title || "Ver trabajo relacionado"}
                        </p>
                      </div>

                      <span
                        className={`w-fit rounded-full px-3 py-1 text-sm font-extrabold ${
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
                    </button>
                  );
                })}
              </div>
            )}
          </section>
        )}

        {!error && (
          <section
            id="historial-completo"
            className="mt-10 scroll-mt-6 rounded-3xl border border-violet-200 bg-white p-7 shadow-sm"
          >
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm font-bold uppercase tracking-wide text-violet-700">
                  Historial completo
                </p>

                <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                  Todas tus solicitudes
                </h2>

                <p className="mt-2 text-slate-600">
                  Abiertas, en progreso, completadas y canceladas en una sola vista.
                </p>
              </div>

              <span className="w-fit rounded-full bg-violet-100 px-4 py-2 font-extrabold text-violet-800">
                {totalHistorial}
              </span>
            </div>

            {solicitudes.length === 0 ? (
              <div className="mt-6 rounded-2xl border border-slate-200 bg-slate-50 p-6 text-center">
                <p className="font-bold text-slate-700">
                  Todavía no tienes solicitudes en el historial.
                </p>
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                {solicitudes.map((solicitud) => (
                  <button
                    key={solicitud.id}
                    type="button"
                    onClick={() =>
                      router.push(`/mis-solicitudes/${solicitud.id}`)
                    }
                    className="flex w-full flex-col gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-5 text-left transition hover:border-violet-300 hover:bg-violet-50 sm:flex-row sm:items-center sm:justify-between"
                  >
                    <div>
                      <p className="font-black text-slate-900">
                        {solicitud.title}
                      </p>

                      <p className="mt-1 text-sm text-slate-500">
                        {solicitud.city}, {solicitud.state} {solicitud.zip_code}
                      </p>
                    </div>

                    <span
                      className={`w-fit rounded-full px-3 py-1 text-sm font-extrabold ${estiloEstado(
                        solicitud.status,
                        solicitud.job_stage
                      )}`}
                    >
                      {nombreEstado(solicitud.status, solicitud.job_stage)}
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

        <div
          className={`flex h-9 w-9 items-center justify-center rounded-xl text-lg ${fondo}`}
        >
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
  icono,
}: {
  titulo: string;
  valor: string;
  icono: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 p-4">
      <p className="text-sm text-slate-500">
        {icono} {titulo}
      </p>

      <p className="mt-1 font-bold text-slate-900">{valor}</p>
    </div>
  );
}