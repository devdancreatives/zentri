import { useState, useEffect } from "react";
import { useMutation } from "@apollo/client/react";
import { gql } from "@apollo/client";

const SAVE_SUBSCRIPTION = gql`
  mutation SavePushSubscription(
    $endpoint: String!
    $authKey: String!
    $p256dhKey: String!
  ) {
    savePushSubscription(
      endpoint: $endpoint
      authKey: $authKey
      p256dhKey: $p256dhKey
    )
  }
`;

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding)
    .replace(/\-/g, "+")
    .replace(/_/g, "/");

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function usePushNotifications() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [subscription, setSubscription] = useState<PushSubscription | null>(
    null,
  );
  const [registration, setRegistration] =
    useState<ServiceWorkerRegistration | null>(null);
  const [savePushSubscription] = useMutation(SAVE_SUBSCRIPTION);

  useEffect(() => {
    if (
      typeof window !== "undefined" &&
      "serviceWorker" in navigator &&
      "PushManager" in window
    ) {
      // Register SW if not already (it should be by next-pwa, but we can get registration)
      navigator.serviceWorker.ready.then((reg) => {
        setRegistration(reg);
        reg.pushManager.getSubscription().then((sub) => {
          if (sub) {
            setSubscription(sub);
            setIsSubscribed(true);
          }
        });
      });
    }
  }, []);

  const subscribeToPush = async () => {
    if (!registration) {
      console.error("Service Worker not ready");
      return;
    }

    try {
      const publicVapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
      if (!publicVapidKey) {
        throw new Error("Public VAPID Key missing");
      }

      const convertedVapidKey = urlBase64ToUint8Array(publicVapidKey);

      const sub = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: convertedVapidKey,
      });

      setSubscription(sub);
      setIsSubscribed(true);

      // Send to backend
      const keys = sub.toJSON().keys;
      if (keys && keys.auth && keys.p256dh && sub.endpoint) {
        await savePushSubscription({
          variables: {
            endpoint: sub.endpoint,
            authKey: keys.auth,
            p256dhKey: keys.p256dh,
          },
        });
        console.log("Push Subscription saved to backend");
      }
    } catch (error) {
      console.error("Failed to subscribe to push", error);
      throw error;
    }
  };

  const unsubscribeFromPush = async () => {
    if (!subscription) return;

    try {
      await subscription.unsubscribe();
      setSubscription(null);
      setIsSubscribed(false);
      console.log("Unsubscribed from push");
    } catch (error) {
      console.error("Failed to unsubscribe", error);
    }
  };

  return {
    isSubscribed,
    subscribeToPush,
    unsubscribeFromPush,
    permission:
      typeof Notification !== "undefined" ? Notification.permission : "default",
  };
}
