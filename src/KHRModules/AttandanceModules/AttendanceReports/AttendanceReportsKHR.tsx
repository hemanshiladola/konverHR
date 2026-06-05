import { useEffect, useState } from "react";
import { DatePicker } from "antd";
import { Dayjs } from "dayjs";
import { toast } from "react-toastify";
import CommonHeader from "@/CommonComponent/HeaderKHR/HeaderKHR";
import { all_routes } from "@/router/all_routes";
import {
  ReportExportPayload,
  exportAbsentPresentReportToExcel,
  exportAbsentPresentReportToPdf,
  exportAttendanceToExcel,
  exportAttendanceToPdf,
  exportLateReportExcel,
  exportLateReportPdf,
  exportMissedPunchExcel,
  exportMissedPunchPdf,
  exportRegularizationExcel,
  exportRegularizationPdf,
  AttendanceExportPayload,
} from "../AdminAttandance/AdminAttandanceServices";
import {
  getBranches,
  getDepartments,
  getReportingManagers,
  getWorkingSchedules,
} from "@/KHRModules/EmployeModules/Employee/EmployeeServices";

const AttendanceReportsKHR = () => {
  const routes = all_routes;
  const [exportingKey, setExportingKey] = useState<string | null>(null);
  const [exportDateFrom, setExportDateFrom] = useState<Dayjs | null>(null);
  const [exportDateTo, setExportDateTo] = useState<Dayjs | null>(null);
  const [exportBranchId, setExportBranchId] = useState<number | null>(null);
  const [exportDepartmentId, setExportDepartmentId] = useState<number | null>(null);
  const [exportScheduleId, setExportScheduleId] = useState<number | null>(null);
  const [exportManagerId, setExportManagerId] = useState<number | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workingSchedules, setWorkingSchedules] = useState<any[]>([]);
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);

  useEffect(() => {
    getBranches().then(setBranches).catch(() => {});
    getDepartments().then(setDepartments).catch(() => {});
    getWorkingSchedules().then(setWorkingSchedules).catch(() => {});
    getReportingManagers().then(setReportingManagers).catch(() => {});
  }, []);

  const validateDates = (): boolean => {
    if (!exportDateFrom || !exportDateTo) {
      toast.error("Please select both Start Date and End Date.");
      return false;
    }
    return true;
  };

  const getReportPayload = (): ReportExportPayload | null => {
    if (!validateDates()) return null;
    const payload: ReportExportPayload = {
      date_from: exportDateFrom!.format("YYYY-MM-DD"),
      date_to: exportDateTo!.format("YYYY-MM-DD"),
    };
    if (exportBranchId) payload.branch_id = exportBranchId;
    if (exportDepartmentId) payload.department_id = exportDepartmentId;
    if (exportManagerId) payload.reporting_manager_id = exportManagerId;
    if (exportScheduleId) payload.resource_calendar_id = exportScheduleId;
    return payload;
  };

  const getAttendancePayload = (): AttendanceExportPayload | null => {
    if (!validateDates()) return null;
    const payload: AttendanceExportPayload = {
      start_date: exportDateFrom!.format("YYYY-MM-DD"),
      end_date: exportDateTo!.format("YYYY-MM-DD"),
    };
    if (exportBranchId) payload.branch_id = exportBranchId;
    if (exportScheduleId) payload.resource_calendar_id = exportScheduleId;
    if (exportManagerId) payload.reporting_manager_id = exportManagerId;
    if (exportDepartmentId) payload.department_client_id = exportDepartmentId;
    return payload;
  };

  const handleExport = async (exportFn: (payload: any) => Promise<any>, payloadFn: () => any, key: string) => {
    const payload = payloadFn();
    if (!payload) return;
    setExportingKey(key);
    try {
      await exportFn(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setExportingKey(null);
    }
  };

  const handleCheckinExportPdf = async () => {
    if (!validateDates()) return;
    setExportingKey("checkin-pdf");
    try {
      await exportAttendanceToPdf(
        exportDateFrom!.format("YYYY-MM-DD"),
        exportDateTo!.format("YYYY-MM-DD"),
        exportBranchId,
        exportDepartmentId,
      );
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setExportingKey(null);
    }
  };

  const handleCheckinExportExcel = async () => {
    if (!validateDates()) return;
    setExportingKey("checkin-excel");
    try {
      await exportAttendanceToExcel(
        exportDateFrom!.format("YYYY-MM-DD"),
        exportDateTo!.format("YYYY-MM-DD"),
        exportBranchId,
        exportDepartmentId,
      );
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setExportingKey(null);
    }
  };

  const reportCards = [
    {
      key: "absent-present",
      title: "Absent/Present Report",
      description: "Download attendance status report for all employees",
      icon: "ti-calendar-stats",
      color: "#3b82f6",
      bg: "rgba(59, 130, 246, 0.08)",
      onPdf: () => handleExport(exportAbsentPresentReportToPdf, getAttendancePayload, "absent-present-pdf"),
      onExcel: () => handleExport(exportAbsentPresentReportToExcel, getAttendancePayload, "absent-present-excel"),
      pdfKey: "absent-present-pdf",
      excelKey: "absent-present-excel",
    },
    {
      key: "late-login",
      title: "Late Login Report",
      description: "Track employees who logged in late",
      icon: "ti-clock-exclamation",
      color: "#f59e0b",
      bg: "rgba(245, 158, 11, 0.08)",
      onPdf: () => handleExport(exportLateReportPdf, getReportPayload, "late-pdf"),
      onExcel: () => handleExport(exportLateReportExcel, getReportPayload, "late-excel"),
      pdfKey: "late-pdf",
      excelKey: "late-excel",
    },
    {
      key: "missed-punch",
      title: "Missed Punch Report",
      description: "Employees who missed check-in or check-out",
      icon: "ti-fingerprint-off",
      color: "#ef4444",
      bg: "rgba(239, 68, 68, 0.08)",
      onPdf: () => handleExport(exportMissedPunchPdf, getReportPayload, "missed-pdf"),
      onExcel: () => handleExport(exportMissedPunchExcel, getReportPayload, "missed-excel"),
      pdfKey: "missed-pdf",
      excelKey: "missed-excel",
    },
    {
      key: "regularization",
      title: "Attendance Regularization",
      description: "Regularization requests and approvals",
      icon: "ti-adjustments-check",
      color: "#06b6d4",
      bg: "rgba(6, 182, 212, 0.08)",
      onPdf: () => handleExport(exportRegularizationPdf, getReportPayload, "reg-pdf"),
      onExcel: () => handleExport(exportRegularizationExcel, getReportPayload, "reg-excel"),
      pdfKey: "reg-pdf",
      excelKey: "reg-excel",
    },
    {
      key: "checkin",
      title: "Check-in/Checkout Report",
      description: "Daily check-in and check-out time logs",
      icon: "ti-login",
      color: "#10b981",
      bg: "rgba(16, 185, 129, 0.08)",
      onPdf: handleCheckinExportPdf,
      onExcel: handleCheckinExportExcel,
      pdfKey: "checkin-pdf",
      excelKey: "checkin-excel",
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <CommonHeader
          title="Attendance Reports"
          parentMenu="Attendance"
          activeMenu="Reports"
          routes={routes}
        />

        {/* Filters Card */}
        <div className="card border-0 shadow-sm rounded-3 mb-4">
          <div className="card-body p-4">
            <div className="d-flex align-items-center mb-3">
              <div className="rounded-circle d-flex align-items-center justify-content-center me-3" style={{ width: "40px", height: "40px", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)" }}>
                <i className="ti ti-filter fs-18 text-white" />
              </div>
              <div>
                <h6 className="fw-bold mb-0">Report Filters</h6>
                <p className="text-muted fs-12 mb-0">Select date range and filters to generate reports</p>
              </div>
            </div>
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">
                  Start Date <span className="text-danger">*</span>
                </label>
                <DatePicker
                  className="form-control"
                  value={exportDateFrom}
                  onChange={(val) => setExportDateFrom(val)}
                  format="DD/MM/YYYY"
                  placeholder="Select start date"
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">
                  End Date <span className="text-danger">*</span>
                </label>
                <DatePicker
                  className="form-control"
                  value={exportDateTo}
                  onChange={(val) => setExportDateTo(val)}
                  format="DD/MM/YYYY"
                  placeholder="Select end date"
                  disabledDate={(current) =>
                    exportDateFrom ? current.isBefore(exportDateFrom, "day") : false
                  }
                />
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">Branch</label>
                <select
                  className="form-select"
                  value={exportBranchId ?? ""}
                  onChange={(e) => setExportBranchId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Branches</option>
                  {branches.map((b: any) => (
                    <option key={b.id} value={b.id}>{b.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">Department</label>
                <select
                  className="form-select"
                  value={exportDepartmentId ?? ""}
                  onChange={(e) => setExportDepartmentId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Departments</option>
                  {departments.map((d: any) => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">Working Schedule</label>
                <select
                  className="form-select"
                  value={exportScheduleId ?? ""}
                  onChange={(e) => setExportScheduleId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Schedules</option>
                  {workingSchedules.map((s: any) => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <label className="form-label fs-12 fw-medium text-muted mb-1">Reporting Manager</label>
                <select
                  className="form-select"
                  value={exportManagerId ?? ""}
                  onChange={(e) => setExportManagerId(e.target.value ? Number(e.target.value) : null)}
                >
                  <option value="">All Managers</option>
                  {reportingManagers.map((m: any) => (
                    <option key={m.id} value={m.id}>
                      {m.name || m.employee_name || m.display_name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Report Cards */}
        <div className="row g-3">
          {reportCards.map((report, index) => (
            <div className="col-md-4" key={index}>
              <div className="card border-0 shadow-sm rounded-3 h-100 overflow-hidden">
                <div className="card-body p-4 d-flex flex-column">
                  <div className="d-flex align-items-start mb-3">
                    <div
                      className="rounded-3 d-flex align-items-center justify-content-center me-3 flex-shrink-0"
                      style={{ width: "48px", height: "48px", background: report.bg }}
                    >
                      <i className={`ti ${report.icon} fs-22`} style={{ color: report.color }} />
                    </div>
                    <div>
                      <h6 className="fw-bold mb-1 fs-14">{report.title}</h6>
                      <p className="text-muted fs-12 mb-0">{report.description}</p>
                    </div>
                  </div>
                  <div className="mt-auto d-flex gap-2 pt-3 border-top">
                    <button
                      type="button"
                      className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                      style={{ background: "#fef2f2", color: "#dc2626", border: "1px solid #fecaca", borderRadius: "8px" }}
                      onClick={report.onPdf}
                      disabled={exportingKey !== null}
                    >
                      {exportingKey === report.pdfKey
                        ? <span className="spinner-border spinner-border-sm" />
                        : <i className="ti ti-file-type-pdf fs-16" />}
                      <span className="fw-bold fs-12">{exportingKey === report.pdfKey ? "..." : "PDF"}</span>
                    </button>
                    <button
                      type="button"
                      className="btn btn-sm flex-fill d-flex align-items-center justify-content-center gap-2 py-2"
                      style={{ background: "#f0fdf4", color: "#16a34a", border: "1px solid #bbf7d0", borderRadius: "8px" }}
                      onClick={report.onExcel}
                      disabled={exportingKey !== null}
                    >
                      {exportingKey === report.excelKey
                        ? <span className="spinner-border spinner-border-sm" />
                        : <i className="ti ti-file-type-xls fs-16" />}
                      <span className="fw-bold fs-12">{exportingKey === report.excelKey ? "..." : "Excel"}</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default AttendanceReportsKHR;

