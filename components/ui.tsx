import { ReactNode } from "react";

export function Card({ children }: { children: ReactNode }) {
  return <div className="rounded-lg shadow">{children}</div>;
}

export function CardBody({
  children,
  className = ""
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={`p-5 ${className}`}>{children}</div>;
}

export function Button(
  props: React.ButtonHTMLAttributes<HTMLButtonElement>
) {
  const base =
    "inline-flex items-center justify-center rounded-lg px-4 py-2 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2";
  return (
    <button {...props} className={`${base} bg-vaa-gold text-vaa-ink hover:brightness-110 disabled:opacity-50 ${props.className || ""}`} />
  );
}

export function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  const base =
    "w-full rounded-lg border px-3 py-2 focus:outline-none focus:ring-2 focus:ring-offset-2 transparent-bg-input";
  return <input {...props} className={`${base} ${props.className || ""}`} />;
}

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement>
) {
  const base =
    "transparent-bg-input";
  return <textarea {...props} className={`${base} ${props.className || ""}`} />;
}
