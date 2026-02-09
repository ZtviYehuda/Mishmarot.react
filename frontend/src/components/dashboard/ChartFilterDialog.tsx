import { useState } from "react";

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

interface ChartFilterDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onApplyFilter: (
    filterType: "all" | "department" | "section",
    id?: number,
  ) => void;
}

export const ChartFilterDialog = ({
  open,
  onOpenChange,
  onApplyFilter,
}: ChartFilterDialogProps) => {
  const [filterType, setFilterType] = useState<
    "all" | "department" | "section"
  >("all");

  const handleApply = () => {
    onApplyFilter(filterType);
    onOpenChange(false);
  };

  // If not admin or commander, disable department/section filters
  const canFilter = true; // TODO: implement permissions check

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] sm:max-w-md p-4 sm:p-6">
        <DialogHeader>
          <DialogTitle>בחר סוג גרף</DialogTitle>
          <DialogDescription>
            בחר איזה נתונים להציג בגרף המרכזי
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <RadioGroup
            value={filterType}
            onValueChange={(value: any) => setFilterType(value)}
          >
            {/* All Employees Option */}
            <div className="flex items-center space-x-3 space-x-reverse">
              <RadioGroupItem value="all" id="all" />
              <Label htmlFor="all" className="cursor-pointer flex-1">
                <span className="font-semibold">כל העובדים</span>
                <p className="text-xs text-slate-500 mt-1">
                  הצג את כל העובדים תחת הפיקוד שלך
                </p>
              </Label>
            </div>

            {/* Department Filter */}
            {canFilter && (
              <div className="flex items-start space-x-3 space-x-reverse">
                <RadioGroupItem value="department" id="department" />
                <Label htmlFor="department" className="cursor-pointer flex-1">
                  <span className="font-semibold">לפי מחלקה</span>
                  <p className="text-xs text-slate-500 mt-1">
                    בחר מחלקה ספציפית להצגה
                  </p>
                </Label>
              </div>
            )}

            {/* Section Filter */}
            {canFilter && (
              <div className="flex items-start space-x-3 space-x-reverse">
                <RadioGroupItem value="section" id="section" />
                <Label htmlFor="section" className="cursor-pointer flex-1">
                  <span className="font-semibold">לפי מדור</span>
                  <p className="text-xs text-slate-500 mt-1">
                    בחר מדור ספציפי להצגה
                  </p>
                </Label>
              </div>
            )}
          </RadioGroup>
        </div>

        <div className="flex gap-3 pt-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            className="flex-1"
          >
            ביטול
          </Button>
          <Button onClick={handleApply}>החל</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
