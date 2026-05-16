import { Timestamp } from 'firebase/firestore/lite';

export type EmployeeStatus = 'active' | 'onboarding' | 'suspended' | 'terminated';
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  email: string;
  avatarUrl?: string;
  jobTitle: string;
  department: string;
  managerId?: string;
  joiningDate: Date | Timestamp;
  status: EmployeeStatus;
  phoneNumber?: string;
  officeLocation?: string;
  salary?: number;
  currency?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  employeeName: string;
  type: LeaveType;
  startDate: Date | Timestamp;
  endDate: Date | Timestamp;
  reason: string;
  status: LeaveStatus;
  approvedById?: string;
  createdAt: Date | Timestamp;
  updatedAt: Date | Timestamp;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  date: Date | Timestamp;
  rating: number; // 1-5
  feedback: {
    strengths: string[];
    improvements: string[];
    general: string;
  };
  goals: string[];
  status: 'draft' | 'completed';
}

export interface Department {
  id: string;
  name: string;
  headId: string;
  parentDepartmentId?: string;
}

export type AttendanceStatus = 'present' | 'late' | 'absent' | 'half-day';

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // ISO Date YYYY-MM-DD
  checkIn: string | Timestamp; // ISO Date or Firebase Timestamp
  checkOut?: string | Timestamp;
  status: AttendanceStatus;
  totalHours?: number;
  location?: string;
  notes?: string;
}

