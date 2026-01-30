import React, { useState, useEffect } from "react";
import {
    Dialog,
    DialogContent,
    DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { MessageCircle, Check, Send, Edit2, RotateCcw, Save } from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";

interface BirthdayEmployee {
    id: number;
    first_name: string;
    last_name: string;
    birth_date?: string | null;
    phone_number?: string;
}

interface BirthdayGreetingsModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    employeesToday: BirthdayEmployee[];
}

interface Preset {
    id: number;
    label: string;
    text: string;
}

const STORAGE_KEY = "birthday_presets";

const INITIAL_PRESETS: Preset[] = [
    { id: 1, label: "ברכה 1", text: "מזל טוב [שם] יקר! 🎂 מאחלים לך יום הולדת שמח, המון בריאות, אושר והצלחה מהיחידה! ❤️\n\nבברכה, [שם_המפקד]" },
    { id: 2, label: "ברכה 2", text: "יום הולדת שמח [שם]! 🎉 מאחלים לך שנה מלאה בחוויות טובות, חיוכים והמון כיף. מזל טוב! 🎈\n\nממני, [שם_המפקד]" },
    { id: 3, label: "ברכה 3", text: "מזל טוב [שם]! 🎂 מאחלים לך יום הולדת שמח ומכל הלב! 🎈\n\n[שם_המפקד]" }
];

