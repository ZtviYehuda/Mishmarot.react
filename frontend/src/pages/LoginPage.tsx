import { useState, useEffect, useRef } from "react";
import apiClient from "@/config/api.client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Loader2,
  AlertCircle,
  Lock,
  LogOut,
  ScanEye,
  Eye,
  EyeOff,
  Crosshair,
  Fingerprint,
  ArrowLeft,
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { PinVerificationModal } from "@/components/auth/PinVerificationModal";

interface LockedUser {
  username: string;
  first_name: string;
  last_name: string;
}

const HexagonPatrolGrid = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Complete premium dark mode operational atmosphere colors
    const colors = {
      bg: "#1A1D2D",
      hexOutline: "rgba(42, 47, 69, 0.45)", // flat hex grid color (#1A1D2D / slate blend)
      hexActiveBlue: "rgba(0, 116, 255, 0.45)", // glowing cyan/blue
      hexActiveRed: "rgba(239, 68, 68, 0.45)",
    };

    let animationFrameId: number;
    const hexSize = 28; // Radius of hexagon
    const hexWidth = Math.sqrt(3) * hexSize;
    const hexHeight = 2 * hexSize;
    const xStep = hexWidth;
    const yStep = hexHeight * 0.75;

    // Grid State
    let grid: {
      x: number;
      y: number;
      isGlowingNode: boolean;
      pulsePhase: number;
      pulseSpeed: number;
    }[] = [];

    const initGrid = () => {
      grid = [];
      const cols = Math.ceil(canvas.width / xStep) + 2;
      const rows = Math.ceil(canvas.height / yStep) + 2;

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const xOffset = (r % 2) * (hexWidth / 2);
          const x = c * xStep + xOffset - hexWidth;
          const y = r * yStep - hexHeight;

          grid.push({
            x,
            y,
            isGlowingNode: Math.random() > 0.96, // 4% chance to be an operational glowing node
            pulsePhase: Math.random() * Math.PI * 2,
            pulseSpeed: 0.01 + Math.random() * 0.015,
          });
        }
      }
    };

    const drawHexagon = (x: number, y: number, r: number) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6; // Start at 30 degrees for flat top
        ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.stroke();
    };

    const fillHexagon = (x: number, y: number, r: number, color: string) => {
      ctx.beginPath();
      for (let i = 0; i < 6; i++) {
        const angle = (Math.PI / 3) * i - Math.PI / 6;
        ctx.lineTo(x + r * Math.cos(angle), y + r * Math.sin(angle));
      }
      ctx.closePath();
      ctx.fillStyle = color;
      ctx.fill();
    };

    const resize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initGrid();
    };

    const draw = () => {
      // Background base fill
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      grid.forEach((hex) => {
        // Draw flat, static hexagon grid line
        ctx.strokeStyle = colors.hexOutline;
        ctx.lineWidth = 1;
        drawHexagon(hex.x, hex.y, hexSize - 2);

        // If it is a marked operational node, draw a gentle glowing aura and glowing border
        if (hex.isGlowingNode) {
          hex.pulsePhase += hex.pulseSpeed;
          const pulseOpacity = 0.08 + Math.sin(hex.pulsePhase) * 0.08; // dynamic subtle pulsing

          fillHexagon(hex.x, hex.y, hexSize - 3, `rgba(0, 116, 255, ${pulseOpacity})`);
          
          ctx.strokeStyle = `rgba(0, 116, 255, ${0.15 + pulseOpacity * 2.5})`;
          ctx.lineWidth = 1.25;
          drawHexagon(hex.x, hex.y, hexSize - 2);
        }

        // Mouse hover interaction (flashlight glow)
        const dx = mousePos.x - hex.x;
        const dy = mousePos.y - hex.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < 160) {
          const hoverOpacity = (160 - dist) / 500; // max 0.32 opacity
          fillHexagon(hex.x, hex.y, hexSize - 3, `rgba(0, 116, 255, ${hoverOpacity * 0.5})`);
          ctx.strokeStyle = `rgba(0, 116, 255, ${hoverOpacity})`;
          ctx.lineWidth = 1;
          drawHexagon(hex.x, hex.y, hexSize - 2);
        }
      });

      animationFrameId = requestAnimationFrame(draw);
    };

    window.addEventListener("mousemove", (e) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    });

    window.addEventListener("resize", resize);
    resize();
    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [mousePos]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 bg-[#1A1D2D]"
    />
  );
};

