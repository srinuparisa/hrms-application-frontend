// import { Department, Designation, Employee, Attendance, LeaveRequest, Payroll, Holiday, Announcement, SystemUser, AuditLog } from '../types';

// export const initialDepartments: Department[] = [
//   { id: 'DEPT-01', name: 'Engineering', description: 'Software design, product development, and infrastructure scaling.' },
//   { id: 'DEPT-02', name: 'Human Resources', description: 'Talent acquisition, employee welfare, payroll processing, and policy enforcement.' },
//   { id: 'DEPT-03', name: 'Finance', description: 'Financial planning, accounting, audits, budgeting, and tax compliance.' },
//   { id: 'DEPT-04', name: 'Marketing & Sales', description: 'Brand strategy, client acquisition, and digital marketing outreach.' },
//   { id: 'DEPT-05', name: 'Operations', description: 'Office management, procurement, customer support, and IT support.' }
// ];

// export const initialDesignations: Designation[] = [
//   { id: 'DESG-01', name: 'Senior Software Engineer', departmentId: 'DEPT-01' },
//   { id: 'DESG-02', name: 'QA Engineer', departmentId: 'DEPT-01' },
//   { id: 'DESG-03', name: 'Engineering Manager', departmentId: 'DEPT-01' },
//   { id: 'DESG-04', name: 'HR Executive', departmentId: 'DEPT-02' },
//   { id: 'DESG-05', name: 'HR Manager', departmentId: 'DEPT-02' },
//   { id: 'DESG-06', name: 'Finance Analyst', departmentId: 'DEPT-03' },
//   { id: 'DESG-07', name: 'Chief Financial Officer', departmentId: 'DEPT-03' },
//   { id: 'DESG-08', name: 'Marketing Manager', departmentId: 'DEPT-04' },
//   { id: 'DESG-09', name: 'Sales Executive', departmentId: 'DEPT-04' },
//   { id: 'DESG-10', name: 'Operations Lead', departmentId: 'DEPT-05' }
// ];

// export const initialEmployees: Employee[] = [
//   {
//     id: 'EMP-101',
//     firstName: 'John',
//     lastName: 'Doe',
//     gender: 'Male',
//     dob: '1990-05-15',
//     email: 'john.doe@company.com',
//     mobile: '+91 98765 43210',
//     address: 'Flat 402, Gachibowli, Hyderabad, Telangana, 500032',
//     joiningDate: '2021-03-01',
//     departmentId: 'DEPT-01',
//     designationId: 'DESG-03',
//     salary: 95000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-102',
//     firstName: 'Jane',
//     lastName: 'Smith',
//     gender: 'Female',
//     dob: '1993-08-22',
//     email: 'jane.smith@company.com',
//     mobile: '+91 98765 12345',
//     address: 'H.No 12-4/A, Madhapur, Hyderabad, Telangana, 500081',
//     joiningDate: '2022-06-15',
//     departmentId: 'DEPT-01',
//     designationId: 'DESG-01',
//     salary: 80000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-103',
//     firstName: 'Sarah',
//     lastName: 'Connor',
//     gender: 'Female',
//     dob: '1988-11-30',
//     email: 'sarah.connor@company.com',
//     mobile: '+91 98765 67890',
//     address: 'Plot 88, Jubilee Hills, Hyderabad, Telangana, 500033',
//     joiningDate: '2019-10-10',
//     departmentId: 'DEPT-02',
//     designationId: 'DESG-05',
//     salary: 75000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-104',
//     firstName: 'Michael',
//     lastName: 'Scott',
//     gender: 'Male',
//     dob: '1975-03-15',
//     email: 'michael.scott@company.com',
//     mobile: '+91 98765 54321',
//     address: 'Villas 14, Kondapur, Hyderabad, Telangana, 500084',
//     joiningDate: '2018-01-01',
//     departmentId: 'DEPT-04',
//     designationId: 'DESG-08',
//     salary: 68000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-105',
//     firstName: 'David',
//     lastName: 'Miller',
//     gender: 'Male',
//     dob: '1995-12-04',
//     email: 'david.miller@company.com',
//     mobile: '+91 98765 11223',
//     address: 'Flat 101, Banjara Hills, Hyderabad, Telangana, 500034',
//     joiningDate: '2023-01-15',
//     departmentId: 'DEPT-03',
//     designationId: 'DESG-06',
//     salary: 58000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-106',
//     firstName: 'Emily',
//     lastName: 'Watson',
//     gender: 'Female',
//     dob: '1996-04-18',
//     email: 'emily.watson@company.com',
//     mobile: '+91 98765 44556',
//     address: 'H.No 3-9, Kukatpally, Hyderabad, Telangana, 500072',
//     joiningDate: '2023-09-01',
//     departmentId: 'DEPT-02',
//     designationId: 'DESG-04',
//     salary: 42000,
//     status: 'Active'
//   },
//   {
//     id: 'EMP-107',
//     firstName: 'Robert',
//     lastName: 'Chen',
//     gender: 'Male',
//     dob: '1991-07-25',
//     email: 'robert.chen@company.com',
//     mobile: '+91 98765 77889',
//     address: 'Plot 205, Miyapur, Hyderabad, Telangana, 500049',
//     joiningDate: '2022-11-01',
//     departmentId: 'DEPT-01',
//     designationId: 'DESG-02',
//     salary: 62000,
//     status: 'Active'
//   }
// ];

