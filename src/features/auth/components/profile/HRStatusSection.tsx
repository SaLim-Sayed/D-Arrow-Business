import { Card, CardBody, Button, Chip } from "@heroui/react";
import { Coffee, Zap, History } from "lucide-react";
import { motion } from "framer-motion";
import { TimeTrackerWidget } from "@/features/people/components/TimeTrackerWidget";

interface HRStatusSectionProps {
  approvedLeaves: any[];
  myLeaves: any[];
  onOpenLeave: () => void;
  tp: (key: string) => string;
}

export function HRStatusSection({
  approvedLeaves,
  myLeaves,
  onOpenLeave,
  tp
}: HRStatusSectionProps) {
  return (
    <div className="space-y-6">
      <Card className="rounded-[2.5rem] shadow-premium border-default-100/50 bg-background/60 backdrop-blur-xl overflow-hidden">
        {/* Using the central TimeTrackerWidget for consistent logic and UI */}
        <TimeTrackerWidget variant="full" />
        
        <CardBody className="p-10 border-t border-default-100/50">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            <div className="space-y-8">
               <h3 className="text-xl font-black flex items-center gap-3">
                 <Zap size={24} className="text-primary" />
                 {tp("hrStatistics")}
               </h3>
               <div className="grid grid-cols-2 gap-6">
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[2rem] bg-success/5 border border-success/20 flex flex-col items-center justify-center text-center space-y-2"
                  >
                     <span className="text-4xl font-black text-success tracking-tighter">{approvedLeaves.length}</span>
                     <span className="text-[10px] font-black text-success/60 uppercase tracking-widest leading-none" dangerouslySetInnerHTML={{ __html: tp("approvedLeaves").replace(" ", "<br/>") }}></span>
                  </motion.div>
                  <motion.div 
                    whileHover={{ y: -5 }}
                    className="p-6 rounded-[2rem] bg-primary/5 border border-primary/20 flex flex-col items-center justify-center text-center space-y-2"
                  >
                     <span className="text-4xl font-black text-primary tracking-tighter">{myLeaves.filter(l => l.status === 'pending').length}</span>
                     <span className="text-[10px] font-black text-primary/60 uppercase tracking-widest leading-none" dangerouslySetInnerHTML={{ __html: tp("pendingReview").replace(" ", "<br/>") }}></span>
                  </motion.div>
               </div>
               <Button 
                 color="primary" 
                 variant="shadow" 
                 size="lg"
                 className="w-full font-black text-sm uppercase tracking-wider rounded-2xl h-16 shadow-primary/30"
                 onPress={onOpenLeave}
                 startContent={<Coffee size={24} />}
               >
                 {tp("requestTimeOff")}
               </Button>
            </div>

            <div className="space-y-6">
               <h3 className="text-lg font-black flex items-center gap-3">
                 <History size={20} className="text-primary" />
                 {tp("leaveHistory")}
               </h3>
               <div className="space-y-3">
                 {myLeaves.length > 0 ? myLeaves.slice(0, 3).map(leave => (
                   <div key={leave.id} className="flex justify-between items-center p-4 rounded-2xl bg-white/40 dark:bg-default-50 border border-default-100 transition-all hover:border-primary/30 hover:bg-white/60">
                      <div className="flex flex-col">
                        <span className="text-sm font-black capitalize tracking-tight">{leave.type}</span>
                        <span className="text-[11px] text-default-400 font-bold">{new Date(leave.startDate as any).toLocaleDateString()}</span>
                      </div>
                      <Chip 
                        size="sm" 
                        variant="flat" 
                        color={leave.status === 'approved' ? 'success' : leave.status === 'rejected' ? 'danger' : 'warning'}
                        className="capitalize text-[10px] font-black px-3"
                      >
                        {leave.status}
                      </Chip>
                   </div>
                 )) : (
                   <div className="p-8 border-2 border-dashed border-default-100 rounded-3xl text-center">
                     <p className="text-sm text-default-400 italic">{tp("noLeaveHistory")}</p>
                   </div>
                 )}
               </div>
            </div>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}
