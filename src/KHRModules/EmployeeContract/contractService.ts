import CONFIG from "@/Config";
import Service from "@/Service";
import axios from "axios";

const { user_id } = Service.getAuthDetails();

export interface Contract {
  contract_id?: number;
  id?: string;
  name: string;
  employee_code: string;
  employee?: [number, string];
  employee_id: number;
  job_id: number;
  date_start: string;
  date_end: string;
  work_entry_source: string;
  resource_calendar_id: number;
  structure_type_id: number;
  department_id: number;
  contract_type_id: number;
  wage_type: string;
  schedule_pay: string;
  wage: number;
  components?: { name?: string; structure_head_id?: number | null; amount: number; addition?: boolean; deduction?: boolean; base_component_id?: number; percentage?: number; is_pf_esic_base?: boolean; is_pf_base?: boolean; is_esic_base?: boolean; is_adding_in_pf?: boolean; is_adding_in_esic?: boolean }[];
  leave_allocations?: LeaveAllocationEntry[];
  leave_allocation_ids?: LeaveAllocationPayloadEntry[];
}

export interface LeaveAllocationEntry {
  id?: number | null;
  holiday_status_id: number;
  allocation_type: string;
  accrual_plan_id: number | false; // Use 'false' instead of 'boolean'
  date_from: string;
  date_to: string | false; // Use 'false' instead of 'boolean'
  number_of_days: number;
  description: string;
}

export interface LeaveAllocationPayloadEntry {
  id?: number | null;
  employee_id: number;
  holiday_status_id: number;
  date_start: string;
  end_date: string | false;
  number_of_days: number;
  allocation_type: string;
  accrual_plan_id?: number | false;
  description?: string;
  delete?: boolean;
}

export interface Employee {
  id: number;
  name: string;
  employee_code: string;
  email: string;
  department?: string;
  department_id: number; // 🔥 Added
  job_id: number; // 🔥 Added
  resource_calendar_id: number; // 🔥 Added
  joinning_date: string; // 🔥 Added (Note: spelling matches your API response)
}

export interface WorkingSchedule {
  id: number;
  name: string;
  flexible_hours?: boolean;
  is_night_shift?: boolean;
  hours_per_day?: number;
  tz?: string;
  // Any other fields you might need later
}
export interface Department {
  id: number;
  name: string;
  manager?: {
    name: string;
  };
}

// Get all contracts
export const getContracts = async (): Promise<Contract[]> => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/employee/contracts`,
      params: { user_id },
    });

    return response.data?.data || response.data || [];
  } catch (error: any) {
    console.error("Error fetching contracts:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch contracts",
    );
  }
};

// Add these to contractService.ts

export const getLeaveConfigurations = async () => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/leave_configuration`,
      params: { user_id },
    });
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error fetching leave configurations:", error);
    return [];
  }
};

export const getStructureHeaders = async () => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/get/headers`,
      params: { user_id },
    });
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error fetching structure headers:", error);
    return [];
  }
};

export const getLeavePreview = async (payload: {
  employee_id: number;
  leave_configuration_id: number;
  contract_start: string;
}) => {
  try {
    const response = await axios({
      method: "POST", // Usually POST when sending a body like the one provided
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/leave/configuration/preview`,
      params: { user_id },
      data: payload,
    });
    return response.data?.data || response.data || [];
  } catch (error) {
    console.error("Error fetching leave preview:", error);
    return [];
  }
};

// Create new contract
export const createContract = async (
  contractData: Omit<Contract, "id">,
): Promise<Contract> => {
  try {
    const response = await axios({
      method: "POST",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/employee/contracts`,
      params: { user_id },
      data: contractData,
    });

    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Error creating contract:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to create contract",
    );
  }
};

// Update contract
export const updateContract = async (
  id: string,
  contractData: Partial<Contract>,
): Promise<Contract> => {
  try {
    const response = await axios({
      method: "PUT",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/employee/contracts/${id}`,
      params: { user_id },
      data: contractData,
    });

    return response.data?.data || response.data;
  } catch (error: any) {
    console.error("Error updating contract:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to update contract",
    );
  }
};

// Delete contract
export const deleteContract = async (id: string): Promise<void> => {
  try {
    await axios({
      method: "DELETE",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/contracts/${id}`,
      params: { user_id },
    });
  } catch (error: any) {
    console.error("Error deleting contract:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to delete contract",
    );
  }
};

// Get employees for dropdown
export const getEmployees = async (): Promise<Employee[]> => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/employees/basic-info`,
      params: { user_id },
    });

    return response.data?.data || response.data || [];
  } catch (error: any) {
    console.error("Error fetching employees:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch employees",
    );
  }
};

// Get working schedules for dropdown
export const getWorkingSchedules = async (): Promise<WorkingSchedule[]> => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/WorkingSchedules`,
      params: { user_id },
    });

    return response.data?.data || response.data || [];
  } catch (error: any) {
    console.error("Error fetching working schedules:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch working schedules",
    );
  }
};

// Get departments for dropdown
export const getDepartments = async (): Promise<Department[]> => {
  try {
    const response = await axios({
      method: "GET",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        "Content-Type": "application/json",
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/department`,
      params: { user_id },
    });

    return response.data?.data || response.data || [];
  } catch (error: any) {
    console.error("Error fetching departments:", error);
    throw new Error(
      error?.response?.data?.message || "Failed to fetch departments",
    );
  }
};

// Add these to contractService.ts

export const startContract = async (id: number | string) => {
  try {
    const response = await axios({
      method: "PUT", // Based on the URL format provided
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/contract/start/${id}`,
      params: { user_id },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to start contract",
    );
  }
};

export const cancelContract = async (id: number | string) => {
  try {
    const response = await axios({
      method: "PUT",
      baseURL: CONFIG.BASE_URL_ALL,
      headers: {
        authorization: `${localStorage.getItem("authToken")}`,
      },
      url: `/api/contract/cancel/${id}`,
      params: { user_id },
    });
    return response.data;
  } catch (error: any) {
    throw new Error(
      error?.response?.data?.message || "Failed to cancel contract",
    );
  }
};