// export const initialAttendance: Attendance[] = [
//   // Attendance records for yesterday (2026-07-02)
//   { id: 'ATT-001', employeeId: 'EMP-101', date: '2026-07-02', checkIn: '08:55', checkOut: '17:30', workingHours: 8.5, status: 'Present' },
//   { id: 'ATT-002', employeeId: 'EMP-102', date: '2026-07-02', checkIn: '09:05', checkOut: '18:00', workingHours: 8.9, status: 'Present' },
//   { id: 'ATT-003', employeeId: 'EMP-103', date: '2026-07-02', checkIn: '08:45', checkOut: '17:15', workingHours: 8.5, status: 'Present' },
//   { id: 'ATT-004', employeeId: 'EMP-104', date: '2026-07-02', checkIn: '09:40', checkOut: '17:00', workingHours: 7.3, status: 'Late' },
//   { id: 'ATT-005', employeeId: 'EMP-105', date: '2026-07-02', checkIn: '08:50', checkOut: '17:45', workingHours: 8.9, status: 'Present' },
//   { id: 'ATT-006', employeeId: 'EMP-106', date: '2026-07-02', checkIn: '09:15', checkOut: '17:30', workingHours: 8.25, status: 'Late' },
//   { id: 'ATT-007', employeeId: 'EMP-107', date: '2026-07-02', checkIn: '00:00', checkOut: null, workingHours: 0, status: 'Absent' },

//   // Attendance records for today (2026-07-03)
//   { id: 'ATT-008', employeeId: 'EMP-101', date: '2026-07-03', checkIn: '08:50', checkOut: null, workingHours: 0, status: 'Present' },
//   { id: 'ATT-009', employeeId: 'EMP-102', date: '2026-07-03', checkIn: '08:58', checkOut: null, workingHours: 0, status: 'Present' },
//   { id: 'ATT-010', employeeId: 'EMP-103', date: '2026-07-03', checkIn: '09:20', checkOut: null, workingHours: 0, status: 'Late' },
//   { id: 'ATT-011', employeeId: 'EMP-104', date: '2026-07-03', checkIn: '09:02', checkOut: null, workingHours: 0, status: 'Present' },
//   { id: 'ATT-012', employeeId: 'EMP-105', date: '2026-07-03', checkIn: '08:42', checkOut: null, workingHours: 0, status: 'Present' },
//   { id: 'ATT-013', employeeId: 'EMP-106', date: '2026-07-03', checkIn: '00:00', checkOut: null, workingHours: 0, status: 'On Leave' },
//   { id: 'ATT-014', employeeId: 'EMP-107', date: '2026-07-03', checkIn: '09:12', checkOut: null, workingHours: 0, status: 'Late' }
// ];

