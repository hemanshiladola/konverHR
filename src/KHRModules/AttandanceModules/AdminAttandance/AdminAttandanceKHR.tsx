import { all_routes } from "@/router/all_routes";
// import ImageWithBasePath from "@/core/common/imageWithBasePath";

import { useEffect, useRef, useState } from "react";
import { DatePicker } from "antd";
import dayjs, { Dayjs } from "dayjs";
import DatatableKHR from "@/CommonComponent/DataTableKHR/DatatableKHR";
import CommonHeader from "@/CommonComponent/HeaderKHR/HeaderKHR";

import {
  AttendanceExportPayload,
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
} from "./AdminAttandanceServices";

import {
  getBranches,
  getDepartments,
  getReportingManagers,
  getWorkingSchedules,
} from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
import { toast } from "react-toastify";
import Link from "antd/es/typography/Link";
import CommonAttendanceStatus from "@/CommonComponent/CommonAttendanceStatus/CommonAttendanceStatus";
import EditAttendanceModal from "./EditAdminAttendance";
import { useDispatch, useSelector } from "react-redux";
import {
  ApiAuth,
  AttendancesGetApi,
  getEmployeesBasicInfo,
  TBSelector,
  updateState,
} from "@/Store/Reducers/TBSlice";
import { AppDispatch } from "@/Store";

// Define a type for attendance admin data
interface AttendanceAdminData {
  id: number;
  Employee: string;
  Image: string;
  Role: string;
  Status: string;
  Date: string;
  CheckIn: string;
  CheckOut: string;
  Break: string;
  Late: string;
  ProductionHours: string;
  ReportingManager: string;
  WorkingSchedule: string;
  Branch: string;
  Department: string;
}

// Define a type for AttendanceCard
type AttendanceCard = {
  id: number;
  title: string;
  count: number;
  badgeType: string;
  icon: string;
  percentage: string;
};

// Define Employee interface
interface Employee {
  id: number;
  name: string;
  email: string;
  department?: string;
  designation?: string;
}

// Define GroupedData interface
interface GroupedData {
  groupName: string;
  items: AttendanceAdminData[];
  count: number;
  isGroup: boolean;
}

