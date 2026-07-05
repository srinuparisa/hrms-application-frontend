import React, { useState } from 'react';
import { jsPDF } from 'jspdf';
import * as XLSX from 'xlsx';
import { 
  Plus, Search, Edit2, Trash2, X, AlertCircle, Printer, CheckCircle, 
  Banknote, Award, Calculator, Calendar, FileText, CheckCircle2, Download,
  Upload, FileSpreadsheet, Database
} from 'lucide-react';
import { Payroll, Employee } from '../types';

interface PayrollViewProps {
  payrollList: Payroll[];
  employees: Employee[];
  onAddPayroll: (pay: Payroll) => void;
  onUpdatePayroll: (pay: Payroll) => void;
  onDeletePayroll: (id: string) => void;
  userRole: string;
  username: string;
}

export default function PayrollView({
  payrollList,
  employees,
  onAddPayroll,
  onUpdatePayroll,
  onDeletePayroll,
  userRole,
  username
}: PayrollViewProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMonth, setSelectedMonth] = useState('June 2026');
  const [showFormModal, setShowFormModal] = useState(false);
  const [showSlipModal, setShowSlipModal] = useState(false);
  
  const [editingPayroll, setEditingPayroll] = useState<Payroll | null>(null);
  const [viewingPayroll, setViewingPayroll] = useState<Payroll | null>(null);
  const [formError, setFormError] = useState('');

  // --- BULK EXCEL IMPORT STATE ---
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [excelMonth, setExcelMonth] = useState('July');
  const [excelYear, setExcelYear] = useState('2026');
  const [excelFile, setExcelFile] = useState<File | null>(null);
  const [excelData, setExcelData] = useState<any[]>([]);
  const [importStatus, setImportStatus] = useState('');
  const [importError, setImportError] = useState('');

  // Generate and download Excel (.xlsx) template prefilled with employees
  const downloadExcelTemplate = () => {
    const templateRows = employees.map(emp => {
      const basic = Math.round(emp.salary * 0.65);
      const hra = Math.round(emp.salary * 0.15);
      const allowances = Math.round(emp.salary * 0.20);
      const deductions = 300;
      return {
        "Employee ID": emp.id,
        "Employee Name": `${emp.firstName} ${emp.lastName}`,
        "Basic Salary": basic,
        "HRA": hra,
        "Allowances": allowances,
        "Deductions": deductions,
        "Status": "Processed"
      };
    });

    if (templateRows.length === 0) {
      templateRows.push({
        "Employee ID": "EMP-101",
        "Employee Name": "Johnathan Davis",
        "Basic Salary": 4680,
        "HRA": 1080,
        "Allowances": 1440,
        "Deductions": 450,
        "Status": "Paid"
      });
    }

    const worksheet = XLSX.utils.json_to_sheet(templateRows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "PayrollTemplate");
    XLSX.writeFile(workbook, `HRMS_Payroll_Template_${excelMonth}_${excelYear}.xlsx`);
  };

  // Parse Excel / CSV file
  const handleExcelUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setExcelFile(file);
    setImportError('');
    setImportStatus('');

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const rows = XLSX.utils.sheet_to_json<any>(sheet);

        if (rows.length === 0) {
          setImportError("The uploaded file contains no data rows.");
          setExcelData([]);
          return;
        }

        const validatedRows = rows.map((row, idx) => {
          const empId = row["Employee ID"] || row["employeeId"] || row["EmployeeID"] || row["id"] || row["ID"];
          const basic = Number(row["Basic Salary"] || row["basicSalary"] || row["BasicSalary"] || row["basic"] || 0);
          const hra = Number(row["HRA"] || row["hra"] || row["House Rent Allowance"] || 0);
          const allowances = Number(row["Allowances"] || row["allowances"] || row["allowance"] || 0);
          const deductions = Number(row["Deductions"] || row["deductions"] || row["deduction"] || 0);
          const status = row["Status"] || row["status"] || "Processed";

          return {
            rowNum: idx + 1,
            employeeId: empId ? String(empId).trim() : '',
            basicSalary: isNaN(basic) ? 0 : basic,
            hra: isNaN(hra) ? 0 : hra,
            allowances: isNaN(allowances) ? 0 : allowances,
            deductions: isNaN(deductions) ? 0 : deductions,
            status: ['Draft', 'Processed', 'Paid'].includes(status) ? status : 'Processed'
          };
        });

        const missingEmpId = validatedRows.some(r => !r.employeeId);
        if (missingEmpId) {
          setImportError("Some rows are missing 'Employee ID'. Please check your Excel sheet.");
        }

        setExcelData(validatedRows);
        setImportStatus(`Loaded ${validatedRows.length} rows from Excel. Review the details below, confirm the month & year, and run payroll to save.`);
      } catch (err: any) {
        setImportError(`Failed to parse Excel file: ${err?.message || err}`);
        setExcelData([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  // Save parsed data to React State & localStorage
  const runExcelPayroll = () => {
    if (excelData.length === 0) {
      setImportError("No parsed payroll data available. Please upload a valid Excel file first.");
      return;
    }

    const targetMonth = `${excelMonth} ${excelYear}`;
    let processed = 0;
    let updated = 0;

    excelData.forEach((row) => {
      if (!row.employeeId) return;

      const basicSalary = row.basicSalary;
      const hra = row.hra;
      const allowances = row.allowances;
      const deductions = row.deductions;
      const netSalary = basicSalary + hra + allowances - deductions;
      const status = row.status;

      const existing = payrollList.find(
        p => p.employeeId.toLowerCase() === row.employeeId.toLowerCase() && p.month === targetMonth
      );

      if (existing) {
        onUpdatePayroll({
          ...existing,
          basicSalary,
          hra,
          allowances,
          deductions,
          netSalary,
          status,
          processedDate: new Date().toISOString().split('T')[0]
        });
        updated++;
      } else {
        const newId = `PAY-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        onAddPayroll({
          id: newId,
          employeeId: row.employeeId,
          month: targetMonth,
          basicSalary,
          hra,
          allowances,
          deductions,
          netSalary,
          status,
          processedDate: new Date().toISOString().split('T')[0]
        });
        processed++;
      }
    });

    setExcelFile(null);
    setExcelData([]);
    setImportStatus('');
    setSelectedMonth(targetMonth);
    alert(`Success! Payroll processed for "${targetMonth}".\nCreated: ${processed} records\nUpdated: ${updated} existing records.`);
    setIsImportOpen(false);
  };

  // Form Fields State
  const [formData, setFormData] = useState({
    employeeId: '',
    month: 'June 2026',
    basicSalary: 3000,
    hra: 800,
    allowances: 1200,
    deductions: 250,
    status: 'Draft' as 'Draft' | 'Processed' | 'Paid'
  });

  const canModify = userRole === 'Super Admin' || userRole === 'HR';

  // Autocalculate Net Salary in UI
  const netSalaryCalculated = Math.max(0, formData.basicSalary + formData.hra + formData.allowances - formData.deductions);

  // Filter List
  const filteredPayrolls = payrollList.filter(p => {
    const emp = employees.find(e => e.id === p.employeeId);
    const empName = emp ? `${emp.firstName} ${emp.lastName}`.toLowerCase() : '';
    const matchesSearch = empName.includes(searchTerm.toLowerCase()) || 
                          p.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Employee role only sees their own payslip
    const isEmployee = userRole === 'Employee';
    const linkedEmployee = employees.find(e => e.firstName.toLowerCase() === username.toLowerCase());
    const matchesOwner = !isEmployee || p.employeeId === linkedEmployee?.id;

    const matchesMonth = p.month === selectedMonth;

    return matchesSearch && matchesOwner && matchesMonth;
  });

  const getEmpName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.firstName} ${emp.lastName}` : 'N/A';
  };

  const getEmpEmail = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? emp.email : 'N/A';
  };

  const openAddModal = () => {
    setEditingPayroll(null);
    setFormError('');
    
    // Grab first active employee and their base salary to pre-fill
    const firstEmp = employees[0];
    const initialBase = firstEmp ? firstEmp.salary : 4000;

    setFormData({
      employeeId: firstEmp?.id || '',
      month: 'June 2026',
      basicSalary: Math.round(initialBase * 0.65), // Standard HR basic salary calculation 65% of gross
      hra: Math.round(initialBase * 0.15), // HRA 15%
      allowances: Math.round(initialBase * 0.20), // Allowances 20%
      deductions: 300,
      status: 'Draft'
    });
    setShowFormModal(true);
  };

  const openEditModal = (pay: Payroll) => {
    setEditingPayroll(pay);
    setFormError('');
    setFormData({
      employeeId: pay.employeeId,
      month: pay.month,
      basicSalary: pay.basicSalary,
      hra: pay.hra,
      allowances: pay.allowances,
      deductions: pay.deductions,
      status: pay.status
    });
    setShowFormModal(true);
  };

  const handleEmpChange = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormData(prev => ({
        ...prev,
        employeeId: empId,
        basicSalary: Math.round(emp.salary * 0.65),
        hra: Math.round(emp.salary * 0.15),
        allowances: Math.round(emp.salary * 0.20)
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.employeeId || !formData.month) {
      setFormError('Please fill in mandatory fields.');
      return;
    }

    const netSalary = formData.basicSalary + formData.hra + formData.allowances - formData.deductions;

    if (editingPayroll) {
      onUpdatePayroll({
        ...editingPayroll,
        employeeId: formData.employeeId,
        month: formData.month,
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        allowances: formData.allowances,
        deductions: formData.deductions,
        netSalary,
        status: formData.status,
        processedDate: new Date().toISOString().split('T')[0]
      });
    } else {
      const nextId = `PAY-10${payrollList.length + 1}`;
      onAddPayroll({
        id: nextId,
        employeeId: formData.employeeId,
        month: formData.month,
        basicSalary: formData.basicSalary,
        hra: formData.hra,
        allowances: formData.allowances,
        deductions: formData.deductions,
        netSalary,
        status: formData.status,
        processedDate: new Date().toISOString().split('T')[0]
      });
    }

    setShowFormModal(false);
  };

  const handleDownloadPdf = (p: Payroll) => {
    const doc = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    const empName = getEmpName(p.employeeId);
    const empEmail = getEmpEmail(p.employeeId);
    const grossEarnings = p.basicSalary + p.hra + p.allowances;
    
    // Draw background color or accents
    doc.setFillColor(248, 250, 252); // soft grey
    doc.rect(0, 0, 210, 297, 'F');

    // Header card (dark slate blue)
    doc.setFillColor(30, 41, 59); // slate-800
    doc.rect(15, 15, 180, 28, 'F');

    // Card border
    doc.setDrawColor(226, 232, 240);
    doc.setLineWidth(0.5);
    doc.rect(15, 15, 180, 258);

    // Header Text
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.setTextColor(255, 255, 255);
    doc.text('HRMS ERP ENTERPRISE', 22, 26);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(203, 213, 225); // slate-300
    doc.text('Hitech City, Hyderabad, India | hr@company.com', 22, 32);
    doc.text('Operational Headquarters HQ', 22, 37);

    // Slip title
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.setTextColor(15, 23, 42); // slate-900
    doc.text('SALARY DISBURSEMENT SLIP', 22, 58);

    // Horizontal line
    doc.setDrawColor(226, 232, 240);
    doc.line(22, 64, 188, 64);

    // Meta columns
    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(100, 116, 139); // slate-500
    doc.text('EMPLOYEE DETAILS', 22, 73);
    doc.text('PAY SUMMARY DETAILS', 110, 73);

    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85); // slate-700
    doc.text(`Employee Name : ${empName}`, 22, 80);
    doc.text(`Employee ID   : ${p.employeeId}`, 22, 85);
    doc.text(`Email Address : ${empEmail}`, 22, 90);

    doc.text(`Salary Month  : ${p.month}`, 110, 80);
    doc.text(`Payment Date  : ${p.processedDate || 'Pending'}`, 110, 85);
    doc.text(`Ref ID Number : ${p.id}`, 110, 90);
    doc.text(`Payment Status: ${p.status}`, 110, 95);

    doc.line(22, 102, 188, 102);

    // Table Header
    doc.setFillColor(241, 245, 249);
    doc.rect(22, 108, 166, 8, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(71, 85, 105);
    doc.text('PARTICULARS (EARNINGS)', 25, 113.5);
    doc.text('AMOUNT (INR)', 80, 113.5);
    doc.text('PARTICULARS (DEDUCTIONS)', 110, 113.5);
    doc.text('AMOUNT (INR)', 165, 113.5);

    // Row 1
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(51, 65, 85);
    doc.text('Basic Monthly Pay', 25, 124);
    doc.text(`Rs. ${p.basicSalary.toLocaleString()}`, 80, 124);
    doc.text('Provident Fund (PF)', 110, 124);
    doc.text(`Rs. ${(p.deductions * 0.7).toFixed(0)}`, 165, 124);

    // Row 2
    doc.text('House Rent Allowance', 25, 131);
    doc.text(`Rs. ${p.hra.toLocaleString()}`, 80, 131);
    doc.text('Health Insurance Premium', 110, 131);
    doc.text(`Rs. ${(p.deductions * 0.3).toFixed(0)}`, 165, 131);

    // Row 3
    doc.text('Other General Allowances', 25, 138);
    doc.text(`Rs. ${p.allowances.toLocaleString()}`, 80, 138);
    doc.text('-', 110, 138);
    doc.text('-', 165, 138);

    doc.line(22, 144, 188, 144);

    // Totals
    doc.setFont('helvetica', 'bold');
    doc.text('Gross Earnings', 25, 151);
    doc.text(`Rs. ${grossEarnings.toLocaleString()}`, 80, 151);
    doc.text('Total Deductions', 110, 151);
    doc.text(`Rs. ${p.deductions.toLocaleString()}`, 165, 151);

    doc.line(22, 157, 188, 157);

    // Net pay highlighted block
    doc.setFillColor(15, 23, 42); // slate-900
    doc.rect(22, 164, 166, 18, 'F');
    
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(11);
    doc.text('NET BANK PAYOUT:', 28, 175);
    
    doc.setFontSize(13);
    doc.setTextColor(52, 211, 153); // emerald-400
    doc.text(`INR ${p.netSalary.toLocaleString()}/-`, 120, 175);

    // Footer Info
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8.5);
    doc.setTextColor(148, 163, 184); // slate-400
    doc.text('This is an official computer-generated salary slip and does not require a physical signature.', 22, 205);
    doc.text('Operational Headquarters: Hitech City, Hyderabad, India. Contact: hr@company.com', 22, 210);

    doc.save(`Payslip_${p.employeeId}_${p.month.replace(' ', '_')}.pdf`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPayslip = (p: Payroll) => {
    const empName = getEmpName(p.employeeId);
    const empEmail = getEmpEmail(p.employeeId);
    const grossEarnings = p.basicSalary + p.hra + p.allowances;
    
    const slipText = `=========================================================
                    HRMS ERP ENTERPRISE
                Hitech City, Hyderabad, India
=========================================================
SALARY DISBURSEMENT SLIP             Ref ID: ${p.id}
Month: ${p.month}                     Date: ${p.processedDate || 'Pending'}
=========================================================
EMPLOYEE DETAILS:
Employee ID  : ${p.employeeId}
Full Name    : ${empName}
Email        : ${empEmail}
=========================================================
EARNINGS DETAILS (CREDIT):
Basic Monthly Pay                 : INR ${p.basicSalary.toLocaleString()}
House Rent Allowance (HRA)        : INR ${p.hra.toLocaleString()}
Other General Allowances          : INR ${p.allowances.toLocaleString()}
---------------------------------------------------------
Total Gross Earnings              : INR ${grossEarnings.toLocaleString()}
=========================================================
DEDUCTIONS DETAILS (DEBIT):
Provident Fund (PF)               : INR ${(p.deductions * 0.7).toFixed(0)}
Health Insurance Premium          : INR ${(p.deductions * 0.3).toFixed(0)}
---------------------------------------------------------
Total Deductions                  : INR ${p.deductions.toLocaleString()}
=========================================================
NET PAYOUT SUMMARY:
Finalized Net Bank Payout         : INR ${p.netSalary.toLocaleString()}
Status                            : ${p.status}
=========================================================
Location Address : Hitech City, Hyderabad, India
This is a computer-generated salary slip and does not
require a physical signature.
=========================================================`;

    const blob = new Blob([slipText], { type: 'text/plain;charset=utf-8' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Payslip_${p.employeeId}_${p.month.replace(' ', '_')}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-4 sm:space-y-0">
        <div>
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Financial Ledger</p>
          <h3 className="text-lg font-bold text-slate-800">Compensation & Salary Slips</h3>
        </div>
        {canModify && (
          <div className="flex flex-wrap gap-2">
            <button
              id="btn-excel-import"
              onClick={() => setIsImportOpen(!isImportOpen)}
              className={`px-4 py-2.5 rounded-xl text-xs font-bold flex items-center space-x-2 transition-all cursor-pointer ${
                isImportOpen 
                  ? 'bg-slate-800 hover:bg-slate-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-md shadow-emerald-600/10'
              }`}
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Bulk Excel Import</span>
            </button>
            <button
              id="btn-add-payroll"
              onClick={openAddModal}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 flex items-center space-x-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Process Payroll</span>
            </button>
          </div>
        )}
      </div>

      {/* Excel bulk payroll import panel */}
      {isImportOpen && canModify && (
        <div className="bg-white border border-emerald-200 rounded-2xl shadow-sm p-6 space-y-6 animate-scaleUp">
          <div className="flex justify-between items-center border-b border-slate-100 pb-3">
            <div className="flex items-center space-x-2.5">
              <div className="p-2 bg-emerald-50 rounded-lg text-emerald-600">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-800">HR Bulk Excel Payroll Processor</h3>
                <p className="text-[11px] text-slate-400">Fill and upload your monthly payroll sheet to register in the database</p>
              </div>
            </div>
            <button
              id="close-import-panel"
              onClick={() => setIsImportOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left side: options */}
            <div className="space-y-4">
              <div className="bg-slate-50 border border-slate-200/60 p-4 rounded-xl space-y-3.5">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center">
                  <Database className="w-3.5 h-3.5 text-blue-500 mr-1.5" />
                  Target Period Setup
                </h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Select Month</label>
                    <select
                      id="excel-month-select"
                      value={excelMonth}
                      onChange={(e) => setExcelMonth(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
                    >
                      {['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'].map(m => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block mb-1">Select Year</label>
                    <select
                      id="excel-year-select"
                      value={excelYear}
                      onChange={(e) => setExcelYear(e.target.value)}
                      className="w-full bg-white border border-slate-200 focus:border-blue-400 rounded-lg px-2.5 py-1.5 text-xs text-slate-700 outline-none cursor-pointer"
                    >
                      {['2025', '2026', '2027', '2028'].map(y => (
                        <option key={y} value={y}>{y}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    id="btn-download-excel-template"
                    onClick={downloadExcelTemplate}
                    className="w-full px-3 py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-100 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-all cursor-pointer"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download Excel Template</span>
                  </button>
                  <p className="text-[10px] text-slate-400 text-center mt-2 leading-normal">
                    This template includes all active staff pre-loaded for easy editing!
                  </p>
                </div>
              </div>
            </div>

            {/* Right side: File upload */}
            <div className="flex flex-col justify-center">
              <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-2">Upload Excel Spreadsheet</label>
              <div className="border-2 border-dashed border-slate-200 hover:border-emerald-400 transition-colors rounded-2xl p-6 text-center cursor-pointer relative bg-slate-50/50">
                <input
                  type="file"
                  id="excel-file-upload-input"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleExcelUpload}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                />
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
                    <Upload className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">
                      {excelFile ? excelFile.name : 'Choose file or drag & drop'}
                    </p>
                    <p className="text-[10px] text-slate-400 mt-1">Accepts .xlsx, .xls or .csv spreadsheets</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Messages */}
          {importError && (
            <div className="bg-rose-50 border border-rose-200/50 text-rose-700 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{importError}</span>
            </div>
          )}

          {importStatus && (
            <div className="bg-emerald-50 border border-emerald-200/50 text-emerald-800 text-xs px-4 py-3 rounded-xl flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-emerald-600" />
              <span>{importStatus}</span>
            </div>
          )}

          {/* Excel parsed rows preview */}
          {excelData.length > 0 && (
            <div className="space-y-3 pt-2">
              <div className="flex items-center justify-between">
                <h4 className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Spreadsheet Data Preview</h4>
                <span className="text-[10px] font-bold text-slate-400 italic">Verify prior to writing to database</span>
              </div>
              <div className="border border-slate-200 rounded-xl overflow-hidden max-h-48 overflow-y-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[9px] font-bold uppercase tracking-wider">
                      <th className="py-2.5 px-4">Row</th>
                      <th className="py-2.5 px-4">Emp ID</th>
                      <th className="py-2.5 px-4">Emp Name</th>
                      <th className="py-2.5 px-4 text-right">Basic</th>
                      <th className="py-2.5 px-4 text-right">HRA</th>
                      <th className="py-2.5 px-4 text-right">Allowances</th>
                      <th className="py-2.5 px-4 text-right text-rose-500">Deductions</th>
                      <th className="py-2.5 px-4 text-right font-bold text-slate-700">Est Net Salary</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-slate-600 text-[10px]">
                    {excelData.map((row) => {
                      const empName = getEmpName(row.employeeId);
                      const net = row.basicSalary + row.hra + row.allowances - row.deductions;
                      return (
                        <tr key={row.rowNum} className="hover:bg-slate-50/50">
                          <td className="py-2 px-4 font-mono">{row.rowNum}</td>
                          <td className="py-2 px-4 font-semibold text-slate-800">{row.employeeId}</td>
                          <td className="py-2 px-4">{empName}</td>
                          <td className="py-2 px-4 text-right font-mono">₹{row.basicSalary.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono">₹{row.hra.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono">₹{row.allowances.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono text-rose-500">₹{row.deductions.toLocaleString()}</td>
                          <td className="py-2 px-4 text-right font-mono font-bold text-slate-800">₹{net.toLocaleString()}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="button"
                  id="btn-run-payroll-bulk"
                  onClick={runExcelPayroll}
                  className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-extrabold shadow-md shadow-emerald-600/10 flex items-center space-x-2 transition-all cursor-pointer animate-pulse"
                >
                  <Database className="w-4 h-4" />
                  <span>Run Payroll & Store Data ({excelData.length} Records)</span>
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Filters bar */}
      <div className="bg-white p-4.5 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 transform -translate-y-1/2" />
          <input
            id="payroll-search"
            type="text"
            placeholder="Search payroll by employee name, ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50/50 hover:bg-slate-50 focus:bg-white border border-slate-200 focus:border-blue-400 rounded-xl pl-10 pr-4 py-2.5 text-xs text-slate-700 outline-none transition-all placeholder:text-slate-400"
          />
        </div>

        {/* Month Selector */}
        <div className="w-full md:w-52">
          <select
            id="payroll-month-filter"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full bg-slate-50/50 border border-slate-200 focus:border-blue-400 rounded-xl px-3 py-2.5 text-xs text-slate-700 outline-none transition-all cursor-pointer font-semibold"
          >
            <option value="July 2026">July 2026</option>
            <option value="June 2026">June 2026</option>
            <option value="May 2026">May 2026</option>
            <option value="April 2026">April 2026</option>
            <option value="March 2026">March 2026</option>
            <option value="February 2026">February 2026</option>
            <option value="January 2026">January 2026</option>
            <option value="December 2025">December 2025</option>
          </select>
        </div>
      </div>

      {/* Payroll Records List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-slate-400 text-[10px] font-bold uppercase tracking-wider">
                <th className="py-4 px-6">ID / Employee</th>
                <th className="py-4 px-4">Pay Period</th>
                <th className="py-4 px-4 text-right">Basic Salary</th>
                <th className="py-4 px-4 text-right">Allowances (HRA+)</th>
                <th className="py-4 px-4 text-right text-rose-600">Deductions</th>
                <th className="py-4 px-4 text-right font-extrabold text-slate-800">Net Salary</th>
                <th className="py-4 px-4 text-center">Status</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600 text-xs">
              {filteredPayrolls.length > 0 ? (
                filteredPayrolls.map((p) => {
                  const totalAllowances = p.hra + p.allowances;
                  
                  const statusColors = {
                    Draft: 'bg-slate-50 text-slate-500 border-slate-200',
                    Processed: 'bg-blue-50 text-blue-700 border-blue-200',
                    Paid: 'bg-emerald-50 text-emerald-700 border-emerald-100'
                  }[p.status];

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-6 flex items-center space-x-3.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-xs font-mono font-bold text-slate-600">
                          {p.employeeId.replace('EMP-', '')}
                        </div>
                        <div>
                          <h4 className="font-bold text-slate-800">{getEmpName(p.employeeId)}</h4>
                          <span className="text-[10px] text-slate-400 font-bold block mt-0.5">{p.id}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 font-semibold text-slate-600">{p.month}</td>
                      <td className="py-4 px-4 text-right font-mono font-semibold">₹{p.basicSalary.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-mono text-emerald-600">+₹{totalAllowances.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-mono text-rose-500">-₹{p.deductions.toLocaleString()}</td>
                      <td className="py-4 px-4 text-right font-mono font-extrabold text-slate-800">₹{p.netSalary.toLocaleString()}</td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 text-[10px] font-bold rounded-full border ${statusColors}`}>
                          {p.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right">
                        <div className="flex items-center justify-end space-x-1">
                          <button
                            id={`btn-payslip-${p.id}`}
                            onClick={() => {
                              setViewingPayroll(p);
                              setShowSlipModal(true);
                            }}
                            className="px-2.5 py-1 text-slate-600 hover:text-blue-700 hover:bg-blue-50 border border-slate-200 hover:border-blue-200 rounded-lg text-[10px] font-bold transition-all flex items-center space-x-1"
                            title="Generate Slip PDF"
                          >
                            <FileText className="w-3.5 h-3.5" />
                            <span>View Pay Slip</span>
                          </button>
                          {canModify && p.status !== 'Paid' && (
                            <>
                              <button
                                id={`btn-edit-pay-${p.id}`}
                                onClick={() => openEditModal(p)}
                                className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                title="Edit Record"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                id={`btn-delete-pay-${p.id}`}
                                onClick={() => {
                                  if (confirm(`Are you sure you want to remove this payroll record?`)) {
                                    onDeletePayroll(p.id);
                                  }
                                }}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                                title="Remove Record"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <div className="flex flex-col items-center space-y-2">
                      <AlertCircle className="w-8 h-8 text-slate-300" />
                      <p className="font-semibold text-sm">No payroll processed for this month</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* FORM MODAL (PROCESS SALARY) */}
      {showFormModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs" onClick={() => setShowFormModal(false)} />
          
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden relative z-50 animate-scaleUp">
            <div className="p-5 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <h3 className="text-sm font-bold text-slate-800">
                {editingPayroll ? `Re-process Salary (${editingPayroll.id})` : 'Process Employee Salary'}
              </h3>
              <button 
                id="close-pay-form-modal"
                onClick={() => setShowFormModal(false)} 
                className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {formError && (
                <div className="p-3 bg-rose-50 border border-rose-100 rounded-xl text-rose-700 text-xs flex items-center space-x-2">
                  <AlertCircle className="w-4 h-4 flex-shrink-0" />
                  <span className="font-semibold">{formError}</span>
                </div>
              )}

              {/* Employee selection */}
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Employee *</label>
                <select
                  id="pay-field-employee"
                  required
                  disabled={editingPayroll ? true : false}
                  value={formData.employeeId}
                  onChange={(e) => handleEmpChange(e.target.value)}
                  className="w-full bg-slate-50 disabled:bg-slate-100 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>{e.firstName} {e.lastName} ({e.id})</option>
                  ))}
                </select>
              </div>

              {/* Basic & HRA */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Basic Salary (₹)</label>
                  <input
                    id="pay-field-basic"
                    type="number"
                    value={formData.basicSalary}
                    onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">HRA Allowance (₹)</label>
                  <input
                    id="pay-field-hra"
                    type="number"
                    value={formData.hra}
                    onChange={(e) => setFormData(prev => ({ ...prev, hra: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                  />
                </div>
              </div>

              {/* Allowances & Deductions */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Other Allowances (₹)</label>
                  <input
                    id="pay-field-allowances"
                    type="number"
                    value={formData.allowances}
                    onChange={(e) => setFormData(prev => ({ ...prev, allowances: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-rose-500 uppercase tracking-wider">Deductions (₹)</label>
                  <input
                    id="pay-field-deductions"
                    type="number"
                    value={formData.deductions}
                    onChange={(e) => setFormData(prev => ({ ...prev, deductions: parseInt(e.target.value) || 0 }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none font-mono text-rose-600"
                  />
                </div>
              </div>

              {/* Status & Preview Net */}
              <div className="grid grid-cols-2 gap-4 pt-1">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Salary Status</label>
                  <select
                    id="pay-field-status"
                    value={formData.status}
                    onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value as any }))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2 text-xs text-slate-700 outline-none cursor-pointer"
                  >
                    <option value="Draft">Draft</option>
                    <option value="Processed">Processed</option>
                    <option value="Paid">Paid</option>
                  </select>
                </div>

                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex flex-col justify-center">
                  <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wide">Net Pay Estimate</span>
                  <span className="text-sm font-mono font-extrabold text-emerald-600 mt-0.5">
                    ₹{netSalaryCalculated.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Buttons Footer */}
              <div className="pt-4 border-t border-slate-100 flex justify-end space-x-3">
                <button
                  type="button"
                  id="btn-pay-cancel"
                  onClick={() => setShowFormModal(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-600 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  id="btn-pay-save"
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold shadow-md shadow-blue-600/10 transition-all cursor-pointer"
                >
                  {editingPayroll ? 'Apply Changes' : 'Generate Ledger'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DETAILED PRINTABLE PAY SLIP MODAL */}
      {showSlipModal && viewingPayroll && (
        <div id="salary-slip-modal-wrapper" className="fixed inset-0 z-50 flex justify-center items-start overflow-y-auto p-4 md:p-10">
          <style dangerouslySetInnerHTML={{ __html: `
            @media print {
              /* Hide all elements that have print:hidden class */
              .print\:hidden {
                display: none !important;
              }
              
              /* Reset container properties that limit viewport height, hide content, or trigger scrollbars */
              html, body, #root, .min-h-screen, main {
                height: auto !important;
                min-height: 0 !important;
                max-height: none !important;
                overflow: visible !important;
                display: block !important;
                padding: 0 !important;
                margin: 0 !important;
                background: white !important;
                box-shadow: none !important;
              }

              /* Position the modal wrapper naturally on the page flow */
              #salary-slip-modal-wrapper {
                position: relative !important;
                display: block !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
                z-index: auto !important;
              }

              /* Reset the inner modal card to take full printable space cleanly */
              #salary-slip-modal-card {
                position: relative !important;
                display: block !important;
                width: 100% !important;
                max-width: 100% !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                border: none !important;
                box-shadow: none !important;
                margin: 0 !important;
                padding: 0 !important;
                background: white !important;
                border-radius: 0 !important;
              }

              /* Target the printed area of the slip and ensure all text is solid black */
              #salary-slip-print-area {
                display: block !important;
                width: 100% !important;
                height: auto !important;
                max-height: none !important;
                overflow: visible !important;
                padding: 20px !important;
                margin: 0 !important;
                background: white !important;
                color: black !important;
              }

              #salary-slip-print-area * {
                color: black !important;
              }

              /* Keep branding and payout blocks visually clear in grayscale/color printing */
              .text-emerald-400, .text-emerald-600 {
                color: #059669 !important;
              }
              .bg-slate-900 {
                background-color: #0f172a !important;
                color: white !important;
                border-radius: 12px !important;
                padding: 24px !important;
              }
              .bg-slate-900 * {
                color: white !important;
              }
            }
          `}} />
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs print:hidden" onClick={() => setShowSlipModal(false)} />
          
          <div id="salary-slip-modal-card" className="bg-white rounded-2xl shadow-xl w-full max-w-2xl relative z-50 animate-scaleUp flex flex-col max-h-[90vh] my-auto">
            
            {/* Header / Tools bar */}
            <div className="p-4 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-3 sm:items-center justify-between print:hidden rounded-t-2xl">
              <span className="text-xs font-bold text-slate-700 flex items-center space-x-1.5">
                <Calculator className="w-4 h-4 text-blue-500" />
                <span>Enterprise Pay Slip Console</span>
              </span>
              <div className="flex items-center space-x-1.5 sm:space-x-2 flex-wrap gap-y-1.5 justify-end">
                <button
                  id="btn-print-payslip"
                  onClick={handlePrint}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Print Payslip</span>
                </button>
                <button
                  id="btn-download-pdf-payslip"
                  onClick={() => handleDownloadPdf(viewingPayroll)}
                  className="px-2.5 sm:px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold flex items-center space-x-1 transition-all cursor-pointer"
                >
                  <FileText className="w-3.5 h-3.5" />
                  <span>Download PDF</span>
                </button>
                <button
                  id="btn-download-payslip"
                  onClick={() => handleDownloadPayslip(viewingPayroll)}
                  className="px-2 sm:px-3 py-1.5 bg-slate-600 hover:bg-slate-500 text-white rounded-lg text-xs font-semibold flex items-center space-x-1 transition-all cursor-pointer"
                  title="Download raw details as plain text file"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden sm:inline">Text Slip</span>
                </button>
                <button 
                  id="close-slip-modal"
                  onClick={() => setShowSlipModal(false)} 
                  className="text-slate-400 hover:text-slate-700 hover:bg-slate-200 p-1.5 rounded-lg transition-colors cursor-pointer"
                  aria-label="Close modal"
                >
                  <X className="w-4.5 h-4.5" />
                </button>
              </div>
            </div>

            {/* Printable Pay Slip Layout */}
            <div id="salary-slip-print-area" className="flex-1 overflow-y-auto p-10 space-y-8 bg-white text-slate-800">
              {/* Corporate Identity Header */}
              <div className="flex justify-between items-start border-b-2 border-slate-900 pb-6">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-slate-900">HRMS ERP ENTERPRISE</h2>
                  <span className="text-xs text-slate-500 font-semibold uppercase tracking-wider mt-1 block">Operational Headquarters HQ</span>
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Hitech City, Hyderabad, India • hr@company.com</span>
                </div>
                <div className="text-right">
                  <h3 className="text-sm font-extrabold tracking-wide uppercase text-slate-700">SALARY DISBURSEMENT SLIP</h3>
                  <span className="text-xs font-mono font-bold text-blue-600 mt-1 block">Ref ID: {viewingPayroll.id}</span>
                  <span className="text-[10px] text-slate-500 mt-1.5 block">Payment Date: {viewingPayroll.processedDate || 'Pending'}</span>
                </div>
              </div>

              {/* Employee and Payroll meta details */}
              <div className="grid grid-cols-2 gap-6 text-xs border-b border-slate-200 pb-6">
                <div className="space-y-1.5">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Employee Recipient</p>
                  <h4 className="text-sm font-extrabold text-slate-800">{getEmpName(viewingPayroll.employeeId)}</h4>
                  <p className="font-semibold text-slate-600">ID Reference: {viewingPayroll.employeeId}</p>
                  <p className="font-medium text-slate-500">{getEmpEmail(viewingPayroll.employeeId)}</p>
                </div>
                <div className="space-y-1.5 text-right sm:text-left sm:pl-12">
                  <p className="text-slate-400 font-bold uppercase tracking-wider text-[9px]">Pay Summary Details</p>
                  <p className="font-semibold text-slate-700">Salary Month: <span className="font-bold">{viewingPayroll.month}</span></p>
                  <p className="font-semibold text-slate-700">Tax Period: <span className="font-mono font-bold">2026-FY2</span></p>
                  <p className="font-semibold text-slate-700">Status: <span className="font-bold text-emerald-600">{viewingPayroll.status}</span></p>
                </div>
              </div>

              {/* Detailed Breakdown Tables */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 text-xs">
                
                {/* Earnings Column */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-slate-800 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>EARNINGS DETAILS</span>
                    <span className="text-[10px] text-slate-400">CREDIT</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Basic Monthly Pay</span>
                      <span className="font-mono font-bold text-slate-800">₹{viewingPayroll.basicSalary.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">House Rent Allowance (HRA)</span>
                      <span className="font-mono font-bold text-slate-800">₹{viewingPayroll.hra.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Other General Allowances</span>
                      <span className="font-mono font-bold text-slate-800">₹{viewingPayroll.allowances.toLocaleString()}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-extrabold text-slate-900">
                    <span>Total Gross Earnings</span>
                    <span className="font-mono">₹{(viewingPayroll.basicSalary + viewingPayroll.hra + viewingPayroll.allowances).toLocaleString()}</span>
                  </div>
                </div>

                {/* Deductions Column */}
                <div className="space-y-3">
                  <h5 className="font-extrabold text-rose-700 uppercase tracking-wider border-b border-slate-200 pb-1.5 flex justify-between">
                    <span>DEDUCTIONS DETAILS</span>
                    <span className="text-[10px] text-slate-400">DEBIT</span>
                  </h5>
                  <div className="space-y-2">
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Provident Fund / Tax Reserve</span>
                      <span className="font-mono font-bold text-rose-600">-₹{(viewingPayroll.deductions * 0.7).toFixed(0)}</span>
                    </div>
                    <div className="flex justify-between font-medium">
                      <span className="text-slate-600">Health Insurance Premium</span>
                      <span className="font-mono font-bold text-rose-600">-₹{(viewingPayroll.deductions * 0.3).toFixed(0)}</span>
                    </div>
                  </div>
                  <div className="border-t border-slate-100 pt-2 flex justify-between font-extrabold text-rose-800">
                    <span>Total Deductions</span>
                    <span className="font-mono">-₹{viewingPayroll.deductions.toLocaleString()}</span>
                  </div>
                </div>
              </div>

              {/* Net Payout Summary Block */}
              <div className="bg-slate-900 text-white rounded-xl p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="space-y-1 text-center sm:text-left">
                  <span className="text-[10px] font-extrabold text-blue-400 uppercase tracking-widest block leading-none">Net Bank Payout</span>
                  <span className="text-xs text-slate-300 block mt-1">This amount represents finalized monthly salary transferred to bank.</span>
                </div>
                <div className="text-center sm:text-right font-mono">
                  <span className="text-2xl font-extrabold text-white block">
                    ₹{viewingPayroll.netSalary.toLocaleString()}
                  </span>
                  <span className="text-[10px] text-emerald-400 font-bold block mt-1 flex items-center justify-center sm:justify-end">
                    <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
                    Direct Deposit Complete
                  </span>
                </div>
              </div>

              {/* Legal Notes Footer */}
              <div className="border-t border-slate-200 pt-6 text-[10px] text-slate-400 leading-normal space-y-1">
                <p>• This is a computer-generated salary slip and does not require an physical authorized signature.</p>
                <p>• For any payroll discrepancies, taxes alignment, or inquiries, please write to <b>hr@company.com</b> within 5 working days.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