// export const initialLeaveRequests: LeaveRequest[] = [
//   {
//     id: 'LV-501',
//     employeeId: 'EMP-106',
//     leaveType: 'Sick',
//     startDate: '2026-07-02',
//     endDate: '2026-07-03',
//     reason: 'Suffering from cold and mild fever. Resting at home.',
//     status: 'Approved',
//     appliedDate: '2026-07-01',
//     actionBy: 'Sarah Connor (HR)',
//     comments: 'Take care, resting approved.'
//   },
//   {
//     id: 'LV-502',
//     employeeId: 'EMP-102',
//     leaveType: 'Casual',
//     startDate: '2026-07-10',
//     endDate: '2026-07-13',
//     reason: 'Family gathering out of state.',
//     status: 'Pending',
//     appliedDate: '2026-07-02'
//   },
//   {
//     id: 'LV-503',
//     employeeId: 'EMP-105',
//     leaveType: 'Earned',
//     startDate: '2026-07-20',
//     endDate: '2026-07-27',
//     reason: 'Summer vacation trip.',
//     status: 'Pending',
//     appliedDate: '2026-06-29'
//   },
//   {
//     id: 'LV-504',
//     employeeId: 'EMP-104',
//     leaveType: 'Casual',
//     startDate: '2026-06-20',
//     endDate: '2026-06-21',
//     reason: 'Personal paperwork at city hall.',
//     status: 'Approved',
//     appliedDate: '2026-06-18',
//     actionBy: 'Sarah Connor (HR)',
//     comments: 'Approved.'
//   },
//   {
//     id: 'LV-505',
//     employeeId: 'EMP-107',
//     leaveType: 'Sick',
//     startDate: '2026-06-05',
//     endDate: '2026-06-05',
//     reason: 'Dental appointment.',
//     status: 'Rejected',
//     appliedDate: '2026-06-04',
//     actionBy: 'John Doe (Manager)',
//     comments: 'Rejected due to critical deployment schedule. Please reschedule to weekend.'
//   }
// ];

// export const initialPayrollList: Payroll[] = [
//   {
//     id: 'PAY-1001',
//     employeeId: 'EMP-101',
//     month: 'June 2026',
//     basicSalary: 6000,
//     hra: 1500,
//     allowances: 2000,
//     deductions: 500,
//     netSalary: 9000,
//     status: 'Paid',
//     processedDate: '2026-06-28'
//   },
//   {
//     id: 'PAY-1002',
//     employeeId: 'EMP-102',
//     month: 'June 2026',
//     basicSalary: 5000,
//     hra: 1200,
//     allowances: 1800,
//     deductions: 400,
//     netSalary: 7600,
//     status: 'Paid',
//     processedDate: '2026-06-28'
//   },
//   {
//     id: 'PAY-1003',
//     employeeId: 'EMP-103',
//     month: 'June 2026',
//     basicSalary: 4500,
//     hra: 1100,
//     allowances: 1900,
//     deductions: 350,
//     netSalary: 7150,
//     status: 'Paid',
//     processedDate: '2026-06-28'
//   },
//   {
//     id: 'PAY-1004',
//     employeeId: 'EMP-104',
//     month: 'June 2026',
//     basicSalary: 4200,
//     hra: 1000,
//     allowances: 1600,
//     deductions: 300,
//     netSalary: 6500,
//     status: 'Paid',
//     processedDate: '2026-06-28'
//   },
//   {
//     id: 'PAY-1005',
//     employeeId: 'EMP-105',
//     month: 'June 2026',
//     basicSalary: 3800,
//     hra: 800,
//     allowances: 1200,
//     deductions: 250,
//     netSalary: 5550,
//     status: 'Processed',
//     processedDate: '2026-06-29'
//   }
// ];

// export const initialHolidays: Holiday[] = [
//   { id: 'HOL-01', name: 'New Year\'s Day', date: '2026-01-01', type: 'National' },
//   { id: 'HOL-02', name: 'Memorial Day', date: '2026-05-25', type: 'National' },
//   { id: 'HOL-03', name: 'Independence Day', date: '2026-07-04', type: 'National' },
//   { id: 'HOL-04', name: 'Labor Day', date: '2026-09-07', type: 'National' },
//   { id: 'HOL-05', name: 'Thanksgiving', date: '2026-11-26', type: 'National' },
//   { id: 'HOL-06', name: 'Christmas Day', date: '2026-12-25', type: 'National' },
//   { id: 'HOL-07', name: 'Founder\'s Anniversary', date: '2026-10-15', type: 'Regional' }
// ];