export default function LoginPage() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockedUser, setLockedUser] = useState<LockedUser | null>(null);
  const navigate = useNavigate();
  const { theme } = useTheme();
  const [isBiometricAvailable, setIsBiometricAvailable] = useState(false);
  const [showPinModal, setShowPinModal] = useState(false);
  const [pinUsername, setPinUsername] = useState("");
  const { login, refreshUser } = useAuthContext();

  // WebAuthn Helpers (Matching ProfileSettings)
  const base64urlToBytes = (base64url: string): Uint8Array => {
    const base64 = base64url.replace(/-/g, "+").replace(/_/g, "/");
    const padLen = (4 - (base64.length % 4)) % 4;
    const padded = base64 + "=".repeat(padLen);
    const binary = window.atob(padded);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  };

  const bufferToBase64url = (buffer: ArrayBuffer): string => {
    const bytes = new Uint8Array(buffer);
    let binary = "";
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  };

  // Check if WebAuthn is supported
  const isWebAuthnSupported = typeof window !== "undefined" && !!window.PublicKeyCredential;
  const isCredentialManagerSupported = typeof window !== "undefined" && !!(window as any).PasswordCredential;

  useEffect(() => {
    // Check if quick login is available
    const lastUser = localStorage.getItem("biometric_last_user");
    const hasRegistration = lastUser && localStorage.getItem(`biometric_registered_${lastUser}`);
    
    if (isWebAuthnSupported) {
      setIsBiometricAvailable(true);
      // Auto-trigger biometric on mount if supported, a user is remembered, and not already loading
      if (lastUser && !isLoading) {
        // We delay slightly to let the UI settle
        const timer = setTimeout(() => {
          handleBiometricLogin();
        }, 800);
        return () => clearTimeout(timer);
      }
    } else {
      setIsBiometricAvailable(!!hasRegistration);
    }
  }, []);

  // Hash function matching ProfileSettings
  const hashPin = async (pin: string, username: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(pin + username);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const handleBiometricLogin = async () => {
    setError("");
    let targetUsername = lockedUser?.username 
      || username.trim() 
      || localStorage.getItem("biometric_last_user");

    if (!targetUsername) {
      setError("יש להזין שם משתמש כדי להשתמש בכניסה ביומטרית");
      return;
    }

    if (isWebAuthnSupported) {
      try {
        setIsLoading(true);
        
        // Step 1: Get authentication options from server
        const optionsResp = await apiClient.post("/auth/webauthn/login/options", {
          username: targetUsername
        });
        const options = optionsResp.data;

        // Transform options for the browser
        const assertionOptions: CredentialRequestOptions = {
          publicKey: {
            ...options,
            challenge: base64urlToBytes(options.challenge),
            allowCredentials: options.allowCredentials?.map((cred: any) => ({
              ...cred,
              id: base64urlToBytes(cred.id),
            })),
          },
        };

        // Step 2: Trigger the OS biometric prompt
        const assertion = await navigator.credentials.get(assertionOptions) as any;

        if (!assertion) {
          throw new Error("לא התקבלו נתוני אימות מהמכשיר");
        }

        // Step 3: Prepare verify data for the server
        const verifyData = {
          id: assertion.id,
          rawId: bufferToBase64url(assertion.rawId),
          type: assertion.type,
          response: {
            authenticatorData: bufferToBase64url(assertion.response.authenticatorData),
            clientDataJSON: bufferToBase64url(assertion.response.clientDataJSON),
            signature: bufferToBase64url(assertion.response.signature),
            userHandle: assertion.response.userHandle ? bufferToBase64url(assertion.response.userHandle) : undefined,
          },
        };

        // Step 4: Finalize login with server
        const response = await apiClient.post("/auth/webauthn/login/verify", verifyData);
        
        if (response.data?.success) {
          const { token, user: loggedUser } = response.data;
          
          // Use the login function from AuthContext to set state
          // We might need to handle the state manually if context login expects username/pass
          // Actually, our verify endpoint returns the token and user, same as login.
          // Let's assume context.login can accept partials or we update localstorage.
          localStorage.setItem("token", token);
          localStorage.setItem("user", JSON.stringify(loggedUser));
          localStorage.setItem("biometric_last_user", targetUsername);
          
          await refreshUser(); // Essential to update context state
          navigate("/", { replace: true });
          return;
        }

      } catch (e: any) {
        console.error("WebAuthn login failed:", e);
        
        if (e.name === "NotAllowedError") {
          setIsLoading(false); // Silent fail on user cancel
          return;
        }

        // Fallback to PIN if Passkey fails and we have a PIN setup
        if (localStorage.getItem(`biometric_pin_${targetUsername}`)) {
          setPinUsername(targetUsername);
          setShowPinModal(true);
          setIsLoading(false);
          return;
        }
        
        setError(e.response?.data?.error || "זיהוי ביומטרי נכשל. התחבר ידנית או באמצעות PIN.");
      }
      setIsLoading(false);
      return;
    }

    // Fallback: PIN-based quick login
    targetUsername = lockedUser?.username
      || (username.trim() || null)
      || localStorage.getItem("biometric_last_user");

    if (!targetUsername) {
      setError("הזן שם משתמש כדי להשתמש בכניסה מהירה");
      return;
    }

    const hasRegistration = localStorage.getItem(`biometric_registered_${targetUsername}`);
    if (!hasRegistration) {
      setError("יש להפעיל כניסה מהירה בהגדרות המשתמש תחילה");
      return;
    }

    // Open PIN verification modal
    setPinUsername(targetUsername);
    setShowPinModal(true);
  };

  const handleVerifyPin = async (enteredPin: string): Promise<boolean> => {
    try {
      // Hash the entered PIN
      const enteredPinHash = await hashPin(enteredPin, pinUsername);

      // Get stored PIN hash
      const storedPinHash = localStorage.getItem(`biometric_pin_${pinUsername}`);

      if (!storedPinHash || enteredPinHash !== storedPinHash) {
        return false;
      }

      const refreshToken = localStorage.getItem(`biometric_refresh_${pinUsername}`);
      if (!refreshToken) {
        throw new Error("לכדי כניסה מהירה יש להגדיר PIN מחדש בהגדרות הפרופיל");
      }

      setIsLoading(true);

      // Attempt refresh-token login
      const { data } = await apiClient.post("/auth/refresh-token", {
        refresh_token: refreshToken,
      });

      if (!data?.success || !data?.accessToken) {
        throw new Error("כשל ניסיון רענון אימות. אנא התחבר באמצעות שם משתמש וסיסמה.");
      }

      localStorage.setItem("token", data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem(`biometric_refresh_${pinUsername}`, data.refreshToken);
      }
      localStorage.setItem("biometric_last_user", pinUsername);

      await refreshUser();
      setShowPinModal(false);
      navigate("/", { replace: true });
      return true;
    } catch (err: any) {
      console.error("PIN verification error:", err);
      setShowPinModal(false);
      if (err.response?.status === 401 || err.message?.includes("כשל")) {
        localStorage.removeItem(`biometric_refresh_${pinUsername}`);
        localStorage.removeItem(`biometric_pin_${pinUsername}`);
        localStorage.removeItem(`biometric_registered_${pinUsername}`);
      }
      setError(err.response?.data?.error || err.message || "שגיאה באימות");
      setIsLoading(false);
      return false;
    }
  };

  useEffect(() => {
    const savedLockedUser = localStorage.getItem("locked_user");
    if (savedLockedUser) {
      try {
        const user = JSON.parse(savedLockedUser);
        setLockedUser(user);
        setUsername(user.username || "");
      } catch (e) {
        console.error("Failed to parse locked user", e);
        localStorage.removeItem("locked_user");
      }
    }
  }, []);

  // Save credentials after successful login (triggers browser's native biometric save)
  const saveCredentials = async (uname: string, pass: string) => {
    if (!isCredentialManagerSupported) return;
    try {
      const cred = new (window as any).PasswordCredential({
        id: uname,
        password: pass,
        name: uname,
      });
      await navigator.credentials.store(cred);
      localStorage.setItem("biometric_last_user", uname);
      localStorage.setItem(`biometric_registered_${uname}`, "1");
    } catch (e) {
      console.log("Credential Manager save skipped:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!username.trim() || !password.trim()) {
      setError("יש למלא שם משתמש וסיסמה");
      return;
    }

    setIsLoading(true);

    try {
      const trimmedUser = username.trim();
      const trimmedPass = password.trim();
      const success = await login(trimmedUser, trimmedPass);
      if (success) {
        // Save credentials for biometric login next time
        await saveCredentials(trimmedUser, trimmedPass);
        navigate("/", { replace: true });
      } else {
        setError("שם משתמש או סיסמה שגויים.");
        setPassword("");
      }
    } catch (err) {
      setError("שגיאת מערכת. אנא נסה שוב מאוחר יותר.");
      setPassword("");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("locked_user");
    setLockedUser(null);
    setUsername("");
    setPassword("");
    setError("");
  };

  // Focus states for floating labels
  const [focusUsername, setFocusUsername] = useState(false);
  const [focusPassword, setFocusPassword] = useState(false);

  // Form Content Renderer supporting both Desktop and Mobile layout
  const renderFormContent = (isMobile: boolean) => {
    if (lockedUser) {
      return (
        <div className="text-center w-full">
          <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center border border-slate-200 bg-slate-50 font-black text-xl text-[#0074ff] relative shadow-sm">
            {lockedUser.first_name[0]}{lockedUser.last_name[0]}
            <div className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-white" />
          </div>
          
          <h2 className="text-lg font-bold text-slate-800 mb-1">ברוך שובך</h2>
          <p className="text-sm text-slate-500 mb-6">{"המפקד/ת"} {lockedUser.first_name} {lockedUser.last_name}</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="relative group w-full">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                autoComplete="current-password"
                autoFocus
                value={password}
                onFocus={() => setFocusPassword(true)}
                onBlur={() => setFocusPassword(false)}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setError("");
                }}
                className="h-10 w-full border border-sky-100 rounded-lg px-3 pl-10 pr-3 text-right font-mono text-sm focus:border-[#0074ff] focus:ring-1 focus:ring-[#0074ff]/20 focus:outline-none transition-all placeholder-transparent"
                placeholder=" "
                disabled={isLoading}
              />
              <label
                htmlFor="password"
                className={cn(
                  "absolute right-3 transition-all pointer-events-none px-1 text-slate-400 text-sm font-medium origin-top-right",
                  password.length > 0 || focusPassword 
                    ? "-top-2.5 text-xs text-[#0074ff] bg-white font-bold" 
                    : "top-2.5 text-sm"
                )}
              >
                סיסמה
              </label>
              
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            {error && (
              <div className="flex items-center gap-2 text-rose-500 bg-rose-50/80 border border-rose-100 p-2.5 rounded-lg text-xs font-bold text-right">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              {isBiometricAvailable && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleBiometricLogin}
                  className={cn(
                    "border border-[#0074ff]/20 bg-[#0074ff]/5 hover:bg-[#0074ff]/10 flex items-center justify-center transition-all p-0 shrink-0",
                    isMobile ? "h-11 w-11 rounded-full" : "h-10 w-10 rounded-lg"
                  )}
                  title="כניסה מהירה עם PIN"
                >
                  <Fingerprint className="w-5 h-5 text-[#0074ff]" />
                </Button>
              )}
              <Button
                type="submit"
                disabled={isLoading}
                className={cn(
                  "bg-[#0074ff] hover:bg-[#005ecf] text-white font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
                  isMobile ? "flex-1 h-11 rounded-xl" : "h-10 px-6 rounded-lg ml-auto"
                )}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <>
                    <span>כניסה למערכת</span>
                    <ArrowLeft className="w-4 h-4" />
                  </>
                )}
              </Button>
            </div>
          </form>

          <button
            onClick={handleSwitchUser}
            className="mt-6 text-xs font-bold text-slate-400 hover:text-[#0074ff] transition-colors flex items-center justify-center gap-1.5 mx-auto uppercase tracking-wide group"
          >
            <LogOut className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            החלף משתמש
          </button>
        </div>
      );
    }

    return (
      <form onSubmit={handleSubmit} className="space-y-5 w-full">
        {/* Username */}
        <div className="relative group w-full">
          <Input
            id="username"
            type="text"
            autoComplete="username"
            autoFocus
            value={username}
            onFocus={() => setFocusUsername(true)}
            onBlur={() => setFocusUsername(false)}
            onChange={(e) => {
              setUsername(e.target.value.trim());
              setError("");
            }}
            className="peer h-10 w-full border border-sky-100 rounded-lg px-3 pl-10 pr-3 text-right font-sans text-sm focus:border-[#0074ff] focus:ring-1 focus:ring-[#0074ff]/20 focus:outline-none transition-all placeholder-transparent"
            placeholder=" "
            disabled={isLoading}
          />
          <label
            htmlFor="username"
            className={cn(
              "absolute right-3 transition-all pointer-events-none px-1 text-slate-400 text-sm font-medium origin-top-right",
              username.length > 0 || focusUsername 
                ? "-top-2.5 text-xs text-[#0074ff] bg-white font-bold" 
                : "top-2.5 text-sm"
            )}
          >
            שם משתמש
          </label>
          <ScanEye className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 peer-focus:text-[#0074ff] transition-colors" />
        </div>

        {/* Password */}
        <div className="relative group w-full">
          <Input
            id="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onFocus={() => setFocusPassword(true)}
            onBlur={() => setFocusPassword(false)}
            onChange={(e) => {
              setPassword(e.target.value);
              setError("");
            }}
            className="peer h-10 w-full border border-sky-100 rounded-lg px-3 pl-10 pr-3 text-right font-mono text-sm focus:border-[#0074ff] focus:ring-1 focus:ring-[#0074ff]/20 focus:outline-none transition-all placeholder-transparent"
            placeholder=" "
            disabled={isLoading}
          />
          <label
            htmlFor="password"
            className={cn(
              "absolute right-3 transition-all pointer-events-none px-1 text-slate-400 text-sm font-medium origin-top-right",
              password.length > 0 || focusPassword 
                ? "-top-2.5 text-xs text-[#0074ff] bg-white font-bold" 
                : "top-2.5 text-sm"
            )}
          >
            סיסמה
          </label>
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors z-10"
          >
            {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>
        </div>

        {/* Forgot Password Link - Only shown on Desktop inside the form */}
        {!isMobile && (
          <div className="text-left -mt-2">
            <Link
              to="/forgot-password"
              className="text-xs font-bold text-slate-400 hover:text-[#0074ff] transition-colors"
            >
              שכחת סיסמה?
            </Link>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center gap-2 text-rose-500 bg-rose-50/80 border border-rose-100 p-2.5 rounded-lg text-xs font-bold text-right animate-in fade-in duration-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Buttons */}
        <div className="pt-1 flex gap-2 w-full">
          {isBiometricAvailable && (
            <Button
              type="button"
              variant="outline"
              onClick={handleBiometricLogin}
              className={cn(
                "border border-[#0074ff]/20 bg-[#0074ff]/5 hover:bg-[#0074ff]/10 flex items-center justify-center transition-all p-0 shrink-0",
                isMobile ? "h-11 w-11 rounded-full" : "h-10 w-10 rounded-lg"
              )}
              title="כניסה מהירה עם PIN"
            >
              <Fingerprint className="w-5 h-5 text-[#0074ff]" />
            </Button>
          )}
          <Button
            type="submit"
            disabled={isLoading}
            className={cn(
              "bg-[#0074ff] hover:bg-[#005ecf] text-white font-bold transition-all active:scale-[0.98] flex items-center justify-center gap-2",
              isMobile ? "flex-1 h-11 rounded-xl" : "h-10 px-6 rounded-lg ml-auto"
            )}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <>
                <span>כניסה למערכת</span>
                <ArrowLeft className="w-4 h-4" />
              </>
            )}
          </Button>
        </div>
      </form>
    );
  };

  return (
    <div className="min-h-screen w-full bg-[#1A1D2D] relative flex items-center justify-center overflow-hidden font-sans select-none" dir="rtl">
      {/* Background flat hex grid with neon glows */}
      <HexagonPatrolGrid />

      {/* Decorative operational glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Primary container */}
      <div className="relative z-10 w-full h-screen flex flex-col justify-end md:justify-center md:items-center">
        
        {/* DESKTOP VIEW */}
        <div className="hidden md:flex flex-col items-center w-full max-w-[420px] animate-in fade-in slide-in-from-bottom-8 duration-700">
          {/* Logo & titles block right-aligned above the login box */}
          <div className="w-full flex items-start justify-start gap-4 mb-4 text-right pr-2">
            <img src="/logo_unit.png" alt="ShiftGuard Owl Logo" className="w-14 h-14 object-contain order-2" />
            <div className="flex flex-col justify-center order-1">
              <h1 className="text-2xl font-black text-white leading-none tracking-wide">SHIFTGUARD</h1>
              <span className="text-xs text-blue-400 mt-1 font-bold">מרכז שליטה מבצעי</span>
            </div>
          </div>
          
          {/* The white login card with very soft outline/shadow */}
          <div className="w-full bg-white border border-blue-900/10 rounded-[16px] shadow-[0_8px_30px_rgb(0,0,0,0.03)] p-8">
            {renderFormContent(false)}
          </div>
          
          {/* Subtle footer */}
          <div className="mt-8 text-center">
            <p className="text-[10px] text-slate-500 font-bold font-mono tracking-[0.2em] uppercase">
              © 2026 • CYBER UNIT • v2.0.4
            </p>
          </div>
        </div>

        {/* MOBILE VIEW */}
        <div className="md:hidden flex flex-col h-full w-full justify-between">
          {/* Top 2/3: Hexagonal Grid + floating premium logo */}
          <div className="flex-1 flex flex-col items-center justify-center p-6">
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              className="flex flex-col items-center gap-3"
            >
              <div className="relative flex items-center justify-center">
                <div className="absolute w-24 h-24 rounded-full bg-blue-500/20 blur-xl animate-pulse" />
                <img src="/logo_unit.png" alt="ShiftGuard Owl Logo" className="w-24 h-24 object-contain relative z-10" />
              </div>
              <div className="text-center">
                <h1 className="text-3xl font-black text-white tracking-widest leading-none">SHIFTGUARD</h1>
                <span className="text-[10px] text-blue-400 font-bold uppercase tracking-[0.2em] mt-1 block">Operational Control Center</span>
              </div>
            </motion.div>
          </div>
          
          {/* Bottom Sheet */}
          <div className="bg-white rounded-t-[2.5rem] border-t border-slate-200/60 shadow-[0_-8px_30px_rgb(0,0,0,0.08)] p-6 pb-8 relative flex flex-col max-h-[75vh]">
            {/* Drag Handle */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-10 h-1 bg-slate-300 rounded-full" />
            
            {/* Logo & titles inside the sheet */}
            <div className="flex items-center gap-3 mb-6 text-right w-full mt-2">
              <img src="/logo_unit.png" alt="ShiftGuard Owl Logo" className="w-10 h-10 object-contain order-2" />
              <div className="flex flex-col order-1">
                <h1 className="text-lg font-black text-blue-950 leading-none">SHIFTGUARD</h1>
                <span className="text-[10px] text-slate-500 font-medium mt-0.5 block">מרכז שליטה מבצעי</span>
              </div>
            </div>
            
            {/* Form inputs & buttons */}
            <div className="w-full flex-grow">
              {renderFormContent(true)}
            </div>

            {/* Mobile Forgot Password at the very bottom */}
            {!lockedUser && (
              <div className="text-center mt-6">
                <Link
                  to="/forgot-password"
                  className="text-xs font-bold text-slate-400 hover:text-[#0074ff] transition-colors"
                >
                  שכחת סיסמה?
                </Link>
              </div>
            )}
          </div>
        </div>

      </div>

      {/* PIN Verification Modal */}
      <PinVerificationModal
        isOpen={showPinModal}
        onClose={() => setShowPinModal(false)}
        onVerify={handleVerifyPin}
        username={pinUsername}
        theme="dark" // Always force dark for this premium look
      />
    </div>
  );
}

