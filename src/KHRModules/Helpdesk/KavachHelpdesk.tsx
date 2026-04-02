import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";

const KavachHelpdesk = () => {
  const navigate = useNavigate();
  const routes = all_routes;

  const handleTriggerPortal = () => {
    // 1. Find the modal by ID
    const modalElement = document.getElementById("add_ticket_modal");

    if (modalElement) {
      // 2. Open the modal using Bootstrap
      const modalInstance = (window as any).bootstrap.Modal.getOrCreateInstance(
        modalElement,
      );
      modalInstance.show();

      // 3. Define the navigation logic
      const handleCloseAndNavigate = () => {
        // We only navigate once the modal is hidden
        // This works because your AddHelpDeskTickitsModal calls closeBtn.click() on success
        navigate(routes.ticketKHR);

        // Cleanup the listener
        modalElement.removeEventListener(
          "hidden.bs.modal",
          handleCloseAndNavigate,
        );
      };

      // Add the listener for when the modal closes
      modalElement.addEventListener("hidden.bs.modal", handleCloseAndNavigate);
    } else {
      // If the modal isn't found in the DOM, show a warning instead of navigating away instantly
      toast.error("Support Modal not found. Please refresh the page.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: "70px",
        right: "30px",
        zIndex: 999999,
      }}
    >
      <motion.button
        whileHover={{ scale: 1.1, y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleTriggerPortal}
        style={{
          width: "60px",
          height: "60px",
          backgroundColor: "#fe6137",
          border: "none",
          borderRadius: "20px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
          boxShadow: "0 10px 25px rgba(254, 97, 55, 0.4)",
        }}
      >
        <i className="ti ti-headset text-white" style={{ fontSize: "28px" }} />
      </motion.button>
    </div>
  );
};

export default KavachHelpdesk;
