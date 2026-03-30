import Instance from "../../../api/axiosInstance";

// Helper to get user_id from localStorage
const getUserId = () => {
  const id = localStorage.getItem("user_id");
  return id ? Number(id) : 2;
};

/**
 * GET: Fetch basic info of employees for selection
 */
export const getEmployeesBasicInfo = async () => {
  try {
    const response = await Instance.get("/api/employees/basic-info", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Error fetching employee info:", error);
    return [];
  }
};

/**
 * GET: Fetch existing templates from the list API
 */
export const getDocumentTemplatesList = async () => {
  try {
    const response = await Instance.get("/api/document-template/list", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Error fetching templates:", error);
    return [];
  }
};

/**
 * GET: Generate the final document (Offer Letter/Experience Letter)
 * URL: http://localhost:9090/api/generate-offer-letter?user_id=2&employee_id=16687&template_id=1&save_attachment=True
 */
export const generateDocumentApi = async (
  employeeId: number,
  templateId: number,
) => {
  try {
    const response = await Instance.get("/api/generate-offer-letter", {
      params: {
        user_id: getUserId(),
        employee_id: employeeId,
        template_id: templateId,
        save_attachment: "True",
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error generating document:", error);
    throw error;
  }
};
