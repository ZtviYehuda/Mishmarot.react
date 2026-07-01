import { motion } from "framer-motion";

export const LoadingScreen = () => {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden z-[9999]"
      style={{
        background: "linear-gradient(135deg, #0f1c3f 0%, #162447 40%, #1a2c5a 70%, #0d1b3e 100%)",
      }}
      dir="rtl"
    >
      {/* Animated subtle grid pattern */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Ambient glow top center */}
      <motion.div
        animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
        transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(59,130,246,0.25) 0%, transparent 70%)",
          filter: "blur(40px)",
        }}
      />

      {/* Bottom glow */}
      <motion.div
        animate={{ opacity: [0.2, 0.45, 0.2] }}
        transition={{ duration: 7, repeat: Infinity, ease: "easeInOut", delay: 1.5 }}
        className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse, rgba(99,102,241,0.2) 0%, transparent 70%)",
          filter: "blur(60px)",
        }}
      />

      {/* Main content */}
      <div className="relative z-10 flex flex-col items-center gap-10 px-8">
        {/* Logo with glow ring */}
        <motion.div
          initial={{ opacity: 0, scale: 0.7, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: [0, -8, 0] }}
          transition={{
            opacity: { duration: 0.6 },
            scale: { duration: 0.6 },
            y: { duration: 4, repeat: Infinity, ease: "easeInOut", delay: 0.6 },
          }}
          className="relative flex items-center justify-center"
        >
          {/* Glow ring behind logo */}
          <motion.div
            animate={{ opacity: [0.3, 0.7, 0.3], scale: [1, 1.08, 1] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            className="absolute w-40 h-40 rounded-full"
            style={{
              background: "radial-gradient(circle, rgba(59,130,246,0.3) 0%, rgba(99,102,241,0.1) 50%, transparent 80%)",
              filter: "blur(12px)",
            }}
          />

          {/* Rotating border ring */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 12, repeat: Infinity, ease: "linear" }}
            className="absolute w-36 h-36 rounded-full border border-blue-400/20"
            style={{
              borderTopColor: "rgba(59,130,246,0.7)",
              borderRightColor: "rgba(99,102,241,0.4)",
            }}
          />

          {/* Logo */}
          <div className="toren-spin-container">
            <img
              src="/toren_logo_base.png"
              alt="Toren"
              className="w-20 h-20 object-contain relative z-10"
              style={{
                filter: "drop-shadow(0 0 20px rgba(59,130,246,0.5)) brightness(1.1)",
              }}
            />
            <div className="toren-spin-beam-original" />
            <div className="toren-lantern-flare" />
          </div>
        </motion.div>

        {/* Text block */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          className="flex flex-col items-center gap-3 text-center"
        >
          <h1
            className="text-4xl font-black tracking-tight"
            style={{
              background: "linear-gradient(135deg, #ffffff 0%, #93c5fd 50%, #c4b5fd 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            מוקד שליטה ובקרה
          </h1>
          <p className="text-blue-300/60 text-xs font-bold uppercase tracking-[0.25em]">
            TOREN · COMMAND CONTROL
          </p>
        </motion.div>

        {/* Loading dots */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col items-center gap-3"
        >
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-blue-400"
                animate={{
                  opacity: [0.2, 1, 0.2],
                  scale: [0.8, 1.4, 0.8],
                }}
                transition={{
                  duration: 1.2,
                  repeat: Infinity,
                  delay: i * 0.15,
                  ease: "easeInOut",
                }}
              />
            ))}
          </div>
          <span className="text-blue-300/50 text-[10px] font-medium uppercase tracking-[0.2em]">
            טוען מערכת מאובטחת...
          </span>
        </motion.div>
      </div>

      {/* Bottom version bar */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9, duration: 0.6 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-[260px]"
      >
        {/* Thin glowing progress bar */}
        <div className="w-full h-px bg-white/10 overflow-hidden rounded-full">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, transparent, #60a5fa, #a78bfa, transparent)",
            }}
            initial={{ x: "-100%" }}
            animate={{ x: "100%" }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          />
        </div>

        <div className="flex items-center justify-between w-full px-1">
          <span className="text-blue-300/30 text-[9px] font-mono uppercase tracking-wider">
            SECURE · ENCRYPTED
          </span>
          <span className="text-blue-300/40 text-[9px] font-mono font-bold">
            v2.0.4
          </span>
        </div>
      </motion.div>
    </div>
  );
};
