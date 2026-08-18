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

    const {
      requestId,
      offerId,
      serviceTitle,
      professionalName,
    } = body;

    // ======================================================
    // 1. VALIDAR DATOS BÁSICOS
    // ======================================================

    if (!requestId || !offerId) {
      return NextResponse.json(
        {
          error: "Faltan datos de la solicitud o de la oferta.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 2. BUSCAR LA OFERTA REAL EN SUPABASE
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
          error: "No encontramos la oferta seleccionada.",
        },
        { status: 404 }
      );
    }

    // ======================================================
    // 3. VALIDAR PRECIO DE LA OFERTA
    // ======================================================

    const professionalPrice = redondearDinero(
      Number(offer.price)
    );

    if (
      !Number.isFinite(professionalPrice) ||
      professionalPrice <= 0
    ) {
      return NextResponse.json(
        {
          error: "El precio de la oferta no es válido.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 4. BUSCAR CONFIGURACIÓN ACTIVA DE PAGOS
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
          error:
            `No pudimos cargar la configuración de pagos: ${settingsError.message}`,
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
    // 5. CALCULAR COMISIONES EN EL SERVIDOR
    // ======================================================

    const customerFeePercent = Number(
      paymentSettings.customer_service_fee_percent || 0
    );

    const providerCommissionPercent = Number(
      paymentSettings.provider_commission_percent || 0
    );

    if (
      !Number.isFinite(customerFeePercent) ||
      customerFeePercent < 0 ||
      !Number.isFinite(providerCommissionPercent) ||
      providerCommissionPercent < 0
    ) {
      return NextResponse.json(
        {
          error:
            "La configuración de comisiones de RELYDO no es válida.",
        },
        { status: 500 }
      );
    }

    // Comisión que paga el CLIENTE
    const serviceFee = redondearDinero(
      professionalPrice * (customerFeePercent / 100)
    );

    // Total que paga el CLIENTE
    const total = redondearDinero(
      professionalPrice + serviceFee
    );

    // Comisión que se descontará al PROFESIONAL
    const providerCommissionAmount = redondearDinero(
      professionalPrice *
        (providerCommissionPercent / 100)
    );

    // Neto futuro del profesional
    const providerNetAmount = redondearDinero(
      professionalPrice - providerCommissionAmount
    );

    // Ganancia total de RELYDO
    const platformRevenueAmount = redondearDinero(
      serviceFee + providerCommissionAmount
    );

    // ======================================================
    // 6. CONVERTIR TOTAL A CENTAVOS PARA STRIPE
    // ======================================================

    const amountInCents = Math.round(total * 100);

    if (amountInCents <= 0) {
      return NextResponse.json(
        {
          error: "El importe final del pago no es válido.",
        },
        { status: 400 }
      );
    }

    // ======================================================
    // 7. DETERMINAR URL DE REGRESO
    // ======================================================

    const origin =
      request.headers.get("origin") ||
      "http://localhost:3000";

    // ======================================================
    // 8. CREAR CHECKOUT SESSION EN STRIPE
    // ======================================================

    const session =
      await stripe.checkout.sessions.create({
        mode: "payment",

        payment_method_types: ["card"],

        line_items: [
          {
            price_data: {
              currency:
                paymentSettings.currency?.toLowerCase() ||
                "usd",

              product_data: {
                name:
                  serviceTitle ||
                  "Servicio RELYDO",

                description: professionalName
                  ? `Servicio realizado por ${professionalName}`
                  : "Servicio contratado mediante FixFlow",
              },

              unit_amount: amountInCents,
            },

            quantity: 1,
          },
        ],

        metadata: {
          request_id: String(requestId),

          offer_id: String(offerId),

          professional_id: String(
            offer.professional_id
          ),

          professional_price:
            professionalPrice.toFixed(2),

          customer_fee_percent:
            customerFeePercent.toFixed(2),

          service_fee:
            serviceFee.toFixed(2),

          customer_total:
            total.toFixed(2),

          provider_commission_percent:
            providerCommissionPercent.toFixed(2),

          provider_commission_amount:
            providerCommissionAmount.toFixed(2),

          provider_net_amount:
            providerNetAmount.toFixed(2),

          platform_revenue_amount:
            platformRevenueAmount.toFixed(2),
        },

        success_url:
          `${origin}/checkout/${requestId}` +
          `?offer=${offerId}` +
          `&payment=success` +
          `&session_id={CHECKOUT_SESSION_ID}`,

        cancel_url:
          `${origin}/checkout/${requestId}` +
          `?offer=${offerId}` +
          `&payment=cancelled`,
      });

    // ======================================================
    // 9. CONFIRMAR QUE STRIPE DEVOLVIÓ URL
    // ======================================================

    if (!session.url) {
      return NextResponse.json(
        {
          error:
            "Stripe no devolvió una URL de pago.",
        },
        { status: 500 }
      );
    }

    // ======================================================
    // 10. RESPUESTA AL FRONTEND
    // ======================================================

    return NextResponse.json({
      success: true,

      url: session.url,

      amounts: {
        professionalPrice,
        customerFeePercent,
        serviceFee,
        total,

        providerCommissionPercent,
        providerCommissionAmount,
        providerNetAmount,

        platformRevenueAmount,
      },
    });
  } catch (error) {
    console.error(
      "Error creando Stripe Checkout:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo crear la sesión de pago.",
      },
      { status: 500 }
    );
  }
}