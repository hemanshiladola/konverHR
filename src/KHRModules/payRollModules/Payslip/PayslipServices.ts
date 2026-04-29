import Instance from "../../../api/axiosInstance";

const getUserId = () => localStorage.getItem("user_id") || "3318";

export interface Payslip {
  id: number;
  name: string;
  employee_id: any;
  date_from: string;
  date_to: string;
  employee_code: string;
  status: string;
}

export const getPayslipRuns = async () => {
  const response = await Instance.get("/api/payslip-runs", {
    params: { user_id: getUserId() },
  });
  return response.data.data || [];
};

// --- PAYSLIP ACTIONS ---
export const getPayslips = async () => {
  const response = await Instance.get("/api/hr/payslips/client", {
    params: { user_id: getUserId() },
  });
  return response.data.data || [];
};

export const createPayslip = async (payload: any) => {
  return await Instance.post(
    `api/create_and_genrate_payslip?user_id=${getUserId()}`,
    payload,
  );
};

export const computePayslip = async (id: number) => {
  return await Instance.post(
    `api/compute_payslip/${id}?user_id=${getUserId()}`,
  );
};

export const confirmPayslip = async (id: number) => {
  return await Instance.post(
    `api/confirm/payslip/${id}?user_id=${getUserId()}`,
  );
};

export const markPaidPayslip = async (id: number) => {
  return await Instance.post(
    `api/mark-paid/payslip/${id}?user_id=${getUserId()}`,
  );
};

export const generateBulkPayroll = async (payload: any) => {
  return await Instance.post(
    `api/generate_payslip_batch?user_id=${getUserId()}`,
    payload
  );
};

export const downloadPayslip = async (id: number) => {
  return await Instance.get(
    `api/download_payslip/${id}?user_id=${getUserId()}`,
    { responseType: "blob" }
  );
};
