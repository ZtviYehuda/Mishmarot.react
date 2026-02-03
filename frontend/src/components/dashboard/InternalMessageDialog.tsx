import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea"; // Assuming you have this
import { Label } from "@/components/ui/label";
import { Send, Loader2 } from "lucide-react";
import apiClient from "@/config/api.client";
import { toast } from "sonner";

interface InternalMessageDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipient: {
    id: number;
    name: string;
    role?: string;
  } | null;
  defaultTitle?: string;
  defaultDescription?: string;
}

export function InternalMessageDialog({
  open,
  onOpenChange,
  recipient,
  defaultTitle = "",
  defaultDescription = "",
}: InternalMessageDialogProps) {
  const [title, setTitle] = useState(defaultTitle);
  const [description, setDescription] = useState(defaultDescription);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open) {
      setTitle(defaultTitle);
      setDescription(defaultDescription);
    }
  }, [open, defaultTitle, defaultDescription]);

  const handleSend = async () => {
    if (!recipient || !title) return;

    setLoading(true);
    try {
      await apiClient.post("/notifications/send", {
        recipient_id: recipient.id,
        title,
        description,
      });

      toast.success("הודעה נשלחה בהצלחה", {
        description: `ההודעה נשלחה למפקד ${recipient.name}`,
      });
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to send message:", error);
      toast.error("שגיאה בשליחת ההודעה", {
        description: "אירעה שגיאה. נא לנסות שנית.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle>שליחת התראה למפקד</DialogTitle>
          <DialogDescription>שלח הודעה שתקפוץ למפקד במערכת.</DialogDescription>
        </DialogHeader>

        {recipient && (
          <div className="grid gap-4 py-4">
            <div className="bg-muted/50 p-3 rounded-lg text-sm">
              <span className="font-bold ml-2">נמען:</span>
              {recipient.name}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="title" className="text-right">
                נושא
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="נושא ההודעה..."
                className="text-right"
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="message" className="text-right">
                תוכן ההודעה
              </Label>
              <Textarea
                id="message"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="כתוב כאן..."
                className="text-right h-24"
              />
            </div>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            ביטול
          </Button>
          <Button onClick={handleSend} disabled={loading || !title}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                שולח...
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                שלח התראה
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
