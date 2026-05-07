import React from "react";
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

      const handleSuccessNavigation = () => {
        navigate(routes.ticketKHR);

        // Cleanup the custom listener
        document.removeEventListener(
          "ticketCreatedSuccess",
          handleSuccessNavigation,
        );
      };

      // 3. Define the navigation logic
      // const handleCloseAndNavigate = () => {
      //   // We only navigate once the modal is hidden
      //   // This works because your AddHelpDeskTickitsModal calls closeBtn.click() on success
      //   navigate(routes.ticketKHR);

      //   // Cleanup the listener
      //   modalElement.removeEventListener(
      //     "hidden.bs.modal",
      //     handleCloseAndNavigate,
      //   );
      // };

      // // Add the listener for when the modal closes
      // modalElement.addEventListener("hidden.bs.modal", handleCloseAndNavigate);
      document.addEventListener(
        "ticketCreatedSuccess",
        handleSuccessNavigation,
      );
    } else {
      // If the modal isn't found in the DOM, show a warning instead of navigating away instantly
      toast.error("Support Modal not found. Please refresh the page.");
    }
  };

  return (
    <div
      style={{
        position: "fixed",
        right: "30px",
        bottom: 0,
        zIndex: 999999
      }}
    >
      <motion.button
        whileHover={{ y: -5 }}
        whileTap={{ scale: 0.9 }}
        onClick={handleTriggerPortal}
        className="btn shadow d-flex align-items-center"
        style={{
          backgroundColor: "#fe6137",
          border: "none",
          borderTopLeftRadius: "15px",
          borderTopRightRadius: "15px",
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
          padding: "8px 20px",
          cursor: "pointer",
        }}
        title="Open Helpdesk"
      >
        <i className="ti ti-headset text-white me-2" style={{ fontSize: "18px" }} />
        <span className="text-white fw-bold fs-13">Helpdesk</span>
      </motion.button>
    </div>
  );
};

export default KavachHelpdesk;
