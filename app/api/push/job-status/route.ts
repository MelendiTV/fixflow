"use server";

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

type Stage =
  | "on_the_way"
  | "arrived"
  | "working";

type RequestBody = {
  requestId?: string;
  stage?: Stage;
};

const STAGE_CONFIG: Record<
  Stage,
  {
    type: string;
    title: string;
    message: string;
  }
> = {
  on_the_way: {
    type: "provider_on_the_way",
    title: "El profesional va en camino",
    message:
      "Tu profesional ya va en camino hacia la dirección del servicio.",
  },

  arrived: {
    type: "provider_arrived",
    title: "El profesional llegó",
    message:
      "Tu profesional indicó que ya llegó al lugar del servicio.",
  },

  working: {
    type: "job_started",
    title: "El trabajo comenzó",
    message:
      "Tu profesional indicó que el trabajo ya comenzó.",
  },
};

function getBearerToken(
  request: NextRequest
) {
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
    return null;
  }

  return authorization
    .slice("Bearer ".length)
    .trim();
}

export async function POST(
  request: NextRequest
) {
  try {
    /*
      1. AUTENTICAR AL PROFESIONAL
    */

    const token =
      getBearerToken(
        request
      );

    if (!token) {
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

    const {
      data: {
        user,
      },
      error:
        userError,
    } =
      await supabaseAdmin.auth.getUser(
        token
      );

    if (
      userError ||
      !user
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

    /*
      2. VALIDAR BODY
    */

    const body =
      (await request.json()) as RequestBody;

    const requestId =
      body.requestId?.trim();

    const stage =
      body.stage;

    if (
      !requestId ||
      !stage ||
      !(
        stage in
        STAGE_CONFIG
      )
    ) {
      return NextResponse.json(
        {
          error:
            "Faltan datos válidos del trabajo o de la etapa.",
        },
        {
          status: 400,
        }
      );
    }

    /*
      3. COMPROBAR QUE EL TRABAJO
         ESTÁ ASIGNADO A ESTE PROFESIONAL
         Y QUE LA ETAPA YA FUE ACTUALIZADA
    */

    const {
      data:
        trabajo,
      error:
        trabajoError,
    } =
      await supabaseAdmin
        .from(
          "service_requests"
        )
        .select(`
          id,
          title,
          customer_id,
          preferred_provider_id,
          status,
          job_stage
        `)
        .eq(
          "id",
          requestId
        )
        .maybeSingle();

    if (
      trabajoError ||
      !trabajo
    ) {
      return NextResponse.json(
        {
          error:
            "Trabajo no encontrado.",
        },
        {
          status: 404,
        }
      );
    }

    if (
      trabajo.status !==
        "in_progress" ||
      trabajo.preferred_provider_id !==
        user.id
    ) {
      return NextResponse.json(
        {
          error:
            "No tienes permiso para notificar cambios de este trabajo.",
        },
        {
          status: 403,
        }
      );
    }

    if (
      trabajo.job_stage !==
      stage
    ) {
      return NextResponse.json(
        {
          error:
            "La etapa enviada no coincide con el estado actual del trabajo.",
        },
        {
          status: 409,
        }
      );
    }

    if (
      !trabajo.customer_id
    ) {
      return NextResponse.json(
        {
          error:
            "El trabajo no tiene cliente asociado.",
        },
        {
          status: 400,
        }
      );
    }

    const config =
      STAGE_CONFIG[
        stage
      ];

    /*
      4. GUARDAR NOTIFICACIÓN INTERNA

      Esto activa Realtime en NotificationsBell,
      que es lo que produce el sonido dentro
      de RELYDO cuando el cliente tiene la web abierta.
    */

    const {
      data:
        notification,
      error:
        notificationError,
    } =
      await supabaseAdmin
        .from(
          "notifications"
        )
        .insert({
          user_id:
            trabajo.customer_id,
          type:
            config.type,
          title:
            config.title,
          message:
            config.message,
          request_id:
            trabajo.id,
          read:
            false,
        })
        .select(`
          id,
          user_id,
          type,
          title,
          message,
          request_id,
          read,
          created_at
        `)
        .single();

    if (
      notificationError
    ) {
      console.error(
        "Error guardando notificación de etapa:",
        notificationError
      );

      return NextResponse.json(
        {
          error:
            notificationError.message,
        },
        {
          status: 500,
        }
      );
    }

    /*
      5. ENVIAR PUSH A TODOS LOS
         DISPOSITIVOS DEL CLIENTE
    */

    if (
      !vapidSubject ||
      !vapidPublicKey ||
      !vapidPrivateKey
    ) {
      return NextResponse.json({
        success:
          true,
        notification,
        push: {
          sent:
            0,
          failed:
            0,
          removed:
            0,
          message:
            "La notificación interna se guardó, pero las claves VAPID no están configuradas.",
        },
      });
    }

    const {
      data:
        subscriptions,
      error:
        subscriptionsError,
    } =
      await supabaseAdmin
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

    if (
      subscriptionsError
    ) {
      console.error(
        "Error buscando dispositivos Push del cliente:",
        subscriptionsError
      );

      return NextResponse.json({
        success:
          true,
        notification,
        push: {
          sent:
            0,
          failed:
            0,
          removed:
            0,
          error:
            subscriptionsError.message,
        },
      });
    }

    if (
      !subscriptions ||
      subscriptions.length ===
        0
    ) {
      return NextResponse.json({
        success:
          true,
        notification,
        push: {
          sent:
            0,
          failed:
            0,
          removed:
            0,
          message:
            "El cliente no tiene dispositivos Push registrados.",
        },
      });
    }

    const payload =
      JSON.stringify({
        title:
          config.title,
        body:
          `${trabajo.title}: ${config.message}`,
        url:
          `/mis-solicitudes/${trabajo.id}`,
      });

    let sent =
      0;

    let failed =
      0;

    let removed =
      0;

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

        sent +=
          1;
      } catch (
        error: unknown
      ) {
        failed +=
          1;

        const pushError =
          error as {
            statusCode?: number;
            message?: string;
          };

        console.error(
          "Error enviando Push de etapa:",
          pushError
        );

        if (
          pushError.statusCode ===
            404 ||
          pushError.statusCode ===
            410
        ) {
          const {
            error:
              deleteError,
          } =
            await supabaseAdmin
              .from(
                "push_subscriptions"
              )
              .delete()
              .eq(
                "id",
                subscription.id
              );

          if (
            !deleteError
          ) {
            removed +=
              1;
          }
        }
      }
    }

    return NextResponse.json({
      success:
        true,
      notification,
      push: {
        devices:
          subscriptions.length,
        sent,
        failed,
        removed,
      },
    });
  } catch (
    error
  ) {
    console.error(
      "Error general notificando cambio de etapa:",
      error
    );

    return NextResponse.json(
      {
        error:
          error instanceof
          Error
            ? error.message
            : "No se pudo notificar el cambio de etapa.",
      },
      {
        status:
          500,
      }
    );
  }
}