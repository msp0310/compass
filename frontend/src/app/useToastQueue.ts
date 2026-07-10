import { useCallback, useEffect, useRef, useState } from "react";
import type { ToastMessage, ToastTone } from "../components/ui/ToastViewport";

export type ToastInput = {
  detail?: string;
  title: string;
  tone?: ToastTone;
};

/**
 * 一時通知の追加、手動解除、自動解除を一つのライフサイクルにまとめます。
 * 画面コンポーネント側がタイマーやID採番を意識しないためのフックです。
 */
export function useToastQueue() {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const nextIdRef = useRef(0);
  const timeoutIdsRef = useRef<Map<number, number>>(new Map());

  const dismissToast = useCallback((id: number) => {
    const timeoutId = timeoutIdsRef.current.get(id);
    if (timeoutId != null) {
      window.clearTimeout(timeoutId);
      timeoutIdsRef.current.delete(id);
    }
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    ({ detail, title, tone = "success" }: ToastInput) => {
      const id = nextIdRef.current + 1;
      nextIdRef.current = id;
      const timeoutId = window.setTimeout(() => dismissToast(id), 3600);
      timeoutIdsRef.current.set(id, timeoutId);
      setToasts((current) => [...current, { detail, id, title, tone }].slice(-3));
    },
    [dismissToast],
  );

  useEffect(() => {
    const timeoutIds = timeoutIdsRef.current;
    return () => {
      for (const timeoutId of timeoutIds.values()) {
        window.clearTimeout(timeoutId);
      }
      timeoutIds.clear();
    };
  }, []);

  return { addToast, dismissToast, toasts };
}
