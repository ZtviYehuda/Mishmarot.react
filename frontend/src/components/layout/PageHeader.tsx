import React from "react";
import { ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";

interface PageHeaderProps {
  icon: React.ElementType;
  title: string;
  subtitle: string;
  category: string;
  categoryLink: string;
  iconClassName?: string;
  badge?: React.ReactNode;
}

export function PageHeader({
  icon: Icon,
  title,
  subtitle,
  category,
  iconClassName,
  badge,
}: PageHeaderProps) {
  return (
    <div className="flex flex-col gap-2 mb-4 sm:mb-6 lg:mb-8">
      {/* Breadcrumb style category - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">
        <span>ניהול מערכת</span>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-primary transition-colors">{category}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5 w-full sm:w-auto min-w-0">
          {/* Icon Container - Responsive Size */}
          <div
            className={cn(
              "w-8 h-8 sm:w-14 sm:h-14 rounded-lg sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted border border-border flex items-center justify-center shrink-0 shadow-sm",
              iconClassName,
            )}
          >
            <Icon className="w-4 h-4 sm:w-7 sm:h-7 text-foreground/70" />
          </div>

          <div className="text-right min-w-0 flex-1">
            <h1 className="text-lg sm:text-3xl font-black text-foreground tracking-tight mb-0.5 sm:mb-1 whitespace-normal break-words">
              {title}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground whitespace-normal break-words">
              {subtitle}
            </p>
          </div>
        </div>

        {badge && <div className="w-full sm:w-auto shrink-0">{badge}</div>}
      </div>
    </div>
  );
}
