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

const vapidSubject = process.env.VAPID_SUBJECT;
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

type PushBody = {
  userId?: string;
  title?: string;
  body?: string;
  url?: string;
};

export async function POST(
  request: NextRequest
) {
  try {
    /*
      SEGURIDAD

      Esta ruta NO se llama directamente
      desde el navegador.

      Solo otros procesos seguros de FixFlow
      podrán utilizarla.
    */

    const secret =
      request.headers.get(
        "x-fixflow-secret"
      );

    if (
      !process.env.FIXFLOW_CRON_SECRET ||
      secret !==
        process.env.FIXFLOW_CRON_SECRET
    ) {
      return NextResponse.json(
        {
          error:
            "No autorizado.",
        },
        {
          status: 401,
        }
      );
    }

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

    const data =
      (await request.json()) as PushBody;

    const userId =
      data.userId?.trim();

    const title =
      data.title?.trim() ||
      "FixFlow";

    const body =
      data.body?.trim() ||
      "Tienes una nueva notificación.";

    const url =
      data.url?.trim() ||
      "/";

    if (!userId) {
      return NextResponse.json(
        {
          error:
            "Falta userId.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      BUSCAR TODOS LOS DISPOSITIVOS
      DEL USUARIO

      Ejemplo:
      - Chrome laptop
      - Edge laptop
      - iPhone futuro
    */

    const {
      data: subscriptions,
      error: subscriptionError,
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
        userId
      );

    if (subscriptionError) {
      console.error(
        "Error buscando suscripciones Push:",
        subscriptionError
      );

      return NextResponse.json(
        {
          error:
            subscriptionError.message,
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
        sent: 0,
        message:
          "El usuario no tiene dispositivos Push registrados.",
      });
    }

    const payload =
      JSON.stringify({
        title,
        body,
        url,
      });

    let enviados = 0;
    let eliminados = 0;
    let fallidos = 0;

    /*
      ENVIAR A TODOS LOS DISPOSITIVOS
    */

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
          "Error enviando Push:",
          pushError
        );

        /*
          404 / 410 =
          suscripción vencida o eliminada.

          La borramos para no seguir
          intentando enviarla.
        */

        if (
          pushError.statusCode === 404 ||
          pushError.statusCode === 410
        ) {
          const {
            error: deleteError,
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
      devices:
        subscriptions.length,
      sent: enviados,
      failed: fallidos,
      removed: eliminados,
    });
  } catch (error) {
    console.error(
      "Error general enviando Push:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "No se pudo enviar la notificación Push.",
      },
      {
        status: 500,
      }
    );
  }
}