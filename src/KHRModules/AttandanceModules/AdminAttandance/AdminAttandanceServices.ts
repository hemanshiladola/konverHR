import CONFIG from "@/Config";
import Instance from "../../../api/axiosInstance";
import axios from "axios";

// Admin Attendance API response
export interface APIAdminAttendance {
  id: number;
  check_in: string;
  check_out: string | false;
  worked_hours: number;
  early_out_minutes: number;
  overtime_hours: number;
  is_early_out: boolean;
  validated_overtime_hours: number;
  is_late_in: boolean;
  late_time_display: string;
  status_code: boolean;
}

interface UpdateAttendancePayload {
  check_in: string | null;
  check_out: string | null;
  late_minutes: number;
  production_hours: number;
}

export interface AttendanceExportPayload {
  start_date: string;
  end_date: string;
  branch_id?: number;
  resource_calendar_id?: number;
  reporting_manager_id?: number;
  department_client_id?: number;
}

// Helper to get auth details
const getAuthDetails = () => {
  const user_id = localStorage.getItem("user_id");
  const unique_user_id = localStorage.getItem("unique_user_id");

  return {
    user_id: user_id ? Number(user_id) : null,
    unique_user_id,
  };
};

// GET - http://192.168.11.150:4000/api/admin/attendances?user_id=219
export const getAdminAttendance = async (): Promise<APIAdminAttendance[]> => {
  try {
    const { user_id } = getAuthDetails();

    const response = await Instance.get("/api/admin/attendances", {
      params: { user_id },
    });

    return response.data || response.data || [];
  } catch (error) {
    console.error("Admin Attendance Fetch Error:", error);
    return [];
  }
};

export const updateAdminAttendance = async (
  attendanceId: number,
  payload: UpdateAttendancePayload,
) => {
  try {
    const response = await Instance.put(
      `/api/admin/updateattendances/${attendanceId}`,
      payload,
    );

    return response.data;
  } catch (error) {
    console.error("Update Attendance Error:", error);
    throw error;
  }
};

// Helper to decode a Base64 string and trigger a browser file download
const downloadBase64File = (
  base64String: string,
  fileName: string,
  mimeType: string,
) => {
  const pureBase64 = base64String.replace(/\s/g, "");
  const byteCharacters = atob(pureBase64);
  const byteNumbers = new Array(byteCharacters.length);
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  const byteArray = new Uint8Array(byteNumbers);
  const blob = new Blob([byteArray], { type: mimeType });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

const getDownloadUrl = (attachmentUrl: string) => {
  if (/^https?:\/\//i.test(attachmentUrl)) return attachmentUrl;

  const baseURL = Instance.defaults.baseURL || window.location.origin;
  return new URL(attachmentUrl, baseURL).toString();
};

const openAttachmentDownload = (attachmentUrl: string) => {
  const link = document.createElement("a");
  link.href = getDownloadUrl(attachmentUrl);
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

// Old attendance export to Excel: /api/export/attendance/excel
export const exportAttendanceToExcel = async (
  dateFrom: string,
  dateTo: string,
  branchId?: number | null,
  departmentId?: number | null,
): Promise<any> => {
  try {
    const { user_id } = getAuthDetails();
    const token = localStorage.getItem("authToken");

    const params: any = {
      user_id,
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (branchId) params.branch_id = branchId;
    if (departmentId) params.department_id = departmentId;

    const response = await axios.get(
      `${CONFIG.BASE_URL_ALL}/api/export/attendance/excel`,
      {
        params,
        headers: { Authorization: token || "" },
      },
    );

    const result = response.data;

    if (result.status === "success" && result.data) {
      const { file, filename } = result.data;

      if (file && filename) {
        downloadBase64File(
          file,
          filename,
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        );
      }
    }

    return result;
  } catch (error) {
    console.error("Export Attendance Error:", error);
    throw error;
  }
};

// Old attendance export to PDF: /api/export/attendance/pdf
export const exportAttendanceToPdf = async (
  dateFrom: string,
  dateTo: string,
  branchId?: number | null,
  departmentId?: number | null,
): Promise<any> => {
  try {
    const { user_id } = getAuthDetails();
    const token = localStorage.getItem("authToken");

    const params: any = {
      user_id,
      date_from: dateFrom,
      date_to: dateTo,
    };
    if (branchId) params.branch_id = branchId;
    if (departmentId) params.department_id = departmentId;

    const response = await axios.get(
      `${CONFIG.BASE_URL_ALL}/api/export/attendance/pdf`,
      {
        params,
        headers: { Authorization: token || "" },
      },
    );

    const result = response.data;

    if (
      (result.success === true || result.status === "success") &&
      result.data
    ) {
      const fileBase64 = result.data.file_base64 || result.data.file;
      const fileName =
        result.data.file_name || result.data.filename || "Attendance.pdf";

      if (fileBase64 && fileName) {
        downloadBase64File(fileBase64, fileName, "application/pdf");
      }
    }

    return result;
  } catch (error) {
    console.error("Export PDF Error:", error);
    throw error;
  }
};

// New Absent/Present report export to Excel: /api/attendance/export
export const exportAbsentPresentReportToExcel = async (
  payload: AttendanceExportPayload,
): Promise<any> => {
  try {
    const { user_id } = getAuthDetails();
    const response = await Instance.post("/api/attendance/export", payload, {
      params: { user_id },
    });

    const result = response.data;
    const attachmentUrl = result?.data?.attachment_url;
    if (result?.status === "success" && attachmentUrl) {
      openAttachmentDownload(attachmentUrl);
    }

    return result;
  } catch (error) {
    console.error("Absent/Present Excel Export Error:", error);
    throw error;
  }
};

// New Absent/Present report export to PDF: /api/attendance/export/pdf
export const exportAbsentPresentReportToPdf = async (
  payload: AttendanceExportPayload,
): Promise<any> => {
  try {
    const { user_id } = getAuthDetails();
    const response = await Instance.post("/api/attendance/export/pdf", payload, {
      params: { user_id },
    });

    const result = response.data;
    const attachmentUrl = result?.data?.attachment_url;
    if (result?.status === "success" && attachmentUrl) {
      openAttachmentDownload(attachmentUrl);
    }

    return result;
  } catch (error) {
    console.error("Absent/Present PDF Export Error:", error);
    throw error;
  }
};
