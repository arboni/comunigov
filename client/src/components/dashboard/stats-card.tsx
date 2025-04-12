import { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Card } from "@/components/ui/card";

interface StatsCardProps {
  title: string;
  value: string;
  icon: ReactNode;
  color: "primary" | "secondary" | "accent" | "warning" | "success" | "error";
  linkText?: string;
  linkHref?: string;
}

export default function StatsCard({
  title,
  value,
  icon,
  color,
  linkText,
  linkHref,
}: StatsCardProps) {
  const colorClasses = {
    primary: {
      bg: "bg-primary-100",
      text: "text-primary",
      link: "text-primary hover:text-primary-600",
    },
    secondary: {
      bg: "bg-secondary-100",
      text: "text-secondary-500",
      link: "text-primary hover:text-primary-600",
    },
    accent: {
      bg: "bg-accent-100",
      text: "text-accent-500",
      link: "text-primary hover:text-primary-600",
    },
    warning: {
      bg: "bg-amber-100",
      text: "text-amber-500",
      link: "text-primary hover:text-primary-600",
    },
    success: {
      bg: "bg-emerald-100",
      text: "text-emerald-500",
      link: "text-primary hover:text-primary-600",
    },
    error: {
      bg: "bg-red-100",
      text: "text-red-500",
      link: "text-primary hover:text-primary-600",
    },
  };

  return (
    <Card className="overflow-hidden">
      <div className="px-4 py-5 sm:p-6">
        <div className="flex items-center">
          <div className={cn("flex-shrink-0 rounded-md p-3", colorClasses[color].bg)}>
            <div className={cn("h-5 w-5", colorClasses[color].text)}>{icon}</div>
          </div>
          <div className="ml-5 w-0 flex-1">
            <dl>
              <dt className="text-sm font-medium text-neutral-500 truncate">{title}</dt>
              <dd>
                <div className="text-lg font-semibold text-neutral-800">{value}</div>
              </dd>
            </dl>
          </div>
        </div>
      </div>
      {linkText && linkHref && (
        <div className="bg-neutral-50 px-4 py-4 sm:px-6">
          <div className="text-sm">
            <a href={linkHref} className={cn("font-medium", colorClasses[color].link)}>
              {linkText}
              <span className="sr-only"> {title.toLowerCase()}</span>
            </a>
          </div>
        </div>
      )}
    </Card>
  );
}
