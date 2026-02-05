import { useState, useEffect, useRef } from "react";
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
} from "lucide-react";
import { useAuthContext } from "@/context/AuthContext";
import { useTheme } from "@/context/ThemeContext";
import { useNavigate, Link } from "react-router-dom";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface LockedUser {
  personal_number: string;
  first_name: string;
  last_name: string;
}

const HexagonPatrolGrid = ({ theme }: { theme: string }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const isDark = theme === "dark";
    const colors = isDark
      ? {
        bg: "#020617", // slate-950
        hexOutline: "rgba(30, 58, 138, 0.2)", // dark blue
        hexActiveBlue: "rgba(59, 130, 246, 0.4)", // blue-500
        hexActiveRed: "rgba(220, 38, 38, 0.4)", // red-600
      }
      : {
        bg: "#f8fafc", // slate-50
        hexOutline: "rgba(148, 163, 184, 0.2)", // slate-400
        hexActiveBlue: "rgba(59, 130, 246, 0.2)", // blue-500
        hexActiveRed: "rgba(220, 38, 38, 0.2)", // red-600
      };

    let animationFrameId: number;
    const hexSize = 30; // Radius of hexagon
    const hexWidth = Math.sqrt(3) * hexSize;
    const hexHeight = 2 * hexSize;
    const xStep = hexWidth;
    const yStep = hexHeight * 0.75;

    // Grid State
    let grid: {
      x: number;
      y: number;
      active: number; // 0 to 1 opacity
      targetActive: number;
      isRed: boolean;
      delay: number;
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
            active: 0,
            targetActive: 0,
            isRed: Math.random() > 0.9, // 10% chance to be red when active
            delay: Math.random() * 100,
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
      ctx.clearRect(0, 0, canvas.width, canvas.height); // Clear only, rely on canvas CSS for bg

      ctx.strokeStyle = colors.hexOutline;
      ctx.lineWidth = 1;

      grid.forEach((hex) => {
        // Update Logic

        // Random breathing (more subtle)
        if (Math.random() < 0.003) {
          hex.targetActive = Math.random() * 0.3 + 0.1;
          hex.isRed = Math.random() > 0.92; // Less frequent red
        }

        // Decay
        if (hex.active > 0.005) {
          hex.active -= 0.008;
        } else {
          hex.active = 0;
        }

        // Rise to target
        if (hex.targetActive > hex.active) {
          hex.active += 0.015;
        } else {
          hex.targetActive = 0;
        }

        // Mouse Interaction (flashlight effect)
        const dx = mousePos.x - hex.x;
        const dy = mousePos.y - hex.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        // Draw Outline
        drawHexagon(hex.x, hex.y, hexSize - 2);

        // Draw Active Fill
        let fillOpacity = hex.active;

        // Mouse hover boosts opacity
        if (dist < 200) {
          fillOpacity += (200 - dist) / 500;
        }

        if (fillOpacity > 0.03) {
          // Cap opacity
          fillOpacity = Math.min(fillOpacity, 0.5);

          const baseColor = hex.isRed
            ? colors.hexActiveRed
            : colors.hexActiveBlue;
          // Hacky RGBA replace to inject dynamic opacity
          const finalColor = baseColor.replace(/[\d.]+\)$/, `${fillOpacity})`);

          fillHexagon(hex.x, hex.y, hexSize - 3, finalColor);
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
  }, [mousePos, theme]);

  return (
    <canvas
      ref={canvasRef}
      className={cn(
        "fixed inset-0 pointer-events-none z-0 transition-colors duration-500",
        theme === "dark" ? "bg-slate-950" : "bg-slate-50/80",
      )}
    />
  );
};

export default function LoginPage() {
  const [personalNumber, setPersonalNumber] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [lockedUser, setLockedUser] = useState<LockedUser | null>(null);
  const navigate = useNavigate();
  const { login } = useAuthContext();
  const { theme } = useTheme();

  useEffect(() => {
    const savedLockedUser = localStorage.getItem("locked_user");
    if (savedLockedUser) {
      try {
        const user = JSON.parse(savedLockedUser);
        setLockedUser(user);
        setPersonalNumber(user.personal_number);
      } catch (e) {
        console.error("Failed to parse locked user", e);
        localStorage.removeItem("locked_user");
      }
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!personalNumber.trim() || !password.trim()) {
      setError("יש למלא מספר אישי וסיסמה");
      return;
    }

    setIsLoading(true);

    try {
      const success = await login(personalNumber.trim(), password.trim());
      if (success) {
        navigate("/", { replace: true });
      } else {
        setError("הסיסמה שגויה. אנא נסה שוב.");
      }
    } catch (err) {
      setError("שגיאת מערכת. אנא נסה שוב מאוחר יותר.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSwitchUser = () => {
    localStorage.removeItem("locked_user");
    setLockedUser(null);
    setPersonalNumber("");
    setPassword("");
    setError("");
  };

  // Dynamic class helpers for Theme
  const isDark = theme === "dark";

  return (
    <div
      className={cn(
        "min-h-screen flex flex-col font-sans overflow-hidden relative transition-colors duration-500",
        isDark ? "text-slate-100" : "text-slate-800",
      )}
      dir="rtl"
    >
      <HexagonPatrolGrid theme={theme} />

      {/* Decorative Overlays - Theme Adaptive */}
      <div
        className={cn(
          "fixed inset-0 pointer-events-none z-0 transition-colors duration-500",
          isDark
            ? "bg-gradient-to-b from-transparent via-slate-950/50 to-slate-950"
            : "bg-gradient-to-b from-transparent via-slate-50/50 to-slate-100",
        )}
      />
      <div
        className={cn(
          "fixed top-0 left-0 w-full h-1 bg-gradient-to-r z-50 opacity-50",
          "from-blue-600 via-cyan-400 to-blue-600",
        )}
      />

      {/* Main Content Area */}
      <main className="flex-grow flex items-center justify-center p-4 relative z-10">
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[440px] px-4"
        >
          {/* Logo / Header Section */}
          <div className="text-center mb-10 md:mb-14 relative">
            <h1
              className={cn(
                "text-4xl md:text-6xl font-black bg-clip-text text-transparent tracking-tight mb-2 md:mb-3 uppercase transition-all duration-700",
                "drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]",
                isDark
                  ? "bg-gradient-to-br from-white via-white to-slate-500"
                  : "bg-gradient-to-br from-slate-950 via-slate-800 to-slate-600",
              )}
            >
              MISHMAROT
            </h1>
            <div className="flex items-center justify-center gap-2 mb-1">
              <div className="h-px w-6 md:w-8 bg-blue-500/50" />
              <span className="text-[10px] md:text-xs font-bold text-blue-500 tracking-[0.2em] md:tracking-[0.3em] uppercase">
                Operational Control Center
              </span>
              <div className="h-px w-6 md:w-8 bg-blue-500/50" />
            </div>
          </div>

          {/* Login Card */}
          <div
            className={cn(
              "backdrop-blur-xl border rounded-[2rem] md:rounded-[2.5rem] overflow-hidden ring-1 transition-all duration-300",
              isDark
                ? "bg-slate-900/60 border-white/10 shadow-2xl ring-white/5"
                : "bg-white/70 border-white/50 shadow-[0_8px_32px_rgba(0,0,0,0.1)] ring-black/5",
            )}
          >
            <div className="p-6 md:p-10">
              {lockedUser ? (
                /* LOCKED USER VIEW */
                <div className="text-center animate-in fade-in zoom-in-95 duration-300">
                  <div
                    className={cn(
                      "w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center border-2 shadow-inner font-black text-2xl relative group",
                      isDark
                        ? "bg-slate-800 border-slate-600 text-blue-400"
                        : "bg-slate-100 border-slate-200 text-blue-600",
                    )}
                  >
                    {lockedUser.first_name[0]}
                    {lockedUser.last_name[0]}
                    <div className="absolute bottom-0 right-0 w-5 h-5 bg-green-500 rounded-full border-2 border-white dark:border-slate-900 shadow-lg" />
                  </div>
                  <h2
                    className={cn(
                      "text-2xl font-bold mb-1",
                      isDark ? "text-white" : "text-slate-900",
                    )}
                  >
                    <h1 className="text-2xl font-black mb-1">ברוך שובך</h1>
                    <h2 className="text-2xl font-black mb-1">
                      {"המפקד/ת"} {lockedUser.first_name}
                    </h2>
                  </h2>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2 text-right">
                      <div className="relative group">
                        <Lock
                          className={cn(
                            "absolute right-4 top-3.5 w-5 h-5 transition-colors z-10",
                            isDark
                              ? "text-slate-500 group-focus-within:text-blue-400"
                              : "text-slate-400 group-focus-within:text-blue-600",
                          )}
                        />
                        <Input
                          id="password"
                          type="password"
                          autoComplete="current-password"
                          autoFocus
                          value={password}
                          onChange={(e) => {
                            setPassword(e.target.value);
                            setError("");
                          }}
                          className={cn(
                            "h-12 border rounded-xl pr-12 transition-all text-lg tracking-widest font-mono",
                            isDark
                              ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/50"
                              : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20",
                          )}
                          placeholder="••••••••"
                          disabled={isLoading}
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 text-rose-500 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-sm font-bold">
                        <AlertCircle className="w-4 h-4 shrink-0" />
                        {error}
                      </div>
                    )}

                    <Button
                      type="submit"
                      disabled={isLoading}
                      className="w-full h-12 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg active:scale-[0.98] relative overflow-hidden group"
                    >
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
                      {isLoading ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        "אימות וכניסה"
                      )}
                    </Button>
                  </form>

                  <button
                    onClick={handleSwitchUser}
                    className="mt-6 text-xs font-bold text-slate-500 hover:text-foreground transition-colors flex items-center justify-center gap-2 mx-auto uppercase tracking-wide group"
                  >
                    <LogOut className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
                    החלף משתמש
                  </button>
                </div>
              ) : (
                /* REGULAR LOGIN VIEW */
                <>
                  <div className="mb-6 text-center">
                    <p className="text-muted-foreground text-sm font-medium">
                      הזדהות מאובטחת לרשת המבצעית
                    </p>
                  </div>

                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-4">
                      {/* Personal Number */}
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="personal_number"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border shadow-sm",
                              isDark
                                ? "bg-slate-900/90 text-blue-400 border-slate-700"
                                : "bg-white text-blue-600 border-slate-200",
                            )}
                          >
                            מספר אישי
                          </Label>
                          <ScanEye
                            className={cn(
                              "absolute right-4 top-3.5 w-5 h-5 transition-colors z-10",
                              isDark
                                ? "text-slate-500 group-focus-within:text-blue-400"
                                : "text-slate-400 group-focus-within:text-blue-600",
                            )}
                          />
                          <Input
                            id="personal_number"
                            type="text"
                            autoComplete="username"
                            autoFocus
                            value={personalNumber}
                            onChange={(e) => {
                              setPersonalNumber(e.target.value.trim());
                              setError("");
                            }}
                            className={cn(
                              "h-12 border rounded-xl pr-12 transition-all font-mono",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20",
                            )}
                            placeholder="הזן מספר משתמש"
                            disabled={isLoading}
                          />
                        </div>
                      </div>

                      {/* Password */}
                      <div className="space-y-1.5">
                        <div className="relative group">
                          <Label
                            htmlFor="password"
                            className={cn(
                              "absolute -top-2.5 right-3 px-2 text-[10px] font-bold uppercase tracking-widest z-10 rounded-full border shadow-sm",
                              isDark
                                ? "bg-slate-900/90 text-blue-400 border-slate-700"
                                : "bg-white text-blue-600 border-slate-200",
                            )}
                          >
                            סיסמה
                          </Label>
                          <Lock
                            className={cn(
                              "absolute right-4 top-3.5 w-5 h-5 transition-colors z-10",
                              isDark
                                ? "text-slate-500 group-focus-within:text-blue-400"
                                : "text-slate-400 group-focus-within:text-blue-600",
                            )}
                          />
                          <Input
                            id="password"
                            type={showPassword ? "text" : "password"}
                            autoComplete="current-password"
                            value={password}
                            onChange={(e) => {
                              setPassword(e.target.value);
                              setError("");
                            }}
                            className={cn(
                              "h-12 border rounded-xl pr-12 pl-12 transition-all font-mono tracking-widest",
                              isDark
                                ? "border-slate-700 bg-slate-950/50 focus:bg-slate-900 text-slate-100 placeholder:text-slate-600 focus:border-blue-500 focus:ring-blue-500/50"
                                : "border-slate-200 bg-white/50 focus:bg-white text-slate-900 placeholder:text-slate-400 focus:border-blue-600 focus:ring-blue-600/20",
                            )}
                            placeholder="••••••••"
                            disabled={isLoading}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className={cn(
                              "absolute left-3 top-3.5 transition-colors z-10",
                              isDark
                                ? "text-slate-500 hover:text-slate-300"
                                : "text-slate-400 hover:text-slate-600",
                            )}
                          >
                            {showPassword ? (
                              <EyeOff className="w-5 h-5" />
                            ) : (
                              <Eye className="w-5 h-5" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Forgot Password Link */}
                    <div className="text-left -mt-2">
                      <Link
                        to="/forgot-password"
                        className="text-xs font-bold text-blue-500 hover:text-blue-600 transition-colors uppercase tracking-tight"
                      >
                        שכחת סיסמה?
                      </Link>
                    </div>

                    {/* Error Message */}
                    {error && (
                      <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl text-sm text-rose-500 font-medium animate-in fade-in zoom-in-95 duration-200">
                        <div className="w-8 h-8 rounded-full bg-rose-500/20 flex items-center justify-center shrink-0">
                          <AlertCircle className="h-5 w-5 text-rose-500" />
                        </div>
                        <span className="font-sans">{error}</span>
                      </div>
                    )}

                    {/* Submit Button */}
                    <div className="pt-2">
                      <Button
                        type="submit"
                        disabled={isLoading}
                        className="w-full h-14 bg-gradient-to-r from-blue-700 to-blue-600 hover:from-blue-600 hover:to-blue-500 text-white font-black text-lg rounded-2xl transition-all shadow-lg active:scale-[0.98] border border-white/10 relative overflow-hidden group"
                      >
                        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                        <div className="relative flex items-center gap-2">
                          {isLoading ? (
                            <>
                              <Loader2 className="h-5 w-5 animate-spin" />
                              <span className="text-base">
                                מבצע אימות נתונים...
                              </span>
                            </>
                          ) : (
                            <>
                              <Crosshair className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" />
                              כניסה למערכת
                            </>
                          )}
                        </div>
                      </Button>
                    </div>
                  </form>
                </>
              )}
            </div>

            {/* Form Footer - Removed */}
          </div>

          <div className="mt-8 text-center px-4">
            <p className="text-[10px] text-muted-foreground font-medium font-mono uppercase tracking-[0.2em] leading-relaxed">
              © 2026 • CYBER UNIT • v1.0.4
            </p>
          </div>
        </motion.div>
      </main>
    </div>
  );
}
