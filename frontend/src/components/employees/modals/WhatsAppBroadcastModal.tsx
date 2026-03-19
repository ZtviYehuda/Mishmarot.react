import React, { useState, useMemo, useEffect } from "react";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  MessageSquare, 
  Users, 
  Search, 
  Filter, 
  Send, 
  Copy, 
  Info 
} from "lucide-react";
import { useEmployees } from "@/hooks/useEmployees";
import { useAuthContext } from "@/context/AuthContext";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsAppBroadcastModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const WhatsAppBroadcastModal: React.FC<WhatsAppBroadcastModalProps> = ({
  open,
  onOpenChange,
}) => {
  const { user } = useAuthContext();
  const { employees, loading, fetchEmployees } = useEmployees();
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [message, setMessage] = useState("");
  const [scope, setScope] = useState<"team" | "section" | "department">("team");

  // Fetch subordinates when modal opens
  useEffect(() => {
    if (open) {
      fetchEmployees();
    }
  }, [open, fetchEmployees]);

  // Reset selection when employees are loaded - ONLY those with phone numbers
  useEffect(() => {
    if (employees.length > 0) {
      const validIds = employees
        .filter(e => !!e.phone_number)
        .map(e => e.id);
      setSelectedIds(new Set(validIds));
    }
  }, [employees]);

  const filteredEmployees = useMemo(() => {
    return employees.filter(emp => {
      const matchesSearch = 
        emp.first_name.toLowerCase().includes(search.toLowerCase()) ||
        emp.last_name.toLowerCase().includes(search.toLowerCase()) ||
        (emp.phone_number && emp.phone_number.includes(search));
      
      return matchesSearch;
    });
  }, [employees, search]);

  const toggleSelect = (id: number) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else {
      const emp = employees.find(e => e.id === id);
      if (emp?.phone_number) {
        next.add(id);
      }
    }
    setSelectedIds(next);
  };

  const toggleSelectAll = () => {
    const employeesWithPhone = employees.filter(e => !!e.phone_number);
    if (selectedIds.size >= employeesWithPhone.length && employeesWithPhone.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(employeesWithPhone.map(e => e.id)));
    }
  };

  const handleCopyNumbers = () => {
    const selectedEmployees = employees.filter(e => selectedIds.has(e.id) && e.phone_number);
    const numbers = selectedEmployees.map(e => e.phone_number).join(",");
    
    if (!numbers) {
      toast.error("לא נבחרו נמענים עם מספר טלפון");
      return;
    }

    navigator.clipboard.writeText(numbers);
    toast.success(`${selectedEmployees.length} מספרים הועתקו ללוח`);
  };

  const handleOpenWhatsAppSelector = () => {
    const selectedEmployees = employees.filter(e => selectedIds.has(e.id) && e.phone_number);
    if (selectedEmployees.length === 0) {
      toast.error("יש לבחור לפחות נמען אחד");
      return;
    }

    if (!message) {
      toast.error("יש להקליד תוכן להודעה");
      return;
    }

    const waUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
    toast.info("הודעה הועתקה. בחרו נמענים בוואטסאפ והדביקו את ההודעה.");
  };

  const handleIndividualSend = (emp: any) => {
    if (!emp.phone_number) return;
    const waUrl = `https://wa.me/${emp.phone_number.replace(/\D/g, '')}?text=${encodeURIComponent(message)}`;
    window.open(waUrl, "_blank");
  };

  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-xl h-[85vh] p-0 overflow-hidden bg-background border-border/40 shadow-2xl rounded-[2rem] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-border/40 bg-muted/20 relative shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-green-500/10 flex items-center justify-center text-green-600 shadow-sm shrink-0">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight truncate">רשימת תפוצה וואטסאפ</h2>
              <p className="text-xs font-bold text-muted-foreground/60 truncate">צרו קשר ישיר עם כלל השוטרים</p>
            </div>
          </div>
        </div>

        {/* Main Content Area - NO GLOBAL SCROLL */}
        <div className="flex-1 flex flex-col p-6 pt-1 space-y-4 overflow-hidden">
          {/* 1. Scope Selection */}
          <div className="space-y-1 shrink-0">
            <div className="flex flex-wrap gap-2">
              {user.commands_team_id && (
                <Button 
                  variant={scope === "team" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setScope("team")}
                  className={cn(
                    "rounded-xl h-9 font-black text-xs px-4 transition-all",
                    scope === "team" ? "shadow-md shadow-primary/20" : "bg-card border-border/60 font-bold"
                  )}
                >
                  חוליה ({user.team_name})
                </Button>
              )}
              {user.commands_section_id && (
                <Button 
                  variant={scope === "section" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setScope("section")}
                  className={cn(
                    "rounded-xl h-9 font-black text-xs px-4 transition-all",
                    scope === "section" ? "shadow-md shadow-primary/20" : "bg-card border-border/60 font-bold"
                  )}
                >
                  מדור ({user.section_name})
                </Button>
              )}
              {user.commands_department_id && (
                <Button 
                  variant={scope === "department" ? "default" : "outline"} 
                  size="sm" 
                  onClick={() => setScope("department")}
                  className={cn(
                    "rounded-xl h-9 font-black text-xs px-4 transition-all",
                    scope === "department" ? "shadow-md shadow-primary/20" : "bg-card border-border/60 font-bold"
                  )}
                >
                  מחלקה ({user.department_name})
                </Button>
              )}
            </div>
          </div>

          {/* 2. Recipients Selection - This part scrolls */}
          <div className="flex-1 flex flex-col min-h-0 space-y-3">
            <div className="flex items-center justify-between shrink-0">
              <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                <Users className="w-3.5 h-3.5 text-primary" /> בחירת נמענים ({selectedIds.size})
              </label>
              <button 
                type="button"
                onClick={toggleSelectAll}
                className="text-[10px] font-black text-primary hover:underline transition-all"
              >
                {selectedIds.size === employees.filter(e => !!e.phone_number).length && employees.length > 0 ? "ביטול" : "בחר הכל"}
              </button>
            </div>
            
            <div className="relative group shrink-0">
              <Search className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <input 
                type="text"
                placeholder="חיפוש..."
                className="w-full bg-muted/30 border border-border/40 rounded-xl h-10 pr-10 pl-4 text-xs font-bold outline-none focus:border-primary/50 transition-all focus:ring-4 focus:ring-primary/5"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            <div className="flex-1 border border-border/40 rounded-2xl bg-muted/10 overflow-y-auto custom-scrollbar p-2 min-h-0">
              <div className="space-y-1.5">
                {loading ? (
                  <div className="p-10 text-center"><span className="text-xs font-bold animate-pulse">טוען...</span></div>
                ) : filteredEmployees.length === 0 ? (
                  <div className="p-10 text-center"><span className="text-xs font-bold text-muted-foreground/40 italic">אין תוצאות</span></div>
                ) : (
                  filteredEmployees.map((emp) => (
                    <div 
                      key={emp.id}
                      onClick={() => emp.phone_number && toggleSelect(emp.id)}
                      className={cn(
                        "p-2.5 rounded-xl border transition-all flex items-center justify-between gap-3 cursor-pointer",
                        selectedIds.has(emp.id) 
                          ? "bg-primary/5 border-primary/20" 
                          : "border-transparent hover:bg-background",
                        !emp.phone_number && "opacity-40 grayscale-[0.5] cursor-not-allowed"
                      )}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <Checkbox 
                          checked={selectedIds.has(emp.id)} 
                          onCheckedChange={() => emp.phone_number && toggleSelect(emp.id)}
                          disabled={!emp.phone_number}
                          className="w-4.5 h-4.5 rounded-md"
                        />
                        <div className="min-w-0">
                          <p className="text-xs font-black truncate leading-tight">{emp.first_name} {emp.last_name}</p>
                          <p className="text-[10px] font-bold text-muted-foreground/60 tabular-nums">{emp.phone_number || "ללא מספר"}</p>
                        </div>
                      </div>
                      {emp.phone_number && (
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleIndividualSend(emp);
                          }}
                          className="w-8 h-8 rounded-lg bg-green-500/10 text-green-600 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all scale-90"
                        >
                          <Send className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* 3. Message Area - Fixed height with hover info */}
          <div className="space-y-3 shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 group relative cursor-help">
                <label className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-2">
                  <MessageSquare className="w-3.5 h-3.5 text-primary" /> תוכן ההודעה
                </label>
                <Info className="w-3.5 h-3.5 text-blue-500 animate-pulse" />
                
                {/* Information Tooltip on Hover */}
                <div className="absolute bottom-full right-0 mb-3 w-72 p-4 bg-blue-600 text-white text-[11px] font-bold rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none leading-relaxed border border-white/20">
                  שימו לב: וואטסאפ אינו מאפשר שליחה אוטומטית המונית. לאחר הקלקה תפתח האפליקציה ותתבקשו לבחור נמענים ידנית (ההודעה תודבק אוטומטית).
                  <div className="absolute top-full right-4 w-3 h-3 bg-blue-600 rotate-45 -mt-1.5" />
                </div>
              </div>
            </div>
            <Textarea 
              placeholder="הקלידו כאן את ההודעה..." 
              className="min-h-[140px] resize-none bg-background shadow-inner border-border/40 focus:border-green-500/50 rounded-2xl p-4 font-bold text-base leading-relaxed"
              value={message}
              onChange={(e) => setMessage(e.target.value)}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t border-border/40 bg-muted/10 grid grid-cols-2 gap-3 shrink-0">
          <Button 
            onClick={handleOpenWhatsAppSelector}
            className="bg-green-600 hover:bg-green-700 text-white font-black h-12 rounded-xl gap-2 shadow-lg shadow-green-500/20 text-sm"
          >
            <Send className="w-4 h-4" />
            שליחה בוואטסאפ
          </Button>
          <Button 
            variant="outline" 
            onClick={handleCopyNumbers}
            disabled={selectedIds.size === 0}
            className="font-black h-12 rounded-xl gap-2 border-border/60 hover:bg-background text-sm"
          >
            <Copy className="w-4 h-4" />
            העתקת {selectedIds.size} מספרים
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
