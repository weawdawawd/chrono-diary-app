import { Capacitor } from "@capacitor/core";
import { BackgroundGeolocationPlugin } from "@capacitor-community/background-geolocation";
import { registerPlugin } from "@capacitor/core";

const BackgroundGeolocation =
  registerPlugin<BackgroundGeolocationPlugin>("BackgroundGeolocation");

export const isNative = () => Capacitor.isNativePlatform();

export type LocCallback = (loc: { lat: number; lng: number; accuracy: number }) => void;

/**
 * Startet natives Background-Tracking (iOS/Android) wenn die App in Capacitor
 * läuft. Liefert eine Watcher-ID zurück, die zum Stoppen verwendet wird.
 * Auf dem Web liefert es null – dort übernimmt watchPosition.
 */
export async function startNativeBackgroundLocation(cb: LocCallback): Promise<string | null> {
  if (!isNative()) return null;
  try {
    const id = await BackgroundGeolocation.addWatcher(
      {
        backgroundMessage: "Live-Standort wird an deinen Admin gesendet",
        backgroundTitle: "Schicht aktiv",
        requestPermissions: true,
        stale: false,
        distanceFilter: 25,
      },
      (location, error) => {
        if (error) {
          if (error.code === "NOT_AUTHORIZED") {
            BackgroundGeolocation.openSettings();
          }
          console.error("[native-loc] error", error);
          return;
        }
        if (!location) return;
        cb({
          lat: location.latitude,
          lng: location.longitude,
          accuracy: location.accuracy,
        });
      }
    );
    console.info("[native-loc] watcher started", id);
    return id;
  } catch (err) {
    console.error("[native-loc] failed to start watcher", err);
    return null;
  }
}

export async function stopNativeBackgroundLocation(id: string | null) {
  if (!id || !isNative()) return;
  try {
    await BackgroundGeolocation.removeWatcher({ id });
    console.info("[native-loc] watcher stopped", id);
  } catch (err) {
    console.error("[native-loc] failed to stop watcher", err);
  }
}
