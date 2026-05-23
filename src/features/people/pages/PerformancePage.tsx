import { Button, Card, CardBody, Chip } from "@heroui/react";
import { Plus, Target, Star } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";

export default function PerformancePage() {
  const { user } = useAuthStore();
  
  const isManager = user?.role === 'super_admin' || user?.role === 'admin' || user?.role === 'manager';
  
  return (
    <div className="container mx-auto p-6 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground">
              Performance & Goals
            </h1>
            <Chip size="sm" variant="flat" color="primary" className="font-bold">
              <span className="flex items-center gap-1">
                <Target size={12} /> Appraisals
              </span>
            </Chip>
          </div>
          <p className="text-default-500 font-medium">
            Manage performance reviews, 360 feedback, and continuous goals.
          </p>
        </div>
        <div className="flex gap-2">
          {isManager && (
            <Button 
              color="primary" 
              variant="shadow" 
              startContent={<Plus size={18} />} 
              className="font-bold shadow-lg shadow-primary/25 hover:shadow-primary/40 transition-shadow"
            >
              Start Review Cycle
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 border border-default-100 shadow-sm">
          <CardBody className="p-8 flex flex-col items-center justify-center text-center gap-4 min-h-[300px]">
            <div className="p-4 bg-primary/10 rounded-full text-primary">
              <Target size={40} />
            </div>
            <h3 className="text-xl font-black">No Active Review Cycles</h3>
            <p className="text-default-500 max-w-sm">
              Performance cycles will appear here when HR initiates a new appraisal round.
            </p>
          </CardBody>
        </Card>

        <Card className="col-span-1 border border-default-100 shadow-sm bg-default-50/50">
          <CardBody className="p-6 space-y-4">
            <h3 className="font-bold flex items-center gap-2">
              <Star size={18} className="text-amber-500" /> 
              Recent Appraisals
            </h3>
            <div className="text-center py-10">
               <p className="text-default-400 text-sm">No recent appraisals found.</p>
            </div>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
