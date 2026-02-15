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
    <div className="flex flex-col gap-2 mb-3 sm:mb-6 lg:mb-8">
      {/* Breadcrumb style category - Hidden on mobile */}
      <div className="hidden sm:flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase leading-none mb-1 text-right">
        <span>ניהול מערכת</span>
        <ChevronLeft className="w-3 h-3 rotate-180" />
        <span className="text-primary transition-colors">{category}</span>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 sm:gap-4">
        <div className="flex items-center gap-4 w-full sm:w-auto min-w-0">
          {/* Icon Container - Premium Rounded */}
          <div
            className={cn(
              "w-12 h-12 sm:w-16 sm:h-16 rounded-2xl sm:rounded-[1.5rem] bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 flex items-center justify-center shrink-0 shadow-xl shadow-primary/5",
              iconClassName,
            )}
          >
            <Icon className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
          </div>

          <div className="text-right min-w-0 flex-1">
            <h1 className="text-2xl sm:text-4xl font-black text-foreground tracking-tight mb-1 truncate">
              {title}
            </h1>
            <p className="text-xs sm:text-sm font-bold text-muted-foreground truncate opacity-80">
              {subtitle}
            </p>
          </div>
        </div>

        {badge && <div className="w-full sm:w-auto shrink-0">{badge}</div>}
      </div>
    </div>
  );
}
