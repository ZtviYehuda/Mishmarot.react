import { motion } from "framer-motion";

export const LoadingScreen = () => {
  const systemName = "מוקד שליטה ובקרה";
  const letters = systemName.split("");

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-[#001e30] dark:bg-[#0b141a] overflow-hidden z-[9999]" dir="rtl">
      {/* Immersive Animated Background Elements */}
      <div className="absolute inset-0 z-0">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute rounded-full bg-primary/10 blur-[100px]"
            style={{
              width: Math.random() * 400 + 200,
              height: Math.random() * 400 + 200,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
            }}
            animate={{
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.3, 0.1],
              x: [0, 50, 0],
              y: [0, 30, 0],
            }}
            transition={{
              duration: 10 + i * 2,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        ))}
      </div>

      <div className="relative z-10 flex flex-col items-center">
        {/* Central Brand Hexagon/Icon */}
        <div className="relative mb-12">
          {/* Glowing Aura */}
          <motion.div
            className="absolute inset-0 bg-primary/30 rounded-full blur-2xl flex items-center justify-center"
            animate={{ scale: [1, 1.4, 1], opacity: [0.3, 0.6, 0.3] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          <motion.div
            className="relative w-28 h-28 bg-gradient-to-br from-slate-50 to-white dark:from-slate-800 dark:to-slate-900 rounded-[2rem] shadow-2xl flex items-center justify-center border border-white/20"
            initial={{ scale: 0.5, opacity: 0, rotate: -20 }}
            animate={{ scale: 1, opacity: 1, rotate: 0 }}
            transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          >
            <svg
              width="56"
              height="56"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              className="text-primary"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <motion.path
                d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 2, ease: "easeInOut" }}
              />
              <motion.circle
                cx="12"
                cy="11"
                r="3"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
              />
              <motion.path
                d="M7 20l10 0"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ delay: 1.5, duration: 0.8 }}
              />
            </svg>
          </motion.div>
        </div>

        {/* Staggered Text Animation */}
        <div className="flex flex-col items-center gap-4">
          <div className="flex gap-1">
            {letters.map((char, i) => (
              <motion.span
                key={i}
                className="text-3xl sm:text-4xl font-black text-white tracking-wider inline-block"
                initial={{ opacity: 0, y: 20, filter: "blur(10px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{ 
                  delay: 0.5 + (letters.length - i - 1) * 0.05, 
                  duration: 0.8,
                  type: "spring",
                  stiffness: 100
                }}
              >
                {char === " " ? "\u00A0" : char}
              </motion.span>
            ))}
          </div>

          <motion.div
            className="flex items-center gap-3 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 backdrop-blur-md"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex gap-1.5">
              {[0, 1, 2].map(dot => (
                <motion.div
                  key={dot}
                  className="w-1.5 h-1.5 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1, repeat: Infinity, delay: dot * 0.2 }}
                />
              ))}
            </div>
            <span className="text-[11px] font-bold text-primary/80 uppercase tracking-widest">
              טוען פרטי מערכת מאובטחים
            </span>
          </motion.div>
        </div>

        {/* Minimal Progress Bar */}
        <div className="absolute bottom-16 w-64">
          <div className="flex justify-between items-end mb-2 px-1">
            <span className="text-[10px] font-black text-primary/60 uppercase tracking-tighter">המערכת מוכנה לעבודה</span>
            <motion.span 
              className="text-[14px] font-black text-white tabular-nums"
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              2.0.4
            </motion.span>
          </div>
          <div className="h-[2px] w-full bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-primary shadow-[0_0_15px_rgba(0,116,255,0.8)]"
              initial={{ width: "0%" }}
              animate={{ width: "100%" }}
              transition={{ duration: 3, ease: "easeInOut", repeat: Infinity }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
