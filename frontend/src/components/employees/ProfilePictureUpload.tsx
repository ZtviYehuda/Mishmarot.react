import React, { useRef, useState } from "react";
import { Camera, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface ProfilePictureUploadProps {
  currentPicture?: string | null;
  onPictureChange: (base64Image: string | null) => void;
  employeeName?: string;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export const ProfilePictureUpload: React.FC<ProfilePictureUploadProps> = ({
  currentPicture,
  onPictureChange,
  employeeName = "שוטר",
  className,
  size = "md",
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(currentPicture || null);
  const [isHovering, setIsHovering] = useState(false);

  const sizeClasses = {
    sm: "w-20 h-20",
    md: "w-28 h-28",
    lg: "w-40 h-40",
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("יש לבחור קובץ תמונה בלבד");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("גודל התמונה חייב להיות קטן מ-2MB");
      return;
    }

    // Convert to base64
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setPreview(base64String);
      onPictureChange(base64String);
      toast.success("התמונה הועלתה בהצלחה");
    };
    reader.onerror = () => {
      toast.error("שגיאה בקריאת הקובץ");
    };
    reader.readAsDataURL(file);
  };

  const handleRemove = () => {
    setPreview(null);
    onPictureChange(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    toast.success("התמונה הוסרה");
  };

  const getInitials = () => {
    const names = employeeName.split(" ");
    if (names.length >= 2) {
      return names[0][0] + names[names.length - 1][0];
    }
    return employeeName[0] || "?";
  };

  return (
    <div className={cn("flex flex-col items-center gap-4", className)}>
      <div
        className="relative group"
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => setIsHovering(false)}
      >
        {/* Profile Picture Circle */}
        <div
          className={cn(
            sizeClasses[size],
            "rounded-full overflow-hidden border-4 border-primary/20 shadow-lg relative bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center transition-all duration-300",
            isHovering && "border-primary/40 shadow-xl scale-105",
          )}
        >
          {preview ? (
            <img
              src={preview}
              alt={employeeName}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-4xl font-black text-primary/60">
              {getInitials()}
            </span>
          )}

          {/* Hover Overlay */}
          <div
            className={cn(
              "absolute inset-0 bg-black/60 flex items-center justify-center transition-opacity duration-300",
              isHovering ? "opacity-100" : "opacity-0",
            )}
          >
            <Camera className="w-8 h-8 text-white" />
          </div>
        </div>

        {/* Remove Button (if picture exists) */}
        {preview && (
          <button
            onClick={handleRemove}
            className="absolute -top-2 -right-2 w-8 h-8 rounded-full bg-red-500 hover:bg-red-600 text-white flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
            title="הסר תמונה"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Upload Button */}
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => fileInputRef.current?.click()}
          className="gap-2"
        >
          <Upload className="w-4 h-4" />
          {preview ? "החלף תמונה" : "העלה תמונה"}
        </Button>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      <p className="text-xs text-muted-foreground text-center">
        תמונה עד 2MB • JPG, PNG, GIF
      </p>
    </div>
  );
};
