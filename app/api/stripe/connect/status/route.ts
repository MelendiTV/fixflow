import { NextRequest, NextResponse } from "next/server";
import Stripe from "stripe";
import { createClient } from "@supabase/supabase-js";

const stripe = new Stripe(
  process.env.STRIPE_SECRET_KEY!
);

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

export async function GET(
  request: NextRequest
) {
  try {
    // ======================================================
    // 1. OBTENER SESIÓN DEL PROFESIONAL
    // ======================================================

    const authorization =
      request.headers.get("authorization");

    if (
      !authorization ||
      !authorization.startsWith("Bearer ")
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos una sesión válida.",
        },
        {
          status: 401,
        }
      );
    }

    const accessToken =
      authorization.replace(
        "Bearer ",
        ""
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseAdmin.auth.getUser(
        accessToken
      );

    if (
      userError ||
      !user
    ) {
      return NextResponse.json(
        {
          error:
            "Tu sesión no es válida o expiró.",
        },
        {
          status: 401,
        }
      );
    }

    // ======================================================
    // 2. BUSCAR PERFIL PROFESIONAL
    // ======================================================

    const {
      data: providerProfile,
      error: providerError,
    } = await supabaseAdmin
      .from("provider_profiles")
      .select(`
        user_id,
        stripe_account_id
      `)
      .eq(
        "user_id",
        user.id
      )
      .maybeSingle();

    if (
      providerError
    ) {
      return NextResponse.json(
        {
          error:
            providerError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (
      !providerProfile
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos tu perfil profesional.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      !providerProfile.stripe_account_id
    ) {
      return NextResponse.json({
        success: true,

        connected: false,

        onboardingComplete:
          false,

        chargesEnabled:
          false,

        payoutsEnabled:
          false,

        detailsSubmitted:
          false,

        transfersCapability:
          null,

        disabledReason:
          null,

        currentlyDue: [],

        eventuallyDue: [],

        pastDue: [],

        pendingVerification: [],

        requirementErrors: [],

        futureCurrentlyDue: [],

        futureEventuallyDue: [],

        futurePastDue: [],

        futurePendingVerification: [],
      });
    }

    // ======================================================
    // 3. CONSULTAR DIRECTAMENTE A STRIPE
    // ======================================================

    const account =
      await stripe.accounts.retrieve(
        providerProfile.stripe_account_id
      );

    const chargesEnabled =
      account.charges_enabled === true;

    const payoutsEnabled =
      account.payouts_enabled === true;

    const detailsSubmitted =
      account.details_submitted === true;

    const transfersCapability =
      account.capabilities?.transfers ||
      null;

    // ======================================================
    // 4. REQUISITOS ACTUALES
    // ======================================================

    const currentlyDue =
      account.requirements?.currently_due ||
      [];

    const eventuallyDue =
      account.requirements?.eventually_due ||
      [];

    const pastDue =
      account.requirements?.past_due ||
      [];

    const pendingVerification =
      account.requirements?.pending_verification ||
      [];

    const disabledReason =
      account.requirements?.disabled_reason ||
      null;

    const requirementErrors =
      account.requirements?.errors ||
      [];

    // ======================================================
    // 5. REQUISITOS FUTUROS
    // ======================================================

    const futureCurrentlyDue =
      account.future_requirements?.currently_due ||
      [];

    const futureEventuallyDue =
      account.future_requirements?.eventually_due ||
      [];

    const futurePastDue =
      account.future_requirements?.past_due ||
      [];

    const futurePendingVerification =
      account.future_requirements?.pending_verification ||
      [];

    // ======================================================
    // 6. DEFINIR SI ONBOARDING ESTÁ COMPLETO
    // ======================================================

    const onboardingComplete =
      detailsSubmitted === true &&
      currentlyDue.length === 0 &&
      pastDue.length === 0 &&
      pendingVerification.length === 0;

    // ======================================================
    // 7. ACTUALIZAR SUPABASE
    // ======================================================

    const {
      error: updateError,
    } = await supabaseAdmin
      .from("provider_profiles")
      .update({
        stripe_onboarding_complete:
          onboardingComplete,

        stripe_charges_enabled:
          chargesEnabled,

        stripe_payouts_enabled:
          payoutsEnabled,
      })
      .eq(
        "user_id",
        user.id
      );

    if (
      updateError
    ) {
      return NextResponse.json(
        {
          error:
            `Stripe respondió correctamente, pero no pudimos actualizar FixFlow: ${updateError.message}`,
        },
        {
          status: 500,
        }
      );
    }

    // ======================================================
    // 8. MOSTRAR TODO EL DIAGNÓSTICO
    // ======================================================

    console.log(
      "=========================================="
    );

    console.log(
      "DIAGNÓSTICO STRIPE CONNECT"
    );

    console.log(
      "Cuenta:",
      account.id
    );

    console.log(
      "details_submitted:",
      detailsSubmitted
    );

    console.log(
      "charges_enabled:",
      chargesEnabled
    );

    console.log(
      "payouts_enabled:",
      payoutsEnabled
    );

    console.log(
      "transfers capability:",
      transfersCapability
    );

    console.log(
      "disabled_reason:",
      disabledReason
    );

    console.log(
      "currently_due:",
      currentlyDue
    );

    console.log(
      "eventually_due:",
      eventuallyDue
    );

    console.log(
      "past_due:",
      pastDue
    );

    console.log(
      "pending_verification:",
      pendingVerification
    );

    console.log(
      "requirements.errors:",
      requirementErrors
    );

    console.log(
      "future currently_due:",
      futureCurrentlyDue
    );

    console.log(
      "future eventually_due:",
      futureEventuallyDue
    );

    console.log(
      "future past_due:",
      futurePastDue
    );

    console.log(
      "future pending_verification:",
      futurePendingVerification
    );

    console.log(
      "=========================================="
    );

    // ======================================================
    // 9. DEVOLVER DIAGNÓSTICO A FIXFLOW
    // ======================================================

    return NextResponse.json({
      success: true,

      connected: true,

      stripeAccountId:
        account.id,

      onboardingComplete,

      chargesEnabled,

      payoutsEnabled,

      detailsSubmitted,

      transfersCapability,

      disabledReason,

      currentlyDue,

      eventuallyDue,

      pastDue,

      pendingVerification,

      requirementErrors,

      futureCurrentlyDue,

      futureEventuallyDue,

      futurePastDue,

      futurePendingVerification,
    });
  } catch (error) {
    console.error(
      "Error consultando estado Stripe:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No pudimos consultar el estado de Stripe.",
      },
      {
        status: 500,
      }
    );
  }
}