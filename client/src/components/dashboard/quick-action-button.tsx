import { ReactNode } from "react";
import { cn } from "@/lib/utils";

interface QuickActionButtonProps {
  title: string;
  icon: ReactNode;
  color: "primary" | "secondary" | "accent" | "success";
  onClick: () => void;
}

export default function QuickActionButton({
  title,
  icon,
  color,
  onClick,
}: QuickActionButtonProps) {
  const colorClasses = {
    primary: "bg-primary-100 text-primary",
    secondary: "bg-secondary-100 text-secondary-500",
    accent: "bg-accent-100 text-accent-500",
    success: "bg-emerald-100 text-emerald-500",
  };

  return (
    <button
      className="p-4 bg-white shadow rounded-lg hover:shadow-md transition-shadow flex flex-col items-center"
      onClick={onClick}
    >
      <div className={cn("w-12 h-12 rounded-full flex items-center justify-center mb-3", colorClasses[color])}>
        <div className="text-xl">{icon}</div>
      </div>
      <span className="text-sm font-medium">{title}</span>
    </button>
  );
}
