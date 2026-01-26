import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

interface FilterModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApply: (filters: { dept_id?: number; status?: string }) => void;
}

export const FilterModal: React.FC<FilterModalProps> = ({
  open,
  onOpenChange,
  onApply,
}) => {
  const [filters, setFilters] = useState({
    dept_id: "",
    status: "",
  });

  const handleApply = () => {
    onApply({
      dept_id: filters.dept_id ? Number(filters.dept_id) : undefined,
      status: filters.status || undefined,
    });
    onOpenChange(false);
  };

  const handleReset = () => {
    setFilters({ dept_id: "", status: "" });
    onApply({});
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader className="text-right">
          <DialogTitle className="text-xl font-semibold text-[#001e30] dark:text-white">
            סינון מתקדם
          </DialogTitle>
          <DialogDescription className="text-right">
            בחר את הפרמטרים לסינון המשרתים
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2 text-right">
            <Label htmlFor="dept_id" className="text-sm font-medium text-right">
              מזהה מחלקה
            </Label>
            <Input
              id="dept_id"
              type="number"
              value={filters.dept_id}
              onChange={(e) =>
                setFilters({ ...filters, dept_id: e.target.value })
              }
              placeholder="הזן מזהה מחלקה"
              className="border-slate-200 focus:border-[#0074ff] text-right"
            />
          </div>

          <div className="space-y-2 text-right">
            <Label htmlFor="status" className="text-sm font-medium text-right">
              סטטוס
            </Label>
            <Input
              id="status"
              value={filters.status}
              onChange={(e) =>
                setFilters({ ...filters, status: e.target.value })
              }
              placeholder="הזן שם סטטוס"
              className="border-slate-200 focus:border-[#0074ff] text-right"
            />
          </div>
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={handleReset}
            className="border-slate-200"
          >
            איפוס
          </Button>
          <Button
            type="button"
            onClick={handleApply}
            className="bg-[#0074ff] hover:bg-[#0060d5] text-white"
          >
            החל סינון
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
