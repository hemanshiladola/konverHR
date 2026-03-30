import Instance from "../../../api/axiosInstance";

const getUserId = () => {
  const id = localStorage.getItem("user_id");
  return id ? Number(id) : 2;
};

/**
 * GET: Fetch all documents/attachments for the logged-in employee
 * URL: http://localhost:9090/api/employee/documents?user_id=2
 */
export const getMyDocumentsApi = async () => {
  try {
    const response = await Instance.get("/api/get_employee_attachments", {
      params: { user_id: getUserId() },
    });
    // Returning the structured object provided in your example
    return response.data;
  } catch (error) {
    console.error("Error fetching my documents:", error);
    return { status: "error", attachments: [] };
  }
};
