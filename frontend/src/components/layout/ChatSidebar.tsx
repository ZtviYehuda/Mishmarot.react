import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Send, 
  Loader2, 
  MessageSquare,
  MoreVertical,
  Phone,
  CheckCheck,
  ChevronLeft,
  Search
} from "lucide-react";
import { useChat } from "@/context/ChatContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useAuthContext } from "@/context/AuthContext";
import apiClient from "@/config/api.client";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { he } from "date-fns/locale";
import { useEmployeeContext } from "@/context/EmployeeContext";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { toast } from "sonner";
import { Trash2, UserCircle } from "lucide-react";

interface Message {
  id: number;
  sender_id: number;
  recipient_id: number;
  title: string;
  description: string;
  created_at: string;
  sender_first: string;
  sender_last: string;
}

export const ChatSidebar: React.FC = () => {
  const { isChatOpen, selectedRecipient, closeChat, openChat } = useChat();
  const { employees, openProfile } = useEmployeeContext();
  const { user } = useAuthContext();
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [contactSearch, setContactSearch] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isChatOpen && selectedRecipient) {
      fetchConversation();
      const interval = setInterval(fetchConversation, 5000); // Polling for new messages
      return () => clearInterval(interval);
    }
  }, [isChatOpen, selectedRecipient]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const fetchConversation = async () => {
    if (!selectedRecipient) return;
    try {
      const { data } = await apiClient.get(`/notifications/messages/conversation/${selectedRecipient.id}`);
      setMessages(data);
    } catch (err) {
      console.error("Failed to fetch conversation:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient || sending) return;

    setSending(true);
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: selectedRecipient.id,
        title: "הודעה חדשה בצ'אט",
        description: newMessage.trim(),
      });
      setNewMessage("");
      fetchConversation();
    } catch (err) {
      console.error("Failed to send message:", err);
    } finally {
      setSending(false);
    }
  };

  const handleClearHistory = async () => {
    if (!selectedRecipient) return;
    if (!confirm("האם אתה בטוח שברצונך למחוק את כל היסטוריית ההתכתבות עם משתמש זה? פעולה זו אינה ניתנת לביטול.")) return;
    
    try {
      await apiClient.delete(`/notifications/messages/conversation/${selectedRecipient.id}`);
      setMessages([]);
      toast.success("היסטוריית ההתכתבות נמחקה");
    } catch (err) {
      toast.error("שגיאה במחיקת היסטוריית ההתכתבות");
    }
  };

  return (
    <AnimatePresence>
      {isChatOpen && (
        <>
          {/* Backdrop for mobile */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeChat}
            className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[200] lg:hidden"
          />

          {/* Sidebar Panel */}
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: 0 }}
            exit={{ x: "-100%" }}
            transition={{ type: "spring", damping: 25, stiffness: 200 }}
            className="fixed top-0 left-0 h-dvh w-full sm:w-[400px] bg-card border-r border-border/50 shadow-2xl z-[250] flex flex-col overflow-hidden"
            dir="rtl"
          >
            {selectedRecipient ? (
              <>
                {/* Header for Conversation */}
                <div className="p-4 sm:p-6 border-b border-border/50 bg-card/50 backdrop-blur-xl flex items-center justify-between shrink-0">
                  <div className="flex items-center gap-3">
                    <Button variant="ghost" size="icon" onClick={() => openChat(null as any)} className="rounded-full h-8 w-8">
                      <ChevronLeft className="w-5 h-5 rotate-180" />
                    </Button>
                    <div 
                      className="relative cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => selectedRecipient && openProfile(selectedRecipient.id)}
                    >
                      <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center border border-primary/20 font-black">
                        {selectedRecipient.name?.[0]}
                      </div>
                      <div className="absolute -bottom-0.5 -left-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full" />
                    </div>
                    <div className="flex flex-col">
                      <h3 className="font-black text-sm sm:text-base text-foreground leading-tight">
                        {selectedRecipient.name}
                      </h3>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                        {selectedRecipient.role || "מחובר כעת"}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {selectedRecipient && (
                      <>
                        {(() => {
                          const emp = employees.find(e => e.id === selectedRecipient.id);
                          if (emp?.phone_number) {
                            return (
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="rounded-xl text-muted-foreground/60 hover:text-primary transition-colors"
                                onClick={() => window.location.href = `tel:${emp.phone_number}`}
                                title={`חיוג ל-${emp.phone_number}`}
                              >
                                <Phone className="w-4 h-4" />
                              </Button>
                            );
                          }
                          return null;
                        })()}
                      </>
                    )}
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="ghost" size="icon" className="rounded-xl text-muted-foreground/60 hover:text-primary transition-colors">
                          <MoreVertical className="w-4 h-4" />
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-48 p-1 rounded-xl shadow-xl border-border/40 backdrop-blur-xl bg-card/95" align="start">
                        <div className="flex flex-col gap-1">
                          <button
                            onClick={() => {
                              if (selectedRecipient) {
                                openProfile(selectedRecipient.id);
                              }
                            }}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-muted rounded-lg transition-colors text-right w-full"
                          >
                            <UserCircle className="w-4 h-4 text-primary" />
                            <span>צפה בפרופיל מלא</span>
                          </button>
                          
                          <div className="h-px bg-border/40 my-1" />
                          
                          <button
                            onClick={handleClearHistory}
                            className="flex items-center gap-2 px-3 py-2.5 text-xs font-bold hover:bg-destructive/10 text-destructive rounded-lg transition-colors text-right w-full"
                          >
                            <Trash2 className="w-4 h-4" />
                            <span>מחק היסטוריית צ'אט</span>
                          </button>
                        </div>
                      </PopoverContent>
                    </Popover>
                    <Button variant="ghost" size="icon" onClick={closeChat} className="hidden lg:flex rounded-xl text-muted-foreground hover:bg-muted">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div 
                  ref={scrollRef}
                  className="flex-grow overflow-y-auto p-4 sm:p-6 space-y-6 bg-slate-50/30 dark:bg-slate-900/10 custom-scrollbar"
                >
                  {loading ? (
                    <div className="h-full flex items-center justify-center opacity-30">
                      <Loader2 className="w-8 h-8 animate-spin" />
                    </div>
                  ) : messages.length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                      <div className="w-16 h-16 rounded-3xl bg-muted flex items-center justify-center mb-4">
                        <MessageSquare className="w-8 h-8" />
                      </div>
                      <h4 className="font-black text-sm mb-1">אין היסטוריית התכתבות</h4>
                      <p className="text-xs font-bold leading-relaxed">שלח הודעה ראשונה כדי להתחיל את השיחה.</p>
                    </div>
                  ) : (
                    <div className="flex flex-col space-y-4">
                       <div className="flex justify-center my-4">
                         <span className="text-[10px] font-black text-muted-foreground/60 uppercase bg-muted/30 px-3 py-1 rounded-full border border-border/40">היום</span>
                       </div>
                       {messages.map((msg, idx) => {
                         const isMe = msg.sender_id === user?.id;
                         const nextIsMe = messages[idx+1]?.sender_id === msg.sender_id;
                         return (
                           <motion.div initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} key={msg.id} className={cn("flex flex-col max-w-[85%] sm:max-w-[75%]", isMe ? "self-start items-end" : "self-end items-start")}>
                             {!nextIsMe && <span className="text-[9px] font-bold text-muted-foreground mb-1 mx-1">{format(new Date(msg.created_at), "HH:mm", { locale: he })}</span>}
                             <div className={cn("p-3 sm:p-4 rounded-3xl text-sm font-bold leading-relaxed shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-tl-lg" : "bg-card border border-border/40 text-foreground rounded-tr-lg")}>
                               {msg.description}
                               {isMe && <div className="flex justify-end mt-1 opacity-70"><CheckCheck className="w-3 h-3" /></div>}
                             </div>
                           </motion.div>
                         );
                       })}
                    </div>
                  )}
                </div>

                {/* Input Area */}
                <div className="p-4 sm:p-6 border-t border-border/50 bg-card shrink-0">
                  <form onSubmit={handleSendMessage} className="flex items-end gap-2 bg-muted/30 border border-border/50 rounded-2xl p-2 focus-within:ring-4 focus-within:ring-primary/10 transition-all">
                    <Input value={newMessage} onChange={(e) => setNewMessage(e.target.value)} placeholder="הקלד הודעה..." className="border-none bg-transparent focus-visible:ring-0 shadow-none text-right font-bold text-sm min-h-[44px] h-auto py-2" />
                    <Button type="submit" disabled={!newMessage.trim() || sending} size="icon" className={cn("rounded-xl h-10 w-10 shrink-0 shadow-lg transition-all active:scale-95", newMessage.trim() ? "bg-primary hover:bg-primary/90 text-primary-foreground" : "bg-muted text-muted-foreground")}>
                      {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </Button>
                  </form>
                </div>
              </>
            ) : (
              <>
                {/* Header for Contacts List */}
                <div className="p-6 border-b border-border/50 bg-card/50 backdrop-blur-xl shrink-0">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-black text-xl text-foreground tracking-tight">הודעות</h3>
                    <Button variant="ghost" size="icon" onClick={closeChat} className="rounded-xl text-muted-foreground">
                      <X className="w-5 h-5" />
                    </Button>
                  </div>
                  <div className="relative">
                    <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/60" />
                    <Input
                      placeholder="חיפוש איש קשר..."
                      value={contactSearch}
                      onChange={(e) => setContactSearch(e.target.value)}
                      className="pr-10 h-11 bg-muted/30 border-border/50 rounded-2xl text-xs font-bold"
                    />
                  </div>
                </div>

                {/* Contacts List */}
                <div className="flex-grow overflow-y-auto p-3 space-y-1 custom-scrollbar">
                   {employees
                    .filter((emp: any) => emp.id !== user?.id && (!contactSearch || `${emp.first_name} ${emp.last_name}`.toLowerCase().includes(contactSearch.toLowerCase())))
                    .map((emp: any) => (
                      <button
                        key={emp.id}
                        onClick={() => openChat({ id: emp.id, name: `${emp.first_name} ${emp.last_name}` })}
                        className="w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-muted/50 transition-all text-right group"
                      >
                        <div className="w-12 h-12 rounded-2xl bg-primary/5 text-primary flex items-center justify-center border border-primary/10 font-black group-hover:bg-primary group-hover:text-white transition-all">
                          {emp.first_name?.[0]}{emp.last_name?.[0]}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="font-bold text-sm text-foreground mb-0.5">{emp.first_name} {emp.last_name}</h4>
                          <p className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">{emp.section_name || emp.department_name || "שוטר"}</p>
                        </div>
                        <ChevronLeft className="w-4 h-4 text-muted-foreground/30 group-hover:text-primary transition-all" />
                      </button>
                    ))}
                    {employees.length <= 1 && (
                      <div className="p-8 text-center opacity-40">
                        <p className="text-xs font-bold">לא נמצאו אנשי קשר זמינים.</p>
                      </div>
                    )}
                </div>
              </>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};