// export const initialAnnouncements: Announcement[] = [
//   {
//     id: 'ANN-01',
//     title: 'Mid-Year Review Guidelines',
//     content: 'The mid-year appraisal and goal alignment review starts next week. Please update your completed KPIs and book a slot with your direct reports/managers by July 10th.',
//     date: '2026-07-01',
//     category: 'Policy',
//     targetAudience: 'All'
//   },
//   {
//     id: 'ANN-02',
//     title: 'Annual Office Summer Picnic',
//     content: 'We are thrilled to announce our Summer Picnic at Golden Gate Park on Saturday, July 18th, from 11:30 AM to 5:00 PM. Catered lunch, beverages, and team-building tournaments are provided. Families welcome!',
//     date: '2026-06-28',
//     category: 'Event',
//     targetAudience: 'All'
//   },
//   {
//     id: 'ANN-03',
//     title: 'New Security Guidelines & Keycards',
//     content: 'Please make sure to exchange your outdated office access badges for the new secure biometric keys at the front desk by this Friday. Old keycards will stop working starting Monday.',
//     date: '2026-06-25',
//     category: 'Urgent',
//     targetAudience: 'All'
//   },
//   {
//     id: 'ANN-04',
//     title: 'Updated Manager Coaching Program',
//     content: 'All engineering leads and department manager roles should attend the upcoming Leadership Coach sessions commencing on July 14th.',
//     date: '2026-06-20',
//     category: 'Policy',
//     targetAudience: 'Managers'
//   }
// ];

// export const initialSystemUsers: SystemUser[] = [
//   { id: 'USR-01', username: 'admin', email: 'admin@company.com', role: 'Super Admin', status: 'Active' },
//   { id: 'USR-02', username: 'hr_sarah', email: 'sarah.connor@company.com', role: 'HR', employeeId: 'EMP-103', status: 'Active' },
//   { id: 'USR-03', username: 'manager_john', email: 'john.doe@company.com', role: 'Manager', employeeId: 'EMP-101', status: 'Active' },
//   { id: 'USR-04', username: 'employee_jane', email: 'jane.smith@company.com', role: 'Employee', employeeId: 'EMP-102', status: 'Active' }
// ];

// export const initialAuditLogs: AuditLog[] = [
//   {
//     id: 'AUD-001',
//     timestamp: '2026-07-01 09:15:32',
//     actorUsername: 'admin',
//     actorRole: 'Super Admin',
//     actionType: 'INSERT',
//     affectedTable: 'system_users',
//     affectedRecordId: 'USR-02',
//     details: 'Created system user hr_sarah with HR role and linked to Employee EMP-103'
//   },
//   {
//     id: 'AUD-002',
//     timestamp: '2026-07-01 10:30:11',
//     actorUsername: 'hr_sarah',
//     actorRole: 'HR',
//     actionType: 'INSERT',
//     affectedTable: 'employees',
//     affectedRecordId: 'EMP-106',
//     details: 'Registered new employee Bobby Flay under Operations department'
//   },
//   {
//     id: 'AUD-003',
//     timestamp: '2026-07-02 11:12:45',
//     actorUsername: 'hr_sarah',
//     actorRole: 'HR',
//     actionType: 'ROLE_SWITCH',
//     affectedTable: 'system_users',
//     affectedRecordId: 'USR-04',
//     details: 'Elevated employee_jane registration from Pending Approval to Active Employee'
//   },
//   {
//     id: 'AUD-004',
//     timestamp: '2026-07-02 14:22:01',
//     actorUsername: 'manager_john',
//     actorRole: 'Manager',
//     actionType: 'LEAVE_APPROVAL',
//     affectedTable: 'leave_requests',
//     affectedRecordId: 'LV-501',
//     details: 'Approved sick leave request of EMP-106 for period 2026-07-02 to 2026-07-03'
//   },
//   {
//     id: 'AUD-005',
//     timestamp: '2026-07-02 16:45:10',
//     actorUsername: 'hr_sarah',
//     actorRole: 'HR',
//     actionType: 'UPDATE',
//     affectedTable: 'employees',
//     affectedRecordId: 'EMP-102',
//     details: 'Modified Employee Jane Smith record. Adjusted monthly salary to ₹45,000'
//   }
// ];

