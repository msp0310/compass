import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  InformationCircleIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export type ToastTone = "success" | "info" | "warning";

export type ToastMessage = {
  detail?: string;
  id: number;
  title: string;
  tone: ToastTone;
};

type ToastViewportProps = {
  onDismiss: (id: number) => void;
  toasts: ToastMessage[];
};

const toneIcon = {
  info: InformationCircleIcon,
  success: CheckCircleIcon,
  warning: ExclamationTriangleIcon,
};

/** 画面右下に通知メッセージを表示し、個別に閉じられるようにする領域です。 */
export function ToastViewport({ onDismiss, toasts }: ToastViewportProps) {
  if (toasts.length === 0) return null;

  return (
    <section
      aria-label="操作結果"
      aria-live="polite"
      className="toast-viewport"
    >
      {toasts.map((toast) => {
        const Icon = toneIcon[toast.tone];
        return (
          <article className={`toast-message ${toast.tone}`} key={toast.id}>
            <Icon />
            <div>
              <strong>{toast.title}</strong>
              {toast.detail ? <p>{toast.detail}</p> : null}
            </div>
            <button
              aria-label="通知を閉じる"
              onClick={() => onDismiss(toast.id)}
              type="button"
            >
              <XMarkIcon />
            </button>
          </article>
        );
      })}
    </section>
  );
}
