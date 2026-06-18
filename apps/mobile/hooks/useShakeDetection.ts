/**
 * hooks/useShakeDetection.ts
 * Detects device shake via expo-sensors Accelerometer.
 * Triggers `onShake` when magnitude exceeds the threshold (default 2.3g).
 */

import { useEffect, useRef, useCallback } from "react";
import { Accelerometer } from "expo-sensors";
import { Platform } from "react-native";

const SHAKE_THRESHOLD = 2.3; // g-force
const COOLDOWN_MS = 3000; // prevent repeated triggers

interface Options {
  onShake: () => void;
  threshold?: number;
  enabled?: boolean;
}

export function useShakeDetection({
  onShake,
  threshold = SHAKE_THRESHOLD,
  enabled = true,
}: Options) {
  const lastShakeRef = useRef<number>(0);
  const subscriptionRef = useRef<ReturnType<
    typeof Accelerometer.addListener
  > | null>(null);

  const handleAccelerometer = useCallback(
    ({ x, y, z }: { x: number; y: number; z: number }) => {
      const magnitude = Math.sqrt(x * x + y * y + z * z);
      const now = Date.now();

      if (
        magnitude > threshold &&
        now - lastShakeRef.current > COOLDOWN_MS
      ) {
        lastShakeRef.current = now;
        onShake();
      }
    },
    [threshold, onShake]
  );

  useEffect(() => {
    // Shake detection is mobile-only
    if (Platform.OS === "web" || !enabled) return;

    Accelerometer.setUpdateInterval(200); // 5 Hz
    subscriptionRef.current = Accelerometer.addListener(handleAccelerometer);

    return () => {
      subscriptionRef.current?.remove();
      subscriptionRef.current = null;
    };
  }, [handleAccelerometer, enabled]);
}