const AdminAttandanceKHR = () => {
  const routes = all_routes;

  // const [data, setData] = useState<EmployeeAttendance[]>([]);
  const [data, setData] = useState<AttendanceAdminData[]>([]);
  const [attendanceCards, setAttendanceCards] = useState<any[]>([]);

  // Group by functionality
  const [groupBy, setGroupBy] = useState<string>("none");
  const [groupedData, setGroupedData] = useState<GroupedData[]>([]);
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Employee selector
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>("");

  const {
    isAttendancesGetApi,
    isAttendancesGetApiFetching,
    AttendancesGetApiData,
    AdminWorkingHoursData,
    isApiAuth,
    isGetEmployeesBasicInfo,
    isGetEmployeesBasicInfoFetching,
    getEmployeesBasicInfoData,
  } = useSelector(TBSelector);
  const [selectedAttendanceeEditModal, setSelectedAttendanceeEditModal] =
    useState<any>(null);
  const dispatch = useDispatch<AppDispatch>();

  const [isExporting, setIsExporting] = useState(false);
  const [exportDateFrom, setExportDateFrom] = useState<Dayjs | null>(null);
  const [exportDateTo, setExportDateTo] = useState<Dayjs | null>(null);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);
  const [exportBranchId, setExportBranchId] = useState<number | null>(null);
  const [exportDepartmentId, setExportDepartmentId] = useState<number | null>(null);
  const [exportScheduleId, setExportScheduleId] = useState<number | null>(null);
  const [exportManagerId, setExportManagerId] = useState<number | null>(null);
  const [branches, setBranches] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [workingSchedules, setWorkingSchedules] = useState<any[]>([]);
  const [reportingManagers, setReportingManagers] = useState<any[]>([]);
  const [filterDateFrom, setFilterDateFrom] = useState<Dayjs | null>(dayjs().startOf("month"));
  const [filterDateTo, setFilterDateTo] = useState<Dayjs | null>(dayjs());

  // Group by functionality
  const groupByOptions = [
    { value: "none", label: "No Grouping" },
    { value: "status", label: "Group by Status" },
    { value: "absent_date", label: "Absent Date Wise" },  // ADD THIS

    { value: "role", label: "Group by Role" },
    { value: "department", label: "Group by Department" },
    { value: "branch", label: "Group by Branch" },
    { value: "reporting_manager", label: "Group by Reporting Manager" },
    { value: "working_schedule", label: "Group by Working Schedule" },
    { value: "date", label: "Group by Date" },
    { value: "late", label: "Group by Late Status" },
    { value: "production_hours", label: "Group by Production Hours" },
    { value: "last_month", label: "Last Month Only" },
    { value: "last_3_months", label: "Last 3 Months" },
    { value: "last_6_months", label: "Last 6 Months" },
  ];

  // Helper functions for time-based filtering
  const getLastMonthDateRange = () => {
    const now = new Date();
    const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastDayOfLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      date_from: lastMonth.toISOString().split("T")[0],
      date_to: lastDayOfLastMonth.toISOString().split("T")[0],
      label: lastMonth.toLocaleDateString("en-US", {
        month: "long",
        year: "numeric",
      }),
    };
  };

  const fetchWithFilters = (
    dateFrom?: Dayjs | null,
    dateTo?: Dayjs | null,
    employeeId?: string,
  ) => {
    const params: any = {};
    if (dateFrom) params.date_from = dateFrom.format("YYYY-MM-DD");
    if (dateTo) params.date_to = dateTo.format("YYYY-MM-DD");
    if (employeeId) params.employee_id = employeeId;
    dispatch(AttendancesGetApi(params) as any);
  };

  const getLastNMonthsDateRange = (n: number) => {
    const now = new Date();
    const startMonth = new Date(now.getFullYear(), now.getMonth() - n, 1);
    const endMonth = new Date(now.getFullYear(), now.getMonth(), 0);

    return {
      date_from: startMonth.toISOString().split("T")[0],
      date_to: endMonth.toISOString().split("T")[0],
      label: `${startMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })} to ${endMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}`,
    };
  };

  // const downloadBase64File = (base64String, fileName, mimeType) => {
  //   // 1. Remove any whitespace or metadata headers if present
  //   const pureBase64 = base64String.replace(/\s/g, "");

  //   // 2. Convert Base64 to a Byte Array
  //   const byteCharacters = atob(pureBase64);
  //   const byteNumbers = new Array(byteCharacters.length);
  //   for (let i = 0; i < byteCharacters.length; i++) {
  //     byteNumbers[i] = byteCharacters.charCodeAt(i);
  //   }
  //   const byteArray = new Uint8Array(byteNumbers);

  //   // 3. Create a Blob and a download link
  //   const blob = new Blob([byteArray], { type: mimeType });
  //   const url = window.URL.createObjectURL(blob);

  //   const link = document.createElement("a");
  //   link.href = url;
  //   link.download = fileName;

  //   // 4. Trigger download and cleanup
  //   document.body.appendChild(link);
  //   link.click();
  //   document.body.removeChild(link);
  //   window.URL.revokeObjectURL(url);
  // };

  // Function to fetch employees
  const fetchEmployees = () => {
    dispatch(getEmployeesBasicInfo({}) as any);
  };

  // Get employees from Redux state
  const employees: Employee[] =
    getEmployeesBasicInfoData?.data?.map((emp: any) => ({
      id: emp.id,
      name: emp.name || emp.employee_name || "Unknown",
      email: emp.email || "",
      department: emp.department || "",
      designation: emp.designation || emp.job_title || "",
    })) || [];

  // Function to fetch attendance with employee filter
  const fetchAttendanceWithEmployee = (employeeId?: string) => {
    const params: any = {};
    if (employeeId) {
      params.employee_id = employeeId;
    }
    dispatch(AttendancesGetApi(params) as any);
  };

  // Function to fetch attendance for date range
  const fetchAttendanceForDateRange = async (
    date_from: string,
    date_to: string,
    employeeId?: string,
  ) => {
    try {
      // console.log(
      //   `Fetching attendance data from ${date_from} to ${date_to}${employeeId ? ` for employee ${employeeId}` : ""}`,
      // );
      const params: any = { date_from, date_to };
      if (employeeId) {
        params.employee_id = employeeId;
      }
      dispatch(AttendancesGetApi(params) as any);
    } catch (error) {
      console.error("Error fetching attendance data:", error);
    }
  };





  // Group data by field
  // const groupDataByField = (
  //   data: AttendanceAdminData[],
  //   field: string,
  // ): GroupedData[] => {
  //   if (field === "none") return [];

  //   const grouped = data.reduce((acc: any, item) => {
  //     let groupKey = "";

  //     switch (field) {
  //       case "status":
  //         groupKey = item.Status;
  //         break;
  //       case "role":
  //         groupKey = item.Role;
  //         break;
  //       case "department":
  //         groupKey = item.Role; // Using Role as department for now
  //         break;
  //       case "reporting_manager":
  //         groupKey = item.ReportingManager || "No Manager Assigned";
  //         break;
  //       case "working_schedule":
  //         groupKey = item.WorkingSchedule || "No Schedule Assigned";
  //         break;
  //       case "branch":
  //         groupKey = item.Branch || "No Branch Assigned";
  //         break;
  //       case "date":
  //         groupKey = item.Date;
  //         break;
  //         case "department":
  // groupKey = item.Department || item.Role || "No Department";  // â† FIX THIS
  // break;
  // case "absent_date":
  // // Only include absent records, grouped by date
  // if (item.Status !== "Absent") return acc;  // skip non-absent
  // groupKey = item.Date !== "-" ? item.Date : "Unknown Date";
  // break;
  //       case "late":
  //         groupKey = item.Late === "Yes" ? "Late Arrivals" : "On Time";
  //         break;
  //       case "production_hours":
  //         const hours = parseFloat(item.ProductionHours);
  //         if (hours < 4) groupKey = "Under 4 Hours";
  //         else if (hours < 8) groupKey = "4-8 Hours";
  //         else if (hours <= 9) groupKey = "8-9 Hours";
  //         else groupKey = "Over 9 Hours";
  //         break;
  //       case "last_month":
  //       case "last_3_months":
  //       case "last_6_months":
  //         groupKey = item.Status; // Group by status for time-based filters
  //         break;
  //       default:
  //         groupKey = "All Records";
  //     }

  //     if (!acc[groupKey]) {
  //       acc[groupKey] = [];
  //     }
  //     acc[groupKey].push(item);
  //     return acc;
  //   }, {});

  //   return Object.entries(grouped).map(
  //     ([groupName, items]: [string, any]): GroupedData => ({
  //       groupName,
  //       items,
  //       count: items.length,
  //       isGroup: true,
  //     }),
  //   );
  // };

  const groupDataByField = (
    data: AttendanceAdminData[],
    field: string,
  ): GroupedData[] => {
    if (field === "none") return [];

    const workingData =
      field === "absent_date"
        ? data.filter((item) => item.Status === "Absent")
        : data;

    const grouped = workingData.reduce((acc: any, item) => {
      let groupKey = "";

      switch (field) {
        case "status":
          groupKey = item.Status;
          break;
        case "role":
          groupKey = item.Role || "No Role";
          break;
        case "department":
          groupKey = item.Department || item.Role || "No Department";
          break;
        case "reporting_manager":
          groupKey = item.ReportingManager || "No Manager Assigned";
          break;
        case "working_schedule":
          groupKey = item.WorkingSchedule || "No Schedule Assigned";
          break;
        case "branch":
          groupKey = item.Branch || "No Branch Assigned";
          break;
        case "date":
        case "absent_date":
          groupKey = item.Date !== "-" ? item.Date : "Unknown Date";
          break;
        case "late":
          groupKey = item.Late !== "-" && item.Late ? "Late Arrivals" : "On Time";
          break;
        case "production_hours": {
          const hours = parseFloat(item.ProductionHours);
          if (hours === 0) groupKey = "No Hours (Absent)";
          else if (hours < 4) groupKey = "Under 4 Hours";
          else if (hours < 8) groupKey = "4â€“8 Hours";
          else if (hours <= 9) groupKey = "8â€“9 Hours";
          else groupKey = "Over 9 Hours";
          break;
        }
        case "last_month":
        case "last_3_months":
        case "last_6_months":
          groupKey = item.Status;
          break;
        default:
          groupKey = "All Records";
      }

      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    const entries = Object.entries(grouped) as [string, AttendanceAdminData[]][];

    // Sort date-based groups newest first
    if (field === "absent_date" || field === "date") {
      entries.sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime());
    }

    return entries.map(([groupName, items]): GroupedData => ({
      groupName,
      items,
      count: items.length,
      isGroup: true,
    }));
  };

  // Toggle group expansion
  const toggleGroupExpansion = (groupName: string) => {
    const newExpanded = new Set(expandedGroups);
    if (newExpanded.has(groupName)) {
      newExpanded.delete(groupName);
    } else {
      newExpanded.add(groupName);
    }
    setExpandedGroups(newExpanded);
  };

  // Toggle all groups
  const toggleAllGroups = (expand: boolean) => {
    if (expand) {
      setExpandedGroups(new Set(groupedData.map((group) => group.groupName)));
    } else {
      setExpandedGroups(new Set());
    }
  };

  // Handle group by change
  const handleGroupByChange = async (value: string) => {
    setGroupBy(value);

    if (value === "none") {
      setGroupedData([]);
      setExpandedGroups(new Set());
      // Fetch current data without date filters
      fetchAttendanceWithEmployee(selectedEmployeeId);
      return;
    }

    // Handle time-based grouping options
    if (["last_month", "last_3_months", "last_6_months"].includes(value)) {
      try {
        switch (value) {
          case "last_month":
            const lastMonthRange = getLastMonthDateRange();
            setFilterDateFrom(dayjs(lastMonthRange.date_from));
            setFilterDateTo(dayjs(lastMonthRange.date_to));
            fetchWithFilters(
              dayjs(lastMonthRange.date_from),
              dayjs(lastMonthRange.date_to),
              selectedEmployeeId,
            );
            break;

          case "last_3_months":
            const last3MonthsRange = getLastNMonthsDateRange(3);
            setFilterDateFrom(dayjs(last3MonthsRange.date_from));
            setFilterDateTo(dayjs(last3MonthsRange.date_to));
            fetchWithFilters(
              dayjs(last3MonthsRange.date_from),
              dayjs(last3MonthsRange.date_to),
              selectedEmployeeId,
            );
            break;

          case "last_6_months":
            const last6MonthsRange = getLastNMonthsDateRange(6);
            setFilterDateFrom(dayjs(last6MonthsRange.date_from));
            setFilterDateTo(dayjs(last6MonthsRange.date_to));
            fetchWithFilters(
              dayjs(last6MonthsRange.date_from),
              dayjs(last6MonthsRange.date_to),
              selectedEmployeeId,
            );
            break;
        }
        return;
      } catch (error) {
        console.error("Error fetching time-based data:", error);
      }
    }

    // Handle regular grouping (non-time-based)
    const grouped = groupDataByField(data, value);
    setGroupedData(grouped);

    // Expand first group by default
    if (grouped.length > 0) {
      setExpandedGroups(new Set([grouped[0].groupName]));
    }
  };

  // Handle employee selection
  // const handleEmployeeChange = (employeeId: string) => {
  //   setSelectedEmployeeId(employeeId);

  //   // Reset grouping when employee changes
  //   if (groupBy !== "none") {
  //     setGroupBy("none");
  //     setGroupedData([]);
  //     setExpandedGroups(new Set());
  //   }

  //   // Fetch attendance for selected employee
  //   fetchAttendanceWithEmployee(employeeId);
  // };

  const handleEmployeeChange = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    if (groupBy !== "none") {
      setGroupBy("none");
      setGroupedData([]);
      setExpandedGroups(new Set());
    }
    // Pass current date filters when switching employee
    fetchWithFilters(filterDateFrom, filterDateTo, employeeId);
  };

  // Render grouped table
  const renderGroupedTable = () => {
    if (groupBy === "none") {
      return <DatatableKHR data={data} columns={columns} selection={false} />;
    }

    return (
      <div className="grouped-table">
        {groupedData.map((group: GroupedData, groupIndex: number) => (
          <div
            key={`group-${groupIndex}-${group.groupName}`}
            className="group-section mb-4"
            style={{
              border: "1px solid #e9ecef",
              borderRadius: "8px",
              overflow: "hidden",
            }}
          >
            {/* Group Header */}
            <div
              className="group-header bg-light p-3 border rounded cursor-pointer d-flex justify-content-between align-items-center"
              onClick={() => toggleGroupExpansion(group.groupName)}
              style={{
                cursor: "pointer",
                transition: "all 0.3s ease",
                border: "1px solid #e9ecef",
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = "#f8f9fa";
              }}
            >
              <div className="d-flex align-items-center">
                <i
                  className={`ti ${expandedGroups.has(group.groupName) ? "ti-chevron-down" : "ti-chevron-right"} me-2`}
                ></i>
                <h6 className="mb-0 fw-bold">{group.groupName}</h6>
                <span className="badge badge-primary ms-2">
                  {group.count} records
                </span>
              </div>
              <div className="group-stats">
                <div className="d-flex gap-3">
                  <small className="text-muted">
                    <i className="ti ti-users me-1"></i>
                    Total: <strong>{group.count}</strong>
                  </small>
                  <small className="text-success">
                    <i className="ti ti-check me-1"></i>
                    Present:{" "}
                    <strong>
                      {
                        group.items.filter(
                          (item: AttendanceAdminData) =>
                            item.Status === "Present",
                        ).length
                      }
                    </strong>
                  </small>
                  <small className="text-danger">
                    <i className="ti ti-x me-1"></i>
                    Absent:{" "}
                    <strong>
                      {
                        group.items.filter(
                          (item: AttendanceAdminData) =>
                            item.Status === "Absent",
                        ).length
                      }
                    </strong>
                  </small>
                  <small className="text-warning">
                    <i className="ti ti-clock me-1"></i>
                    Late:{" "}
                    <strong>
                      {
                        group.items.filter(
                          (item: AttendanceAdminData) => item.Late === "Yes",
                        ).length
                      }
                    </strong>
                  </small>
                </div>
              </div>
            </div>

            {/* Group Content */}
            {expandedGroups.has(group.groupName) && (
              <div
                className="group-content mt-2"
                style={{ borderTop: "1px solid #e9ecef" }}
              >
                <DatatableKHR
                  data={group.items}
                  columns={columns}
                  selection={false}
                />
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  // Get today's date and 7 days ago for default export range
  const getDefaultDateRange = () => {
    const today = new Date();
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);

    const formatDate = (date: Date) => date.toISOString().split("T")[0];
    return {
      dateFrom: formatDate(weekAgo),
      dateTo: formatDate(today),
    };
  };

  const getExportPayload = (): AttendanceExportPayload | null => {
    if (!exportDateFrom || !exportDateTo) {
      toast.error("Please select both Start Date and End Date.");
      return null;
    }
    const payload: AttendanceExportPayload = {
      start_date: exportDateFrom.format("YYYY-MM-DD"),
      end_date: exportDateTo.format("YYYY-MM-DD"),
    };

    if (exportBranchId) payload.branch_id = exportBranchId;
    if (exportScheduleId) payload.resource_calendar_id = exportScheduleId;
    if (exportManagerId) payload.reporting_manager_id = exportManagerId;
    if (exportDepartmentId) payload.department_client_id = exportDepartmentId;

    return payload;
  };

  const handleExportExcel = async () => {
    if (!exportDateFrom || !exportDateTo) {
      toast.error("Please select both Start Date and End Date.");
      return;
    }
    setIsExporting(true);
    try {
      await exportAttendanceToExcel(
        exportDateFrom.format("YYYY-MM-DD"),
        exportDateTo.format("YYYY-MM-DD"),
        exportBranchId,
        exportDepartmentId,
      );
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportPdf = async () => {
    if (!exportDateFrom || !exportDateTo) {
      toast.error("Please select both Start Date and End Date.");
      return;
    }
    setIsExporting(true);
    try {
      await exportAttendanceToPdf(
        exportDateFrom.format("YYYY-MM-DD"),
        exportDateTo.format("YYYY-MM-DD"),
        exportBranchId,
        exportDepartmentId,
      );
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAbsentPresentExportExcel = async () => {
    const payload = getExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportAbsentPresentReportToExcel(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleAbsentPresentExportPdf = async () => {
    const payload = getExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportAbsentPresentReportToPdf(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Helper to build ReportExportPayload from shared filter state
  const getReportExportPayload = (): ReportExportPayload | null => {
    if (!exportDateFrom || !exportDateTo) {
      toast.error("Please select both Start Date and End Date.");
      return null;
    }
    const payload: ReportExportPayload = {
      date_from: exportDateFrom.format("YYYY-MM-DD"),
      date_to: exportDateTo.format("YYYY-MM-DD"),
    };
    if (exportBranchId) payload.branch_id = exportBranchId;
    if (exportDepartmentId) payload.department_id = exportDepartmentId;
    if (exportManagerId) payload.reporting_manager_id = exportManagerId;
    if (exportScheduleId) payload.resource_calendar_id = exportScheduleId;
    return payload;
  };

  // Late Login Report
  const handleLateReportExcel = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportLateReportExcel(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleLateReportPdf = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportLateReportPdf(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Missed Punch Report
  const handleMissedPunchExcel = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportMissedPunchExcel(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleMissedPunchPdf = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportMissedPunchPdf(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Attendance Regularization Report
  const handleRegularizationExcel = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportRegularizationExcel(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  const handleRegularizationPdf = async () => {
    const payload = getReportExportPayload();
    if (!payload) return;
    setIsExporting(true);
    try {
      await exportRegularizationPdf(payload);
    } catch (error: any) {
      toast.error(error?.message || "Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  // Export visible/filtered data to Excel
  const handleExportVisibleExcel = async () => {
    const visibleData = getVisibleExportData();
    if (visibleData.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    try {
      const ExcelJS = (await import("exceljs")).default;
      const { saveAs } = await import("file-saver");

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet("Attendance");

      worksheet.columns = [
        { header: "Employee", key: "Employee", width: 25 },
        { header: "Role", key: "Role", width: 20 },
        { header: "Date", key: "Date", width: 15 },
        { header: "Status", key: "Status", width: 12 },
        { header: "Check In", key: "CheckIn", width: 12 },
        { header: "Check Out", key: "CheckOut", width: 12 },
        { header: "Late", key: "Late", width: 12 },
        { header: "Production Hours", key: "ProductionHours", width: 18 },
        { header: "Reporting Manager", key: "ReportingManager", width: 22 },
        { header: "Working Schedule", key: "WorkingSchedule", width: 22 },
        { header: "Branch", key: "Branch", width: 30 },
      ];

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, color: { argb: "FFFFFFFF" } };
      headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF4472C4" } };
      headerRow.alignment = { horizontal: "center" };

      visibleData.forEach((item) => {
        worksheet.addRow(item);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
      saveAs(blob, `Attendance_Export_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("Excel exported successfully!");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel.");
    }
  };

  // Export visible/filtered data to PDF (direct download, no print)
  const handleExportVisiblePdf = async () => {
    const visibleData = getVisibleExportData();
    if (visibleData.length === 0) {
      toast.error("No data available to export.");
      return;
    }

    try {
      const { default: jsPDF } = await import("jspdf");
      const { default: autoTable } = await import("jspdf-autotable");

      const doc = new jsPDF({ orientation: "landscape" });

      // Title
      doc.setFontSize(16);
      doc.setTextColor(51, 51, 51);
      doc.text("Attendance Report", 14, 15);

      // Subtitle
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const subtitle = `Generated: ${new Date().toLocaleString()} | Records: ${visibleData.length}${groupBy !== "none" ? ` | Grouped by: ${groupByOptions.find(o => o.value === groupBy)?.label}` : ""}`;
      doc.text(subtitle, 14, 22);

      // Table
      const headers = [["Employee", "Role", "Date", "Status", "Check In", "Check Out", "Late", "Prod. Hours"]];
      const rows = visibleData.map((item) => [
        item.Employee,
        item.Role,
        item.Date,
        item.Status,
        item.CheckIn,
        item.CheckOut,
        item.Late,
        item.ProductionHours,
      ]);

      autoTable(doc, {
        head: headers,
        body: rows,
        startY: 28,
        styles: { fontSize: 9, cellPadding: 3 },
        headStyles: { fillColor: [68, 114, 196], textColor: 255, fontStyle: "bold" },
        alternateRowStyles: { fillColor: [245, 245, 245] },
      });

      doc.save(`Attendance_Export_${new Date().toISOString().split("T")[0]}.pdf`);
      toast.success("PDF exported successfully!");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF.");
    }
  };

  // Get the currently visible data (respects grouping and employee filter)
  const getVisibleExportData = (): AttendanceAdminData[] => {
    if (groupBy !== "none" && groupedData.length > 0) {
      // Return all items from all groups (flattened)
      return groupedData.flatMap((group) => group.items);
    }
    return data;
  };

  const formatTime = (dateTime: string | false) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime.replace(" ", "T"));
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const formatDate = (dateTime: string | false) => {
    if (!dateTime) return "-";
    const date = new Date(dateTime.replace(" ", "T"));
    return date.toLocaleDateString([], {
      year: "numeric",
      month: "short",
      day: "2-digit",
    });
  };

  const [loading, setLoading] = useState<boolean>(true);
  const [selectedAttendance, setSelectedAttendance] =
    useState<EmployeeAttendance | null>(null);

  // Define EmployeeAttendance type if not imported
  type EmployeeAttendance = {
    id: string;
    key: string;
    Employee_Name: string;
    Attendance_Date: string;
    Created_Date: string;
    Status: string;
  };

  // 1. Fetch & Map Data
  // const fetchData = async () => {
  //   setLoading(true);
  //   try {
  //     const response: any = await getAdminAttendance();

  //     console.log(response, "dddddffff");

  //     // Safety Check: Backend might return { data: [...] } or just [...]
  //     const rawArray = Array.isArray(response)
  //       ? response
  //       : response?.data && Array.isArray(response.data)
  //         ? response.data
  //         : [];

  //     // const mappedData: AttendanceAdminData[] = rawArray.map((item: any) => ({
  //     //   Employee: Array.isArray(item.employee_id) ? item.employee_id[1] : "Employee",
  //     //   Image: item.employee?.avatar || "avatar-1.jpg",
  //     //   Role: item.job_name || "Employee",
  //     //   Status: item.check_in ? "Present" : "Absent",
  //     //   CheckIn: formatTime(item.check_in),
  //     //   CheckOut: formatTime(item.check_out),
  //     //   Break: item.break_time_display || "-",
  //     //   Late: item.is_late_in ? "Yes" : "No",
  //     //   ProductionHours:
  //     //     typeof item.worked_hours === "number"
  //     //       ? item.worked_hours.toFixed(2)
  //     //       : item.worked_hours
  //     //         ? String(item.worked_hours)
  //     //         : "0",
  //     // }));

  //     const mappedData: AttendanceAdminData[] = rawArray.map((item: any) => {
  //       const isPresent = !!item.check_in;

  //       return {
  //         id: item.id,
  //         Employee: Array.isArray(item.employee_id)
  //           ? item.employee_id[1]
  //           : "Employee",

  //         // Image: item.employee?.avatar || "avatar-1.jpg",

  //         Role: item.job_name || "Employee",
  //         Break: item.break_hours || "-",

  //         Status: isPresent ? "Present" : "Absent",

  //         CheckIn: isPresent ? formatTime(item.check_in) : "-",

  //         CheckOut: isPresent ? formatTime(item.check_out) : "-",

  //         Break: isPresent ? item.break_time_display || "-" : "-",

  //         Late: isPresent ? (item.late_time_display ? item.late_time_display : "-") : "-",

  //         ProductionHours: isPresent
  //           ? typeof item.worked_hours === "number"
  //             ? item.worked_hours.toFixed(2)
  //             : item.worked_hours
  //               ? String(item.worked_hours)
  //               : "0"
  //           : "0",
  //       };
  //     });

  //     setData(mappedData);

  //     const meta = response?.meta;

  //     if (meta) {
  //       const cards: AttendanceCard[] = [
  //         {
  //           id: 1,
  //           title: "Total Employees",
  //           count: meta.TotalEmployee ?? 0,
  //           badgeType: "info",
  //           icon: "ti-users",
  //           percentage: "",
  //         },
  //         {
  //           id: 2,
  //           title: "Present Today",
  //           count: meta.Presentemployee ?? 0,
  //           badgeType: "success",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 3,
  //           title: "Absent Today",
  //           count: meta.TodayAbsetEmployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 4,
  //           title: "Late Login",
  //           count: meta.TotalLateemployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 5,
  //           title: "Ununiformed",
  //           count: meta.Ununiformendemployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //       ];

  //       setAttendanceCards(cards);
  //     }
  //   } catch (error) {
  //     console.error("Failed to load employee attendance", error);
  //     toast.error("Failed to load employee attendance list");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // useEffect(() => {
  //   if (isAttendancesGetApi) {
  //     const mappedData: AttendanceAdminData[] =
  //       AttendancesGetApiData?.data?.map((item: any) => {
  //         const isPresent = !!item.check_in;

  //         return {
  //           id: item.id,
  //           Employee: Array.isArray(item.employee_id)
  //             ? item.employee_id[1]
  //             : "Employee",

  //           // Image: item.employee?.avatar || "avatar-1.jpg",

  //           Role: item.job_name || "Employee",

  //           Status: isPresent ? "Present" : "Absent",

  //           Date: formatDate(item.check_in),

  //           CheckIn: isPresent ? formatTime(item.check_in) : "-",

  //           CheckOut: isPresent ? formatTime(item.check_out) : "-",

  //           Break: isPresent ? item.break_time_display || "-" : "-",

  //           Late: isPresent
  //             ? item.late_time_display
  //               ? item.late_time_display
  //               : "-"
  //             : "-",

  //           ProductionHours: isPresent
  //             ? typeof item.worked_hours === "number"
  //               ? item.worked_hours.toFixed(2)
  //               : item.worked_hours
  //                 ? String(item.worked_hours)
  //                 : "0"
  //             : "0",

  //           ReportingManager: item.reporting_manager_name || "",
  //           WorkingSchedule: item.working_schedule_name || "",
  //           Branch: item.branch_name || "",
  //         };
  //       });
  //     // console.log(mappedData, "mappeee");

  //     setData(mappedData);

  //     const meta = AttendancesGetApiData?.meta;

  //     if (meta) {
  //       const cards: AttendanceCard[] = [
  //         {
  //           id: 1,
  //           title: "Total Employees",
  //           count: meta.TotalEmployee ?? 0,
  //           badgeType: "info",
  //           icon: "ti-users",
  //           percentage: "",
  //         },
  //         {
  //           id: 2,
  //           title: "Present Today",
  //           count: meta.Presentemployee ?? 0,
  //           badgeType: "success",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 3,
  //           title: "Absent Today",
  //           count: meta.TodayAbsetEmployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 4,
  //           title: "Late Login",
  //           count: meta.TotalLateemployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //         {
  //           id: 5,
  //           title: "Uninformed",
  //           count: meta.Ununiformendemployee ?? 0,
  //           badgeType: "danger",
  //           icon: "ti-arrow-wave-right-down",
  //           percentage: "",
  //         },
  //       ];

  //       setAttendanceCards(cards);
  //     }

  //     dispatch(updateState({ isAttendancesGetApi: false }));
  //   }
  // }, [isAttendancesGetApi, isAttendancesGetApiFetching]);

  // useEffect(() => {
  //   if (isAttendancesGetApi) {
  //     const rawArray = AttendancesGetApiData?.data ?? [];
  //     const absentEmployees: any[] = AttendancesGetApiData?.meta?.absent_employees ?? [];

  //     // Map today's attendance records (present + no check-in)
  //     const mappedPresent: AttendanceAdminData[] = rawArray.map((item: any) => {
  //       const isPresent = !!item.check_in;
  //       return {
  //         id: item.id,
  //         Employee: Array.isArray(item.employee_id) ? item.employee_id[1] : "Employee",
  //         Role: item.job_name || "Employee",
  //         Status: isPresent ? "Present" : "Absent",
  //         Date: isPresent ? formatDate(item.check_in) : "-",
  //         CheckIn: isPresent ? formatTime(item.check_in) : "-",
  //         CheckOut: isPresent ? formatTime(item.check_out) : "-",
  //         Break: isPresent ? item.break_time_display || "-" : "-",
  //         Late: isPresent ? (item.late_time_display ? item.late_time_display : "-") : "-",
  //         ProductionHours: isPresent
  //           ? typeof item.worked_hours === "number"
  //             ? item.worked_hours.toFixed(2)
  //             : item.worked_hours ? String(item.worked_hours) : "0"
  //           : "0",
  //         ReportingManager: item.reporting_manager_name || "",
  //         WorkingSchedule: item.working_schedule_name || "",
  //         Branch: item.branch_name || "",
  //         Department: item.department_name || "",
  //       };
  //     });

  //     // Map absent records from meta â€” these are historical absent entries
  //     const mappedAbsent: AttendanceAdminData[] = absentEmployees.map((item: any) => ({
  //       id: null,
  //       Employee: item.name || "Unknown",
  //       Role: item.job_name || "Employee",
  //       Status: "Absent",
  //       Date: item.date ? new Date(item.date).toLocaleDateString([], {
  //         year: "numeric", month: "short", day: "2-digit",
  //       }) : "-",
  //       CheckIn: "-",
  //       CheckOut: "-",
  //       Break: "-",
  //       Late: "-",
  //       ProductionHours: "0",
  //       ReportingManager: "",
  //       WorkingSchedule: "",
  //       Branch: "",
  //       Department: item.department_name || "",
  //     }));

  //     // Merge: avoid duplicating today's absent (already in rawArray as id:null rows)
  //     // Keep mappedPresent as source of truth for today; add historical absents only
  //     const todayStr = new Date().toISOString().split("T")[0];
  //     const filteredAbsent = mappedAbsent.filter((a) => {
  //       // Convert back from "Jun 03, 2026" â†’ "2026-06-03" for comparison
  //       const parsed = new Date(a.Date);
  //       const dateStr = isNaN(parsed.getTime()) ? "" : parsed.toISOString().split("T")[0];
  //       return dateStr !== todayStr;
  //     });

  //     setData([...mappedPresent, ...filteredAbsent]);

  //     // ... rest of your cards code (unchanged)
  //     const meta = AttendancesGetApiData?.meta;
  //     if (meta) {
  //       const cards: AttendanceCard[] = [
  //         { id: 1, title: "Total Employees", count: meta.TotalEmployee ?? 0, badgeType: "info", icon: "ti-users", percentage: "" },
  //         { id: 2, title: "Present Today", count: meta.Presentemployee ?? 0, badgeType: "success", icon: "ti-arrow-wave-right-down", percentage: "" },
  //         { id: 3, title: "Absent Today", count: meta.TodayAbsetEmployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
  //         { id: 4, title: "Late Login", count: meta.TotalLateemployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
  //         { id: 5, title: "Uninformed", count: meta.Ununiformendemployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
  //       ];
  //       setAttendanceCards(cards);
  //     }

  //     dispatch(updateState({ isAttendancesGetApi: false }));
  //   }
  // }, [isAttendancesGetApi, isAttendancesGetApiFetching]);


  useEffect(() => {
    if (isAttendancesGetApi) {
      const rawArray = AttendancesGetApiData?.data ?? [];
      const absentEmployees: any[] = AttendancesGetApiData?.meta?.absent_employees ?? [];

      // Map today's attendance records (present + today's absent)
      const mappedPresent: AttendanceAdminData[] = rawArray.map((item: any) => {
        const isPresent = !!item.check_in;
        return {
          id: item.id,
          Image: "",
          Employee: Array.isArray(item.employee_id) ? item.employee_id[1] : "Employee",
          Role: item.job_name || "Employee",
          Status: isPresent ? "Present" : "Absent",
          Date: isPresent
            ? formatDate(item.check_in)
            : new Date().toLocaleDateString([], { year: "numeric", month: "short", day: "2-digit" }),
          CheckIn: isPresent ? formatTime(item.check_in) : "-",
          CheckOut: isPresent ? formatTime(item.check_out) : "-",
          Break: isPresent ? item.break_time_display || "-" : "-",
          Late: isPresent ? (item.late_time_display ? item.late_time_display : "-") : "-",
          ProductionHours: isPresent
            ? typeof item.worked_hours === "number"
              ? item.worked_hours.toFixed(2)
              : item.worked_hours ? String(item.worked_hours) : "0"
            : "0",
          ReportingManager: item.reporting_manager_name || "",
          WorkingSchedule: item.working_schedule_name || "",
          Branch: item.branch_name || "",
          Department: item.department_name || "",
        };
      });

      // Build a Set of "employeeId_date" keys already covered by rawArray
      // rawArray always represents today's records, so use today's date for all
      const todayStr = new Date().toISOString().split("T")[0];
      const coveredKeys = new Set<string>(
        rawArray.map((item: any) => {
          const empId = Array.isArray(item.employee_id)
            ? item.employee_id[0]
            : item.employee_id;
          return `${empId}_${todayStr}`;
        })
      );

      // Map absent records from meta (historical absent entries)
      const mappedAbsent: AttendanceAdminData[] = absentEmployees
        .filter((absentRaw: any) => {
          // Skip if this employee+date combo is already in rawArray (today's data)
          const key = `${absentRaw.id}_${absentRaw.date}`;
          return !coveredKeys.has(key);
        })
        .map((item: any) => ({
          id: null,
          Image: "",
          Employee: item.name || "Unknown",
          Role: item.job_name || "Employee",
          Status: "Absent",
          Date: item.date
            ? new Date(item.date).toLocaleDateString([], {
              year: "numeric",
              month: "short",
              day: "2-digit",
            })
            : "-",
          CheckIn: "-",
          CheckOut: "-",
          Break: "-",
          Late: "-",
          ProductionHours: "0",
          ReportingManager: "",
          WorkingSchedule: "",
          Branch: "",
          Department: item.department_name || "",
        }));

      // Merge: today's records first, then historical absents
      setData([...mappedPresent, ...mappedAbsent]);

      // Update attendance summary cards
      const meta = AttendancesGetApiData?.meta;
      if (meta) {
        const cards: AttendanceCard[] = [
          { id: 1, title: "Total Employees", count: meta.TotalEmployee ?? 0, badgeType: "info", icon: "ti-users", percentage: "" },
          { id: 2, title: "Present Today", count: meta.Presentemployee ?? 0, badgeType: "success", icon: "ti-arrow-wave-right-down", percentage: "" },
          { id: 3, title: "Absent Today", count: meta.TodayAbsetEmployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
          { id: 4, title: "Late Login", count: meta.TotalLateemployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
          { id: 5, title: "Uninformed", count: meta.Ununiformendemployee ?? 0, badgeType: "danger", icon: "ti-arrow-wave-right-down", percentage: "" },
        ];
        setAttendanceCards(cards);
      }

      dispatch(updateState({ isAttendancesGetApi: false }));
    }
  }, [isAttendancesGetApi, isAttendancesGetApiFetching]);

  useEffect(() => {
    setExportDateFrom(filterDateFrom);
    setExportDateTo(filterDateTo);
  }, [filterDateFrom, filterDateTo]);

  // Update grouped data when main data changes
  useEffect(() => {
    if (data.length > 0 && groupBy !== "none") {
      const grouped = groupDataByField(data, groupBy);
      setGroupedData(grouped);

      // Expand first group by default
      if (grouped.length > 0) {
        setExpandedGroups(new Set([grouped[0].groupName]));
      }
    }
  }, [data, groupBy]);

  // Fetch employees on component mount
  useEffect(() => {
    fetchEmployees();
    getBranches().then(setBranches).catch(() => { });
    getDepartments().then(setDepartments).catch(() => { });
    getWorkingSchedules().then(setWorkingSchedules).catch(() => { });
    getReportingManagers().then(setReportingManagers).catch(() => { });
  }, []);

  // Handle employee data loading
  useEffect(() => {
    if (isGetEmployeesBasicInfo) {
      // console.log("Employees loaded:", getEmployeesBasicInfoData);
      dispatch(updateState({ isGetEmployeesBasicInfo: false }));
    }
  }, [isGetEmployeesBasicInfo, getEmployeesBasicInfoData, dispatch]);

  useEffect(() => {
    // fetchData();
    if (isApiAuth) {
      fetchWithFilters(filterDateFrom, filterDateTo);
      dispatch(updateState({ isApiAuth: false }));
      // dispatch(AttendancesGetApi({}) as any);
      // dispatch(updateState({ isApiAuth: false }));
    }
  }, [dispatch, isApiAuth]);

  // Close export dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (
        exportDropdownRef.current &&
        !exportDropdownRef.current.contains(e.target as Node)
      ) {
        setIsExportOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    // fetchData();
    dispatch(ApiAuth());
  }, [dispatch]);
  const columns = [
    {
      title: "Employee",
      dataIndex: "Employee",
      render: (_text: string, record: AttendanceAdminData) => (
        <div className="d-flex align-items-center file-name-icon">
          <div className="ms-2">
            <h6 className="fw-medium">{record.Employee}</h6>
            <span className="fs-12 fw-normal ">{record.Role}</span>
          </div>
        </div>
      ),
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.Employee.length - b.Employee.length,
    },
    {
      title: "Date",
      dataIndex: "Date",
      defaultSortOrder: "descend",
      render: (text: string) => (
        <span className="fw-medium text-dark">{text}</span>
      ),
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        dayjs(a.Date).unix() - dayjs(b.Date).unix(),
    },
    {
      title: "Status",
      dataIndex: "Status",
      render: (text: string, record: AttendanceAdminData) => (
        <span
          className={`badge ${text === "Present"
            ? "badge-success-transparent"
            : "badge-danger-transparent"
            } d-inline-flex align-items-center`}
        >
          <i className="ti ti-point-filled me-1" />
          {record.Status}
        </span>
      ),
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.Status.length - b.Status.length,
    },
    {
      title: "Check In",
      dataIndex: "CheckIn",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.CheckIn.length - b.CheckIn.length,
    },
    {
      title: "Check Out",
      dataIndex: "CheckOut",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.CheckOut.length - b.CheckOut.length,
    },
    // {
    //   title: "Break",
    //   dataIndex: "Break",
    //   sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
    //     a.Break.length - b.Break.length,
    // },
    {
      title: "Late",
      dataIndex: "Late",
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.Late.length - b.Late.length,
    },
    {
      title: "Production Hours",
      dataIndex: "ProductionHours",
      render: (_text: string, record: AttendanceAdminData) => (
        <span
          className={`badge d-inline-flex align-items-center badge-sm ${parseFloat(record.ProductionHours) < 8
            ? "badge-danger"
            : parseFloat(record.ProductionHours) >= 8 &&
              parseFloat(record.ProductionHours) <= 9
              ? "badge-success"
              : "badge-info"
            }`}
        >
          <i className="ti ti-clock-hour-11 me-1"></i>
          {record.ProductionHours}
        </span>
      ),
      sorter: (a: AttendanceAdminData, b: AttendanceAdminData) =>
        a.ProductionHours.length - b.ProductionHours.length,
    },
    {
      title: "Actions",
      dataIndex: "actions",
      render: (_: any, record: AttendanceAdminData) => {
        const canEdit = record.Status === "Present" && record.id;

        if (!canEdit) return null;

        return (
          <div className="action-icon d-inline-flex">
            <button
              type="button"
              className="me-2"
              data-bs-toggle="modal"
              data-bs-target="#edit_attendance"
              aria-label="Edit attendance"
              onClick={() => {
                setSelectedAttendanceeEditModal(record);
              }}
            >
              <i className="ti ti-edit" />
            </button>
          </div>
        );
      },
    },
  ];

  return (
    <>
      {/* Page Wrapper */}

      {/* /Page Wrapper */}

      <div className="page-wrapper">
        <div className="content">
          <div onClick={() => setSelectedAttendance(null)}>
            <CommonHeader
              title="Admin Attendance"
              parentMenu="Employee"
              activeMenu="Admin Attendance"
              routes={routes}
              rightActions={
                <>
                  {/* Employee Selector */}
                  <div className="dropdown me-2">
                    <button
                      className="btn btn-outline-secondary dropdown-toggle d-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-user me-1" />
                      {selectedEmployeeId
                        ? employees.find(
                          (emp) => emp.id.toString() === selectedEmployeeId,
                        )?.name || "Select Employee"
                        : "All Employees"}
                    </button>
                    <ul
                      className="dropdown-menu dropdown-menu-end"
                      style={{ maxHeight: "300px", overflowY: "auto" }}
                    >
                      <li>
                        <button
                          className={`dropdown-item ${selectedEmployeeId === "" ? "active" : ""}`}
                          onClick={() => handleEmployeeChange("")}
                        // style={{ display: "flex", alignItems: "center" }}
                        >
                          <i className="ti ti-users me-2" />
                          All Employees
                        </button>
                      </li>
                      <li>
                        <hr className="dropdown-divider" />
                      </li>
                      {isGetEmployeesBasicInfoFetching ? (
                        <li className="dropdown-item-text">
                          <div className="d-flex align-items-center">
                            <div
                              className="spinner-border spinner-border-sm me-2"
                              role="status"
                            ></div>
                            Loading employees...
                          </div>
                        </li>
                      ) : employees.length === 0 ? (
                        <li className="dropdown-item-text text-muted">
                          <i className="ti ti-info-circle me-2" />
                          No employees found
                        </li>
                      ) : (
                        employees.map((employee) => (
                          <li key={employee.id}>
                            <button
                              className={`dropdown-item ${selectedEmployeeId === employee.id.toString() ? "active" : ""}`}
                              onClick={() =>
                                handleEmployeeChange(employee.id.toString())
                              }
                              style={{ display: "flex", alignItems: "center" }}
                            >
                              <i className="ti ti-user me-2" />
                              <div>
                                <div>{employee.name}</div>
                                {employee.designation && (
                                  <small className="text-muted">
                                    {employee.designation}
                                  </small>
                                )}
                              </div>
                            </button>
                          </li>
                        ))
                      )}
                    </ul>
                  </div>

                  {/* Group By Dropdown */}
                  <div className="dropdown me-2">
                    <button
                      className="btn btn-outline-primary dropdown-toggle d-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-layout-grid me-1" />
                      {groupByOptions.find((opt) => opt.value === groupBy)
                        ?.label || "Group By"}
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      {groupByOptions.map((option) => (
                        <li key={option.value}>
                          <button
                            className={`dropdown-item ${groupBy === option.value ? "active" : ""}`}
                            onClick={() => handleGroupByChange(option.value)}
                          >
                            <i
                              className={`ti ${groupBy === option.value ? "ti-check" : "ti-point"} me-2`}
                            />
                            {option.label}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* <div className="d-flex border bg-white rounded p-1">
                    <Link
                      // to={all_routes.attendanceemployee}
                      className="btn btn-icon btn-sm me-1"
                    >
                      <i className="ti ti-brand-days-counter" />
                    </Link>
                    <Link
                      // to={all_routes.attendanceadmin}
                      className="btn btn-icon btn-sm active bg-primary text-white"
                    >
                      <i className="ti ti-calendar-event" />
                    </Link>
                  </div> */}

                  {/* Export Visible Data */}
                  <div className="dropdown me-2">
                    <button
                      className="btn btn-outline-dark dropdown-toggle d-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-file-export me-1" />
                      Export
                    </button>
                    <ul className="dropdown-menu dropdown-menu-end">
                      <li>
                        <button className="dropdown-item" onClick={handleExportVisibleExcel}>
                          <i className="ti ti-file-type-xls me-2 text-success" />
                          Download Excel
                        </button>
                      </li>
                      <li>
                        <button className="dropdown-item" onClick={handleExportVisiblePdf}>
                          <i className="ti ti-file-type-pdf me-2 text-danger" />
                          Download PDF
                        </button>
                      </li>
                    </ul>
                  </div>

                </>
              }
            />
            {/* Date Filter Bar */}
            <div className="card border-0 mb-0">
              {/* <div className="card-body py-2">
                <div className="d-flex align-items-center gap-3 flex-wrap">
                  <span className="fw-semibold text-muted d-flex align-items-center">
                    <i className="ti ti-filter me-1" />
                    Filter by Date:
                  </span>

                  <div className="d-flex align-items-center gap-2">
                    <label className="text-muted mb-0 small">From</label>
                    <DatePicker
                      value={filterDateFrom}
                      onChange={(val) => setFilterDateFrom(val)}
                      format="DD/MM/YYYY"
                      placeholder="Start date"
                      allowClear
                      style={{ width: 140 }}
                      getPopupContainer={() => document.body}
                    />
                  </div>

                  <div className="d-flex align-items-center gap-2">
                    <label className="text-muted mb-0 small">To</label>
                    <DatePicker
                      value={filterDateTo}
                      onChange={(val) => setFilterDateTo(val)}
                      format="DD/MM/YYYY"
                      placeholder="End date"
                      allowClear
                      disabledDate={(current) =>
                        filterDateFrom ? current.isBefore(filterDateFrom, "day") : false
                      }
                      style={{ width: 140 }}
                      getPopupContainer={() => document.body}
                    />
                  </div>

                  <button
                    className="btn btn-primary btn-sm d-flex align-items-center"
                    onClick={() => fetchWithFilters(filterDateFrom, filterDateTo, selectedEmployeeId)}
                    disabled={isAttendancesGetApiFetching}
                  >
                    <i className="ti ti-search me-1" />
                    Apply
                  </button>

                  <button
                    className="btn btn-outline-secondary btn-sm d-flex align-items-center"
                    onClick={() => {
                      const defaultFrom = dayjs().startOf("month");
                      const defaultTo = dayjs();
                      setFilterDateFrom(defaultFrom);
                      setFilterDateTo(defaultTo);
                      fetchWithFilters(defaultFrom, defaultTo, selectedEmployeeId);
                    }}
                  >
                    <i className="ti ti-refresh me-1" />
                    Reset
                  </button>

                  {(filterDateFrom || filterDateTo) && (
                    <span className="badge badge-info-transparent d-flex align-items-center gap-1">
                      <i className="ti ti-calendar me-1" />
                      {filterDateFrom?.format("DD MMM YYYY")} to {" "}
                      {filterDateTo?.format("DD MMM YYYY")}
                      {selectedEmployeeId && (
                        <span className="ms-1">
                          Â· {employees.find((e) => e.id.toString() === selectedEmployeeId)?.name}
                        </span>
                      )}
                    </span>
                  )}
                </div>
              </div> */}
            </div>
          </div>
          <div className="card border-0">
            <div className="card-body">
              <div className="row align-items-center mb-4">
                <div className="col-md-5">
                  <div className="mb-3 mb-md-0">
                    <h4 className="mb-1">
                      Attendance Details
                      {selectedEmployeeId ? (
                        <span className="text-primary">
                          -{" "}
                          {
                            employees.find(
                              (emp) => emp.id.toString() === selectedEmployeeId,
                            )?.name
                          }
                        </span>
                      ) : (
                        " Today"
                      )}
                    </h4>
                    <p>
                      {selectedEmployeeId
                        ? `Individual employee attendance data`
                        : `Team Attendance Overview`}
                    </p>
                  </div>
                </div>
                {/* <div className="col-md-7">
                  <div className="d-flex align-items-center justify-content-md-end">
                    <h6>
                      {selectedEmployeeId
                        ? "Employee Status"
                        : "Total Absenties today"}
                    </h6>
                    {!selectedEmployeeId && (
                      <div className="avatar-list-stacked avatar-group-sm ms-4">
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-02.jpg"
                            alt="avatar"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-03.jpg"
                            alt="avatar"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-05.jpg"
                            alt="avatar"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-06.jpg"
                            alt="avatar"
                          />
                        </span>
                        <span className="avatar avatar-rounded">
                          <ImageWithBasePath
                            className="border border-white"
                            src="assets/img/profiles/avatar-07.jpg"
                            alt="avatar"
                          />
                        </span>
                        <Link
                          className="avatar bg-primary avatar-rounded text-fixed-white fs-12"
                          // to="#"
                        >
                          +1
                        </Link>
                      </div>
                    )}
                  </div>
                </div> */}
              </div>
              <div className="border rounded">
                <div className="row flex-fill">
                  <CommonAttendanceStatus cards={attendanceCards} />
                </div>
              </div>
            </div>
          </div>{" "}
          {isAttendancesGetApiFetching ? (
            <div className="text-center p-5">
              <div className="spinner-border text-primary" role="status"></div>
              <div className="mt-2  ">Loading All Employees Attendence...</div>
            </div>
          ) : (
            <>
              {/* Group By Info */}
              {groupBy !== "none" && (
                <div className="alert alert-info my-3 mb-2 d-flex justify-content-between align-items-center">
                  <div>
                    <i className="ti ti-info-circle me-2"></i>
                    <strong>Grouped by:</strong>{" "}
                    {groupByOptions.find((opt) => opt.value === groupBy)?.label}
                    <span className="ms-2">
                      ({groupedData.length} groups, {data.length} total records)
                    </span>
                    {selectedEmployeeId && (
                      <span className="ms-2 badge badge-secondary">
                        <i className="ti ti-user me-1"></i>
                        Employee:{" "}
                        {
                          employees.find(
                            (emp) => emp.id.toString() === selectedEmployeeId,
                          )?.name
                        }
                      </span>
                    )}
                    {["last_month", "last_3_months", "last_6_months"].includes(
                      groupBy,
                    ) && (
                        <span className="ms-2 badge badge-info">
                          <i className="ti ti-calendar me-1"></i>
                          {groupBy === "last_month" && "Previous Month Only"}
                          {groupBy === "last_3_months" && "Previous 3 Months"}
                          {groupBy === "last_6_months" && "Previous 6 Months"}
                        </span>
                      )}
                  </div>
                  <div className="btn-group btn-group-sm">
                    <button
                      className="btn btn-outline-primary btn-sm"
                      onClick={() => toggleAllGroups(true)}
                      title="Expand All Groups"
                    >
                      <i className="ti ti-chevrons-down me-1"></i>
                      Expand All
                    </button>
                    <button
                      className="btn btn-outline-secondary btn-sm"
                      onClick={() => toggleAllGroups(false)}
                      title="Collapse All Groups"
                    >
                      <i className="ti ti-chevrons-up me-1"></i>
                      Collapse All
                    </button>
                  </div>
                </div>
              )}

              {/* Render Table or Grouped Table */}
              <div className="">{renderGroupedTable()}</div>
            </>
          )}
        </div>
      </div>

      <div className="modal fade" id="attendance_reports_modal" tabIndex={-1}>
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-0 pb-0">
              <div>
                <span className="badge badge-primary-transparent mb-2">
                  Attendance Reports
                </span>
                <h4 className="modal-title mb-1">Export Attendance Reports</h4>
                <p className="text-muted mb-0">
                  Choose filters and download the desired report.
                </p>
              </div>
              <button
                type="button"
                className="btn-close custom-btn-close"
                data-bs-dismiss="modal"
                aria-label="Close"
              >
                <i className="ti ti-x" />
              </button>
            </div>
            <div className="modal-body">
              <div className="row g-3">
                <div className="col-md-6">
                  <label className="form-label">Start Date</label>
                  <DatePicker
                    className="form-control"
                    value={exportDateFrom}
                    onChange={(val) => setExportDateFrom(val)}
                    format="DD/MM/YYYY"
                    placeholder="Select start date"
                    getPopupContainer={() => document.body}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">End Date</label>
                  <DatePicker
                    className="form-control"
                    value={exportDateTo}
                    onChange={(val) => setExportDateTo(val)}
                    format="DD/MM/YYYY"
                    placeholder="Select end date"
                    disabledDate={(current) =>
                      exportDateFrom
                        ? current.isBefore(exportDateFrom, "day")
                        : false
                    }
                    getPopupContainer={() => document.body}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label">Branch</label>
                  <select
                    className="form-select"
                    value={exportBranchId ?? ""}
                    onChange={(e) =>
                      setExportBranchId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">All Branches</option>
                    {branches.map((branch: any) => (
                      <option key={branch.id} value={branch.id}>
                        {branch.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Department</label>
                  <select
                    className="form-select"
                    value={exportDepartmentId ?? ""}
                    onChange={(e) =>
                      setExportDepartmentId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">All Departments</option>
                    {departments.map((department: any) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Working Schedule</label>
                  <select
                    className="form-select"
                    value={exportScheduleId ?? ""}
                    onChange={(e) =>
                      setExportScheduleId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">All Working Schedules</option>
                    {workingSchedules.map((schedule: any) => (
                      <option key={schedule.id} value={schedule.id}>
                        {schedule.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="col-md-6">
                  <label className="form-label">Reporting Manager</label>
                  <select
                    className="form-select"
                    value={exportManagerId ?? ""}
                    onChange={(e) =>
                      setExportManagerId(e.target.value ? Number(e.target.value) : null)
                    }
                  >
                    <option value="">All Reporting Managers</option>
                    {reportingManagers.map((manager: any) => (
                      <option key={manager.id} value={manager.id}>
                        {manager.name || manager.employee_name || manager.display_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Report Export Buttons */}
              <hr className="my-4" />
              <div className="row g-3">
                {/* Absent/Present Report */}
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-bold mb-2">
                      <i className="ti ti-calendar-stats me-2 text-primary" />
                      Absent/Present Report
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleAbsentPresentExportPdf}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleAbsentPresentExportExcel}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {isExporting ? "..." : "Excel"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Late Login Report */}
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-bold mb-2">
                      <i className="ti ti-clock-exclamation me-2 text-warning" />
                      Late Login Report
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleLateReportPdf}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleLateReportExcel}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {isExporting ? "..." : "Excel"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Missed Punch Report */}
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-bold mb-2">
                      <i className="ti ti-fingerprint-off me-2 text-danger" />
                      Missed Punch Report
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleMissedPunchPdf}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleMissedPunchExcel}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {isExporting ? "..." : "Excel"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Attendance Regularization Report */}
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-bold mb-2">
                      <i className="ti ti-adjustments-check me-2 text-info" />
                      Attendance Regularization
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleRegularizationPdf}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleRegularizationExcel}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {isExporting ? "..." : "Excel"}
                      </button>
                    </div>
                  </div>
                </div>

                {/* Check-in/Checkout Report */}
                <div className="col-md-6">
                  <div className="border rounded p-3">
                    <h6 className="fw-bold mb-2">
                      <i className="ti ti-login me-2 text-success" />
                      Check-in/Checkout Report
                    </h6>
                    <div className="d-flex gap-2">
                      <button
                        type="button"
                        className="btn btn-outline-danger btn-sm"
                        onClick={handleExportPdf}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-pdf me-1" />
                        {isExporting ? "..." : "PDF"}
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline-success btn-sm"
                        onClick={handleExportExcel}
                        disabled={isExporting}
                      >
                        <i className="ti ti-file-type-xls me-1" />
                        {isExporting ? "..." : "Excel"}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer border-0 pt-0">
              <button
                type="button"
                className="btn btn-light"
                data-bs-dismiss="modal"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Modal Component */}
      {/* <AddDepartmentModal onSuccess={fetchData} data={selectedDepartment} /> */}

      {selectedAttendanceeEditModal && (
        <EditAttendanceModal
          attendance={selectedAttendanceeEditModal}
          onClose={() => setSelectedAttendanceeEditModal(null)}
          onSuccess={() => {
            setSelectedAttendanceeEditModal(null);
            // fetchData();
          }}
        />
      )}
    </>
  );
};

export default AdminAttandanceKHR;

