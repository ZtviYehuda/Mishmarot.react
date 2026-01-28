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
    <div className="flex flex-col gap-2 mb-4 sm:mb-6 lg:mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Breadcrumb style category - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none mb-1 text-right">
        <span>ניהול מערכת</span>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-primary transition-colors">{category}</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-3 sm:gap-4 lg:gap-5">
          {/* Icon Container - Smaller on mobile */}
          <div
            className={cn(
              "w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 rounded-xl sm:rounded-2xl bg-gradient-to-br from-muted/50 to-muted border border-border flex items-center justify-center shrink-0 shadow-sm transition-all duration-300",
              iconClassName,
            )}
          >
            <Icon className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-foreground/70" />
          </div>

          <div className="text-right flex-1 min-w-0">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-black text-foreground tracking-tight leading-tight sm:leading-none mb-1 sm:mb-1.5 transition-all truncate">
              {title}
            </h1>
            <p className="text-[11px] sm:text-xs lg:text-sm font-bold text-muted-foreground leading-none truncate">
              {subtitle}
            </p>
          </div>
        </div>

        {badge && (
          <div className="flex items-center self-start sm:self-center shrink-0">
            {badge}
          </div>
        )}
      </div>
    </div>
  );
}
