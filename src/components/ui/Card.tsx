import { ReactNode } from "react";

interface CardProps {
  children: ReactNode;
  className?: string;
  hoverable?: boolean;
}

export function Card({ children, className = "", hoverable = true }: CardProps) {
  const hasBorder = className.includes("border-") || className.includes("border ");
  const borderClass = hasBorder ? "" : "border border-[#f0f2f6]";

  const hasPadding = className.includes("p-") || className.includes("px-") || className.includes("py-");
  const paddingClass = hasPadding ? "" : "p-6";

  return (
    <div
      className={`bg-white rounded-[20px] transition-all duration-300 ease-out ${borderClass} ${paddingClass} ${
        hoverable 
          ? "shadow-[0_12px_30px_-5px_rgba(12,26,58,0.08),0_4px_12px_-2px_rgba(12,26,58,0.04)] hover:shadow-[0_20px_40px_-8px_rgba(12,26,58,0.18),0_8px_20px_-4px_rgba(12,26,58,0.08)] hover:-translate-y-1.5" 
          : "shadow-[0_8px_30px_-5px_rgba(12,26,58,0.06),0_4px_12px_-2px_rgba(12,26,58,0.03)]"
      } ${className}`}
    >
      {children}
    </div>
  );
}
