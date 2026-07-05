export type UserRole = 'Super Admin' | 'HR' | 'Manager' | 'Employee';

export interface Employee {
  id: string; // e.g., "EMP-101"
  firstName: string;
  lastName: string;
  gender: 'Male' | 'Female' | 'Other';
  dob: string;
  email: string;
  mobile: string;
  address: string;
  joiningDate: string;
  departmentId: string; // references Department
  designationId: string; // references Designation
  salary: number;
  status: 'Active' | 'Inactive';
  profilePhoto?: string;
  branch?: string;
  managerId?: string;
}

export interface Department {
  id: string; // e.g., "DEPT-01"
  name: string;
  description: string;
}

export interface Designation {
  id: string; // e.g., "DESG-01"
  name: string;
  departmentId: string; // associated department
}

export interface Attendance {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  checkIn: string; // HH:MM
  checkOut: string | null; // HH:MM or null
  workingHours: number; // calculated
  status: 'Present' | 'Late' | 'Absent' | 'On Leave';
  shift?: 'General' | 'Morning' | 'Afternoon' | 'Night';
  gracePeriod?: number; // minutes, e.g. 10, 15
  lateMinutes?: number; // minutes they were late by
  regularizationStatus?: 'None' | 'Pending' | 'Approved' | 'Rejected';
  regularizationReason?: string;
  regularizationCheckIn?: string;
  regularizationCheckOut?: string;
}

export interface LeaveRequest {
  id: string;
  employeeId: string;
  leaveType: 'Casual' | 'Sick' | 'Earned';
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected';
  appliedDate: string;
  actionBy?: string; // name of manager/HR who approved/rejected
  comments?: string;
}

export interface Payroll {
  id: string;
  employeeId: string;
  month: string; // e.g., "June 2026"
  basicSalary: number;
  hra: number;
  allowances: number;
  deductions: number;
  netSalary: number;
  status: 'Draft' | 'Processed' | 'Paid';
  processedDate?: string;
}

export interface Holiday {
  id: string;
  name: string;
  date: string; // YYYY-MM-DD
  type: 'National' | 'Regional' | 'Optional';
}

export interface Announcement {
  id: string;
  title: string;
  content: string;
  date: string; // YYYY-MM-DD
  category: 'General' | 'Event' | 'Policy' | 'Urgent';
  targetAudience: 'All' | 'HR' | 'Managers' | 'Employees';
}

export interface SystemUser {
  id: string;
  username: string;
  email: string;
  password?: string;
  role: UserRole;
  employeeId?: string; // Optional links to Employee record
  status: 'Active' | 'Suspended' | 'Pending Approval';
  // Pending registration details
  firstName?: string;
  lastName?: string;
  gender?: 'Male' | 'Female' | 'Other';
  dob?: string;
  mobile?: string;
  address?: string;
  branch?: string;
  departmentId?: string;
  designationId?: string;
}

export interface AuditLog {
  id: string;
  timestamp: string; // YYYY-MM-DD HH:MM:SS
  actorUsername: string;
  actorRole: string;
  actionType: 'INSERT' | 'UPDATE' | 'DELETE' | 'ROLE_SWITCH' | 'LEAVE_APPROVAL' | 'PAYROLL_PROCESS' | 'USER_APPROVAL' | 'PASSWORD_RESET' | 'PROFILE_CHANGE';
  affectedTable: string; // 'employees' | 'departments' | 'designations' | 'attendance' | 'leave_requests' | 'payroll' | 'system_users' | 'holidays' | 'announcements'
  affectedRecordId: string;
  details: string; // Description of changes
}
