import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import apiClient from '@/config/api.client';
import type { Employee } from '@/types/employee.types';
import {
    Loader2,
    User,
    Phone,
    Building2,
    Calendar,
    Shield,
    ArrowRight,
    Edit,
    ArrowLeftRight,
    UserX,
    BadgeCheck,
    MapPin,
    AlertTriangle,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import * as endpoints from "@/config/employees.endpoints";

export default function EmployeeViewPage() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [employee, setEmployee] = useState<Employee | null>(null);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        const fetchEmployee = async () => {
            if (!id) return;
            try {
                // Using the edit endpoint to get full details including scalar IDs if needed, 
                // but usually a 'get by id' endpoint is best.
                const { data } = await apiClient.get<Employee>(endpoints.updateEmployeeEndpoint(parseInt(id)));
                setEmployee(data);
            } catch (error) {
                console.error("Failed to fetch employee:", error);
                toast.error("שגיאה בטעינת פרטי משרת");
            } finally {
                setLoading(false);
            }
        };
        fetchEmployee();
    }, [id]);

    const handleToggleActiveStatus = async () => {
        const newStatus = !employee?.is_active;

        setActionLoading(true);
        try {
            await apiClient.put(endpoints.updateEmployeeEndpoint(parseInt(id!)), { is_active: newStatus });
            toast.success(newStatus ? "המשרת הוחזר למצב פעיל" : "המשרת הועבר לסטטוס לא פעיל");
            // Refresh local state instead of navigating away if we want to stay on page
            setEmployee(prev => prev ? { ...prev, is_active: newStatus } : null);
        } catch (error) {
            console.error(error);
            toast.error("שגיאה בביצוע הפעולה");
        } finally {
            setActionLoading(false);
        }
    };

    const handleTransfer = () => {
        // User said they will detail navigation later.
        toast.info("אפשרות העברה תוגדר בקרוב");
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
                <Loader2 className="w-10 h-10 text-blue-600 animate-spin" />
            </div>
        );
    }

    if (!employee) return null;

    const DetailItem = ({ icon: Icon, label, value, subValue }: { icon: any, label: string, value: string | null | undefined, subValue?: string }) => (
        <div className="flex items-start gap-4 p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-900/20 text-blue-600 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5" />
            </div>
            <div>
                <p className="text-xs font-bold text-slate-400 mb-0.5">{label}</p>
                <p className="font-bold text-slate-900 dark:text-white">{value || "—"}</p>
                {subValue && <p className="text-xs text-slate-500 mt-1">{subValue}</p>}
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-slate-50/50 dark:bg-slate-950 pb-20 animate-in fade-in duration-300" dir="rtl">

            {/* Inactive Banner */}
            {!employee.is_active && (
                <div className="bg-red-500 text-white py-2 px-6 text-center font-bold text-sm shadow-md animate-in slide-in-from-top duration-500 sticky top-0 z-50">
                    <div className="flex items-center justify-center gap-2">
                        <AlertTriangle className="w-4 h-4" />
                        <span>משרת זה מוגדר כלא פעיל במערכת</span>
                    </div>
                </div>
            )}

            {/* Header / Nav */}
            <div className={cn("sticky top-4 z-30 px-6 pointer-events-none mb-8", !employee.is_active && "top-12")}>
                <div className="max-w-7xl mx-auto bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-white/20 shadow-2xl shadow-slate-200/50 dark:shadow-black/50 rounded-2xl p-4 flex items-center justify-between ring-1 ring-slate-900/5 pointer-events-auto">
                    <div className="flex items-center gap-4">
                        <div onClick={() => navigate('/employees')} className="w-10 h-10 rounded-xl bg-slate-50 dark:bg-slate-800 flex items-center justify-center cursor-pointer hover:bg-blue-50 hover:text-blue-600 transition-all group">
                            <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-blue-500 transition-colors" />
                        </div>
                        <div>
                            <h1 className="text-lg font-black text-slate-800 dark:text-white leading-none">תיק משרת</h1>
                            <div className="flex items-center gap-2 text-xs font-medium text-slate-500 mt-1">
                                <span>מצבת כוח אדם</span>
                                <span className="text-slate-300">/</span>
                                <span className="text-blue-600">{employee.first_name} {employee.last_name}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex gap-3">
                        <Button onClick={() => navigate(`/employees/edit/${employee.id}`)} className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/20 rounded-xl px-5 gap-2">
                            <Edit className="w-4 h-4" />
                            <span className="hidden md:inline">עריכה</span>
                        </Button>
                        <Button onClick={handleTransfer} variant="outline" className="border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl px-5 gap-2 hidden sm:flex">
                            <ArrowLeftRight className="w-4 h-4" />
                            <span>העברה</span>
                        </Button>
                        <Button
                            onClick={handleToggleActiveStatus}
                            variant={employee.is_active ? "destructive" : "default"}
                            className={cn(
                                "rounded-xl px-5 gap-2 shadow-none",
                                employee.is_active
                                    ? "bg-red-50 text-red-600 hover:bg-red-100 border border-red-100"
                                    : "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-500/20"
                            )}
                            disabled={actionLoading}
                        >
                            {actionLoading ? (
                                <Loader2 className="w-4 h-4 animate-spin" />
                            ) : (
                                <UserX className="w-4 h-4" />
                            )}
                            <span className="hidden md:inline">
                                {employee.is_active ? "הפוך ללא פעיל" : "הפוך לפעיל"}
                            </span>
                        </Button>
                    </div>
                </div>
            </div>

            <div className={cn("max-w-7xl mx-auto px-6 grid grid-cols-1 lg:grid-cols-12 gap-8", !employee.is_active && "opacity-80 grayscale-[0.3]")}>

                {/* Right Column: Profile Card & Quick Stats */}
                <div className="lg:col-span-4 space-y-6">
                    <Card className={cn(
                        "border-none shadow-lg shadow-slate-200/40 dark:shadow-none bg-white dark:bg-slate-800 rounded-3xl overflow-hidden ring-1 ring-slate-100 dark:ring-slate-700",
                        !employee.is_active && "ring-red-100 dark:ring-red-900/30"
                    )}>
                        <div className="p-8 flex flex-col items-center text-center">
                            <div className="relative">
                                <div className="w-32 h-32 rounded-full bg-slate-50 dark:bg-slate-700/50 flex items-center justify-center text-4xl font-black text-slate-500/50 dark:text-slate-400 mb-6 ring-8 ring-slate-50 dark:ring-slate-800">
                                    {employee.first_name[0]}{employee.last_name[0]}
                                </div>
                                {!employee.is_active && (
                                    <div className="absolute -top-1 -right-1 w-8 h-8 rounded-full bg-red-500 border-4 border-white dark:border-slate-800 flex items-center justify-center text-white shadow-lg">
                                        <X className="w-4 h-4 mr-0" />
                                    </div>
                                )}
                            </div>

                            <h2 className="text-2xl font-black text-slate-900 dark:text-white mb-1">
                                {employee.first_name} {employee.last_name}
                            </h2>
                            <span className="font-mono text-lg font-medium text-slate-400 tracking-wider">
                                {employee.personal_number}
                            </span>

                            <div className="flex gap-2 mt-6">
                                {employee.is_commander && (
                                    <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-200 border-none px-3 py-1 rounded-lg">
                                        <BadgeCheck className="w-3 h-3 mr-1.5" /> מפקד
                                    </Badge>
                                )}
                                <Badge className={cn(
                                    "border-none px-3 py-1 rounded-lg",
                                    !employee.is_active
                                        ? "bg-red-100 text-red-700"
                                        : (employee.status_name ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-600")
                                )}>
                                    {!employee.is_active ? "לא פעיל" : (employee.status_name || "פעיל")}
                                </Badge>
                            </div>
                        </div>
                    </Card>

                    <div className="bg-white dark:bg-slate-800 rounded-3xl p-6 shadow-sm border border-slate-100 dark:border-slate-800 space-y-4">
                        <h3 className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                            <Shield className="w-4 h-4 text-blue-500" /> אבטחה והרשאות
                        </h3>
                        <div className="space-y-3">
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <span className="text-sm text-slate-500 font-medium">סיווג אבטחתי</span>
                                <div className="flex gap-1">
                                    {[...Array(5)].map((_, i) => (
                                        <div key={i} className={cn("w-2 h-2 rounded-full", i < (employee.security_clearance || 0) ? "bg-amber-500" : "bg-slate-200 dark:bg-slate-700")} />
                                    ))}
                                </div>
                            </div>
                            <div className="flex justify-between items-center p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl">
                                <span className="text-sm text-slate-500 font-medium">רישיון משטרתי</span>
                                <span className={cn("text-sm font-bold", employee.police_license ? "text-green-600" : "text-slate-400")}>
                                    {employee.police_license ? "יש רישיון" : "אין רישיון"}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Left Column: Details Grid */}
                <div className="lg:col-span-8 space-y-6">
                    {/* Organization Section */}
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Building2 className="w-5 h-5 text-blue-500" />
                                מיקום ארגוני
                            </h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem icon={Building2} label="מחלקה" value={employee.department_name} />
                            <DetailItem icon={Building2} label="מדור" value={employee.section_name} />
                            <DetailItem icon={Building2} label="חולייה / צוות" value={employee.team_name} />
                            <DetailItem icon={BadgeCheck} label="תפקיד" value={employee.role_name} />
                        </CardContent>
                    </Card>

                    {/* Contact & Personal */}
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <User className="w-5 h-5 text-blue-500" />
                                פרטים אישיים וקשר
                            </h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <DetailItem icon={Phone} label="טלפון נייד" value={employee.phone_number} />
                            <DetailItem icon={MapPin} label="עיר מגורים" value={employee.city} />
                            <DetailItem icon={User} label="תעודת זהות" value={employee.national_id} />
                            <div className="md:col-span-2">
                                <DetailItem
                                    icon={AlertTriangle}
                                    label="איש קשר לחירום"
                                    value={employee.emergency_contact}
                                    subValue="במקרה חירום בלבד"
                                />
                            </div>
                        </CardContent>
                    </Card>

                    {/* Service Timeline */}
                    <Card className="border-none shadow-sm rounded-3xl overflow-hidden">
                        <div className="bg-slate-50/50 dark:bg-slate-800/50 border-b border-slate-100 dark:border-slate-800 p-6">
                            <h3 className="font-bold text-lg flex items-center gap-2">
                                <Calendar className="w-5 h-5 text-blue-500" />
                                שירות וזמנים
                            </h3>
                        </div>
                        <CardContent className="p-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                            <DetailItem icon={Calendar} label="תאריך גיוס" value={employee.enlistment_date?.split('T')[0]} />
                            <DetailItem icon={Calendar} label="כניסה לתפקיד" value={employee.assignment_date?.split('T')[0]} />
                            <DetailItem icon={Calendar} label="שחרור צפוי (תש''ש)" value={employee.discharge_date?.split('T')[0]} />
                        </CardContent>
                    </Card>
                </div>

            </div>
        </div>
    );
}
