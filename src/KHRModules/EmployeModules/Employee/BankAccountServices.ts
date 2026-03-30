/**
 * Interface representing the Ticket data from your API response
 */
export interface Ticket {
  id: number;
  name: string; // Ticket Subject
  description: string;
  stage: string; // e.g., "New", "In Progress", "On Hold"
  attachment: boolean;
  create_date: string;
  created_by: number;
}

/**
 * GET - Helpdesk Ticket List
 * Based on: https://konverthr.fact-byte.com//api/get_ticket?user_id=3315
 */
export const getTickets = async () => {
  // Get user_id from localStorage (matching your BankAccount service logic)
  const user_id = localStorage.getItem("user_id") || "3315";

  try {
    const response = await Instance.get("/get_ticket", {
      params: { user_id: Number(user_id) },
    });

    // Per your sample JSON: response.data.status is "success" and data is in response.data.data
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching KAVACH tickets:", error);
    throw error;
  }
};
