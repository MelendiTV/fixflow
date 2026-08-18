import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!);

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SECRET_KEY!,
  {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  }
);

function redondearDinero(valor: number) {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const sessionId = body.sessionId;

    if (!sessionId) {
      return NextResponse.json(
        {
          error: "Falta el ID de la sesión de Stripe.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 1. CONFIRMAR EL PAGO DIRECTAMENTE CON STRIPE
    // ======================================================

    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status !== "paid") {
      return NextResponse.json(
        {
          error: "Stripe todavía no confirma este pago.",
          paymentStatus: session.payment_status,
        },
        { status: 400 }
      );
    }

    const requestId = session.metadata?.request_id;
    const offerId = session.metadata?.offer_id;

    if (!requestId || !offerId) {
      return NextResponse.json(
        {
          error:
            "La sesión de Stripe no contiene los datos necesarios del trabajo.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 2. BUSCAR LA OFERTA PAGADA
    // ======================================================

    const { data: offer, error: offerError } = await supabaseAdmin
      .from("offers")
      .select(`
        id,
        request_id,
        professional_id,
        price,
        status
      `)
      .eq("id", offerId)
      .eq("request_id", requestId)
      .maybeSingle();

    if (offerError) {
      console.error("Error buscando oferta:", offerError);

      return NextResponse.json(
        {
          error: `Error buscando la oferta: ${offerError.message}`,
        },
        { status: 500 }
      );
    }

    if (!offer) {
      return NextResponse.json(
        {
          error: "No encontramos la oferta correspondiente al pago.",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 3. BUSCAR LA SOLICITUD
    // ======================================================

    const { data: serviceRequest, error: requestError } =
      await supabaseAdmin
        .from("service_requests")
        .select(`
          id,
          customer_id,
          status,
          preferred_provider_id
        `)
        .eq("id", requestId)
        .maybeSingle();

    if (requestError) {
      console.error("Error buscando solicitud:", requestError);

      return NextResponse.json(
        {
          error: `Error buscando la solicitud: ${requestError.message}`,
        },
        { status: 500 }
      );
    }

    if (!serviceRequest) {
      return NextResponse.json(
        {
          error: "No encontramos la solicitud correspondiente.",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 4. CARGAR CONFIGURACIÓN DE PAGOS
    // ======================================================

    const { data: paymentSettings, error: settingsError } =
      await supabaseAdmin
        .from("payment_settings")
        .select(`
          id,
          provider_commission_percent,
          customer_service_fee_percent,
          currency,
          active
        `)
        .eq("active", true)
        .order("created_at", {
          ascending: false,
        })
        .limit(1)
        .maybeSingle();

    if (settingsError) {
      console.error(
        "Error cargando configuración de pagos:",
        settingsError
      );

      return NextResponse.json(
        {
          error: `No pudimos cargar la configuración de pagos: ${settingsError.message}`,
        },
        { status: 500 }
      );
    }

    if (!paymentSettings) {
      return NextResponse.json(
        {
          error:
            "No existe una configuración de pagos activa en RELYDO.",
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 5. CALCULAR LOS MONTOS
    // ======================================================

    const jobAmount = redondearDinero(Number(offer.price));

    if (!Number.isFinite(jobAmount) || jobAmount <= 0) {
      return NextResponse.json(
        {
          error: "El precio de la oferta no es válido.",
        },
        { status: 400 }
      );
    }

    const customerFeePercent = Number(
      paymentSettings.customer_service_fee_percent || 0
    );

    const providerCommissionPercent = Number(
      paymentSettings.provider_commission_percent || 0
    );

    const customerFeeAmount = redondearDinero(
      jobAmount * (customerFeePercent / 100)
    );

    const customerTotalAmount = redondearDinero(
      jobAmount + customerFeeAmount
    );

    const providerCommissionAmount = redondearDinero(
      jobAmount * (providerCommissionPercent / 100)
    );

    const providerNetAmount = redondearDinero(
      jobAmount - providerCommissionAmount
    );

    const platformRevenueAmount = redondearDinero(
      customerFeeAmount + providerCommissionAmount
    );

    const stripeTotal =
      typeof session.amount_total === "number"
        ? redondearDinero(session.amount_total / 100)
        : null;

    if (
      stripeTotal !== null &&
      Math.abs(stripeTotal - customerTotalAmount) > 0.01
    ) {
      return NextResponse.json(
        {
          error:
            "El importe confirmado por Stripe no coincide con el total calculado por RELYDO.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 6. OBTENER PAYMENT INTENT
    // ======================================================

    if (!session.payment_intent) {
      return NextResponse.json(
        {
          error:
            "Stripe confirmó el pago, pero no encontramos el PaymentIntent.",
        },
        { status: 500 }
      );
    }

    const paymentIntentId =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent.id;

    const paymentIntent = await stripe.paymentIntents.retrieve(
      paymentIntentId
    );

    const stripePaymentId = paymentIntent.id;

    const stripeCustomerId =
      typeof session.customer === "string"
        ? session.customer
        : null;

    // ======================================================
    // 7. REGISTRAR EL PAGO
    //
    // IMPORTANTE:
    // EL DINERO YA FUE COBRADO AL CLIENTE,
    // PERO TODAVÍA NO SE ENVÍA AL PROFESIONAL.
    // ======================================================

    const paymentData = {
      request_id: requestId,
      offer_id: offerId,
      customer_id: serviceRequest.customer_id,
      provider_id: offer.professional_id,

      job_amount: jobAmount,

      customer_fee_percent: customerFeePercent,
      customer_fee_amount: customerFeeAmount,
      customer_total_amount: customerTotalAmount,

      provider_commission_percent: providerCommissionPercent,
      provider_commission_amount: providerCommissionAmount,
      provider_net_amount: providerNetAmount,

      platform_revenue_amount: platformRevenueAmount,

      currency: (
        paymentSettings.currency || "usd"
      ).toUpperCase(),

      // El pago está recibido, pero todavía retenido
      // dentro del flujo de RELYDO.
      status: "ready_for_payout",

      payment_provider: "stripe",
      provider_payment_id: stripePaymentId,
      provider_customer_id: stripeCustomerId,

      refunded_amount: 0,

      paid_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    const {
      data: existingPayments,
      error: existingPaymentError,
    } = await supabaseAdmin
      .from("payments")
      .select("id")
      .eq("offer_id", offerId)
      .limit(1);

    if (existingPaymentError) {
      console.error(
        "Error buscando payment existente:",
        existingPaymentError
      );

      return NextResponse.json(
        {
          error: `No pudimos comprobar el registro del pago: ${existingPaymentError.message}`,
        },
        { status: 500 }
      );
    }

    const existingPayment =
      existingPayments && existingPayments.length > 0
        ? existingPayments[0]
        : null;

    if (existingPayment) {
      const { error: updatePaymentError } =
        await supabaseAdmin
          .from("payments")
          .update(paymentData)
          .eq("id", existingPayment.id);

      if (updatePaymentError) {
        console.error(
          "Error actualizando payment:",
          updatePaymentError
        );

        return NextResponse.json(
          {
            error: `Stripe confirmó el pago, pero RELYDO no pudo actualizar payments: ${updatePaymentError.message}`,
          },
          { status: 500 }
        );
      }
    } else {
      const { error: insertPaymentError } =
        await supabaseAdmin
          .from("payments")
          .insert(paymentData);

      if (insertPaymentError) {
        if (insertPaymentError.code === "23505") {
          console.log(
            "Payment creado simultáneamente. Actualizando registro existente..."
          );

          const { error: retryUpdateError } =
            await supabaseAdmin
              .from("payments")
              .update(paymentData)
              .eq("offer_id", offerId);

          if (retryUpdateError) {
            console.error(
              "Error actualizando payment después del duplicado:",
              retryUpdateError
            );

            return NextResponse.json(
              {
                error: `Stripe confirmó el pago, pero RELYDO no pudo actualizar el payment existente: ${retryUpdateError.message}`,
              },
              { status: 500 }
            );
          }
        } else {
          console.error(
            "Error creando payment:",
            insertPaymentError
          );

          return NextResponse.json(
            {
              error: `Stripe confirmó el pago, pero RELYDO no pudo crear payments: ${insertPaymentError.message}`,
            },
            { status: 500 }
          );
        }
      }
    }

    // ======================================================
    // 8. SELECCIONAR LA OFERTA PAGADA
    // ======================================================

    const { error: selectedOfferError } =
      await supabaseAdmin
        .from("offers")
        .update({
          status: "selected",
        })
        .eq("id", offerId);

    if (selectedOfferError) {
      console.error(
        "Error seleccionando oferta:",
        selectedOfferError
      );

      return NextResponse.json(
        {
          error: `No pudimos seleccionar la oferta: ${selectedOfferError.message}`,
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 9. RECHAZAR LAS OTRAS OFERTAS
    // ======================================================

    const { error: rejectedOffersError } =
      await supabaseAdmin
        .from("offers")
        .update({
          status: "rejected",
        })
        .eq("request_id", requestId)
        .neq("id", offerId);

    if (rejectedOffersError) {
      console.error(
        "Error rechazando otras ofertas:",
        rejectedOffersError
      );
    }

    // ======================================================
    // 10. PONER EL TRABAJO EN PROGRESO
    // ======================================================

    const { error: updateRequestError } =
      await supabaseAdmin
        .from("service_requests")
        .update({
          status: "in_progress",
          preferred_provider_id:
            offer.professional_id,
        })
        .eq("id", requestId);

    if (updateRequestError) {
      console.error(
        "Error actualizando solicitud:",
        updateRequestError
      );

      return NextResponse.json(
        {
          error: `Stripe confirmó el pago, pero no pudimos actualizar el trabajo: ${updateRequestError.message}`,
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 11. TODO CORRECTO
    //
    // IMPORTANTE:
    // AQUÍ YA NO EXISTE stripe.transfers.create().
    // ======================================================

    console.log("======================================");
    console.log("PAGO CONFIRMADO Y RETENIDO EN RELYDO");
    console.log("Request:", requestId);
    console.log("Offer:", offerId);
    console.log("Cliente pagó:", customerTotalAmount);
    console.log("Neto futuro del profesional:", providerNetAmount);
    console.log("NO SE HA CREADO TRANSFERENCIA AL PROFESIONAL");
    console.log("======================================");

    return NextResponse.json({
      success: true,
      paymentConfirmed: true,
      fundsReleasedToProvider: false,

      requestId,
      offerId,

      professionalId:
        offer.professional_id,

      paymentStatus:
        session.payment_status,

      amounts: {
        jobAmount,
        customerFeeAmount,
        customerTotalAmount,
        providerCommissionAmount,
        providerNetAmount,
        platformRevenueAmount,
      },
    });
  } catch (error) {
    console.error(
      "Error verificando pago:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo verificar el pago.",
      },
      { status: 500 }
    );
  }
}