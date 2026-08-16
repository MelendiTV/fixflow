"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { createClient } from "@supabase/supabase-js";

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
  cancellation_reason: string | null;
  cancelled_at: string | null;
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

type Profesional = {
  user_id: string;
  business_name: string | null;
  trade: string | null;
  years_experience: number | null;
  average_rating: number | null;
  completed_jobs: number | null;
  verified: boolean | null;
};

type OfertaConProfesional = Oferta & {
  profesional: Profesional | null;
};

type Review = {
  id: string;
  job_id: string;
  reviewer_id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
  created_at: string;
};

type JobClaim = {
  id: string;
  request_id: string;
  customer_id: string;
  provider_id: string;
  reason: string;
  description: string | null;
  status: string;
  resolution_type: string | null;
  resolution_notes: string | null;
  provider_award_amount: number | null;
  customer_refund_amount: number | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
};

type PaymentSettings = {
  id: string;
  provider_commission_percent: number;
  customer_service_fee_percent: number;
  customer_cancel_on_the_way_percent: number;
  customer_cancel_arrived_percent: number;
  cancellation_provider_percent: number;
  currency: string;
  active: boolean;
};

type PaymentCalculation = {
  id: string;
  request_id: string;
  offer_id: string | null;
  customer_id: string;
  provider_id: string;
  job_amount: number;
  customer_fee_percent: number;
  customer_fee_amount: number;
  customer_total_amount: number;
  provider_commission_percent: number;
  provider_commission_amount: number;
  provider_net_amount: number;
  platform_revenue_amount: number;
  refunded_amount: number | null;
  refunded_at: string | null;
  released_at: string | null;
  currency: string;
  status: string;
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

type CompletionEvidence = {
  id: string;
  request_id: string;
  provider_id: string;
  file_type: "image" | "video";
  file_path: string;
  file_url: string | null;
  created_at: string;
  signed_url: string | null;
};

function nombreOficio(
  trade: string | null
) {
  const oficios: Record<
    string,
    string
  > = {
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

function nombreEstadoSolicitud(
  status: string
) {
  if (status === "open") {
    return "Abierta";
  }

  if (status === "in_progress") {
    return "Trabajo en progreso";
  }

  if (status === "completed") {
    return "Completada";
  }

  if (status === "cancelled") {
    return "Cancelada";
  }

  return status;
}

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

function numeroEtapa(
  status: string,
  jobStage: string | null
) {
  if (status === "completed") {
    return 5;
  }

  if (jobStage === "working") {
    return 4;
  }

  if (jobStage === "arrived") {
    return 3;
  }

  if (jobStage === "on_the_way") {
    return 2;
  }

  return 1;
}

function tituloEtapa(
  status: string,
  jobStage: string | null
) {
  if (status === "completed") {
    return "Trabajo completado";
  }

  if (jobStage === "working") {
    return "El profesional inició el trabajo";
  }

  if (jobStage === "arrived") {
    return "El profesional ya llegó";
  }

  if (jobStage === "on_the_way") {
    return "El profesional va en camino";
  }

  return "Profesional contratado";
}

function textoEtapa(
  status: string,
  jobStage: string | null
) {
  if (status === "completed") {
    return "El profesional marcó el servicio como terminado.";
  }

  if (jobStage === "working") {
    return "El profesional ya comenzó a realizar el servicio.";
  }

  if (jobStage === "arrived") {
    return "El profesional indicó que ya se encuentra en el lugar.";
  }

  if (jobStage === "on_the_way") {
    return "El profesional indicó que va rumbo a la dirección del servicio.";
  }

  return "Has contratado a un profesional para realizar este trabajo.";
}


function redondearDinero(
  valor: number
) {
  return Math.round(
    (valor + Number.EPSILON) * 100
  ) / 100;
}

function calcularMontosPago(
  precio: number,
  settings: PaymentSettings | null
) {
  const jobAmount = redondearDinero(Number(precio) || 0);
  const customerFeePercent = Number(settings?.customer_service_fee_percent || 0);
  const providerCommissionPercent = Number(settings?.provider_commission_percent || 0);
  const customerFeeAmount = redondearDinero(jobAmount * (customerFeePercent / 100));
  const customerTotalAmount = redondearDinero(jobAmount + customerFeeAmount);
  const providerCommissionAmount = redondearDinero(jobAmount * (providerCommissionPercent / 100));
  const providerNetAmount = redondearDinero(jobAmount - providerCommissionAmount);
  const platformRevenueAmount = redondearDinero(customerFeeAmount + providerCommissionAmount);

  return {
    jobAmount, customerFeePercent, customerFeeAmount, customerTotalAmount,
    providerCommissionPercent, providerCommissionAmount, providerNetAmount, platformRevenueAmount,
  };
}

function nombreEstadoPagoCliente(
  status: string
) {
  if (status === "ready_for_payout") {
    return "Pago retenido por FixFlow";
  }

  if (status === "paid_out") {
    return "Pago completado";
  }

  if (status === "refunded") {
    return "Reembolsado";
  }

  if (status === "partially_refunded") {
    return "Reembolso parcial";
  }

  if (status === "paid") {
    return "Pago confirmado";
  }

  if (status === "cancelled") {
    return "Pago cancelado";
  }

  return status;
}

function calcularCancelacionCliente(
  solicitud: Solicitud,
  payment: PaymentCalculation | null,
  settings: PaymentSettings | null
) {
  const totalPagado = redondearDinero(
    Number(payment?.customer_total_amount || 0)
  );

  const precioTrabajo = redondearDinero(
    Number(payment?.job_amount || 0)
  );

  let penalidadPercent = 0;

  if (
    solicitud.status === "in_progress" &&
    solicitud.job_stage === "on_the_way"
  ) {
    penalidadPercent = Number(
      settings?.customer_cancel_on_the_way_percent || 0
    );
  }

  if (
    solicitud.status === "in_progress" &&
    solicitud.job_stage === "arrived"
  ) {
    penalidadPercent = Number(
      settings?.customer_cancel_arrived_percent || 0
    );
  }

  const penalidad = redondearDinero(
    precioTrabajo * (penalidadPercent / 100)
  );

  const porcentajePro = Number(
    settings?.cancellation_provider_percent || 0
  );

  const profesional = redondearDinero(
    penalidad * (porcentajePro / 100)
  );

  const fixflow = redondearDinero(
    penalidad - profesional
  );

  const reembolso = redondearDinero(
    Math.max(0, totalPagado - penalidad)
  );

  return {
    totalPagado,
    precioTrabajo,
    penalidadPercent,
    penalidad,
    profesional,
    fixflow,
    reembolso,
  };
}

export default function MisSolicitudDetallePage() {
  const params =
    useParams<{
      id: string;
    }>();

  const router =
    useRouter();

  const id =
    params.id;

  const [
    solicitud,
    setSolicitud,
  ] =
    useState<Solicitud | null>(
      null
    );

  const [
    ofertas,
    setOfertas,
  ] =
    useState<OfertaConProfesional[]>(
      []
    );

  const [
    review,
    setReview,
  ] =
    useState<Review | null>(
      null
    );

  const [
    rating,
    setRating,
  ] =
    useState(0);

  const [
    comentario,
    setComentario,
  ] =
    useState("");

  const [
    cargando,
    setCargando,
  ] =
    useState(true);

  const [
    enviandoReview,
    setEnviandoReview,
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
    aceptandoId,
    setAceptandoId,
  ] =
    useState<string | null>(
      null
    );

  const [
    cancelando,
    setCancelando,
  ] =
    useState(false);

  const [
    mostrarCancelacion,
    setMostrarCancelacion,
  ] =
    useState(false);

  const [
    motivoCancelacion,
    setMotivoCancelacion,
  ] =
    useState("");

  const [
    realtimeConectado,
    setRealtimeConectado,
  ] =
    useState(false);
  const [
    paymentSettings,
    setPaymentSettings,
  ] = useState<PaymentSettings | null>(null);

  const [
    payment,
    setPayment,
  ] = useState<PaymentCalculation | null>(null);

  const [
    changeOrders,
    setChangeOrders,
  ] = useState<ChangeOrder[]>([]);

  const [
    respondiendoChangeOrderId,
    setRespondiendoChangeOrderId,
  ] = useState<string | null>(null);

  const [
    pagandoChangeOrderId,
    setPagandoChangeOrderId,
  ] = useState<string | null>(null);

  const [
    verificandoPagoChangeOrder,
    setVerificandoPagoChangeOrder,
  ] = useState(false);

  const [
    claim,
    setClaim,
  ] = useState<JobClaim | null>(null);

  const [
    mostrarReclamo,
    setMostrarReclamo,
  ] = useState(false);

  const [
    motivoReclamo,
    setMotivoReclamo,
  ] = useState("");

  const [
    descripcionReclamo,
    setDescripcionReclamo,
  ] = useState("");

  const [
    enviandoReclamo,
    setEnviandoReclamo,
  ] = useState(false);

  const [
    evidenciasReclamo,
    setEvidenciasReclamo,
  ] = useState<File[]>([]);

  const [
    explicacionEvidenciaCliente,
    setExplicacionEvidenciaCliente,
  ] = useState("");

  const [
    evidenciasFinales,
    setEvidenciasFinales,
  ] = useState<CompletionEvidence[]>([]);

  /*
    CARGA INICIAL
  */

  useEffect(() => {
    if (id) {
      cargarDetalle();
    }
  }, [id]);

  /*
    REALTIME DE LA SOLICITUD
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    const canal =
      supabase
        .channel(
          `seguimiento-trabajo-${id}`
        )
        .on(
          "postgres_changes",
          {
            event: "UPDATE",
            schema: "public",
            table:
              "service_requests",
            filter:
              `id=eq.${id}`,
          },
          (payload) => {
            const nuevo =
              payload.new as Partial<Solicitud>;

            setSolicitud(
              (actual) => {
                if (!actual) {
                  return actual;
                }

                return {
                  ...actual,

                  status:
                    nuevo.status !==
                    undefined
                      ? nuevo.status
                      : actual.status,

                  job_stage:
                    nuevo.job_stage !==
                    undefined
                      ? nuevo.job_stage
                      : actual.job_stage,

                  cancellation_reason:
                    nuevo.cancellation_reason !==
                    undefined
                      ? nuevo.cancellation_reason
                      : actual.cancellation_reason,

                  cancelled_at:
                    nuevo.cancelled_at !==
                    undefined
                      ? nuevo.cancelled_at
                      : actual.cancelled_at,
                };
              }
            );

            if (
              nuevo.status ===
                "open" ||
              nuevo.status ===
                "completed" ||
              nuevo.status ===
                "cancelled"
            ) {
              window.setTimeout(
                () => {
                  cargarDetalle(
                    false
                  );
                },
                400
              );
            }
          }
        )
        .subscribe(
          (status) => {
            if (
              status ===
              "SUBSCRIBED"
            ) {
              setRealtimeConectado(
                true
              );
            } else if (
              status ===
                "CHANNEL_ERROR" ||
              status ===
                "TIMED_OUT" ||
              status ===
                "CLOSED"
            ) {
              setRealtimeConectado(
                false
              );
            }
          }
        );

    return () => {
      supabase.removeChannel(
        canal
      );
    };
  }, [id]);

  /*
    REALTIME DE OFERTAS
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    const canalOfertas =
      supabase
        .channel(
          `presupuestos-cliente-${id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "offers",
            filter:
              `request_id=eq.${id}`,
          },
          () => {
            window.setTimeout(
              () => {
                cargarDetalle(
                  false
                );
              },
              300
            );
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        canalOfertas
      );
    };
  }, [id]);

  /*
    REALTIME DE CAMBIOS DE PRESUPUESTO
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    const canalChangeOrders =
      supabase
        .channel(
          `change-orders-cliente-${id}`
        )
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "change_orders",
            filter:
              `request_id=eq.${id}`,
          },
          () => {
            window.setTimeout(
              () => {
                cargarDetalle(
                  false
                );
              },
              250
            );
          }
        )
        .subscribe();

    return () => {
      supabase.removeChannel(
        canalChangeOrders
      );
    };
  }, [id]);

  /*
    VERIFICAR REGRESO DE STRIPE PARA CHANGE ORDER
  */

  useEffect(() => {
    if (!id) {
      return;
    }

    const params =
      new URLSearchParams(
        window.location.search
      );

    const paymentResult =
      params.get(
        "change_order_payment"
      );

    const sessionId =
      params.get(
        "session_id"
      );

    const changeOrderId =
      params.get(
        "change_order_id"
      );

    if (
      paymentResult ===
        "cancelled"
    ) {
      setMensaje(
        "El pago adicional fue cancelado. Tu aprobación sigue registrada y puedes intentar pagarlo nuevamente."
      );

      window.history.replaceState(
        {},
        "",
        `/mis-solicitudes/${id}`
      );

      return;
    }

    if (
      paymentResult !==
        "success" ||
      !sessionId
    ) {
      return;
    }

    let activo = true;

    async function verificar() {
      setVerificandoPagoChangeOrder(
        true
      );
      setError("");
      setMensaje(
        "Confirmando tu pago adicional con Stripe..."
      );

      try {
        const response =
          await fetch(
            "/api/change-orders/verify-payment",
            {
              method: "POST",
              headers: {
                "Content-Type":
                  "application/json",
              },
              body: JSON.stringify({
                sessionId,
              }),
            }
          );

        const data =
          await response.json();

        if (!response.ok) {
          throw new Error(
            data?.error ||
              "No pudimos confirmar el pago adicional."
          );
        }

        if (!activo) {
          return;
        }

        await cargarDetalle(
          false
        );

        setMensaje(
          `Pago adicional confirmado${
            changeOrderId
              ? ""
              : ""
          }. El resumen de pago ya incluye el cambio de presupuesto.`
        );

        window.history.replaceState(
          {},
          "",
          `/mis-solicitudes/${id}`
        );
      } catch (err) {
        console.error(
          "Error verificando pago adicional:",
          err
        );

        if (!activo) {
          return;
        }

        setError(
          err instanceof Error
            ? err.message
            : "No pudimos confirmar el pago adicional."
        );
      } finally {
        if (activo) {
          setVerificandoPagoChangeOrder(
            false
          );
        }
      }
    }

    verificar();

    return () => {
      activo = false;
    };
  }, [id]);

  /*
    CARGAR DETALLE
  */

  async function cargarDetalle(
    mostrarCarga = true
  ) {
    if (mostrarCarga) {
      setCargando(true);
    }

    setError("");

    try {
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
          `/login-cliente?redirect=${encodeURIComponent(
            `/mis-solicitudes/${id}`
          )}`
        );

        return;
      }

      const {
        data:
          solicitudData,
        error:
          solicitudError,
      } = await supabase
        .from(
          "service_requests"
        )
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
          cancellation_reason,
          cancelled_at
        `)
        .eq(
          "id",
          id
        )
        .eq(
          "customer_id",
          user.id
        )
        .maybeSingle();

      if (
        solicitudError ||
        !solicitudData
      ) {
        throw new Error(
          "No encontramos esta solicitud o no tienes permiso para verla."
        );
      }

      setSolicitud(
        solicitudData as Solicitud
      );

      const {
        data: paymentSettingsData,
        error: paymentSettingsError,
      } = await supabase
        .from("payment_settings")
        .select(`
          id,
          provider_commission_percent,
          customer_service_fee_percent,
          customer_cancel_on_the_way_percent,
          customer_cancel_arrived_percent,
          cancellation_provider_percent,
          currency,
          active
        `)
        .eq("active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentSettingsError) {
        throw new Error(`No pudimos cargar las tarifas de FixFlow: ${paymentSettingsError.message}`);
      }

      setPaymentSettings(paymentSettingsData ? paymentSettingsData as PaymentSettings : null);

      const {
        data: paymentData,
        error: paymentError,
      } = await supabase
        .from("payments")
        .select(`
          id, request_id, offer_id, customer_id, provider_id,
          job_amount, customer_fee_percent, customer_fee_amount,
          customer_total_amount, provider_commission_percent,
          provider_commission_amount, provider_net_amount,
          platform_revenue_amount, refunded_amount, refunded_at,
          released_at, currency, status
        `)
        .eq("request_id", id)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (paymentError) {
        console.error("Error cargando cálculo de pago:", paymentError);
      }

      setPayment(paymentData ? paymentData as PaymentCalculation : null);

      /*
        EVIDENCIA FINAL DEL PROFESIONAL
      */

      const {
        data: completionEvidenceData,
        error: completionEvidenceError,
      } = await supabase
        .from("job_completion_evidence")
        .select(`
          id,
          request_id,
          provider_id,
          file_type,
          file_path,
          file_url,
          created_at
        `)
        .eq("request_id", id)
        .order("created_at", {
          ascending: true,
        });

      if (completionEvidenceError) {
        console.error(
          "Error cargando evidencia final del profesional:",
          completionEvidenceError
        );
        setEvidenciasFinales([]);
      } else {
        const evidenciaBase =
          (completionEvidenceData || []) as Omit<
            CompletionEvidence,
            "signed_url"
          >[];

        const evidenciaConUrls =
          await Promise.all(
            evidenciaBase.map(
              async (item) => {
                const {
                  data: signedData,
                  error: signedError,
                } = await supabase.storage
                  .from("job-completion-evidence")
                  .createSignedUrl(
                    item.file_path,
                    60 * 60
                  );

                if (signedError) {
                  console.error(
                    "Error creando URL segura para evidencia final:",
                    signedError
                  );

                  return {
                    ...item,
                    signed_url: null,
                  };
                }

                return {
                  ...item,
                  signed_url:
                    signedData?.signedUrl ||
                    null,
                };
              }
            )
          );

        setEvidenciasFinales(
          evidenciaConUrls
        );
      }

      const {
        data: changeOrdersData,
        error: changeOrdersError,
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
        .eq("customer_id", user.id)
        .order("created_at", {
          ascending: false,
        });

      if (changeOrdersError) {
        console.error(
          "Error cargando cambios de presupuesto:",
          changeOrdersError
        );
        setChangeOrders([]);
      } else {
        setChangeOrders(
          (changeOrdersData || []) as ChangeOrder[]
        );
      }

      const {
        data:
          ofertasData,
        error:
          ofertasError,
      } = await supabase
        .from("offers")
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
        .order(
          "price",
          {
            ascending: true,
          }
        );

      if (
        ofertasError
      ) {
        throw new Error(
          `No pudimos cargar los presupuestos: ${ofertasError.message}`
        );
      }

      const ofertasBase =
        (ofertasData ||
          []) as Oferta[];

      let ofertasCompletas:
        OfertaConProfesional[] =
        [];

      if (
        ofertasBase.length >
        0
      ) {
        const professionalIds =
          [
            ...new Set(
              ofertasBase.map(
                (oferta) =>
                  oferta.professional_id
              )
            ),
          ];

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
            trade,
            years_experience,
            average_rating,
            completed_jobs,
            verified
          `)
          .in(
            "user_id",
            professionalIds
          );

        if (
          profesionalesError
        ) {
          console.error(
            "Error cargando profesionales:",
            profesionalesError
          );
        }

        const profesionales =
          (profesionalesData ||
            []) as Profesional[];

        ofertasCompletas =
          ofertasBase.map(
            (oferta) => ({
              ...oferta,

              profesional:
                profesionales.find(
                  (
                    profesional
                  ) =>
                    profesional.user_id ===
                    oferta.professional_id
                ) ||
                null,
            })
          );
      }

      setOfertas(
        ofertasCompletas
      );

      if (
        solicitudData.status ===
        "completed"
      ) {
        const {
          data:
            reviewData,
          error:
            reviewError,
        } = await supabase
          .from("reviews")
          .select(`
            id,
            job_id,
            reviewer_id,
            reviewee_id,
            rating,
            comment,
            created_at
          `)
          .eq(
            "job_id",
            id
          )
          .eq(
            "reviewer_id",
            user.id
          )
          .maybeSingle();

        if (
          reviewError
        ) {
          console.error(
            "Error cargando reseña:",
            reviewError
          );
        }

        if (
          reviewData
        ) {
          setReview(
            reviewData as Review
          );

          setRating(
            reviewData.rating
          );

          setComentario(
            reviewData.comment ||
              ""
          );
        } else {
          setReview(
            null
          );
        }
      } else {
        setReview(
          null
        );
      }

      // El reclamo debe conservarse visible aunque el trabajo
      // haya quedado cancelado por una resolución de FixFlow.
      const {
        data: claimData,
        error: claimError,
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
          status,
          resolution_type,
          resolution_notes,
          provider_award_amount,
          customer_refund_amount,
          resolved_at,
          created_at,
          updated_at
        `)
        .eq("request_id", id)
        .eq("customer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (claimError) {
        console.error(
          "Error cargando reclamo:",
          claimError
        );
      }

      setClaim(
        claimData
          ? (claimData as JobClaim)
          : null
      );
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
      if (mostrarCarga) {
        setCargando(
          false
        );
      }
    }
  }

  /*
    ACEPTAR OFERTA
  */

  async function aceptarOferta(
    oferta: OfertaConProfesional
  ) {
    if (!solicitud) return;

    if (solicitud.status !== "open") {
      setError("Esta solicitud ya tiene un profesional contratado.");
      return;
    }

    if (oferta.status !== "pending") {
      setError("Este presupuesto ya no está disponible.");
      return;
    }

    if (!paymentSettings) {
      setError(
        "No pudimos cargar la configuración de pagos de FixFlow. Actualiza la página e inténtalo nuevamente."
      );
      return;
    }

    /*
      13.4 — CHECKOUT

      Ya NO aceptamos la oferta desde esta pantalla.
      Primero enviamos al cliente al checkout.
      La oferta se aceptará solamente cuando el flujo
      de pago esté listo/confirmado en la siguiente fase.
    */

    router.push(
      `/checkout/${solicitud.id}?offer=${encodeURIComponent(oferta.id)}`
    );
  }

  /*
    PAGAR CAMBIO DE PRESUPUESTO
  */

  async function pagarCambioPresupuesto(
    changeOrder: ChangeOrder
  ) {
    if (!solicitud) {
      return;
    }

    if (changeOrder.status !== "accepted") {
      setError(
        "Debes aceptar el cambio de presupuesto antes de pagarlo."
      );
      return;
    }

    setPagandoChangeOrderId(
      changeOrder.id
    );
    setError("");
    setMensaje("");

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
          "No pudimos verificar tu sesión de cliente."
        );
      }

      const response =
        await fetch(
          "/api/change-orders/checkout",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              changeOrderId:
                changeOrder.id,
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No pudimos iniciar el pago adicional."
        );
      }

      if (!data?.url) {
        throw new Error(
          "Stripe no devolvió la dirección del checkout adicional."
        );
      }

      window.location.href =
        data.url;
    } catch (err) {
      console.error(
        "Error iniciando pago de Change Order:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No pudimos iniciar el pago adicional."
      );

      setPagandoChangeOrderId(
        null
      );
    }
  }

  /*
    RESPONDER CAMBIO DE PRESUPUESTO

    Si el cliente acepta, registramos la aceptación y
    lo enviamos inmediatamente al checkout de Stripe.
  */

  async function responderCambioPresupuesto(
    changeOrder: ChangeOrder,
    decision: "accepted" | "rejected"
  ) {
    if (!solicitud) {
      return;
    }

    if (changeOrder.status !== "pending") {
      setError(
        "Este cambio de presupuesto ya fue respondido."
      );
      return;
    }

    const accion =
      decision === "accepted"
        ? "aceptar"
        : "rechazar";

    const confirmar =
      window.confirm(
        decision === "accepted"
          ? `¿Confirmas que aceptas el cambio de presupuesto?

Total anterior: $${Number(
              changeOrder.original_amount
            ).toFixed(2)}
Adicional: $${Number(
              changeOrder.additional_amount
            ).toFixed(2)}
Nuevo total: $${Number(
              changeOrder.new_total_amount
            ).toFixed(2)}

Al aceptar, continuarás al pago seguro de Stripe para pagar el monto adicional y la tarifa de servicio de FixFlow.`
          : `¿Confirmas que deseas rechazar este cambio de presupuesto por $${Number(
              changeOrder.additional_amount
            ).toFixed(2)} adicionales?`
      );

    if (!confirmar) {
      return;
    }

    setRespondiendoChangeOrderId(
      changeOrder.id
    );
    setError("");
    setMensaje("");

    try {
      const ahoraIso =
        new Date().toISOString();

      const cambios =
        decision === "accepted"
          ? {
              status: "accepted",
              accepted_at: ahoraIso,
              rejected_at: null,
              updated_at: ahoraIso,
            }
          : {
              status: "rejected",
              accepted_at: null,
              rejected_at: ahoraIso,
              updated_at: ahoraIso,
            };

      const {
        data: actualizado,
        error: updateError,
      } = await supabase
        .from("change_orders")
        .update(cambios)
        .eq("id", changeOrder.id)
        .eq("request_id", solicitud.id)
        .eq("status", "pending")
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
        .maybeSingle();

      if (updateError) {
        throw new Error(
          updateError.message
        );
      }

      if (!actualizado) {
        throw new Error(
          "Este cambio de presupuesto ya fue respondido o cambió de estado."
        );
      }

      setChangeOrders(
        (actuales) =>
          actuales.map(
            (item) =>
              item.id ===
              changeOrder.id
                ? (actualizado as ChangeOrder)
                : item
          )
      );

      if (
        decision === "accepted"
      ) {
        setMensaje(
          `Cambio de presupuesto aceptado. Ahora te enviaremos al pago seguro de Stripe para cobrar solamente el monto adicional y la tarifa de servicio correspondiente.`
        );

        await pagarCambioPresupuesto(
          actualizado as ChangeOrder
        );

        return;
      }

      setMensaje(
        "Cambio de presupuesto rechazado. El precio anterior permanece sin cambios."
      );
    } catch (err) {
      console.error(
        `Error al ${accion} cambio de presupuesto:`,
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo registrar tu decisión."
      );

      await cargarDetalle(
        false
      );
    } finally {
      setRespondiendoChangeOrderId(
        null
      );
    }
  }

  /*
    CANCELAR SOLICITUD
  */

  async function cancelarSolicitud() {
    if (!solicitud) {
      return;
    }

    const puedeCancelar =
      solicitud.status === "open" ||
      (
        solicitud.status === "in_progress" &&
        solicitud.job_stage !== "working"
      );

    if (!puedeCancelar) {
      setError(
        solicitud.job_stage === "working"
          ? "El trabajo ya fue iniciado. No puede cancelarse automáticamente; cualquier problema debe gestionarse mediante el sistema de reclamos."
          : "Esta solicitud ya no puede cancelarse automáticamente."
      );
      return;
    }

    if (!motivoCancelacion.trim()) {
      setError(
        "Selecciona un motivo para cancelar la solicitud."
      );
      return;
    }

    const resumen =
      calcularCancelacionCliente(
        solicitud,
        payment,
        paymentSettings
      );

    let textoConfirmacion =
      "¿Confirmas que deseas cancelar esta solicitud? Esta acción no se puede deshacer.";

    if (
      solicitud.status === "in_progress" &&
      payment
    ) {
      textoConfirmacion =
        `¿Confirmas la cancelación?\n\n` +
        `Total pagado: $${resumen.totalPagado.toFixed(2)}\n` +
        `Penalidad: ${resumen.penalidadPercent.toFixed(2)}% = $${resumen.penalidad.toFixed(2)}\n` +
        `Profesional: $${resumen.profesional.toFixed(2)}\n` +
        `FixFlow: $${resumen.fixflow.toFixed(2)}\n` +
        `Reembolso al cliente: $${resumen.reembolso.toFixed(2)}\n\n` +
        `Esta acción no se puede deshacer.`;
    }

    const confirmar =
      window.confirm(
        textoConfirmacion
      );

    if (!confirmar) {
      return;
    }

    setCancelando(true);
    setError("");
    setMensaje("");

    try {
      const {
        data: sessionData,
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !sessionData.session
      ) {
        throw new Error(
          "No pudimos verificar tu sesión de cliente."
        );
      }

      const response =
        await fetch(
          "/api/customer/cancel-job",
          {
            method: "POST",
            headers: {
              "Content-Type":
                "application/json",
              Authorization:
                `Bearer ${sessionData.session.access_token}`,
            },
            body: JSON.stringify({
              requestId:
                solicitud.id,
              reason:
                motivoCancelacion.trim(),
            }),
          }
        );

      const data =
        await response.json();

      if (!response.ok) {
        throw new Error(
          data?.error ||
            "No se pudo cancelar la solicitud."
        );
      }

      setMostrarCancelacion(false);
      setMotivoCancelacion("");

      if (
        Number(data.customerRefundAmount || 0) > 0 ||
        Number(data.providerAwardAmount || 0) > 0
      ) {
        setMensaje(
          `Solicitud cancelada correctamente. Se procesó un reembolso de $${Number(
            data.customerRefundAmount || 0
          ).toFixed(2)}.`
        );
      } else {
        setMensaje(
          "La solicitud fue cancelada correctamente."
        );
      }

      await cargarDetalle(false);
    } catch (err) {
      console.error(
        "Error cancelando solicitud:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setCancelando(false);
    }
  }

  /*
    ENVIAR RESEÑA
  */

  async function enviarResena(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    if (
      !solicitud ||
      solicitud.status !==
        "completed"
    ) {
      setError(
        "Este trabajo todavía no puede ser calificado."
      );

      return;
    }

    if (review) {
      setError(
        "Ya calificaste este trabajo."
      );

      return;
    }

    const ofertaSeleccionada =
      ofertas.find(
        (oferta) =>
          oferta.status ===
          "selected"
      );

    if (
      !ofertaSeleccionada
    ) {
      setError(
        "No pudimos identificar al profesional contratado."
      );

      return;
    }

    if (
      rating < 1 ||
      rating > 5
    ) {
      setError(
        "Selecciona una calificación de 1 a 5 estrellas."
      );

      return;
    }

    setEnviandoReview(
      true
    );

    setError("");
    setMensaje("");

    try {
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
        throw new Error(
          "Debes iniciar sesión para enviar una reseña."
        );
      }

      const {
        data:
          existingReview,
        error:
          existingError,
      } = await supabase
        .from("reviews")
        .select("id")
        .eq(
          "job_id",
          solicitud.id
        )
        .eq(
          "reviewer_id",
          user.id
        )
        .maybeSingle();

      if (
        existingError
      ) {
        throw new Error(
          existingError.message
        );
      }

      if (
        existingReview
      ) {
        setError(
          "Ya enviaste una reseña para este trabajo."
        );

        await cargarDetalle(
          false
        );

        return;
      }

      const {
        data:
          reviewData,
        error:
          insertError,
      } = await supabase
        .from("reviews")
        .insert({
          job_id:
            solicitud.id,

          reviewer_id:
            user.id,

          reviewee_id:
            ofertaSeleccionada.professional_id,

          rating,

          comment:
            comentario.trim() ||
            null,
        })
        .select(`
          id,
          job_id,
          reviewer_id,
          reviewee_id,
          rating,
          comment,
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

      setReview(
        reviewData as Review
      );

      setMensaje(
        "Gracias. Tu calificación fue enviada correctamente."
      );
    } catch (err) {
      console.error(
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar la reseña."
      );
    } finally {
      setEnviandoReview(
        false
      );
    }
  }

  /*
    EVIDENCIA DEL RECLAMO
  */

  function seleccionarEvidenciaReclamo(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const nuevos =
      Array.from(
        event.target.files || []
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

    const demasiadoGrandes =
      nuevos.filter(
        (file) =>
          file.size >
          50 * 1024 * 1024
      );

    if (
      demasiadoGrandes.length > 0
    ) {
      setError(
        "Cada foto o video debe pesar 50 MB o menos."
      );
      event.target.value = "";
      return;
    }

    const combinados = [
      ...evidenciasReclamo,
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

    if (
      imagenes.length > 10
    ) {
      setError(
        "Puedes adjuntar un máximo de 10 fotos por reclamo."
      );
      event.target.value = "";
      return;
    }

    if (
      videos.length > 2
    ) {
      setError(
        "Puedes adjuntar un máximo de 2 videos por reclamo."
      );
      event.target.value = "";
      return;
    }

    setEvidenciasReclamo(
      combinados
    );

    setError("");
    event.target.value = "";
  }

  function eliminarEvidenciaReclamo(
    index: number
  ) {
    setEvidenciasReclamo(
      (actuales) =>
        actuales.filter(
          (_, i) =>
            i !== index
        )
    );
  }

  async function subirEvidenciasReclamo(
    claimId: string,
    userId: string
  ) {
    if (
      evidenciasReclamo.length ===
      0
    ) {
      return;
    }

    for (
      const [
        index,
        file,
      ] of evidenciasReclamo.entries()
    ) {
      const extension =
        file.name
          .split(".")
          .pop()
          ?.toLowerCase() ||
        (file.type.startsWith(
          "video/"
        )
          ? "mp4"
          : "jpg");

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
        `${claimId}/${userId}/${Date.now()}-${index}-${nombreSeguro || `evidencia.${extension}`}`;

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
          `El reclamo fue creado, pero no pudimos subir "${file.name}": ${uploadError.message}`
        );
      }

      const fileType =
        file.type.startsWith(
          "video/"
        )
          ? "video"
          : "image";

      const {
        error:
          evidenceError,
      } =
        await supabase
          .from(
            "claim_evidence"
          )
          .insert({
            claim_id:
              claimId,
            uploaded_by:
              userId,
            uploaded_by_role:
              "customer",
            file_type:
              fileType,
            file_url:
              ruta,
            file_path:
              ruta,
          });

      if (
        evidenceError
      ) {
        await supabase.storage
          .from(
            "claim-evidence"
          )
          .remove([
            ruta,
          ]);

        throw new Error(
          `El reclamo fue creado, pero no pudimos registrar "${file.name}": ${evidenceError.message}`
        );
      }
    }
  }

  /*
    REPORTAR PROBLEMA
  */

  async function enviarReclamo(
    e: React.FormEvent<HTMLFormElement>
  ) {
    e.preventDefault();

    const puedeReportar =
      solicitud &&
      (
        solicitud.status === "completed" ||
        (
          solicitud.status === "in_progress" &&
          solicitud.job_stage === "working"
        )
      );

    if (!puedeReportar) {
      setError(
        "Este trabajo todavía no puede reportarse."
      );
      return;
    }

    if (claim) {
      setError("Ya reportaste un problema para este trabajo.");
      return;
    }

    const ofertaSeleccionada = ofertas.find(
      (oferta) => oferta.status === "selected"
    );

    if (!ofertaSeleccionada) {
      setError("No pudimos identificar al profesional contratado.");
      return;
    }

    if (!motivoReclamo.trim()) {
      setError("Selecciona el motivo del reclamo.");
      return;
    }

    if (descripcionReclamo.trim().length < 5) {
      setError("Explica brevemente qué ocurrió con el trabajo.");
      return;
    }

    if (
      evidenciasReclamo.length > 0 &&
      explicacionEvidenciaCliente.trim().length < 5
    ) {
      setError(
        "Explica brevemente qué muestran las fotos o videos que adjuntaste."
      );
      return;
    }

    setEnviandoReclamo(true);
    setError("");
    setMensaje("");

    try {
      const { data: { user }, error: userError } =
        await supabase.auth.getUser();

      if (userError || !user) {
        throw new Error("Debes iniciar sesión para reportar un problema.");
      }

      const { data: existingClaim, error: existingClaimError } =
        await supabase
          .from("job_claims")
          .select("id")
          .eq("request_id", solicitud.id)
          .eq("customer_id", user.id)
          .limit(1)
          .maybeSingle();

      if (existingClaimError) {
        throw new Error(existingClaimError.message);
      }

      if (existingClaim) {
        setError("Ya existe un reclamo para este trabajo.");
        setEvidenciasReclamo([]);
        await cargarDetalle(false);
        return;
      }

      const { data: claimData, error: insertClaimError } =
        await supabase
          .from("job_claims")
          .insert({
            request_id: solicitud.id,
            customer_id: user.id,
            provider_id: ofertaSeleccionada.professional_id,
            reason: motivoReclamo.trim(),
            description: descripcionReclamo.trim(),
            customer_evidence_note:
              evidenciasReclamo.length > 0
                ? explicacionEvidenciaCliente.trim()
                : null,
            status: "open",
          })
          .select(`
            id,
            request_id,
            customer_id,
            provider_id,
            reason,
            description,
            status,
            resolution_notes,
            created_at,
            updated_at
          `)
          .single();

      if (insertClaimError) {
        throw new Error(insertClaimError.message);
      }

      await subirEvidenciasReclamo(
        claimData.id,
        user.id
      );

      setClaim(claimData as JobClaim);
      setMostrarReclamo(false);
      setMotivoReclamo("");
      setDescripcionReclamo("");
      setExplicacionEvidenciaCliente("");
      setEvidenciasReclamo([]);
      setMensaje(
        evidenciasReclamo.length > 0
          ? `Tu reporte fue registrado correctamente con ${evidenciasReclamo.length} archivo${
              evidenciasReclamo.length === 1
                ? ""
                : "s"
            } de evidencia.`
          : "Tu reporte fue registrado correctamente."
      );
    } catch (err) {
      console.error("Error enviando reclamo:", err);
      setError(
        err instanceof Error
          ? err.message
          : "No se pudo enviar el reclamo."
      );
    } finally {
      setEnviandoReclamo(false);
    }
  }

  if (cargando) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="rounded-2xl bg-white px-8 py-7 shadow-lg">
          <p className="font-bold text-slate-700">
            Cargando solicitud...
          </p>
        </div>
      </main>
    );
  }

  if (
    error &&
    !solicitud
  ) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">

          <h1 className="text-2xl font-extrabold text-red-700">
            No se pudo abrir la solicitud
          </h1>

          <p className="mt-4 text-slate-600">
            {error}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/mis-solicitudes"
              )
            }
            className="mt-6 rounded-xl bg-blue-700 px-6 py-3 font-bold text-white hover:bg-blue-800"
          >
            Volver a mis solicitudes
          </button>

        </div>
      </main>
    );
  }

  if (!solicitud) {
    return null;
  }

  const ofertaSeleccionada =
    ofertas.find(
      (oferta) =>
        oferta.status ===
        "selected"
    );

  const changeOrderPendiente =
    changeOrders.find(
      (changeOrder) =>
        changeOrder.status === "pending"
    ) || null;

  const ultimoChangeOrder =
    changeOrders[0] || null;

  const changeOrdersPagados =
    changeOrders.filter(
      (changeOrder) =>
        changeOrder.status ===
          "accepted" &&
        changeOrder.payment_status ===
          "paid"
    );

  const adicionalesPagados =
    redondearDinero(
      changeOrdersPagados.reduce(
        (total, changeOrder) =>
          total +
          Number(
            changeOrder.additional_amount ||
              0
          ),
        0
      )
    );

  const feesAdicionalesPagados =
    redondearDinero(
      changeOrdersPagados.reduce(
        (total, changeOrder) =>
          total +
          Number(
            changeOrder.additional_customer_fee_amount ||
              0
          ),
        0
      )
    );

  const totalesAdicionalesPagados =
    redondearDinero(
      changeOrdersPagados.reduce(
        (total, changeOrder) =>
          total +
          Number(
            changeOrder.additional_customer_total_amount ||
              0
          ),
        0
      )
    );

  const presupuestoTotalPagado =
    redondearDinero(
      Number(
        payment?.job_amount || 0
      ) +
        adicionalesPagados
    );

  const tarifaClienteTotalPagada =
    redondearDinero(
      Number(
        payment?.customer_fee_amount ||
          0
      ) +
        feesAdicionalesPagados
    );

  const totalClientePagado =
    redondearDinero(
      Number(
        payment?.customer_total_amount ||
          0
      ) +
        totalesAdicionalesPagados
    );

  const ofertasPendientes =
    ofertas.filter(
      (oferta) =>
        oferta.status ===
        "pending"
    ).length;

  const profesionalLiberoTrabajo =
    solicitud.status ===
      "open" &&
    !ofertaSeleccionada &&
    ofertas.some(
      (oferta) =>
        oferta.status ===
        "rejected"
    );

  const etapaActual =
    numeroEtapa(
      solicitud.status,
      solicitud.job_stage
    );

  const mostrarSeguimiento =
    solicitud.status ===
      "in_progress" ||
    solicitud.status ===
      "completed";

  const puedeCancelar =
    solicitud.status ===
      "open" ||
    (
      solicitud.status ===
        "in_progress" &&
      solicitud.job_stage !==
        "working"
    );

  const resumenCancelacion =
    calcularCancelacionCliente(
      solicitud,
      payment,
      paymentSettings
    );

  const canceladoPorFixFlow =
    solicitud.status === "cancelled" &&
    Boolean(
      solicitud.cancellation_reason
        ?.toLowerCase()
        .includes("reclamo resuelto")
    );

  const reclamoResuelto =
    claim?.status === "resolved";

  const reembolsoReclamo =
    redondearDinero(
      Number(
        claim?.customer_refund_amount || 0
      )
    );

  const compensacionProfesionalReclamo =
    redondearDinero(
      Number(
        claim?.provider_award_amount || 0
      )
    );

  const etapas = [
    {
      numero: 1,
      icono: "🤝",
      titulo: "Contratado",
      descripcion:
        "Profesional contratado",
    },
    {
      numero: 2,
      icono: "🚗",
      titulo: "En camino",
      descripcion:
        "Va rumbo a tu ubicación",
    },
    {
      numero: 3,
      icono: "📍",
      titulo: "Llegó",
      descripcion:
        "Ya se encuentra en el lugar",
    },
    {
      numero: 4,
      icono: "🛠️",
      titulo:
        "Trabajo iniciado",
      descripcion:
        "El servicio está en proceso",
    },
    {
      numero: 5,
      icono: "✅",
      titulo: "Completado",
      descripcion:
        "Trabajo terminado",
    },
  ];

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10">

      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/mis-solicitudes"
            )
          }
          className="font-bold text-blue-700 hover:underline"
        >
          ← Volver a mis solicitudes
        </button>

        {/* SOLICITUD */}

        <section className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl">

          <div className="bg-blue-700 p-8 text-white">

            <span className="inline-block rounded-full bg-blue-100 px-3 py-1 text-sm font-bold text-blue-800">
              {nombreEstadoSolicitud(
                solicitud.status
              )}
            </span>

            <h1 className="mt-4 text-3xl font-extrabold md:text-4xl">
              {solicitud.title}
            </h1>

            <p className="mt-3 max-w-3xl text-blue-100">
              {solicitud.description}
            </p>

          </div>

          <div className="grid grid-cols-1 gap-4 p-8 md:grid-cols-3">

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                📍 Ubicación
              </p>

              <p className="mt-1 font-extrabold text-slate-900">
                {solicitud.city},{" "}
                {solicitud.state}{" "}
                {solicitud.zip_code}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                📅 Fecha preferida
              </p>

              <p className="mt-1 font-extrabold text-slate-900">
                {solicitud.preferred_date ||
                  "Flexible"}
              </p>
            </div>

            <div className="rounded-2xl bg-slate-50 p-5">
              <p className="text-sm text-slate-500">
                🕐 Hora preferida
              </p>

              <p className="mt-1 font-extrabold text-slate-900">
                {solicitud.preferred_time ||
                  "Flexible"}
              </p>
            </div>

          </div>

        </section>

        {/* AVISO SOLO MIENTRAS NO HAYA OFERTAS NUEVAS */}

        {profesionalLiberoTrabajo &&
          ofertasPendientes ===
            0 && (
            <section className="mt-6 rounded-3xl border-2 border-amber-300 bg-amber-50 p-7 shadow-sm">

              <div className="flex items-start gap-4">

                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amber-500 text-2xl text-white">
                  ⚠️
                </div>

                <div className="flex-1">

                  <p className="text-sm font-extrabold uppercase tracking-wide text-amber-700">
                    Buscando un nuevo profesional
                  </p>

                  <h2 className="mt-2 text-2xl font-extrabold text-amber-950">
                    El profesional anterior ya no está disponible
                  </h2>

                  <p className="mt-2 leading-7 text-amber-900">
                    Tu solicitud volvió a publicarse automáticamente para que otros profesionales puedan enviarte nuevos presupuestos. No necesitas crear otra solicitud.
                  </p>

                  <div className="mt-5 rounded-2xl border border-amber-200 bg-white p-5">

                    <p className="font-extrabold text-slate-900">
                      Esperando nuevos presupuestos
                    </p>

                    <p className="mt-1 text-sm text-slate-600">
                      Cuando otro profesional compatible envíe una oferta, aparecerá automáticamente en esta página.
                    </p>

                  </div>

                </div>

              </div>

            </section>
          )}

        {/* SEGUIMIENTO */}

        {mostrarSeguimiento && (
          <section className="mt-6 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">

            <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

              <div>
                <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                  Seguimiento en vivo
                </p>

                <h2 className="mt-2 text-2xl font-black text-slate-950">
                  {tituloEtapa(
                    solicitud.status,
                    solicitud.job_stage
                  )}
                </h2>

                <p className="mt-2 text-slate-600">
                  {textoEtapa(
                    solicitud.status,
                    solicitud.job_stage
                  )}
                </p>
              </div>

              {solicitud.status !==
                "completed" && (
                <div
                  className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold ${
                    realtimeConectado
                      ? "bg-green-50 text-green-700"
                      : "bg-amber-50 text-amber-700"
                  }`}
                >
                  <span
                    className={`h-3 w-3 rounded-full ${
                      realtimeConectado
                        ? "bg-green-500"
                        : "bg-amber-500"
                    }`}
                  />

                  {realtimeConectado
                    ? "Actualizando en vivo"
                    : "Conectando..."}
                </div>
              )}

            </div>

            <div className="mt-9">

              <div className="grid grid-cols-5 gap-1">

                {etapas.map(
                  (etapa) => {
                    const completada =
                      etapa.numero <=
                      etapaActual;

                    const actual =
                      etapa.numero ===
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
                            completada
                              ? "border-blue-700 bg-blue-700 text-white"
                              : "border-slate-300 bg-white text-slate-400"
                          } ${
                            actual &&
                            solicitud.status !==
                              "completed"
                              ? "ring-4 ring-blue-100"
                              : ""
                          }`}
                        >
                          {etapa.numero}
                        </div>

                        <div className="relative z-10 mt-3 text-xl">
                          {etapa.icono}
                        </div>

                        <p
                          className={`mt-1 text-xs font-black sm:text-sm ${
                            completada
                              ? "text-slate-950"
                              : "text-slate-400"
                          }`}
                        >
                          {etapa.titulo}
                        </p>

                        <p className="mt-1 hidden text-xs text-slate-500 md:block">
                          {etapa.descripcion}
                        </p>

                      </div>
                    );
                  }
                )}

              </div>

            </div>

          </section>
        )}

        {mensaje && (
          <div className="mt-6 rounded-2xl border border-green-300 bg-green-50 p-5 font-bold text-green-800">
            ✅ {mensaje}
          </div>
        )}

        {error && (
          <div className="mt-6 rounded-2xl border border-red-300 bg-red-50 p-5 font-medium text-red-700">
            {error}
          </div>
        )}

        {/* CANCELACIÓN */}

        {solicitud.status ===
        "cancelled" ? (
          <section className="mt-6 rounded-3xl border-2 border-red-300 bg-red-50 p-7 shadow-sm">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-red-600 text-2xl text-white">
                ✕
              </div>

              <div className="flex-1">

                <p className="text-sm font-extrabold uppercase tracking-wide text-red-700">
                  {canceladoPorFixFlow
                    ? "Resolución de FixFlow"
                    : "Solicitud cancelada"}
                </p>

                <h2 className="mt-2 text-2xl font-extrabold text-red-900">
                  {canceladoPorFixFlow
                    ? "Trabajo cancelado por resolución de FixFlow"
                    : "Este trabajo fue cancelado"}
                </h2>

                <p className="mt-2 text-red-800">
                  {canceladoPorFixFlow
                    ? "FixFlow cerró este trabajo después de resolver el reclamo. El servicio ya no continuará."
                    : "Esta solicitud ya no está activa."}
                </p>

                {solicitud.cancellation_reason && (
                  <div className="mt-5 rounded-2xl bg-white p-5">

                    <p className="text-sm font-bold text-slate-500">
                      {canceladoPorFixFlow
                        ? "Decisión"
                        : "Motivo"}
                    </p>

                    <p className="mt-2 font-semibold text-slate-800">
                      {solicitud.cancellation_reason}
                    </p>

                  </div>
                )}

                {canceladoPorFixFlow &&
                  reclamoResuelto && (
                    <div className="mt-5 rounded-2xl border border-blue-200 bg-blue-50 p-5">
                      <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                        Resultado financiero
                      </p>

                      <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                        <div className="rounded-xl bg-white p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Reembolso al cliente
                          </p>
                          <p className="mt-1 text-2xl font-black text-blue-800">
                            ${reembolsoReclamo.toFixed(2)}
                          </p>
                        </div>

                        <div className="rounded-xl bg-white p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Compensación al profesional
                          </p>
                          <p className="mt-1 text-2xl font-black text-slate-900">
                            ${compensacionProfesionalReclamo.toFixed(2)}
                          </p>
                        </div>
                      </div>

                      {claim?.resolution_notes && (
                        <div className="mt-4 rounded-xl bg-white p-4">
                          <p className="text-sm font-bold text-slate-500">
                            Nota de resolución
                          </p>
                          <p className="mt-2 whitespace-pre-wrap font-semibold leading-6 text-slate-800">
                            {claim.resolution_notes}
                          </p>
                        </div>
                      )}
                    </div>
                  )}

              </div>

            </div>

          </section>
        ) : puedeCancelar ? (
          <section id="reclamos" className="mt-6 rounded-3xl border border-red-200 bg-white p-7 shadow-sm">

            {!mostrarCancelacion ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">

                <div>

                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    ¿Ya no necesitas el servicio?
                  </p>

                  <h2 className="mt-1 text-xl font-extrabold text-slate-900">
                    Puedes cancelar esta solicitud
                  </h2>

                  <p className="mt-2 text-sm text-slate-600">
                    La cancelación dejará de estar disponible cuando el profesional haya iniciado el trabajo.
                  </p>

                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarCancelacion(
                      true
                    );
                    setError("");
                    setMensaje("");
                  }}
                  className="shrink-0 rounded-xl border-2 border-red-600 bg-white px-5 py-3 font-extrabold text-red-700 hover:bg-red-50"
                >
                  Cancelar solicitud
                </button>

              </div>
            ) : (
              <div>

                <div className="flex items-start justify-between gap-4">

                  <div>
                    <p className="text-sm font-extrabold uppercase tracking-wide text-red-700">
                      Cancelar solicitud
                    </p>

                    <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                      ¿Por qué deseas cancelar?
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCancelacion(
                        false
                      );
                      setMotivoCancelacion(
                        ""
                      );
                    }}
                    className="rounded-lg px-3 py-2 font-bold text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>

                </div>

                <select
                  value={
                    motivoCancelacion
                  }
                  onChange={(e) =>
                    setMotivoCancelacion(
                      e.target.value
                    )
                  }
                  className="mt-5 w-full rounded-xl border border-slate-300 bg-white p-4 font-semibold text-slate-900"
                >
                  <option value="">
                    Selecciona un motivo
                  </option>

                  <option value="Ya no necesito el servicio">
                    Ya no necesito el servicio
                  </option>

                  <option value="Encontré otra solución">
                    Encontré otra solución
                  </option>

                  <option value="Cambió mi horario">
                    Cambió mi horario
                  </option>

                  <option value="El precio no me conviene">
                    El precio no me conviene
                  </option>

                  <option value="Otro motivo">
                    Otro motivo
                  </option>
                </select>

                <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">
                  <p className="text-sm font-black uppercase tracking-wide text-red-700">
                    Resumen de la cancelación
                  </p>

                  {solicitud.status === "open" ? (
                    <div className="mt-3 rounded-xl bg-white p-4">
                      <p className="font-extrabold text-emerald-700">
                        Cancelación sin penalidad
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Esta solicitud todavía no tiene un trabajo pagado en progreso.
                      </p>
                    </div>
                  ) : payment ? (
                    <div className="mt-4 space-y-3 rounded-xl bg-white p-4">
                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600">Total pagado</span>
                        <strong className="text-slate-900">
                          ${resumenCancelacion.totalPagado.toFixed(2)}
                        </strong>
                      </div>

                      <div className="flex items-center justify-between gap-4">
                        <span className="text-slate-600">
                          Penalidad ({resumenCancelacion.penalidadPercent.toFixed(2)}%)
                        </span>
                        <strong className="text-red-700">
                          -${resumenCancelacion.penalidad.toFixed(2)}
                        </strong>
                      </div>

                      <div className="border-t border-slate-200 pt-3">
                        <div className="flex items-center justify-between gap-4">
                          <span className="font-black text-slate-900">
                            Reembolso al cliente
                          </span>
                          <strong className="text-xl text-emerald-700">
                            ${resumenCancelacion.reembolso.toFixed(2)}
                          </strong>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm font-bold text-amber-800">
                      No encontramos el pago de este trabajo. Actualiza la página antes de cancelar.
                    </div>
                  )}
                </div>

                <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarCancelacion(
                        false
                      );
                      setMotivoCancelacion(
                        ""
                      );
                    }}
                    disabled={
                      cancelando
                    }
                    className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-700 disabled:opacity-50"
                  >
                    Volver
                  </button>

                  <button
                    type="button"
                    onClick={
                      cancelarSolicitud
                    }
                    disabled={
                      cancelando ||
                      !motivoCancelacion
                    }
                    className="rounded-xl bg-red-600 px-5 py-3 font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {cancelando
                      ? "Cancelando solicitud..."
                      : "Confirmar cancelación"}
                  </button>

                </div>

              </div>
            )}

          </section>
        ) : solicitud.status === "in_progress" &&
            solicitud.job_stage === "working" ? (
          <section className="mt-6 rounded-3xl border border-amber-300 bg-amber-50 p-7 shadow-sm">
            <p className="text-sm font-black uppercase tracking-wide text-amber-700">
              Trabajo iniciado
            </p>
            <h2 className="mt-2 text-xl font-black text-amber-950">
              La cancelación automática ya no está disponible
            </h2>
            <p className="mt-2 leading-7 text-amber-900">
              El profesional ya comenzó el servicio. Si existe un problema con el trabajo, deberá gestionarse mediante el sistema de reclamos de FixFlow.
            </p>

            <button
              type="button"
              onClick={() => {
                setMostrarReclamo(true);
                setError("");
                setMensaje("");

                window.setTimeout(() => {
                  const reclamos =
                    document.getElementById(
                      "reclamos-cliente"
                    );

                  if (reclamos) {
                    reclamos.scrollIntoView({
                      behavior: "smooth",
                      block: "start",
                    });
                  }
                }, 50);
              }}
              className="mt-5 inline-flex w-full items-center justify-center rounded-xl bg-amber-600 px-5 py-3.5 font-black text-white transition hover:bg-amber-700 sm:w-auto"
            >
              ⚠️ Iniciar reclamo
            </button>
          </section>
        ) : null}

        {/* CAMBIO DE PRESUPUESTO */}

        {changeOrderPendiente && (
          <section className="mt-6 overflow-hidden rounded-3xl border-2 border-violet-300 bg-white shadow-xl">
            <div className="bg-violet-700 px-7 py-5 text-white">
              <p className="text-sm font-black uppercase tracking-wide text-violet-100">
                💰 Cambio de presupuesto solicitado
              </p>

              <h2 className="mt-2 text-2xl font-black">
                El profesional solicita un monto adicional
              </h2>

              <p className="mt-2 max-w-3xl text-violet-100">
                Revisa el motivo y los nuevos montos antes de aceptar o rechazar.
              </p>
            </div>

            <div className="p-7">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div className="rounded-2xl bg-slate-50 p-5">
                  <p className="text-sm font-bold text-slate-500">
                    Total anterior
                  </p>
                  <p className="mt-1 text-2xl font-black text-slate-950">
                    ${Number(
                      changeOrderPendiente.original_amount
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-violet-50 p-5">
                  <p className="text-sm font-bold text-violet-700">
                    Adicional solicitado
                  </p>
                  <p className="mt-1 text-2xl font-black text-violet-700">
                    +${Number(
                      changeOrderPendiente.additional_amount
                    ).toFixed(2)}
                  </p>
                </div>

                <div className="rounded-2xl bg-slate-950 p-5 text-white">
                  <p className="text-sm font-bold text-slate-300">
                    Nuevo total propuesto
                  </p>
                  <p className="mt-1 text-2xl font-black">
                    ${Number(
                      changeOrderPendiente.new_total_amount
                    ).toFixed(2)}
                  </p>
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                  Motivo
                </p>

                <p className="mt-2 font-black text-slate-950">
                  {changeOrderPendiente.reason === "problema_mayor"
                    ? "El problema es mayor de lo esperado"
                    : changeOrderPendiente.reason === "trabajo_adicional"
                    ? "Se necesita trabajo adicional"
                    : changeOrderPendiente.reason === "materiales_adicionales"
                    ? "Se necesitan materiales adicionales"
                    : changeOrderPendiente.reason === "otro"
                    ? "Otro motivo"
                    : changeOrderPendiente.reason}
                </p>

                {changeOrderPendiente.description && (
                  <>
                    <div className="my-4 border-t border-slate-200" />

                    <p className="text-sm font-black uppercase tracking-wide text-slate-500">
                      Explicación del profesional
                    </p>

                    <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                      {changeOrderPendiente.description}
                    </p>
                  </>
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4">
                <p className="text-sm font-bold leading-6 text-amber-900">
                  Al aceptar, FixFlow te enviará al checkout seguro de Stripe para pagar los ${Number(
                    changeOrderPendiente.additional_amount
                  ).toFixed(2)} adicionales más la tarifa de servicio correspondiente.
                </p>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <button
                  type="button"
                  disabled={
                    respondiendoChangeOrderId !==
                    null ||
                    pagandoChangeOrderId !==
                    null
                  }
                  onClick={() =>
                    responderCambioPresupuesto(
                      changeOrderPendiente,
                      "rejected"
                    )
                  }
                  className="rounded-xl border-2 border-red-600 bg-white px-5 py-3.5 font-black text-red-700 transition hover:bg-red-50 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {respondiendoChangeOrderId ===
                  changeOrderPendiente.id
                    ? "Procesando..."
                    : "✕ Rechazar cambio"}
                </button>

                <button
                  type="button"
                  disabled={
                    respondiendoChangeOrderId !==
                    null ||
                    pagandoChangeOrderId !==
                    null
                  }
                  onClick={() =>
                    responderCambioPresupuesto(
                      changeOrderPendiente,
                      "accepted"
                    )
                  }
                  className="rounded-xl bg-violet-700 px-5 py-3.5 font-black text-white transition hover:bg-violet-800 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {respondiendoChangeOrderId ===
                  changeOrderPendiente.id
                    ? "Procesando..."
                    : `✓ Aceptar +$${Number(
                        changeOrderPendiente.additional_amount
                      ).toFixed(2)}`}
                </button>
              </div>
            </div>
          </section>
        )}

        {!changeOrderPendiente &&
          ultimoChangeOrder &&
          ultimoChangeOrder.status !==
            "pending" && (
          <section
            className={`mt-6 rounded-3xl border-2 p-6 shadow-sm ${
              ultimoChangeOrder.status ===
              "accepted"
                ? "border-emerald-300 bg-emerald-50"
                : ultimoChangeOrder.status ===
                  "rejected"
                ? "border-red-300 bg-red-50"
                : "border-slate-300 bg-slate-50"
            }`}
          >
            <p
              className={`text-sm font-black uppercase tracking-wide ${
                ultimoChangeOrder.status ===
                "accepted"
                  ? "text-emerald-700"
                  : ultimoChangeOrder.status ===
                    "rejected"
                  ? "text-red-700"
                  : "text-slate-600"
              }`}
            >
              {ultimoChangeOrder.status ===
              "accepted"
                ? "✓ Cambio de presupuesto aceptado"
                : ultimoChangeOrder.status ===
                  "rejected"
                ? "✕ Cambio de presupuesto rechazado"
                : "Cambio de presupuesto cancelado"}
            </p>

            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm text-slate-600">
                  Adicional solicitado
                </p>
                <p className="text-xl font-black text-slate-950">
                  ${Number(
                    ultimoChangeOrder.additional_amount
                  ).toFixed(2)}
                </p>
              </div>

              <div className="sm:text-right">
                <p className="text-sm text-slate-600">
                  Nuevo total propuesto
                </p>
                <p className="text-xl font-black text-slate-950">
                  ${Number(
                    ultimoChangeOrder.new_total_amount
                  ).toFixed(2)}
                </p>
              </div>
            </div>

            {ultimoChangeOrder.status ===
              "accepted" &&
              ultimoChangeOrder.payment_status ===
                "paid" && (
                <div className="mt-4 rounded-2xl border border-emerald-200 bg-white/70 p-4">
                  <p className="font-black text-emerald-800">
                    ✓ Cambio pagado
                  </p>
                  <p className="mt-1 text-sm font-bold leading-6 text-emerald-800">
                    Stripe confirmó el pago adicional de $
                    {Number(
                      ultimoChangeOrder.additional_customer_total_amount ||
                        0
                    ).toFixed(2)}. Este monto ya está incluido en el resumen total del trabajo.
                  </p>
                </div>
              )}

            {ultimoChangeOrder.status ===
              "accepted" &&
              ultimoChangeOrder.payment_status !==
                "paid" && (
              <div className="mt-4">
                <p className="text-sm font-bold leading-6 text-emerald-800">
                  Tu aprobación quedó registrada. Para completar el cambio, paga ahora el monto adicional mediante Stripe.
                </p>

                <button
                  type="button"
                  disabled={
                    pagandoChangeOrderId !==
                      null ||
                    verificandoPagoChangeOrder
                  }
                  onClick={() =>
                    pagarCambioPresupuesto(
                      ultimoChangeOrder
                    )
                  }
                  className="mt-4 w-full rounded-xl bg-emerald-700 px-5 py-3.5 font-black text-white transition hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                >
                  {pagandoChangeOrderId ===
                  ultimoChangeOrder.id
                    ? "Abriendo pago seguro..."
                    : `💳 Pagar adicional · $${redondearDinero(
                        Number(
                          ultimoChangeOrder.additional_amount
                        ) +
                          Number(
                            ultimoChangeOrder.additional_amount
                          ) *
                            (Number(
                              paymentSettings?.customer_service_fee_percent ||
                                0
                            ) /
                              100)
                      ).toFixed(2)}`}
                </button>
              </div>
            )}

            {ultimoChangeOrder.status ===
              "rejected" && (
              <p className="mt-4 text-sm font-bold leading-6 text-red-800">
                El cambio fue rechazado. El presupuesto anterior permanece sin cambios.
              </p>
            )}
          </section>
        )}

        {/* PROFESIONAL CONTRATADO */}

        {ofertaSeleccionada && (
          <section className="mt-6 rounded-3xl border-2 border-green-300 bg-green-50 p-7">

            <p className="text-sm font-extrabold uppercase tracking-wide text-green-700">
              ✓ Profesional contratado
            </p>

            <h2 className="mt-2 text-2xl font-extrabold text-green-900">
              {ofertaSeleccionada.profesional
                ?.business_name ||
                "Profesional FixFlow"}
            </h2>

            <p className="mt-2 text-green-800">
              Has seleccionado este presupuesto por{" "}
              <strong>
                $
                {Number(
                  ofertaSeleccionada.price
                ).toFixed(
                  2
                )}
              </strong>
              .
            </p>

            {payment && (
              <div className="mt-5 rounded-2xl border border-green-200 bg-white p-5">
                <p className="text-sm font-extrabold uppercase tracking-wide text-green-700">Resumen de pago</p>
                <div className="mt-4 space-y-3">
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Presupuesto del profesional</span>
                    <strong className="text-slate-900">${presupuestoTotalPagado.toFixed(2)}</strong>
                  </div>
                  <div className="flex items-center justify-between gap-4">
                    <span className="text-slate-600">Tarifa de servicio FixFlow ({Number(payment.customer_fee_percent).toFixed(2)}%)</span>
                    <strong className="text-slate-900">${tarifaClienteTotalPagada.toFixed(2)}</strong>
                  </div>
                  <div className="border-t border-slate-200 pt-3">
                    <div className="flex items-center justify-between gap-4">
                      <span className="font-extrabold text-slate-900">Total del cliente</span>
                      <strong className="text-xl text-green-800">${totalClientePagado.toFixed(2)}</strong>
                    </div>
                  </div>
                </div>

                {changeOrdersPagados.length > 0 && (
                  <div className="mt-4 rounded-xl bg-emerald-50 px-4 py-3 text-sm font-bold leading-6 text-emerald-800">
                    Este resumen incluye {changeOrdersPagados.length} cambio{changeOrdersPagados.length === 1 ? "" : "s"} de presupuesto pagado{changeOrdersPagados.length === 1 ? "" : "s"} por un total adicional de ${totalesAdicionalesPagados.toFixed(2)}.
                  </div>
                )}

                <div className="mt-4 border-t border-slate-200 pt-4">
                  <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                    <span className="text-sm font-bold text-slate-600">
                      Estado del pago
                    </span>

                    <span
                      className={`inline-flex w-fit rounded-full px-3 py-1 text-xs font-black ${
                        payment.status === "refunded"
                          ? "bg-emerald-100 text-emerald-800"
                          : payment.status === "partially_refunded"
                          ? "bg-violet-100 text-violet-800"
                          : payment.status === "paid_out"
                          ? "bg-blue-100 text-blue-800"
                          : payment.status === "ready_for_payout"
                          ? "bg-amber-100 text-amber-800"
                          : "bg-slate-100 text-slate-700"
                      }`}
                    >
                      {nombreEstadoPagoCliente(payment.status)}
                    </span>
                  </div>

                  {Number(payment.refunded_amount || 0) > 0 && (
                    <div className="mt-3 flex items-center justify-between gap-4 rounded-xl bg-emerald-50 px-4 py-3">
                      <span className="font-bold text-emerald-800">
                        Reembolso al cliente
                      </span>
                      <strong className="text-lg text-emerald-800">
                        ${Number(payment.refunded_amount || 0).toFixed(2)}
                      </strong>
                    </div>
                  )}

                  {payment.status === "ready_for_payout" && (
                    <p className="mt-3 text-xs leading-5 text-amber-700">
                      El pago está protegido por FixFlow y todavía no ha sido liberado al profesional.
                    </p>
                  )}

                  {payment.status === "paid_out" && (
                    <p className="mt-3 text-xs leading-5 text-blue-700">
                      El pago fue procesado y liberado de acuerdo con el flujo de FixFlow.
                    </p>
                  )}

                  {payment.status === "refunded" && (
                    <p className="mt-3 text-xs leading-5 text-emerald-700">
                      FixFlow procesó el reembolso correspondiente a este trabajo.
                    </p>
                  )}

                  {payment.status === "partially_refunded" && (
                    <p className="mt-3 text-xs leading-5 text-violet-700">
                      FixFlow procesó un reembolso parcial para este trabajo.
                    </p>
                  )}
                </div>
              </div>
            )}

            <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-3">

              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-green-700">
                  Llegada estimada
                </p>

                <p className="mt-1 font-extrabold text-green-900">
                  {mostrarMinutos(
                    ofertaSeleccionada.arrival_minutes
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-green-700">
                  Duración estimada
                </p>

                <p className="mt-1 font-extrabold text-green-900">
                  {mostrarMinutos(
                    ofertaSeleccionada.estimated_job_minutes
                  )}
                </p>
              </div>

              <div className="rounded-xl bg-white p-4">
                <p className="text-sm text-green-700">
                  Valoración
                </p>

                <p className="mt-1 font-extrabold text-green-900">
                  ⭐{" "}
                  {Number(
                    ofertaSeleccionada.profesional
                      ?.average_rating ||
                      0
                  ).toFixed(
                    1
                  )}
                </p>
              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                router.push(
                  `/profesionales/${ofertaSeleccionada.professional_id}?returnTo=${encodeURIComponent(
                    `/mis-solicitudes/${solicitud.id}`
                  )}`
                )
              }
              className="mt-5 rounded-xl border-2 border-green-700 px-5 py-3 font-extrabold text-green-800 hover:bg-green-100"
            >
              Ver perfil del profesional
            </button>

            {solicitud.status ===
              "completed" && (
                <button
                  type="button"
                  onClick={() =>
                    router.push(
                      `/solicitar-trabajo?profesional=${ofertaSeleccionada.professional_id}`
                    )
                  }
                  className="ml-0 mt-3 rounded-xl bg-green-700 px-5 py-3 font-extrabold text-white hover:bg-green-800 sm:ml-3"
                >
                  🔁 Contratar de nuevo
                </button>
              )}

          </section>
        )}

        {/* EVIDENCIA FINAL DEL PROFESIONAL */}

        {solicitud.status === "completed" &&
          evidenciasFinales.length > 0 && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-7 shadow-xl">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-blue-700">
                    📸 Evidencia del trabajo terminado
                  </p>

                  <h2 className="mt-2 text-2xl font-black text-slate-950">
                    Fotos y videos registrados por el profesional
                  </h2>

                  <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">
                    Esta evidencia fue registrada por el profesional al finalizar el servicio y queda asociada a este trabajo para tu protección y la del profesional.
                  </p>
                </div>

                <div className="w-fit rounded-full border border-blue-200 bg-blue-50 px-4 py-2 text-sm font-black text-blue-700">
                  {
                    evidenciasFinales.filter(
                      (item) =>
                        item.file_type === "image"
                    ).length
                  }{" "}
                  foto(s) ·{" "}
                  {
                    evidenciasFinales.filter(
                      (item) =>
                        item.file_type === "video"
                    ).length
                  }{" "}
                  video(s)
                </div>
              </div>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {evidenciasFinales.map(
                  (item) => (
                    <article
                      key={item.id}
                      className="overflow-hidden rounded-2xl border border-slate-200 bg-slate-50"
                    >
                      {item.signed_url ? (
                        item.file_type ===
                        "video" ? (
                          <video
                            src={item.signed_url}
                            controls
                            preload="metadata"
                            className="aspect-video w-full bg-black object-contain"
                          />
                        ) : (
                          <a
                            href={item.signed_url}
                            target="_blank"
                            rel="noreferrer"
                            className="block"
                          >
                            <img
                              src={item.signed_url}
                              alt="Evidencia del trabajo terminado"
                              className="aspect-video w-full bg-slate-100 object-cover transition hover:opacity-95"
                            />
                          </a>
                        )
                      ) : (
                        <div className="flex aspect-video items-center justify-center bg-slate-100 px-5 text-center text-sm font-bold text-slate-500">
                          No pudimos abrir este archivo de evidencia.
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
                        <span className="text-sm font-black text-slate-800">
                          {item.file_type ===
                          "video"
                            ? "🎥 Video"
                            : "📷 Foto"}
                        </span>

                        <span className="text-xs font-semibold text-slate-500">
                          Registrado
                        </span>
                      </div>
                    </article>
                  )
                )}
              </div>

              <div className="mt-5 rounded-2xl border border-blue-100 bg-blue-50 px-5 py-4">
                <p className="text-sm font-bold leading-6 text-blue-900">
                  🔒 Esta evidencia forma parte del registro del trabajo y no puede ser modificada desde esta pantalla.
                </p>
              </div>
            </section>
          )}

        {/* RESEÑA */}

        {solicitud.status ===
          "completed" &&
          ofertaSeleccionada && (
            <section className="mt-8 rounded-3xl border border-slate-200 bg-white p-8 shadow-xl">

              {review ? (
                <>

                  <div className="text-center">

                    <div className="text-5xl">
                      ✅
                    </div>

                    <h2 className="mt-3 text-2xl font-extrabold text-slate-900">
                      Gracias por tu calificación
                    </h2>

                    <p className="mt-2 text-slate-600">
                      Ya calificaste este trabajo.
                    </p>

                  </div>

                  <div className="mt-6 rounded-2xl bg-slate-50 p-6">

                    <p className="text-sm font-bold text-slate-500">
                      Tu calificación
                    </p>

                    <div className="mt-2 text-3xl">

                      {[1, 2, 3, 4, 5].map(
                        (
                          estrella
                        ) => (
                          <span
                            key={
                              estrella
                            }
                            className={
                              estrella <=
                              review.rating
                                ? "text-yellow-500"
                                : "text-slate-300"
                            }
                          >
                            ★
                          </span>
                        )
                      )}

                    </div>

                    {review.comment && (
                      <>
                        <p className="mt-5 text-sm font-bold text-slate-500">
                          Tu comentario
                        </p>

                        <p className="mt-2 leading-7 text-slate-700">
                          {review.comment}
                        </p>
                      </>
                    )}

                  </div>

                </>
              ) : (
                <>

                  <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                    Trabajo completado
                  </p>

                  <h2 className="mt-2 text-3xl font-extrabold text-slate-900">
                    Calificar profesional
                  </h2>

                  <p className="mt-2 text-slate-600">
                    ¿Cómo fue tu experiencia con{" "}
                    <strong>
                      {ofertaSeleccionada.profesional
                        ?.business_name ||
                        "este profesional"}
                    </strong>
                    ?
                  </p>

                  <form
                    onSubmit={
                      enviarResena
                    }
                    className="mt-7"
                  >

                    <p className="font-bold text-slate-900">
                      Tu calificación *
                    </p>

                    <div className="mt-3 flex gap-2">

                      {[1, 2, 3, 4, 5].map(
                        (
                          estrella
                        ) => (
                          <button
                            key={
                              estrella
                            }
                            type="button"
                            onClick={() =>
                              setRating(
                                estrella
                              )
                            }
                            className={`text-5xl transition hover:scale-110 ${
                              estrella <=
                              rating
                                ? "text-yellow-400"
                                : "text-slate-300"
                            }`}
                          >
                            ★
                          </button>
                        )
                      )}

                    </div>

                    <p className="mt-2 text-sm text-slate-500">
                      {rating === 0
                        ? "Selecciona de 1 a 5 estrellas."
                        : `Has seleccionado ${rating} ${
                            rating === 1
                              ? "estrella"
                              : "estrellas"
                          }.`}
                    </p>

                    <div className="mt-7">

                      <label className="mb-2 block font-bold text-slate-900">
                        Comentario
                      </label>

                      <textarea
                        value={
                          comentario
                        }
                        onChange={(e) =>
                          setComentario(
                            e.target.value
                          )
                        }
                        rows={5}
                        maxLength={
                          1000
                        }
                        placeholder="Cuéntanos cómo fue el servicio..."
                        className="w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900"
                      />

                      <p className="mt-2 text-right text-sm text-slate-500">
                        {comentario.length}
                        /1000
                      </p>

                    </div>

                    <button
                      type="submit"
                      disabled={
                        enviandoReview ||
                        rating === 0
                      }
                      className="mt-6 w-full rounded-xl bg-blue-700 px-6 py-4 text-lg font-extrabold text-white hover:bg-blue-800 disabled:opacity-50"
                    >
                      {enviandoReview
                        ? "Enviando calificación..."
                        : "Enviar reseña"}
                    </button>

                  </form>

                </>
              )}

            </section>
          )}

        {/* RECLAMO / REPORTAR PROBLEMA */}

        {(
          solicitud.status === "completed" ||
          solicitud.status === "cancelled" ||
          (
            solicitud.status === "in_progress" &&
            solicitud.job_stage === "working"
          )
        ) &&
          ofertaSeleccionada && (
          <section
            id="reclamos-cliente"
            className="mt-8 scroll-mt-6 rounded-3xl border border-red-200 bg-white p-8 shadow-xl"
          >
            {claim ? (
              <>
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-red-700">
                      ⚠️ Problema reportado
                    </p>
                    <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                      Tu reclamo quedó registrado
                    </h2>
                    <p className="mt-2 text-slate-600">
                      FixFlow conserva este reporte asociado al trabajo.
                    </p>
                  </div>

                  <span className="rounded-full bg-amber-100 px-4 py-2 text-sm font-black uppercase text-amber-800">
                    {claim.status === "open"
                      ? "Abierto"
                      : claim.status === "reviewing"
                      ? "En revisión"
                      : claim.status === "resolved"
                      ? "Resuelto"
                      : "Rechazado"}
                  </span>
                </div>

                <div className="mt-6 rounded-2xl bg-red-50 p-6">
                  <p className="text-sm font-bold text-red-700">Motivo</p>
                  <p className="mt-2 font-extrabold text-slate-900">
                    {claim.reason}
                  </p>

                  {claim.description && (
                    <>
                      <p className="mt-5 text-sm font-bold text-red-700">
                        Descripción
                      </p>
                      <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                        {claim.description}
                      </p>
                    </>
                  )}
                </div>

                {claim.status === "resolved" && (
                  <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-6">
                    <p className="text-sm font-black uppercase tracking-wide text-green-700">
                      ✅ Reclamo resuelto
                    </p>

                    <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm font-bold text-slate-500">
                          Reembolso al cliente
                        </p>
                        <p className="mt-1 text-xl font-black text-green-800">
                          ${Number(
                            claim.customer_refund_amount || 0
                          ).toFixed(2)}
                        </p>
                      </div>

                      <div className="rounded-xl bg-white p-4">
                        <p className="text-sm font-bold text-slate-500">
                          Compensación al profesional
                        </p>
                        <p className="mt-1 text-xl font-black text-slate-900">
                          ${Number(
                            claim.provider_award_amount || 0
                          ).toFixed(2)}
                        </p>
                      </div>
                    </div>

                    {claim.resolution_notes && (
                      <div className="mt-4 rounded-xl bg-white p-4">
                        <p className="text-sm font-bold text-slate-500">
                          Resolución de FixFlow
                        </p>
                        <p className="mt-2 whitespace-pre-wrap leading-7 text-slate-700">
                          {claim.resolution_notes}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </>
            ) : solicitud.status === "cancelled" ? (
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
                <p className="font-extrabold text-slate-900">
                  Este trabajo está cerrado.
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  No se pueden abrir nuevos reclamos después de que el trabajo ha sido cancelado.
                </p>
              </div>
            ) : !mostrarReclamo ? (
              <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="text-sm font-black uppercase tracking-wide text-red-700">
                    ¿Hubo un problema con el servicio?
                  </p>
                  <h2 className="mt-2 text-2xl font-extrabold text-slate-900">
                    Reportar un problema
                  </h2>
                  <p className="mt-2 max-w-2xl text-slate-600">
                    Usa esta opción si el trabajo quedó incompleto, hubo daños, un cobro adicional u otro problema importante.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setMostrarReclamo(true);
                    setError("");
                    setMensaje("");
                  }}
                  className="shrink-0 rounded-xl border-2 border-red-600 bg-white px-6 py-3 font-extrabold text-red-700 hover:bg-red-50"
                >
                  ⚠️ Reportar problema
                </button>
              </div>
            ) : (
              <form onSubmit={enviarReclamo} className="space-y-5">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-black uppercase tracking-wide text-red-700">
                      Abrir reclamo
                    </p>
                    <h2 className="mt-1 text-2xl font-extrabold text-slate-900">
                      Cuéntanos qué ocurrió
                    </h2>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setMostrarReclamo(false);
                      setMotivoReclamo("");
                      setDescripcionReclamo("");
                      setExplicacionEvidenciaCliente("");
                      setEvidenciasReclamo([]);
                      setError("");
                    }}
                    className="rounded-lg px-3 py-2 font-bold text-slate-500 hover:bg-slate-100"
                  >
                    ✕
                  </button>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-900">
                    Motivo del reclamo *
                  </label>
                  <select
                    value={motivoReclamo}
                    onChange={(e) => setMotivoReclamo(e.target.value)}
                    className="w-full rounded-xl border border-slate-300 bg-white p-4 font-semibold text-slate-900"
                  >
                    <option value="">Selecciona un motivo</option>
                    <option value="Trabajo incompleto">Trabajo incompleto</option>
                    <option value="Calidad del trabajo">Calidad del trabajo</option>
                    <option value="Daños durante el servicio">Daños durante el servicio</option>
                    <option value="Cobro adicional no acordado">Cobro adicional no acordado</option>
                    <option value="Conducta del profesional">Conducta del profesional</option>
                    <option value="Otro problema">Otro problema</option>
                  </select>
                </div>

                <div>
                  <label className="mb-2 block font-bold text-slate-900">
                    Explica el problema *
                  </label>
                  <textarea
                    value={descripcionReclamo}
                    onChange={(e) => setDescripcionReclamo(e.target.value)}
                    rows={5}
                    maxLength={1500}
                    placeholder="Describe qué ocurrió y qué parte del servicio tuvo el problema..."
                    className="w-full resize-none rounded-xl border border-slate-300 p-4 text-slate-900"
                  />
                  <p className="mt-2 text-right text-sm text-slate-500">
                    {descripcionReclamo.length}/1500
                  </p>
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="font-extrabold text-slate-900">
                        Fotos o videos
                      </p>
                      <p className="mt-1 text-sm text-slate-600">
                        Opcional. Puedes adjuntar hasta 10 fotos y 2 videos como evidencia.
                      </p>
                    </div>

                    <label className="inline-flex cursor-pointer items-center justify-center rounded-xl border-2 border-blue-700 bg-white px-5 py-3 font-extrabold text-blue-700 transition hover:bg-blue-50">
                      📎 Adjuntar archivos
                      <input
                        type="file"
                        multiple
                        accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime"
                        onChange={seleccionarEvidenciaReclamo}
                        disabled={enviandoReclamo}
                        className="hidden"
                      />
                    </label>
                  </div>

                  <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-900">
                    <p className="font-bold">
                      Formatos permitidos
                    </p>
                    <p className="mt-1">
                      Fotos: JPG, PNG, WEBP · Videos: MP4, WEBM, MOV · Máximo 50 MB por archivo.
                    </p>
                  </div>

                  {evidenciasReclamo.length > 0 && (
                    <div className="mt-4 space-y-3">
                      {evidenciasReclamo.map(
                        (file, index) => (
                          <div
                            key={`${file.name}-${file.size}-${index}`}
                            className="flex items-center justify-between gap-4 rounded-xl border border-slate-200 bg-white p-4"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-bold text-slate-900">
                                {file.type.startsWith("video/")
                                  ? "🎥"
                                  : "🖼️"}{" "}
                                {file.name}
                              </p>

                              <p className="mt-1 text-xs text-slate-500">
                                {(file.size / 1024 / 1024).toFixed(2)} MB
                              </p>
                            </div>

                            <button
                              type="button"
                              disabled={enviandoReclamo}
                              onClick={() =>
                                eliminarEvidenciaReclamo(
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

                      <p className="text-right text-sm font-bold text-slate-600">
                        {evidenciasReclamo.filter(
                          (file) =>
                            file.type.startsWith("image/")
                        ).length}{" "}
                        foto(s) ·{" "}
                        {evidenciasReclamo.filter(
                          (file) =>
                            file.type.startsWith("video/")
                        ).length}{" "}
                        video(s)
                      </p>
                    </div>
                  )}
                </div>

                {evidenciasReclamo.length > 0 && (
                  <div className="rounded-2xl border border-blue-200 bg-blue-50 p-5">
                    <label className="mb-2 block font-extrabold text-slate-900">
                      Explicación de la evidencia *
                    </label>

                    <p className="mb-3 text-sm text-slate-600">
                      Describe qué muestran las fotos o videos y qué debe considerar FixFlow al revisar tu reclamo.
                    </p>

                    <textarea
                      value={explicacionEvidenciaCliente}
                      onChange={(e) =>
                        setExplicacionEvidenciaCliente(e.target.value)
                      }
                      rows={5}
                      maxLength={1500}
                      disabled={enviandoReclamo}
                      placeholder="Ejemplo: Estas fotos muestran la parte del trabajo que quedó incompleta y el daño que encontré después del servicio..."
                      className="w-full resize-none rounded-xl border border-slate-300 bg-white p-4 text-slate-900 outline-none focus:border-blue-500 disabled:bg-slate-100"
                    />

                    <p className="mt-2 text-right text-sm text-slate-500">
                      {explicacionEvidenciaCliente.length}/1500
                    </p>
                  </div>
                )}

                <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                  <button
                    type="button"
                    disabled={enviandoReclamo}
                    onClick={() => {
                      setMostrarReclamo(false);
                      setMotivoReclamo("");
                      setDescripcionReclamo("");
                      setEvidenciasReclamo([]);
                      setError("");
                    }}
                    className="rounded-xl border-2 border-slate-300 bg-white px-5 py-3 font-extrabold text-slate-700 disabled:opacity-50"
                  >
                    Cancelar
                  </button>

                  <button
                    type="submit"
                    disabled={
                      enviandoReclamo ||
                      !motivoReclamo ||
                      descripcionReclamo.trim().length < 5 ||
                      (evidenciasReclamo.length > 0 &&
                        explicacionEvidenciaCliente.trim().length < 5)
                    }
                    className="rounded-xl bg-red-600 px-5 py-3 font-extrabold text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {enviandoReclamo
                      ? "Enviando reclamo..."
                      : "Enviar reclamo"}
                  </button>
                </div>
              </form>
            )}
          </section>
        )}

        {/* PRESUPUESTOS */}

        <section className="mt-8">

          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">

            <div>

              <h2 className="text-3xl font-extrabold text-slate-900">
                Presupuestos recibidos
              </h2>

              <p className="mt-2 text-slate-600">
                Compara precio, tiempo de llegada, experiencia y valoración antes de elegir.
              </p>

            </div>

            {solicitud.status ===
              "open" &&
              ofertasPendientes >
                0 && (
                <div className="rounded-full bg-blue-100 px-4 py-2 font-extrabold text-blue-800">
                  {ofertasPendientes}{" "}
                  {ofertasPendientes ===
                  1
                    ? "presupuesto disponible"
                    : "presupuestos disponibles"}
                </div>
              )}

          </div>

          {ofertas.length ===
          0 ? (
            <div className="rounded-3xl border border-slate-200 bg-white p-10 text-center shadow-lg">

              <div className="text-5xl">
                ⏳
              </div>

              <h3 className="mt-4 text-2xl font-extrabold text-slate-900">
                Todavía no tienes presupuestos
              </h3>

              <p className="mt-2 text-slate-600">
                Cuando un profesional envíe un presupuesto aparecerá aquí.
              </p>

            </div>
          ) : (
            <div className="space-y-5">

              {ofertas.map(
                (
                  oferta
                ) => {
                  const seleccionada =
                    oferta.status ===
                    "selected";

                  const rechazada =
                    oferta.status ===
                    "rejected";

                  return (
                    <article
                      key={
                        oferta.id
                      }
                      className={`rounded-3xl border bg-white p-7 shadow-lg ${
                        seleccionada
                          ? "border-green-400 ring-2 ring-green-100"
                          : rechazada
                          ? "border-slate-200 opacity-70"
                          : "border-slate-200"
                      }`}
                    >

                      <div className="flex flex-col gap-5 md:flex-row md:items-start md:justify-between">

                        <div>

                          <div className="flex flex-wrap items-center gap-2">

                            <p className="text-sm font-bold uppercase tracking-wide text-blue-700">
                              Profesional
                            </p>

                            {seleccionada && (
                              <span className="rounded-full bg-green-100 px-3 py-1 text-xs font-extrabold text-green-800">
                                ✓ Contratado
                              </span>
                            )}

                            {rechazada && (
                              <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">
                                No seleccionada
                              </span>
                            )}

                            {oferta.profesional?.verified && (
                              <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold text-blue-800">
                                ✓ Verificado
                              </span>
                            )}

                          </div>

                          <h3 className="mt-2 text-2xl font-extrabold text-slate-900">
                            {oferta.profesional?.business_name ||
                              "Profesional FixFlow"}
                          </h3>

                          <p className="mt-1 font-semibold text-blue-700">
                            {nombreOficio(
                              oferta.profesional?.trade ||
                                null
                            )}
                          </p>

                        </div>

                        <div className="rounded-2xl bg-green-50 px-6 py-4 text-center">

                          <p className="text-sm font-bold text-green-700">
                            Presupuesto
                          </p>

                          <p className="mt-1 text-3xl font-extrabold text-green-900">
                            $
                            {Number(
                              oferta.price
                            ).toFixed(
                              2
                            )}
                          </p>

                          {paymentSettings && (
                            <>
                              <p className="mt-2 text-xs font-semibold text-green-700">
                                + ${calcularMontosPago(oferta.price, paymentSettings).customerFeeAmount.toFixed(2)} tarifa FixFlow
                              </p>
                              <p className="mt-1 text-sm font-black text-green-950">
                                Total: ${calcularMontosPago(oferta.price, paymentSettings).customerTotalAmount.toFixed(2)}
                              </p>
                            </>
                          )}

                        </div>

                      </div>

                      <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">
                            🚗 Puede llegar
                          </p>

                          <p className="mt-1 font-extrabold text-slate-900">
                            {mostrarMinutos(
                              oferta.arrival_minutes
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">
                            ⏱️ Duración
                          </p>

                          <p className="mt-1 font-extrabold text-slate-900">
                            {mostrarMinutos(
                              oferta.estimated_job_minutes
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">
                            ⭐ Valoración
                          </p>

                          <p className="mt-1 font-extrabold text-slate-900">
                            {Number(
                              oferta.profesional?.average_rating ||
                                0
                            ).toFixed(
                              1
                            )}
                          </p>
                        </div>

                        <div className="rounded-xl bg-slate-50 p-4">
                          <p className="text-sm text-slate-500">
                            🛠️ Experiencia
                          </p>

                          <p className="mt-1 font-extrabold text-slate-900">
                            {oferta.profesional?.years_experience ??
                              0}{" "}
                            años
                          </p>
                        </div>

                      </div>

                      <div className="mt-4 rounded-xl bg-slate-50 p-4">

                        <p className="text-sm text-slate-500">
                          Trabajos completados en FixFlow
                        </p>

                        <p className="mt-1 font-extrabold text-slate-900">
                          {oferta.profesional?.completed_jobs ??
                            0}
                        </p>

                      </div>

                      <div className="mt-5 rounded-2xl border border-slate-200 p-5">

                        <p className="text-sm font-bold text-slate-500">
                          Mensaje del profesional
                        </p>

                        <p className="mt-2 leading-7 text-slate-700">
                          {oferta.message ||
                            "Sin mensaje adicional."}
                        </p>

                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          router.push(
                            `/profesionales/${oferta.professional_id}?returnTo=${encodeURIComponent(
                              `/mis-solicitudes/${solicitud.id}`
                            )}`
                          )
                        }
                        className="mt-5 w-full rounded-xl border-2 border-blue-700 px-6 py-3 font-extrabold text-blue-700 hover:bg-blue-50"
                      >
                        Ver perfil del profesional
                      </button>

                      {solicitud.status ===
                        "open" &&
                        oferta.status ===
                          "pending" && (
                          <button
                            type="button"
                            onClick={() =>
                              aceptarOferta(
                                oferta
                              )
                            }
                            disabled={
                              aceptandoId !==
                              null
                            }
                            className="mt-3 w-full rounded-xl bg-green-600 px-6 py-4 text-lg font-extrabold text-white hover:bg-green-700 disabled:opacity-50"
                          >
                            {aceptandoId ===
                            oferta.id
                              ? "Contratando profesional..."
                              : paymentSettings
                              ? `Revisar y continuar · Total $${calcularMontosPago(
                                  oferta.price,
                                  paymentSettings
                                ).customerTotalAmount.toFixed(2)}`
                              : `Contratar por $${Number(
                                  oferta.price
                                ).toFixed(
                                  2
                                )}`}
                          </button>
                        )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>

      </div>

    </main>
  );
}