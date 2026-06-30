import { motion } from "framer-motion";

export const LoadingScreen = () => {
  const systemName = "מוקד שליטה ובקרה";

  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden z-[9999]"
      dir="rtl"
    >
      <div className="toren-lighthouse-flash" />

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 mb-16">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="relative flex items-center justify-center mb-8"
        >
          <div className="toren-spin-container">
            <img
              src="/toren_logo_base.png"
              alt="סמל Toren"
              className="toren-spin-logo"
            />
            <div className="toren-spin-beam-original" />
            <div className="toren-lantern-flare" />
          </div>
        </motion.div>

        {/* System Name / Status Container */}
        <motion.div
          className="w-full flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {/* Main Title */}
          <h1 className="text-3xl font-black text-foreground tracking-tight text-center">
            {systemName}
          </h1>

          {/* Clean Loading Indicator */}
          <div className="flex flex-col items-center gap-4 w-full px-4">
            <div className="flex items-center gap-2">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="w-2 h-2 rounded-full bg-primary"
                  animate={{ scale: [1, 1.5, 1], opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                />
              ))}
            </div>
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">
              טוען פרטי מערכת מאובטחים...
            </span>
          </div>
        </motion.div>
      </div>

      {/* Fancy Progress Bar */}
      <motion.div
        className="absolute bottom-16 w-full max-w-[280px]"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
      >
        <div className="flex justify-between items-center mb-2 px-1">
          <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">
            המערכת מוכנה לעבודה
          </span>
          <span className="text-[10px] font-mono font-black text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">
            v2.0.4
          </span>
        </div>
        <div className="h-1.5 w-full bg-muted overflow-hidden rounded-full">
          <motion.div
            className="h-full bg-primary relative overflow-hidden"
            initial={{ width: "0%" }}
            animate={{ width: "100%" }}
            transition={{ duration: 2.5, ease: "circOut", repeat: Infinity }}
          >
            <motion.div
              className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-white/40 to-transparent"
              initial={{ x: "-100%" }}
              animate={{ x: "100%" }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
};
