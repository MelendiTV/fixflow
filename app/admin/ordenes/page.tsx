"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

const ADMIN_EMAIL = "info@melendivip.com";

type Provider = {
  user_id: string;
  business_name: string | null;
  trade: string | null;
};

type ReassignmentHistory = {
  id: string;
  request_id: string;
  provider_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
};

type SolicitudAdmin = {
  id: string;
  customer_id: string | null;
  title: string;
  description: string;
  address_line1: string | null;
  address_line2: string | null;
  city: string;
  state: string;
  zip_code: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  created_at: string;
  customer_name: string | null;
  customer_phone: string | null;
  customer_email: string | null;
  preferred_provider_id: string | null;
  job_stage: string | null;
  cancellation_reason: string | null;
  cancelled_at: string | null;
};

type FiltroOrden =
  | "todas"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled"
  | "reassigned";

function nombreEstadoOrden(
  status: string,
  jobStage: string | null
) {
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

function estiloEstadoOrden(
  status: string,
  jobStage: string | null
) {
  if (status === "open") return "bg-blue-100 text-blue-800";
  if (status === "completed") return "bg-green-100 text-green-800";
  if (status === "cancelled") return "bg-red-100 text-red-800";

  if (status === "in_progress") {
    if (jobStage === "working") return "bg-amber-100 text-amber-800";
    if (jobStage === "arrived") return "bg-purple-100 text-purple-800";
    if (jobStage === "on_the_way") return "bg-sky-100 text-sky-800";
    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-100 text-slate-700";
}

export default function AdminOrdenesPage() {
  const router = useRouter();

  const [solicitudes, setSolicitudes] = useState<SolicitudAdmin[]>([]);
  const [providers, setProviders] = useState<Provider[]>([]);
  const [historial, setHistorial] = useState<ReassignmentHistory[]>([]);
  const [buscando, setBuscando] = useState("");
  const [filtro, setFiltro] = useState<FiltroOrden>("todas");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    cargar();
  }, []);

  async function cargar() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (
        authError ||
        !user ||
        !user.email ||
        user.email.toLowerCase() !== ADMIN_EMAIL.toLowerCase()
      ) {
        router.replace("/login-profesional");
        return;
      }

      const [
        solicitudesResp,
        providersResp,
        historialResp,
      ] = await Promise.all([
        supabase
          .from("service_requests")
          .select(`
            id,
            customer_id,
            title,
            description,
            address_line1,
            address_line2,
            city,
            state,
            zip_code,
            preferred_date,
            preferred_time,
            status,
            created_at,
            customer_name,
            customer_phone,
            customer_email,
            preferred_provider_id,
            job_stage,
            cancellation_reason,
            cancelled_at
          `)
          .order("created_at", { ascending: false })
          .limit(1000),

        supabase
          .from("provider_profiles")
          .select(`
            user_id,
            business_name,
            trade
          `)
          .limit(2000),

        supabase
          .from("job_reassignment_history")
          .select(`
            id,
            request_id,
            provider_id,
            action,
            reason,
            created_at
          `)
          .order("created_at", { ascending: false })
          .limit(2000),
      ]);

      if (solicitudesResp.error) {
        throw new Error(solicitudesResp.error.message);
      }

      if (providersResp.error) {
        throw new Error(providersResp.error.message);
      }

      if (historialResp.error) {
        throw new Error(historialResp.error.message);
      }

      setSolicitudes(
        (solicitudesResp.data || []) as SolicitudAdmin[]
      );

      setProviders(
        (providersResp.data || []) as Provider[]
      );

      setHistorial(
        (historialResp.data || []) as ReassignmentHistory[]
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No pudimos cargar las órdenes."
      );
    } finally {
      setLoading(false);
    }
  }

  const abiertas = solicitudes.filter(
    (s) => s.status === "open"
  ).length;

  const progreso = solicitudes.filter(
    (s) => s.status === "in_progress"
  ).length;

  const completadas = solicitudes.filter(
    (s) => s.status === "completed"
  ).length;

  const canceladas = solicitudes.filter(
    (s) => s.status === "cancelled"
  ).length;

  const idsReasignadas = useMemo(
    () => new Set(historial.map((item) => item.request_id)),
    [historial]
  );

  const reasignadas = idsReasignadas.size;

  const filtradas = useMemo(() => {
    const texto = buscando.trim().toLowerCase();

    return solicitudes.filter((solicitud) => {
      if (filtro === "reassigned") {
        if (!idsReasignadas.has(solicitud.id)) {
          return false;
        }
      } else if (
        filtro !== "todas" &&
        solicitud.status !== filtro
      ) {
        return false;
      }

      if (!texto) return true;

      const profesional =
        solicitud.preferred_provider_id
          ? providers.find(
              (p) =>
                p.user_id ===
                solicitud.preferred_provider_id
            )
          : null;

      const campos = [
        solicitud.title,
        solicitud.description,
        solicitud.customer_name || "",
        solicitud.customer_email || "",
        solicitud.customer_phone || "",
        solicitud.city,
        solicitud.state,
        solicitud.zip_code,
        solicitud.id,
        solicitud.customer_id || "",
        solicitud.preferred_provider_id || "",
        profesional?.business_name || "",
        profesional?.trade || "",
      ]
        .join(" ")
        .toLowerCase();

      return campos.includes(texto);
    });
  }, [solicitudes, providers, buscando, filtro, idsReasignadas]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-8 py-7 font-bold text-slate-700 shadow">
          Cargando órdenes...
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <button
            type="button"
            onClick={() => router.push("/admin")}
            className="w-fit font-black text-blue-700 hover:underline"
          >
            ← Volver al panel Admin
          </button>

          <button
            type="button"
            onClick={cargar}
            className="w-fit rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
          >
            ↻ Actualizar órdenes
          </button>
        </div>

        <section className="mb-8 rounded-3xl bg-slate-950 p-7 text-white shadow-xl">
          <p className="text-sm font-black uppercase tracking-widest text-blue-300">
            Operaciones
          </p>
          <h1 className="mt-2 text-3xl font-black">
            Control de órdenes
          </h1>
          <p className="mt-3 text-slate-300">
            Consulta todas las órdenes y abre el expediente administrativo completo de cada trabajo.
          </p>
        </section>

        {error && (
          <div className="mb-6 rounded-2xl border border-red-300 bg-red-50 p-5 font-bold text-red-700">
            {error}
          </div>
        )}

        <div className="mb-5 grid grid-cols-2 gap-4 lg:grid-cols-5">
          <Resumen
            titulo="Abiertas"
            valor={abiertas}
            activo={filtro === "open"}
            onClick={() => setFiltro("open")}
          />
          <Resumen
            titulo="En progreso"
            valor={progreso}
            activo={filtro === "in_progress"}
            onClick={() => setFiltro("in_progress")}
          />
          <Resumen
            titulo="Completadas"
            valor={completadas}
            activo={filtro === "completed"}
            onClick={() => setFiltro("completed")}
          />
          <Resumen
            titulo="Canceladas"
            valor={canceladas}
            activo={filtro === "cancelled"}
            onClick={() => setFiltro("cancelled")}
          />
          <Resumen
            titulo="Reasignadas"
            valor={reasignadas}
            activo={filtro === "reassigned"}
            onClick={() => setFiltro("reassigned")}
          />
        </div>

        <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow">
          <input
            type="text"
            value={buscando}
            onChange={(e) => setBuscando(e.target.value)}
            placeholder="Buscar por trabajo, cliente, email, teléfono, ciudad, profesional o ID..."
            className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
          />

          <div className="mt-4 flex flex-wrap gap-2">
            {(
              [
                ["todas", "Todas"],
                ["open", "Abiertas"],
                ["in_progress", "En progreso"],
                ["completed", "Completadas"],
                ["cancelled", "Canceladas"],
                ["reassigned", "🔄 Reasignadas"],
              ] as const
            ).map(([valor, texto]) => (
              <button
                key={valor}
                type="button"
                onClick={() => setFiltro(valor)}
                className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
                  filtro === valor
                    ? "bg-blue-700 text-white"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
              >
                {texto}
              </button>
            ))}
          </div>
        </div>

        {filtradas.length === 0 ? (
          <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow">
            <p className="font-bold text-slate-600">
              No hay órdenes con estos filtros.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filtradas.map((solicitud) => (
              <article
                key={solicitud.id}
                className="rounded-3xl border border-slate-200 bg-white p-6 shadow"
              >
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <span
                      className={`rounded-full px-3 py-1 text-sm font-extrabold ${estiloEstadoOrden(
                        solicitud.status,
                        solicitud.job_stage
                      )}`}
                    >
                      {nombreEstadoOrden(
                        solicitud.status,
                        solicitud.job_stage
                      )}
                    </span>

                    <h2 className="mt-3 text-xl font-extrabold text-slate-900">
                      {solicitud.title}
                    </h2>

                    <p className="mt-2 break-all text-sm font-semibold text-slate-500">
                      Orden: {solicitud.id}
                    </p>

                    {idsReasignadas.has(solicitud.id) && (
                      <span className="mt-3 inline-flex rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
                        🔄 {historial.filter((item) => item.request_id === solicitud.id).length} reasignación(es)
                      </span>
                    )}
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      router.push(
                        `/admin/trabajos/${solicitud.id}`
                      )
                    }
                    className="w-full shrink-0 rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white hover:bg-blue-800 sm:w-auto"
                  >
                    🔎 Ver detalle del trabajo
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <section className="mt-10">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-widest text-purple-700">
                Historial operativo
              </p>
              <h2 className="mt-1 text-3xl font-black text-slate-950">
                Historial de reasignaciones
              </h2>
              <p className="mt-2 text-slate-600">
                Registro de órdenes que fueron liberadas o devueltas por profesionales.
              </p>
            </div>

            <span className="w-fit rounded-full bg-purple-100 px-4 py-2 text-sm font-extrabold text-purple-800">
              {reasignadas} orden(es) reasignada(s)
            </span>
          </div>

          {historial.length === 0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow">
              <div className="text-5xl">📋</div>
              <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                Todavía no hay reasignaciones
              </h3>
              <p className="mt-2 text-slate-600">
                Cuando un profesional libere un trabajo aparecerá registrado aquí.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {historial.map((item) => {
                const trabajo = solicitudes.find(
                  (solicitud) => solicitud.id === item.request_id
                );

                const profesional = item.provider_id
                  ? providers.find(
                      (provider) => provider.user_id === item.provider_id
                    )
                  : null;

                return (
                  <article
                    key={item.id}
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow"
                  >
                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">
                      <div className="flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
                            🔄 Reasignación
                          </span>
                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                            {item.action === "provider_released"
                              ? "Profesional liberó el trabajo"
                              : item.action}
                          </span>
                        </div>

                        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                          {trabajo?.title || "Trabajo"}
                        </h3>

                        {trabajo && (
                          <p className="mt-1 text-slate-600">
                            📍 {trabajo.city}, {trabajo.state}
                          </p>
                        )}
                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {new Intl.DateTimeFormat("es-US", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "numeric",
                          minute: "2-digit",
                        }).format(new Date(item.created_at))}
                      </div>
                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">
                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm font-bold text-slate-500">
                          Profesional
                        </p>
                        <p className="mt-1 text-lg font-extrabold text-slate-900">
                          {profesional?.business_name || "Profesional"}
                        </p>
                        <p className="mt-1 text-sm text-blue-700">
                          {profesional?.trade || "Especialidad no disponible"}
                        </p>
                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">
                        <p className="text-sm font-bold text-slate-500">
                          Motivo
                        </p>
                        <p className="mt-1 font-semibold leading-6 text-slate-800">
                          {item.reason || "Sin motivo registrado"}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                      <div className="flex flex-wrap gap-2 text-xs text-slate-500">
                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          Orden: {item.request_id}
                        </span>
                        {trabajo && (
                          <span className="rounded-lg bg-slate-100 px-3 py-2">
                            Estado actual: {nombreEstadoOrden(trabajo.status, trabajo.job_stage)}
                          </span>
                        )}
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(`/admin/trabajos/${item.request_id}`)
                        }
                        className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white hover:bg-blue-800"
                      >
                        🔎 Ver expediente de la orden
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function Resumen({
  titulo,
  valor,
  activo,
  onClick,
}: {
  titulo: string;
  valor: number;
  activo: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-2xl border bg-white p-5 text-left shadow transition ${
        activo
          ? "border-blue-500 ring-2 ring-blue-100"
          : "border-slate-200 hover:border-blue-300"
      }`}
    >
      <p className="text-sm font-bold text-slate-500">
        {titulo}
      </p>
      <p className="mt-2 text-3xl font-black text-slate-950">
        {valor}
      </p>
    </button>
  );
}