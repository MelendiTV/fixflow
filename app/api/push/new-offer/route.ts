import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

const vapidSubject =
  process.env.VAPID_SUBJECT;

const vapidPublicKey =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;

const vapidPrivateKey =
  process.env.VAPID_PRIVATE_KEY;

if (
  vapidSubject &&
  vapidPublicKey &&
  vapidPrivateKey
) {
  webpush.setVapidDetails(
    vapidSubject,
    vapidPublicKey,
    vapidPrivateKey
  );
}

type Body = {
  offerId?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    if (
      !vapidSubject ||
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return NextResponse.json(
        {
          error:
            "Las claves VAPID no están configuradas.",
        },
        {
          status: 500,
        }
      );
    }

    /*
      1. VALIDAR SESIÓN DEL PROFESIONAL
    */

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

    /*
      2. LEER OFFER ID
    */

    const body =
      (await request.json()) as Body;

    const offerId =
      body.offerId?.trim();

    if (!offerId) {
      return NextResponse.json(
        {
          error:
            "Falta offerId.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      3. BUSCAR OFERTA Y VERIFICAR
         QUE PERTENECE AL PRO ACTUAL
    */

    const {
      data: oferta,
      error: ofertaError,
    } = await supabaseAdmin
      .from("offers")
      .select(`
        id,
        request_id,
        professional_id,
        price,
        status
      `)
      .eq(
        "id",
        offerId
      )
      .eq(
        "professional_id",
        user.id
      )
      .maybeSingle();

    if (
      ofertaError ||
      !oferta
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos el presupuesto o no pertenece a este profesional.",
        },
        {
          status: 404,
        }
      );
    }

    /*
      4. BUSCAR TRABAJO Y CLIENTE
    */

    const {
      data: trabajo,
      error: trabajoError,
    } = await supabaseAdmin
      .from("service_requests")
      .select(`
        id,
        title,
        customer_id,
        status
      `)
      .eq(
        "id",
        oferta.request_id
      )
      .maybeSingle();

    if (
      trabajoError ||
      !trabajo
    ) {
      return NextResponse.json(
        {
          error:
            "No encontramos el trabajo relacionado con el presupuesto.",
        },
        {
          status: 404,
        }
      );
    }

    if (!trabajo.customer_id) {
      return NextResponse.json(
        {
          success: true,
          devices: 0,
          sent: 0,
          message:
            "La orden no tiene cliente asociado.",
        }
      );
    }

    /*
      5. BUSCAR TODOS LOS DISPOSITIVOS
         PUSH DEL CLIENTE
    */

    const {
      data: subscriptions,
      error:
        subscriptionsError,
    } = await supabaseAdmin
      .from(
        "push_subscriptions"
      )
      .select(`
        id,
        endpoint,
        p256dh,
        auth
      `)
      .eq(
        "user_id",
        trabajo.customer_id
      );

    if (subscriptionsError) {
      return NextResponse.json(
        {
          error:
            subscriptionsError.message,
        },
        {
          status: 500,
        }
      );
    }

    if (
      !subscriptions ||
      subscriptions.length === 0
    ) {
      return NextResponse.json({
        success: true,
        devices: 0,
        sent: 0,
        message:
          "El cliente todavía no tiene Push activado.",
      });
    }

    /*
      6. CREAR PUSH
    */

    const precio =
      Number(
        oferta.price || 0
      ).toFixed(2);

    const payload =
      JSON.stringify({
        title:
          "💰 Nuevo presupuesto recibido",

        body:
          `${trabajo.title} · Oferta de $${precio}`,

        url:
          `/mis-solicitudes/${trabajo.id}`,
      });

    /*
      7. ENVIAR A TODOS LOS DISPOSITIVOS
         DEL CLIENTE
    */

    let enviados = 0;
    let fallidos = 0;
    let eliminados = 0;

    for (
      const subscription
      of subscriptions
    ) {
      try {
        await webpush.sendNotification(
          {
            endpoint:
              subscription.endpoint,

            keys: {
              p256dh:
                subscription.p256dh,

              auth:
                subscription.auth,
            },
          },
          payload
        );

        enviados += 1;
      } catch (error: unknown) {
        fallidos += 1;

        const pushError =
          error as {
            statusCode?: number;
            message?: string;
          };

        console.error(
          "Error Push nuevo presupuesto:",
          pushError
        );

        /*
          404 / 410:
          la suscripción ya no existe.
        */

        if (
          pushError.statusCode ===
            404 ||
          pushError.statusCode ===
            410
        ) {
          const {
            error:
              deleteError,
          } = await supabaseAdmin
            .from(
              "push_subscriptions"
            )
            .delete()
            .eq(
              "id",
              subscription.id
            );

          if (!deleteError) {
            eliminados += 1;
          }
        }
      }
    }

    return NextResponse.json({
      success: true,
      customerId:
        trabajo.customer_id,
      devices:
        subscriptions.length,
      sent:
        enviados,
      failed:
        fallidos,
      removed:
        eliminados,
    });
  } catch (error) {
    console.error(
      "Error general Push nuevo presupuesto:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar el Push del presupuesto.",
      },
      {
        status: 500,
      }
    );
  }
}