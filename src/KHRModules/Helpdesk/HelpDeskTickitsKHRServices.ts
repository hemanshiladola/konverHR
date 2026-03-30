import Instance from "@/api/axiosInstance";

/**
 * Interface representing the Ticket data from your API response
 */

export interface Ticket {
  name: string;
  description: string;
  attachment: string;
  // Make these optional with '?' so the Modal doesn't complain
  id?: number | string;
  stage?: string;
  create_date?: string;
  created_by?: number;
}

const getUserId = () => localStorage.getItem("user_id") || "3314";

/**
 * GET - Helpdesk Ticket List
 * Based on: https://konverthr.fact-byte.com//api/get_ticket?user_id=3315
 */
export const getTickets = async () => {
  // Get user_id from localStorage (matching your BankAccount service logic)
  const user_id = getUserId();

  try {
    const response = await Instance.get("/api/get_ticket", {
      params: { user_id: Number(user_id) },
    });

    // Per your sample JSON: response.data.status is "success" and data is in response.data.data
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching KAVACH tickets:", error);
    throw error;
  }
};

export const createTicketApi = async (payload: Ticket) => {
  const user_id = getUserId();
  // Using the exact URL structure from your requirement
  const response = await Instance.post(
    `/api/create_ticket?user_id=${user_id}`,
    payload,
  );
  return response.data;
};
