import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useEmployees } from "@/hooks/useEmployees";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CreateEmployeePayload } from "@/types/employee.types";
import { Loader2, ArrowRight, UserPlus, User, Calendar, MapPin, Phone, Shield, Building2, Save, X } from "lucide-react";
import { ChevronRight } from "lucide-react";

export default function CreateEmployeePage() {
  const navigate = useNavigate();
  const { createEmployee } = useEmployees();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<CreateEmployeePayload>({
    first_name: "",
    last_name: "",
    personal_number: "",
    national_id: "",
    phone_number: "",
    city: "",
    birth_date: "",
    enlistment_date: "",
    discharge_date: "",
    team_id: undefined,
    role_id: undefined,
    is_commander: false,
    is_admin: false,
    security_clearance: 0,
    police_license: false,
    emergency_contact: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const success = await createEmployee(formData);
    setLoading(false);
    if (success) {
      navigate("/employees");
    }
  };

  return (
    <div className="space-y-6 pb-6">
      {/* Page Header */}
      <div className="flex flex-col gap-1.5 border-b border-slate-200 dark:border-slate-700 pb-6">
        <div className="flex items-center gap-2 text-[10px] font-medium text-slate-400 uppercase tracking-widest leading-none mb-1 text-right">
          <span>Core Hub</span>
          <ChevronRight className="w-3 h-3" />
          <span className="text-[#0074ff]">Personnel Management</span>
          <ChevronRight className="w-3 h-3" />
          <span>הוספת משרת חדש</span>
        </div>
        <div className="flex items-center gap-4 text-right">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[#eff6ff] to-[#dbeafe] border border-blue-200 dark:border-blue-900/30 flex items-center justify-center dark:from-slate-800 dark:to-slate-800/50 shadow-sm">
            <UserPlus className="w-7 h-7 text-[#0074ff]" />
          </div>
          <div className="text-right">
            <h1 className="text-3xl font-semibold text-[#001e30] dark:text-white tracking-tight leading-none mb-1.5">
              הוספת משרת חדש
            </h1>
            <p className="text-sm font-medium text-slate-500 dark:text-slate-400 leading-none">
              מלא את הפרטים הבאים כדי להוסיף משרת חדש למערכת
            </p>
          </div>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Personal Information Section */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-lg font-semibold">
              <User className="w-5 h-5 text-[#0074ff]" />
              פרטים אישיים
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="first_name" className="text-sm font-medium text-right">
                  שם פרטי *
                </Label>
                <Input
                  id="first_name"
                  value={formData.first_name}
                  onChange={(e) =>
                    setFormData({ ...formData, first_name: e.target.value })
                  }
                  required
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="last_name" className="text-sm font-medium text-right">
                  שם משפחה *
                </Label>
                <Input
                  id="last_name"
                  value={formData.last_name}
                  onChange={(e) =>
                    setFormData({ ...formData, last_name: e.target.value })
                  }
                  required
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="personal_number" className="text-sm font-medium text-right">
                  מספר אישי *
                </Label>
                <Input
                  id="personal_number"
                  value={formData.personal_number}
                  onChange={(e) =>
                    setFormData({ ...formData, personal_number: e.target.value })
                  }
                  required
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11 font-mono"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="national_id" className="text-sm font-medium text-right">
                  תעודת זהות *
                </Label>
                <Input
                  id="national_id"
                  value={formData.national_id}
                  onChange={(e) =>
                    setFormData({ ...formData, national_id: e.target.value })
                  }
                  required
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11 font-mono"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Contact Information Section */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-lg font-semibold">
              <Phone className="w-5 h-5 text-[#0074ff]" />
              פרטי יצירת קשר
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="phone_number" className="text-sm font-medium text-right">
                  מספר טלפון
                </Label>
                <Input
                  id="phone_number"
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) =>
                    setFormData({ ...formData, phone_number: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="city" className="text-sm font-medium text-right">
                  עיר
                </Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) =>
                    setFormData({ ...formData, city: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right md:col-span-2">
                <Label htmlFor="emergency_contact" className="text-sm font-medium text-right">
                  איש קשר לחירום
                </Label>
                <Input
                  id="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={(e) =>
                    setFormData({ ...formData, emergency_contact: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Dates Section */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-lg font-semibold">
              <Calendar className="w-5 h-5 text-[#0074ff]" />
              תאריכים
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="birth_date" className="text-sm font-medium text-right">
                  תאריך לידה
                </Label>
                <Input
                  id="birth_date"
                  type="date"
                  value={formData.birth_date}
                  onChange={(e) =>
                    setFormData({ ...formData, birth_date: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="enlistment_date" className="text-sm font-medium text-right">
                  תאריך גיוס
                </Label>
                <Input
                  id="enlistment_date"
                  type="date"
                  value={formData.enlistment_date}
                  onChange={(e) =>
                    setFormData({ ...formData, enlistment_date: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="discharge_date" className="text-sm font-medium text-right">
                  תאריך שחרור
                </Label>
                <Input
                  id="discharge_date"
                  type="date"
                  value={formData.discharge_date}
                  onChange={(e) =>
                    setFormData({ ...formData, discharge_date: e.target.value })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security & Permissions Section */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-lg font-semibold">
              <Shield className="w-5 h-5 text-[#0074ff]" />
              אבטחה והרשאות
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="security_clearance" className="text-sm font-medium text-right">
                  רמת סיווג
                </Label>
                <Input
                  id="security_clearance"
                  type="number"
                  min="0"
                  max="5"
                  value={formData.security_clearance}
                  onChange={(e) =>
                    setFormData({ ...formData, security_clearance: parseInt(e.target.value) || 0 })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="police_license" className="text-sm font-medium text-right">
                  רישיון משטרה
                </Label>
                <div className="flex items-center gap-3 flex-row-reverse mt-2">
                  <input
                    type="checkbox"
                    id="police_license"
                    checked={formData.police_license}
                    onChange={(e) =>
                      setFormData({ ...formData, police_license: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#0074ff] focus:ring-[#0074ff]"
                  />
                  <Label htmlFor="police_license" className="text-sm font-medium cursor-pointer">
                    יש רישיון משטרה
                  </Label>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="is_commander" className="text-sm font-medium text-right">
                  מפקד
                </Label>
                <div className="flex items-center gap-3 flex-row-reverse mt-2">
                  <input
                    type="checkbox"
                    id="is_commander"
                    checked={formData.is_commander}
                    onChange={(e) =>
                      setFormData({ ...formData, is_commander: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#0074ff] focus:ring-[#0074ff]"
                  />
                  <Label htmlFor="is_commander" className="text-sm font-medium cursor-pointer">
                    מפקד יחידה
                  </Label>
                </div>
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="is_admin" className="text-sm font-medium text-right">
                  מנהל מערכת
                </Label>
                <div className="flex items-center gap-3 flex-row-reverse mt-2">
                  <input
                    type="checkbox"
                    id="is_admin"
                    checked={formData.is_admin}
                    onChange={(e) =>
                      setFormData({ ...formData, is_admin: e.target.checked })
                    }
                    className="w-4 h-4 rounded border-slate-300 text-[#0074ff] focus:ring-[#0074ff]"
                  />
                  <Label htmlFor="is_admin" className="text-sm font-medium cursor-pointer">
                    מנהל מערכת
                  </Label>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Organizational Section */}
        <Card className="border-slate-200 dark:border-slate-700">
          <CardHeader className="border-b border-slate-200 dark:border-slate-700">
            <CardTitle className="text-right flex items-center gap-2 flex-row-reverse text-lg font-semibold">
              <Building2 className="w-5 h-5 text-[#0074ff]" />
              שיוך ארגוני
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2 text-right">
                <Label htmlFor="team_id" className="text-sm font-medium text-right">
                  מזהה צוות
                </Label>
                <Input
                  id="team_id"
                  type="number"
                  value={formData.team_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, team_id: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
              <div className="space-y-2 text-right">
                <Label htmlFor="role_id" className="text-sm font-medium text-right">
                  מזהה תפקיד
                </Label>
                <Input
                  id="role_id"
                  type="number"
                  value={formData.role_id || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, role_id: e.target.value ? parseInt(e.target.value) : undefined })
                  }
                  className="border-slate-200 focus:border-[#0074ff] text-right h-11"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex items-center gap-4 justify-end pt-4 border-t border-slate-200 dark:border-slate-700">
          <Button
            type="button"
            variant="outline"
            onClick={() => navigate("/employees")}
            disabled={loading}
            className="border-slate-200 dark:border-slate-700 h-11 px-6"
          >
            <X className="w-4 h-4 ml-2" />
            ביטול
          </Button>
          <Button
            type="submit"
            disabled={loading}
            className="bg-[#0074ff] hover:bg-[#0060d5] text-white h-11 px-6 shadow-md shadow-blue-500/20"
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                מוסיף...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 ml-2" />
                שמור משרת
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}
