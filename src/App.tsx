import React, { useState, useEffect } from 'react';
import { 
  Building2, Lock, User, CheckCircle2, ShieldAlert, KeyRound, ArrowRight, UserPlus, Sun, Moon 
} from 'lucide-react';

import { 
  Employee, Department, Designation, Attendance, 
  LeaveRequest, Payroll, Holiday, Announcement, SystemUser, UserRole, AuditLog 
} from './types';

// Modular Components
import Sidebar from './components/Sidebar';
import Navbar from './components/Navbar';
import DashboardView from './components/DashboardView';
import EmployeeView from './components/EmployeeView';
import DepartmentView from './components/DepartmentView';
import DesignationView from './components/DesignationView';
import AttendanceView from './components/AttendanceView';
import LeaveView from './components/LeaveView';
import PayrollView from './components/PayrollView';
import HolidayView from './components/HolidayView';
import AnnouncementView from './components/AnnouncementView';
import UserView from './components/UserView';
import ReportView from './components/ReportView';

import { apiService } from './services/api';

export default function App() {
  // --- AUTHENTICATION STATE ---
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(() => {
    return localStorage.getItem('hrms_auth') === 'true';
  });
  const [currentUser, setCurrentUser] = useState<SystemUser | null>(() => {
    const cached = localStorage.getItem('hrms_user');
    return cached ? JSON.parse(cached) : null;
  });
  
  // Credentials input
  const [loginUsername, setLoginUsername] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // --- REGISTRATION STATE ---
  const [isRegisterMode, setIsRegisterMode] = useState<boolean>(false);
  const [isForgotMode, setIsForgotMode] = useState<boolean>(false);
  const [forgotUsername, setForgotUsername] = useState('');
  const [forgotNewPassword, setForgotNewPassword] = useState('');
  const [forgotConfirmPassword, setForgotConfirmPassword] = useState('');

  const [registerSuccessMsg, setRegisterSuccessMsg] = useState<string>('');
  const [regForm, setRegForm] = useState({
    username: '',
    email: '',
    password: '',
    firstName: '',
    lastName: '',
    gender: 'Male' as 'Male' | 'Female' | 'Other',
    dob: '1995-05-15',
    mobile: '',
    address: '',
    branch: 'Main Head Office',
    departmentId: 'DEPT-01',
    designationId: 'DESG-01'
  });

  // --- APPLICATION STATE ---
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Theme switcher state (light / dark)
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    const saved = localStorage.getItem('hrms-theme');
    return (saved === 'dark' || saved === 'light') ? saved : 'light';
  });

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
      localStorage.setItem('hrms-theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('hrms-theme', 'light');
    }
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
  
  // Custom Toast State
  const [toast, setToast] = useState<{ show: boolean; msg: string; type: 'success' | 'info' | 'error' }>({
    show: false,
    msg: '',
    type: 'success'
  });

  const triggerToast = (msg: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToast({ show: true, msg, type });
    setTimeout(() => {
      setToast(prev => ({ ...prev, show: false }));
    }, 4000);
  };

  // State arrays initialized from LocalStorage or Fallbacks
  const [departments, setDepartments] = useState<Department[]>(() => {
    const cached = localStorage.getItem('hrms_departments');
    return cached ? JSON.parse(cached) : [];
  });

  const [designations, setDesignations] = useState<Designation[]>(() => {
    const cached = localStorage.getItem('hrms_designations');
    return cached ? JSON.parse(cached) : [];
  });

  const [employees, setEmployees] = useState<Employee[]>(() => {
    const cached = localStorage.getItem('hrms_employees');
    return cached ? JSON.parse(cached) : [];
  });

  const [attendance, setAttendance] = useState<Attendance[]>(() => {
    const cached = localStorage.getItem('hrms_attendance');
    return cached ? JSON.parse(cached) : [];
  });

  const [leaves, setLeaves] = useState<LeaveRequest[]>(() => {
    const cached = localStorage.getItem('hrms_leaves');
    return cached ? JSON.parse(cached) : [];
  });

  const [payrollList, setPayrollList] = useState<Payroll[]>(() => {
    const cached = localStorage.getItem('hrms_payroll');
    return cached ? JSON.parse(cached) : [];
  });

  const [holidays, setHolidays] = useState<Holiday[]>(() => {
    const cached = localStorage.getItem('hrms_holidays');
    return cached ? JSON.parse(cached) : [];
  });

  const [announcements, setAnnouncements] = useState<Announcement[]>(() => {
    const cached = localStorage.getItem('hrms_announcements');
    return cached ? JSON.parse(cached) : [];
  });

  const [systemUsers, setSystemUsers] = useState<SystemUser[]>(() => {
    const cached = localStorage.getItem('hrms_system_users');
    return cached ? JSON.parse(cached) : [];
  });

  // --- SYNC STATE TO LOCAL STORAGE ---
  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_departments', JSON.stringify(departments));
    }
  }, [departments]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_designations', JSON.stringify(designations));
    }
  }, [designations]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_employees', JSON.stringify(employees));
    }
  }, [employees]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_attendance', JSON.stringify(attendance));
    }
  }, [attendance]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_leaves', JSON.stringify(leaves));
    }
  }, [leaves]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_payroll', JSON.stringify(payrollList));
    }
  }, [payrollList]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_holidays', JSON.stringify(holidays));
    }
  }, [holidays]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_announcements', JSON.stringify(announcements));
    }
  }, [announcements]);

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_system_users', JSON.stringify(systemUsers));
    }
  }, [systemUsers]);

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const cached = localStorage.getItem('hrms_audit_logs');
    return cached ? JSON.parse(cached) : [];
  });

  useEffect(() => {
    if (!isApiConnected) {
      localStorage.setItem('hrms_audit_logs', JSON.stringify(auditLogs));
    }
  }, [auditLogs]);

  // --- DATABASE HYBRID CONNECTION & INITIAL SYNC ---
  const [isApiConnected, setIsApiConnected] = useState<boolean>(false);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    async function checkAndSync() {
      const connected = await apiService.checkHealth();
      if (connected) {
        setIsApiConnected(true);
        setIsSyncing(true);
        console.log('✔ Connected to Node.js backend. Syncing ERP data...');
        try {
          const deptsRes = await apiService.departments.getAll();
          if (deptsRes.success) setDepartments(deptsRes.data);
          
          const desgsRes = await apiService.designations.getAll();
          if (desgsRes.success) setDesignations(desgsRes.data);

          const empsRes = await apiService.employees.getAll();
          if (empsRes.success) setEmployees(empsRes.data);

          const attRes = await apiService.attendance.getAll();
          if (attRes.success) setAttendance(attRes.data);

          const leavesRes = await apiService.leaves.getAll();
          if (leavesRes.success) setLeaves(leavesRes.data);

          const payrollRes = await apiService.payroll.getAll();
          if (payrollRes.success) setPayrollList(payrollRes.data);

          const holRes = await apiService.holidays.getAll();
          if (holRes.success) setHolidays(holRes.data);

          const annRes = await apiService.announcements.getAll();
          if (annRes.success) setAnnouncements(annRes.data);

          const role = currentUser?.role;
          if (role === 'Super Admin' || role === 'HR') {
            const usersRes = await apiService.users.getAll();
            if (usersRes.success) setSystemUsers(usersRes.data);

            const auditRes = await apiService.audit.getAll();
            if (auditRes.success) setAuditLogs(auditRes.data);
          }
        } catch (err: any) {
          console.warn('Initial DB sync failed, falling back to local state:', err.message);
        } finally {
          setIsSyncing(false);
        }
      } else {
        setIsApiConnected(false);
        console.log('ℹ Node.js backend offline. Operating in Sandbox LocalStorage mode.');
      }
    }
    checkAndSync();
  }, [isAuthenticated, currentUser?.role]);

  const logSystemAction = (
    actionType: AuditLog['actionType'],
    affectedTable: AuditLog['affectedTable'],
    affectedRecordId: string,
    details: string,
    actorNameOverride?: string,
    actorRoleOverride?: string
  ) => {
    if (isApiConnected) {
      // Backend automatically logs audit actions via its endpoints
      return;
    }
    const now = new Date();
    const formattedDate = now.getFullYear() + '-' + 
      String(now.getMonth() + 1).padStart(2, '0') + '-' + 
      String(now.getDate()).padStart(2, '0') + ' ' + 
      String(now.getHours()).padStart(2, '0') + ':' + 
      String(now.getMinutes()).padStart(2, '0') + ':' + 
      String(now.getSeconds()).padStart(2, '0');

    const newLog: AuditLog = {
      id: `AUD-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      timestamp: formattedDate,
      actorUsername: actorNameOverride || currentUser?.username || 'system',
      actorRole: actorRoleOverride || currentUser?.role || 'System',
      actionType,
      affectedTable,
      affectedRecordId,
      details
    };

    setAuditLogs(prev => [newLog, ...prev]);
  };


  // --- LOGIN HANDLER ---
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!loginUsername || !loginPassword) {
      setAuthError('Please fill out both username and password fields.');
      return;
    }

    if (isApiConnected) {
      try {
        const res = await apiService.auth.login({ username: loginUsername, password: loginPassword });
        if (res.success) {
          localStorage.setItem('hrms_jwt_token', res.token);
          setIsAuthenticated(true);
          setCurrentUser(res.user);
          localStorage.setItem('hrms_auth', 'true');
          localStorage.setItem('hrms_user', JSON.stringify(res.user));
          triggerToast(`Signed in successfully as ${res.user.username}!`, 'success');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Invalid credentials.');
      }
      return;
    }

    // Match username against system account list (Password is simulated admin123 / default allow for evaluation speed)
    const matchUser = systemUsers.find(
      u => u.username.toLowerCase() === loginUsername.trim().toLowerCase()
    );

    if (matchUser) {
      if (matchUser.password && matchUser.password !== loginPassword) {
        setAuthError('Incorrect password. Please try again or use the Forget Password option.');
        return;
      }
      if (matchUser.status === 'Pending Approval') {
        setAuthError('Your registration is pending approval by HR. You can access the system once approved.');
        return;
      }
      if (matchUser.status === 'Suspended') {
        setAuthError('This account has been suspended. Please contact Super Admin.');
        return;
      }
      setIsAuthenticated(true);
      setCurrentUser(matchUser);
      localStorage.setItem('hrms_auth', 'true');
      localStorage.setItem('hrms_user', JSON.stringify(matchUser));
      triggerToast(`Signed in successfully as ${matchUser.username}!`, 'success');
    } else {
      setAuthError('Invalid credentials. Check the helper quick-fill buttons below!');
    }
  };

  // --- FORGOT PASSWORD HANDLER ---
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!forgotUsername || !forgotNewPassword || !forgotConfirmPassword) {
      setAuthError('Please fill out all fields.');
      return;
    }

    if (forgotNewPassword !== forgotConfirmPassword) {
      setAuthError('Passwords do not match.');
      return;
    }

    if (isApiConnected) {
      try {
        const res = await apiService.auth.resetPassword({ username: forgotUsername, newPassword: forgotNewPassword });
        if (res.success) {
          setIsForgotMode(false);
          triggerToast('Password reset successful! You can now log in.', 'success');
          setForgotUsername('');
          setForgotNewPassword('');
          setForgotConfirmPassword('');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Password reset failed.');
      }
      return;
    }

    const userIndex = systemUsers.findIndex(
      u => u.username.toLowerCase() === forgotUsername.trim().toLowerCase() ||
           u.email.toLowerCase() === forgotUsername.trim().toLowerCase()
    );

    if (userIndex === -1) {
      setAuthError('No registered user account found matching that username or email.');
      return;
    }

    const updatedUsers = [...systemUsers];
    updatedUsers[userIndex] = {
      ...updatedUsers[userIndex],
      password: forgotNewPassword.trim()
    };

    setSystemUsers(updatedUsers);
    setIsForgotMode(false);
    logSystemAction(
      'PASSWORD_RESET',
      'system_users',
      updatedUsers[userIndex].id,
      `Password reset successful for user: ${updatedUsers[userIndex].username}`,
      updatedUsers[userIndex].username,
      updatedUsers[userIndex].role
    );
    triggerToast('Password reset successful! You can now log in with your new password.', 'success');
    setForgotUsername('');
    setForgotNewPassword('');
    setForgotConfirmPassword('');
  };

  // --- REGISTRATION HANDLER ---
  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError('');

    if (!regForm.username || !regForm.email || !regForm.password || !regForm.firstName || !regForm.lastName) {
      setAuthError('Please fill out all mandatory fields.');
      return;
    }

    if (isApiConnected) {
      try {
        const res = await apiService.auth.register(regForm);
        if (res.success) {
          setIsRegisterMode(false);
          setRegisterSuccessMsg(res.message);
          triggerToast('Registration request submitted successfully!', 'success');
        }
      } catch (err: any) {
        setAuthError(err.message || 'Registration failed.');
      }
      return;
    }

    // Check if username already exists
    const userExists = systemUsers.some(u => u.username.toLowerCase() === regForm.username.trim().toLowerCase());
    if (userExists) {
      setAuthError('Username is already taken. Please choose a different one.');
      return;
    }

    let maxUserNum = 0;
    systemUsers.forEach(u => {
      if (u.id) {
        const match = u.id.match(/^USR-(\d+)$/i);
        if (match) {
          const parsed = parseInt(match[1], 10);
          if (!isNaN(parsed) && parsed > maxUserNum) {
            maxUserNum = parsed;
          }
        }
      }
    });
    const nextUserIdNum = maxUserNum + 1;
    const nextUserId = `USR-${String(nextUserIdNum).padStart(2, '0')}`;
    const newUser: SystemUser = {
      id: nextUserId,
      username: regForm.username.trim(),
      email: regForm.email.trim(),
      password: regForm.password.trim(),
      role: 'Employee',
      status: 'Pending Approval',
      firstName: regForm.firstName.trim(),
      lastName: regForm.lastName.trim(),
      gender: regForm.gender,
      dob: regForm.dob,
      mobile: regForm.mobile.trim(),
      address: regForm.address.trim(),
      branch: regForm.branch,
      departmentId: regForm.departmentId,
      designationId: regForm.designationId
    };

    setSystemUsers(prev => [...prev, newUser]);
    setIsRegisterMode(false);
    logSystemAction(
      'INSERT',
      'system_users',
      nextUserId,
      `Submitted self-registration request for username "${regForm.username}" with email "${regForm.email}"`,
      regForm.username,
      'Employee'
    );
    setRegisterSuccessMsg(`Your registration request for username "${regForm.username}" has been sent to HR for approval. You can access the ERP system once your registration is approved.`);
    triggerToast('Registration request submitted successfully!', 'success');
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    localStorage.removeItem('hrms_auth');
    localStorage.removeItem('hrms_user');
    localStorage.removeItem('hrms_jwt_token');
  };

  // Let sandbox users switch roles in active header bar
  const handleHotRoleSwitch = (newRole: UserRole) => {
    if (currentUser) {
      const oldRole = currentUser.role;
      const updated = { ...currentUser, role: newRole };
      setCurrentUser(updated);
      localStorage.setItem('hrms_user', JSON.stringify(updated));
      logSystemAction(
        'ROLE_SWITCH',
        'system_users',
        currentUser.id,
        `Developer Hot Role Switch: switched security clearance from "${oldRole}" to "${newRole}"`,
        currentUser.username,
        newRole
      );
      triggerToast(`Access clearance level changed to ${newRole}!`, 'info');
      
      // Auto redirect if tab matches a forbidden module
      const isEmployeeRole = newRole === 'Employee';
      const isManagerRole = newRole === 'Manager';
      if (isEmployeeRole && (activeTab === 'users' || activeTab === 'employees' || activeTab === 'reports' || activeTab === 'departments' || activeTab === 'designations')) {
        setActiveTab('dashboard');
      } else if (isManagerRole && (activeTab === 'users' || activeTab === 'departments' || activeTab === 'designations')) {
        setActiveTab('dashboard');
      }
    }
  };

  // Quick select credentials helper for developers
  const quickFillCredentials = (username: string) => {
    setLoginUsername(username);
    setLoginPassword('admin123');
    setAuthError('');
  };

  // --- HANDLERS FOR CRUD REGISTERS ---

  // Employees CRUD
  const handleAddEmployee = async (emp: Employee) => {
    if (isApiConnected) {
      try {
        const res = await apiService.employees.create(emp);
        if (res.success) {
          const empsRes = await apiService.employees.getAll();
          if (empsRes.success) setEmployees(empsRes.data);
          triggerToast(`Employee ${emp.firstName} ${emp.lastName} registered successfully!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setEmployees(prev => [emp, ...prev]);
    logSystemAction(
      'INSERT',
      'employees',
      emp.id,
      `Registered new employee profile: ${emp.firstName} ${emp.lastName} (${emp.email}) under department ID ${emp.departmentId}`
    );
    triggerToast(`Employee ${emp.firstName} ${emp.lastName} registered successfully!`);
  };

  const handleUpdateEmployee = async (emp: Employee) => {
    if (isApiConnected) {
      try {
        const res = await apiService.employees.update(emp.id, emp);
        if (res.success) {
          const empsRes = await apiService.employees.getAll();
          if (empsRes.success) setEmployees(empsRes.data);
          triggerToast(`Employee ${emp.firstName} details modified!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const originalEmp = employees.find(item => item.id === emp.id);
    let changeDetails = `Updated Employee details for ${emp.firstName} ${emp.lastName} (${emp.id}).`;
    if (originalEmp) {
      const changes: string[] = [];
      if (originalEmp.salary !== emp.salary) {
        changes.push(`salary adjusted from ₹${originalEmp.salary.toLocaleString()} to ₹${emp.salary.toLocaleString()}`);
      }
      if (originalEmp.status !== emp.status) {
        changes.push(`status changed from "${originalEmp.status}" to "${emp.status}"`);
      }
      if (originalEmp.departmentId !== emp.departmentId) {
        changes.push(`department ID changed from "${originalEmp.departmentId}" to "${emp.departmentId}"`);
      }
      if (originalEmp.designationId !== emp.designationId) {
        changes.push(`designation ID changed from "${originalEmp.designationId}" to "${emp.designationId}"`);
      }
      if (changes.length > 0) {
        changeDetails = `Updated Employee details for ${emp.firstName} ${emp.lastName}: ` + changes.join(', ');
      }
    }
    setEmployees(prev => prev.map(item => item.id === emp.id ? emp : item));
    logSystemAction('UPDATE', 'employees', emp.id, changeDetails);
    triggerToast(`Employee ${emp.firstName} details modified!`);
  };

  const handleDeleteEmployee = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.employees.delete(id);
        if (res.success) {
          setEmployees(prev => prev.filter(item => item.id !== id));
          triggerToast(`Employee record purged from system!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const emp = employees.find(item => item.id === id);
    const empName = emp ? `${emp.firstName} ${emp.lastName}` : id;
    setEmployees(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'employees', id, `Removed employee record of ${empName} (ID: ${id}) from the system`);
    triggerToast(`Employee record purged from system!`, 'error');
  };

  // Departments CRUD
  const handleAddDepartment = async (dept: Department) => {
    if (isApiConnected) {
      try {
        const res = await apiService.departments.create(dept);
        if (res.success) {
          setDepartments(prev => [...prev, res.data]);
          triggerToast(`Department '${dept.name}' structured!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setDepartments(prev => [...prev, dept]);
    logSystemAction('INSERT', 'departments', dept.id, `Structured new department: ${dept.name} (${dept.id})`);
    triggerToast(`Department '${dept.name}' structured!`);
  };

  const handleUpdateDepartment = async (dept: Department) => {
    if (isApiConnected) {
      try {
        const res = await apiService.departments.update(dept.id, dept);
        if (res.success) {
          setDepartments(prev => prev.map(item => item.id === dept.id ? res.data : item));
          triggerToast(`Department properties modified!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setDepartments(prev => prev.map(item => item.id === dept.id ? dept : item));
    logSystemAction('UPDATE', 'departments', dept.id, `Modified department properties for ${dept.name}`);
    triggerToast(`Department properties modified!`);
  };

  const handleDeleteDepartment = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.departments.delete(id);
        if (res.success) {
          setDepartments(prev => prev.filter(item => item.id !== id));
          triggerToast(`Department record removed!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const dept = departments.find(item => item.id === id);
    const deptName = dept ? dept.name : id;
    setDepartments(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'departments', id, `Deleted department: ${deptName} (${id})`);
    triggerToast(`Department record removed!`, 'error');
  };

  // Designations CRUD
  const handleAddDesignation = async (desg: Designation) => {
    if (isApiConnected) {
      try {
        const res = await apiService.designations.create(desg);
        if (res.success) {
          setDesignations(prev => [...prev, res.data]);
          triggerToast(`Designation '${desg.name}' appended to roster!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setDesignations(prev => [...prev, desg]);
    logSystemAction('INSERT', 'designations', desg.id, `Created designation: ${desg.name} under department ID ${desg.departmentId}`);
    triggerToast(`Designation '${desg.name}' appended to roster!`);
  };

  const handleUpdateDesignation = async (desg: Designation) => {
    if (isApiConnected) {
      try {
        const res = await apiService.designations.update(desg.id, desg);
        if (res.success) {
          setDesignations(prev => prev.map(item => item.id === desg.id ? res.data : item));
          triggerToast(`Designation credentials altered!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setDesignations(prev => prev.map(item => item.id === desg.id ? desg : item));
    logSystemAction('UPDATE', 'designations', desg.id, `Updated designation: ${desg.name} under department ID ${desg.departmentId}`);
    triggerToast(`Designation credentials altered!`);
  };

  const handleDeleteDesignation = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.designations.delete(id);
        if (res.success) {
          setDesignations(prev => prev.filter(item => item.id !== id));
          triggerToast(`Designation deleted!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const desg = designations.find(item => item.id === id);
    const desgName = desg ? desg.name : id;
    setDesignations(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'designations', id, `Deleted designation: ${desgName} (${id})`);
    triggerToast(`Designation deleted!`, 'error');
  };

  // Attendance CRUD
  const handleAddAttendance = async (log: Attendance) => {
    if (isApiConnected) {
      try {
        const res = await apiService.attendance.create(log);
        if (res.success) {
          setAttendance(prev => [res.data, ...prev]);
          triggerToast(`Shift punch recorded at ${log.checkIn}!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setAttendance(prev => [log, ...prev]);
    logSystemAction('INSERT', 'attendance', log.id, `Recorded punch-in attendance for employee ID ${log.employeeId} at ${log.checkIn} on ${log.date}`);
    triggerToast(`Shift punch recorded at ${log.checkIn}!`);
  };

  const handleUpdateAttendance = async (log: Attendance) => {
    if (isApiConnected) {
      try {
        const res = await apiService.attendance.update(log.id, log);
        if (res.success) {
          setAttendance(prev => prev.map(item => item.id === log.id ? res.data : item));
          triggerToast(`Attendance log record calibrated!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setAttendance(prev => prev.map(item => item.id === log.id ? log : item));
    logSystemAction('UPDATE', 'attendance', log.id, `Calibrated/regularized attendance record for employee ID ${log.employeeId} on ${log.date}. Status: ${log.status}, Clock-in: ${log.checkIn}, Clock-out: ${log.checkOut || 'N/A'}`);
    triggerToast(`Attendance log record calibrated!`);
  };

  const handleDeleteAttendance = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.attendance.delete(id);
        if (res.success) {
          setAttendance(prev => prev.filter(item => item.id !== id));
          triggerToast(`Attendance record deleted!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setAttendance(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'attendance', id, `Removed attendance log record ID ${id}`);
    triggerToast(`Attendance record deleted!`, 'error');
  };

  // Leaves CRUD
  const handleAddLeave = async (leave: LeaveRequest) => {
    if (isApiConnected) {
      try {
        const res = await apiService.leaves.create(leave);
        if (res.success) {
          setLeaves(prev => [res.data, ...prev]);
          triggerToast(`Time off request registered under pending review queue.`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setLeaves(prev => [leave, ...prev]);
    logSystemAction('INSERT', 'leave_requests', leave.id, `Submitted new ${leave.leaveType} leave request for Employee ${leave.employeeId} from ${leave.startDate} to ${leave.endDate}`);
    triggerToast(`Time off request registered under pending review queue.`);
  };

  const handleUpdateLeave = async (leave: LeaveRequest) => {
    if (isApiConnected) {
      try {
        const res = await apiService.leaves.update(leave.id, leave);
        if (res.success) {
          setLeaves(prev => prev.map(item => item.id === leave.id ? res.data : item));
          triggerToast(`Time off request processing completed! (${leave.status})`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setLeaves(prev => prev.map(item => item.id === leave.id ? leave : item));
    logSystemAction('LEAVE_APPROVAL', 'leave_requests', leave.id, `Leave request ID ${leave.id} was processed. Status: ${leave.status} by ${leave.actionBy || 'Authorized Officer'}`);
    triggerToast(`Time off request processing completed! (${leave.status})`);
  };

  // Payroll CRUD
  const handleAddPayroll = async (pay: Payroll) => {
    if (isApiConnected) {
      try {
        const res = await apiService.payroll.create(pay);
        if (res.success) {
          setPayrollList(prev => [res.data, ...prev]);
          triggerToast(`Salary slip ledger parsed! Status: ${pay.status}`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setPayrollList(prev => [pay, ...prev]);
    logSystemAction('INSERT', 'payroll', pay.id, `Generated salary slip ledger for employee ID ${pay.employeeId} for month ${pay.month}. Net salary: ₹${pay.netSalary.toLocaleString()}`);
    triggerToast(`Salary slip ledger parsed! Status: ${pay.status}`);
  };

  const handleUpdatePayroll = async (pay: Payroll) => {
    if (isApiConnected) {
      try {
        const res = await apiService.payroll.update(pay.id, pay);
        if (res.success) {
          setPayrollList(prev => prev.map(item => item.id === pay.id ? res.data : item));
          triggerToast(`Payroll statement updated to ${pay.status}!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setPayrollList(prev => prev.map(item => item.id === pay.id ? pay : item));
    logSystemAction('PAYROLL_PROCESS', 'payroll', pay.id, `Updated payroll statement ID ${pay.id} status to ${pay.status}`);
    triggerToast(`Payroll statement updated to ${pay.status}!`);
  };

  const handleDeletePayroll = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.payroll.delete(id);
        if (res.success) {
          setPayrollList(prev => prev.filter(item => item.id !== id));
          triggerToast(`Payroll draft cancelled!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setPayrollList(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'payroll', id, `Cancelled/removed payroll draft ID ${id}`);
    triggerToast(`Payroll draft cancelled!`, 'error');
  };

  // Holidays CRUD
  const handleAddHoliday = async (h: Holiday) => {
    if (isApiConnected) {
      try {
        const res = await apiService.holidays.create(h);
        if (res.success) {
          setHolidays(prev => [...prev, res.data]);
          triggerToast(`New Holiday: '${h.name}' calendar updated.`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setHolidays(prev => [...prev, h]);
    logSystemAction('INSERT', 'holidays', h.id, `Added new holiday '${h.name}' on date ${h.date} (${h.type})`);
    triggerToast(`New Holiday: '${h.name}' calendar updated.`);
  };

  const handleDeleteHoliday = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.holidays.delete(id);
        if (res.success) {
          setHolidays(prev => prev.filter(item => item.id !== id));
          triggerToast(`Holiday removed!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const h = holidays.find(item => item.id === id);
    const holidayName = h ? h.name : id;
    setHolidays(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'holidays', id, `Removed holiday '${holidayName}' on date ${h?.date || id}`);
    triggerToast(`Holiday removed!`, 'error');
  };

  // Announcements CRUD
  const handleAddAnnouncement = async (a: Announcement) => {
    if (isApiConnected) {
      try {
        const res = await apiService.announcements.create(a);
        if (res.success) {
          setAnnouncements(prev => [res.data, ...prev]);
          triggerToast(`Operational Announcement broadcasted!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setAnnouncements(prev => [a, ...prev]);
    logSystemAction('INSERT', 'announcements', a.id, `Broadcasted operational announcement: "${a.title}" for audience: ${a.targetAudience}`);
    triggerToast(`Operational Announcement broadcasted!`);
  };

  const handleDeleteAnnouncement = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.announcements.delete(id);
        if (res.success) {
          setAnnouncements(prev => prev.filter(item => item.id !== id));
          triggerToast(`Announcement retracted!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const a = announcements.find(item => item.id === id);
    const annTitle = a ? a.title : id;
    setAnnouncements(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'announcements', id, `Retracted operational announcement: "${annTitle}" (ID: ${id})`);
    triggerToast(`Announcement retracted!`, 'error');
  };

  // System Users CRUD
  const handleAddUser = async (u: SystemUser) => {
    if (isApiConnected) {
      try {
        const res = await apiService.users.create(u);
        if (res.success) {
          setSystemUsers(prev => [...prev, res.data]);
          triggerToast(`Security Account: '${u.username}' granted ERP clearance.`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    setSystemUsers(prev => [...prev, u]);
    logSystemAction('INSERT', 'system_users', u.id, `Created security user account '${u.username}' with role '${u.role}'`);
    triggerToast(`Security Account: '${u.username}' granted ERP clearance.`);
  };

  const handleUpdateUser = async (u: SystemUser) => {
    if (isApiConnected) {
      try {
        const res = await apiService.users.update(u.id, u);
        if (res.success) {
          setSystemUsers(prev => prev.map(item => item.id === u.id ? res.data : item));
          triggerToast(`Account authorization configuration saved!`);
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const originalUser = systemUsers.find(item => item.id === u.id);
    let changeDetails = `Updated user account details for ${u.username}.`;
    if (originalUser) {
      const changes: string[] = [];
      if (originalUser.role !== u.role) {
        changes.push(`role changed from "${originalUser.role}" to "${u.role}"`);
      }
      if (originalUser.status !== u.status) {
        changes.push(`status changed from "${originalUser.status}" to "${u.status}"`);
      }
      if (changes.length > 0) {
        changeDetails = `Updated user account "${u.username}": ` + changes.join(', ');
      }
    }
    setSystemUsers(prev => prev.map(item => item.id === u.id ? u : item));
    logSystemAction('USER_APPROVAL', 'system_users', u.id, changeDetails);
    triggerToast(`Account authorization configuration saved!`);
  };

  const handleDeleteUser = async (id: string) => {
    if (isApiConnected) {
      try {
        const res = await apiService.users.delete(id);
        if (res.success) {
          setSystemUsers(prev => prev.filter(item => item.id !== id));
          triggerToast(`Account credential clearance revoked!`, 'error');
        }
      } catch (err: any) {
        triggerToast(err.message || 'Operation failed', 'error');
      }
      return;
    }

    const u = systemUsers.find(item => item.id === id);
    const userName = u ? u.username : id;
    setSystemUsers(prev => prev.filter(item => item.id !== id));
    logSystemAction('DELETE', 'system_users', id, `Revoked security clearance. Deleted user account '${userName}' (ID: ${id})`);
    triggerToast(`Account credential clearance revoked!`, 'error');
  };

  // --- RENDER SCREEN DISPATCHER ---
  const renderTabContent = () => {
    const role = currentUser?.role || 'Employee';
    const usernameStr = currentUser?.username || 'user';

    switch (activeTab) {
      case 'dashboard':
        return (
          <DashboardView 
            employees={employees} 
            departments={departments}
            designations={designations}
            attendance={attendance}
            leaves={leaves}
            payrollList={payrollList}
            announcements={announcements}
            setActiveTab={setActiveTab}
            userRole={role}
            users={systemUsers}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddEmployee={handleAddEmployee}
          />
        );
      case 'employees':
        return (
          <EmployeeView
            employees={employees}
            departments={departments}
            designations={designations}
            onAddEmployee={handleAddEmployee}
            onUpdateEmployee={handleUpdateEmployee}
            onDeleteEmployee={handleDeleteEmployee}
            userRole={role}
            currentUser={currentUser}
          />
        );
      case 'departments':
        return (
          <DepartmentView
            departments={departments}
            employees={employees}
            onAddDepartment={handleAddDepartment}
            onUpdateDepartment={handleUpdateDepartment}
            onDeleteDepartment={handleDeleteDepartment}
            userRole={role}
          />
        );
      case 'designations':
        return (
          <DesignationView
            designations={designations}
            departments={departments}
            employees={employees}
            onAddDesignation={handleAddDesignation}
            onUpdateDesignation={handleUpdateDesignation}
            onDeleteDesignation={handleDeleteDesignation}
            userRole={role}
          />
        );
      case 'attendance':
        return (
          <AttendanceView
            attendance={attendance}
            employees={employees}
            onAddAttendance={handleAddAttendance}
            onUpdateAttendance={handleUpdateAttendance}
            onDeleteAttendance={handleDeleteAttendance}
            userRole={role}
            username={usernameStr}
            currentUser={currentUser}
          />
        );
      case 'leaves':
        return (
          <LeaveView
            leaves={leaves}
            employees={employees}
            onAddLeave={handleAddLeave}
            onUpdateLeave={handleUpdateLeave}
            userRole={role}
            username={usernameStr}
            currentUser={currentUser}
          />
        );
      case 'payroll':
        return (
          <PayrollView
            payrollList={payrollList}
            employees={employees}
            onAddPayroll={handleAddPayroll}
            onUpdatePayroll={handleUpdatePayroll}
            onDeletePayroll={handleDeletePayroll}
            userRole={role}
            username={usernameStr}
          />
        );
      case 'holidays':
        return (
          <HolidayView
            holidays={holidays}
            onAddHoliday={handleAddHoliday}
            onDeleteHoliday={handleDeleteHoliday}
            userRole={role}
          />
        );
      case 'announcements':
        return (
          <AnnouncementView
            announcements={announcements}
            onAddAnnouncement={handleAddAnnouncement}
            onDeleteAnnouncement={handleDeleteAnnouncement}
            userRole={role}
          />
        );
      case 'reports':
        return (
          <ReportView
            employees={employees}
            departments={departments}
            designations={designations}
            attendance={attendance}
            leaves={leaves}
            payrollList={payrollList}
            auditLogs={auditLogs}
          />
        );
      case 'users':
        return (
          <UserView
            users={systemUsers}
            employees={employees}
            departments={departments}
            designations={designations}
            onAddUser={handleAddUser}
            onUpdateUser={handleUpdateUser}
            onDeleteUser={handleDeleteUser}
            onAddEmployee={handleAddEmployee}
            userRole={role}
          />
        );
      default:
        return <div>Module Under Review</div>;
    }
  };

  // LOGIN & REGISTER SCREEN
  if (!isAuthenticated || !currentUser) {
    return (
      <div className="min-h-screen bg-[#f8f9fa] dark:bg-slate-900 flex flex-col justify-center items-center px-4 py-12 relative overflow-hidden transition-colors duration-200">
        {/* Abstract subtle background vector */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[700px] bg-blue-100/35 rounded-full blur-3xl pointer-events-none dark:hidden" />

        {/* Floating Theme Toggle */}
        <div className="absolute top-4 right-4 z-20">
          <button
            id="btn-login-theme-toggle"
            onClick={toggleTheme}
            className="p-3 bg-white/95 hover:bg-white dark:bg-slate-800 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-100 rounded-xl shadow-lg hover:shadow-xl transition-all duration-150 flex items-center justify-center cursor-pointer"
            title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} Mode`}
          >
            {theme === 'light' ? <Moon className="w-4.5 h-4.5 text-slate-600" /> : <Sun className="w-4.5 h-4.5 text-yellow-500" />}
          </button>
        </div>

        {/* Centralized Login / Register Form Container */}
        <div className={`w-full ${isRegisterMode ? 'max-w-2xl' : 'max-w-md'} bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl rounded-2xl p-8 relative z-10 space-y-6 transition-all duration-300`}>
          
          <div className="text-center space-y-2">
            <div className="mx-auto w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white shadow-md shadow-blue-500/10">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold tracking-tight text-slate-800 dark:text-white">
              {isForgotMode ? 'Reset User Password' : isRegisterMode ? 'Employee Registration Portal' : 'HRMS ERP Portal'}
            </h2>
            <p className="text-xs text-slate-400 dark:text-slate-400 font-medium">
              {isForgotMode ? 'Reset your account password securely' : isRegisterMode ? 'Register a new employee account for HR approval' : 'Enterprise Management Suite Login'}
            </p>
          </div>

          {registerSuccessMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs space-y-1 animate-fadeIn">
              <h4 className="font-bold">Submission Successful!</h4>
              <p className="font-medium leading-relaxed">{registerSuccessMsg}</p>
              <button 
                type="button" 
                onClick={() => setRegisterSuccessMsg('')}
                className="text-emerald-700 font-extrabold underline block mt-1 hover:text-emerald-950 cursor-pointer"
              >
                Dismiss message
              </button>
            </div>
          )}

          {authError && (
            <div className="p-3.5 bg-rose-50 border border-rose-150 rounded-xl text-rose-700 text-xs flex items-start space-x-2 animate-shake">
              <ShieldAlert className="w-4.5 h-4.5 flex-shrink-0 mt-0.5" />
              <span className="font-semibold leading-normal">{authError}</span>
            </div>
          )}

          {isForgotMode ? (
            /* --- FORGOT PASSWORD FORM --- */
            <form onSubmit={handleResetPassword} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Username or Email Address</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Enter username or email address"
                    value={forgotUsername}
                    onChange={(e) => setForgotUsername(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotNewPassword}
                    onChange={(e) => setForgotNewPassword(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Confirm New Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    placeholder="••••••••"
                    value={forgotConfirmPassword}
                    onChange={(e) => setForgotConfirmPassword(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 outline-none transition-all placeholder:text-slate-400 font-mono"
                  />
                </div>
              </div>

              <div className="flex space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(false);
                    setAuthError('');
                  }}
                  className="w-1/3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-2.5 bg-rose-600 hover:bg-rose-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-rose-600/10 transition-all cursor-pointer"
                >
                  Reset Password
                </button>
              </div>
            </form>
          ) : !isRegisterMode ? (
            /* --- LOGIN FORM --- */
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Username</label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="login-field-username"
                    type="text"
                    required
                    placeholder="admin, hr_sarah, employee_jane..."
                    value={loginUsername}
                    onChange={(e) => setLoginUsername(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-mono outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest block">Password</label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                  <input
                    id="login-field-password"
                    type="password"
                    required
                    placeholder="••••••••"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-9 pr-4 py-2.5 text-xs text-slate-800 font-mono outline-none transition-all placeholder:text-slate-400"
                  />
                </div>
              </div>

              <button
                id="btn-login-submit"
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-blue-600/15 transition-all flex items-center justify-center space-x-2 cursor-pointer"
              >
                <KeyRound className="w-4 h-4" />
                <span>Authenticate Session</span>
              </button>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(true);
                    setAuthError('');
                    setRegisterSuccessMsg('');
                  }}
                  className="text-xs text-blue-600 hover:text-blue-500 font-bold hover:underline cursor-pointer"
                >
                  New Employee? Register Here
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsForgotMode(true);
                    setAuthError('');
                    setRegisterSuccessMsg('');
                  }}
                  className="text-xs text-rose-600 hover:text-rose-500 font-bold hover:underline cursor-pointer"
                >
                  Forgot Password?
                </button>
              </div>
            </form>
          ) : (
            /* --- REGISTRATION FORM --- */
            <form onSubmit={handleRegister} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Account details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Account Credentials</h4>
                  
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Username *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. john_doe"
                      value={regForm.username}
                      onChange={(e) => setRegForm(prev => ({ ...prev, username: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Password *</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={regForm.password}
                      onChange={(e) => setRegForm(prev => ({ ...prev, password: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Email Address *</label>
                    <input
                      type="email"
                      required
                      placeholder="e.g. john.doe@company.com"
                      value={regForm.email}
                      onChange={(e) => setRegForm(prev => ({ ...prev, email: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Branch / Location *</label>
                    <select
                      value={regForm.branch}
                      onChange={(e) => setRegForm(prev => ({ ...prev, branch: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      <option value="Main Head Office">Main Head Office</option>
                      <option value="Hyderabad Tech Center">Hyderabad Tech Center</option>
                      <option value="Bangalore Branch">Bangalore Branch</option>
                      <option value="Mumbai Operations">Mumbai Operations</option>
                      <option value="Delhi NCR Branch">Delhi NCR Branch</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Department *</label>
                    <select
                      value={regForm.departmentId}
                      onChange={(e) => setRegForm(prev => ({ ...prev, departmentId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Designation *</label>
                    <select
                      value={regForm.designationId}
                      onChange={(e) => setRegForm(prev => ({ ...prev, designationId: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3 py-2 text-xs outline-none"
                    >
                      {designations.filter(d => d.departmentId === regForm.departmentId).map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Profile Details */}
                <div className="space-y-3">
                  <h4 className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest border-b border-slate-100 pb-1.5">Personal Profile</h4>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">First Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="John"
                        value={regForm.firstName}
                        onChange={(e) => setRegForm(prev => ({ ...prev, firstName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none"
                      />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Last Name *</label>
                      <input
                        type="text"
                        required
                        placeholder="Doe"
                        value={regForm.lastName}
                        onChange={(e) => setRegForm(prev => ({ ...prev, lastName: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">Gender *</label>
                      <select
                        value={regForm.gender}
                        onChange={(e) => setRegForm(prev => ({ ...prev, gender: e.target.value as any }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3 py-2 text-xs outline-none"
                      >
                        <option value="Male">Male</option>
                        <option value="Female">Female</option>
                        <option value="Other">Other</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 block">DOB *</label>
                      <input
                        type="date"
                        required
                        value={regForm.dob}
                        onChange={(e) => setRegForm(prev => ({ ...prev, dob: e.target.value }))}
                        className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3 py-2 text-xs outline-none"
                      />
                    </div>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Mobile Number</label>
                    <input
                      type="text"
                      placeholder="+91 99999 99999"
                      value={regForm.mobile}
                      onChange={(e) => setRegForm(prev => ({ ...prev, mobile: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none font-mono"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-slate-500 block">Residential Address</label>
                    <textarea
                      placeholder="Street, City, Pin"
                      rows={2}
                      value={regForm.address}
                      onChange={(e) => setRegForm(prev => ({ ...prev, address: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-200 focus:border-blue-450 rounded-xl px-3.5 py-2 text-xs outline-none resize-none"
                    />
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-3 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsRegisterMode(false);
                    setAuthError('');
                  }}
                  className="w-full sm:w-1/3 py-2.5 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  Back to Sign In
                </button>
                <button
                  type="submit"
                  className="w-full sm:w-2/3 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-blue-600/10 transition-all flex items-center justify-center space-x-1.5 cursor-pointer"
                >
                  <UserPlus className="w-4 h-4" />
                  <span>Submit Registration Request</span>
                </button>
              </div>
            </form>
          )}

          {/* Quick simulation helper - Absolute UX Masterstroke */}
          {!isRegisterMode && (
            <div className="pt-6 border-t border-slate-100 space-y-3">
              <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider block text-center">
                Quick Sandbox Credentials
              </span>
              <div className="grid grid-cols-2 gap-2 text-[10px] font-bold">
                <button
                  id="quick-login-admin"
                  onClick={() => quickFillCredentials('admin')}
                  className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left text-slate-600 transition-all flex items-center justify-between"
                >
                  <span>admin (Super Admin)</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  id="quick-login-hr"
                  onClick={() => quickFillCredentials('hr_sarah')}
                  className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left text-slate-600 transition-all flex items-center justify-between"
                >
                  <span>hr_sarah (HR Manager)</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  id="quick-login-manager"
                  onClick={() => quickFillCredentials('manager_john')}
                  className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left text-slate-600 transition-all flex items-center justify-between"
                >
                  <span>manager_john (Lead Mgr)</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
                <button
                  id="quick-login-employee"
                  onClick={() => quickFillCredentials('employee_jane')}
                  className="p-2 border border-slate-200 hover:border-blue-300 hover:bg-blue-50 rounded-xl text-left text-slate-600 transition-all flex items-center justify-between"
                >
                  <span>employee_jane (Dev)</span>
                  <ArrowRight className="w-3 h-3 text-slate-400" />
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // STANDARD ERP DESKTOP SHELL
  return (
    <div className="min-h-screen bg-[#f8f9fa] flex print:bg-white text-slate-700">
      {/* 1. Collapsible Left Sidebar */}
      <div className="print:hidden">
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          userRole={currentUser.role}
          username={currentUser.username}
          onLogout={handleLogout}
        />
      </div>

      {/* 2. Main Content viewport container */}
      <div className="flex-1 flex flex-col overflow-x-hidden">
        {/* Top Navbar */}
        <div className="print:hidden">
          <Navbar 
            activeTab={activeTab} 
            userRole={currentUser.role} 
            setUserRole={handleHotRoleSwitch} 
            username={currentUser.username}
            currentUser={currentUser}
            employees={employees}
            departments={departments}
            designations={designations}
            onLogout={handleLogout}
            theme={theme}
            toggleTheme={toggleTheme}
          />
        </div>

        {/* Dynamic Inner body workspace */}
        <main className="flex-1 p-8 overflow-y-auto max-w-7xl w-full mx-auto print:p-0">
          {renderTabContent()}
        </main>
      </div>

      {/* 3. Success / Alert Toast Feedback */}
      {toast.show && (
        <div 
          id="toast-notification"
          className={`fixed bottom-6 right-6 px-4.5 py-3 rounded-xl border shadow-xl flex items-center space-x-3 z-50 animate-slideIn ${
            toast.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : toast.type === 'info'
                ? 'bg-blue-50 border-blue-200 text-blue-800'
                : 'bg-emerald-50 border-emerald-200 text-emerald-800'
          }`}
        >
          <CheckCircle2 className={`w-5 h-5 ${
            toast.type === 'error' ? 'text-rose-600' : toast.type === 'info' ? 'text-blue-600' : 'text-emerald-600'
          }`} />
          <span className="text-xs font-bold">{toast.msg}</span>
        </div>
      )}
    </div>
  );
}
