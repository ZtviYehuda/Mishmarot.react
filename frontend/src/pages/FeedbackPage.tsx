import { useState, useEffect, useMemo } from "react";
import { 
  MessageSquare, 
  Send, 
  History, 
  Sparkles, 
  AlertCircle, 
  CheckCircle2, 
  X,
  Settings,
  Search,
  User,
  Activity,
  Archive, 
  RefreshCw,
  ChevronLeft,
  ShieldCheck,
  Download,
  Eye,
  Filter
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSearchParams } from "react-router-dom";
import apiClient from "../config/api.client";
import { toast } from "sonner";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { cn } from "../lib/utils";
import { Card } from "../components/ui/card";
import { useAuthContext } from "../context/AuthContext";
import { useChat } from "@/context/ChatContext";
import { Dialog, DialogContent } from "../components/ui/dialog";

import { PageHeader } from "@/components/layout/PageHeader";
import type { SupportTicket, Ticket } from "@/types/feedback.types";

const FeedbackPage = () => {
  const { user: currentUser } = useAuthContext();
  const { openChat } = useChat();
  const isAdmin = currentUser?.is_admin;
  
  const [searchParams, setSearchParams] = useSearchParams();
  const initialTab = searchParams.get('tab') as any || (isAdmin ? 'admin-view' : 'send');
  const [activeTab, setActiveTab] = useState<'send' | 'my-tickets' | 'admin-view' | 'whats-new' | 'messages' | 'chat-admin'>(initialTab);
  const [myTickets, setMyTickets] = useState<Ticket[]>([]);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);
  
  // Admin Chat Management State
  const [allConversations, setAllConversations] = useState<any[]>([]);
  const [selectedConvExport, setSelectedConvExport] = useState<any | null>(null);
  const [convMessages, setConvMessages] = useState<any[]>([]);
  const [loadingConv, setLoadingConv] = useState(false);
  const [convSearch, setConvSearch] = useState("");
  const [convSortBy, setConvSortBy] = useState<'name' | 'date' | 'count'>('name');

  // Message Board State
  const [internalMessages, setInternalMessages] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeTo, setComposeTo] = useState("");
  const [isBroadcast, setIsBroadcast] = useState(false);
  const [composeToList, setComposeToList] = useState<string[]>([]);
  const [composeTitle, setComposeTitle] = useState("");
  const [composeDesc, setComposeDesc] = useState("");
  const [recipientSearch, setRecipientSearch] = useState("");
  
  // SaaS Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [adminFilter, setAdminFilter] = useState<'all' | 'pending' | 'done' | 'dismissed'>('pending');
  const [adminCategoryFilter, setAdminCategoryFilter] = useState<'all' | 'bug' | 'improvement' | 'feature' | 'support'>('all');
  
  const [selectedItem, setSelectedItem] = useState<{data: any, type: 'feedback' | 'support'} | null>(null);
  const [replyText, setReplyText] = useState("");
  const [isFilterOpen, setIsFilterOpen] = useState(false);

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

  const fetchInternalMessages = async () => {
    setIsLoadingTickets(true);
    try {
      const response = await apiClient.get("/notifications/messages");
      setInternalMessages(response.data);
    } catch (error) { console.error(error); }
    finally { setIsLoadingTickets(false); }
  };
  
  const fetchEmployeesForMessages = async () => {
    try {
      const response = await apiClient.get("/employees");
      setEmployees(response.data.filter((e: any) => e.is_active));
    } catch (error) { console.error(error); }
  };

  const fetchAllConversations = async () => {
    try {
      const { data } = await apiClient.get("/notifications/messages/admin/all-conversations");
      setAllConversations(data);
    } catch (e) { console.error(e); }
  };

  const fetchConvMessages = async (user1_id: number, user2_id: number) => {
    setLoadingConv(true);
    try {
      const { data } = await apiClient.get(`/notifications/messages/conversation/${user1_id}/${user2_id}/export`);
      setConvMessages(data.messages || []);
    } catch (e) { console.error(e); }
    finally { setLoadingConv(false); }
  };

  const handleExportJson = (conv: any) => {
    const dataStr = JSON.stringify({ ...conv, messages: convMessages }, null, 2);
    const blob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat_${conv.user1_name}_${conv.user2_name}_${new Date().toISOString().slice(0,10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const sortedConversations = useMemo(() => {
    let list = [...allConversations];
    if (convSearch) {
      const q = convSearch.toLowerCase();
      list = list.filter(c =>
        c.user1_name?.toLowerCase().includes(q) ||
        c.user2_name?.toLowerCase().includes(q)
      );
    }
    if (convSortBy === 'name') {
      list.sort((a, b) => (a.user1_name || '').localeCompare(b.user1_name || '', 'he'));
    } else if (convSortBy === 'date') {
      list.sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime());
    } else if (convSortBy === 'count') {
      list.sort((a, b) => b.total_messages - a.total_messages);
    }
    return list;
  }, [allConversations, convSearch, convSortBy]);

  useEffect(() => {
    if (activeTab === 'my-tickets') fetchMyTickets();
    else if (activeTab === 'admin-view' && isAdmin) fetchAdminTickets();
    else if (activeTab === 'messages') {
        fetchInternalMessages();
        if (employees.length === 0) fetchEmployeesForMessages();
    } else if (activeTab === 'chat-admin' && isAdmin) fetchAllConversations();
  }, [activeTab, isAdmin]);

  const handleSendInternalMessage = async () => {
    if ((!isBroadcast && !composeTo) || (isBroadcast && composeToList.length === 0) || !composeTitle) return;
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: isBroadcast ? undefined : composeTo,
        recipient_ids: isBroadcast ? composeToList : undefined,
        title: composeTitle,
        description: composeDesc
      });
      toast.success(isBroadcast ? "ההודעות נשלחו בהצלחה לקבוצה" : "הודעה נשלחה בהצלחה");
      setComposeOpen(false);
      setComposeTo("");
      setComposeToList([]);
      setIsBroadcast(false);
      setComposeTitle("");
      setComposeDesc("");
      fetchInternalMessages();
    } catch (error) {
      toast.error("שגיאה בשליחת ההודעה");
    }
  };

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

  const availableCommanders = useMemo(() => {
    if (!currentUser) return [];
    
    // If Admin: Can message ANYONE
    if (currentUser.is_admin) {
      return employees.filter(e => e.id !== currentUser.id);
    }

    // If Commander: Message subordinates or other commanders
    const commanders = employees.filter(e => {
        if (!e.is_commander || e.id === currentUser.id) return false;
        
        // Hierarchy logic
        if (currentUser.commands_department_id && e.department_id === currentUser.commands_department_id) return true;
        if (currentUser.commands_section_id && e.section_id === currentUser.commands_section_id) return true;
        if (currentUser.commands_team_id && e.team_id === currentUser.commands_team_id) return true;
        
        return false;
    });

    if (commanders.length > 0) return commanders;

    // Fallback: Show all commanders in the unit if no subordinates found
    return employees.filter(e => e.is_commander && e.id !== currentUser.id);
  }, [employees, currentUser]);

  const filteredItems = useMemo(() => {
    if (!isAdmin) return [];
    const items = [
      ...allTickets.map(t => ({ ...t, type: 'feedback' as const })),
      ...supportTickets.map(t => ({ ...t, type: 'support' as const, description: t.message, category: t.subject }))
    ];
    return items.filter(item => {
      if (searchQuery && !`${(item as any).first_name || ''} ${(item as any).last_name || ''} ${(item as any).full_name || ''} ${item.description}`.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (adminFilter === 'pending' && (item.status === 'done' || item.status === 'dismissed' || item.status === 'irrelevant')) return false;
      if (adminFilter === 'done' && item.status !== 'done') return false;
      if (adminFilter === 'dismissed' && item.status !== 'dismissed' && item.status !== 'irrelevant') return false;
      if (adminCategoryFilter === 'support' && item.type !== 'support') return false;
      if (adminCategoryFilter === 'bug' && (item.type !== 'feedback' || item.category !== 'bug')) return false;
      if (adminCategoryFilter === 'improvement' && (item.type !== 'feedback' || item.category !== 'improvement')) return false;
      if (adminCategoryFilter === 'feature' && (item.type !== 'feedback' || item.category !== 'feature')) return false;
      return true;
    }).sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [allTickets, supportTickets, adminFilter, adminCategoryFilter, searchQuery, isAdmin]);

  const getStatusBadge = (status: string) => {
    const configs: any = {
      received: { label: "ממתין", classes: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
      reviewing: { label: "בבדיקה", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      in_progress: { label: "בטיפול", classes: "bg-amber-500/10 text-amber-400 border-amber-500/20" },
      done: { label: "בוצע", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
      dismissed: { label: "נדחה", classes: "bg-rose-500/10 text-rose-400 border-rose-500/20" },
      irrelevant: { label: "לא רלוונטי", classes: "bg-slate-500/10 text-slate-400 border-slate-500/20" },
      open: { label: "פתוח", classes: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
      closed: { label: "נענה", classes: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" },
    };
    const config = configs[status] || configs.received;
    return <Badge className={cn("px-3 py-1 rounded-full font-black text-[10px] border shadow-sm", config.classes)}>{config.label}</Badge>;
  };

  return (
    <div className="w-full relative min-h-screen pb-10 bg-background font-assistant" dir="rtl">
      {/* Page Header - Consistent with other pages */}
      <div className="relative z-10 pt-6 pb-4 px-4 sm:px-6 max-w-full mx-auto transition-all">
        <PageHeader 
          icon={MessageSquare}
          title="הודעות וניהול פניות"
          subtitle="ניהול התכתבויות פנימיות ופניות למערכת"
          className="mb-0"
          hideMobile={true}
        />

        {/* Tab Pills - Optimized Grid for Mobile, Flex for Desktop */}
        <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 mb-6 transition-all">
          {isAdmin && (
            <TabButton 
              active={activeTab === 'admin-view'} 
              onClick={() => {setActiveTab('admin-view'); setSearchParams({tab: 'admin-view'})}} 
              icon={<Settings className="w-4 h-4" />} 
              label="ניהול משימות" 
              className="col-span-1"
            />
          )}
          {isAdmin && (
            <TabButton 
              active={activeTab === 'chat-admin'} 
              onClick={() => {setActiveTab('chat-admin'); setSearchParams({tab: 'chat-admin'})}} 
              icon={<ShieldCheck className="w-4 h-4" />} 
              label="גיבוי צ'אטים" 
              className="col-span-1"
            />
          )}
          <TabButton 
            active={activeTab === 'messages'} 
            onClick={() => {setActiveTab('messages'); setSearchParams({tab: 'messages'})}} 
            icon={<MessageSquare className="w-4 h-4" />} 
            label="הודעות מפקדים" 
            className="col-span-1"
          />
          <TabButton 
            active={activeTab === 'my-tickets'} 
            onClick={() => { setActiveTab('my-tickets'); setSearchParams({tab: 'my-tickets'}); fetchMyTickets(); }} 
            icon={<History className="w-4 h-4" />} 
            label={isAdmin ? "ארכיון שלי" : "הפניות שלי"} 
            className="col-span-1"
          />
          <TabButton 
            active={activeTab === 'whats-new'} 
            onClick={() => {setActiveTab('whats-new'); setSearchParams({tab: 'whats-new'})}} 
            icon={<Sparkles className="w-4 h-4" />} 
            label="מה חדש?" 
            className="col-span-2 sm:col-span-1"
          />
        </div>

        <main className="space-y-6 relative z-10">
          <AnimatePresence mode="wait">
            {activeTab === 'admin-view' && isAdmin && (
              <motion.div key="admin-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                
                {/* Stats Row - Compact Grid (No Scroll) */}
                <div className="grid grid-cols-4 gap-1.5 sm:gap-4 mb-4 sm:mb-6">
                  <StatItem label="פתוחות" value={filteredItems.filter(i => ['pending', 'open', 'received'].includes(i.status)).length} icon={AlertCircle} color="text-rose-500" bgColor="bg-rose-500/10" className="p-1.5 sm:p-5" />
                  <StatItem label="בטיפול" value={filteredItems.filter(i => ['in_progress', 'reviewing'].includes(i.status)).length} icon={Activity} color="text-amber-500" bgColor="bg-amber-500/10" className="p-1.5 sm:p-5" />
                  <StatItem label="טופלו" value={filteredItems.filter(i => (['done', 'closed', 'approved'].includes(i.status)) && new Date(i.created_at).toDateString() === new Date().toDateString()).length} icon={CheckCircle2} color="text-emerald-500" bgColor="bg-emerald-500/10" className="p-1.5 sm:p-5" />
                  <StatItem label="סה״כ" value={filteredItems.length} icon={MessageSquare} color="text-primary" bgColor="bg-primary/10" className="p-1.5 sm:p-5" />
                </div>

                {/* Modern Toolbar - Optimized for Mobile */}
                <Card className="bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-2 sm:p-4 flex items-center justify-between gap-2 sm:gap-4 shadow-sm">
                  <div className="flex items-center gap-1.5 sm:gap-3 flex-1 min-w-0">
                    <div className="relative flex-1 max-w-sm">
                      <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 sm:w-4 h-4 text-muted-foreground" />
                      <input 
                        type="text"
                        placeholder="חיפוש פנייה..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full h-9 sm:h-10 pr-9 sm:pr-10 pl-4 bg-background/50 border border-border/50 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground placeholder:text-muted-foreground"
                      />
                    </div>

                    <div className="flex items-center gap-1.5 lg:gap-2">
                      {/* Filter Trigger (Mobile) / Selects (Desktop) */}
                      <div className="hidden lg:flex items-center gap-2">
                        <select value={adminFilter} onChange={(e) => setAdminFilter(e.target.value as any)} className="h-10 px-4 bg-background/50 border border-border/50 rounded-xl text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] cursor-pointer shadow-sm">
                          <option value="pending">ממתין לטיפול</option>
                          <option value="done">טופל בהצלחה</option>
                          <option value="dismissed">ארכיון</option>
                          <option value="all">כל הסטטוסים</option>
                        </select>
                        <select value={adminCategoryFilter} onChange={(e) => setAdminCategoryFilter(e.target.value as any)} className="h-10 px-4 bg-background/50 border border-border/50 rounded-xl text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/20 min-w-[140px] cursor-pointer shadow-sm">
                          <option value="all">כל הסוגים</option>
                          <option value="bug">באג במערכת</option>
                          <option value="improvement">הצעה לשיפור</option>
                          <option value="feature">פיצ'ר חדש</option>
                          <option value="support">קריאת תמיכה</option>
                        </select>
                      </div>

                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => setIsFilterOpen(true)}
                        className="lg:hidden h-9 w-9 rounded-xl border-border/40 bg-card/40 backdrop-blur-xl text-primary"
                      >
                        <Filter className="w-4 h-4" />
                      </Button>

                      <Button 
                        variant="outline" 
                        size="icon"
                        className="h-9 w-9 sm:h-10 sm:w-10 rounded-xl border-border/40 bg-card/40 backdrop-blur-xl text-primary shadow-sm hover:bg-primary/5 active:scale-95 transition-all" 
                        onClick={isAdmin ? fetchAdminTickets : fetchMyTickets} 
                        disabled={isLoadingTickets}
                      >
                        <RefreshCw className={cn("w-3.5 h-3.5 sm:w-4 h-4", isLoadingTickets && "animate-spin")} />
                      </Button>
                    </div>
                  </div>
                </Card>

                {/* Mobile Filter Dialog */}
                <Dialog open={isFilterOpen} onOpenChange={setIsFilterOpen}>
                  <DialogContent className="p-0 border-none sm:max-w-lg overflow-hidden rounded-t-[2rem] sm:rounded-[2rem] bottom-0 sm:bottom-auto fixed sm:relative translate-y-0 sm:-translate-y-1/2">
                    <div className="p-6 space-y-6 bg-card/95 backdrop-blur-xl">
                      <div className="flex items-center justify-between">
                        <h3 className="text-base font-black text-foreground flex items-center gap-2">
                          <Filter className="w-5 h-5 text-primary" />
                          סינון פניות
                        </h3>
                        <Button variant="ghost" size="icon" onClick={() => setIsFilterOpen(false)} className="rounded-full">
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">סטטוס פנייה</label>
                          <select 
                            value={adminFilter} 
                            onChange={(e) => setAdminFilter(e.target.value as any)}
                            className="w-full h-12 px-4 bg-background/50 border border-border/50 rounded-2xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="pending">ממתין לטיפול</option>
                            <option value="done">טופל בהצלחה</option>
                            <option value="dismissed">ארכיון</option>
                            <option value="all">כל הסטטוסים</option>
                          </select>
                        </div>

                        <div className="space-y-2">
                          <label className="text-xs font-black text-muted-foreground uppercase tracking-widest px-1">סוג פנייה</label>
                          <select 
                            value={adminCategoryFilter} 
                            onChange={(e) => setAdminCategoryFilter(e.target.value as any)}
                            className="w-full h-12 px-4 bg-background/50 border border-border/50 rounded-2xl text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-primary/20"
                          >
                            <option value="all">כל הסוגים</option>
                            <option value="bug">באג במערכת</option>
                            <option value="improvement">הצעה לשיפור</option>
                            <option value="feature">פיצ'ר חדש</option>
                            <option value="support">קריאת תמיכה</option>
                          </select>
                        </div>
                      </div>

                      <Button 
                        onClick={() => setIsFilterOpen(false)}
                        className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-black shadow-lg shadow-primary/20"
                      >
                        החל סינון
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                {/* Stylized Cards List */}
                <div className="space-y-3">
                  {filteredItems.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                       <Sparkles className="w-12 h-12 text-muted-foreground/30 mb-3" />
                       <h3 className="text-sm font-black text-foreground">אין פניות תואמות</h3>
                       <p className="text-xs text-muted-foreground mt-1">לא נמצאו פניות שעונות לסינון שהגדרת.</p>
                    </div>
                  ) : filteredItems.map(item => (
                    <Card key={`${item.type}-${item.id}`} onClick={() => setSelectedItem({data: item, type: item.type})} className="group bg-card/40 border border-border/40 backdrop-blur-xl rounded-3xl p-4 sm:p-5 hover:bg-card/60 hover:border-primary/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 shadow-sm active:scale-[0.98]">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-sm sm:text-base shrink-0 border border-primary/20">
                          {(item.type === 'feedback' ? item.first_name?.[0] : item.full_name?.[0]) || 'U'}
                        </div>
                        <div className="space-y-1 flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-foreground truncate">{item.type === 'feedback' ? `${item.first_name} ${item.last_name}` : item.full_name}</span>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full shrink-0">{new Date(item.created_at).toLocaleDateString('he-IL')}</span>
                          </div>
                          <p className="text-xs font-medium text-muted-foreground line-clamp-1 opacity-70">{item.description}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between sm:justify-end gap-4 mt-1 sm:mt-0 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/10">
                        {getStatusBadge(item.status)}
                        <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-1 group-hover:translate-x-0" />
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'messages' && (
              <motion.div key="messages-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <Card className="bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
                  <div>
                    <h2 className="text-lg font-black text-foreground tracking-tight">לוח הודעות פנימי</h2>
                    <p className="text-xs text-muted-foreground">התכתבויות מאובטחות עם מפקדים אחרים ביחידה.</p>
                  </div>
                  <Button onClick={() => setComposeOpen(true)} className="h-10 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">
                    <Send className="w-4 h-4 ml-2" />
                    הודעה חדשה
                  </Button>
                </Card>
                
                <div className="space-y-3">
                  {internalMessages.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                       <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                       <h3 className="text-sm font-black text-foreground">אין הודעות פנימיות</h3>
                       <p className="text-xs text-muted-foreground mt-1">לחץ על הודעה חדשה כדי להתחיל התכתבות.</p>
                    </div>
                  ) : internalMessages.map(msg => (
                    <Card key={msg.id} onClick={() => {
                        openChat({
                          id: msg.other_id,
                          name: `${msg.other_first} ${msg.other_last}`,
                          role: "מפקד"
                        });
                    }} className="group bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 hover:bg-card/60 hover:border-primary/30 transition-all cursor-pointer flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="flex items-center gap-4 flex-1">
                        <div className={cn("w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm shrink-0 border", msg.direction === 'received' ? "bg-indigo-500/10 text-indigo-400 border-indigo-500/20" : "bg-muted text-muted-foreground border-border")}>
                          {msg.direction === 'received' ? 'נכנס' : 'יוצא'}
                        </div>
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-black text-sm text-foreground">{msg.other_first} {msg.other_last}</span>
                            <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{new Date(msg.created_at).toLocaleString('he-IL', {day: '2-digit', month: '2-digit', hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-sm font-black text-foreground leading-tight">{msg.title}</p>
                          <p className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-xl">{msg.description}</p>
                        </div>
                      </div>
                      <ChevronLeft className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0 hidden sm:block" />
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'my-tickets' && (
              <motion.div key="history-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                <div className="space-y-3">
                  {myTickets.length === 0 ? (
                    <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                       <Archive className="w-12 h-12 text-muted-foreground/30 mb-3" />
                       <h3 className="text-sm font-black text-foreground">אין פניות היסטוריות</h3>
                    </div>
                  ) : myTickets.map(ticket => (
                    <Card key={ticket.id} className="group bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 hover:bg-card/60 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div className="space-y-1 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-black text-sm text-foreground">{ticket.category}</span>
                          <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">{new Date(ticket.created_at).toLocaleDateString('he-IL')}</span>
                        </div>
                        <p className="text-xs font-medium text-muted-foreground line-clamp-1 max-w-xl">{ticket.description}</p>
                        {ticket.admin_reply && (
                           <div className="mt-2 p-3 bg-primary/5 border border-primary/10 rounded-xl">
                             <p className="text-[10px] font-black uppercase text-primary/70 mb-1">תשובת צוות ניהול</p>
                             <p className="text-xs font-bold text-foreground">{ticket.admin_reply}</p>
                           </div>
                        )}
                      </div>
                      <div className="self-start sm:self-center">
                        {getStatusBadge(ticket.status)}
                      </div>
                    </Card>
                  ))}
                </div>
              </motion.div>
            )}
            
            {activeTab === 'chat-admin' && isAdmin && (
              <motion.div key="chat-admin-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
                <Card className="bg-card/40 border border-border/40 backdrop-blur-xl rounded-2xl p-4 flex items-center justify-between">
                  <div>
                    <h2 className="text-base font-black text-foreground">גיבוי התכתבויות</h2>
                    <p className="text-xs text-muted-foreground">כל השיחות הפנימיות — לחץ לצפייה וייצוא</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl text-xs font-black" onClick={fetchAllConversations}>
                    <RefreshCw className="w-3.5 h-3.5 ml-1.5" />רענן
                  </Button>
                </Card>

                {selectedConvExport ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <Button variant="ghost" size="sm" className="rounded-xl text-xs font-black" onClick={() => { setSelectedConvExport(null); setConvMessages([]); }}>
                        <ChevronLeft className="w-4 h-4 ml-1" />חזרה לרשימה
                      </Button>
                      <span className="text-sm font-black text-foreground">{selectedConvExport.user1_name} ↔ {selectedConvExport.user2_name}</span>
                      <Button size="sm" className="mr-auto rounded-xl text-xs font-black bg-primary hover:bg-primary/90" onClick={() => handleExportJson(selectedConvExport)}>
                        <Download className="w-3.5 h-3.5 ml-1.5" />ייצוא JSON
                      </Button>
                    </div>
                    <Card className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
                      {loadingConv ? (
                        <div className="p-10 text-center text-xs text-muted-foreground">טוען...</div>
                      ) : convMessages.length === 0 ? (
                        <div className="p-10 text-center text-xs text-muted-foreground">אין הודעות</div>
                      ) : (
                        <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                          {convMessages.map((msg: any) => (
                            <div key={msg.id} className="p-4 flex gap-3">
                              <div className="w-8 h-8 rounded-xl bg-primary/10 text-primary flex items-center justify-center text-xs font-black shrink-0">
                                {msg.sender_first?.[0]}{msg.sender_last?.[0]}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <span className="text-xs font-black text-foreground">{msg.sender_first} {msg.sender_last}</span>
                                  <span className="text-[10px] text-muted-foreground">{new Date(msg.created_at).toLocaleString('he-IL')}</span>
                                  {(msg.is_deleted_by_sender || msg.is_deleted_by_recipient) && (
                                    <span className="text-[9px] bg-destructive/10 text-destructive px-1.5 py-0.5 rounded-full font-bold">נמחק מהתצוגה</span>
                                  )}
                                </div>
                                <p className="text-xs text-foreground">{msg.description}</p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </Card>
                  </div>
                ) : (
                  <Card className="bg-card/40 border border-border/40 rounded-2xl overflow-hidden">
                    {allConversations.length === 0 ? (
                      <div className="py-12 flex flex-col items-center justify-center text-center">
                        <MessageSquare className="w-12 h-12 text-muted-foreground/30 mb-3" />
                        <h3 className="text-sm font-black">אין התכתבויות במערכת</h3>
                      </div>
                    ) : (
                      <>
                        <div className="flex flex-col sm:flex-row gap-3 px-5 py-4 border-b border-border/40">
                          <div className="relative flex-1">
                            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <input
                              type="text"
                              placeholder="חיפוש לפי שם..."
                              value={convSearch}
                              onChange={(e) => setConvSearch(e.target.value)}
                              className="w-full h-9 pr-9 pl-4 bg-background/50 border border-border/50 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all text-foreground"
                            />
                          </div>
                          <select
                            value={convSortBy}
                            onChange={(e) => setConvSortBy(e.target.value as any)}
                            className="h-9 px-3 bg-background/50 border border-border/50 rounded-xl text-xs font-black text-foreground outline-none focus:ring-2 focus:ring-primary/20 cursor-pointer w-full sm:w-auto"
                          >
                            <option value="name">מיון לפי שם (א-ת)</option>
                            <option value="date">מיון לפי תאריך</option>
                            <option value="count">מיון לפי כמות הודעות</option>
                          </select>
                        </div>
                        {/* Table Header */}
                        <div className="hidden sm:grid grid-cols-[1fr_auto_auto_auto] items-center gap-4 px-5 py-3 border-b border-border/40 bg-muted/20">
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">משתתפים</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-24">הודעות</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-28">תאריך אחרון</span>
                          <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground text-center w-28">פעולות</span>
                        </div>
                        {/* Rows */}
                        <div className="divide-y divide-border/30 max-h-[60vh] overflow-y-auto">
                          {sortedConversations.length === 0 ? (
                             <div className="p-8 text-center text-xs font-bold text-muted-foreground">לא נמצאו תוצאות לחיפוש.</div>
                          ) : sortedConversations.map((conv: any, idx: number) => (
                            <div key={idx} className="grid grid-cols-1 sm:grid-cols-[1fr_auto_auto_auto] items-center gap-3 sm:gap-4 px-4 sm:px-5 py-3.5 hover:bg-muted/20 transition-colors">
                              {/* Users */}
                              <div className="flex items-center gap-3 min-w-0">
                                <div className="flex -space-x-2 rtl:space-x-reverse shrink-0">
                                  <div className="w-8 h-8 rounded-full bg-primary/15 text-primary border-2 border-card flex items-center justify-center text-[11px] font-black z-10">
                                    {conv.user1_name?.[0]}
                                  </div>
                                  <div className="w-8 h-8 rounded-full bg-indigo-500/15 text-indigo-500 border-2 border-card flex items-center justify-center text-[11px] font-black">
                                    {conv.user2_name?.[0]}
                                  </div>
                                </div>
                                <div className="min-w-0">
                                  <p className="text-sm font-black text-foreground leading-tight">
                                    {conv.user1_name}
                                    <span className="mx-1.5 text-muted-foreground/40 font-normal">↔</span>
                                    {conv.user2_name}
                                  </p>
                                </div>
                              </div>
                              {/* Count */}
                              <div className="flex justify-start sm:justify-center w-24">
                                <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[11px] font-black px-2.5 py-1 rounded-full border border-primary/20">
                                  <MessageSquare className="w-3 h-3" />
                                  {conv.total_messages}
                                </span>
                              </div>
                              {/* Date */}
                              <div className="hidden sm:flex justify-center w-28">
                                <span className="text-[11px] text-muted-foreground font-bold">
                                  {conv.last_message_at ? new Date(conv.last_message_at).toLocaleDateString('he-IL') : '—'}
                                </span>
                              </div>
                              {/* Actions */}
                              <div className="flex items-center gap-1.5 justify-start sm:justify-center w-28">
                                <button
                                  className="h-7 px-2.5 rounded-lg text-[11px] font-black text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors flex items-center gap-1"
                                  onClick={() => { setSelectedConvExport(conv); fetchConvMessages(conv.user1_id, conv.user2_id); }}
                                >
                                  <Eye className="w-3.5 h-3.5" />צפה
                                </button>
                                <button
                                  className="h-7 px-2.5 rounded-lg text-[11px] font-black text-muted-foreground hover:text-emerald-600 hover:bg-emerald-500/10 transition-colors flex items-center gap-1"
                                  onClick={async () => { setSelectedConvExport(conv); await fetchConvMessages(conv.user1_id, conv.user2_id); handleExportJson(conv); }}
                                >
                                  <Download className="w-3.5 h-3.5" />ייצא
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </>
                    )}
                  </Card>
                )}
              </motion.div>
            )}

            {activeTab === 'whats-new' && (
               <motion.div key="whats-new-tab" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-6">
                 <div className="py-12 flex flex-col items-center justify-center text-center bg-card/20 rounded-3xl border border-dashed border-border/50">
                   <Sparkles className="w-12 h-12 text-primary mb-3" />
                   <h3 className="text-lg font-black text-foreground">אין עדכונים חדשים</h3>
                   <p className="text-sm text-muted-foreground mt-1">המערכת מעודכנת לגרסה האחרונה.</p>
                 </div>
               </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>

      {/* Detail Slider */}
      <AnimatePresence>
        {selectedItem && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedItem(null)} className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]" />
            <motion.div initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} className="fixed top-0 right-0 h-screen w-full sm:w-[450px] bg-card border-r border-border/50 shadow-2xl z-[250] flex flex-col">
              <div className="p-4 sm:p-6 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-xl">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20"><User className="w-4 h-4 sm:w-5 sm:h-5" /></div>
                  <div>
                    <h3 className="font-black text-xs sm:text-sm text-foreground truncate max-w-[180px] sm:max-w-none">{selectedItem.type === 'feedback' ? `${(selectedItem.data as any).first_name} ${(selectedItem.data as any).last_name}` : (selectedItem.data as any).full_name}</h3>
                    <span className="text-[9px] sm:text-[10px] font-bold text-muted-foreground uppercase tracking-widest">{selectedItem.type === 'feedback' ? 'פניית משוב' : 'שיחת תמיכה'}</span>
                  </div>
                </div>
                <button onClick={() => setSelectedItem(null)} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all"><X className="w-5 h-5" /></button>
              </div>
              <div className="flex-grow p-6 overflow-y-auto space-y-6 custom-scrollbar">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">תוכן הפנייה</label>
                  <div className="p-4 bg-muted/30 rounded-2xl text-sm font-medium leading-relaxed text-foreground border border-border/50">{selectedItem.data.description}</div>
                </div>
                <div className="space-y-4">
                  <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">מענה רשמי</label>
                  <textarea value={replyText} onChange={(e) => setReplyText(e.target.value)} placeholder="כתוב כאן את התשובה..." className="w-full h-32 p-4 bg-background border border-border/50 rounded-2xl text-sm font-medium text-foreground focus:ring-2 focus:ring-primary/20 transition-all resize-none" />
                  <Button onClick={handleAdminReply} className="w-full h-12 rounded-xl font-black bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg shadow-primary/20">שליחת מענה</Button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Compose Message Dialog */}
      <AnimatePresence>
        {composeOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => setComposeOpen(false)} 
              className="fixed inset-0 bg-background/80 backdrop-blur-sm z-[200]" 
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }} 
              animate={{ opacity: 1, scale: 1, y: 0 }} 
              exit={{ opacity: 0, scale: 0.95, y: 20 }} 
              className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-card border border-border/50 rounded-3xl shadow-2xl z-[250] overflow-hidden p-6 sm:p-8 flex flex-col gap-6" 
              dir="rtl"
            >
               <div className="flex justify-between items-center pb-4 border-b border-border/50">
                  <div className="flex items-center gap-3">
                     <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary border border-primary/20 flex items-center justify-center rotate-3">
                       <MessageSquare className="w-6 h-6" />
                     </div>
                     <div>
                        <h3 className="font-black text-lg text-foreground tracking-tight">הודעה חדשה</h3>
                        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">שלח הודעה פנימית למפקד</p>
                     </div>
                  </div>
                  <button onClick={() => setComposeOpen(false)} className="p-2 text-muted-foreground hover:bg-muted rounded-xl transition-all">
                    <X className="w-5 h-5" />
                  </button>
               </div>
               
               <div className="space-y-5 overflow-y-auto max-h-[60vh] pr-2 custom-scrollbar">
                  {/* Recipient Selection Area */}
                  <div className="space-y-3">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">בחירת נמען</label>
                    
                    {availableCommanders.length > 0 ? (
                      <div className="space-y-3">
                        <div className="relative">
                          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
                          <input 
                            type="text"
                            placeholder="חיפוש לפי שם..."
                            value={recipientSearch}
                            onChange={(e) => setRecipientSearch(e.target.value)}
                            className="w-full h-10 pr-9 pl-4 bg-muted/30 border border-border/50 rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                          />
                        </div>

                        <div className="grid grid-cols-1 gap-1.5 max-h-48 overflow-y-auto p-1">
                          {availableCommanders
                            .filter(c => !recipientSearch || `${c.first_name} ${c.last_name}`.toLowerCase().includes(recipientSearch.toLowerCase()))
                            .map(c => (
                              <button 
                                key={c.id}
                                onClick={() => setComposeTo(c.id.toString())}
                                className={cn(
                                  "flex items-center gap-3 p-2 rounded-xl transition-all border",
                                  composeTo === c.id.toString() 
                                    ? "bg-primary/10 border-primary/20 shadow-sm" 
                                    : "bg-background/40 border-transparent hover:bg-muted/50"
                                )}
                              >
                                <div className={cn(
                                  "w-8 h-8 rounded-lg flex items-center justify-center font-black text-[10px] shrink-0",
                                  composeTo === c.id.toString() ? "bg-primary text-white" : "bg-muted text-muted-foreground"
                                )}>
                                  {c.first_name?.[0]}{c.last_name?.[0]}
                                </div>
                                <div className="flex flex-col text-right min-w-0">
                                  <span className="text-xs font-bold text-foreground truncate">{c.first_name} {c.last_name}</span>
                                  <span className="text-[9px] font-medium text-muted-foreground truncate">{c.department_name || "מפקד"}</span>
                                </div>
                                {composeTo === c.id.toString() && (
                                  <CheckCircle2 className="w-4 h-4 text-primary mr-auto" />
                                )}
                              </button>
                            ))}
                        </div>
                      </div>
                    ) : (
                      <div className="p-6 text-center bg-muted/20 border border-dashed border-border rounded-2xl">
                        <p className="text-xs font-bold text-muted-foreground">לא נמצאו נמענים זמינים.</p>
                        <p className="text-[9px] text-muted-foreground/60 mt-1">יש להוסיף שוטרים/מפקדים למערכת כדי להתחיל התכתבות.</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">נושא ההודעה</label>
                    <input 
                      type="text" 
                      value={composeTitle} 
                      onChange={e => setComposeTitle(e.target.value)} 
                      placeholder="הזן כותרת עניינית..." 
                      className="w-full h-12 px-4 bg-background border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all outline-none" 
                    />
                  </div>
                  
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-muted-foreground tracking-widest px-1">תוכן ההודעה</label>
                    <textarea 
                      value={composeDesc} 
                      onChange={e => setComposeDesc(e.target.value)} 
                      placeholder="כתוב את הודעתך כאן..." 
                      className="w-full h-32 p-4 bg-background border border-border/50 rounded-xl text-sm font-bold text-foreground focus:ring-2 focus:ring-primary/20 transition-all resize-none outline-none custom-scrollbar" 
                    />
                  </div>
               </div>
               
               <Button 
                 onClick={handleSendInternalMessage} 
                 disabled={!composeTo || !composeTitle || !composeDesc} 
                 className="w-full h-14 rounded-2xl bg-primary hover:bg-primary/90 text-primary-foreground font-black text-base shadow-lg shadow-primary/20 active:scale-[0.98] transition-all mt-2"
               >
                 <Send className="w-5 h-5 ml-2" />
                 שלח הודעה כעת
               </Button>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
};

function TabButton({ active, onClick, icon, label, className }: any) {
  return (
    <button 
      onClick={onClick} 
      className={cn(
        "transition-all flex flex-col sm:flex-row items-center justify-center sm:justify-start gap-1.5 sm:gap-2.5 border outline-none active:scale-95",
        "p-3 sm:px-5 sm:py-2.5 rounded-2xl sm:rounded-xl min-h-[70px] sm:min-h-0",
        active 
          ? "bg-primary/20 text-primary border-primary/50 shadow-md shadow-primary/5 scale-[1.02] z-10" 
          : "bg-card/40 text-muted-foreground hover:text-foreground border-border/40 hover:bg-card/60",
        className
      )}
    >
      <div className={cn(
        "w-8 h-8 sm:w-auto sm:h-auto flex items-center justify-center rounded-lg transition-colors",
        active ? "bg-primary/20 text-primary" : "bg-primary/10 text-primary"
      )}>
        {icon}
      </div>
      <span className="text-[10px] sm:text-xs font-black tracking-tight sm:tracking-normal leading-tight">
        {label}
      </span>
    </button>
  );
}

function StatItem({ label, value, sub, icon: Icon, color, bgColor, className }: any) {
  return (
    <Card className={cn("aspect-square border border-border/40 p-2 sm:p-4 rounded-2xl sm:rounded-[2rem] bg-card/40 backdrop-blur-xl shadow-sm hover:bg-card/60 transition-all flex flex-col items-center justify-center text-center group", className)}>
      <div className={cn("w-8 h-8 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center mb-1.5 sm:mb-3 transition-transform group-hover:scale-110 shadow-sm", bgColor)}>
        <Icon className={cn("w-4 h-4 sm:w-6 sm:h-6", color)} />
      </div>
      <div className="flex flex-col items-center w-full min-w-0">
        <p className={cn("text-lg sm:text-3xl font-black leading-none", color || "text-foreground")}>{value}</p>
        <p className="text-[7px] sm:text-[10px] font-black text-muted-foreground uppercase tracking-tighter mt-1 sm:mt-2 truncate w-full">{label}</p>
        {sub && <p className="text-[6px] sm:text-[9px] font-medium text-muted-foreground truncate mt-0.5">{sub}</p>}
      </div>
    </Card>
  );
}

export default FeedbackPage;
