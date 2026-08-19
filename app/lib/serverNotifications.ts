import { createClient } from "@supabase/supabase-js";
import webpush from "web-push";

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

export type RelydoNotificationInput = {
  userId: string;
  type: string;
  title: string;
  message: string;
  requestId?: string | null;
  url?: string | null;
};

export type RelydoNotificationResult = {
  internalNotificationSaved: boolean;
  pushDevices: number;
  pushSent: number;
  pushFailed: number;
  pushRemoved: number;
  error?: string;
};

export async function sendRelydoNotification(
  input: RelydoNotificationInput
): Promise<RelydoNotificationResult> {
  const userId =
    input.userId?.trim();

  if (!userId) {
    return {
      internalNotificationSaved: false,
      pushDevices: 0,
      pushSent: 0,
      pushFailed: 0,
      pushRemoved: 0,
      error: "Falta userId.",
    };
  }

  const result: RelydoNotificationResult = {
    internalNotificationSaved: false,
    pushDevices: 0,
    pushSent: 0,
    pushFailed: 0,
    pushRemoved: 0,
  };

  /*
    1. NOTIFICACIÓN INTERNA
  */

  const {
    error: notificationError,
  } = await supabaseAdmin
    .from("notifications")
    .insert({
      user_id: userId,
      type: input.type,
      title: input.title,
      message: input.message,
      request_id:
        input.requestId || null,
      read: false,
    });

  if (notificationError) {
    console.error(
      "RELYDO: no se pudo guardar la notificación interna:",
      notificationError
    );

    result.error =
      notificationError.message;
  } else {
    result.internalNotificationSaved =
      true;
  }

  /*
    2. PUSH DEL NAVEGADOR
  */

  if (
    !vapidSubject ||
    !vapidPublicKey ||
    !vapidPrivateKey
  ) {
    return result;
  }

  const {
    data: subscriptions,
    error: subscriptionsError,
  } = await supabaseAdmin
    .from("push_subscriptions")
    .select(`
      id,
      endpoint,
      p256dh,
      auth
    `)
    .eq("user_id", userId);

  if (subscriptionsError) {
    console.error(
      "RELYDO: no se pudieron consultar las suscripciones Push:",
      subscriptionsError
    );

    result.error =
      result.error ||
      subscriptionsError.message;

    return result;
  }

  if (
    !subscriptions ||
    subscriptions.length === 0
  ) {
    return result;
  }

  result.pushDevices =
    subscriptions.length;

  const payload =
    JSON.stringify({
      title:
        input.title || "RELYDO",
      body:
        input.message ||
        "Tienes una nueva notificación.",
      url:
        input.url ||
        (
          input.requestId
            ? `/mis-solicitudes/${input.requestId}`
            : "/"
        ),
    });

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

      result.pushSent += 1;
    } catch (error: unknown) {
      result.pushFailed += 1;

      const pushError =
        error as {
          statusCode?: number;
          message?: string;
        };

      console.error(
        "RELYDO: error enviando Push:",
        pushError
      );

      if (
        pushError.statusCode === 404 ||
        pushError.statusCode === 410
      ) {
        const {
          error: deleteError,
        } = await supabaseAdmin
          .from("push_subscriptions")
          .delete()
          .eq(
            "id",
            subscription.id
          );

        if (!deleteError) {
          result.pushRemoved += 1;
        }
      }
    }
  }

  return result;
}