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

  created_at?: string | null;
};

type DocumentRow = {
  id?: string;
  user_id: string;
  document_type: string;
  file_path: string;
  status: string | null;
};

type ReassignmentHistory = {
  id: string;
  request_id: string;
  provider_id: string | null;
  action: string;
  reason: string | null;
  created_at: string;
};

type TrabajoHistorial = {
  id: string;
  title: string;
  city: string;
  state: string;
  status: string;
};

type ProviderHistorial = {
  user_id: string;
  business_name: string | null;
  trade: string | null;
};

type HistorialCompleto = ReassignmentHistory & {
  trabajo: TrabajoHistorial | null;
  profesional: ProviderHistorial | null;
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

type JobClaim = {
  id: string;
  request_id: string;
  customer_id: string;
  provider_id: string;
  reason: string;
  description: string | null;
  customer_evidence_note: string | null;
  provider_response: string | null;
  provider_response_deadline: string | null;
  provider_responded_at: string | null;
  status: "open" | "reviewing" | "resolved" | "rejected";
  resolution_notes: string | null;
  resolution_type:
    | "pay_provider"
    | "refund_customer"
    | "partial"
    | null;
  provider_award_amount: number | null;
  customer_refund_amount: number | null;
  resolved_at: string | null;
  resolved_by: string | null;
  created_at: string;
  updated_at: string;
};

type ClaimEvidenceAdmin = {
  id: string;
  claim_id: string;
  uploaded_by: string;
  uploaded_by_role: "customer" | "provider";
  file_type: "image" | "video";
  file_url: string;
  file_path: string;
  created_at: string;
  signed_url: string | null;
};

type FiltroOrden =
  | "todas"
  | "open"
  | "in_progress"
  | "completed"
  | "cancelled";

type FiltroProfesional =
  | "todos"
  | "activos"
  | "suspendidos"
  | "pendientes"
  | "rechazados";

type FiltroReclamo =
  | "todos"
  | "open"
  | "reviewing"
  | "closed";

function nombreOficio(
  trade: string | null
) {
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

  if (!trade) {
    return "No indicado";
  }

  return nombres[trade] || trade;
}

function formatearFecha(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-US",
    {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    new Date(fecha)
  );
}

function calcularEstadoPlazoProfesional(
  deadline: string | null,
  providerResponse: string | null
) {
  if (providerResponse) {
    return {
      vencido: false,
      puedeResolver: true,
      texto: "Profesional respondió",
    };
  }

  if (!deadline) {
    return {
      vencido: false,
      puedeResolver: false,
      texto: "Esperando fecha límite",
    };
  }

  const diferencia =
    new Date(deadline).getTime() -
    Date.now();

  if (diferencia <= 0) {
    return {
      vencido: true,
      puedeResolver: true,
      texto: "Plazo vencido",
    };
  }

  const totalMinutos =
    Math.floor(
      diferencia / 60000
    );

  const horas =
    Math.floor(
      totalMinutos / 60
    );

  const minutos =
    totalMinutos % 60;

  return {
    vencido: false,
    puedeResolver: false,
    texto:
      horas > 0
        ? `${horas} h ${minutos} min restantes`
        : `${minutos} min restantes`,
  };
}

function nombreAccion(
  action: string
) {
  if (
    action ===
    "provider_released"
  ) {
    return "Profesional liberó el trabajo";
  }

  return action;
}

function nombreEstadoReclamo(
  status: JobClaim["status"]
) {
  if (status === "open") {
    return "Abierto";
  }

  if (status === "reviewing") {
    return "En revisión";
  }

  if (status === "resolved") {
    return "Resuelto";
  }

  return "Rechazado";
}

function estiloEstadoReclamo(
  status: JobClaim["status"]
) {
  if (status === "open") {
    return "bg-red-100 text-red-800";
  }

  if (status === "reviewing") {
    return "bg-amber-100 text-amber-800";
  }

  if (status === "resolved") {
    return "bg-green-100 text-green-800";
  }

  return "bg-slate-200 text-slate-700";
}

function nombreEstadoCuenta(
  provider: Provider
) {
  if (
    provider.verification_status ===
    "rejected"
  ) {
    return "Rechazado";
  }

  if (
    provider.verified === true &&
    provider.active === true
  ) {
    return "Activo";
  }

  if (
    provider.verified === true &&
    provider.active !== true
  ) {
    return "Suspendido";
  }

  if (
    provider.verification_status ===
    "pending"
  ) {
    return "Pendiente";
  }

  return "Inactivo";
}

function estiloEstadoCuenta(
  provider: Provider
) {
  if (
    provider.verification_status ===
    "rejected"
  ) {
    return "bg-red-100 text-red-800";
  }

  if (
    provider.verified === true &&
    provider.active === true
  ) {
    return "bg-green-100 text-green-800";
  }

  if (
    provider.verified === true &&
    provider.active !== true
  ) {
    return "bg-amber-100 text-amber-800";
  }

  if (
    provider.verification_status ===
    "pending"
  ) {
    return "bg-blue-100 text-blue-800";
  }

  return "bg-slate-100 text-slate-700";
}

function nombreEstadoOrden(
  status: string,
  jobStage: string | null
) {
  if (status === "open") {
    return "Abierta";
  }

  if (status === "completed") {
    return "Completada";
  }

  if (status === "cancelled") {
    return "Cancelada";
  }

  if (status === "in_progress") {
    if (jobStage === "on_the_way") {
      return "Profesional en camino";
    }

    if (jobStage === "arrived") {
      return "Profesional llegó";
    }

    if (jobStage === "working") {
      return "Trabajo iniciado";
    }

    return "Profesional contratado";
  }

  return status;
}

function estiloEstadoOrden(
  status: string,
  jobStage: string | null
) {
  if (status === "open") {
    return "bg-blue-100 text-blue-800";
  }

  if (status === "completed") {
    return "bg-green-100 text-green-800";
  }

  if (status === "cancelled") {
    return "bg-red-100 text-red-800";
  }

  if (status === "in_progress") {
    if (jobStage === "working") {
      return "bg-amber-100 text-amber-800";
    }

    if (jobStage === "arrived") {
      return "bg-purple-100 text-purple-800";
    }

    if (jobStage === "on_the_way") {
      return "bg-sky-100 text-sky-800";
    }

    return "bg-emerald-100 text-emerald-800";
  }

  return "bg-slate-100 text-slate-700";
}

export default function AdminPage() {
  const router =
    useRouter();

  /*
    PROFESIONALES PENDIENTES
  */

  const [
    providers,
    setProviders,
  ] =
    useState<Provider[]>([]);

  /*
    TODOS LOS PROFESIONALES
  */

  const [
    todosProviders,
    setTodosProviders,
  ] =
    useState<Provider[]>([]);

  const [
    documents,
    setDocuments,
  ] =
    useState<DocumentRow[]>([]);

  const [
    historial,
    setHistorial,
  ] =
    useState<HistorialCompleto[]>(
      []
    );

  const [
    solicitudesAdmin,
    setSolicitudesAdmin,
  ] =
    useState<SolicitudAdmin[]>(
      []
    );

  const [
    reclamos,
    setReclamos,
  ] =
    useState<JobClaim[]>(
      []
    );

  const [
    evidenciasReclamos,
    setEvidenciasReclamos,
  ] =
    useState<ClaimEvidenceAdmin[]>(
      []
    );

  const [
    filtroReclamo,
    setFiltroReclamo,
  ] =
    useState<FiltroReclamo>(
      "todos"
    );

  const [
    procesandoReclamo,
    setProcesandoReclamo,
  ] =
    useState<string | null>(
      null
    );

  const [
    relojReclamos,
    setRelojReclamos,
  ] =
    useState(
      Date.now()
    );

  const [
    buscandoOrden,
    setBuscandoOrden,
  ] =
    useState("");

  const [
    filtroOrden,
    setFiltroOrden,
  ] =
    useState<FiltroOrden>(
      "todas"
    );

  const [
    loading,
    setLoading,
  ] =
    useState(true);

  const [
    verificandoAdmin,
    setVerificandoAdmin,
  ] =
    useState(true);

  const [
    error,
    setError,
  ] =
    useState("");

  const [
    mensaje,
    setMensaje,
  ] =
    useState("");

  const [
    procesando,
    setProcesando,
  ] =
    useState<string | null>(
      null
    );

  const [
    buscando,
    setBuscando,
  ] =
    useState("");

  const [
    filtro,
    setFiltro,
  ] =
    useState<FiltroProfesional>(
      "todos"
    );


  /*
    MODAL DE RESOLUCIÓN PARCIAL
  */

  const [
    reclamoParcial,
    setReclamoParcial,
  ] =
    useState<JobClaim | null>(
      null
    );

  const [
    totalPagoParcial,
    setTotalPagoParcial,
  ] =
    useState(0);

  const [
    maxProfesionalParcial,
    setMaxProfesionalParcial,
  ] =
    useState(0);

  const [
    montoProfesionalParcial,
    setMontoProfesionalParcial,
  ] =
    useState("");

  const [
    notaParcial,
    setNotaParcial,
  ] =
    useState("");

  const [
    errorParcial,
    setErrorParcial,
  ] =
    useState("");

  const [
    cargandoParcial,
    setCargandoParcial,
  ] =
    useState(false);

  /*
    CARGA INICIAL
  */

  useEffect(() => {
    verificarAdmin();
  }, []);

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setRelojReclamos(
            Date.now()
          );
        },
        60 * 1000
      );

    return () => {
      window.clearInterval(
        timer
      );
    };
  }, []);

  /*
    VERIFICAR ADMIN
  */

  async function verificarAdmin() {
    setVerificandoAdmin(
      true
    );

    setError("");

    const {
      data: {
        user,
      },
      error:
        authError,
    } =
      await supabase.auth.getUser();

    if (
      authError ||
      !user
    ) {
      router.replace(
        "/login-profesional"
      );

      return;
    }

    if (
      !user.email ||
      user.email.toLowerCase() !==
        ADMIN_EMAIL.toLowerCase()
    ) {
      router.replace(
        "/"
      );

      return;
    }

    setVerificandoAdmin(
      false
    );

    await cargarDatos();
  }

  /*
    CARGAR DATOS
  */

  async function cargarDatos() {
    setLoading(
      true
    );

    setError("");

    try {

      /*
        TODOS LOS PROFESIONALES
      */

      const {
        data:
          todosProviderData,
        error:
          todosProviderError,
      } = await supabase
        .from(
          "provider_profiles"
        )
        .select("*")
        .order(
          "created_at",
          {
            ascending: false,
          }
        );

      if (
        todosProviderError
      ) {
        throw new Error(
          `Error cargando profesionales: ${todosProviderError.message}`
        );
      }

      const todos =
        (todosProviderData ||
          []) as Provider[];

      setTodosProviders(
        todos
      );

      /*
        SOLO PENDIENTES
      */

      const pendientes =
        todos.filter(
          (provider) =>
            provider.verification_status ===
            "pending"
        );

      setProviders(
        pendientes
      );

      /*
        DOCUMENTOS
      */

      const {
        data:
          documentData,
        error:
          documentError,
      } = await supabase
        .from(
          "provider_documents"
        )
        .select("*");

      if (
        documentError
      ) {
        throw new Error(
          `Error cargando documentos: ${documentError.message}`
        );
      }

      setDocuments(
        (documentData ||
          []) as DocumentRow[]
      );

      /*
        TODAS LAS ÓRDENES
        DE LA PLATAFORMA
      */

      const {
        data: solicitudesData,
        error: solicitudesError,
      } = await supabase
        .from(
          "service_requests"
        )
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
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1000);

      if (solicitudesError) {
        throw new Error(
          `Error cargando órdenes: ${solicitudesError.message}`
        );
      }

      setSolicitudesAdmin(
        (solicitudesData ||
          []) as SolicitudAdmin[]
      );

      /*
        RECLAMOS
      */

      const {
        data: reclamosData,
        error: reclamosError,
      } = await supabase
        .from("job_claims")
        .select(`
          id,
          request_id,
          customer_id,
          provider_id,
          reason,
          description,
          customer_evidence_note,
          provider_response,
          provider_response_deadline,
          provider_responded_at,
          status,
          resolution_notes,
          resolution_type,
          provider_award_amount,
          customer_refund_amount,
          resolved_at,
          resolved_by,
          created_at,
          updated_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(500);

      if (reclamosError) {
        throw new Error(
          `Error cargando reclamos: ${reclamosError.message}`
        );
      }

      setReclamos(
        (reclamosData || []) as JobClaim[]
      );

      /*
        EVIDENCIAS DE RECLAMOS
      */

      const {
        data: evidenciasData,
        error: evidenciasError,
      } = await supabase
        .from("claim_evidence")
        .select(`
          id,
          claim_id,
          uploaded_by,
          uploaded_by_role,
          file_type,
          file_url,
          file_path,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: true,
          }
        )
        .limit(2000);

      if (evidenciasError) {
        console.error(
          "Error cargando evidencias de reclamos:",
          evidenciasError
        );

        setEvidenciasReclamos([]);
      } else {
        const evidenciasBase =
          (evidenciasData ||
            []) as Omit<
              ClaimEvidenceAdmin,
              "signed_url"
            >[];

        const evidenciasConUrl =
          await Promise.all(
            evidenciasBase.map(
              async (
                evidencia
              ) => {
                const ruta =
                  evidencia.file_path ||
                  evidencia.file_url;

                const {
                  data:
                    signedData,
                  error:
                    signedError,
                } =
                  await supabase.storage
                    .from(
                      "claim-evidence"
                    )
                    .createSignedUrl(
                      ruta,
                      60 * 60
                    );

                if (signedError) {
                  console.error(
                    "No se pudo crear URL firmada para evidencia:",
                    evidencia.id,
                    signedError
                  );
                }

                return {
                  ...evidencia,
                  signed_url:
                    signedData?.signedUrl ||
                    null,
                };
              }
            )
          );

        setEvidenciasReclamos(
          evidenciasConUrl
        );
      }

      /*
        HISTORIAL
      */

      const {
        data:
          historialData,
        error:
          historialError,
      } = await supabase
        .from(
          "job_reassignment_history"
        )
        .select(`
          id,
          request_id,
          provider_id,
          action,
          reason,
          created_at
        `)
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(
          500
        );

      if (
        historialError
      ) {
        throw new Error(
          `Error cargando historial de reasignaciones: ${historialError.message}`
        );
      }

      const historialBase =
        (historialData ||
          []) as ReassignmentHistory[];

      if (
        historialBase.length ===
        0
      ) {
        setHistorial(
          []
        );

        return;
      }

      /*
        REQUEST IDS
      */

      const requestIds =
        [
          ...new Set(
            historialBase.map(
              (item) =>
                item.request_id
            )
          ),
        ];

      /*
        PROVIDER IDS
      */

      const providerIds =
        [
          ...new Set(
            historialBase
              .map(
                (item) =>
                  item.provider_id
              )
              .filter(
                (
                  id
                ): id is string =>
                  Boolean(id)
              )
          ),
        ];

      /*
        DATOS DE TRABAJOS
      */

      let trabajos:
        TrabajoHistorial[] =
        [];

      if (
        requestIds.length >
        0
      ) {
        const {
          data:
            trabajosData,
          error:
            trabajosError,
        } = await supabase
          .from(
            "service_requests"
          )
          .select(`
            id,
            title,
            city,
            state,
            status
          `)
          .in(
            "id",
            requestIds
          );

        if (
          trabajosError
        ) {
          console.error(
            "No se pudo cargar información de los trabajos:",
            trabajosError
          );
        } else {
          trabajos =
            (trabajosData ||
              []) as TrabajoHistorial[];
        }
      }

      /*
        DATOS PROFESIONALES
        DEL HISTORIAL
      */

      let profesionales:
        ProviderHistorial[] =
        [];

      if (
        providerIds.length >
        0
      ) {
        const {
          data:
            profesionalesData,
          error:
            profesionalesError,
        } = await supabase
          .from(
            "provider_profiles"
          )
          .select(`
            user_id,
            business_name,
            trade
          `)
          .in(
            "user_id",
            providerIds
          );

        if (
          profesionalesError
        ) {
          console.error(
            "No se pudo cargar información de los profesionales:",
            profesionalesError
          );
        } else {
          profesionales =
            (profesionalesData ||
              []) as ProviderHistorial[];
        }
      }

      /*
        COMBINAR HISTORIAL
      */

      const historialCompleto =
        historialBase.map(
          (item) => ({
            ...item,

            trabajo:
              trabajos.find(
                (trabajo) =>
                  trabajo.id ===
                  item.request_id
              ) ||
              null,

            profesional:
              item.provider_id
                ? profesionales.find(
                    (
                      profesional
                    ) =>
                      profesional.user_id ===
                      item.provider_id
                  ) ||
                  null
                : null,
          })
        );

      setHistorial(
        historialCompleto
      );
    } catch (err) {
      console.error(
        "Error cargando admin:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(
        false
      );
    }
  }

  /*
    CONTAR LIBERACIONES
  */

  function contarLiberaciones(
    providerId: string
  ) {
    return historial.filter(
      (item) =>
        item.provider_id ===
          providerId &&
        item.action ===
          "provider_released"
    ).length;
  }

  /*
    DOCUMENTOS USUARIO
  */

  function docsDelUsuario(
    userId: string
  ) {
    return documents.filter(
      (doc) =>
        doc.user_id ===
        userId
    );
  }

  /*
    ABRIR DOCUMENTO
  */

  async function abrirDocumento(
    filePath: string
  ) {
    setError("");

    const {
      data,
      error:
        signedUrlError,
    } = await supabase.storage
      .from(
        "provider-documents"
      )
      .createSignedUrl(
        filePath,
        60
      );

    if (
      signedUrlError
    ) {
      setError(
        `No se pudo abrir el documento: ${signedUrlError.message}`
      );

      return;
    }

    if (
      !data?.signedUrl
    ) {
      setError(
        "No se pudo generar el enlace del documento."
      );

      return;
    }

    window.open(
      data.signedUrl,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    APROBAR / RECHAZAR
  */

  async function cambiarEstado(
    userId: string,
    nuevoEstado:
      | "verified"
      | "rejected"
  ) {
    setError("");
    setMensaje("");

    const userDocs =
      docsDelUsuario(
        userId
      );

    if (
      nuevoEstado ===
        "verified" &&
      userDocs.length ===
        0
    ) {
      setError(
        "No puedes aprobar este profesional porque no tiene documentos registrados."
      );

      return;
    }

    const confirmar =
      window.confirm(
        nuevoEstado ===
          "verified"
          ? "¿Seguro que deseas aprobar este profesional?"
          : "¿Seguro que deseas rechazar este profesional?"
      );

    if (!confirmar) {
      return;
    }

    setProcesando(
      userId
    );

    setError("");
    setMensaje("");

    try {
      const esVerificado =
        nuevoEstado ===
        "verified";

      const {
        error:
          profileError,
      } = await supabase
        .from(
          "provider_profiles"
        )
        .update({
          verification_status:
            nuevoEstado,

          verified:
            esVerificado,

          active:
            esVerificado,
        })
        .eq(
          "user_id",
          userId
        );

      if (
        profileError
      ) {
        throw new Error(
          `No se pudo actualizar el profesional: ${profileError.message}`
        );
      }

      if (
        userDocs.length >
        0
      ) {
        const {
          error:
            documentError,
        } = await supabase
          .from(
            "provider_documents"
          )
          .update({
            status:
              esVerificado
                ? "approved"
                : "rejected",
          })
          .eq(
            "user_id",
            userId
          );

        if (
          documentError
        ) {
          throw new Error(
            `El perfil cambió, pero hubo un problema actualizando los documentos: ${documentError.message}`
          );
        }
      }

      setMensaje(
        esVerificado
          ? "Profesional verificado correctamente."
          : "Profesional rechazado correctamente."
      );

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setProcesando(
        null
      );
    }
  }

  /*
    SUSPENDER / REACTIVAR
  */

  async function cambiarActivo(
    provider: Provider,
    nuevoActivo: boolean
  ) {
    setError("");
    setMensaje("");

    if (
      provider.verified !==
      true
    ) {
      setError(
        "Solo puedes suspender o reactivar profesionales que ya estén verificados."
      );

      return;
    }

    const nombre =
      provider.business_name ||
      "este profesional";

    const confirmar =
      window.confirm(
        nuevoActivo
          ? `¿Seguro que deseas reactivar a ${nombre}?`
          : `¿Seguro que deseas suspender a ${nombre}? Mientras esté suspendido no podrá acceder a nuevos trabajos.`
      );

    if (!confirmar) {
      return;
    }

    setProcesando(
      provider.user_id
    );

    try {
      const {
        error:
          updateError,
      } = await supabase
        .from(
          "provider_profiles"
        )
        .update({
          active:
            nuevoActivo,
        })
        .eq(
          "user_id",
          provider.user_id
        );

      if (
        updateError
      ) {
        throw new Error(
          `No se pudo actualizar la cuenta: ${updateError.message}`
        );
      }

      setMensaje(
        nuevoActivo
          ? `${nombre} fue reactivado correctamente.`
          : `${nombre} fue suspendido correctamente.`
      );

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo cambiar el estado del profesional."
      );
    } finally {
      setProcesando(
        null
      );
    }
  }

  /*
    PASAR RECLAMO A REVISIÓN
  */

  async function pasarReclamoARevision(
    reclamo: JobClaim
  ) {
    setError("");
    setMensaje("");

    const confirmar =
      window.confirm(
        "¿Marcar este reclamo como En revisión? El pago continuará retenido."
      );

    if (!confirmar) {
      return;
    }

    setProcesandoReclamo(
      reclamo.id
    );

    try {
      const {
        error: updateError,
      } = await supabase
        .from("job_claims")
        .update({
          status: "reviewing",
          updated_at:
            new Date().toISOString(),
        })
        .eq(
          "id",
          reclamo.id
        );

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      setMensaje(
        "Reclamo marcado como En revisión. El pago continúa retenido."
      );

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el reclamo."
      );
    } finally {
      setProcesandoReclamo(
        null
      );
    }
  }

  /*
    ABRIR RESOLUCIÓN PARCIAL
  */

  async function abrirResolucionParcial(
    reclamo: JobClaim
  ) {
    setError("");
    setMensaje("");
    setErrorParcial("");
    setNotaParcial("");
    setMontoProfesionalParcial("");
    setCargandoParcial(true);

    try {
      const pago =
        await supabase
          .from("payments")
          .select(`
            provider_net_amount,
            customer_total_amount
          `)
          .eq(
            "request_id",
            reclamo.request_id
          )
          .eq(
            "provider_id",
            reclamo.provider_id
          )
          .eq(
            "customer_id",
            reclamo.customer_id
          )
          .order(
            "updated_at",
            {
              ascending: false,
            }
          )
          .limit(1)
          .maybeSingle();

      if (pago.error) {
        throw new Error(
          `No pudimos consultar los importes del pago: ${pago.error.message}`
        );
      }

      if (!pago.data) {
        throw new Error(
          "No encontramos el pago relacionado con este reclamo."
        );
      }

      const total =
        Number(
          pago.data.customer_total_amount
        );

      const maxProfesional =
        Number(
          pago.data.provider_net_amount
        );

      if (
        !Number.isFinite(total) ||
        total <= 0 ||
        !Number.isFinite(
          maxProfesional
        ) ||
        maxProfesional <= 0
      ) {
        throw new Error(
          "Los importes guardados del pago no son válidos."
        );
      }

      setTotalPagoParcial(
        Math.round(
          (total +
            Number.EPSILON) *
            100
        ) / 100
      );

      setMaxProfesionalParcial(
        Math.round(
          (maxProfesional +
            Number.EPSILON) *
            100
        ) / 100
      );

      setReclamoParcial(
        reclamo
      );
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo abrir la resolución parcial."
      );
    } finally {
      setCargandoParcial(false);
    }
  }

  function cerrarResolucionParcial() {
    if (procesandoReclamo) {
      return;
    }

    setReclamoParcial(null);
    setMontoProfesionalParcial("");
    setNotaParcial("");
    setErrorParcial("");
    setTotalPagoParcial(0);
    setMaxProfesionalParcial(0);
  }

  function montoProfesionalParcialNumero() {
    const numero =
      Number(
        montoProfesionalParcial
      );

    if (
      !Number.isFinite(numero)
    ) {
      return 0;
    }

    return Math.round(
      (numero +
        Number.EPSILON) *
        100
    ) / 100;
  }

  function reembolsoClienteParcialNumero() {
    const profesional =
      montoProfesionalParcialNumero();

    return Math.max(
      0,
      Math.round(
        (
          totalPagoParcial -
          profesional +
          Number.EPSILON
        ) *
          100
      ) / 100
    );
  }

  async function confirmarResolucionParcial() {
    if (!reclamoParcial) {
      return;
    }

    setErrorParcial("");

    const profesional =
      montoProfesionalParcialNumero();

    const cliente =
      reembolsoClienteParcialNumero();

    if (
      !montoProfesionalParcial.trim()
    ) {
      setErrorParcial(
        "Escribe cuánto recibirá el profesional."
      );
      return;
    }

    if (
      !Number.isFinite(
        profesional
      ) ||
      profesional < 0
    ) {
      setErrorParcial(
        "El importe para el profesional no es válido."
      );
      return;
    }

    if (
      profesional >
      maxProfesionalParcial
    ) {
      setErrorParcial(
        `El profesional no puede recibir más de $${maxProfesionalParcial.toFixed(
          2
        )}.`
      );
      return;
    }

    if (
      profesional >
      totalPagoParcial
    ) {
      setErrorParcial(
        `El profesional no puede recibir más de los $${totalPagoParcial.toFixed(
          2
        )} disponibles.`
      );
      return;
    }

    if (!notaParcial.trim()) {
      setErrorParcial(
        "Escribe una nota explicando la resolución."
      );
      return;
    }

    const confirmar =
      window.confirm(
        `¿Confirmas esta resolución?\n\nProfesional: $${profesional.toFixed(
          2
        )}\nCliente: $${cliente.toFixed(
          2
        )}\nTotal: $${totalPagoParcial.toFixed(
          2
        )}`
      );

    if (!confirmar) {
      return;
    }

    await resolverReclamo(
      reclamoParcial,
      "partial",
      {
        notes:
          notaParcial.trim(),
        providerAwardAmount:
          profesional,
        customerRefundAmount:
          cliente,
      }
    );
  }

  /*
    RESOLVER RECLAMO CON DECISIÓN ECONÓMICA
  */

  async function resolverReclamo(
    reclamo: JobClaim,
    action:
      | "pay_provider"
      | "refund_customer"
      | "partial",
    partialData?: {
      notes: string;
      providerAwardAmount: number;
      customerRefundAmount: number;
    }
  ) {
    setError("");
    setMensaje("");

    const estadoPlazo =
      calcularEstadoPlazoProfesional(
        reclamo.provider_response_deadline,
        reclamo.provider_response
      );

    const requiereOverridePlazo =
      !reclamo.provider_response &&
      !estadoPlazo.vencido;

    let overrideResponseWindow =
      false;

    if (requiereOverridePlazo) {
      const confirmarAnticipado =
        window.confirm(
          `El profesional todavía está dentro de su plazo de 24 horas para responder (${estadoPlazo.texto}).\n\n¿Deseas resolver este reclamo ahora de todos modos?`
        );

      if (!confirmarAnticipado) {
        return;
      }

      overrideResponseWindow =
        true;
    }

    let notes = "";
    let providerAwardAmount:
      number | undefined;
    let customerRefundAmount:
      number | undefined;

    if (action === "pay_provider") {
      const respuesta =
        window.prompt(
          "Escribe una nota explicando por qué el pago debe liberarse al profesional:"
        );

      if (respuesta === null) {
        return;
      }

      notes =
        respuesta.trim();

      if (!notes) {
        setError(
          "Debes escribir una nota para resolver el reclamo."
        );
        return;
      }

      const confirmar =
        window.confirm(
          "¿Confirmas que deseas cerrar el reclamo y liberar al profesional el importe que le corresponde?"
        );

      if (!confirmar) {
        return;
      }
    }

    if (action === "refund_customer") {
      const respuesta =
        window.prompt(
          "Escribe una nota explicando por qué el cliente recibirá un reembolso completo:"
        );

      if (respuesta === null) {
        return;
      }

      notes =
        respuesta.trim();

      if (!notes) {
        setError(
          "Debes escribir una nota para resolver el reclamo."
        );
        return;
      }

      const confirmar =
        window.confirm(
          "¿Confirmas que deseas cerrar el reclamo y reembolsar al cliente el total pagado?"
        );

      if (!confirmar) {
        return;
      }
    }

    if (action === "partial") {
      if (!partialData) {
        await abrirResolucionParcial(
          reclamo
        );
        return;
      }

      notes =
        partialData.notes;

      providerAwardAmount =
        partialData.providerAwardAmount;

      customerRefundAmount =
        partialData.customerRefundAmount;
    }

    setProcesandoReclamo(
      reclamo.id
    );

    try {
      const {
        data: sessionData,
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        throw new Error(
          "No pudimos verificar tu sesión de administrador."
        );
      }

      const response =
        await fetch(
          "/api/admin/claims/resolve",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              claimId:
                reclamo.id,
              action,
              notes,
              providerAwardAmount,
              customerRefundAmount,
              overrideResponseWindow,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo resolver el reclamo."
        );
      }

      if (
        action === "pay_provider"
      ) {
        setMensaje(
          `Reclamo resuelto. Se liberaron $${Number(
            data.providerAwardAmount
          ).toFixed(
            2
          )} al profesional.`
        );
      } else if (
        action ===
        "refund_customer"
      ) {
        setMensaje(
          `Reclamo resuelto. Se reembolsaron $${Number(
            data.customerRefundAmount
          ).toFixed(
            2
          )} al cliente.`
        );
      } else {
        setMensaje(
          `Resolución parcial completada. Profesional: $${Number(
            data.providerAwardAmount
          ).toFixed(
            2
          )} · Cliente: $${Number(
            data.customerRefundAmount
          ).toFixed(
            2
          )}.`
        );

        setReclamoParcial(
          null
        );
        setMontoProfesionalParcial(
          ""
        );
        setNotaParcial(
          ""
        );
        setErrorParcial(
          ""
        );
        setTotalPagoParcial(
          0
        );
        setMaxProfesionalParcial(
          0
        );
      }

      await cargarDatos();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo resolver el reclamo."
      );
    } finally {
      setProcesandoReclamo(
        null
      );
    }
  }


  /*
    NAVEGACIÓN RÁPIDA DEL ADMIN
  */

  function irASeccionAdmin(
    id: string
  ) {
    window.setTimeout(() => {
      document
        .getElementById(id)
        ?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
    }, 50);
  }

  /*
    CERRAR SESIÓN
  */

  async function cerrarSesion() {
    await supabase.auth.signOut();

    router.replace(
      "/login-profesional"
    );
  }

  /*
    CONTADORES
  */

  const totalActivos =
    todosProviders.filter(
      (provider) =>
        provider.verified ===
          true &&
        provider.active ===
          true
    ).length;

  const totalSuspendidos =
    todosProviders.filter(
      (provider) =>
        provider.verified ===
          true &&
        provider.active !==
          true
    ).length;

  const totalRechazados =
    todosProviders.filter(
      (provider) =>
        provider.verification_status ===
        "rejected"
    ).length;

  const totalReclamosActivos =
    reclamos.filter(
      (reclamo) =>
        reclamo.status === "open" ||
        reclamo.status === "reviewing"
    ).length;

  const totalReclamosAbiertos =
    reclamos.filter(
      (reclamo) =>
        reclamo.status === "open"
    ).length;

  const totalReclamosRevision =
    reclamos.filter(
      (reclamo) =>
        reclamo.status === "reviewing"
    ).length;

  const totalReclamosCerrados =
    reclamos.filter(
      (reclamo) =>
        reclamo.status === "resolved" ||
        reclamo.status === "rejected"
    ).length;

  const totalOrdenesAbiertas =
    solicitudesAdmin.filter(
      (solicitud) =>
        solicitud.status ===
        "open"
    ).length;

  const totalOrdenesProgreso =
    solicitudesAdmin.filter(
      (solicitud) =>
        solicitud.status ===
        "in_progress"
    ).length;

  const totalOrdenesCompletadas =
    solicitudesAdmin.filter(
      (solicitud) =>
        solicitud.status ===
        "completed"
    ).length;

  const totalOrdenesCanceladas =
    solicitudesAdmin.filter(
      (solicitud) =>
        solicitud.status ===
        "cancelled"
    ).length;

  const reclamosFiltrados =
    useMemo(
      () => {
        if (
          filtroReclamo ===
          "open"
        ) {
          return reclamos.filter(
            (reclamo) =>
              reclamo.status ===
              "open"
          );
        }

        if (
          filtroReclamo ===
          "reviewing"
        ) {
          return reclamos.filter(
            (reclamo) =>
              reclamo.status ===
              "reviewing"
          );
        }

        if (
          filtroReclamo ===
          "closed"
        ) {
          return reclamos.filter(
            (reclamo) =>
              reclamo.status ===
                "resolved" ||
              reclamo.status ===
                "rejected"
          );
        }

        return reclamos;
      },
      [
        reclamos,
        filtroReclamo,
      ]
    );

  const ordenesFiltradas =
    useMemo(
      () => {
        const texto =
          buscandoOrden
            .trim()
            .toLowerCase();

        return solicitudesAdmin.filter(
          (solicitud) => {
            if (
              filtroOrden !==
                "todas" &&
              solicitud.status !==
                filtroOrden
            ) {
              return false;
            }

            if (!texto) {
              return true;
            }

            const profesional =
              solicitud.preferred_provider_id
                ? todosProviders.find(
                    (provider) =>
                      provider.user_id ===
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

            return campos.includes(
              texto
            );
          }
        );
      },
      [
        solicitudesAdmin,
        buscandoOrden,
        filtroOrden,
        todosProviders,
      ]
    );

  /*
    FILTRAR PROFESIONALES
  */

  const profesionalesFiltrados =
    useMemo(
      () => {
        const texto =
          buscando
            .trim()
            .toLowerCase();

        return todosProviders.filter(
          (provider) => {
            /*
              FILTRO ESTADO
            */

            let pasaFiltro =
              true;

            if (
              filtro ===
              "activos"
            ) {
              pasaFiltro =
                provider.verified ===
                  true &&
                provider.active ===
                  true;
            }

            if (
              filtro ===
              "suspendidos"
            ) {
              pasaFiltro =
                provider.verified ===
                  true &&
                provider.active !==
                  true;
            }

            if (
              filtro ===
              "pendientes"
            ) {
              pasaFiltro =
                provider.verification_status ===
                "pending";
            }

            if (
              filtro ===
              "rechazados"
            ) {
              pasaFiltro =
                provider.verification_status ===
                "rejected";
            }

            if (
              !pasaFiltro
            ) {
              return false;
            }

            /*
              BUSCADOR
            */

            if (!texto) {
              return true;
            }

            const nombre =
              (
                provider.business_name ||
                ""
              ).toLowerCase();

            const oficio =
              nombreOficio(
                provider.trade
              ).toLowerCase();

            const id =
              provider.user_id.toLowerCase();

            return (
              nombre.includes(
                texto
              ) ||
              oficio.includes(
                texto
              ) ||
              id.includes(
                texto
              )
            );
          }
        );
      },
      [
        todosProviders,
        buscando,
        filtro,
      ]
    );

  /*
    CARGANDO
  */

  if (
    verificandoAdmin
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">

          <p className="font-bold text-slate-800">
            Verificando acceso de administrador...
          </p>

        </div>

      </main>
    );
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">

          <p className="font-bold text-slate-800">
            Cargando panel...
          </p>

        </div>

      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">

      <div className="mx-auto max-w-6xl">

        {/* HEADER */}

        <div className="mb-8 rounded-3xl bg-blue-700 px-8 py-7 text-white shadow-lg">

          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

            <div>

              <div className="text-2xl font-black">
                FixFlow
              </div>

              <h1 className="mt-2 text-3xl font-extrabold">
                Panel de administrador
              </h1>

              <p className="mt-2 text-blue-100">
                Verifica profesionales, supervisa su actividad y controla la plataforma.
              </p>

            </div>

            <div className="flex flex-col items-start gap-3 md:items-end">

              <div className="rounded-xl bg-blue-800 px-4 py-2 text-sm font-semibold">
                Administrador
              </div>

              <div className="text-sm text-blue-100">
                {ADMIN_EMAIL}
              </div>

              <button
                type="button"
                onClick={
                  cerrarSesion
                }
                className="rounded-lg border border-white/30 bg-white/10 px-4 py-2 text-sm font-bold text-white hover:bg-white/20"
              >
                Cerrar sesión
              </button>

            </div>

          </div>

        </div>

        {/* MENSAJES */}

        {error && (
          <div className="mb-6 rounded-xl border border-red-300 bg-red-50 p-4 font-medium text-red-700">
            {error}
          </div>
        )}

        {mensaje && (
          <div className="mb-6 rounded-xl border border-green-300 bg-green-50 p-4 font-medium text-green-700">
            {mensaje}
          </div>
        )}

        {/* RESUMEN */}

        <section className="mb-10">

          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 xl:grid-cols-7">

            <TarjetaResumen
              titulo="Profesionales"
              valor={
                todosProviders.length
              }
              clase="text-slate-900"
              onClick={() => {
                setFiltro("todos");
                irASeccionAdmin(
                  "profesionales-admin"
                );
              }}
            />

            <TarjetaResumen
              titulo="Activos"
              valor={
                totalActivos
              }
              clase="text-green-700"
              onClick={() => {
                setFiltro("activos");
                irASeccionAdmin(
                  "profesionales-admin"
                );
              }}
            />

            <TarjetaResumen
              titulo="Suspendidos"
              valor={
                totalSuspendidos
              }
              clase="text-red-700"
              onClick={() => {
                setFiltro(
                  "suspendidos"
                );
                irASeccionAdmin(
                  "profesionales-admin"
                );
              }}
            />

            <TarjetaResumen
              titulo="Pendientes"
              valor={
                providers.length
              }
              clase="text-amber-700"
              onClick={() => {
                setFiltro(
                  "pendientes"
                );
                irASeccionAdmin(
                  "profesionales-admin"
                );
              }}
            />

            <TarjetaResumen
              titulo="Reasignaciones"
              valor={
                historial.length
              }
              clase="text-purple-700"
              onClick={() =>
                irASeccionAdmin(
                  "reasignaciones-admin"
                )
              }
            />

            <TarjetaResumen
              titulo="Órdenes"
              valor={
                solicitudesAdmin.length
              }
              clase="text-blue-700"
              onClick={() => {
                setFiltroOrden(
                  "todas"
                );
                irASeccionAdmin(
                  "ordenes-admin"
                );
              }}
            />

            <TarjetaResumen
              titulo="Reclamos activos"
              valor={
                totalReclamosActivos
              }
              clase="text-red-700"
              onClick={() => {
                setFiltroReclamo(
                  "todos"
                );
                irASeccionAdmin(
                  "reclamos-admin"
                );
              }}
            />

          </div>

        </section>

        {/* ACCESOS ADMINISTRATIVOS */}

        <section className="mb-10">
          <div className="mb-5">
            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Accesos administrativos
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
              Herramientas de control
            </h2>

            <p className="mt-2 text-slate-600">
              Entra directamente a las áreas que necesitas administrar sin llenar el panel principal.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/configuracion-financiera"
                )
              }
              className="rounded-3xl border border-emerald-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-emerald-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-2xl">
                  💰
                </div>

                <span className="text-xl font-black text-emerald-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Configuración financiera
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Comisiones, tarifa al cliente, cancelaciones y porcentajes para el profesional.
              </p>

              <p className="mt-5 text-sm font-black text-emerald-700">
                Administrar configuración
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/reclamos"
                )
              }
              className="rounded-3xl border border-red-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-red-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-100 text-2xl">
                  ⚠️
                </div>

                <span className="text-xl font-black text-red-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Reclamos de trabajos
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Revisa disputas abiertas, en revisión y reclamos ya resueltos.
              </p>

              <p className="mt-5 text-sm font-black text-red-700">
                {totalReclamosActivos} reclamo{totalReclamosActivos === 1 ? "" : "s"} activo{totalReclamosActivos === 1 ? "" : "s"}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/ordenes"
                )
              }
              className="rounded-3xl border border-blue-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-blue-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-blue-100 text-2xl">
                  📋
                </div>

                <span className="text-xl font-black text-blue-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Control de órdenes
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consulta todas las órdenes y abre el expediente completo de cada trabajo.
              </p>

              <p className="mt-5 text-sm font-black text-blue-700">
                {solicitudesAdmin.length} orden{solicitudesAdmin.length === 1 ? "" : "es"} registrada{solicitudesAdmin.length === 1 ? "" : "s"}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/finanzas"
                )
              }
              className="rounded-3xl border border-violet-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-violet-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100 text-2xl">
                  📊
                </div>

                <span className="text-xl font-black text-violet-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Finanzas y ganancias
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Controla ingresos de RELYDO, volumen procesado, pagos al profesional, retenciones y reembolsos.
              </p>

              <p className="mt-5 text-sm font-black text-violet-700">
                Abrir panel financiero
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/usuarios"
                )
              }
              className="rounded-3xl border border-cyan-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-cyan-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-cyan-100 text-2xl">
                  👥
                </div>

                <span className="text-xl font-black text-cyan-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Gestión de usuarios
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Consulta clientes y profesionales, teléfonos, contacto y actividad dentro de RELYDO.
              </p>

              <p className="mt-5 text-sm font-black text-cyan-700">
                Abrir gestión de usuarios
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/alertas"
                )
              }
              className="rounded-3xl border border-amber-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-amber-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-100 text-2xl">
                  🔔
                </div>
                <span className="text-xl font-black text-amber-700">→</span>
              </div>
              <h3 className="mt-5 text-xl font-black text-slate-950">
                Centro de alertas
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                Revisa reclamos activos, profesionales pendientes y situaciones que requieren atención.
              </p>
              <p className="mt-5 text-sm font-black text-amber-700">
                {totalReclamosActivos + providers.length} alerta{totalReclamosActivos + providers.length === 1 ? "" : "s"} pendiente{totalReclamosActivos + providers.length === 1 ? "" : "s"}
              </p>
            </button>

            <button
              type="button"
              onClick={() =>
                router.push(
                  "/admin/actividad"
                )
              }
              className="rounded-3xl border border-indigo-200 bg-white p-6 text-left shadow transition hover:-translate-y-0.5 hover:border-indigo-400 hover:shadow-lg"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-indigo-100 text-2xl">
                  📈
                </div>

                <span className="text-xl font-black text-indigo-700">
                  →
                </span>
              </div>

              <h3 className="mt-5 text-xl font-black text-slate-950">
                Actividad de la plataforma
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Mide trabajos, ofertas, clientes, profesionales y el rendimiento operativo de RELYDO.
              </p>

              <p className="mt-5 text-sm font-black text-indigo-700">
                Ver actividad
              </p>
            </button>
          </div>
        </section>

        {/* CONTROL PROFESIONALES */}

        <section id="profesionales-admin" className="mb-10 scroll-mt-6">

          <div className="mb-5">

            <p className="text-sm font-bold uppercase tracking-wide text-purple-700">
              Control
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
                  Control de profesionales
                </h2>

                <p className="mt-2 text-slate-600">
                  Revisa actividad, calificaciones, liberaciones y estado de cada cuenta.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  cargarDatos()
                }
                className="w-fit rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
              >
                ↻ Actualizar
              </button>

            </div>

          </div>

          {/* BUSCADOR */}

          <div className="mb-5 rounded-3xl border border-slate-200 bg-white p-5 shadow">

            <input
              type="text"
              value={
                buscando
              }
              onChange={(e) =>
                setBuscando(
                  e.target.value
                )
              }
              placeholder="Buscar por negocio, especialidad o ID..."
              className="w-full rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-blue-500"
            />

            <div className="mt-4 flex flex-wrap gap-2">

              <FiltroBoton
                activo={
                  filtro ===
                  "todos"
                }
                texto="Todos"
                onClick={() =>
                  setFiltro(
                    "todos"
                  )
                }
              />

              <FiltroBoton
                activo={
                  filtro ===
                  "activos"
                }
                texto="Activos"
                onClick={() =>
                  setFiltro(
                    "activos"
                  )
                }
              />

              <FiltroBoton
                activo={
                  filtro ===
                  "suspendidos"
                }
                texto="Suspendidos"
                onClick={() =>
                  setFiltro(
                    "suspendidos"
                  )
                }
              />

              <FiltroBoton
                activo={
                  filtro ===
                  "pendientes"
                }
                texto="Pendientes"
                onClick={() =>
                  setFiltro(
                    "pendientes"
                  )
                }
              />

              <FiltroBoton
                activo={
                  filtro ===
                  "rechazados"
                }
                texto="Rechazados"
                onClick={() =>
                  setFiltro(
                    "rechazados"
                  )
                }
              />

            </div>

          </div>

          {profesionalesFiltrados.length ===
          0 ? (
            <div className="rounded-3xl bg-white p-8 text-center shadow">

              <p className="font-bold text-slate-700">
                No encontramos profesionales con esos filtros.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {profesionalesFiltrados.map(
                (
                  provider
                ) => {
                  const liberaciones =
                    contarLiberaciones(
                      provider.user_id
                    );

                  return (
                    <article
                      key={
                        provider.user_id
                      }
                      className="rounded-3xl border border-slate-200 bg-white p-6 shadow"
                    >

                      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">

                        <div>

                          <h3 className="text-2xl font-extrabold text-slate-900">
                            {provider.business_name ||
                              "Profesional RELYDO"}
                          </h3>

                          <p className="mt-1 font-semibold text-blue-700">
                            {nombreOficio(
                              provider.trade
                            )}
                          </p>

                          <p className="mt-2 break-all text-xs text-slate-400">
                            {
                              provider.user_id
                            }
                          </p>

                        </div>

                        <span
                          className={`w-fit rounded-full px-4 py-2 text-sm font-extrabold ${estiloEstadoCuenta(
                            provider
                          )}`}
                        >
                          {nombreEstadoCuenta(
                            provider
                          )}
                        </span>

                      </div>

                      {/* ESTADÍSTICAS */}

                      <div className="mt-6 grid grid-cols-2 gap-4 lg:grid-cols-4">

                        <div className="rounded-2xl bg-green-50 p-5">

                          <p className="text-sm font-bold text-green-700">
                            ✅ Completados
                          </p>

                          <p className="mt-2 text-3xl font-black text-green-900">
                            {provider.completed_jobs ??
                              0}
                          </p>

                        </div>

                        <div className="rounded-2xl bg-amber-50 p-5">

                          <p className="text-sm font-bold text-amber-700">
                            ⭐ Calificación
                          </p>

                          <p className="mt-2 text-3xl font-black text-amber-900">
                            {Number(
                              provider.average_rating ||
                                0
                            ).toFixed(
                              1
                            )}
                          </p>

                        </div>

                        <div
                          className={`rounded-2xl p-5 ${
                            liberaciones >=
                            3
                              ? "border border-red-200 bg-red-50"
                              : liberaciones >
                                0
                              ? "border border-amber-200 bg-amber-50"
                              : "bg-slate-50"
                          }`}
                        >

                          <p
                            className={`text-sm font-bold ${
                              liberaciones >=
                              3
                                ? "text-red-700"
                                : liberaciones >
                                  0
                                ? "text-amber-700"
                                : "text-slate-600"
                            }`}
                          >
                            🔄 Trabajos liberados
                          </p>

                          <p className="mt-2 text-3xl font-black text-slate-900">
                            {
                              liberaciones
                            }
                          </p>

                        </div>

                        <div className="rounded-2xl bg-blue-50 p-5">

                          <p className="text-sm font-bold text-blue-700">
                            🛠️ Experiencia
                          </p>

                          <p className="mt-2 text-3xl font-black text-blue-900">
                            {provider.years_experience ??
                              0}
                          </p>

                          <p className="text-sm text-blue-700">
                            años
                          </p>

                        </div>

                      </div>

                      {/* ALERTA */}

                      {liberaciones >=
                        3 && (
                        <div className="mt-5 rounded-xl border border-red-200 bg-red-50 p-4">

                          <p className="font-extrabold text-red-800">
                            ⚠️ Atención
                          </p>

                          <p className="mt-1 text-sm text-red-700">
                            Este profesional ha liberado varias órdenes. Revisa su historial antes de decidir si debe continuar activo.
                          </p>

                        </div>
                      )}

                      {/* CONTROLES ADMIN */}

                      {provider.verified ===
                        true &&
                        provider.verification_status !==
                          "rejected" && (
                          <div className="mt-6 border-t border-slate-200 pt-5">

                            <p className="mb-3 text-sm font-bold uppercase tracking-wide text-slate-500">
                              Control de cuenta
                            </p>

                            {provider.active ===
                            true ? (
                              <button
                                type="button"
                                disabled={
                                  procesando ===
                                  provider.user_id
                                }
                                onClick={() =>
                                  cambiarActivo(
                                    provider,
                                    false
                                  )
                                }
                                className="w-full rounded-xl border-2 border-red-600 bg-white px-5 py-3 font-extrabold text-red-700 transition hover:bg-red-50 disabled:opacity-50"
                              >
                                {procesando ===
                                provider.user_id
                                  ? "Procesando..."
                                  : "⛔ Suspender profesional"}
                              </button>
                            ) : (
                              <button
                                type="button"
                                disabled={
                                  procesando ===
                                  provider.user_id
                                }
                                onClick={() =>
                                  cambiarActivo(
                                    provider,
                                    true
                                  )
                                }
                                className="w-full rounded-xl bg-green-600 px-5 py-3 font-extrabold text-white transition hover:bg-green-700 disabled:opacity-50"
                              >
                                {procesando ===
                                provider.user_id
                                  ? "Procesando..."
                                  : "✅ Reactivar profesional"}
                              </button>
                            )}

                          </div>
                        )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* VERIFICACIONES PENDIENTES */}

        <section>

          <div className="mb-5">

            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
              Verificación
            </p>

            <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
              Profesionales pendientes
            </h2>

            <p className="mt-2 text-slate-600">
              Revisa los documentos antes de aprobar una cuenta profesional.
            </p>

          </div>

          {providers.length ===
          0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow">

              <div className="text-5xl">
                ✅
              </div>

              <h2 className="mt-4 text-2xl font-extrabold text-slate-900">
                No hay verificaciones pendientes
              </h2>

              <p className="mt-2 text-slate-600">
                Cuando un profesional complete su perfil y envíe sus documentos aparecerá aquí.
              </p>

            </div>
          ) : (
            <div className="space-y-6">

              {providers.map(
                (
                  provider
                ) => {
                  const userDocs =
                    docsDelUsuario(
                      provider.user_id
                    );

                  return (
                    <article
                      key={
                        provider.user_id
                      }
                      className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg"
                    >

                      <div className="border-b border-slate-200 bg-slate-50 px-7 py-5">

                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">

                          <div>

                            <h2 className="text-2xl font-extrabold text-slate-900">
                              {provider.business_name ||
                                "Profesional sin nombre"}
                            </h2>

                            <p className="mt-1 break-all text-sm text-slate-500">
                              ID:{" "}
                              {
                                provider.user_id
                              }
                            </p>

                          </div>

                          <span className="w-fit rounded-full bg-amber-100 px-4 py-2 text-sm font-bold text-amber-800">
                            Pendiente
                          </span>

                        </div>

                      </div>

                      <div className="grid gap-8 p-7 lg:grid-cols-2">

                        {/* INFORMACIÓN */}

                        <div>

                          <h3 className="mb-4 text-lg font-extrabold text-blue-700">
                            Información profesional
                          </h3>

                          <div className="space-y-3 text-slate-700">

                            <p>
                              <strong>
                                Especialidad:
                              </strong>{" "}
                              {nombreOficio(
                                provider.trade
                              )}
                            </p>

                            <p>
                              <strong>
                                Experiencia:
                              </strong>{" "}
                              {provider.years_experience ??
                                0}{" "}
                              años
                            </p>

                            <p>
                              <strong>
                                Radio de servicio:
                              </strong>{" "}
                              {provider.service_radius_miles ??
                                0}{" "}
                              millas
                            </p>

                            <p>
                              <strong>
                                Licencia requerida:
                              </strong>{" "}
                              {provider.license_required
                                ? "Sí"
                                : "No"}
                            </p>

                            <p>
                              <strong>
                                Número de licencia:
                              </strong>{" "}
                              {provider.license_number ||
                                "No indicado"}
                            </p>

                            <p>
                              <strong>
                                Estado licencia:
                              </strong>{" "}
                              {provider.license_state ||
                                "No indicado"}
                            </p>

                            <p>
                              <strong>
                                Vencimiento licencia:
                              </strong>{" "}
                              {provider.license_expiration ||
                                "No indicado"}
                            </p>

                            <p>
                              <strong>
                                Seguro:
                              </strong>{" "}
                              {provider.insured
                                ? "Sí"
                                : "No"}
                            </p>

                            <p>
                              <strong>
                                Aseguradora:
                              </strong>{" "}
                              {provider.insurance_company ||
                                "No indicada"}
                            </p>

                            <p>
                              <strong>
                                Vencimiento seguro:
                              </strong>{" "}
                              {provider.insurance_expiration ||
                                "No indicado"}
                            </p>

                            <p>
                              <strong>
                                Bond/Fianza:
                              </strong>{" "}
                              {provider.bonded
                                ? "Sí"
                                : "No"}
                            </p>

                          </div>

                          {provider.bio && (
                            <div className="mt-5 rounded-xl bg-slate-50 p-4">

                              <p className="text-sm font-bold text-slate-900">
                                Descripción
                              </p>

                              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-slate-600">
                                {
                                  provider.bio
                                }
                              </p>

                            </div>
                          )}

                        </div>

                        {/* DOCUMENTOS */}

                        <div>

                          <h3 className="mb-4 text-lg font-extrabold text-blue-700">
                            Documentos
                          </h3>

                          {userDocs.length ===
                          0 ? (
                            <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-red-800">

                              <p className="font-bold">
                                Sin documentos
                              </p>

                              <p className="mt-1 text-sm">
                                Este profesional todavía no tiene documentos registrados y no puede ser aprobado.
                              </p>

                            </div>
                          ) : (
                            <div className="space-y-3">

                              {userDocs.map(
                                (
                                  doc,
                                  index
                                ) => (
                                  <div
                                    key={`${doc.file_path}-${index}`}
                                    className="flex flex-col gap-3 rounded-xl border border-slate-200 p-4 sm:flex-row sm:items-center sm:justify-between"
                                  >

                                    <div>

                                      <p className="font-bold text-slate-900">
                                        {doc.document_type ===
                                        "license"
                                          ? "Licencia"
                                          : doc.document_type ===
                                            "insurance"
                                          ? "Seguro"
                                          : doc.document_type ===
                                            "bond"
                                          ? "Bond / Fianza"
                                          : doc.document_type}
                                      </p>

                                      <p className="mt-1 text-xs text-slate-500">
                                        Estado:{" "}
                                        {doc.status ||
                                          "pending"}
                                      </p>

                                    </div>

                                    <button
                                      type="button"
                                      onClick={() =>
                                        abrirDocumento(
                                          doc.file_path
                                        )
                                      }
                                      className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white hover:bg-slate-700"
                                    >
                                      Ver documento
                                    </button>

                                  </div>
                                )
                              )}

                            </div>
                          )}

                        </div>

                      </div>

                      {/* APROBAR / RECHAZAR */}

                      <div className="flex flex-col gap-3 border-t border-slate-200 bg-slate-50 p-6 sm:flex-row">

                        <button
                          type="button"
                          disabled={
                            procesando ===
                              provider.user_id ||
                            userDocs.length ===
                              0
                          }
                          onClick={() =>
                            cambiarEstado(
                              provider.user_id,
                              "verified"
                            )
                          }
                          className="flex-1 rounded-xl bg-green-600 px-5 py-3 font-extrabold text-white hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          {procesando ===
                          provider.user_id
                            ? "Procesando..."
                            : userDocs.length ===
                              0
                            ? "Faltan documentos"
                            : "Aprobar profesional"}
                        </button>

                        <button
                          type="button"
                          disabled={
                            procesando ===
                            provider.user_id
                          }
                          onClick={() =>
                            cambiarEstado(
                              provider.user_id,
                              "rejected"
                            )
                          }
                          className="flex-1 rounded-xl bg-red-600 px-5 py-3 font-extrabold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {procesando ===
                          provider.user_id
                            ? "Procesando..."
                            : "Rechazar profesional"}
                        </button>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

        {/* HISTORIAL */}

        <section id="reasignaciones-admin" className="mt-10 scroll-mt-6">

          <div className="mb-5">

            <p className="text-sm font-bold uppercase tracking-wide text-purple-700">
              Historial
            </p>

            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

              <div>

                <h2 className="mt-1 text-3xl font-extrabold text-slate-900">
                  Historial de reasignaciones
                </h2>

                <p className="mt-2 text-slate-600">
                  Registro de profesionales que devolvieron trabajos al sistema.
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  cargarDatos()
                }
                className="w-fit rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
              >
                ↻ Actualizar
              </button>

            </div>

          </div>

          {historial.length ===
          0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow">

              <div className="text-5xl">
                📋
              </div>

              <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                Todavía no hay reasignaciones
              </h3>

              <p className="mt-2 text-slate-600">
                Cuando un profesional libere un trabajo aparecerá registrado aquí.
              </p>

            </div>
          ) : (
            <div className="space-y-4">

              {historial.map(
                (
                  item
                ) => (
                  <article
                    key={
                      item.id
                    }
                    className="rounded-3xl border border-slate-200 bg-white p-6 shadow"
                  >

                    <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                      <div className="flex-1">

                        <div className="flex flex-wrap items-center gap-2">

                          <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-extrabold text-amber-800">
                            🔄 Reasignación
                          </span>

                          <span className="rounded-full bg-slate-100 px-3 py-1 text-sm font-bold text-slate-700">
                            {nombreAccion(
                              item.action
                            )}
                          </span>

                        </div>

                        <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                          {item.trabajo?.title ||
                            "Trabajo"}
                        </h3>

                        {item.trabajo && (
                          <p className="mt-1 text-slate-600">
                            📍{" "}
                            {
                              item.trabajo.city
                            }
                            ,{" "}
                            {
                              item.trabajo.state
                            }
                          </p>
                        )}

                      </div>

                      <div className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-slate-600">
                        {formatearFecha(
                          item.created_at
                        )}
                      </div>

                    </div>

                    <div className="mt-5 grid grid-cols-1 gap-4 md:grid-cols-2">

                      <div className="rounded-2xl bg-slate-50 p-5">

                        <p className="text-sm font-bold text-slate-500">
                          Profesional
                        </p>

                        <p className="mt-1 text-lg font-extrabold text-slate-900">
                          {item.profesional?.business_name ||
                            "Profesional"}
                        </p>

                        <p className="mt-1 text-sm text-blue-700">
                          {nombreOficio(
                            item.profesional?.trade ||
                              null
                          )}
                        </p>

                        <p className="mt-2 break-all text-xs text-slate-500">
                          ID:{" "}
                          {item.provider_id ||
                            "No disponible"}
                        </p>

                      </div>

                      <div className="rounded-2xl bg-slate-50 p-5">

                        <p className="text-sm font-bold text-slate-500">
                          Motivo
                        </p>

                        <p className="mt-1 font-semibold leading-6 text-slate-800">
                          {item.reason ||
                            "Sin motivo registrado"}
                        </p>

                      </div>

                    </div>

                    <div className="mt-4 flex flex-wrap gap-2 text-xs text-slate-500">

                      <span className="rounded-lg bg-slate-100 px-3 py-2">
                        Request ID:{" "}
                        {
                          item.request_id
                        }
                      </span>

                      {item.trabajo && (
                        <span className="rounded-lg bg-slate-100 px-3 py-2">
                          Estado actual:{" "}
                          {
                            item.trabajo.status
                          }
                        </span>
                      )}

                    </div>

                  </article>
                )
              )}

            </div>
          )}

        </section>

        {/* DATOS EXTRA */}

        {totalRechazados >
          0 && (
          <div className="mt-8 text-center text-sm text-slate-500">
            Profesionales rechazados registrados:{" "}
            {totalRechazados}
          </div>
        )}

      </div>

      {reclamoParcial && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/60 p-4"
          onMouseDown={(e) => {
            if (
              e.target ===
              e.currentTarget
            ) {
              cerrarResolucionParcial();
            }
          }}
        >
          <div className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-hidden rounded-3xl bg-white shadow-2xl">

            <div className="bg-purple-700 px-6 py-5 text-white sm:px-8">
              <div className="flex items-start justify-between gap-4">

                <div>
                  <p className="text-sm font-extrabold uppercase tracking-wide text-purple-200">
                    ⚖️ Resolución parcial
                  </p>

                  <h3 className="mt-1 text-2xl font-black">
                    Dividir el dinero del reclamo
                  </h3>

                  <p className="mt-2 text-sm leading-6 text-purple-100">
                    Escribe cuánto recibirá el profesional. FixFlow calcula automáticamente cuánto se devuelve al cliente.
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    procesandoReclamo ===
                    reclamoParcial.id
                  }
                  onClick={
                    cerrarResolucionParcial
                  }
                  className="rounded-xl bg-white/10 px-3 py-2 text-xl font-black text-white hover:bg-white/20 disabled:opacity-50"
                  aria-label="Cerrar"
                >
                  ×
                </button>

              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto p-6 sm:p-8">

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">

                <div className="rounded-2xl bg-slate-100 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-slate-500">
                    Total pagado
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-900">
                    ${totalPagoParcial.toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-green-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-green-700">
                    Profesional
                  </p>
                  <p className="mt-1 text-2xl font-black text-green-800">
                    ${montoProfesionalParcialNumero().toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-blue-50 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wide text-blue-700">
                    Cliente
                  </p>
                  <p className="mt-1 text-2xl font-black text-blue-800">
                    ${reembolsoClienteParcialNumero().toFixed(2)}
                  </p>
                </div>

              </div>

              <div className="mt-6">

                <label className="block">

                  <span className="text-sm font-extrabold text-slate-800">
                    ¿Cuánto recibirá el profesional?
                  </span>

                  <div className="mt-2 flex items-center rounded-2xl border-2 border-slate-300 bg-white px-4 focus-within:border-purple-600">

                    <span className="text-xl font-black text-slate-500">
                      $
                    </span>

                    <input
                      type="number"
                      min="0"
                      max={
                        maxProfesionalParcial
                      }
                      step="0.01"
                      inputMode="decimal"
                      value={
                        montoProfesionalParcial
                      }
                      onChange={(e) => {
                        setMontoProfesionalParcial(
                          e.target.value
                        );
                        setErrorParcial("");
                      }}
                      placeholder="0.00"
                      className="w-full bg-transparent px-3 py-4 text-2xl font-black text-slate-900 outline-none"
                      autoFocus
                    />

                  </div>

                  <p className="mt-2 text-sm text-slate-500">
                    Máximo que puede recibir el profesional:{" "}
                    <span className="font-extrabold text-slate-700">
                      ${maxProfesionalParcial.toFixed(2)}
                    </span>
                  </p>

                </label>

              </div>

              <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">

                <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">

                  <div>
                    <p className="text-sm font-extrabold text-blue-900">
                      Reembolso automático al cliente
                    </p>
                    <p className="mt-1 text-sm text-blue-700">
                      Total pagado − pago al profesional
                    </p>
                  </div>

                  <div className="text-3xl font-black text-blue-900">
                    ${reembolsoClienteParcialNumero().toFixed(2)}
                  </div>

                </div>

              </div>

              <div className="mt-5">

                <label className="block">

                  <span className="text-sm font-extrabold text-slate-800">
                    Nota de resolución *
                  </span>

                  <textarea
                    value={
                      notaParcial
                    }
                    onChange={(e) => {
                      setNotaParcial(
                        e.target.value
                      );
                      setErrorParcial("");
                    }}
                    rows={4}
                    maxLength={1000}
                    placeholder="Explica brevemente por qué se decidió esta distribución..."
                    className="mt-2 w-full resize-none rounded-2xl border-2 border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-purple-600"
                  />

                  <div className="mt-1 text-right text-xs text-slate-400">
                    {notaParcial.length}/1000
                  </div>

                </label>

              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <div className="flex items-center justify-between gap-4">
                  <span className="font-bold text-slate-600">
                    Comprobación
                  </span>

                  <span className="font-black text-slate-900">
                    ${montoProfesionalParcialNumero().toFixed(2)}
                    {" + "}
                    ${reembolsoClienteParcialNumero().toFixed(2)}
                    {" = "}
                    ${totalPagoParcial.toFixed(2)}
                  </span>
                </div>

              </div>

              {errorParcial && (
                <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-4 font-bold text-red-700">
                  {errorParcial}
                </div>
              )}

              <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

                <button
                  type="button"
                  disabled={
                    procesandoReclamo ===
                    reclamoParcial.id
                  }
                  onClick={
                    cerrarResolucionParcial
                  }
                  className="rounded-xl border-2 border-slate-300 bg-white px-6 py-3 font-extrabold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
                >
                  Cancelar
                </button>

                <button
                  type="button"
                  disabled={
                    procesandoReclamo ===
                    reclamoParcial.id
                  }
                  onClick={
                    confirmarResolucionParcial
                  }
                  className="rounded-xl bg-purple-700 px-6 py-3 font-extrabold text-white hover:bg-purple-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {procesandoReclamo ===
                  reclamoParcial.id
                    ? "Procesando..."
                    : "⚖️ Confirmar resolución"}
                </button>

              </div>

            </div>

          </div>
        </div>
      )}

    </main>
  );
}

/*
  TARJETA RESUMEN
*/

function EvidenciaAdminCard({
  evidencia,
}: {
  evidencia: ClaimEvidenceAdmin;
}) {
  const url =
    evidencia.signed_url;

  if (!url) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4">
        <p className="text-sm font-extrabold text-red-800">
          No se pudo abrir este archivo.
        </p>

        <p className="mt-1 text-xs text-red-600">
          Actualiza los reclamos para generar un nuevo enlace seguro.
        </p>
      </div>
    );
  }

  if (
    evidencia.file_type ===
    "video"
  ) {
    return (
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm">

        <video
          controls
          preload="metadata"
          className="h-48 w-full bg-black object-contain"
          src={url}
        >
          Tu navegador no puede reproducir este video.
        </video>

        <div className="p-3">
          <a
            href={url}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full rounded-lg bg-slate-900 px-3 py-2 text-center text-sm font-extrabold text-white hover:bg-slate-700"
          >
            🎥 Abrir video
          </a>
        </div>

      </div>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="group overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm"
    >
      <img
        src={url}
        alt="Evidencia del reclamo"
        className="h-48 w-full object-cover transition duration-300 group-hover:scale-105"
      />

      <div className="p-3 text-center text-sm font-extrabold text-blue-700">
        🖼️ Abrir foto
      </div>
    </a>
  );
}

function TarjetaResumen({
  titulo,
  valor,
  clase,
  onClick,
  activo = false,
}: {
  titulo: string;
  valor: number;
  clase: string;
  onClick?: () => void;
  activo?: boolean;
}) {
  if (!onClick) {
    return (
      <div className="rounded-2xl bg-white p-6 shadow">

        <p className="text-sm font-bold text-slate-500">
          {titulo}
        </p>

        <p
          className={`mt-2 text-3xl font-black ${clase}`}
        >
          {valor}
        </p>

      </div>
    );
  }

  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`group w-full cursor-pointer rounded-2xl bg-white p-6 text-left shadow transition duration-200 hover:-translate-y-1 hover:shadow-lg focus:outline-none focus:ring-4 focus:ring-blue-100 ${
        activo
          ? "ring-2 ring-blue-500"
          : ""
      }`}
      title={`Ver ${titulo}`}
    >

      <div className="flex items-start justify-between gap-3">

        <p className="text-sm font-bold text-slate-500 transition group-hover:text-slate-800">
          {titulo}
        </p>

        <span className="text-lg font-black text-slate-300 transition group-hover:translate-x-1 group-hover:text-blue-600">
          →
        </span>

      </div>

      <p
        className={`mt-2 text-3xl font-black ${clase}`}
      >
        {valor}
      </p>

    </button>
  );
}

/*
  BOTÓN FILTRO
*/

function FiltroBoton({
  activo,
  texto,
  onClick,
}: {
  activo: boolean;
  texto: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={
        onClick
      }
      className={`rounded-xl px-4 py-2 text-sm font-extrabold transition ${
        activo
          ? "bg-blue-700 text-white"
          : "bg-slate-100 text-slate-700 hover:bg-slate-200"
      }`}
    >
      {texto}
    </button>
  );
}