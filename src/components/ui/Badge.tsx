import { ReactNode } from "react";

export type BadgeStatus = "OPEN" | "CLOSED" | "DRAFT";

interface BadgeProps {
  status: BadgeStatus;
  children?: ReactNode;
  className?: string;
}

export function Badge({ status, children, className = "" }: BadgeProps) {
  const baseStyle = "inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold tracking-wide uppercase border";
  
  let statusStyle = "";
  let dotColor = "";
  let label = children;

  if (status === "OPEN") {
    statusStyle = "bg-[#ECFDF5] border-[#A7F3D0] text-[#10B981]";
    dotColor = "bg-[#10B981]";
    if (!label) label = "Active";
  } else if (status === "CLOSED") {
    statusStyle = "bg-[#fffbeb] border-[#fef3c7] text-[#d97706]";
    dotColor = "bg-[#f59e0b]";
    if (!label) label = "Completed";
  } else if (status === "DRAFT") {
    statusStyle = "bg-[#f8fafc] border-[#f1f5f9] text-[#64748b]";
    dotColor = "bg-[#94a3b8]";
    if (!label) label = "Upcoming";
  }

  return (
    <span className={`${baseStyle} ${statusStyle} ${className}`}>
      {status === "OPEN" ? (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor} animate-pulse`} />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
      )}
      {label}
    </span>
  );
}
