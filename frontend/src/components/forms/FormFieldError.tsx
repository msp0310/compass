import * as styles from "./FormFieldError.css";

type FormFieldErrorProps = {
  errors: unknown[];
  show?: boolean;
};

/** TanStack FormとStandard Schemaのエラーを共通表示へ正規化します。 */
export function FormFieldError({ errors, show = true }: FormFieldErrorProps) {
  const messages = errors.flatMap(toMessages);
  if (!show || messages.length === 0) {
    return null;
  }
  return (
    <small aria-live="polite" className={styles.fieldError} role="alert">
      {messages.join(" / ")}
    </small>
  );
}

function toMessages(error: unknown): string[] {
  if (typeof error === "string") {
    return [error];
  }
  if (Array.isArray(error)) {
    return error.flatMap(toMessages);
  }
  if (error && typeof error === "object" && "message" in error) {
    return [String(error.message)];
  }
  return [];
}
