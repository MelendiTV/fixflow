import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const runtime = "nodejs";

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

type Body = {
  requestId?: string;
  offerId?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    const authorization =
      request.headers.get(
        "authorization"
      );

    if (
      !authorization ||
      !authorization.startsWith(
        "Bearer "
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Sesión no válida.",
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

    const supabaseUser =
      createClient(
        process.env
          .NEXT_PUBLIC_SUPABASE_URL!,
        process.env
          .NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
        {
          global: {
            headers: {
              Authorization:
                `Bearer ${accessToken}`,
            },
          },
          auth: {
            persistSession: false,
            autoRefreshToken: false,
          },
        }
      );

    const {
      data: { user },
      error: userError,
    } =
      await supabaseUser.auth.getUser();

    if (
      userError ||
      !user
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

    const body =
      (await request.json()) as Body;

    const requestId =
      body.requestId?.trim();

    const offerId =
      body.offerId?.trim();

    if (
      !requestId ||
      !offerId
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan requestId u offerId.",
        },
        {
          status: 400,
        }
      );
    }

    const {
      data: serviceRequest,
      error: requestError,
    } = await supabaseAdmin
      .from("service_requests")
      .select(`
        id,
        customer_id,
        status
      `)
      .eq(
        "id",
        requestId
      )
      .maybeSingle();

    if (
      requestError ||
      !serviceRequest
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos la solicitud.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      serviceRequest.customer_id !==
      user.id
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para modificar esta solicitud.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      serviceRequest.status !==
      "open"
    ) {
      return NextResponse.json(
        {
          error:
            "La solicitud ya no está abierta.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: offer,
      error: offerError,
    } = await supabaseAdmin
      .from("offers")
      .select(`
        id,
        request_id,
        professional_id,
        status
      `)
      .eq(
        "id",
        offerId
      )
      .eq(
        "request_id",
        requestId
      )
      .maybeSingle();

    if (
      offerError ||
      !offer
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos este presupuesto.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      offer.status !==
      "pending"
    ) {
      return NextResponse.json(
        {
          error:
            "Este presupuesto ya no está disponible.",
        },
        {
          status: 409,
        }
      );
    }

    const {
      data: updatedOffer,
      error: updateError,
    } = await supabaseAdmin
      .from("offers")
      .update({
        status: "rejected",
      })
      .eq(
        "id",
        offerId
      )
      .eq(
        "request_id",
        requestId
      )
      .eq(
        "status",
        "pending"
      )
      .select(`
        id,
        request_id,
        professional_id,
        status
      `)
      .maybeSingle();

    if (updateError) {
      return NextResponse.json(
        {
          error:
            updateError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (!updatedOffer) {
      return NextResponse.json(
        {
          error:
            "Este presupuesto ya no está disponible.",
        },
        {
          status: 409,
        }
      );
    }

    return NextResponse.json({
      success: true,
      offer: updatedOffer,
    });
  } catch (error) {
    console.error(
      "Error rechazando presupuesto:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo rechazar el presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}