import React from "react";
import { TaskAssignment } from "./task-assignment";
import { TaskForm } from "./task-form";
import { useTasksStore } from "@/stores/tasks.store";
import { useAuthStore } from "@/stores/auth.store";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function TaskAssignmentDemo() {
  const { tasks, setTasks, availableUsers, setAvailableUsers } = useTasksStore();
  const { user: currentUser } = useAuthStore();

  // Initialize with demo data
  React.useEffect(() => {
    // Set up demo users if none exist
    if (availableUsers.length === 0 && currentUser) {
      setAvailableUsers([
        currentUser,
        {
          id: "user-2",
          name: "Alice Johnson",
          email: "alice@example.com",
          role: "user" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          id: "user-3", 
          name: "Bob Smith",
          email: "bob@example.com",
          role: "user" as const,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ]);
    }

    // Set up demo tasks if none exist
    if (tasks.length === 0) {
      setTasks([
        {
          id: "task-1",
          title: "Design new landing page",
          description: "Create a modern, responsive landing page design",
          status: "todo",
          priority: "high",
          assigneeId: null,
          reporterId: currentUser?.id || "",
          tags: ["design", "frontend"],
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          commentsCount: 0,
        },
        {
          id: "task-2",
          title: "Implement user authentication",
          description: "Add login and registration functionality",
          status: "in_progress",
          priority: "urgent",
          assigneeId: "user-2",
          reporterId: currentUser?.id || "",
          tags: ["backend", "security"],
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          completedAt: null,
          commentsCount: 3,
        },
      ]);
    }
  }, [tasks.length, availableUsers.length, currentUser, setTasks, setAvailableUsers]);

  const handleTaskSubmit = (data: any) => {
    const newTask = {
      id: `task-${Date.now()}`,
      ...data,
      reporterId: currentUser?.id || "",
      tags: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      completedAt: null,
      commentsCount: 0,
    };
    
    setTasks([newTask, ...tasks]);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Task Assignment Demo</h1>
        <p className="text-muted-foreground">
          Test task assignment and filtering functionality
        </p>
      </div>

      {/* Current User Info */}
      <Card>
        <CardHeader>
          <CardTitle>Current User</CardTitle>
        </CardHeader>
        <CardContent>
          {currentUser ? (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                {currentUser.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium">{currentUser.name}</p>
                <p className="text-sm text-muted-foreground">{currentUser.email}</p>
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground">Please log in to test assignment features</p>
          )}
        </CardContent>
      </Card>

      {/* Available Users */}
      <Card>
        <CardHeader>
          <CardTitle>Available Users for Assignment ({availableUsers.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableUsers.map((user) => (
              <div key={user.id} className="flex items-center gap-3 p-3 border rounded-lg">
                <div className="w-8 h-8 bg-secondary rounded-full flex items-center justify-center">
                  {user.name.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="font-medium">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                  {user.id === currentUser?.id && (
                    <Badge variant="secondary" className="mt-1">You</Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Task Assignment Examples */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Assign Task 1</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskAssignment
              taskId="task-1"
              currentAssigneeId={tasks.find(t => t.id === "task-1")?.assigneeId}
              onAssignmentChange={(assigneeId) => {
                console.log("Task 1 assigned to:", assigneeId);
              }}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assign Task 2</CardTitle>
          </CardHeader>
          <CardContent>
            <TaskAssignment
              taskId="task-2"
              currentAssigneeId={tasks.find(t => t.id === "task-2")?.assigneeId}
              onAssignmentChange={(assigneeId) => {
                console.log("Task 2 assigned to:", assigneeId);
              }}
            />
          </CardContent>
        </Card>
      </div>

      {/* Create New Task Form */}
      <Card>
        <CardHeader>
          <CardTitle>Create New Task with Assignment</CardTitle>
        </CardHeader>
        <CardContent>
          <TaskForm onSubmit={handleTaskSubmit} />
        </CardContent>
      </Card>

      {/* Current Tasks */}
      <Card>
        <CardHeader>
          <CardTitle>Current Tasks ({tasks.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {tasks.map((task) => (
              <div key={task.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <h3 className="font-medium">{task.title}</h3>
                  <p className="text-sm text-muted-foreground">{task.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Badge variant={task.priority === "urgent" ? "destructive" : "secondary"}>
                      {task.priority}
                    </Badge>
                    <Badge variant="outline">{task.status}</Badge>
                  </div>
                </div>
                <div className="ml-4">
                  <TaskAssignment
                    taskId={task.id}
                    currentAssigneeId={task.assigneeId}
                    size="sm"
                  />
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
