"use client";

import { useEffect, useMemo, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!
);

type ProviderProfile = {
  user_id: string;
  business_name: string | null;
  verification_status: string | null;
  verified: boolean | null;
  active: boolean | null;
  stripe_account_id: string | null;
  stripe_onboarding_complete: boolean | null;
  stripe_charges_enabled: boolean | null;
  stripe_payouts_enabled: boolean | null;
};

type StripeStatus = {
  success?: boolean;
  connected?: boolean;
  stripeAccountId?: string | null;
  onboardingComplete?: boolean;
  chargesEnabled?: boolean;
  payoutsEnabled?: boolean;
  detailsSubmitted?: boolean;
  disabledReason?: string | null;
  currentlyDue?: string[];
  eventuallyDue?: string[];
  pastDue?: string[];
  error?: string;
};

type PaymentRow = {
  id: string;
  request_id: string;
  provider_id: string;
  job_amount: number | string | null;
  customer_total_amount: number | string | null;
  provider_commission_percent: number | string | null;
  provider_commission_amount: number | string | null;
  provider_net_amount: number | string | null;
  refunded_amount: number | string | null;
  currency: string | null;
  status: string | null;
  paid_at: string | null;
  completed_at: string | null;
  release_due_at: string | null;
  released_at: string | null;
  stripe_transfer_id: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type RequestSummary = {
  id: string;
  title: string | null;
  status: string | null;
};

export default function PagosProfesionalPage() {
  const router = useRouter();

  const [profile, setProfile] =
    useState<ProviderProfile | null>(null);

  const [email, setEmail] =
    useState("");

  const [loading, setLoading] =
    useState(true);

  const [configurando, setConfigurando] =
    useState(false);

  const [actualizando, setActualizando] =
    useState(false);

  const [error, setError] =
    useState("");

  const [stripeStatus, setStripeStatus] =
    useState<StripeStatus | null>(null);

  const [payments, setPayments] =
    useState<PaymentRow[]>([]);

  const [requestsMap, setRequestsMap] =
    useState<Record<string, RequestSummary>>({});

  useEffect(() => {
    cargarDatos();
  }, []);

  async function consultarEstadoStripe(
    providerProfile: ProviderProfile
  ) {
    try {
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        return providerProfile;
      }

      if (
        !providerProfile.stripe_account_id
      ) {
        setStripeStatus({
          connected: false,
          onboardingComplete: false,
          chargesEnabled: false,
          payoutsEnabled: false,
          detailsSubmitted: false,
          currentlyDue: [],
          eventuallyDue: [],
          pastDue: [],
        });

        return providerProfile;
      }

      const response = await fetch(
        "/api/stripe/connect/status",
        {
          method: "GET",
          headers: {
            Authorization:
              `Bearer ${session.access_token}`,
          },
          cache: "no-store",
        }
      );

      const data: StripeStatus =
        await response.json();

      if (!response.ok) {
        console.error(
          "Error consultando Stripe:",
          data
        );

        return providerProfile;
      }

      console.log(
        "ESTADO REAL DE STRIPE:",
        data
      );

      setStripeStatus(data);

      return {
        ...providerProfile,

        stripe_onboarding_complete:
          data.onboardingComplete === true,

        stripe_charges_enabled:
          data.chargesEnabled === true,

        stripe_payouts_enabled:
          data.payoutsEnabled === true,
      };
    } catch (statusError) {
      console.error(
        "No pudimos consultar el estado real de Stripe:",
        statusError
      );

      return providerProfile;
    }
  }

  async function cargarPagos(providerId: string) {
    const { data: paymentRows, error: paymentError } =
      await supabase
        .from("payments")
        .select(`
          id,
          request_id,
          provider_id,
          job_amount,
          customer_total_amount,
          provider_commission_percent,
          provider_commission_amount,
          provider_net_amount,
          refunded_amount,
          currency,
          status,
          paid_at,
          completed_at,
          release_due_at,
          released_at,
          stripe_transfer_id,
          created_at,
          updated_at
        `)
        .eq("provider_id", providerId)
        .order("created_at", { ascending: false });

    if (paymentError) {
      throw new Error(
        `No pudimos cargar tu historial de pagos: ${paymentError.message}`
      );
    }

    const rows = (paymentRows || []) as PaymentRow[];
    setPayments(rows);

    const requestIds = [
      ...new Set(rows.map((row) => row.request_id).filter(Boolean)),
    ];

    if (requestIds.length === 0) {
      setRequestsMap({});
      return;
    }

    const { data: requestRows, error: requestError } =
      await supabase
        .from("service_requests")
        .select(`
          id,
          title,
          status
        `)
        .in("id", requestIds);

    if (requestError) {
      console.error(
        "No pudimos cargar títulos de trabajos:",
        requestError
      );
      return;
    }

    const nextMap: Record<string, RequestSummary> = {};

    for (const request of requestRows || []) {
      nextMap[request.id] = request;
    }

    setRequestsMap(nextMap);
  }

  async function cargarDatos() {
    setLoading(true);
    setError("");

    try {
      const {
        data: { user },
        error: userError,
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

      setEmail(
        user.email || ""
      );

      const {
        data: baseProfile,
        error: baseProfileError,
      } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();

      if (
        baseProfileError ||
        !baseProfile
      ) {
        throw new Error(
          "No encontramos tu cuenta en RELYDO."
        );
      }

      if (
        baseProfile.role !==
        "provider"
      ) {
        throw new Error(
          "Esta cuenta no pertenece a un profesional."
        );
      }

      const {
        data: providerProfile,
        error: providerError,
      } = await supabase
        .from(
          "provider_profiles"
        )
        .select(`
          user_id,
          business_name,
          verification_status,
          verified,
          active,
          stripe_account_id,
          stripe_onboarding_complete,
          stripe_charges_enabled,
          stripe_payouts_enabled
        `)
        .eq(
          "user_id",
          user.id
        )
        .maybeSingle();

      if (
        providerError
      ) {
        throw new Error(
          `No pudimos cargar tu información de pagos: ${providerError.message}`
        );
      }

      if (
        !providerProfile
      ) {
        throw new Error(
          "No encontramos tu perfil profesional."
        );
      }

      const perfilInicial =
        providerProfile as ProviderProfile;

      setProfile(
        perfilInicial
      );

      await cargarPagos(
        perfilInicial.user_id
      );

      /*
        IMPORTANTE:
        SI YA EXISTE CUENTA STRIPE,
        CONSULTAMOS EL ESTADO REAL.
      */

      if (
        perfilInicial.stripe_account_id
      ) {
        const perfilActualizado =
          await consultarEstadoStripe(
            perfilInicial
          );

        setProfile(
          perfilActualizado
        );
      }
    } catch (err) {
      console.error(
        "Error cargando pagos:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "Ocurrió un error inesperado."
      );
    } finally {
      setLoading(false);
    }
  }

  async function actualizarEstado() {
    if (!profile) {
      return;
    }

    setActualizando(true);
    setError("");

    try {
      const perfilActualizado =
        await consultarEstadoStripe(
          profile
        );

      setProfile(
        perfilActualizado
      );

      await cargarPagos(
        profile.user_id
      );
    } catch (err) {
      console.error(
        "Error actualizando estado:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No pudimos actualizar el estado."
      );
    } finally {
      setActualizando(false);
    }
  }

  async function configurarMetodoDeposito() {
    setConfigurando(true);
    setError("");

    try {
      const {
        data: { session },
        error: sessionError,
      } =
        await supabase.auth.getSession();

      if (
        sessionError ||
        !session?.access_token
      ) {
        throw new Error(
          "Tu sesión expiró. Inicia sesión nuevamente."
        );
      }

      const response =
        await fetch(
          "/api/stripe/connect",
          {
            method: "POST",

            headers: {
              Authorization:
                `Bearer ${session.access_token}`,
            },
          }
        );

      const data =
        await response.json();

      if (
        !response.ok
      ) {
        throw new Error(
          data?.error ||
            "No pudimos iniciar la configuración de tu método de depósito."
        );
      }

      if (
        !data?.url
      ) {
        throw new Error(
          "No pudimos obtener el enlace seguro para configurar tu método de depósito."
        );
      }

      window.location.href =
        data.url;
    } catch (err) {
      console.error(
        "Error configurando método de depósito:",
        err
      );

      setError(
        err instanceof Error
          ? err.message
          : "No pudimos configurar tu método de depósito."
      );
    } finally {
      setConfigurando(false);
    }
  }

  const resumen = useMemo(() => {
    const retenidos = payments.filter(
      (payment) => payment.status === "ready_for_payout"
    );

    const pagados = payments.filter(
      (payment) => payment.status === "paid_out"
    );

    const reembolsados = payments.filter(
      (payment) =>
        payment.status === "refunded" ||
        payment.status === "partially_refunded"
    );

    const retenidoTotal = retenidos.reduce(
      (total, payment) =>
        total + dinero(payment.provider_net_amount),
      0
    );

    const pagadoTotal = pagados.reduce(
      (total, payment) =>
        total + dinero(payment.provider_net_amount),
      0
    );

    return {
      retenidos: retenidos.length,
      pagados: pagados.length,
      reembolsados: reembolsados.length,
      retenidoTotal,
      pagadoTotal,
    };
  }, [payments]);

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="rounded-2xl border border-slate-200 bg-white px-8 py-7 shadow-lg">

          <p className="font-bold text-slate-700">
            Consultando tu información de pagos...
          </p>

        </div>

      </main>
    );
  }

  if (!profile) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-100 px-4">

        <div className="w-full max-w-lg rounded-3xl bg-white p-8 text-center shadow-xl">

          <h1 className="text-2xl font-black text-red-700">
            No pudimos abrir tus pagos
          </h1>

          <p className="mt-4 text-slate-600">
            {error ||
              "No encontramos tu perfil profesional."}
          </p>

          <button
            type="button"
            onClick={() =>
              router.push(
                "/panel-profesional"
              )
            }
            className="mt-6 w-full rounded-xl bg-blue-700 px-5 py-3 font-black text-white hover:bg-blue-800"
          >
            Volver al panel
          </button>

        </div>

      </main>
    );
  }

  const estaVerificado =
    profile.verification_status ===
      "verified" &&
    profile.verified === true &&
    profile.active === true;

  const metodoConfigurado =
    !!profile.stripe_account_id;

  const depositosHabilitados =
    profile.stripe_payouts_enabled ===
    true;

  const onboardingCompleto =
    profile.stripe_onboarding_complete ===
    true;

  const pagosListos =
    onboardingCompleto &&
    depositosHabilitados;

  const detallesEnviados =
    stripeStatus?.detailsSubmitted ===
    true;

  const requisitosPendientes =
    stripeStatus?.currentlyDue || [];

  const requisitosVencidos =
    stripeStatus?.pastDue || [];

  const motivoDeshabilitado =
    stripeStatus?.disabledReason ||
    null;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 md:py-10">

      <div className="mx-auto max-w-5xl">

        <button
          type="button"
          onClick={() =>
            router.push(
              "/panel-profesional"
            )
          }
          className="font-bold text-blue-700 hover:underline"
        >
          ← Volver al panel profesional
        </button>

        <section className="mt-5 overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-xl">

          {/* HEADER */}

          <div className="bg-gradient-to-br from-blue-700 to-indigo-700 p-6 text-white md:p-9">

            <p className="text-xs font-black uppercase tracking-[0.16em] text-blue-100">
              Pagos y depósitos
            </p>

            <h1 className="mt-3 text-3xl font-black tracking-tight md:text-4xl">
              Configura cómo recibirás tu dinero
            </h1>

            <p className="mt-3 max-w-xl text-sm leading-6 text-blue-100 md:text-base">
              Configura de forma segura
              dónde recibirás el dinero
              correspondiente a tus
              trabajos completados.
            </p>

          </div>

          <div className="p-5 md:p-8">

            {/* PROFESIONAL */}

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

              <p className="text-xs font-black uppercase tracking-wide text-slate-500">
                Profesional
              </p>

              <p className="mt-2 text-xl font-black text-slate-950">
                {profile.business_name ||
                  "Profesional RELYDO"}
              </p>

              <p className="mt-1 break-all text-sm text-slate-500">
                {email}
              </p>

            </div>

            {/* ESTADOS */}

            <div className="mt-5 grid gap-4 sm:grid-cols-2">

              <EstadoCard
                titulo="Método de depósito"
                activo={
                  metodoConfigurado
                }
                textoActivo="Configurado"
                textoInactivo="No configurado"
              />

              <EstadoCard
                titulo="Depósitos"
                activo={
                  depositosHabilitados
                }
                textoActivo="Habilitados"
                textoInactivo="Pendientes"
              />

            </div>

            {/* ESTADO CONFIGURACION */}

            <div className="mt-5 rounded-2xl border border-slate-200 bg-white p-5">

              <p className="font-black text-slate-900">
                Estado de configuración
              </p>

              {!estaVerificado ? (

                <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50 p-4">

                  <p className="font-bold text-amber-900">
                    Tu cuenta profesional todavía no está lista para configurar depósitos.
                  </p>

                  <p className="mt-1 text-sm text-amber-800">
                    Primero debes completar la verificación profesional.
                  </p>

                </div>

              ) : pagosListos ? (

                <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4">

                  <p className="font-black text-emerald-900">
                    ✓ Pagos y depósitos habilitados
                  </p>

                  <p className="mt-1 text-sm text-emerald-800">
                    Tu método de depósito está configurado y tu cuenta está preparada para recibir dinero.
                  </p>

                </div>

              ) : metodoConfigurado ? (

                <div className="mt-3 rounded-xl border border-blue-200 bg-blue-50 p-4">

                  <p className="font-black text-blue-900">
                    Configuración pendiente
                  </p>

                  <p className="mt-1 text-sm text-blue-800">
                    Tu método de depósito ya está conectado, pero Stripe todavía no ha habilitado los depósitos.
                  </p>

                  {detallesEnviados && (
                    <p className="mt-2 text-sm font-bold text-blue-800">
                      ✓ Información de la cuenta enviada a Stripe.
                    </p>
                  )}

                </div>

              ) : (

                <div className="mt-3 rounded-xl border border-slate-200 bg-slate-50 p-4">

                  <p className="font-black text-slate-900">
                    Aún no has configurado tu método de depósito
                  </p>

                  <p className="mt-1 text-sm text-slate-600">
                    Podrás configurar una cuenta bancaria o, cuando sea elegible, una tarjeta de débito compatible para recibir tus depósitos.
                  </p>

                </div>

              )}

            </div>

            {/* REQUISITOS PENDIENTES */}

            {metodoConfigurado &&
              !depositosHabilitados &&
              requisitosPendientes.length >
                0 && (

              <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-5">

                <p className="font-black text-amber-900">
                  Stripe necesita información adicional
                </p>

                <p className="mt-1 text-sm text-amber-800">
                  Completa los datos pendientes para poder recibir depósitos.
                </p>

                <div className="mt-3 space-y-2">

                  {requisitosPendientes.map(
                    (requisito) => (
                      <div
                        key={
                          requisito
                        }
                        className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-amber-900"
                      >
                        •{" "}
                        {formatearRequisito(
                          requisito
                        )}
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* PAST DUE */}

            {requisitosVencidos.length >
              0 && (

              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-5">

                <p className="font-black text-red-900">
                  Información requerida
                </p>

                <p className="mt-1 text-sm text-red-800">
                  Stripe tiene información vencida que debe actualizarse.
                </p>

                <div className="mt-3 space-y-2">

                  {requisitosVencidos.map(
                    (requisito) => (
                      <div
                        key={
                          requisito
                        }
                        className="rounded-xl bg-white px-4 py-3 text-sm font-bold text-red-900"
                      >
                        •{" "}
                        {formatearRequisito(
                          requisito
                        )}
                      </div>
                    )
                  )}

                </div>

              </div>
            )}

            {/* DISABLED REASON */}

            {motivoDeshabilitado && (
              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

                <p className="text-sm font-black text-slate-800">
                  Estado informado por Stripe
                </p>

                <p className="mt-1 break-all text-xs text-slate-600">
                  {motivoDeshabilitado}
                </p>

              </div>
            )}

            {/* ERROR */}

            {error && (
              <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 font-bold text-red-800">
                {error}
              </div>
            )}

            {/* BOTON CONFIGURACION */}

            {estaVerificado &&
              !pagosListos && (

              <button
                type="button"
                onClick={
                  configurarMetodoDeposito
                }
                disabled={
                  configurando
                }
                className="mt-6 w-full rounded-2xl bg-blue-700 px-5 py-4 text-base font-black text-white shadow-lg shadow-blue-700/15 transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:opacity-60 md:text-lg"
              >
                {configurando
                  ? "Abriendo configuración segura..."
                  : metodoConfigurado
                  ? "Continuar configuración del método de depósito"
                  : "Configurar método de depósito"}
              </button>
            )}

            {/* ACTUALIZAR ESTADO */}

            {metodoConfigurado && (
              <button
                type="button"
                onClick={
                  actualizarEstado
                }
                disabled={
                  actualizando
                }
                className="mt-3 w-full rounded-2xl border-2 border-blue-700 bg-white px-5 py-4 font-black text-blue-700 hover:bg-blue-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {actualizando
                  ? "Consultando Stripe..."
                  : "Actualizar estado"}
              </button>
            )}

            {/* ADMINISTRAR CUANDO TODO LISTO */}

            {pagosListos && (
              <button
                type="button"
                onClick={
                  configurarMetodoDeposito
                }
                disabled={
                  configurando
                }
                className="mt-3 w-full rounded-2xl bg-slate-900 px-5 py-4 font-black text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {configurando
                  ? "Abriendo administración segura..."
                  : "Administrar / cambiar método de depósito"}
              </button>
            )}

            {/* SEGURIDAD */}

            <div className="mt-5 rounded-xl bg-slate-50 px-4 py-3">

              <p className="text-center text-xs leading-5 text-slate-500">
                🔒 Tus datos financieros se procesan de forma segura mediante Stripe.
                RELYDO no necesita mostrar ni almacenar tu número completo de cuenta o tarjeta.
              </p>

            </div>

          </div>

        </section>

        <section className="mt-6 rounded-[26px] border border-slate-200 bg-white p-5 shadow-xl md:p-8">
          <div className="flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.16em] text-slate-500">
                Movimientos
              </p>

              <h2 className="mt-2 text-2xl font-black text-slate-950 md:text-3xl">
                Estado de tus pagos
              </h2>

              <p className="mt-2 text-sm text-slate-600">
                Aquí puedes ver qué dinero sigue retenido por RELYDO y qué pagos ya fueron enviados.
              </p>
            </div>

            <button
              type="button"
              onClick={actualizarEstado}
              disabled={actualizando}
              className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-sm font-black text-slate-800 hover:bg-slate-50 disabled:opacity-60"
            >
              {actualizando ? "Actualizando..." : "Actualizar movimientos"}
            </button>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-3">
            <ResumenPagoCard
              titulo="Retenido"
              valor={formatearDinero(resumen.retenidoTotal)}
              detalle={`${resumen.retenidos} pago${resumen.retenidos === 1 ? "" : "s"}`}
              tipo="retenido"
            />

            <ResumenPagoCard
              titulo="Pagado"
              valor={formatearDinero(resumen.pagadoTotal)}
              detalle={`${resumen.pagados} pago${resumen.pagados === 1 ? "" : "s"}`}
              tipo="pagado"
            />

            <ResumenPagoCard
              titulo="Reembolsos"
              valor={String(resumen.reembolsados)}
              detalle="pagos afectados"
              tipo="reembolso"
            />
          </div>

          <div className="mt-6 space-y-4">
            {payments.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-7 text-center">
                <p className="font-black text-slate-800">
                  Todavía no tienes movimientos de pago.
                </p>
              </div>
            ) : (
              payments.map((payment) => {
                const request = requestsMap[payment.request_id];
                const estado = obtenerEstadoPago(payment);

                return (
                  <article
                    key={payment.id}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm"
                  >
                    <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${estado.badgeClass}`}>
                            {estado.label}
                          </span>

                          <span className="text-xs font-bold text-slate-400">
                            Trabajo #{payment.request_id.slice(0, 8).toUpperCase()}
                          </span>
                        </div>

                        <h3 className="mt-3 text-lg font-black text-slate-950">
                          {request?.title || "Trabajo FixFlow"}
                        </h3>

                        <p className="mt-1 text-sm text-slate-500">
                          {estado.descripcion}
                        </p>
                      </div>

                      <div className="text-left md:text-right">
                        <p className="text-xs font-black uppercase tracking-wide text-slate-400">
                          Neto profesional
                        </p>

                        <p className="mt-1 text-2xl font-black text-slate-950">
                          {formatearDinero(dinero(payment.provider_net_amount))}
                        </p>
                      </div>
                    </div>

                    <div className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                      <DatoPago
                        titulo="Valor del trabajo"
                        valor={formatearDinero(dinero(payment.job_amount))}
                      />
                      <DatoPago
                        titulo="Comisión FixFlow"
                        valor={formatearDinero(dinero(payment.provider_commission_amount))}
                      />
                      <DatoPago
                        titulo="Pagado por cliente"
                        valor={formatearDinero(dinero(payment.customer_total_amount))}
                      />
                      <DatoPago
                        titulo="Moneda"
                        valor={(payment.currency || "USD").toUpperCase()}
                      />
                    </div>

                    {payment.release_due_at && payment.status === "ready_for_payout" && (
                      <div className="mt-4 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3">
                        <p className="text-sm font-black text-amber-900">
                          ⏳ Pago retenido
                        </p>
                        <p className="mt-1 text-xs leading-5 text-amber-800">
                          Liberación programada para {formatearFecha(payment.release_due_at)}. Si existe un reclamo activo, el pago permanecerá retenido hasta que FixFlow lo resuelva.
                        </p>
                      </div>
                    )}

                    {payment.status === "paid_out" && (
                      <div className="mt-4 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3">
                        <p className="text-sm font-black text-emerald-900">
                          ✓ Pago enviado
                        </p>
                        <p className="mt-1 text-xs leading-5 text-emerald-800">
                          {payment.released_at
                            ? `Liberado ${formatearFecha(payment.released_at)}.`
                            : "El pago fue liberado al profesional."}
                        </p>
                        {payment.stripe_transfer_id && (
                          <p className="mt-2 break-all text-[11px] font-bold text-emerald-700">
                            Transferencia Stripe: {payment.stripe_transfer_id}
                          </p>
                        )}
                      </div>
                    )}

                    {(payment.status === "refunded" || payment.status === "partially_refunded") && (
                      <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 px-4 py-3">
                        <p className="text-sm font-black text-blue-900">
                          ↩ Resolución con reembolso
                        </p>
                        <p className="mt-1 text-xs leading-5 text-blue-800">
                          Reembolsado al cliente: {formatearDinero(dinero(payment.refunded_amount))}
                        </p>
                      </div>
                    )}

                    <button
                      type="button"
                      onClick={() => router.push(`/trabajos/${payment.request_id}`)}
                      className="mt-4 rounded-xl border-2 border-blue-700 bg-white px-4 py-2.5 text-sm font-black text-blue-700 hover:bg-blue-50"
                    >
                      Ver trabajo
                    </button>
                  </article>
                );
              })
            )}
          </div>
        </section>

      </div>

    </main>
  );
}

function EstadoCard({
  titulo,
  activo,
  textoActivo,
  textoInactivo,
}: {
  titulo: string;
  activo: boolean;
  textoActivo: string;
  textoInactivo: string;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">

      <p className="text-sm font-bold text-slate-500">
        {titulo}
      </p>

      <div className="mt-3 flex items-center gap-2">

        <span
          className={`h-3 w-3 shrink-0 rounded-full ${
            activo
              ? "bg-emerald-500"
              : "bg-amber-400"
          }`}
        />

        <p
          className={`font-black ${
            activo
              ? "text-emerald-800"
              : "text-amber-800"
          }`}
        >
          {activo
            ? textoActivo
            : textoInactivo}
        </p>

      </div>

    </div>
  );
}

function ResumenPagoCard({
  titulo,
  valor,
  detalle,
  tipo,
}: {
  titulo: string;
  valor: string;
  detalle: string;
  tipo: "retenido" | "pagado" | "reembolso";
}) {
  const clases =
    tipo === "retenido"
      ? "border-amber-200 bg-amber-50 text-amber-950"
      : tipo === "pagado"
      ? "border-emerald-200 bg-emerald-50 text-emerald-950"
      : "border-blue-200 bg-blue-50 text-blue-950";

  return (
    <div className={`rounded-2xl border p-5 ${clases}`}>
      <p className="text-xs font-black uppercase tracking-wide opacity-70">
        {titulo}
      </p>
      <p className="mt-2 text-2xl font-black">{valor}</p>
      <p className="mt-1 text-xs font-bold opacity-70">{detalle}</p>
    </div>
  );
}

function DatoPago({
  titulo,
  valor,
}: {
  titulo: string;
  valor: string;
}) {
  return (
    <div className="rounded-xl bg-slate-50 px-4 py-3">
      <p className="text-xs font-bold text-slate-500">{titulo}</p>
      <p className="mt-1 font-black text-slate-950">{valor}</p>
    </div>
  );
}

function obtenerEstadoPago(payment: PaymentRow) {
  if (payment.status === "paid_out") {
    return {
      label: "Pagado",
      descripcion: "FixFlow ya liberó este pago al profesional.",
      badgeClass: "bg-emerald-100 text-emerald-800",
    };
  }

  if (payment.status === "ready_for_payout") {
    return {
      label: "Retenido",
      descripcion: "El pago está protegido por RELYDO hasta que venza el período de seguridad.",
      badgeClass: "bg-amber-100 text-amber-800",
    };
  }

  if (payment.status === "partially_refunded") {
    return {
      label: "Resolución parcial",
      descripcion: "RELYDO resolvió este pago parcialmente.",
      badgeClass: "bg-violet-100 text-violet-800",
    };
  }

  if (payment.status === "refunded") {
    return {
      label: "Reembolsado",
      descripcion: "El pago fue reembolsado al cliente.",
      badgeClass: "bg-blue-100 text-blue-800",
    };
  }

  if (payment.status === "cancelled") {
    return {
      label: "Cancelado",
      descripcion: "Este pago corresponde a un trabajo cancelado.",
      badgeClass: "bg-red-100 text-red-800",
    };
  }

  if (payment.status === "paid") {
    return {
      label: "Pago recibido",
      descripcion: "El pago del cliente fue confirmado.",
      badgeClass: "bg-sky-100 text-sky-800",
    };
  }

  return {
    label: payment.status || "Pendiente",
    descripcion: "Movimiento registrado en RELYDO.",
    badgeClass: "bg-slate-100 text-slate-700",
  };
}

function dinero(valor: number | string | null) {
  const numero = Number(valor || 0);
  return Number.isFinite(numero) ? numero : 0;
}

function formatearDinero(valor: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(valor);
}

function formatearFecha(valor: string) {
  const fecha = new Date(valor);

  if (Number.isNaN(fecha.getTime())) {
    return valor;
  }

  return fecha.toLocaleString("es-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });
}

function formatearRequisito(
  requisito: string
) {
  const traducciones:
    Record<string, string> = {
      "individual.first_name":
        "Nombre legal",

      "individual.last_name":
        "Apellido legal",

      "individual.dob.day":
        "Día de nacimiento",

      "individual.dob.month":
        "Mes de nacimiento",

      "individual.dob.year":
        "Año de nacimiento",

      "individual.address.line1":
        "Dirección",

      "individual.address.city":
        "Ciudad",

      "individual.address.state":
        "Estado",

      "individual.address.postal_code":
        "Código postal",

      "individual.ssn_last_4":
        "Últimos 4 dígitos del SSN",

      "individual.id_number":
        "Identificación fiscal",

      "individual.verification.document":
        "Documento de identidad",

      "external_account":
        "Cuenta bancaria o método de depósito",

      "business_profile.url":
        "Sitio web del negocio",

      "business_profile.mcc":
        "Tipo de actividad del negocio",

      "business_profile.product_description":
        "Descripción de los servicios",

      "tos_acceptance.date":
        "Aceptar los términos de Stripe",

      "tos_acceptance.ip":
        "Aceptar los términos de Stripe",
    };

  return (
    traducciones[requisito] ||
    requisito
      .replaceAll("_", " ")
      .replaceAll(".", " → ")
  );
}