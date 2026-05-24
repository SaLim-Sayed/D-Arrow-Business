import { Button, Card, CardBody, Tooltip } from "@heroui/react";
import { Play, Square, Clock, Coffee, Zap } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useAttendanceTimer } from "../hooks/use-attendance-timer";

interface TimeTrackerWidgetProps {
  variant?: "compact" | "full";
}

export function TimeTrackerWidget({ variant = "compact" }: TimeTrackerWidgetProps) {
  const {
    todayAttendance,
    isOnBreak,
    liveSeconds,
    accumulatedSeconds,
    isShiftLoading,
    handleCheckIn,
    handleTakeBreak,
    handleCheckOut,
    formatLiveTime
  } = useAttendanceTimer();

  const isCheckedIn = !!todayAttendance && !todayAttendance.checkOut && !isOnBreak;
  const totalDisplaySeconds = accumulatedSeconds + liveSeconds;

  if (variant === "full") {
    return (
      <div className="bg-primary/5 p-6 md:p-10 flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10 rounded-3xl">
        {/* Timer Section */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col items-center md:items-start text-center md:text-left">
            <div className="flex items-center gap-2 text-default-400 mb-1">
              <Clock size={16} className={isCheckedIn ? "text-primary animate-pulse" : ""} />
              <span className="text-[10px] font-black uppercase tracking-[0.2em]">Daily Focus</span>
            </div>
            <span className={`text-4xl md:text-5xl font-mono font-black tabular-nums tracking-tighter ${isCheckedIn ? 'text-primary drop-shadow-[0_0_15px_rgba(var(--heroui-primary-rgb),0.4)]' : 'text-foreground'}`}>
              {formatLiveTime(totalDisplaySeconds)}
            </span>
          </div>
        </div>

        <div className="hidden md:block h-16 w-[1px] bg-gradient-to-b from-transparent via-default-200 to-transparent" />

        {/* Actions Section */}
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8 w-full md:w-auto">
          <div className="relative">
            <AnimatePresence mode="wait">
              {!isCheckedIn && !isOnBreak ? (
                <motion.div
                  key="start"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Button 
                    isIconOnly
                    color="primary"
                    variant="shadow"
                    className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                    onPress={handleCheckIn}
                    isLoading={isShiftLoading}
                  >
                    <Play size={28} fill="currentColor" className="ml-1 md:w-8 md:h-8" />
                  </Button>
                </motion.div>
              ) : isCheckedIn ? (
                <div className="flex gap-4">
                  <motion.div
                    initial={{ x: 20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <Button 
                      isIconOnly
                      size="lg"
                      color="warning"
                      variant="flat"
                      className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] bg-orange-400/10 text-orange-400 hover:scale-105 active:scale-95 transition-all"
                      onPress={handleTakeBreak}
                      isLoading={isShiftLoading}
                    >
                      <Coffee size={28} className="md:w-8 md:h-8" />
                    </Button>
                  </motion.div>
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                  >
                    <Button 
                      isIconOnly
                      size="lg"
                      color="danger"
                      variant="shadow"
                      className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] shadow-2xl shadow-danger/30 hover:scale-105 active:scale-95 transition-all bg-gradient-to-br from-danger to-rose-600"
                      onPress={handleCheckOut}
                      isLoading={isShiftLoading}
                    >
                      <Square size={24} fill="currentColor" className="md:w-7 md:h-7" />
                    </Button>
                  </motion.div>
                </div>
              ) : isOnBreak ? (
                <motion.div
                  key="resume"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.8, opacity: 0 }}
                >
                  <Button 
                    isIconOnly
                    color="primary"
                    variant="shadow"
                    className="h-16 w-16 md:h-20 md:w-20 rounded-[2rem] shadow-2xl shadow-primary/40 hover:scale-105 active:scale-95 transition-all"
                    onPress={handleCheckIn}
                    isLoading={isShiftLoading}
                  >
                    <Play size={28} fill="currentColor" className="ml-1 md:w-8 md:h-8" />
                  </Button>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>

          <div className="flex flex-row md:flex-col items-center md:items-start justify-between w-full md:w-auto px-4 md:px-0">
            <span className="text-[10px] font-black uppercase text-default-400 tracking-[0.2em] mb-0 md:mb-1">System</span>
            <div className="flex items-center gap-3">
              <div className="relative flex h-3 w-3">
                <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isCheckedIn ? 'bg-success animate-ping' : isOnBreak ? 'bg-orange-400 animate-pulse' : 'bg-default-300'}`}></span>
                <span className={`relative inline-flex rounded-full h-3 w-3 ${isCheckedIn ? 'bg-success' : isOnBreak ? 'bg-orange-400' : 'bg-default-400'}`}></span>
              </div>
              <span className={`text-sm font-black uppercase tracking-tight ${isCheckedIn ? 'text-success' : isOnBreak ? 'text-orange-400' : 'text-default-400'}`}>
                {isCheckedIn ? 'On Duty' : isOnBreak ? 'On Break' : 'Off Duty'}
              </span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      layout
      initial={false}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
    >
      <Card
        className={`relative border shadow-2xl transition-all duration-700 ease-in-out ${
          isCheckedIn 
            ? "border-primary/40 bg-primary/10 shadow-primary/20" 
            : "border-default-200/50 bg-background/60 backdrop-blur-xl shadow-black/5"
        }`}
      >
        <CardBody className="p-0.5 px-1.5 sm:p-1 sm:px-4 flex flex-row items-center gap-1.5 sm:gap-6 overflow-hidden">
          {/* Animated Background Pulse */}
          <AnimatePresence>
            {isCheckedIn && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{
                  opacity: 1,
                  backgroundPosition: ["0% 0%", "200% 0%"],
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "linear",
                }}
              />
            )}
          </AnimatePresence>

          <div className="flex flex-col relative z-10">
            <div className="flex items-center gap-1 sm:gap-2 text-default-400 group">
              <motion.div
                animate={isCheckedIn ? { rotate: 360 } : {}}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
              >
                <Clock className={isCheckedIn ? "text-primary w-2.5 h-2.5 sm:w-3 sm:h-3" : "w-2.5 h-2.5 sm:w-3 sm:h-3"} />
              </motion.div>
              <span className="text-[6px] sm:text-[9px] font-black uppercase tracking-[0.2em] text-default-400/80">
                Focus
              </span>
            </div>
            
            <div className="flex items-baseline gap-0.5">
              <span className={`text-xs sm:text-2xl font-mono font-black tabular-nums tracking-tighter ${isCheckedIn ? 'text-primary drop-shadow-[0_0_8px_rgba(var(--heroui-primary-rgb),0.5)]' : 'text-foreground/80'}`}>
                {formatLiveTime(totalDisplaySeconds)}
              </span>
            </div>
          </div>

          <div className="h-5 sm:h-10 w-[1px] bg-gradient-to-b from-transparent via-default-200 to-transparent relative z-10" />

          <div className="flex items-center gap-1.5 sm:gap-4 relative z-10">
            <div className="relative group">
              <AnimatePresence mode="wait">
                {!isCheckedIn ? (
                  <motion.div
                    key="play"
                    initial={{ scale: 0.5, opacity: 0, rotate: -90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: 90 }}
                  >
                    <Tooltip content={isOnBreak ? "Back to Work" : "Check In / Resume"} placement="bottom" showArrow offset={10}>
                      <Button 
                        isIconOnly 
                        color="primary" 
                        variant="shadow" 
                        className="min-w-unit-6 w-6 h-6 sm:h-11 sm:w-11 rounded sm:rounded-2xl shadow-lg shadow-primary/30 hover:scale-110 active:scale-95 transition-all"
                        onPress={handleCheckIn}
                        isLoading={isShiftLoading}
                      >
                        <Play fill="currentColor" className="ml-0.5 w-3 h-3 sm:w-[22px] sm:h-[22px]" />
                      </Button>
                    </Tooltip>
                  </motion.div>
                ) : (
                  <motion.div
                    key="stop"
                    initial={{ scale: 0.5, opacity: 0, rotate: 90 }}
                    animate={{ scale: 1, opacity: 1, rotate: 0 }}
                    exit={{ scale: 0.5, opacity: 0, rotate: -90 }}
                  >
                    <Tooltip content="Check Out / End Session" placement="bottom" color="danger" showArrow offset={10}>
                      <Button 
                        isIconOnly 
                        color="danger" 
                        variant="shadow" 
                        className="min-w-unit-6 w-6 h-6 sm:h-11 sm:w-11 rounded sm:rounded-2xl shadow-lg shadow-danger/20 hover:scale-110 active:scale-95 transition-all bg-gradient-to-br from-danger to-rose-600"
                        onPress={handleCheckOut}
                        isLoading={isShiftLoading}
                      >
                        <Square fill="currentColor" className="w-2.5 h-2.5 sm:w-5 sm:h-5" />
                      </Button>
                    </Tooltip>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
            
            <div className="flex flex-col min-w-[35px] sm:min-w-[70px]">
              <span className="text-[6px] sm:text-[9px] font-black text-default-400 uppercase tracking-widest leading-none mb-0.5">
                System
              </span>
              <div className="flex items-center gap-0.5 sm:gap-2">
                <div className="relative flex h-1 w-1 sm:h-2 sm:w-2">
                  <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 ${isCheckedIn ? 'bg-success animate-ping' : isOnBreak ? 'bg-orange-400 animate-pulse' : 'bg-default-300'}`}></span>
                  <span className={`relative inline-flex rounded-full h-1 w-1 sm:h-2 sm:w-2 ${isCheckedIn ? 'bg-success' : isOnBreak ? 'bg-orange-400' : 'bg-default-400'}`}></span>
                </div>
                <span className={`text-[7px] sm:text-[11px] font-black uppercase tracking-tight leading-none ${isCheckedIn ? 'text-success' : isOnBreak ? 'text-orange-400' : 'text-default-400'}`}>
                  {isCheckedIn ? 'On' : isOnBreak ? 'Break' : 'Off'}
                </span>
              </div>
            </div>

            {/* Micro-Interaction Icons */}
            <div className="flex gap-0.5 sm:gap-1.5 ml-0 sm:ml-2">
               <Tooltip content={isOnBreak ? "Resume Work" : isCheckedIn ? "Take a break" : "Must be on duty to take a break"}>
                  <Button 
                    isIconOnly 
                    size="sm" 
                    variant={isOnBreak ? "shadow" : "light"} 
                    className={`min-w-unit-5 w-5 h-5 sm:min-w-unit-8 sm:w-8 sm:h-8 rounded sm:rounded-lg transition-all ${isCheckedIn ? 'text-orange-400 hover:bg-orange-400/10' : isOnBreak ? 'bg-orange-400 text-white' : 'text-default-300 opacity-50'}`}
                    onPress={isOnBreak ? handleCheckIn : handleTakeBreak}
                    disabled={!isCheckedIn && !isOnBreak}
                  >
                    <Coffee className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill={isOnBreak ? "currentColor" : "none"} />
                  </Button>
               </Tooltip>
               <Tooltip content="High Productivity Mode">
                  <Button isIconOnly size="sm" variant="light" className={`min-w-unit-5 w-5 h-5 sm:min-w-unit-8 sm:w-8 sm:h-8 rounded sm:rounded-lg ${isCheckedIn ? 'text-yellow-500 animate-pulse' : 'text-default-300'}`}>
                    <Zap className="w-2.5 h-2.5 sm:w-4 sm:h-4" fill={isCheckedIn ? "currentColor" : "none"} />
                  </Button>
               </Tooltip>
            </div>
          </div>
        </CardBody>
      </Card>
    </motion.div>
  );
}
