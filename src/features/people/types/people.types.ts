import { Timestamp } from 'firebase/firestore';

export type EmployeeStatus = 'active' | 'onboarding' | 'suspended' | 'terminated';
export type LeaveType = 'vacation' | 'sick' | 'personal' | 'unpaid' | 'maternity' | 'paternity';
export type LeaveStatus = 'pending' | 'approved' | 'rejected' | 'cancelled';
export type UserRole = 'super_admin' | 'admin' | 'manager' | 'employee';

export interface ChecklistItem {
  id: string;
  task: string;
  isCompleted: boolean;
  completedAt?: Date | Timestamp | null;
}

export interface Employee {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  /** Some auto-provisioned records use a single name field. */
  name?: string;
  email: string;
  avatarUrl?: string;
  jobTitle: string;
  department: string;
  role?: UserRole;
  permissions?: string[];
  managerId?: string;
  joiningDate: Date | Timestamp;
  status: EmployeeStatus;
  phoneNumber?: string;
  officeLocation?: string;
  /** Work locations this employee may check in from (Jisr-style geofence). */
  attendanceLocationIds?: string[];
  /**
   * geofence: must be inside an assigned location radius.
   * flexible: check-in allowed from anywhere (remote / field).
   */
  attendanceCheckMode?: "geofence" | "flexible";
  salary?: number;
  currency?: string;
  onboardingTasks?: ChecklistItem[];
  offboardingTasks?: ChecklistItem[];
  skills?: { name: string; level: number }[];
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
  checkInLat?: number;
  checkInLng?: number;
  checkInLocationId?: string;
  checkInLocationName?: string;
  checkInDistanceMeters?: number;
  checkOutLat?: number;
  checkOutLng?: number;
  checkOutLocationId?: string;
  checkOutLocationName?: string;
  checkOutDistanceMeters?: number;
}

export type AttendanceCheckMode = "geofence" | "flexible";

export interface WorkLocation {
  id: string;
  name: string;
  address?: string;
  lat: number;
  lng: number;
  /** Allowed distance from the pin, in meters (Jisr default is typically 100–200). */
  radiusMeters: number;
  isActive: boolean;
  createdAt?: Date | Timestamp | string;
  updatedAt?: Date | Timestamp | string;
}

export type CreateWorkLocationDTO = Omit<WorkLocation, "id" | "createdAt" | "updatedAt">;

export interface AttendanceGeoPayload {
  lat: number;
  lng: number;
  accuracyMeters?: number;
  locationId?: string;
  locationName?: string;
  distanceMeters?: number;
}

export interface Asset {
  id: string;
  name: string;
  serialNumber: string;
  category: 'laptop' | 'phone' | 'accessory' | 'other';
  assignedTo: string; // employeeId
  status: 'assigned' | 'returned' | 'repair' | 'lost';
  assignedDate: Date | Timestamp;
  returnedDate?: Date | Timestamp | null;
  notes?: string;
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  authorId: string;
  createdAt: Date | Timestamp;
  priority: 'low' | 'medium' | 'high';
}
