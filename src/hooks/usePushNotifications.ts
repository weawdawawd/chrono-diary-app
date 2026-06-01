import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Capacitor } from "@capacitor/core";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/**
 * Push notifications via @capacitor/push-notifications (FCM on Android).
 *
 * IMPORTANT FIREBASE SETUP:
 * 1. Place your Firebase `google-services.json` into `android/app/`.
 * 2. Add the FCM service account JSON as a Supabase secret named
 *    `FCM_SERVICE_ACCOUNT_KEY` (used by the `send-push-notification` edge function).
 *
 * Only runs on native platforms; on web it is a no-op.
 */
export function usePushNotifications(userId: string | null | undefined) {
  const navigate = useNavigate();

  useEffect(() => {
    if (!userId) return;
    if (!Capacitor.isNativePlatform()) return;

    let cleanup: (() => void) | undefined;

    (async () => {
      const { PushNotifications } = await import("@capacitor/push-notifications");

      let perm = await PushNotifications.checkPermissions();
      if (perm.receive === "prompt" || perm.receive === "prompt-with-rationale") {
        perm = await PushNotifications.requestPermissions();
      }
      if (perm.receive !== "granted") return;

      await PushNotifications.register();

      const regHandle = await PushNotifications.addListener("registration", async (token) => {
        try {
          await supabase.from("device_tokens").upsert(
            {
              user_id: userId,
              token: token.value,
              platform: Capacitor.getPlatform(),
            },
            { onConflict: "user_id,token" }
          );
        } catch (e) {
          console.error("Failed to save device token", e);
        }
      });

      const errHandle = await PushNotifications.addListener("registrationError", (err) => {
        console.error("Push registration error", err);
      });

      const recvHandle = await PushNotifications.addListener(
        "pushNotificationReceived",
        (notif) => {
          toast(notif.title || "Notification", { description: notif.body });
        }
      );

      const actionHandle = await PushNotifications.addListener(
        "pushNotificationActionPerformed",
        (action) => {
          const route = (action.notification.data as any)?.route;
          if (route && typeof route === "string") navigate(route);
        }
      );

      cleanup = () => {
        regHandle.remove();
        errHandle.remove();
        recvHandle.remove();
        actionHandle.remove();
      };
    })();

    return () => cleanup?.();
  }, [userId, navigate]);
}
