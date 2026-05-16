import type { Employee, LeaveRequest } from "../../features/people/types/people.types";

export const mockEmployees: Employee[] = [
  {
    id: "emp-1",
    userId: "user-1",
    firstName: "John",
    lastName: "Doe",
    email: "john.doe@darrow.com",
    jobTitle: "CEO & Founder",
    department: "Executive",
    status: "active",
    joiningDate: new Date("2023-01-01"),
    officeLocation: "Dubai, UAE",
    phoneNumber: "+971 50 123 4567"
  },
  {
    id: "emp-2",
    userId: "user-2",
    firstName: "Jane",
    lastName: "Smith",
    email: "jane.smith@darrow.com",
    jobTitle: "CTO",
    department: "Engineering",
    managerId: "emp-1",
    status: "active",
    joiningDate: new Date("2023-02-15"),
    officeLocation: "Dubai, UAE"
  },
  {
    id: "emp-3",
    userId: "user-3",
    firstName: "Ahmed",
    lastName: "Hassan",
    email: "ahmed.h@darrow.com",
    jobTitle: "Senior Frontend Engineer",
    department: "Engineering",
    managerId: "emp-2",
    status: "active",
    joiningDate: new Date("2023-06-10"),
    officeLocation: "Remote"
  },
  {
    id: "emp-4",
    userId: "user-4",
    firstName: "Sarah",
    lastName: "Al-Farsi",
    email: "sarah.f@darrow.com",
    jobTitle: "Product Manager",
    department: "Product",
    managerId: "emp-1",
    status: "active",
    joiningDate: new Date("2023-04-05"),
    officeLocation: "Dubai, UAE"
  },
  {
    id: "emp-5",
    userId: "user-5",
    firstName: "Michael",
    lastName: "Brown",
    email: "m.brown@darrow.com",
    jobTitle: "UX Designer",
    department: "Product",
    managerId: "emp-4",
    status: "onboarding",
    joiningDate: new Date("2024-05-01"),
    officeLocation: "Remote"
  }
];

export const mockLeaveRequests: LeaveRequest[] = [
  {
    id: "leave-1",
    employeeId: "emp-3",
    employeeName: "Ahmed Hassan",
    type: "vacation",
    startDate: new Date("2024-06-15"),
    endDate: new Date("2024-06-25"),
    reason: "Summer holiday with family",
    status: "approved",
    createdAt: new Date("2024-05-01"),
    updatedAt: new Date("2024-05-05")
  },
  {
    id: "leave-2",
    employeeId: "emp-2",
    employeeName: "Jane Smith",
    type: "sick",
    startDate: new Date("2024-05-10"),
    endDate: new Date("2024-05-12"),
    reason: "Flu",
    status: "pending",
    createdAt: new Date("2024-05-09"),
    updatedAt: new Date("2024-05-09")
  }
];
