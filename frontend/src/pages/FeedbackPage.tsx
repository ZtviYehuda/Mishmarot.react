import React, { useState, useEffect } from "react";
import { 
  MessageSquare, 
  Send, 
  History, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  Plus,
  MessageCircle,
  X,
  Settings,
  Search,
  Check,
  User,
  LayoutDashboard,
  MessageSquarePlus,
  Activity,
  Archive, 
  RefreshCw,
  ChevronLeft,
  LayoutGrid,
  Filter,
  Bug,
  Zap,
  Rocket,
  HelpCircle
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import apiClient from "../config/api.client";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { PageHeader } from "../components/layout/PageHeader";
import { Card } from "../components/ui/card";
import { useAuthContext } from "../context/AuthContext";

interface Ticket {
  id: number;
  user_id: number;
  first_name?: string;
  last_name?: string;
  category: string;
  description: string;
  status: 'received' | 'reviewing' | 'in_progress' | 'done' | 'dismissed' | 'irrelevant';
  admin_reply: string | null;
  created_at: string;
}

interface SupportTicket {
  id: number;
  user_id: number;
  full_name: string;
  subject: string;
  message: string;
  status: string;
  admin_reply: string | null;
  is_read_by_user: boolean;
  created_at: string;
}

const FeedbackPage = () => {
  const navigate = useNavigate();
  const { user: currentUser } = useAuthContext();
  const isAdmin = currentUser?.is_admin;
  
  const [activeTab, setActiveTab] = useState<'send' | 'my-tickets' | 'admin-view' | 'whats-new'>(isAdmin ? 'admin-view' : 'send');
  const [category, setCategory] = useState("bug");
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'done' | 'dismissed'>('pending');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<'all' | 'bug' | 'improvement' | 'feature' | 'support'>('all');
  const [selectedItem, setSelectedItem] = useState<{data: any, type: 'feedback' | 'support'} | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchMyTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/feedback/my");
      setMyTickets(response.data);
    } catch (error) { console.error(error); }
    finally { setIsLoadingTickets(false); }
  };

  const fetchAdminTickets = async () => {
    setIsLoadingTickets(true);
    try {
      const [feedbackRes, supportRes] = await Promise.all([
        apiClient.get("/feedback/admin/all"),
        apiClient.get("/support/tickets")
      ]);
      setAllTickets(feedbackRes.data);
      setSupportTickets(supportRes.data);
    } catch (error) { console.error(error); }
    finally { setIsLoadingTickets(false); }
  };

  useEffect(() => {
    if (activeTab === 'my-tickets') fetchMyTickets();
    else if (activeTab === 'admin-view') fetchAdminTickets();
  }, [activeTab]);

  const handleAdminReply = async () => {
    if (!replyText.trim() || !selectedItem) return;
    try {
      if (selectedItem.type === 'feedback') {
        await apiClient.put(`/feedback/admin/update/${selectedItem.data.id}`, { status: 'done', admin_reply: replyText });
      } else {
        await apiClient.put(`/support/tickets/${selectedItem.data.id}/reply`, { admin_reply: replyText });
      }
      toast.success("תשובה נשלחה");
      setReplyText("");
      setSelectedItem(null);
      fetchAdminTickets();
    } catch (error) { toast.error("שגיאה בשליחה"); }
  };

  const updateStatus = async (id: number, type: 'feedback' | 'support', status: string) => {
    try {
      if (type === 'feedback') {
        await apiClient.put(`/feedback/admin/update/${id}`, { status, admin_reply: selectedItem?.data.admin_reply });
      }
      toast.success("סטטוס עודכן");
      fetchAdminTickets();
      setSelectedItem(null);
    } catch (err) { toast.error("שגיאה בעדכון סטטוס"); }
  };

  const filteredItems = isAdmin ? [
    ...allTickets.map(t => ({ ...t, type: 'feedback' as const })),
    ...supportTickets.map(t => ({ ...t, type: 'support' as const, description: t.message, category: t.subject }))
  ].filter(item => {
    // Status filter
    if (adminFilter === 'pending' && (item.status === 'done' || item.status === 'dismissed' || item.status === 'irrelevant')) return false;
    if (adminFilter === 'done' && item.status !== 'done') return false;
    if (adminFilter === 'dismissed' && item.status !== 'dismissed' && item.status !== 'irrelevant') return false;
    // Category filter
    if (adminCategoryFilter === 'support' && item.type !== 'support') return false;
    if (adminCategoryFilter === 'bug' && (item.type !== 'feedback' || item.category !== 'bug')) return false;
    if (adminCategoryFilter === 'improvement' && (item.type !== 'feedback' || item.category !== 'improvement')) return false;
    if (adminCategoryFilter === 'feature' && (item.type !== 'feedback' || item.category !== 'feature')) return false;
    return true;
  }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()) : [];

  const getStatusBadge = (status: string) => {
    const configs: any = {
      received: { label: "ממתין", color: "bg-slate-100 text-slate-600 border-slate-200" },
      reviewing: { label: "בבדיקה", color: "bg-blue-50 text-blue-600 border-blue-200" },
      in_progress: { label: "בטיפול", color: "bg-amber-50 text-amber-600 border-amber-200" },
      done: { label: "בוצע", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
      dismissed: { label: "נדחה", color: "bg-rose-50 text-rose-600 border-rose-200" },
      irrelevant: { label: "לא רלוונטי", color: "bg-slate-200 text-slate-500 border-slate-300" },
      open: { label: "פתוח", color: "bg-blue-50 text-blue-600 border-blue-200" },
      closed: { label: "נענה", color: "bg-emerald-50 text-emerald-600 border-emerald-200" },
    };
    const config = configs[status] || configs.received;
    return <Badge variant="outline" className={cn("px-2 py-0 rounded-lg font-black text-[9px] border", config.color)}>{config.label}</Badge>;
  };

  return (
    <div className="flex flex-col h-full bg-background/50 overflow-hidden" dir="rtl">
      <div className="pt-6 pb-4 px-4 sm:px-6 shrink-0 transition-all">
        <PageHeader 
          icon={MessageSquarePlus}
          title={isAdmin ? "מערכת ניהול פניות" : "מרכז משוב והצעות"}
          subtitle={isAdmin ? "מעקב וטיפול בפניות מפקדים מהשטח." : "הפידבק שלך עוזר לנו לבנות מערכת טובה יותר."}
          className="mb-0"
          badge={
            <div className="flex items-center gap-3">
              <Button 
                variant="outline" 
                className="rounded-2xl h-11 border-border/40 bg-card hover:bg-muted/50 font-black"
                onClick={isAdmin ? fetchAdminTickets : fetchMyTickets}
                disabled={isLoadingTickets}
              >
                <RefreshCw className={cn("w-4 h-4 ml-2", isLoadingTickets && "animate-spin")} />
                רענן נתונים
              </Button>
            </div>
          }
        />
      </div>

      <main className="flex-1 overflow-y-auto custom-scrollbar p-4 lg:p-8 space-y-8">
        {isAdmin && activeTab === 'admin-view' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatItem label="פניות פתוחות" value={filteredItems.filter(i => ['pending', 'open', 'received'].includes(i.status)).length} sub="ממתינות למענה" icon={AlertCircle} color="bg-rose-500/10 text-rose-600" />
            <StatItem label="בטיפול" value={filteredItems.filter(i => ['in_progress', 'reviewing'].includes(i.status)).length} sub="נבדקות כעת" icon={Activity} color="bg-amber-500/10 text-amber-600" />
            <StatItem label="טופלו היום" value={filteredItems.filter(i => (['done', 'closed', 'approved'].includes(i.status)) && new Date(i.created_at).toDateString() === new Date().toDateString()).length} sub="סגורות להיום" icon={CheckCircle2} color="bg-emerald-500/10 text-emerald-600" />
            <StatItem label="סה״כ פניות" value={filteredItems.length} sub="במערכת" icon={MessageSquare} color="bg-blue-500/10 text-blue-600" />
          </div>
        )}

        <Card className="rounded-[2.5rem] border-border/40 overflow-hidden flex flex-col min-h-[650px] bg-card/60 backdrop-blur-xl">
          {/* Tabs - ניהול משימות first for admins */}
          <div className="flex bg-background/20 px-6 pt-6 border-b border-border/40 gap-2 overflow-x-auto no-scrollbar">
            {!isAdmin && (
              <button onClick={() => setActiveTab('send')} className={cn("px-6 py-4 text-xs font-black rounded-t-[1.5rem] transition-all border-t border-x", activeTab === 'send' ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
                <div className="flex items-center gap-2"><Send className="w-4 h-4" />שליחת משוב</div>
              </button>
            )}
            {isAdmin && (
              <button onClick={() => setActiveTab('admin-view')} className={cn("px-6 py-4 text-xs font-black rounded-t-[1.5rem] transition-all border-t border-x", activeTab === 'admin-view' ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
                <div className="flex items-center gap-2"><Settings className="w-4 h-4" />ניהול משימות</div>
              </button>
            )}
            <button onClick={() => { setActiveTab('my-tickets'); if (activeTab !== 'my-tickets') fetchMyTickets(); }} className={cn("px-6 py-4 text-xs font-black rounded-t-[1.5rem] transition-all border-t border-x", activeTab === 'my-tickets' ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
              <div className="flex items-center gap-2"><History className="w-4 h-4" />{isAdmin ? "ארכיון שלי" : "הפניות שלי"}</div>
            </button>
            <button onClick={() => setActiveTab('whats-new')} className={cn("px-6 py-4 text-xs font-black rounded-t-[1.5rem] transition-all border-t border-x", activeTab === 'whats-new' ? "bg-card text-primary border-border/40" : "text-muted-foreground hover:bg-card/50 border-transparent")}>
              <div className="flex items-center gap-2"><Sparkles className="w-4 h-4" />מה חדש?</div>
            </button>
          </div>

          <div className="flex-1 p-6 overflow-y-auto custom-scrollbar relative">
            <AnimatePresence mode="wait">
              {activeTab === 'send' && !isAdmin && (
                <motion.div key="send-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
                  <div className="lg:col-span-8">
                    <div className="bg-card border border-border/40 rounded-3xl p-8 shadow-sm">
                      <form onSubmit={(e) => { e.preventDefault(); toast.success("נשלח!"); }} className="space-y-8">
                        <div>
                          <label className="block text-foreground font-black text-xs mb-6 uppercase tracking-widest opacity-80">סוג הפנייה</label>
                          <div className="grid grid-cols-3 gap-4">
                            {[
                              { id: "bug", label: "דיווח על באג", icon: AlertCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
                              { id: "improvement", label: "הצעה לשיפור", icon: CheckCircle2, color: "text-amber-500", bg: "bg-amber-500/10" },
                              { id: "feature", label: "פיצ'ר חדש", icon: Plus, color: "text-blue-500", bg: "bg-blue-500/10" }
                            ].map((cat) => (
                              <button key={cat.id} type="button" onClick={() => setCategory(cat.id)} className={cn( "flex flex-col items-center justify-center gap-4 p-6 rounded-2xl border-2 transition-all active:scale-[0.98]", category === cat.id ? "border-primary bg-primary/5 text-primary shadow-sm" : "border-border/40 text-muted-foreground hover:bg-muted/50" )}>
                                <div className={cn("w-12 h-12 rounded-xl flex items-center justify-center", cat.bg)}><cat.icon className={cn("w-6 h-6", cat.color)} /></div>
                                <span className="font-black text-[11px] uppercase tracking-wider">{cat.label}</span>
                              </button>
                            ))}
                          </div>
                        </div>
                        <div className="space-y-4">
                          <label className="block text-foreground font-black text-xs uppercase tracking-widest opacity-80">תיאור מפורט</label>
                          <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="ספר לנו מה קרה..." className="w-full h-48 p-6 bg-muted/20 border border-border/40 rounded-2xl focus:ring-4 focus:ring-primary/10 transition-all resize-none text-sm font-medium" />
                        </div>
                        <Button type="submit" className="w-full h-14 rounded-xl font-black text-md gap-4">שליחת משוב לצוות הפיתוח <Send className="w-4 h-4" /></Button>
                      </form>
                    </div>
                  </div>
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-card border border-border/40 rounded-3xl p-6 shadow-sm">
                      <h3 className="font-black text-[11px] mb-6 flex items-center gap-3 uppercase tracking-widest text-primary"><Sparkles className="w-4 h-4" />למה המשוב חשוב?</h3>
                      <div className="space-y-6">
                        {[{ icon: CheckCircle2, text: "צוות הפיתוח קורא כל משוב ומתעדף תיקונים באופן שוטף.", color: "text-emerald-500" }, { icon: Plus, text: "רוב היכולות החדשות במערכת נולדו ישירות מהצעות שלכם.", color: "text-blue-500" }].map((item, i) => (
                          <div key={i} className="flex gap-4 items-start">
                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 bg-slate-100 dark:bg-slate-800"><item.icon className={cn("w-4 h-4", item.color)} /></div>
                            <p className="text-[11px] text-muted-foreground font-bold leading-relaxed pt-1">{item.text}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {activeTab === 'admin-view' && isAdmin && (
                <motion.div key="admin-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                  {/* Premium Admin Filters */}
                  <div className="bg-muted/30 dark:bg-slate-900/40 p-4 rounded-[2rem] border border-border/40 space-y-4 shadow-inner backdrop-blur-md">
                    {/* Status filter Row */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px] text-primary">
                        <Filter className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">סטטוס פנייה</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                        {[
                          { id: 'pending', label: 'ממתין לטיפול', color: 'bg-amber-500', icon: AlertCircle },
                          { id: 'done', label: 'טופל בהצלחה', color: 'bg-emerald-500', icon: CheckCircle2 },
                          { id: 'dismissed', label: 'ארכיון / נדחה', color: 'bg-slate-500', icon: Archive },
                          { id: 'all', label: 'כל הפניות', color: 'bg-primary', icon: LayoutGrid }
                        ].map(f => (
                          <button 
                            key={f.id} 
                            onClick={() => setAdminFilter(f.id as any)} 
                            className={cn(
                              "h-10 px-4 rounded-xl font-black text-[11px] transition-all flex items-center gap-2.5 border",
                              adminFilter === f.id 
                                ? "bg-white dark:bg-slate-800 text-primary border-primary/20 shadow-md scale-[1.02]" 
                                : "bg-transparent text-muted-foreground border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                          >
                            <f.icon className={cn("w-3.5 h-3.5", adminFilter === f.id ? "text-primary" : "text-muted-foreground/50")} />
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-[1px] bg-border/30 mx-2" />

                    {/* Category filter Row */}
                    <div className="flex items-center gap-4">
                      <div className="flex items-center gap-2 min-w-[100px] text-primary">
                        <LayoutGrid className="w-4 h-4" />
                        <span className="text-xs font-black uppercase tracking-wider">סוג הפנייה</span>
                      </div>
                      <div className="flex items-center gap-1.5 flex-1 flex-wrap">
                        {[
                          { id: 'all', label: 'הכל', icon: LayoutGrid, color: 'text-slate-500' },
                          { id: 'bug', label: 'באג במערכת', icon: Bug, color: 'text-rose-500' },
                          { id: 'improvement', label: 'הצעה לשיפור', icon: Zap, color: 'text-amber-500' },
                          { id: 'feature', label: "פיצ'ר חדש", icon: Rocket, color: 'text-blue-500' },
                          { id: 'support', label: 'קריאת תמיכה', icon: HelpCircle, color: 'text-purple-500' },
                        ].map(f => (
                          <button 
                            key={f.id} 
                            onClick={() => setAdminCategoryFilter(f.id as any)} 
                            className={cn(
                              "h-10 px-4 rounded-xl font-black text-[11px] transition-all flex items-center gap-2.5 border",
                              adminCategoryFilter === f.id 
                                ? "bg-white dark:bg-slate-800 text-primary border-primary/20 shadow-md scale-[1.02]" 
                                : "bg-transparent text-muted-foreground border-transparent hover:bg-white/50 dark:hover:bg-slate-800/50"
                            )}
                          >
                            <f.icon className={cn("w-3.5 h-3.5", adminCategoryFilter === f.id ? f.color : "text-muted-foreground/50")} />
                            {f.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border/40 rounded-[2rem] overflow-hidden shadow-sm">
                    <table className="w-full text-right border-collapse">
                      <thead>
                        <tr className="bg-transparent border-b border-border/40">
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">שם המפקד</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">תוכן הפנייה</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground">תאריך</th>
                          <th className="px-6 py-5 text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center">סטטוס</th>
                          <th className="px-6 py-5 w-10"></th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/20">
                        {filteredItems.map(item => (
                          <tr key={`${item.type}-${item.id}`} onClick={() => setSelectedItem({data: item, type: item.type})} className="hover:bg-muted/50 cursor-pointer transition-colors group">
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-black text-[11px] shrink-0 border border-primary/5">{(item.type === 'feedback' ? item.first_name?.[0] : item.full_name?.[0]) || 'U'}</div>
                                <span className="font-bold text-sm text-foreground/90">{item.type === 'feedback' ? `${item.first_name} ${item.last_name}` : item.full_name}</span>
                              </div>
                            </td>
                            <td className="px-6 py-4 max-w-md"><p className="text-xs font-medium text-muted-foreground/80 truncate leading-relaxed">{item.description}</p></td>
                            <td className="px-6 py-4 whitespace-nowrap"><span className="text-[10px] font-bold text-muted-foreground/60">{new Date(item.created_at).toLocaleDateString('he-IL')}</span></td>
                            <td className="px-6 py-4 whitespace-nowrap text-center">{getStatusBadge(item.status)}</td>
                            <td className="px-6 py-4"><ChevronLeft className="w-4 h-4 text-primary/40 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0" /></td>
                          </tr>
                        ))}
                        {filteredItems.length === 0 && (
                          <tr>
                            <td colSpan={5} className="py-20 text-center text-muted-foreground font-bold opacity-30">
                              <div className="flex flex-col items-center gap-2">
                                <Search className="w-12 h-12 mb-2" />
                                <p>לא נמצאו פניות התואמות לסינון</p>
                              </div>
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </motion.div>
              )}
              {activeTab === 'my-tickets' && (
                <motion.div key="history-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-3">
                  {isLoadingTickets ? (
                    <div className="py-20 flex justify-center"><div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" /></div>
                  ) : myTickets.length === 0 ? (
                    <div className="py-32 text-center opacity-30">
                      <Archive className="w-16 h-16 mx-auto mb-4" />
                      <h3 className="font-black text-xl">אין פניות קודמות</h3>
                      <p className="text-sm mt-1">הפניות שתשלח יופיעו כאן</p>
                    </div>
                  ) : (
                    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
                      <table className="w-full text-right border-collapse">
                        <thead>
                          <tr className="bg-transparent border-b border-border/40">
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">נושא</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">תאריך</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">סטטוס</th>
                            <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-muted-foreground">תשובה</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border">
                          {myTickets.map(ticket => (
                            <tr key={ticket.id} className="hover:bg-muted/50 transition-colors">
                              <td className="px-6 py-4">
                                <p className="text-xs font-bold">{ticket.category}</p>
                                <p className="text-[11px] text-muted-foreground truncate max-w-xs">{ticket.description}</p>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span className="text-[10px] font-bold text-muted-foreground">{new Date(ticket.created_at).toLocaleDateString('he-IL')}</span>
                              </td>
                              <td className="px-6 py-4">{getStatusBadge(ticket.status)}</td>
                              <td className="px-6 py-4">
                                {ticket.admin_reply ? (
                                  <p className="text-[11px] font-medium text-emerald-600 max-w-xs truncate">{ticket.admin_reply}</p>
                                ) : (
                                  <span className="text-[10px] text-muted-foreground/50 font-bold">טרם נענה</span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </motion.div>
              )}
              {activeTab === 'whats-new' && <motion.div key="new-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-3xl p-12 text-center shadow-sm"><h3 className="font-black text-3xl mb-4">גרסה 2.4.0 יצאה לדרך!</h3></motion.div>}
            </AnimatePresence>
          </div>
        </Card>
      </main>

      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 left-0 h-screen w-full sm:w-[450px] bg-white dark:bg-slate-900 shadow-2xl z-[250] flex flex-col border-r border-border">
              <div className="p-6 border-b border-border bg-slate-50/50 dark:bg-slate-900/50 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center"><User className="w-5 h-5" /></div>
                  <div>
                    <h3 className="font-black text-sm">{selectedItem.type === 'feedback' ? `${selectedItem.data.first_name} ${selectedItem.data.last_name}` : selectedItem.data.full_name}</h3>
                    <span className="text-[10px] font-bold text-muted-foreground uppercase">{selectedItem.type === 'feedback' ? 'פניית משוב' : 'שיחת תמיכה'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 hover:bg-muted rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-grow p-6 overflow-y-auto space-y-6">
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">תוכן הפנייה</label>
                  <div className="p-4 bg-muted/30 rounded-2xl text-[13px] font-medium leading-relaxed border border-border/40">{selectedItem.data.description}</div>
                </div>
                <div className="space-y-3">
                  <label className="text-[9px] font-black uppercase text-muted-foreground tracking-widest">מענה רשמי</label>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="הקלד את תשובתך כאן..." className="w-full h-32 p-4 bg-white dark:bg-slate-800 border border-border rounded-2xl text-xs font-medium focus:ring-4 focus:ring-primary/10 transition-all resize-none" />
                  <Button onClick={handleAdminReply} className="w-full h-12 rounded-xl font-black gap-2"><Send className="w-4 h-4" /> שליחת תשובה</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

export default FeedbackPage;

function StatItem({ label, value, sub, icon: Icon, color }: any) {
  return (
    <Card className="border-border/40 p-6 rounded-[2rem] hover: transition-all group hover:-translate-y-1 bg-card/80">
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-[10px] font-black text-muted-foreground uppercase tracking-widest leading-none">{label}</p>
          <p className="text-3xl font-black tracking-tight">{value}</p>
          <p className="text-[11px] font-bold text-muted-foreground/60">{sub}</p>
        </div>
        <div className={cn("p-4 rounded-2xl transition-transform group-hover:scale-110", color)}><Icon className="w-6 h-6" /></div>
      </div>
    </Card>
  );
}
