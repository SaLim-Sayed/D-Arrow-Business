import * as React from "react";
import { TaskAssignment } from "./task-assignment";
import { TaskForm } from "./task-form";
import { useAuthStore } from "@/stores/auth.store";
import {
  Card,
  CardHeader,
  CardContent,
  Avatar, 
  AvatarImage, 
  AvatarFallback, 
  Chip,
  ChipLabel 
} from "@heroui/react";

export function TaskAssignmentDemo() {
  const { user: currentUser } = useAuthStore();
  const [selectedTaskId, setSelectedTaskId] = React.useState<string | null>(null);

  return (
    <div className="space-y-8 p-6">
      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">Task Assignment Component</h2>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="space-y-4">
              <h3 className="text-sm font-medium text-default-500 uppercase tracking-wider">
                Current User Context
              </h3>
              <div className="flex items-center gap-3 p-3 rounded-lg bg-default-50">
                <Avatar size="md">
                  <AvatarImage src={currentUser?.avatar} />
                  <AvatarFallback>{currentUser?.name?.[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium">{currentUser?.name}</p>
                  <p className="text-xs text-default-500">{currentUser?.email}</p>
                </div>
                <Chip variant="soft" color="accent" className="ml-auto">
                  <ChipLabel>You</ChipLabel>
                </Chip>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="text-sm font-medium text-default-500 uppercase tracking-wider">
                Interactive Assignment
              </h3>
              <TaskAssignment 
                taskId="demo-task-1"
                currentAssigneeId={selectedTaskId}
                onAssignmentChange={(id: string | null) => setSelectedTaskId(id)}
                size="md"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="text-xl font-bold">In-Form Context</h2>
        </CardHeader>
        <CardContent>
          <div className="max-w-md border rounded-xl p-6 bg-content1 shadow-sm">
            <TaskForm 
              onSubmit={(data) => console.log("Submit", data)}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
