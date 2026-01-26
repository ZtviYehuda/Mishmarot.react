import { useState } from "react";
import { EmployeesChart } from "@/components/dashboard/EmployeesChart";
import { ChartFilterDialog } from "@/components/dashboard/ChartFilterDialog";
import { WhatsAppReportDialog } from "@/components/dashboard/WhatsAppReportDialog";
import { cn } from "@/lib/utils";
import { AlertCircle } from "lucide-react";

const Skeleton = ({ className }: { className?: string }) => (
  <div className={cn("animate-pulse rounded-md bg-muted", className)} />
);

export default function DashboardPage() {
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [whatsAppDialogOpen, setWhatsAppDialogOpen] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'department' | 'section'>('all');
  const [filteredDepartmentId, setFilteredDepartmentId] = useState<number>();
  const [filteredSectionId, setFilteredSectionId] = useState<number>();

  const handleApplyFilter = (type: 'all' | 'department' | 'section', id?: number) => {
    setFilterType(type);
    if (type === 'department' && id) {
      setFilteredDepartmentId(id);
      setFilteredSectionId(undefined);
    } else if (type === 'section' && id) {
      setFilteredSectionId(id);
      setFilteredDepartmentId(undefined);
    } else {
      setFilteredDepartmentId(undefined);
      setFilteredSectionId(undefined);
    }
  };

  return (
    <div className="w-full h-full space-y-6">
      {/* Main Employees Chart */}
      <div>
        <EmployeesChart
          onOpenFilter={() => setFilterDialogOpen(true)}
          onOpenWhatsAppReport={() => setWhatsAppDialogOpen(true)}
          filterType={filterType}
          filteredDepartmentId={filteredDepartmentId}
          filteredSectionId={filteredSectionId}
        />
      </div>

      {/* Filter Dialog */}
      <ChartFilterDialog
        open={filterDialogOpen}
        onOpenChange={setFilterDialogOpen}
        onApplyFilter={handleApplyFilter}
      />

      {/* WhatsApp Report Dialog */}
      <WhatsAppReportDialog
        open={whatsAppDialogOpen}
        onOpenChange={setWhatsAppDialogOpen}
      />
    </div>
  );
}
