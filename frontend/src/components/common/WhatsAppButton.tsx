import React from "react";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface WhatsAppButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    message?: string; // The text message to send
    phoneNumber?: string; // Target phone number (optional)
    label?: string; // Button text
    isLoading?: boolean;
    onBeforeSend?: () => Promise<void> | void; // Callback before opening WA
    skipDirectLink?: boolean; // If true, only executes onClick/onBeforeSend (for custom handling)
}

export const WhatsAppButton: React.FC<WhatsAppButtonProps> = ({
    message = "",
    phoneNumber = "",
    label = "WhatsApp",
    isLoading = false,
    className,
    onBeforeSend,
    skipDirectLink = false,
    onClick,
    disabled,
    ...props
}) => {

    const handleSend = async (e: React.MouseEvent<HTMLButtonElement>) => {
        // Execute custom click handler if provided
        if (onClick) {
            onClick(e);
        }

        // Execute async preparation logic
        if (onBeforeSend) {
            await onBeforeSend();
        }

        // If we simply wanted to trigger an action (like opening a modal), stop here
        if (skipDirectLink) return;

        try {
            // Prepare message
            const encodedMessage = encodeURIComponent(message);
            let url = "";

            if (phoneNumber && phoneNumber.trim()) {
                // Format phone number
                let formattedPhone = phoneNumber.replace(/\D/g, "");
                if (!formattedPhone.startsWith("972") && !formattedPhone.startsWith("1")) {
                    if (formattedPhone.startsWith("0")) formattedPhone = "972" + formattedPhone.substring(1);
                    else formattedPhone = "972" + formattedPhone;
                }
                url = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
            } else {
                // General link (opens WA Web/App to select contact)
                url = `https://wa.me/?text=${encodedMessage}`;
            }

            // Copy to clipboard as fallback/bonus
            try {
                await navigator.clipboard.writeText(message);
            } catch (err) {
                console.error("Clipboard copy failed", err);
            }

            // Open WhatsApp
            window.open(url, "_blank");
            toast.success("Opening WhatsApp...");

        } catch (error) {
            console.error("WhatsApp Error:", error);
            toast.error("Error opening WhatsApp");
        }
    };

    return (
        <Button
            onClick={handleSend}
            disabled={disabled || isLoading}
            className={cn(
                "bg-[#25D366] hover:bg-[#128C7E] text-white font-bold rounded-xl shadow-lg transition-all active:scale-95 gap-2",
                className
            )}
            {...props}
        >
            {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
                <FaWhatsapp className="w-5 h-5" />
            )}
            <span>{label}</span>
        </Button>
    );
};
