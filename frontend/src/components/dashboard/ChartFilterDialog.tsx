import { useState, useEffect } from "react";
import { useAuthContext } from "@/context/AuthContext";
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
  const { user } = useAuthContext();
  const [filterType, setFilterType] = useState<
    "all" | "department" | "section"
  >("all");
  const [departments, setDepartments] = useState<any[]>([]);
  const [sections, setSections] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // In a real app, fetch departments/sections from API based on user permissions
  useEffect(() => {
    if (open && user) {
      // For now, we'll just set up basic structure
      // In production, fetch from backend based on user's department/section access
      setDepartments([
        { id: 1, name: "פיקוד הצפון" },
        { id: 2, name: "פיקוד הדרום" },
        { id: 3, name: "פיקוד המרכז" },
      ]);
      setSections([
        { id: 1, name: "מחלקה A" },
        { id: 2, name: "מחלקה B" },
        { id: 3, name: "מחלקה C" },
      ]);
    }
  }, [open, user]);

  const handleApply = () => {
    onApplyFilter(filterType);
    onOpenChange(false);
  };

  // If not admin or commander, disable department/section filters
  const canFilter = user?.is_admin || user?.is_commander;

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
          <Button
            onClick={handleApply}
            className="flex-1 bg-[#0074ff] hover:bg-[#0074ff]/90"
            disabled={loading}
          >
            החל
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