export const BirthdayGreetingsModal: React.FC<BirthdayGreetingsModalProps> = ({
    open,
    onOpenChange,
    employeesToday,
}) => {
    const { user } = useAuthContext();
    const [presets, setPresets] = useState<Preset[]>(INITIAL_PRESETS);
    const [activePresetId, setActivePresetId] = useState<number>(1);
    const [template, setTemplate] = useState(INITIAL_PRESETS[0].text);
    const [sentList, setSentList] = useState<number[]>([]);
    const [isEditing, setIsEditing] = useState(false);

    const commanderName = user ? `${user.first_name} ${user.last_name}` : "המפקד";

    // Load presets from localStorage on mount
    useEffect(() => {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                setPresets(parsed);
                // Also update current template if it matches the first preset
                setTemplate(parsed[0].text);
            } catch (e) {
                console.error("Failed to load presets", e);
            }
        }
    }, []);

    const handleSend = (emp: BirthdayEmployee) => {
        if (!emp.phone_number) return;

        // Replace both placeholders
        let message = template.replace("[שם]", emp.first_name);
        message = message.replace("[שם_המפקד]", commanderName);

        const cleanPhone = emp.phone_number.replace(/\D/g, "");

        const finalPhone = cleanPhone.startsWith('972')
            ? cleanPhone
            : `972${cleanPhone.startsWith('0') ? cleanPhone.substring(1) : cleanPhone}`;

        const whatsappUrl = `https://api.whatsapp.com/send?phone=${finalPhone}&text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, "_blank");

        if (!sentList.includes(emp.id)) {
            setSentList([...sentList, emp.id]);
        }
    };

    const handleSavePreset = () => {
        const updatedPresets = presets.map(p =>
            p.id === activePresetId ? { ...p, text: template } : p
        );
        setPresets(updatedPresets);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updatedPresets));
        setIsEditing(false);
    };

    const handleSelectPreset = (p: Preset) => {
        setActivePresetId(p.id);
        setTemplate(p.text);
        setIsEditing(false);
    };

    const handleReset = () => {
        if (window.confirm("האם לאפס את רשימת השליחה?")) {
            setSentList([]);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-xl p-0 overflow-hidden border border-border bg-card shadow-2xl rounded-2xl" dir="rtl">
                <div className="p-6 border-b border-border/50 bg-muted/20">
                    <DialogTitle className="text-xl font-black text-foreground flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-primary" />
                        שליחת ברכות יום הולדת
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground font-bold mt-1 uppercase tracking-tight">
                        היום חוגגים {employeesToday.length} אנשים
                    </p>
                </div>

                <div className="p-6 space-y-6">
                    {/* Presets Selection */}
                    <div className="flex gap-2 mb-2">
                        {presets.map((p) => (
                            <button
                                key={p.id}
                                onClick={() => handleSelectPreset(p)}
                                className={cn(
                                    "flex-1 py-2 rounded-xl text-[10px] font-black transition-all border flex flex-col items-center gap-1",
                                    activePresetId === p.id
                                        ? "bg-primary text-primary-foreground border-primary shadow-md"
                                        : "bg-muted/30 text-muted-foreground border-transparent hover:bg-muted/50"
                                )}
                            >
                                <span className="uppercase tracking-widest">{p.label}</span>
                            </button>
                        ))}
                    </div>

                    {/* Template Editor */}
                    <div className="bg-muted/30 p-4 rounded-xl border border-border/40">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-[10px] font-black text-primary uppercase tracking-widest flex items-center gap-1">
                                <Edit2 className="w-3 h-3" />
                                עריכת נוסח הברכה
                            </span>
                            {isEditing && (
                                <button
                                    onClick={handleSavePreset}
                                    className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500 text-white rounded-full text-[10px] font-black hover:bg-emerald-600 transition-all shadow-sm"
                                >
                                    <Save className="w-3 h-3" />
                                    שמור שינויים ב{presets.find(p => p.id === activePresetId)?.label}
                                </button>
                            )}
                        </div>

                        <div className="relative">
                            {isEditing ? (
                                <textarea
                                    value={template}
                                    onChange={(e) => setTemplate(e.target.value)}
                                    className="w-full bg-card border border-border rounded-lg p-3 text-sm font-medium focus:ring-1 focus:ring-primary outline-none transition-all h-32 custom-scrollbar resize-none"
                                    placeholder="הכנס את נוסח הברכה... השתמש ב-[שם] וב-[שם_המפקד]"
                                />
                            ) : (
                                <div
                                    onClick={() => setIsEditing(true)}
                                    className="bg-card border border-border/50 rounded-lg p-4 text-sm font-semibold text-foreground leading-relaxed cursor-text min-h-[100px] hover:border-primary/30 transition-colors group relative whitespace-pre-wrap"
                                >
                                    {template}
                                    <div className="absolute top-2 left-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <Edit2 className="w-3 h-3 text-muted-foreground" />
                                    </div>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-between items-center mt-3">
                            <p className="text-[9px] text-muted-foreground font-medium leading-loose">
                                * <span className="text-primary font-bold">[שם]</span> יוחלף בשם השוטר.
                                <br />
                                * <span className="text-primary font-bold">[שם_המפקד]</span> יוחלף ב: <span className="font-bold underline">{commanderName}</span>
                            </p>
                            {!isEditing && (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="text-[9px] font-black text-primary hover:underline uppercase tracking-wider"
                                >
                                    לחץ לעריכה
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Employees List */}
                    <div className="space-y-3 max-h-56 overflow-y-auto pr-1 custom-scrollbar">
                        <div className="flex justify-between items-center px-1">
                            <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">רשימת חוגגים</span>
                            {sentList.length > 0 && (
                                <button onClick={handleReset} className="flex items-center gap-1 text-[9px] font-bold text-muted-foreground hover:text-destructive transition-colors">
                                    <RotateCcw className="w-3 h-3" /> איפוס רשימה
                                </button>
                            )}
                        </div>

                        {employeesToday.length === 0 ? (
                            <div className="text-center py-8 text-muted-foreground bg-muted/20 rounded-xl border border-dashed border-border/50">
                                <p className="text-xs font-medium uppercase tracking-widest">אין ימי הולדת היום</p>
                            </div>
                        ) : (
                            employeesToday.map((emp) => {
                                const isSent = sentList.includes(emp.id);
                                return (
                                    <div
                                        key={emp.id}
                                        className={cn(
                                            "flex items-center justify-between p-3 rounded-xl border transition-all duration-300",
                                            isSent ? "bg-muted/10 border-border/20 opacity-60" : "bg-card border-border shadow-sm hover:border-primary/40"
                                        )}
                                    >
                                        <div className="flex flex-col">
                                            <span className="text-sm font-black text-foreground">{emp.first_name} {emp.last_name}</span>
                                            <span className="text-[10px] font-bold text-muted-foreground">{emp.phone_number || "אין מספר טלפון"}</span>
                                        </div>

                                        <Button
                                            size="sm"
                                            onClick={() => handleSend(emp)}
                                            disabled={!emp.phone_number}
                                            className={cn(
                                                "h-8 rounded-full gap-2 transition-all",
                                                isSent
                                                    ? "bg-emerald-500/10 text-emerald-600 border-emerald-500/20"
                                                    : "bg-primary text-primary-foreground hover:scale-105"
                                            )}
                                            variant={isSent ? "outline" : "default"}
                                        >
                                            {isSent ? (
                                                <>
                                                    <Check className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase">נשלח</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Send className="w-3.5 h-3.5" />
                                                    <span className="text-[10px] font-black uppercase">שלח</span>
                                                </>
                                            )}
                                        </Button>
                                    </div>
                                );
                            })
                        )}
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
};

function cn(...inputs: any[]) {
    return inputs.filter(Boolean).join(" ");
}
