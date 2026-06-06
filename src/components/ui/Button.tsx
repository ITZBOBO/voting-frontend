import { ReactNode, AnchorHTMLAttributes, ButtonHTMLAttributes } from "react";
import Link from "next/link";

type ButtonOrLinkProps = {
  variant?: "primary" | "secondary" | "disabled";
  children: ReactNode;
  className?: string;
  href?: string;
} & Partial<ButtonHTMLAttributes<HTMLButtonElement>> & Partial<AnchorHTMLAttributes<HTMLAnchorElement>>;

export function Button({ variant = "primary", children, className = "", href, ...props }: ButtonOrLinkProps) {
  const baseStyle = "inline-flex items-center justify-center font-semibold transition-all duration-150 outline-none text-center";
  
  let variantStyle = "";
  if (variant === "primary") {
    variantStyle = "bg-[#2563eb] hover:bg-[#1d4ed8] text-white rounded-[8px] text-[13px] py-2 px-4 shadow-sm";
  } else if (variant === "secondary") {
    variantStyle = "bg-[#eff6ff] border border-[#bfdbfe] text-[#2563eb] rounded-[7px] text-[12.5px] py-2 px-4 shadow-sm hover:bg-[#dbeafe]";
  } else if (variant === "disabled") {
    variantStyle = "bg-[#f8fafc] text-[#64748b] border border-[#e8eaf0] rounded-[8px] text-[13px] py-2 px-4 cursor-not-allowed";
  }

  const combinedClass = `${baseStyle} ${variantStyle} ${className}`;

  if (href && variant !== "disabled") {
    return (
      <Link href={href} className={combinedClass} {...(props as any)}>
        {children}
      </Link>
    );
  }

  return (
    <button
      className={combinedClass}
      disabled={variant === "disabled" || props.disabled}
      {...(props as any)}
    >
      {children}
    </button>
  );
}
