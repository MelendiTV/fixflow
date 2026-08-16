"use client";

import { useEffect, useState } from "react";
import {
  useParams,
  useRouter,
} from "next/navigation";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type Trabajo = {
  id: string;
  title: string;
  description: string;
  address_line1: string | null;
  city: string;
  state: string;
  zip_code: string;
  preferred_date: string | null;
  preferred_time: string | null;
  status: string;
  job_stage: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  customer_id: string;
  preferred_provider_id: string | null;
  cancellation_reason: string | null;
};

type FotoTrabajo = {
  id: string;
  request_id: string;
  file_url: string;
};

type Oferta = {
  id: string;
  request_id: string;
  professional_id: string;
  price: number;
  arrival_minutes: number | null;
  estimated_job_minutes: number | null;
  message: string | null;
  status: string;
  created_at: string;
};

type Pago = {
  id: string;
  request_id: string;
  offer_id: string | null;
  provider_id: string;
  job_amount: number;
  provider_commission_percent: number;
  provider_commission_amount: number;
  provider_net_amount: number;
  status: string;
  paid_at: string | null;
  cancellation_stage: string | null;
  cancellation_penalty_percent: number | null;
  cancellation_penalty_amount: number | null;
  cancellation_provider_amount: number | null;
  cancellation_platform_amount: number | null;
  cancellation_processed_at: string | null;
};

type ReclamoTrabajo = {
  id: string;
  request_id: string;
  customer_id: string;
  provider_id: string;
  reason: string;
  description: string | null;
  provider_response: string | null;
  provider_response_deadline: string | null;
  provider_responded_at: string | null;
  status: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  provider_award_amount: number | null;
  customer_refund_amount: number | null;
  resolved_at: string | null;
  created_at: string;
};

type EvidenciaReclamo = {
  id: string;
  claim_id: string;
  uploaded_by: string;
  uploaded_by_role: "customer" | "provider";
  file_type: "image" | "video";
  file_path: string;
  created_at: string;
};

type ChangeOrder = {
  id: string;
  request_id: string;
  provider_id: string;
  customer_id: string;
  reason: string;
  description: string | null;
  original_amount: number;
  additional_amount: number;
  new_total_amount: number;
  status: "pending" | "accepted" | "rejected" | "cancelled";
  accepted_at: string | null;
  rejected_at: string | null;
  payment_status: "unpaid" | "paid" | string;
  stripe_checkout_session_id: string | null;
  stripe_payment_intent_id: string | null;
  additional_customer_fee_percent: number | null;
  additional_customer_fee_amount: number | null;
  additional_customer_total_amount: number | null;
  additional_provider_commission_percent: number | null;
  additional_provider_commission_amount: number | null;
  additional_provider_net_amount: number | null;
  additional_platform_revenue_amount: number | null;
  paid_at: string | null;
  created_at: string;
  updated_at: string;
};

function mostrarMinutos(
  minutos: number | null
) {
  if (
    minutos === null ||
    minutos === undefined
  ) {
    return "No indicado";
  }

  if (minutos < 60) {
    return `${minutos} min`;
  }

  const horas =
    Math.floor(
      minutos / 60
    );

  const restantes =
    minutos % 60;

  if (restantes === 0) {
    return `${horas} ${
      horas === 1
        ? "hora"
        : "horas"
    }`;
  }

  return `${horas} h ${restantes} min`;
}

function formatearFecha(
  fecha: string | null
) {
  if (!fecha) {
    return "Flexible";
  }

  const date =
    new Date(
      `${fecha}T12:00:00`
    );

  return new Intl.DateTimeFormat(
    "es-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
    }
  ).format(date);
}

function formatearFechaHora(
  fecha: string
) {
  return new Intl.DateTimeFormat(
    "es-US",
    {
      day: "numeric",
      month: "short",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    }
  ).format(
    new Date(fecha)
  );
}

