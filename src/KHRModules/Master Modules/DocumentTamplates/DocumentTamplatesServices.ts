import Instance from "../../../api/axiosInstance";

// 1. API Interface (Matching your Odoo/Backend response)
export interface APIDocumentTemplate {
  id: number;
  name: string;
  document_type: string;
  html_content: string;
  write_date?: string;
  create_date?: string;
}

// Helper to get user_id from localStorage
const getUserId = () => {
  const id = localStorage.getItem("user_id");
  return id ? Number(id) : 2; // Default to 2 as per your example
};

// 2. SERVICE FUNCTIONS

export const getDocumentTemplates = async (): Promise<
  APIDocumentTemplate[]
> => {
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

export const createDocumentTemplate = async (data: {
  name: string;
  document_type: string;
  html_content: string;
}) => {
  const payload = {
    user_id: getUserId(),
    ...data,
  };
  return await Instance.post("/api/document-template/create", payload, {
    params: { user_id: getUserId() },
  });
};

export const updateDocumentTemplate = async (
  id: number,
  data: {
    name: string;
    document_type: string;
    html_content: string;
  },
) => {
  const payload = {
    ...data,
    user_id: getUserId(),
  };
  return await Instance.put(`/api/document-template/update/${id}`, payload, {
    params: { user_id: getUserId() },
  });
};

export const deleteDocumentTemplate = async (id: number) => {
  return await Instance.delete(`/api/document-template/delete/${id}`, {
    params: { user_id: getUserId() },
  });
};
