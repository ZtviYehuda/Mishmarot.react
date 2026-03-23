import { motion } from "framer-motion";

export const LoadingScreen = () => {
  const systemName = "מוקד שליטה ובקרה";

  return (
    <div className="fixed inset-0 flex flex-col items-center justify-center bg-background overflow-hidden z-[9999]" dir="rtl">
      {/* Background gradients */}
      <div className="absolute inset-0 z-0 opacity-40 dark:opacity-20 flex items-center justify-center pointer-events-none">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.3, 0.5, 0.3],
          }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute w-[60vw] h-[60vw] max-w-[800px] max-h-[800px] bg-primary/20 rounded-full blur-[100px]"
        />
        <motion.div
          animate={{
            scale: [1.2, 1, 1.2],
            opacity: [0.2, 0.4, 0.2],
          }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute w-[50vw] h-[50vw] max-w-[600px] max-h-[600px] bg-blue-500/10 rounded-full blur-[100px] -translate-x-1/4 translate-y-1/4"
        />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-sm px-6 mb-16">
        {/* Logo Container */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 30 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          transition={{ duration: 1, type: "spring", bounce: 0.4 }}
          className="relative flex items-center justify-center mb-8"
        >
          {/* Pulsing Aura right behind the owl */}
          <motion.div 
            className="absolute bg-primary/20 rounded-full blur-[40px] w-32 h-32"
            animate={{ scale: [1, 1.4, 1], opacity: [0.5, 0.8, 0.5] }}
            transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
          />
          
          {/* Floating Owl Logo */}
          <motion.div
            animate={{ y: [0, -15, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            className="relative z-10 pointer-events-none"
          >
            <img 
              src="/logo_unit.png" 
              alt="ינשוף - סמל היחידה" 
              className="w-36 h-36 sm:w-40 sm:h-40 object-contain drop-shadow-[0_20px_20px_rgba(0,0,0,0.25)] dark:drop-shadow-[0_20px_20px_rgba(0,0,0,0.5)]"
            />
            {/* Subtle shadow underneath to enhance the floating effect */}
            <motion.div 
              className="absolute -bottom-6 left-1/2 -translate-x-1/2 w-16 h-2 bg-black/20 dark:bg-black/40 rounded-full blur-md"
              animate={{ scale: [1, 0.6, 1], opacity: [0.5, 0.2, 0.5] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            />
          </motion.div>
        </motion.div>

        {/* System Name / Status Container */}
        <motion.div 
          className="w-full flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3, duration: 0.8 }}
        >
          {/* Main Title */}
          <h1 className="text-3xl font-black text-foreground tracking-tight text-center drop-shadow-sm">
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
          <span className="text-xs font-bold text-muted-foreground/60 uppercase tracking-wide">המערכת מוכנה לעבודה</span>
          <span className="text-[10px] font-mono font-black text-primary/70 bg-primary/10 px-1.5 py-0.5 rounded">v2.0.4</span>
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
