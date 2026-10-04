interface FormAlertProps {
  variant: "error" | "success";
  children: React.ReactNode;
}

const styles = {
  error:
    "border-error-200 bg-error-50 text-error-700 dark:border-error-800 dark:bg-error-900/20 dark:text-error-400",
  success:
    "border-success-200 bg-success-50 text-success-700 dark:border-success-800 dark:bg-success-900/20 dark:text-success-400",
};

export default function FormAlert({ variant, children }: FormAlertProps) {
  return (
    <div role={variant === "error" ? "alert" : "status"} className={`rounded-lg border px-4 py-3 text-sm ${styles[variant]}`}>
      {children}
    </div>
  );
}
