import Instance from "@/api/axiosInstance";

export const getDepartmentRangeCount = async () => {
  try {
    const userId = localStorage.getItem("user_id");
    const response = await Instance.get(
      `/api/employee/department_employee_count`,
      {
        params: { user_id: userId },
      },
    );
    return response.data;
  } catch (error) {
    console.error("Error fetching department range count:", error);
    return null;
  }
};

export const getEmployeeTypePercentage = async () => {
  try {
    const userId = localStorage.getItem("user_id");
    const response = await Instance.get(`/api/employee/type_percentage`, {
      params: { user_id: userId },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching employee type percentage:", error);
    return null;
  }
};

export const getAttendancePercentage = async (userId: string) => {
  try {
    const response = await Instance.get(`/api/employee/attendance_percentage`, {
      params: { user_id: userId },
    });

    return response.data;
  } catch (error) {
    console.error("Error fetching attendance percentage:", error);
    return null;
  }
};

export const getCheckInData = async (userId: string) => {
  try {
    const response = await Instance.get(
      `/api/employee/attendance_logs_department`,
      {
        params: { user_id: userId },
      },
    );

    return response.data;
  } catch (error: any) {
    console.error("Error fetching attendance logs:", error);
    // Return the error response data if available (e.g. { status: "error", message: "..." })
    return error?.response?.data || { status: "error", message: error?.message || "Failed to load attendance logs" };
  }
};