function calcularTiempoRestante(
  deadline: string | null
) {
  if (!deadline) {
    return {
      vencido: false,
      texto: "24 horas",
    };
  }

  const diferencia =
    new Date(deadline).getTime() -
    Date.now();

  if (diferencia <= 0) {
    return {
      vencido: true,
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
    texto:
      horas > 0
        ? `${horas} h ${minutos} min`
        : `${minutos} min`,
  };
}

export default function TrabajoDetallePage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const id =
    params.id;

  const [
    trabajo,
    setTrabajo,
  ] =
    useState<Trabajo | null>(
      null
    );

  const [
    fotos,
    setFotos,
  ] =
    useState<FotoTrabajo[]>([]);

  const [
    oferta,
    setOferta,
  ] =
    useState<Oferta | null>(
      null
    );

  const [
    pago,
    setPago,
  ] =
    useState<Pago | null>(
      null
    );

  const [
    providerId,
    setProviderId,
  ] =
    useState<string | null>(
      null
    );

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    enviando,
    setEnviando,
  ] =
    useState(false);

  const [
    cambiandoEstado,
    setCambiandoEstado,
  ] =
    useState(false);

  const [
    completando,
    setCompletando,
  ] =
    useState(false);

  const [
    liberandoTrabajo,
    setLiberandoTrabajo,
  ] =
    useState(false);

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
    reclamo,
    setReclamo,
  ] =
    useState<ReclamoTrabajo | null>(
      null
    );

  const [
    evidenciasReclamo,
    setEvidenciasReclamo,
  ] =
    useState<EvidenciaReclamo[]>(
      []
    );

  const [
    archivosReclamo,
    setArchivosReclamo,
  ] =
    useState<File[]>(
      []
    );

  const [
    subiendoEvidencia,
    setSubiendoEvidencia,
  ] =
    useState(false);

  const [
    explicacionEvidencia,
    setExplicacionEvidencia,
  ] =
    useState("");

  const [
    ahora,
    setAhora,
  ] =
    useState(
      Date.now()
    );

  const [
    cambiosPresupuesto,
    setCambiosPresupuesto,
  ] =
    useState<ChangeOrder[]>(
      []
    );

  const [
    mostrarCambioPresupuesto,
    setMostrarCambioPresupuesto,
  ] =
    useState(false);

  const [
    enviandoCambioPresupuesto,
    setEnviandoCambioPresupuesto,
  ] =
    useState(false);

  const [
    motivoCambioPresupuesto,
    setMotivoCambioPresupuesto,
  ] =
    useState("");

  const [
    descripcionCambioPresupuesto,
    setDescripcionCambioPresupuesto,
  ] =
    useState("");

  const [
    montoAdicional,
    setMontoAdicional,
  ] =
    useState("");

  const [
    archivosCambioPresupuesto,
    setArchivosCambioPresupuesto,
  ] =
    useState<File[]>(
      []
    );

  /*
    CARGA INICIAL
    + REALTIME
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    let mounted = true;

    cargarTodo();

    const channel = supabase
      .channel(
        `trabajo-detalle-${id}`
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "service_requests",
          filter: `id=eq.${id}`,
        },
        (payload) => {
          console.log(
            "Cambio recibido en trabajo:",
            payload
          );

          if (!mounted) {
            return;
          }

          const nuevo =
            payload.new as Trabajo;

          setTrabajo(
            (actual) => {
              if (!actual) {
                return nuevo;
              }

              return {
                ...actual,
                ...nuevo,
              };
            }
          );

          if (
            nuevo.status ===
            "cancelled"
          ) {
            setMensaje("");
            setError("");
          }
        }
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "change_orders",
          filter: `request_id=eq.${id}`,
        },
        () => {
          if (!mounted) {
            return;
          }

          window.setTimeout(
            () => {
              cargarTodo();
            },
            250
          );
        }
      )
      .subscribe(
        (status) => {
          console.log(
            "Realtime trabajo:",
            status
          );
        }
      );

    return () => {
      mounted = false;

      supabase.removeChannel(
        channel
      );
    };
  }, [id]);

  useEffect(() => {
    const timer =
      window.setInterval(
        () => {
          setAhora(
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

  async function cargarTodo() {
    setCargando(true);
    setError("");

    try {
      /*
        USUARIO ACTUAL
      */

      const {
        data: {
          user,
        },
        error:
          userError,
      } =
        await supabase.auth.getUser();

      if (
        userError ||
        !user
      ) {
        router.replace(
          "/login-profesional"
        );

        return;
      }

      /*
        PERFIL PROFESIONAL
      */

      const {
        data: provider,
        error:
          providerError,
      } = await supabase
        .from(
          "provider_profiles"
        )
        .select(`
          verification_status,
          verified,
          active
        `)
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (
        providerError ||
        !provider
      ) {
        throw new Error(
          "No se encontró tu perfil profesional."
        );
      }

      if (
        provider.verification_status !==
          "verified" ||
        provider.verified !==
          true ||
        provider.active !==
          true
      ) {
        throw new Error(
          "Tu cuenta debe estar verificada y activa para acceder a trabajos."
        );
      }

      setProviderId(
        user.id
      );

      /*
        TRABAJO
      */

      const {
        data:
          trabajoData,
        error:
          trabajoError,
      } = await supabase
        .from(
          "service_requests"
        )
        .select(`
          id,
          title,
          description,
          address_line1,
          city,
          state,
          zip_code,
          preferred_date,
          preferred_time,
          status,
          job_stage,
          customer_name,
          customer_phone,
          customer_id,
          preferred_provider_id,
          cancellation_reason
        `)
        .eq(
          "id",
          id
        )
        .maybeSingle();

      if (
        trabajoError ||
        !trabajoData
      ) {
        throw new Error(
          "Este trabajo no existe o no tienes permiso para verlo."
        );
      }

      /*
        CONTROL DE ACCESO
      */

      if (
        trabajoData.status !==
          "open" &&
        trabajoData.preferred_provider_id &&
        trabajoData.preferred_provider_id !==
          user.id
      ) {
        throw new Error(
          "Este trabajo fue asignado a otro profesional."
        );
      }

      if (
        trabajoData.status ===
          "open" &&
        trabajoData.preferred_provider_id &&
        trabajoData.preferred_provider_id !==
          user.id
      ) {
        throw new Error(
          "Esta solicitud está dirigida a otro profesional."
        );
      }

      setTrabajo(
        trabajoData as Trabajo
      );

      /*
        FOTOS
      */

      const {
        data:
          fotosData,
        error:
          fotosError,
      } = await supabase
        .from(
          "request_photos"
        )
        .select(`
          id,
          request_id,
          file_url
        `)
        .eq(
          "request_id",
          id
        )
        .order(
          "created_at",
          {
            ascending: true,
          }
        );

      if (
        fotosError
      ) {
        console.error(
          fotosError
        );

        setFotos([]);
      } else {
        setFotos(
          fotosData ||
            []
        );
      }

      /*
        PRESUPUESTO
      */

      const {
        data:
          ofertaData,
        error:
          ofertaError,
      } = await supabase
        .from(
          "offers"
        )
        .select(`
          id,
          request_id,
          professional_id,
          price,
          arrival_minutes,
          estimated_job_minutes,
          message,
          status,
          created_at
        `)
        .eq(
          "request_id",
          id
        )
        .eq(
          "professional_id",
          user.id
        )
        .maybeSingle();

      if (
        ofertaError
      ) {
        console.error(
          ofertaError
        );
      }

      setOferta(
        ofertaData as Oferta | null
      );


      /*
        PAGO DEL PROFESIONAL
      */

      const {
        data:
          pagoData,
        error:
          pagoError,
      } = await supabase
        .from(
          "payments"
        )
        .select(`
          id,
          request_id,
          offer_id,
          provider_id,
          job_amount,
          provider_commission_percent,
          provider_commission_amount,
          provider_net_amount,
          status,
          paid_at,
          cancellation_stage,
          cancellation_penalty_percent,
          cancellation_penalty_amount,
          cancellation_provider_amount,
          cancellation_platform_amount,
          cancellation_processed_at
        `)
        .eq(
          "request_id",
          id
        )
        .eq(
          "provider_id",
          user.id
        )
        .order(
          "updated_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        pagoError
      ) {
        console.error(
          "Error cargando pago del profesional:",
          pagoError
        );

        setPago(null);
      } else {
        setPago(
          pagoData as Pago | null
        );
      }


      /*
        CAMBIOS DE PRESUPUESTO
      */

      const {
        data: cambiosData,
        error: cambiosError,
      } = await supabase
        .from("change_orders")
        .select(`
          id,
          request_id,
          provider_id,
          customer_id,
          reason,
          description,
          original_amount,
          additional_amount,
          new_total_amount,
          status,
          accepted_at,
          rejected_at,
          payment_status,
          stripe_checkout_session_id,
          stripe_payment_intent_id,
          additional_customer_fee_percent,
          additional_customer_fee_amount,
          additional_customer_total_amount,
          additional_provider_commission_percent,
          additional_provider_commission_amount,
          additional_provider_net_amount,
          additional_platform_revenue_amount,
          paid_at,
          created_at,
          updated_at
        `)
        .eq("request_id", id)
        .eq("provider_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (cambiosError) {
        console.error(
          "Error cargando cambios de presupuesto:",
          cambiosError
        );
        setCambiosPresupuesto([]);
      } else {
        setCambiosPresupuesto(
          (cambiosData || []) as ChangeOrder[]
        );
      }


      /*
        RECLAMO DEL TRABAJO
      */

      const {
        data: reclamoData,
        error: reclamoError,
      } = await supabase
        .from("job_claims")
        .select(`
          id,
          request_id,
          customer_id,
          provider_id,
          reason,
          description,
          provider_response,
          provider_response_deadline,
          provider_responded_at,
          status,
          resolution_type,
          resolution_notes,
          provider_award_amount,
          customer_refund_amount,
          resolved_at,
          created_at
        `)
        .eq(
          "request_id",
          id
        )
        .eq(
          "provider_id",
          user.id
        )
        .order(
          "created_at",
          {
            ascending: false,
          }
        )
        .limit(1)
        .maybeSingle();

      if (
        reclamoError
      ) {
        console.error(
          "Error cargando reclamo del trabajo:",
          reclamoError
        );

        setReclamo(null);
        setEvidenciasReclamo([]);
      } else {
        const reclamoActual =
          reclamoData as ReclamoTrabajo | null;

        setReclamo(
          reclamoActual
        );

        if (
          reclamoActual
        ) {
          const {
            data: evidenciasData,
            error: evidenciasError,
          } = await supabase
            .from(
              "claim_evidence"
            )
            .select(`
              id,
              claim_id,
              uploaded_by,
              uploaded_by_role,
              file_type,
              file_path,
              created_at
            `)
            .eq(
              "claim_id",
              reclamoActual.id
            )
            .eq(
              "uploaded_by",
              user.id
            )
            .eq(
              "uploaded_by_role",
              "provider"
            )
            .order(
              "created_at",
              {
                ascending: true,
              }
            );

          if (
            evidenciasError
          ) {
            console.error(
              "Error cargando evidencia del profesional:",
              evidenciasError
            );

            setEvidenciasReclamo(
              []
            );
          } else {
            setEvidenciasReclamo(
              (evidenciasData ||
                []) as EvidenciaReclamo[]
            );
          }
        } else {
          setEvidenciasReclamo(
            []
          );
        }
      }
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setCargando(
        false
      );
    }
  }

  /*
    ENVIAR PRESUPUESTO
  */

  async function enviarOferta(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !providerId ||
      !trabajo ||
      trabajo.status !==
        "open" ||
      oferta
    ) {
      return;
    }

    setEnviando(true);
    setError("");
    setMensaje("");

    try {
      const form =
        e.currentTarget;

      const formData =
        new FormData(
          form
        );

      const price =
        Number(
          formData.get(
            "price"
          )
        );

      const arrivalMinutes =
        Number(
          formData.get(
            "arrival_minutes"
          )
        );

      const estimatedJobMinutes =
        Number(
          formData.get(
            "estimated_job_minutes"
          )
        );

      const message =
        String(
          formData.get(
            "message"
          ) || ""
        ).trim();

      if (
        !Number.isFinite(
          price
        ) ||
        price <= 0
      ) {
        throw new Error(
          "Introduce un precio válido."
        );
      }

      if (
        !Number.isInteger(
          arrivalMinutes
        ) ||
        arrivalMinutes < 0
      ) {
        throw new Error(
          "Introduce un tiempo de llegada válido."
        );
      }

      if (
        !Number.isInteger(
          estimatedJobMinutes
        ) ||
        estimatedJobMinutes <=
          0
      ) {
        throw new Error(
          "Introduce una duración estimada válida."
        );
      }

      if (!message) {
        throw new Error(
          "Escribe un mensaje para el cliente."
        );
      }

      const {
        data:
          nuevaOferta,
        error:
          insertError,
      } = await supabase
        .from(
          "offers"
        )
        .insert({
          request_id:
            trabajo.id,

          professional_id:
            providerId,

          price,

          arrival_minutes:
            arrivalMinutes,

          estimated_job_minutes:
            estimatedJobMinutes,

          message,

          status:
            "pending",
        })
        .select(`
          id,
          request_id,
          professional_id,
          price,
          arrival_minutes,
          estimated_job_minutes,
          message,
          status,
          created_at
        `)
        .single();

      if (
        insertError
      ) {
        throw new Error(
          insertError.message
        );
      }

      setOferta(
        nuevaOferta as Oferta
      );

      form.reset();

      setMensaje(
        "Presupuesto enviado correctamente."
      );
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el presupuesto."
      );
    } finally {
      setEnviando(
        false
      );
    }
  }

  /*
    CAMBIAR ETAPA
  */

  async function cambiarEtapa(
    nuevaEtapa: string
  ) {
    if (
      !trabajo ||
      !providerId
    ) {
      return;
    }

    /*
      PROTECCIÓN CANCELACIÓN
    */

    if (
      trabajo.status ===
      "cancelled"
    ) {
      setError(
        "Este trabajo fue cancelado. Ya no puedes actualizar su estado."
      );

      return;
    }

    if (
      trabajo.status !==
        "in_progress" ||
      trabajo.preferred_provider_id !==
        providerId
    ) {
      setError(
        "No puedes cambiar el estado de este trabajo."
      );

      return;
    }

    setCambiandoEstado(
      true
    );

    setError("");
    setMensaje("");

    try {
      /*
        REVISAR ESTADO ACTUAL
        ANTES DE MODIFICAR
      */

      const {
        data:
          estadoActual,
        error:
          estadoError,
      } = await supabase
        .from(
          "service_requests"
        )
        .select(
          "status, preferred_provider_id"
        )
        .eq(
          "id",
          trabajo.id
        )
        .single();

      if (
        estadoError
      ) {
        throw new Error(
          estadoError.message
        );
      }

      if (
        estadoActual.status ===
        "cancelled"
      ) {
        setTrabajo(
          (actual) =>
            actual
              ? {
                  ...actual,
                  status:
                    "cancelled",
                }
              : actual
        );

        throw new Error(
          "Este trabajo fue cancelado. Ya no puedes continuar."
        );
      }

      if (
        estadoActual.status !==
          "in_progress" ||
        estadoActual.preferred_provider_id !==
          providerId
      ) {
        throw new Error(
          "Este trabajo ya no está disponible para actualizar."
        );
      }

      const {
        error:
          stageError,
      } = await supabase.rpc(
        "update_job_stage",
        {
          p_request_id:
            trabajo.id,

          p_job_stage:
            nuevaEtapa,
        }
      );

      if (
        stageError
      ) {
        throw new Error(
          stageError.message
        );
      }

      setTrabajo(
        (
          actual
        ) => {
          if (!actual) {
            return actual;
          }

          return {
            ...actual,
            job_stage:
              nuevaEtapa,
          };
        }
      );

      const textos:
        Record<
          string,
          string
        > = {
        on_the_way:
          "El cliente ya puede ver que vas en camino.",
        arrived:
          "El cliente ya puede ver que llegaste.",
        working:
          "El trabajo aparece ahora como iniciado.",
      };

      setMensaje(
        textos[
          nuevaEtapa
        ] ||
          "Estado actualizado."
      );
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo actualizar el trabajo."
      );
    } finally {
      setCambiandoEstado(
        false
      );
    }
  }

  /*
    COMPLETAR
  */

  async function marcarCompletado() {
    if (!trabajo || !providerId) {
      return;
    }

    if (
      reclamo &&
      (
        reclamo.status === "open" ||
        reclamo.status === "reviewing" ||
        reclamo.status === "in_review"
      )
    ) {
      setError(
        "Este trabajo tiene un reclamo activo. No puede marcarse como completado hasta que FixFlow resuelva el reclamo."
      );
      return;
    }

    if (trabajo.status === "cancelled") {
      setError(
        "Este trabajo fue cancelado. No puede marcarse como completado."
      );
      return;
    }

    if (
      trabajo.status !== "in_progress" ||
      trabajo.preferred_provider_id !== providerId
    ) {
      setError(
        "Este trabajo no puede marcarse como completado."
      );
      return;
    }

    if (trabajo.job_stage !== "working") {
      setError(
        "Primero debes iniciar el trabajo."
      );
      return;
    }

    const confirmar = window.confirm(
      "¿Confirmas que terminaste completamente este trabajo?"
    );

    if (!confirmar) {
      return;
    }

    setCompletando(true);
    setError("");
    setMensaje("");

    try {
      // 1. Comprobar el estado real justo antes de completar.
      const {
        data: estadoActual,
        error: estadoError,
      } = await supabase
        .from("service_requests")
        .select(
          "status, preferred_provider_id, job_stage"
        )
        .eq("id", trabajo.id)
        .single();

      if (estadoError) {
        throw new Error(estadoError.message);
      }

      if (estadoActual.status === "cancelled") {
        setTrabajo((actual) =>
          actual
            ? {
                ...actual,
                status: "cancelled",
              }
            : actual
        );

        throw new Error(
          "Este trabajo fue cancelado. Ya no puedes completarlo."
        );
      }

      if (
        estadoActual.status !== "in_progress" ||
        estadoActual.preferred_provider_id !== providerId
      ) {
        throw new Error(
          "Este trabajo ya no está disponible para completar."
        );
      }

      if (estadoActual.job_stage !== "working") {
        throw new Error(
          "El trabajo debe estar iniciado antes de completarlo."
        );
      }

      // 2. Marcar el trabajo como completado.
      const { error: completeError } =
        await supabase.rpc("complete_job", {
          p_request_id: trabajo.id,
        });

      if (completeError) {
        throw new Error(completeError.message);
      }

      setTrabajo((actual) => {
        if (!actual) {
          return actual;
        }

        return {
          ...actual,
          status: "completed",
          job_stage: "completed",
        };
      });

      // 3. La liberación del pago se procesa automáticamente
      // en el servidor cuando vence la retención de 36 horas.

      await cargarTodo();

      setMensaje(
        "Trabajo completado. El pago permanecerá protegido durante 36 horas."
      );
    } catch (err) {
      console.error(
        "Error completando trabajo:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo completar el trabajo."
      );

      await cargarTodo();
    } finally {
      setCompletando(false);
    }
  }

  /*
    LIBERAR TRABAJO
    POR EL PROFESIONAL

    La solicitud vuelve a quedar abierta
    para que otro profesional pueda
    enviar un presupuesto.
  */

  async function liberarTrabajo() {
    if (
      !trabajo ||
      !providerId
    ) {
      return;
    }

    if (
      trabajo.status !==
        "in_progress" ||
      trabajo.preferred_provider_id !==
        providerId
    ) {
      setError(
        "Este trabajo ya no está asignado a tu cuenta."
      );

      return;
    }

    if (
      trabajo.job_stage ===
      "working"
    ) {
      setError(
        "No puedes liberar el trabajo después de haberlo iniciado."
      );

      return;
    }

    const confirmar =
      window.confirm(
        "¿Seguro que no puedes realizar este trabajo?\n\nLa solicitud volverá a estar disponible para que otro profesional pueda atender al cliente."
      );

    if (!confirmar) {
      return;
    }

    setLiberandoTrabajo(
      true
    );

    setError("");
    setMensaje("");

    try {
      /*
        COMPROBAR EL ESTADO ACTUAL
        JUSTO ANTES DE LIBERARLO
      */

      const {
        data:
          estadoActual,
        error:
          estadoError,
      } = await supabase
        .from(
          "service_requests"
        )
        .select(`
          status,
          job_stage,
          preferred_provider_id
        `)
        .eq(
          "id",
          trabajo.id
        )
        .single();

      if (
        estadoError
      ) {
        throw new Error(
          estadoError.message
        );
      }

      if (
        estadoActual.status ===
        "cancelled"
      ) {
        setTrabajo(
          (actual) =>
            actual
              ? {
                  ...actual,
                  status:
                    "cancelled",
                }
              : actual
        );

        throw new Error(
          "Este trabajo fue cancelado antes de que pudieras liberarlo."
        );
      }

      if (
        estadoActual.status !==
          "in_progress" ||
        estadoActual.preferred_provider_id !==
          providerId
      ) {
        throw new Error(
          "Este trabajo ya no está asignado a tu cuenta."
        );
      }

      if (
        estadoActual.job_stage ===
        "working"
      ) {
        throw new Error(
          "El trabajo ya fue iniciado y no puede liberarse de esta manera."
        );
      }

      /*
        RPC SEGURA EN SUPABASE
      */

      const {
        error:
          releaseError,
      } = await supabase.rpc(
        "release_job_by_provider",
        {
          p_request_id:
            trabajo.id,
        }
      );

      if (
        releaseError
      ) {
        throw new Error(
          releaseError.message
        );
      }

      /*
        La función SQL:
        - vuelve status a open
        - borra preferred_provider_id
        - borra job_stage
        - rechaza la oferta de este profesional
        - registra este trabajo en provider_released_jobs
      */

      router.replace(
        "/panel-profesional"
      );
    } catch (err) {
      console.error(
        "Error liberando trabajo:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo liberar el trabajo."
      );
    } finally {
      setLiberandoTrabajo(
        false
      );
    }
  }

  /*
    EVIDENCIA DEL PROFESIONAL EN RECLAMOS
  */

  function seleccionarArchivosReclamo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nuevos =
      Array.from(
        event.target.files ||
        []
      );

    if (
      nuevos.length === 0
    ) {
      return;
    }

    const permitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    const invalidos =
      nuevos.filter(
        (file) =>
          !permitidos.includes(
            file.type
          )
      );

    if (
      invalidos.length > 0
    ) {
      setError(
        "Solo puedes adjuntar fotos JPG, PNG o WEBP y videos MP4, WEBM o MOV."
      );
      event.target.value = "";
      return;
    }

    const grandes =
      nuevos.filter(
        (file) =>
          file.size >
          50 * 1024 * 1024
      );

    if (
      grandes.length > 0
    ) {
      setError(
        "Cada foto o video debe pesar 50 MB o menos."
      );
      event.target.value = "";
      return;
    }

    const existentesImagenes =
      evidenciasReclamo.filter(
        (item) =>
          item.file_type ===
          "image"
      ).length;

    const existentesVideos =
      evidenciasReclamo.filter(
        (item) =>
          item.file_type ===
          "video"
      ).length;

    const combinados = [
      ...archivosReclamo,
      ...nuevos,
    ];

    const nuevasImagenes =
      combinados.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      ).length;

    const nuevosVideos =
      combinados.filter(
        (file) =>
          file.type.startsWith(
            "video/"
          )
      ).length;

    if (
      existentesImagenes +
        nuevasImagenes >
      10
    ) {
      setError(
        "Puedes adjuntar un máximo total de 10 fotos en este reclamo."
      );
      event.target.value = "";
      return;
    }

    if (
      existentesVideos +
        nuevosVideos >
      2
    ) {
      setError(
        "Puedes adjuntar un máximo total de 2 videos en este reclamo."
      );
      event.target.value = "";
      return;
    }

    setArchivosReclamo(
      combinados
    );

    setError("");
    event.target.value = "";
  }

  function quitarArchivoReclamo(
    index: number
  ) {
    setArchivosReclamo(
      (actuales) =>
        actuales.filter(
          (_, i) =>
            i !== index
        )
    );
  }

  async function subirEvidenciaReclamo() {
    if (
      !reclamo ||
      !providerId
    ) {
      setError(
        "No encontramos un reclamo activo para este trabajo."
      );
      return;
    }

    if (
      reclamo.status !== "open" &&
      reclamo.status !== "reviewing"
    ) {
      setError(
        "Este reclamo ya está cerrado y no admite nueva evidencia."
      );
      return;
    }

    if (
      reclamo.provider_response ||
      reclamo.provider_responded_at ||
      evidenciasReclamo.length > 0
    ) {
      setError(
        "Ya enviaste tu respuesta y evidencia para este reclamo. No se pueden hacer cambios después de enviarla."
      );
      return;
    }

    const tiempoRespuesta =
      calcularTiempoRestante(
        reclamo.provider_response_deadline
      );

    if (
      tiempoRespuesta.vencido
    ) {
      setError(
        "El plazo de 24 horas para responder este reclamo ya venció."
      );
      return;
    }

    if (
      archivosReclamo.length ===
      0
    ) {
      setError(
        "Selecciona al menos una foto o video."
      );
      return;
    }

    if (
      !explicacionEvidencia.trim()
    ) {
      setError(
        "Escribe una explicación de la evidencia antes de enviarla."
      );
      return;
    }

    setSubiendoEvidencia(
      true
    );

    setError("");
    setMensaje("");

    try {
      // Confirmar contra la base de datos que el profesional no haya
      // respondido ya desde otra pestaña, dispositivo o intento anterior.
      const {
        data: reclamoActualDb,
        error: reclamoActualError,
      } = await supabase
        .from("job_claims")
        .select(`
          id,
          provider_response,
          provider_responded_at
        `)
        .eq("id", reclamo.id)
        .eq("provider_id", providerId)
        .maybeSingle();

      if (reclamoActualError) {
        throw new Error(
          `No pudimos comprobar el estado actual del reclamo: ${reclamoActualError.message}`
        );
      }

      const {
        data: evidenciaExistenteDb,
        error: evidenciaExistenteError,
      } = await supabase
        .from("claim_evidence")
        .select("id")
        .eq("claim_id", reclamo.id)
        .eq("uploaded_by", providerId)
        .eq("uploaded_by_role", "provider")
        .limit(1);

      if (evidenciaExistenteError) {
        throw new Error(
          `No pudimos comprobar la evidencia ya enviada: ${evidenciaExistenteError.message}`
        );
      }

      if (
        reclamoActualDb?.provider_response ||
        reclamoActualDb?.provider_responded_at ||
        (evidenciaExistenteDb && evidenciaExistenteDb.length > 0)
      ) {
        await cargarTodo();
        throw new Error(
          "Ya enviaste tu respuesta y evidencia para este reclamo. No se permiten segundos envíos."
        );
      }

      const {
        error: respuestaError,
      } = await supabase
        .from("job_claims")
        .update({
          provider_response:
            explicacionEvidencia.trim(),
          provider_responded_at:
            new Date().toISOString(),
        })
        .eq("id", reclamo.id)
        .eq(
          "provider_id",
          providerId
        );

      if (
        respuestaError
      ) {
        throw new Error(
          `No pudimos guardar tu explicación: ${respuestaError.message}`
        );
      }

      const nuevasEvidencias:
        EvidenciaReclamo[] =
        [];

      for (
        const [
          index,
          file,
        ] of archivosReclamo.entries()
      ) {
        const nombreSeguro =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            )
            .slice(
              0,
              80
            );

        const ruta =
          `${reclamo.id}/${providerId}/${Date.now()}-${index}-${nombreSeguro}`;

        const {
          error:
            uploadError,
        } =
          await supabase.storage
            .from(
              "claim-evidence"
            )
            .upload(
              ruta,
              file,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  file.type,
              }
            );

        if (
          uploadError
        ) {
          throw new Error(
            `No pudimos subir "${file.name}": ${uploadError.message}`
          );
        }

        const fileType:
          "image" | "video" =
          file.type.startsWith(
            "video/"
          )
            ? "video"
            : "image";

        const {
          data:
            evidenciaData,
          error:
            evidenciaError,
        } =
          await supabase
            .from(
              "claim_evidence"
            )
            .insert({
              claim_id:
                reclamo.id,
              uploaded_by:
                providerId,
              uploaded_by_role:
                "provider",
              file_type:
                fileType,
              file_url:
                ruta,
              file_path:
                ruta,
            })
            .select(`
              id,
              claim_id,
              uploaded_by,
              uploaded_by_role,
              file_type,
              file_path,
              created_at
            `)
            .single();

        if (
          evidenciaError
        ) {
          await supabase.storage
            .from(
              "claim-evidence"
            )
            .remove([
              ruta,
            ]);

          throw new Error(
            `El archivo subió, pero no pudimos registrarlo: ${evidenciaError.message}`
          );
        }

        nuevasEvidencias.push(
          evidenciaData as EvidenciaReclamo
        );
      }

      setEvidenciasReclamo(
        (actuales) => [
          ...actuales,
          ...nuevasEvidencias,
        ]
      );

      setArchivosReclamo(
        []
      );

      setReclamo(
        (actual) =>
          actual
            ? {
                ...actual,
                provider_response:
                  explicacionEvidencia.trim(),
                provider_responded_at:
                  new Date().toISOString(),
              }
            : actual
      );

      setExplicacionEvidencia(
        ""
      );

      setMensaje(
        nuevasEvidencias.length ===
        1
          ? "Respuesta y evidencia enviadas correctamente. El envío quedó cerrado para revisión de FixFlow."
          : `${nuevasEvidencias.length} archivos de evidencia y tu respuesta fueron enviados. El envío quedó cerrado para revisión de FixFlow.`
      );
    } catch (err) {
      console.error(
        "Error subiendo evidencia del profesional:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo subir la evidencia."
      );
    } finally {
      setSubiendoEvidencia(
        false
      );
    }
  }

  /*
    CAMBIO DE PRESUPUESTO
  */

  function seleccionarArchivosCambioPresupuesto(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nuevos =
      Array.from(
        event.target.files || []
      );

    if (nuevos.length === 0) {
      return;
    }

    const permitidos = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "video/mp4",
      "video/webm",
      "video/quicktime",
    ];

    const invalidos =
      nuevos.filter(
        (file) =>
          !permitidos.includes(
            file.type
          )
      );

    if (invalidos.length > 0) {
      setError(
        "Solo puedes adjuntar fotos JPG, PNG o WEBP y videos MP4, WEBM o MOV."
      );
      event.target.value = "";
      return;
    }

    const grandes =
      nuevos.filter(
        (file) =>
          file.size >
          50 * 1024 * 1024
      );

    if (grandes.length > 0) {
      setError(
        "Cada foto o video debe pesar 50 MB o menos."
      );
      event.target.value = "";
      return;
    }

    const combinados = [
      ...archivosCambioPresupuesto,
      ...nuevos,
    ];

    const imagenes =
      combinados.filter(
        (file) =>
          file.type.startsWith(
            "image/"
          )
      );

    const videos =
      combinados.filter(
        (file) =>
          file.type.startsWith(
            "video/"
          )
      );

    if (imagenes.length > 10) {
      setError(
        "Puedes adjuntar un máximo de 10 fotos."
      );
      event.target.value = "";
      return;
    }

    if (videos.length > 2) {
      setError(
        "Puedes adjuntar un máximo de 2 videos."
      );
      event.target.value = "";
      return;
    }

    setArchivosCambioPresupuesto(
      combinados
    );
    setError("");
    event.target.value = "";
  }

  function quitarArchivoCambioPresupuesto(
    index: number
  ) {
    setArchivosCambioPresupuesto(
      (actuales) =>
        actuales.filter(
          (_, i) => i !== index
        )
    );
  }

  async function enviarCambioPresupuesto(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !trabajo ||
      !providerId ||
      !oferta
    ) {
      setError(
        "No encontramos los datos necesarios del trabajo o del presupuesto."
      );
      return;
    }

    if (
      trabajo.status !== "in_progress" ||
      trabajo.job_stage !== "working" ||
      trabajo.preferred_provider_id !== providerId
    ) {
      setError(
        "Solo puedes solicitar un cambio de presupuesto después de iniciar un trabajo que esté asignado a tu cuenta."
      );
      return;
    }

    if (reclamoActivo) {
      setError(
        "No puedes solicitar un cambio de presupuesto mientras exista un reclamo activo."
      );
      return;
    }

    const pendiente =
      cambiosPresupuesto.find(
        (cambio) =>
          cambio.status === "pending"
      );

    if (pendiente) {
      setError(
        "Ya tienes un cambio de presupuesto pendiente de respuesta del cliente."
      );
      return;
    }

    const adicional =
      Number(montoAdicional);

    if (
      !Number.isFinite(adicional) ||
      adicional <= 0
    ) {
      setError(
        "Introduce un monto adicional válido."
      );
      return;
    }

    if (!motivoCambioPresupuesto.trim()) {
      setError(
        "Selecciona el motivo del cambio de presupuesto."
      );
      return;
    }

    if (
      descripcionCambioPresupuesto
        .trim()
        .length < 5
    ) {
      setError(
        "Explica brevemente por qué es necesario aumentar el presupuesto."
      );
      return;
    }

    const ultimoAceptadoPagado =
      cambiosPresupuesto.find(
        (cambio) =>
          cambio.status === "accepted" &&
          cambio.payment_status === "paid"
      );

    const montoOriginal =
      Number(
        ultimoAceptadoPagado?.new_total_amount ??
        pago?.job_amount ??
        oferta.price ??
        0
      );

    const nuevoTotal =
      Math.round(
        (montoOriginal +
          adicional +
          Number.EPSILON) *
          100
      ) / 100;

    setEnviandoCambioPresupuesto(
      true
    );
    setError("");
    setMensaje("");

    try {
      const {
        data: nuevoCambio,
        error: cambioError,
      } = await supabase
        .from("change_orders")
        .insert({
          request_id: trabajo.id,
          provider_id: providerId,
          customer_id:
            trabajo.customer_id,
          reason:
            motivoCambioPresupuesto.trim(),
          description:
            descripcionCambioPresupuesto.trim(),
          original_amount:
            montoOriginal,
          additional_amount:
            adicional,
          new_total_amount:
            nuevoTotal,
          status: "pending",
        })
        .select(`
          id,
          request_id,
          provider_id,
          customer_id,
          reason,
          description,
          original_amount,
          additional_amount,
          new_total_amount,
          status,
          accepted_at,
          rejected_at,
          payment_status,
          stripe_checkout_session_id,
          stripe_payment_intent_id,
          additional_customer_fee_percent,
          additional_customer_fee_amount,
          additional_customer_total_amount,
          additional_provider_commission_percent,
          additional_provider_commission_amount,
          additional_provider_net_amount,
          additional_platform_revenue_amount,
          paid_at,
          created_at,
          updated_at
        `)
        .single();

      if (cambioError) {
        throw new Error(
          cambioError.message
        );
      }

      const cambio =
        nuevoCambio as ChangeOrder;

      for (
        const [
          index,
          file,
        ] of archivosCambioPresupuesto.entries()
      ) {
        const nombreSeguro =
          file.name
            .replace(
              /[^a-zA-Z0-9._-]/g,
              "-"
            )
            .slice(0, 80);

        const ruta =
          `${cambio.id}/${providerId}/${Date.now()}-${index}-${nombreSeguro}`;

        const {
          error: uploadError,
        } =
          await supabase.storage
            .from(
              "change-order-evidence"
            )
            .upload(
              ruta,
              file,
              {
                cacheControl:
                  "3600",
                upsert: false,
                contentType:
                  file.type,
              }
            );

        if (uploadError) {
          throw new Error(
            `El cambio de presupuesto fue creado, pero no pudimos subir "${file.name}": ${uploadError.message}`
          );
        }

        const fileType:
          "image" | "video" =
          file.type.startsWith(
            "video/"
          )
            ? "video"
            : "image";

        const {
          error: evidenciaError,
        } =
          await supabase
            .from(
              "change_order_evidence"
            )
            .insert({
              change_order_id:
                cambio.id,
              uploaded_by:
                providerId,
              uploaded_by_role:
                "provider",
              file_type:
                fileType,
              file_path:
                ruta,
              file_url:
                ruta,
            });

        if (evidenciaError) {
          throw new Error(
            `El archivo subió, pero no pudimos registrarlo: ${evidenciaError.message}`
          );
        }
      }

      setCambiosPresupuesto(
        (actuales) => [
          cambio,
          ...actuales,
        ]
      );

      setMostrarCambioPresupuesto(
        false
      );
      setMotivoCambioPresupuesto(
        ""
      );
      setDescripcionCambioPresupuesto(
        ""
      );
      setMontoAdicional(
        ""
      );
      setArchivosCambioPresupuesto(
        []
      );

      setMensaje(
        `Cambio de presupuesto enviado. Solicitaste $${adicional.toFixed(
          2
        )} adicionales. El nuevo total propuesto es $${nuevoTotal.toFixed(
          2
        )}.`
      );
    } catch (err) {
      console.error(
        "Error creando cambio de presupuesto:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo crear el cambio de presupuesto."
      );

      await cargarTodo();
    } finally {
      setEnviandoCambioPresupuesto(
        false
      );
    }
  }


  /*
    DIRECCIÓN
  */

  function abrirDireccion() {
    if (!trabajo) {
      return;
    }

    const direccion =
      [
        trabajo.address_line1,
        trabajo.city,
        trabajo.state,
        trabajo.zip_code,
      ]
        .filter(Boolean)
        .join(", ");

    window.open(
      `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(
        direccion
      )}`,
      "_blank",
      "noopener,noreferrer"
    );
  }

  /*
    LLAMAR
  */

  function contactarCliente() {
    if (
      !trabajo?.customer_phone
    ) {
      setError(
        "El cliente no tiene un teléfono disponible."
      );

      return;
    }

    window.location.href =
      `tel:${trabajo.customer_phone}`;
  }

  /*
    PROGRESO
  */

  function numeroEtapa() {
    if (
      trabajo?.status ===
      "completed"
    ) {
      return 5;
    }

    if (
      trabajo?.job_stage ===
      "working"
    ) {
      return 4;
    }

    if (
      trabajo?.job_stage ===
      "arrived"
    ) {
      return 3;
    }

    if (
      trabajo?.job_stage ===
      "on_the_way"
    ) {
      return 2;
    }

    return 1;
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="rounded-2xl bg-white px-8 py-6 font-bold text-slate-700 shadow-xl">
          Cargando trabajo...
        </div>
      </main>
    );
  }

  if (
    error &&
    !trabajo
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-black text-red-700">
            Trabajo no disponible
          </h1>

          <p className="mt-4 text-slate-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/panel-profesional"
              )
            }
            className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white"
          >
            Volver al panel
          </button>
        </div>
      </main>
    );
  }

  if (!trabajo) {
    return null;
  }

  const cambiosPresupuestoPagados =
    cambiosPresupuesto.filter(
      (cambio) =>
        cambio.status === "accepted" &&
        cambio.payment_status === "paid"
    );

  const adicionalServicioPagado =
    Math.round(
      (
        cambiosPresupuestoPagados.reduce(
          (total, cambio) =>
            total +
            Number(
              cambio.additional_amount ||
                0
            ),
          0
        ) +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const comisionAdicionalProfesional =
    Math.round(
      (
        cambiosPresupuestoPagados.reduce(
          (total, cambio) =>
            total +
            Number(
              cambio.additional_provider_commission_amount ||
                0
            ),
          0
        ) +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const netoAdicionalProfesional =
    Math.round(
      (
        cambiosPresupuestoPagados.reduce(
          (total, cambio) =>
            total +
            Number(
              cambio.additional_provider_net_amount ||
                0
            ),
          0
        ) +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const valorServicioProfesional =
    Math.round(
      (
        Number(
          pago?.job_amount ||
            oferta?.price ||
            0
        ) +
        adicionalServicioPagado +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const comisionTotalProfesional =
    Math.round(
      (
        Number(
          pago?.provider_commission_amount ||
            0
        ) +
        comisionAdicionalProfesional +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const netoTotalProfesional =
    Math.round(
      (
        Number(
          pago?.provider_net_amount ||
            0
        ) +
        netoAdicionalProfesional +
        Number.EPSILON
      ) *
        100
    ) / 100;

  const etapaActual =
    numeroEtapa();

  const cancelado =
    trabajo.status ===
    "cancelled";

  const motivoCancelacion =
    trabajo.cancellation_reason || "";

  const canceladoPorFixFlow =
    cancelado &&
    motivoCancelacion
      .toLowerCase()
      .includes("reclamo resuelto");

  const contratado =
    trabajo.status ===
      "in_progress" &&
    trabajo.preferred_provider_id ===
      providerId;

  const cambioPresupuestoPendiente =
    cambiosPresupuesto.find(
      (cambio) =>
        cambio.status === "pending"
    ) || null;

  const ultimoCambioPresupuesto =
    cambiosPresupuesto[0] || null;

  const reclamoActivo =
    !!reclamo &&
    (
      reclamo.status === "open" ||
      reclamo.status === "reviewing" ||
      reclamo.status === "in_review"
    );

  const profesionalYaRespondio =
    !!reclamo &&
    Boolean(
      reclamo.provider_response ||
      reclamo.provider_responded_at ||
      evidenciasReclamo.length > 0
    );

  const puedeSolicitarCambioPresupuesto =
    contratado &&
    trabajo.job_stage === "working" &&
    !reclamoActivo &&
    !cambioPresupuestoPendiente;

  const reclamoResuelto =
    reclamo?.status === "resolved";

  const compensacionPorReclamo =
    reclamoResuelto
      ? Number(
          reclamo?.provider_award_amount || 0
        )
      : 0;

  const reembolsoClientePorReclamo =
    reclamoResuelto
      ? Number(
          reclamo?.customer_refund_amount || 0
        )
      : 0;

  const compensacionMostrada =
    canceladoPorFixFlow &&
    reclamoResuelto
      ? compensacionPorReclamo
      : Number(
          pago?.cancellation_provider_amount || 0
        );

  const tiempoRespuestaReclamo =
    reclamo
      ? calcularTiempoRestante(
          reclamo.provider_response_deadline
        )
      : {
          vencido: false,
          texto: "",
        };

  void ahora;

  const etapas = [
    {
      numero: 1,
      icono: "🤝",
      titulo: "Contratado",
      texto:
        "Aceptaste el trabajo",
    },
    {
      numero: 2,
      icono: "🚗",
      titulo: "En camino",
      texto:
        "Vas rumbo al lugar",
    },
    {
      numero: 3,
      icono: "📍",
      titulo: "Llegué",
      texto:
        "Has llegado al lugar",
    },
    {
      numero: 4,
      icono: "🛠️",
      titulo:
        "Trabajo iniciado",
      texto:
        "Comenzaste el trabajo",
    },
    {
      numero: 5,
      icono: "✅",
      titulo: "Completado",
      texto:
        "Trabajo terminado",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-50">

      {/* BARRA SUPERIOR */}

      <header className="bg-gradient-to-r from-blue-950 via-blue-900 to-blue-800 text-white shadow-lg">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-5 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-2xl">
              🔧
            </div>

            <div>
              <p className="text-2xl font-black tracking-tight">
                FixFlow
              </p>

              <p className="text-xs font-semibold text-blue-200">
                Panel profesional
              </p>
            </div>
          </div>

          <div className="text-right">
            <p className="text-xs text-blue-200">
              Profesional
            </p>

            <p className="font-bold">
              Mi cuenta
            </p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-4 py-8 md:px-6">

        {/* VOLVER */}

        <button
          type="button"
          onClick={() =>
            router.push(
              trabajo.status ===
                "open"
                ? "/trabajos"
                : "/panel-profesional"
            )
          }
          className="mb-6 flex items-center gap-2 font-bold text-blue-700 transition hover:text-blue-900"
        >
          ← Volver al panel
        </button>

        {/* AVISO CANCELADO */}

        {cancelado && (
          <section className="mb-6 rounded-3xl border-2 border-red-300 bg-red-50 p-7 shadow-lg">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
              <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full bg-red-600 text-3xl text-white">
                ✕
              </div>

              <div>
                <p className="text-sm font-black uppercase tracking-wider text-red-700">
                  Trabajo cancelado
                </p>

                <h2 className="mt-1 text-2xl font-black text-red-950">
                  {canceladoPorFixFlow
                    ? "Trabajo cancelado por resolución de FixFlow"
                    : "El cliente canceló este trabajo"}
                </h2>

                <p className="mt-2 leading-6 text-red-800">
                  {canceladoPorFixFlow
                    ? "FixFlow resolvió el reclamo y cerró este trabajo. Ya no puedes continuar, actualizar el estado ni marcar el trabajo como completado."
                    : "Esta solicitud ya no está activa. No puedes continuar, actualizar el estado ni marcar el trabajo como completado."}
                </p>
              </div>
            </div>
          </section>
        )}

        {/* AVISO RECLAMO ACTIVO */}

        {reclamoActivo && (
          <section
            className={`mb-6 rounded-3xl border-2 p-7 shadow-lg ${
              profesionalYaRespondio
                ? "border-emerald-300 bg-emerald-50"
                : "border-amber-300 bg-amber-50"
            }`}
          >
            <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex items-start gap-4">
                <div
                  className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-2xl text-white ${
                    profesionalYaRespondio
                      ? "bg-emerald-600"
                      : "bg-amber-500"
                  }`}
                >
                  {profesionalYaRespondio ? "✅" : "⚠️"}
                </div>

                <div>
                  <p
                    className={`text-sm font-black uppercase tracking-[0.16em] ${
                      profesionalYaRespondio
                        ? "text-emerald-700"
                        : "text-amber-700"
                    }`}
                  >
                    {profesionalYaRespondio
                      ? "Respuesta enviada"
                      : "Reclamo activo"}
                  </p>

                  <h2
                    className={`mt-1 text-2xl font-black ${
                      profesionalYaRespondio
                        ? "text-emerald-950"
                        : "text-amber-950"
                    }`}
                  >
                    {profesionalYaRespondio
                      ? "Tu respuesta ya fue enviada a FixFlow"
                      : "El cliente reportó un problema con este trabajo"}
                  </h2>

                  <p
                    className={`mt-2 max-w-3xl leading-7 ${
                      profesionalYaRespondio
                        ? "text-emerald-900"
                        : "text-amber-900"
                    }`}
                  >
                    {profesionalYaRespondio
                      ? "Tu respuesta y evidencia quedaron registradas. El pago permanece retenido mientras FixFlow revisa el caso y toma una decisión."
                      : "El pago permanece retenido mientras FixFlow revisa el caso. No puedes marcar el trabajo como completado hasta que el reclamo sea resuelto."}
                  </p>

                  {!profesionalYaRespondio && (
                    <p className="mt-3 font-bold text-amber-900">
                      Tienes {tiempoRespuestaReclamo.texto} para responder y adjuntar tu evidencia.
                    </p>
                  )}

                  {profesionalYaRespondio &&
                    reclamo?.provider_responded_at && (
                      <p className="mt-3 text-sm font-bold text-emerald-800">
                        Respuesta enviada{" "}
                        {formatearFechaHora(
                          reclamo.provider_responded_at
                        )}
                      </p>
                    )}
                </div>
              </div>

              <button
                type="button"
                onClick={() => {
                  const seccion =
                    document.getElementById(
                      "reclamo-profesional"
                    );

                  if (seccion) {
                    seccion.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }}
                className={`shrink-0 rounded-xl px-6 py-3.5 font-black text-white transition ${
                  profesionalYaRespondio
                    ? "bg-emerald-700 hover:bg-emerald-800"
                    : "bg-amber-600 hover:bg-amber-700"
                }`}
              >
                {profesionalYaRespondio
                  ? "Ver reclamo"
                  : "Ver y responder reclamo"}
              </button>
            </div>
          </section>
        )}

        {/* CABECERA */}

        <section
          className={`rounded-3xl border bg-white p-7 shadow-lg md:p-8 ${
            cancelado
              ? "border-red-200"
              : "border-slate-200"
          }`}
        >
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div className="flex-1">
              <div className="flex flex-wrap gap-2">

                <span
                  className={`rounded-lg px-4 py-2 text-xs font-black uppercase tracking-wide ${
                    cancelado
                      ? "bg-red-600 text-white"
                      : trabajo.status ===
                        "completed"
                      ? "bg-green-100 text-green-800"
                      : trabajo.status ===
                        "in_progress"
                      ? "bg-green-600 text-white"
                      : "bg-blue-700 text-white"
                  }`}
                >
                  {cancelado
                    ? "Cancelado"
                    : trabajo.status ===
                      "completed"
                    ? "Completado"
                    : trabajo.status ===
                      "in_progress"
                    ? "En progreso"
                    : "Abierto"}
                </span>

                {contratado && (
                  <span className="rounded-lg border border-amber-400 bg-amber-50 px-4 py-2 text-xs font-black uppercase text-amber-800">
                    Contratado
                  </span>
                )}
              </div>

              <h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950 md:text-4xl">
                {trabajo.title}
              </h1>

              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                {trabajo.description}
              </p>

              <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">

                <Info
                  icono="📍"
                  titulo="Ubicación"
                  valor={`${trabajo.city}, ${trabajo.state} ${trabajo.zip_code}`}
                />

                <Info
                  icono="📅"
                  titulo="Fecha preferida"
                  valor={formatearFecha(
                    trabajo.preferred_date
                  )}
                />

                <Info
                  icono="🕐"
                  titulo="Hora preferida"
                  valor={
                    trabajo.preferred_time ||
                    "Flexible"
                  }
                />

                <Info
                  icono="👤"
                  titulo="Cliente"
                  valor={
                    trabajo.customer_name ||
                    "Cliente FixFlow"
                  }
                />
              </div>
            </div>

            <div className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-5 lg:w-72">
              <p className="text-center text-sm text-slate-500">
                ID del trabajo
              </p>

              <p className="mt-2 text-center font-black text-slate-900">
                #
                {trabajo.id
                  .slice(0, 10)
                  .toUpperCase()}
              </p>

              <button
                type="button"
                onClick={() =>
                  window.scrollTo({
                    top:
                      document.body
                        .scrollHeight,
                    behavior:
                      "smooth",
                  })
                }
                className="mt-5 w-full rounded-xl bg-blue-700 px-4 py-3 font-extrabold text-white transition hover:bg-blue-800"
              >
                Ver detalle completo
              </button>
            </div>
          </div>
        </section>

        {/* GRID PRINCIPAL */}

        <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">

          {/* IZQUIERDA */}

          <div className="space-y-6">

            {/* SEGUIMIENTO */}

            {trabajo.status !==
              "open" && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

                <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    📋
                  </span>
                  Seguimiento del trabajo
                </h2>

                {cancelado ? (
                  <div className="mt-6 rounded-2xl border-2 border-red-200 bg-red-50 p-6 text-center">
                    <div className="text-5xl">
                      🚫
                    </div>

                    <h3 className="mt-4 text-2xl font-black text-red-900">
                      Trabajo cancelado
                    </h3>

                    <p className="mt-2 text-red-700">
                      {canceladoPorFixFlow
                        ? "FixFlow canceló el trabajo como resultado de la resolución del reclamo. El seguimiento ha sido detenido."
                        : "El cliente canceló la solicitud y el seguimiento ha sido detenido."}
                    </p>
                  </div>
                ) : (
                  <>
                    <div className="mt-8 grid grid-cols-5 gap-1">
                      {etapas.map(
                        (etapa) => {
                          const activo =
                            etapa.numero <=
                            etapaActual;

                          return (
                            <div
                              key={
                                etapa.numero
                              }
                              className="relative text-center"
                            >
                              {etapa.numero <
                                5 && (
                                <div
                                  className={`absolute left-1/2 top-5 h-1 w-full ${
                                    etapa.numero <
                                    etapaActual
                                      ? "bg-blue-600"
                                      : "bg-slate-200"
                                  }`}
                                />
                              )}

                              <div
                                className={`relative z-10 mx-auto flex h-10 w-10 items-center justify-center rounded-full border-2 text-sm font-black ${
                                  activo
                                    ? "border-blue-700 bg-blue-700 text-white"
                                    : "border-slate-300 bg-white text-slate-500"
                                }`}
                              >
                                {
                                  etapa.numero
                                }
                              </div>

                              <div className="relative z-10 mt-3 text-xl">
                                {
                                  etapa.icono
                                }
                              </div>

                              <p className="mt-1 text-xs font-black text-slate-900 sm:text-sm">
                                {
                                  etapa.titulo
                                }
                              </p>

                              <p className="mt-1 hidden text-xs text-slate-500 sm:block">
                                {
                                  etapa.texto
                                }
                              </p>
                            </div>
                          );
                        }
                      )}
                    </div>

                    {contratado && (
                      <div className="mt-8 rounded-2xl border border-blue-200 bg-blue-50 p-6">

                        <div className="flex items-start gap-4">
                          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-blue-700 text-xl text-white">
                            i
                          </div>

                          <div>
                            <h3 className="text-xl font-black text-blue-950">
                              {etapaActual ===
                              1
                                ? "Trabajo contratado"
                                : etapaActual ===
                                  2
                                ? "Vas en camino"
                                : etapaActual ===
                                  3
                                ? "Ya llegaste"
                                : "Trabajo iniciado"}
                            </h3>

                            <p className="mt-1 text-sm leading-6 text-blue-900">
                              El cliente puede ver el avance del servicio en tiempo real.
                            </p>
                          </div>
                        </div>

                        <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">

                          {etapaActual ===
                            1 && (
                            <button
                              type="button"
                              disabled={
                                cambiandoEstado
                              }
                              onClick={() =>
                                cambiarEtapa(
                                  "on_the_way"
                                )
                              }
                              className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-50"
                            >
                              🚗 Estoy en camino
                            </button>
                          )}

                          {etapaActual ===
                            2 && (
                            <button
                              type="button"
                              disabled={
                                cambiandoEstado
                              }
                              onClick={() =>
                                cambiarEtapa(
                                  "arrived"
                                )
                              }
                              className="rounded-xl bg-blue-700 px-5 py-3 font-extrabold text-white transition hover:bg-blue-800 disabled:opacity-50"
                            >
                              📍 Ya llegué
                            </button>
                          )}

                          {etapaActual ===
                            3 && (
                            <button
                              type="button"
                              disabled={
                                cambiandoEstado
                              }
                              onClick={() =>
                                cambiarEtapa(
                                  "working"
                                )
                              }
                              className="rounded-xl bg-amber-500 px-5 py-3 font-extrabold text-white transition hover:bg-amber-600 disabled:opacity-50"
                            >
                              🛠️ Iniciar trabajo
                            </button>
                          )}

                          {etapaActual ===
                            4 && (
                            <button
                              type="button"
                              disabled={
                                !puedeSolicitarCambioPresupuesto
                              }
                              onClick={() => {
                                setMostrarCambioPresupuesto(
                                  true
                                );
                                setError("");
                                setMensaje("");
                              }}
                              className={`rounded-xl px-5 py-3 font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                cambioPresupuestoPendiente
                                  ? "bg-slate-400"
                                  : reclamoActivo
                                  ? "bg-slate-400"
                                  : "bg-violet-600 hover:bg-violet-700"
                              }`}
                            >
                              {cambioPresupuestoPendiente
                                ? "⏳ Cambio pendiente"
                                : reclamoActivo
                                ? "⚠️ Bloqueado por reclamo"
                                : "💰 Solicitar cambio de presupuesto"}
                            </button>
                          )}

                          {etapaActual ===
                            4 && (
                            <button
                              type="button"
                              disabled={
                                completando ||
                                reclamoActivo
                              }
                              onClick={
                                marcarCompletado
                              }
                              className={`rounded-xl px-5 py-3 font-extrabold text-white transition disabled:cursor-not-allowed disabled:opacity-60 ${
                                reclamoActivo
                                  ? "bg-slate-400"
                                  : "bg-green-600 hover:bg-green-700"
                              }`}
                            >
                              {reclamoActivo
                                ? "⚠️ Bloqueado por reclamo"
                                : completando
                                ? "Completando..."
                                : "✅ Completar trabajo"}
                            </button>
                          )}

                          <button
                            type="button"
                            onClick={
                              contactarCliente
                            }
                            className="rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 transition hover:bg-blue-50"
                          >
                            💬 Contactar al cliente
                          </button>

                          <button
                            type="button"
                            onClick={
                              abrirDireccion
                            }
                            className="rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 transition hover:bg-blue-50 sm:col-span-2"
                          >
                            📍 Ver dirección
                          </button>

                          {etapaActual <
                            4 && (
                            <div className="sm:col-span-2 mt-2 rounded-2xl border border-red-200 bg-red-50 p-4">

                              <p className="text-sm font-bold text-red-900">
                                ¿Tuviste un problema y ya no puedes realizar este trabajo?
                              </p>

                              <p className="mt-1 text-xs leading-5 text-red-700">
                                Puedes liberarlo para que la solicitud vuelva a estar disponible para otro profesional.
                              </p>

                              <button
                                type="button"
                                disabled={
                                  liberandoTrabajo ||
                                  cambiandoEstado ||
                                  completando
                                }
                                onClick={
                                  liberarTrabajo
                                }
                                className="mt-4 w-full rounded-xl border-2 border-red-600 bg-white px-5 py-3 font-extrabold text-red-700 transition hover:bg-red-100 disabled:cursor-not-allowed disabled:opacity-50"
                              >
                                {liberandoTrabajo
                                  ? "Liberando trabajo..."
                                  : "⚠️ No puedo realizar este trabajo"}
                              </button>

                            </div>
                          )}
                        </div>

                        {cambioPresupuestoPendiente && (
                          <div className="mt-6 rounded-2xl border-2 border-violet-200 bg-violet-50 p-5">
                            <p className="text-sm font-black uppercase tracking-wide text-violet-700">
                              ⏳ Cambio de presupuesto pendiente
                            </p>

                            <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                              <div className="rounded-xl bg-white p-4">
                                <p className="text-xs font-bold text-slate-500">
                                  Total anterior
                                </p>
                                <p className="mt-1 text-xl font-black text-slate-950">
                                  ${Number(
                                    cambioPresupuestoPendiente.original_amount
                                  ).toFixed(2)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-4">
                                <p className="text-xs font-bold text-slate-500">
                                  Adicional solicitado
                                </p>
                                <p className="mt-1 text-xl font-black text-violet-700">
                                  +${Number(
                                    cambioPresupuestoPendiente.additional_amount
                                  ).toFixed(2)}
                                </p>
                              </div>

                              <div className="rounded-xl bg-white p-4">
                                <p className="text-xs font-bold text-slate-500">
                                  Nuevo total propuesto
                                </p>
                                <p className="mt-1 text-xl font-black text-slate-950">
                                  ${Number(
                                    cambioPresupuestoPendiente.new_total_amount
                                  ).toFixed(2)}
                                </p>
                              </div>
                            </div>

                            <p className="mt-4 text-sm leading-6 text-violet-900">
                              El cliente debe aceptar o rechazar este cambio antes de que puedas enviar otro.
                            </p>
                          </div>
                        )}

                        {!cambioPresupuestoPendiente &&
                          ultimoCambioPresupuesto &&
                          ultimoCambioPresupuesto.status !== "pending" && (
                          <div className={`mt-6 rounded-2xl border p-5 ${
                            ultimoCambioPresupuesto.status === "accepted"
                              ? "border-emerald-200 bg-emerald-50"
                              : ultimoCambioPresupuesto.status === "rejected"
                              ? "border-red-200 bg-red-50"
                              : "border-slate-200 bg-slate-50"
                          }`}>
                            <p className={`font-black ${
                              ultimoCambioPresupuesto.status === "accepted"
                                ? "text-emerald-900"
                                : ultimoCambioPresupuesto.status === "rejected"
                                ? "text-red-900"
                                : "text-slate-900"
                            }`}>
                              {ultimoCambioPresupuesto.status === "accepted" &&
                              ultimoCambioPresupuesto.payment_status === "paid"
                                ? "✓ Último cambio aceptado y pagado"
                                : ultimoCambioPresupuesto.status === "accepted"
                                ? "⏳ Último cambio aceptado · pendiente de pago"
                                : ultimoCambioPresupuesto.status === "rejected"
                                ? "✕ Último cambio rechazado por el cliente"
                                : "Último cambio de presupuesto cancelado"}
                            </p>

                            <p className="mt-2 text-sm text-slate-700">
                              Adicional: ${Number(
                                ultimoCambioPresupuesto.additional_amount
                              ).toFixed(2)} · Nuevo total: ${Number(
                                ultimoCambioPresupuesto.new_total_amount
                              ).toFixed(2)}
                            </p>

                            {ultimoCambioPresupuesto.status === "accepted" &&
                              ultimoCambioPresupuesto.payment_status === "paid" && (
                              <p className="mt-2 text-sm font-bold text-emerald-800">
                                Pago adicional confirmado por Stripe. Neto adicional para ti: $
                                {Number(
                                  ultimoCambioPresupuesto.additional_provider_net_amount ||
                                    0
                                ).toFixed(2)}.
                              </p>
                            )}

                            {ultimoCambioPresupuesto.status === "accepted" &&
                              ultimoCambioPresupuesto.payment_status !== "paid" && (
                              <p className="mt-2 text-sm font-bold text-amber-700">
                                El cliente aceptó el cambio, pero el pago adicional todavía no está confirmado.
                              </p>
                            )}
                          </div>
                        )}

                        {mostrarCambioPresupuesto &&
                          etapaActual === 4 &&
                          !cambioPresupuestoPendiente && (
                          <form
                            onSubmit={
                              enviarCambioPresupuesto
                            }
                            className="mt-6 rounded-2xl border-2 border-violet-300 bg-white p-5"
                          >
                            <div className="flex items-start justify-between gap-4">
                              <div>
                                <p className="text-sm font-black uppercase tracking-wide text-violet-700">
                                  💰 Cambio de presupuesto
                                </p>

                                <h3 className="mt-1 text-xl font-black text-slate-950">
                                  Solicitar un monto adicional
                                </h3>

                                <p className="mt-2 text-sm leading-6 text-slate-600">
                                  Explica qué cambió. El cliente verá el total anterior, el adicional y el nuevo total antes de decidir.
                                </p>
                              </div>

                              <button
                                type="button"
                                onClick={() => {
                                  setMostrarCambioPresupuesto(
                                    false
                                  );
                                  setError("");
                                }}
                                className="rounded-lg px-3 py-2 font-black text-slate-500 hover:bg-slate-100"
                              >
                                ✕
                              </button>
                            </div>

                            <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                              <div>
                                <label className="text-sm font-black text-slate-800">
                                  Motivo
                                </label>

                                <select
                                  value={
                                    motivoCambioPresupuesto
                                  }
                                  onChange={(e) =>
                                    setMotivoCambioPresupuesto(
                                      e.target.value
                                    )
                                  }
                                  className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-4 py-3 font-semibold text-slate-900 outline-none focus:border-violet-500"
                                >
                                  <option value="">
                                    Selecciona un motivo
                                  </option>
                                  <option value="problema_mayor">
                                    El problema es mayor de lo esperado
                                  </option>
                                  <option value="trabajo_adicional">
                                    Se necesita trabajo adicional
                                  </option>
                                  <option value="materiales_adicionales">
                                    Se necesitan materiales adicionales
                                  </option>
                                  <option value="otro">
                                    Otro motivo
                                  </option>
                                </select>
                              </div>

                              <div>
                                <label className="text-sm font-black text-slate-800">
                                  Monto adicional
                                </label>

                                <div className="mt-2 flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-violet-500">
                                  <span className="flex items-center bg-slate-50 px-4 font-black text-slate-600">
                                    $
                                  </span>

                                  <input
                                    type="number"
                                    min="0.01"
                                    step="0.01"
                                    value={
                                      montoAdicional
                                    }
                                    onChange={(e) =>
                                      setMontoAdicional(
                                        e.target.value
                                      )
                                    }
                                    placeholder="0.00"
                                    className="w-full px-4 py-3 font-bold text-slate-950 outline-none"
                                  />
                                </div>
                              </div>
                            </div>

                            <div className="mt-4">
                              <label className="text-sm font-black text-slate-800">
                                Explicación
                              </label>

                              <textarea
                                value={
                                  descripcionCambioPresupuesto
                                }
                                onChange={(e) =>
                                  setDescripcionCambioPresupuesto(
                                    e.target.value
                                  )
                                }
                                rows={4}
                                placeholder="Explica qué descubriste, qué trabajo adicional hace falta y por qué cambia el precio."
                                className="mt-2 w-full resize-none rounded-xl border border-slate-300 px-4 py-3 text-slate-900 outline-none focus:border-violet-500"
                              />
                            </div>

                            <div className="mt-4">
                              <label className="text-sm font-black text-slate-800">
                                Fotos o videos (opcional)
                              </label>

                              <input
                                type="file"
                                multiple
                                accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                                onChange={
                                  seleccionarArchivosCambioPresupuesto
                                }
                                className="mt-2 block w-full rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm"
                              />

                              <p className="mt-2 text-xs text-slate-500">
                                Máximo 10 fotos y 2 videos. Cada archivo debe pesar 50 MB o menos.
                              </p>
                            </div>

                            {archivosCambioPresupuesto.length > 0 && (
                              <div className="mt-4 space-y-2">
                                {archivosCambioPresupuesto.map(
                                  (file, index) => (
                                    <div
                                      key={`${file.name}-${index}`}
                                      className="flex items-center justify-between gap-3 rounded-xl bg-slate-50 px-4 py-3"
                                    >
                                      <div className="min-w-0">
                                        <p className="truncate text-sm font-bold text-slate-800">
                                          {file.type.startsWith("video/")
                                            ? "🎥"
                                            : "📷"}{" "}
                                          {file.name}
                                        </p>
                                      </div>

                                      <button
                                        type="button"
                                        onClick={() =>
                                          quitarArchivoCambioPresupuesto(
                                            index
                                          )
                                        }
                                        className="shrink-0 rounded-lg px-3 py-1.5 text-sm font-black text-red-700 hover:bg-red-50"
                                      >
                                        Quitar
                                      </button>
                                    </div>
                                  )
                                )}
                              </div>
                            )}

                            <div className="mt-5 rounded-2xl bg-violet-50 p-4">
                              <div className="flex items-center justify-between gap-4">
                                <span className="font-bold text-violet-900">
                                  Precio actual
                                </span>
                                <strong className="text-violet-950">
                                  ${Number(
                                    cambiosPresupuesto.find(
                                      (cambio) =>
                                        cambio.status === "accepted"
                                    )?.new_total_amount ??
                                    pago?.job_amount ??
                                    oferta?.price ??
                                    0
                                  ).toFixed(2)}
                                </strong>
                              </div>

                              <div className="mt-2 flex items-center justify-between gap-4">
                                <span className="font-bold text-violet-900">
                                  Adicional solicitado
                                </span>
                                <strong className="text-violet-700">
                                  +${Number(
                                    montoAdicional || 0
                                  ).toFixed(2)}
                                </strong>
                              </div>

                              <div className="mt-3 border-t border-violet-200 pt-3">
                                <div className="flex items-center justify-between gap-4">
                                  <span className="font-black text-violet-950">
                                    Nuevo total propuesto
                                  </span>
                                  <strong className="text-xl text-violet-950">
                                    ${(
                                      Number(
                                        cambiosPresupuesto.find(
                                          (cambio) =>
                                            cambio.status === "accepted"
                                        )?.new_total_amount ??
                                        pago?.job_amount ??
                                        oferta?.price ??
                                        0
                                      ) +
                                      Number(
                                        montoAdicional || 0
                                      )
                                    ).toFixed(2)}
                                  </strong>
                                </div>
                              </div>
                            </div>

                            <button
                              type="submit"
                              disabled={
                                enviandoCambioPresupuesto
                              }
                              className="mt-5 w-full rounded-xl bg-violet-600 px-5 py-3.5 font-black text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              {enviandoCambioPresupuesto
                                ? "Enviando cambio..."
                                : "Enviar cambio al cliente"}
                            </button>

                            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                              El precio no cambia automáticamente. El cliente debe aceptar la solicitud antes de que FixFlow pueda cobrar el monto adicional.
                            </p>
                          </form>
                        )}
                      </div>
                    )}
                  </>
                )}
              </section>
            )}

            {/* INFORMACION */}

            <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

              <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
                <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                  📝
                </span>
                Información del trabajo
              </h2>

              <div className="mt-5 rounded-2xl border border-slate-200 p-5">

                <p className="font-black text-slate-900">
                  Descripción del problema
                </p>

                <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-600">
                  {trabajo.description}
                </p>

                {trabajo.address_line1 && (
                  <>
                    <div className="my-5 border-t border-slate-200" />

                    <p className="font-black text-slate-900">
                      Dirección del servicio
                    </p>

                    <p className="mt-2 text-slate-600">
                      {
                        trabajo.address_line1
                      }
                      ,{" "}
                      {
                        trabajo.city
                      }
                      ,{" "}
                      {
                        trabajo.state
                      }{" "}
                      {
                        trabajo.zip_code
                      }
                    </p>
                  </>
                )}
              </div>
            </section>
          </div>

          {/* DERECHA */}

          <div className="space-y-6">

            {/* FOTOS */}

            {fotos.length >
              0 && (
              <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-lg">

                <h2 className="flex items-center gap-3 text-xl font-black text-slate-950">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-100">
                    📷
                  </span>

                  Fotos del problema

                  <span className="text-slate-500">
                    ({fotos.length})
                  </span>
                </h2>

                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {fotos
                    .slice(
                      0,
                      3
                    )
                    .map(
                      (
                        foto,
                        index
                      ) => (
                        <a
                          key={
                            foto.id
                          }
                          href={
                            foto.file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group overflow-hidden rounded-2xl border border-slate-200 bg-slate-100"
                        >
                          <img
                            src={
                              foto.file_url
                            }
                            alt={`Foto ${
                              index +
                              1
                            }`}
                            className="h-44 w-full object-cover transition duration-300 group-hover:scale-105"
                          />
                        </a>
                      )
                    )}
                </div>

                <div className="mt-5 text-center">
                  <a
                    href={
                      fotos[0]
                        .file_url
                    }
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block rounded-xl border border-slate-300 px-5 py-3 font-bold text-blue-700 transition hover:bg-blue-50"
                  >
                    Ver fotos en tamaño completo
                  </a>
                </div>
              </section>
            )}

            {/* COMPROBANTE / PRESUPUESTO */}

            {oferta && (
              <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg">
                <div className="border-b border-slate-200 bg-slate-50 px-6 py-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-xl shadow-sm ring-1 ring-slate-200">
                          🧾
                        </span>
                        <div>
                          <p className="text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                            FixFlow
                          </p>
                          <h2 className="text-xl font-black text-slate-950">
                            {pago
                              ? cancelado
                                ? canceladoPorFixFlow
                                  ? "Resolución financiera de FixFlow"
                                  : "Compensación por cancelación"
                                : "Comprobante del servicio"
                              : "Resumen de tu presupuesto"}
                          </h2>
                        </div>
                      </div>
                    </div>

                    <div className="text-left sm:text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                        Trabajo
                      </p>
                      <p className="mt-1 font-mono text-sm font-bold text-slate-700">
                        #{trabajo.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p className="mt-1 text-xs text-slate-500">
                        {formatearFechaHora(oferta.created_at)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="p-6">
                  {pago ? (
                    cancelado ? (
                      <>
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
                          <p className="text-xs font-black uppercase tracking-[0.16em] text-amber-700">
                            {canceladoPorFixFlow
                              ? "Trabajo cancelado por resolución de FixFlow"
                              : "Trabajo cancelado por el cliente"}
                          </p>

                          <div className="mt-4 flex items-end justify-between gap-4 rounded-xl bg-white p-5 ring-1 ring-amber-200">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                                {canceladoPorFixFlow
                                  ? "Compensación definida por FixFlow"
                                  : "Compensación por cancelación"}
                              </p>
                              <p className="mt-1 text-xs leading-5 text-slate-500">
                                {canceladoPorFixFlow
                                  ? "Importe asignado al profesional en la resolución final del reclamo."
                                  : "Importe que te corresponde por la etapa alcanzada antes de la cancelación."}
                              </p>
                            </div>

                            <p className="text-3xl font-black tracking-tight text-emerald-700">
                              ${compensacionMostrada.toFixed(2)}
                            </p>
                          </div>

                          {canceladoPorFixFlow &&
                            reclamoResuelto && (
                              <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4">
                                <p className="text-xs font-black uppercase tracking-wide text-blue-700">
                                  Resultado del reclamo
                                </p>

                                <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">
                                      Tu compensación
                                    </p>
                                    <p className="mt-1 text-lg font-black text-emerald-700">
                                      ${compensacionPorReclamo.toFixed(2)}
                                    </p>
                                  </div>

                                  <div className="rounded-lg bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">
                                      Reembolso al cliente
                                    </p>
                                    <p className="mt-1 text-lg font-black text-blue-800">
                                      ${reembolsoClientePorReclamo.toFixed(2)}
                                    </p>
                                  </div>
                                </div>

                                {reclamo?.resolution_notes && (
                                  <div className="mt-3 rounded-lg bg-white p-3">
                                    <p className="text-xs font-bold text-slate-500">
                                      Resolución de FixFlow
                                    </p>
                                    <p className="mt-1 whitespace-pre-wrap text-sm leading-6 text-slate-700">
                                      {reclamo.resolution_notes}
                                    </p>
                                  </div>
                                )}
                              </div>
                            )}

                          {Number(pago.cancellation_penalty_percent || 0) > 0 && (
                            <div className="mt-4 flex items-center justify-between gap-4 rounded-xl border border-amber-200 bg-white px-4 py-3">
                              <span className="text-sm font-semibold text-slate-600">
                                Etapa de cancelación
                              </span>
                              <span className="text-sm font-black text-slate-900">
                                {pago.cancellation_stage === "on_the_way"
                                  ? "En camino"
                                  : pago.cancellation_stage === "arrived"
                                  ? "Llegaste al lugar"
                                  : "Antes de iniciar"}
                              </span>
                            </div>
                          )}
                        </div>

                        {cambiosPresupuestoPagados.length > 0 && (
                            <div className="mt-4 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3">
                              <p className="text-sm font-black text-violet-900">
                                Cambio de presupuesto incluido
                              </p>
                              <p className="mt-1 text-xs font-bold leading-5 text-violet-700">
                                Este comprobante incluye {cambiosPresupuestoPagados.length} cambio{cambiosPresupuestoPagados.length === 1 ? "" : "s"} pagado{cambiosPresupuestoPagados.length === 1 ? "" : "s"} por ${adicionalServicioPagado.toFixed(2)} adicionales. Tu neto adicional es ${netoAdicionalProfesional.toFixed(2)}.
                              </p>
                            </div>
                          )}

                          <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm">
                              ✓
                            </span>
                            <div>
                              <p className="text-sm font-black text-emerald-900">
                                Compensación procesada
                              </p>
                              <p className="text-xs text-emerald-700">
                                Este es el importe final correspondiente a esta cancelación.
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                            Procesado
                          </span>
                        </div>
                      </>
                    ) : (
                      <>
                        <div className="rounded-2xl border border-slate-200 bg-white px-5 py-2">
                          <div className="flex items-center justify-between gap-4 border-b border-dashed border-slate-300 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-600">
                                Valor del servicio
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Presupuesto aceptado por el cliente
                              </p>
                            </div>
                            <p className="text-lg font-black text-slate-950">
                              ${valorServicioProfesional.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4 border-b border-dashed border-slate-300 py-4">
                            <div>
                              <p className="text-sm font-semibold text-slate-600">
                                Tarifa de servicio FixFlow
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                {Number(pago.provider_commission_percent).toFixed(2)}% del valor del servicio
                              </p>
                            </div>
                            <p className="font-bold text-slate-700">
                              ${comisionTotalProfesional.toFixed(2)}
                            </p>
                          </div>

                          <div className="flex items-center justify-between gap-4 py-5">
                            <div>
                              <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                                Total a recibir
                              </p>
                              <p className="mt-1 text-xs text-slate-400">
                                Neto después de la tarifa FixFlow
                              </p>
                            </div>
                            <p className="text-3xl font-black tracking-tight text-slate-950">
                              ${netoTotalProfesional.toFixed(2)}
                            </p>
                          </div>
                        </div>

                        <div className="mt-4 flex items-center justify-between gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-emerald-100 text-sm">
                              ✓
                            </span>
                            <div>
                              <p className="text-sm font-black text-emerald-900">
                                Pago del cliente registrado
                              </p>
                              <p className="text-xs text-emerald-700">
                                Tu importe neto ya está calculado.
                              </p>
                            </div>
                          </div>

                          <span className="rounded-full bg-white px-3 py-1 text-xs font-black uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200">
                            Registrado
                          </span>
                        </div>
                      </>
                    )
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                      <div className="flex items-center justify-between gap-4">
                        <div>
                          <p className="text-sm font-semibold text-slate-600">
                            Precio estimado
                          </p>
                          <p className="mt-1 text-xs text-slate-400">
                            Pendiente de aceptación del cliente
                          </p>
                        </div>
                        <p className="text-2xl font-black text-slate-950">
                          ${Number(oferta.price).toFixed(2)}
                        </p>
                      </div>
                    </div>
                  )}

                  <div className="mt-6">
                    <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-400">
                      Detalles del servicio
                    </p>

                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          Tiempo para llegar
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {mostrarMinutos(oferta.arrival_minutes)}
                        </p>
                      </div>

                      <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
                        <p className="text-xs font-semibold text-slate-500">
                          Duración estimada
                        </p>
                        <p className="mt-1 font-black text-slate-900">
                          {mostrarMinutos(oferta.estimated_job_minutes)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-5 rounded-2xl border border-slate-200 p-5">
                    <p className="text-sm font-black text-slate-800">
                      Mensaje para el cliente
                    </p>
                    <div className="mt-3 rounded-xl bg-slate-50 p-4 leading-6 text-slate-700">
                      {oferta.message || "Sin mensaje adicional."}
                    </div>
                  </div>

                  {cancelado ? (
                    <div className="mt-4 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-bold text-red-800">
                      ❌{" "}
                      {canceladoPorFixFlow
                        ? "Trabajo cancelado por resolución de FixFlow."
                        : "El cliente canceló este trabajo."}
                    </div>
                  ) : !pago ? (
                    <div
                      className={`mt-4 rounded-xl border p-4 text-sm font-bold ${
                        oferta.status === "selected"
                          ? "border-green-200 bg-green-50 text-green-800"
                          : oferta.status === "rejected"
                          ? "border-slate-200 bg-slate-50 text-slate-600"
                          : "border-blue-200 bg-blue-50 text-blue-800"
                      }`}
                    >
                      {oferta.status === "selected"
                        ? "✅ Presupuesto aceptado por el cliente."
                        : oferta.status === "rejected"
                        ? "Este presupuesto no fue seleccionado."
                        : "✓ Presupuesto enviado. Esperando decisión del cliente."}
                    </div>
                  ) : null}

                  {pago && (
                    <p className="mt-5 text-center text-xs leading-5 text-slate-400">
                      Este comprobante resume el valor del servicio y el importe neto correspondiente al profesional.
                    </p>
                  )}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* RECLAMO / EVIDENCIA DEL PROFESIONAL */}

        {reclamo && (
          <section
            id="reclamo-profesional"
            className="mt-6 rounded-3xl border-2 border-rose-200 bg-white p-6 shadow-lg md:p-7"
          >
            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="text-sm font-black uppercase tracking-wide text-rose-700">
                  ⚠️ Reclamo del cliente
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {profesionalYaRespondio
                    ? "Respuesta enviada al reclamo"
                    : reclamo.status === "open" ||
                      reclamo.status === "reviewing" ||
                      reclamo.status === "in_review"
                    ? "Adjuntar evidencia al reclamo"
                    : "Historial del reclamo"}
                </h2>

                <p className="mt-2 max-w-3xl text-slate-600">
                  {profesionalYaRespondio
                    ? "Tu respuesta quedó registrada. Ya no puedes agregar, quitar ni modificar información de este reclamo."
                    : reclamo.status === "open" ||
                      reclamo.status === "reviewing" ||
                      reclamo.status === "in_review"
                    ? "Puedes enviar una sola respuesta con fotos o videos para que FixFlow tenga evidencia de ambas partes antes de resolver el reclamo."
                    : "Consulta los detalles, la evidencia y la resolución final de este reclamo."}
                </p>
              </div>

              <span
                className={`w-fit rounded-full px-4 py-2 text-sm font-black ${
                  reclamo.status === "open"
                    ? "bg-red-100 text-red-800"
                    : reclamo.status === "reviewing"
                    ? "bg-amber-100 text-amber-800"
                    : "bg-green-100 text-green-800"
                }`}
              >
                {reclamo.status === "open"
                  ? "Abierto"
                  : reclamo.status === "reviewing"
                  ? "En revisión"
                  : "Cerrado"}
              </span>
            </div>

            {(reclamo.status === "open" ||
              reclamo.status === "reviewing" ||
              reclamo.status === "in_review") &&
              !profesionalYaRespondio && (
              <div
                className={`mt-5 rounded-2xl border p-5 ${
                  tiempoRespuestaReclamo.vencido
                    ? "border-red-300 bg-red-50"
                    : "border-amber-300 bg-amber-50"
                }`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p
                      className={`text-sm font-black uppercase tracking-wide ${
                        tiempoRespuestaReclamo.vencido
                          ? "text-red-700"
                          : "text-amber-700"
                      }`}
                    >
                      Tiempo para responder
                    </p>

                    <p
                      className={`mt-1 text-2xl font-black ${
                        tiempoRespuestaReclamo.vencido
                          ? "text-red-950"
                          : "text-amber-950"
                      }`}
                    >
                      {tiempoRespuestaReclamo.texto}
                    </p>

                    <p
                      className={`mt-2 text-sm ${
                        tiempoRespuestaReclamo.vencido
                          ? "text-red-800"
                          : "text-amber-800"
                      }`}
                    >
                      {tiempoRespuestaReclamo.vencido
                        ? "Ya no puedes enviar nueva evidencia desde el panel. Admin revisará el reclamo con la información disponible."
                        : "Tienes 24 horas desde que se abrió el reclamo para enviar tu respuesta, fotos o videos."}
                    </p>
                  </div>

                  {reclamo.provider_response_deadline && (
                    <div className="rounded-xl bg-white px-4 py-3 text-sm shadow-sm">
                      <p className="font-bold text-slate-500">
                        Fecha límite
                      </p>
                      <p className="mt-1 font-black text-slate-900">
                        {formatearFechaHora(
                          reclamo.provider_response_deadline
                        )}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 rounded-2xl border border-rose-100 bg-rose-50 p-5">
              <p className="text-sm font-bold text-rose-700">
                Motivo del cliente
              </p>

              <p className="mt-2 font-black text-rose-950">
                {reclamo.reason}
              </p>

              {reclamo.description && (
                <p className="mt-3 whitespace-pre-wrap leading-7 text-rose-900">
                  {reclamo.description}
                </p>
              )}
            </div>

            {evidenciasReclamo.length > 0 && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-black text-slate-900">
                  Evidencia que ya enviaste
                </p>

                <p className="mt-1 text-sm text-slate-600">
                  {evidenciasReclamo.filter(
                    (item) =>
                      item.file_type === "image"
                  ).length}{" "}
                  foto(s) ·{" "}
                  {evidenciasReclamo.filter(
                    (item) =>
                      item.file_type === "video"
                  ).length}{" "}
                  video(s)
                </p>
              </div>
            )}

            {(reclamo.status === "open" ||
              reclamo.status === "reviewing") &&
              !profesionalYaRespondio &&
              !tiempoRespuestaReclamo.vencido && (
              <>
                <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-black text-slate-900">
                        Fotos o videos
                      </p>

                      <p className="mt-1 text-sm text-slate-600">
                        Hasta 10 fotos y 2 videos en total. Máximo 50 MB por archivo.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 transition hover:bg-blue-50">
                      📎 Adjuntar archivos

                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                        onChange={
                          seleccionarArchivosReclamo
                        }
                        disabled={
                          subiendoEvidencia
                        }
                        className="hidden"
                      />
                    </label>
                  </div>

                  {archivosReclamo.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {archivosReclamo.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">
                                {file.type.startsWith(
                                  "video/"
                                )
                                  ? "🎥"
                                  : "🖼️"}{" "}
                                {file.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {(file.size /
                                  1024 /
                                  1024).toFixed(
                                  2
                                )}{" "}
                                MB
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={
                                subiendoEvidencia
                              }
                              onClick={() =>
                                quitarArchivoReclamo(
                                  index
                                )
                              }
                              className="shrink-0 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-extrabold text-red-700 hover:bg-red-100 disabled:opacity-50"
                            >
                              Quitar
                            </button>
                          </div>
                        )
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">
                  <label className="mb-2 block font-black text-slate-900">
                    Explicación de la evidencia *
                  </label>

                  <p className="mb-3 text-sm text-slate-600">
                    Describe qué muestran las fotos o videos y qué debe considerar FixFlow al revisar este reclamo.
                  </p>

                  <textarea
                    value={explicacionEvidencia}
                    onChange={(e) =>
                      setExplicacionEvidencia(
                        e.target.value
                      )
                    }
                    rows={5}
                    maxLength={1500}
                    disabled={subiendoEvidencia}
                    placeholder="Ejemplo: Estas fotos muestran que el trabajo sí fue terminado y que el daño reportado por el cliente ya existía antes de comenzar..."
                    className="w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
                  />

                  <p className="mt-2 text-right text-sm text-slate-500">
                    {explicacionEvidencia.length}/1500
                  </p>
                </div>

                <button
                  type="button"
                  disabled={
                    subiendoEvidencia ||
                    archivosReclamo.length ===
                      0 ||
                    !explicacionEvidencia.trim()
                  }
                  onClick={
                    subirEvidenciaReclamo
                  }
                  className="mt-5 w-full rounded-xl bg-rose-700 px-6 py-4 text-lg font-black text-white shadow transition hover:bg-rose-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {subiendoEvidencia
                    ? "Subiendo evidencia..."
                    : "Enviar evidencia al reclamo"}
                </button>

                <p className="mt-3 text-center text-xs leading-5 text-slate-500">
                  Una vez enviada, la evidencia quedará asociada al reclamo para revisión de FixFlow.
                </p>
              </>
            )}

            {!profesionalYaRespondio &&
              tiempoRespuestaReclamo.vencido && (
                <div className="mt-5 rounded-2xl border border-red-300 bg-red-50 p-5">
                  <p className="font-black text-red-900">
                    ⏰ Plazo de respuesta vencido
                  </p>

                  <p className="mt-2 text-sm leading-6 text-red-800">
                    Ya no puedes agregar comentarios, fotos o videos a este reclamo. FixFlow lo revisará con la evidencia disponible.
                  </p>
                </div>
              )}

            {profesionalYaRespondio && (
              <div className="mt-5 rounded-2xl border border-emerald-300 bg-emerald-50 p-5">
                <p className="font-black text-emerald-900">
                  ✅ Tu respuesta ya fue enviada
                </p>

                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  La evidencia y tu explicación quedaron registradas para revisión de FixFlow. Por seguridad, ya no puedes agregar, quitar ni modificar información de este reclamo.
                </p>

                <div className="mt-4 rounded-xl border border-emerald-200 bg-white p-4">
                  <p className="text-xs font-black uppercase tracking-wide text-emerald-700">
                    Tu explicación
                  </p>

                  <p className="mt-2 whitespace-pre-wrap text-slate-700">
                    {reclamo.provider_response ||
                      "El profesional envió evidencia para responder al reclamo."}
                  </p>
                </div>
              </div>
            )}

            {reclamo.status !== "open" &&
              reclamo.status !== "reviewing" &&
              reclamo.status !== "in_review" && (
                <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-5">
                  <p className="font-black text-green-900">
                    ✅ Reclamo resuelto
                  </p>

                  <p className="mt-2 text-sm leading-6 text-green-800">
                    FixFlow cerró este reclamo. El trabajo fue autorizado para continuar y ya puedes completar el servicio normalmente.
                  </p>

                  {reclamo.resolution_notes && (
                    <div className="mt-4 rounded-xl border border-green-200 bg-white p-4">
                      <p className="text-xs font-black uppercase tracking-wide text-green-700">
                        Resolución de FixFlow
                      </p>

                      <p className="mt-2 whitespace-pre-wrap text-slate-700">
                        {reclamo.resolution_notes}
                      </p>
                    </div>
                  )}
                </div>
              )}
          </section>
        )}

        {/* MENSAJES */}

        {mensaje && !cancelado && (
          <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-5 font-bold text-green-800 shadow-sm">
            ✅ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-5 font-bold text-red-700 shadow-sm">
            {error}
          </div>
        )}

        {/* ENVIAR PRESUPUESTO */}

        {trabajo.status ===
          "open" && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-lg md:p-7">

            <h2 className="flex items-center gap-3 text-2xl font-black text-slate-950">
              <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100">
                💵
              </span>
              Enviar presupuesto
            </h2>

            {oferta ? (
              <div className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-6">

                <p className="text-lg font-black text-green-900">
                  ✅ Presupuesto enviado
                </p>

                <p className="mt-2 text-green-800">
                  El cliente ya puede comparar tu presupuesto con otras ofertas.
                </p>
              </div>
            ) : (
              <form
                onSubmit={
                  enviarOferta
                }
                className="mt-6"
              >

                <div className="grid grid-cols-1 gap-5 md:grid-cols-3">

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Precio
                    </label>

                    <div className="flex overflow-hidden rounded-xl border border-slate-300 bg-white focus-within:border-blue-500">
                      <span className="flex items-center border-r border-slate-300 bg-slate-50 px-4 font-bold text-slate-500">
                        $
                      </span>

                      <input
                        name="price"
                        type="number"
                        min="0.01"
                        step="0.01"
                        required
                        placeholder="Ej. 150.00"
                        className="w-full p-4 text-slate-900 outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Minutos para llegar
                    </label>

                    <input
                      name="arrival_minutes"
                      type="number"
                      min="0"
                      step="1"
                      required
                      placeholder="Ej. 30"
                      className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>

                  <div>
                    <label className="mb-2 block text-sm font-bold text-slate-800">
                      Duración estimada
                    </label>

                    <input
                      name="estimated_job_minutes"
                      type="number"
                      min="1"
                      step="1"
                      required
                      placeholder="Ej. 60"
                      className="w-full rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-blue-500"
                    />
                  </div>
                </div>

                <div className="mt-5">

                  <label className="mb-2 block text-sm font-bold text-slate-800">
                    Mensaje para el cliente
                  </label>

                  <textarea
                    name="message"
                    rows={4}
                    required
                    placeholder="Escribe un mensaje para el cliente..."
                    className="w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900 outline-none focus:border-blue-500"
                  />
                </div>

                <button
                  type="submit"
                  disabled={
                    enviando
                  }
                  className="mt-5 w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-black text-white shadow-md transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {enviando
                    ? "Enviando presupuesto..."
                    : "Enviar presupuesto"}
                </button>

                <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
                  💡 El cliente podrá comparar tu precio, tiempo de llegada y duración estimada con otros profesionales.
                </div>
              </form>
            )}
          </section>
        )}
      </div>
    </main>
  );
}

/*
  COMPONENTE INFO
*/

function Info({
  icono,
  titulo,
  valor,
}: {
  icono: string;
  titulo: string;
  valor: string;
}) {
  return (
    <div className="flex items-start gap-3">

      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-blue-50 text-xl">
        {icono}
      </div>

      <div>
        <p className="font-extrabold text-slate-900">
          {valor}
        </p>

        <p className="mt-1 text-xs text-slate-500">
          {titulo}
        </p>
      </div>
    </div>
  );
}

/*
  FILAS RESUMEN
*/

function FilaResumen({
  titulo,
  valor,
  fuerte = false,
}: {
  titulo: string;
  valor: string;
  fuerte?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-4 border-b border-slate-200 px-5 py-4 last:border-b-0">

      <p className="text-sm text-slate-600">
        {titulo}
      </p>

      <p
        className={
          fuerte
            ? "text-xl font-black text-slate-950"
            : "font-bold text-slate-900"
        }
      >
        {valor}
      </p>
    </div>
  );
}