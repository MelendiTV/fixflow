import {
  NextRequest,
  NextResponse,
} from "next/server";

import Stripe from "stripe";

import {
  createClient,
} from "@supabase/supabase-js";

const stripe =
  new Stripe(
    process.env.STRIPE_SECRET_KEY!
  );

const supabaseAdmin =
  createClient(
    process.env
      .NEXT_PUBLIC_SUPABASE_URL!,
    process.env
      .SUPABASE_SECRET_KEY!,
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );

function dinero(
  valor: number
) {
  return (
    Math.round(
      (valor +
        Number.EPSILON) *
        100
    ) / 100
  );
}

export async function POST(
  request: NextRequest
) {
  try {
    // ======================================================
    // 1. RECIBIR SESSION ID
    // ======================================================

    const body =
      await request.json();

    const sessionId =
      String(
        body?.sessionId ||
          ""
      ).trim();

    if (!sessionId) {
      return NextResponse.json(
        {
          error:
            "Falta el ID de la sesión de Stripe.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // 2. CONSULTAR STRIPE
    // ======================================================

    const session =
      await stripe
        .checkout
        .sessions
        .retrieve(
          sessionId,
          {
            expand: [
              "payment_intent",
            ],
          }
        );

    if (
      session.payment_status !==
      "paid"
    ) {
      return NextResponse.json(
        {
          error:
            "Stripe todavía no confirma el pago adicional.",
          paymentStatus:
            session.payment_status,
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // 3. VALIDAR QUE SEA UN CHANGE ORDER
    // ======================================================

    if (
      session.metadata
        ?.payment_type !==
      "change_order"
    ) {
      return NextResponse.json(
        {
          error:
            "Esta sesión de Stripe no corresponde a un cambio de presupuesto.",
        },
        {
          status: 400,
        }
      );
    }

    const changeOrderId =
      session.metadata
        ?.change_order_id;

    const requestId =
      session.metadata
        ?.request_id;

    const customerId =
      session.metadata
        ?.customer_id;

    const providerId =
      session.metadata
        ?.provider_id;

    if (
      !changeOrderId ||
      !requestId ||
      !customerId ||
      !providerId
    ) {
      return NextResponse.json(
        {
          error:
            "La sesión de Stripe no contiene todos los datos del cambio de presupuesto.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // 4. BUSCAR CHANGE ORDER
    // ======================================================

    const {
      data:
        changeOrder,
      error:
        changeOrderError,
    } =
      await supabaseAdmin
        .from(
          "change_orders"
        )
        .select(`
          id,
          request_id,
          provider_id,
          customer_id,
          original_amount,
          additional_amount,
          new_total_amount,
          status,
          payment_status,
          stripe_checkout_session_id,
          stripe_payment_intent_id,
          paid_at
        `)
        .eq(
          "id",
          changeOrderId
        )
        .eq(
          "request_id",
          requestId
        )
        .maybeSingle();

    if (changeOrderError) {
      return NextResponse.json(
        {
          error:
            `No pudimos consultar el cambio de presupuesto: ${changeOrderError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    if (!changeOrder) {
      return NextResponse.json(
        {
          error:
            "No encontramos el cambio de presupuesto correspondiente.",
        },
        {
          status: 404,
        }
      );
    }

    // ======================================================
    // 5. VALIDAR CLIENTE Y PROFESIONAL
    // ======================================================

    if (
      changeOrder.customer_id !==
        customerId ||
      changeOrder.provider_id !==
        providerId
    ) {
      return NextResponse.json(
        {
          error:
            "Los participantes del pago no coinciden con el cambio de presupuesto.",
        },
        {
          status: 400,
        }
      );
    }

    if (
      changeOrder.status !==
      "accepted"
    ) {
      return NextResponse.json(
        {
          error:
            "Este cambio de presupuesto no está aceptado.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // 6. EVITAR PROCESAR DOS VECES
    // ======================================================

    if (
      changeOrder.payment_status ===
      "paid"
    ) {
      return NextResponse.json({
        success: true,
        alreadyProcessed:
          true,
        changeOrderId:
          changeOrder.id,
        requestId:
          changeOrder.request_id,
        paymentStatus:
          "paid",
      });
    }

    // ======================================================
    // 7. RECUPERAR MONTOS DESDE METADATA
    // ======================================================

    const additionalAmount =
      dinero(
        Number(
          session.metadata
            ?.additional_amount ||
            0
        )
      );

    const customerFeePercent =
      dinero(
        Number(
          session.metadata
            ?.customer_fee_percent ||
            0
        )
      );

    const customerFeeAmount =
      dinero(
        Number(
          session.metadata
            ?.customer_fee_amount ||
            0
        )
      );

    const customerTotalAmount =
      dinero(
        Number(
          session.metadata
            ?.customer_total_amount ||
            0
        )
      );

    const providerCommissionPercent =
      dinero(
        Number(
          session.metadata
            ?.provider_commission_percent ||
            0
        )
      );

    const providerCommissionAmount =
      dinero(
        Number(
          session.metadata
            ?.provider_commission_amount ||
            0
        )
      );

    const providerNetAmount =
      dinero(
        Number(
          session.metadata
            ?.provider_net_amount ||
            0
        )
      );

    const platformRevenueAmount =
      dinero(
        Number(
          session.metadata
            ?.platform_revenue_amount ||
            0
        )
      );

    // ======================================================
    // 8. COMPROBAR MONTO PAGADO EN STRIPE
    // ======================================================

    const amountTotalStripe =
      dinero(
        Number(
          session.amount_total ||
            0
        ) / 100
      );

    if (
      customerTotalAmount <=
        0 ||
      amountTotalStripe !==
        customerTotalAmount
    ) {
      return NextResponse.json(
        {
          error:
            `El monto confirmado por Stripe ($${amountTotalStripe.toFixed(
              2
            )}) no coincide con el monto esperado ($${customerTotalAmount.toFixed(
              2
            )}).`,
        },
        {
          status: 400,
        }
      );
    }

    if (
      dinero(
        Number(
          changeOrder
            .additional_amount
        )
      ) !==
      additionalAmount
    ) {
      return NextResponse.json(
        {
          error:
            "El monto adicional pagado no coincide con el Change Order.",
        },
        {
          status: 400,
        }
      );
    }

    // ======================================================
    // 9. OBTENER PAYMENT INTENT
    // ======================================================

    const paymentIntent =
      session.payment_intent;

    const paymentIntentId =
      typeof paymentIntent ===
      "string"
        ? paymentIntent
        : paymentIntent?.id ||
          null;

    if (!paymentIntentId) {
      return NextResponse.json(
        {
          error:
            "Stripe confirmó el pago pero no encontramos el Payment Intent.",
        },
        {
          status: 500,
        }
      );
    }

    // ======================================================
    // 10. GUARDAR PAGO EN CHANGE_ORDERS
    // ======================================================

    const paidAt =
      new Date().toISOString();

    const {
      data: updated,
      error:
        updateError,
    } =
      await supabaseAdmin
        .from(
          "change_orders"
        )
        .update({
          payment_status:
            "paid",

          stripe_checkout_session_id:
            session.id,

          stripe_payment_intent_id:
            paymentIntentId,

          additional_customer_fee_percent:
            customerFeePercent,

          additional_customer_fee_amount:
            customerFeeAmount,

          additional_customer_total_amount:
            customerTotalAmount,

          additional_provider_commission_percent:
            providerCommissionPercent,

          additional_provider_commission_amount:
            providerCommissionAmount,

          additional_provider_net_amount:
            providerNetAmount,

          additional_platform_revenue_amount:
            platformRevenueAmount,

          paid_at:
            paidAt,

          updated_at:
            paidAt,
        })
        .eq(
          "id",
          changeOrder.id
        )
        .neq(
          "payment_status",
          "paid"
        )
        .select(`
          id,
          request_id,
          original_amount,
          additional_amount,
          new_total_amount,
          status,
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
          paid_at
        `)
        .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error:
            `Stripe cobró correctamente, pero RELYDO no pudo guardar el pago adicional: ${updateError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    // Si otra petición lo procesó
    // justo antes, no cobramos de nuevo:
    // Stripe ya realizó el cobro una sola vez.
    if (!updated) {
      const {
        data:
          alreadyUpdated,
      } =
        await supabaseAdmin
          .from(
            "change_orders"
          )
          .select(`
            id,
            request_id,
            payment_status,
            paid_at
          `)
          .eq(
            "id",
            changeOrder.id
          )
          .maybeSingle();

      if (
        alreadyUpdated
          ?.payment_status ===
        "paid"
      ) {
        return NextResponse.json({
          success: true,
          alreadyProcessed:
            true,
          changeOrderId:
            changeOrder.id,
          requestId:
            changeOrder.request_id,
          paymentStatus:
            "paid",
        });
      }

      return NextResponse.json(
        {
          error:
            "Stripe confirmó el pago, pero no pudimos finalizar el registro del Change Order.",
        },
        {
          status: 500,
        }
      );
    }

    // ======================================================
    // 11. RESPUESTA
    // ======================================================

    return NextResponse.json({
      success: true,

      alreadyProcessed:
        false,

      changeOrderId:
        updated.id,

      requestId:
        updated.request_id,

      paymentStatus:
        updated.payment_status,

      stripePaymentIntentId:
        paymentIntentId,

      amounts: {
        additionalAmount,

        customerFeePercent,

        customerFeeAmount,

        customerTotalAmount,

        providerCommissionPercent,

        providerCommissionAmount,

        providerNetAmount,

        platformRevenueAmount,
      },
    });
  } catch (error) {
    console.error(
      "Error verificando pago de Change Order:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos verificar el pago adicional.",
      },
      {
        status: 500,
      }
    );
  }
}