/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import { createTicketApi, Ticket } from "./HelpDeskTickitsKHRServices";

interface ModalProps {
  onSuccess: () => void;
  data?: any;
}

const AddHelpDeskTickitsModal = ({ onSuccess, data }: ModalProps) => {
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null); // Ref to clear the file input field

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    attachment: "",
  });

  // Function to reset form to empty state
  const resetForm = () => {
    setFormData({ name: "", description: "", attachment: "" });
    if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the actual file input
  };

  // Handle Bootstrap's "hidden" event to clear form whenever modal closes
  useEffect(() => {
    const modalElement = document.getElementById("add_ticket_modal");

    const handleHidden = () => {
      if (!data) {
        // Only reset if we aren't in "edit mode"
        resetForm();
      }
    };

    modalElement?.addEventListener("hidden.bs.modal", handleHidden);
    return () => {
      modalElement?.removeEventListener("hidden.bs.modal", handleHidden);
    };
  }, [data]);

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        attachment: "",
      });
    } else {
      resetForm();
    }
  }, [data]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = reader.result as string;
        const pureBase64 = base64String.includes(",")
          ? base64String.split(",")[1]
          : base64String;
        setFormData((prev) => ({ ...prev, attachment: pureBase64 }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a ticket subject");
      return;
    }

    setLoading(true);
    try {
      const response = await createTicketApi(formData as Ticket);
      if (response.status === "success" || response.id) {
        toast.success("Ticket created successfully!");
        onSuccess();
        const closeBtn = document.getElementById("close-ticket-modal");
        closeBtn?.click();
        // resetForm() is now handled by the useEffect listener above
      } else {
        toast.error(response.message || "Failed to create ticket");
      }
    } catch (error: any) {
      toast.error("Server error occurred");
    } finally {
      setLoading(false);
    }
  };

  return createPortal(
    <div
      className="modal fade"
      id="add_ticket_modal"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div
          className="modal-content border-0"
          style={{ borderRadius: "12px" }}
        >
          <div className="modal-header bg-light border-0 py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="ti ti-ticket me-2 text-primary fs-20"></i>
              Add Help Desk Ticket
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              id="close-ticket-modal"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body p-4">
              <div className="row">
                <div className="col-lg-8 border-end">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">
                      TICKET SUBJECT <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="e.g. Leave balance not updating"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>
                  <div className="mb-0">
                    <label className="form-label fw-bold small text-muted">
                      ISSUE DESCRIPTION
                    </label>
                    <textarea
                      className="form-control"
                      rows={5}
                      placeholder="Describe the issue in detail..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      style={{ resize: "none" }}
                    ></textarea>
                  </div>
                </div>

                <div className="col-lg-4">
                  <div className="mb-3">
                    <label className="form-label fw-bold small text-muted">
                      ATTACHMENT
                    </label>
                    <div className="file-upload-wrapper">
                      <input
                        type="file"
                        ref={fileInputRef} // Attached ref here
                        className="form-control form-control-sm"
                        accept="image/*,.pdf"
                        onChange={handleFileChange}
                      />
                      <div className="mt-2 text-center p-3 bg-light rounded border border-dashed">
                        <i className="ti ti-cloud-upload fs-1 text-muted"></i>
                        <p className="small text-muted mb-0 mt-1">
                          Upload Screenshot
                        </p>
                      </div>
                    </div>
                  </div>

                  {formData.attachment && (
                    <div className="alert alert-soft-success d-flex align-items-center p-2 mt-2">
                      <i className="ti ti-check-circle me-2"></i>
                      <span className="small font-bold">File Attached</span>
                    </div>
                  )}

                  <div className="mt-4 p-3 rounded bg-soft-warning">
                    <p className="mb-0 small text-dark font-bold">
                      <i className="ti ti-info-circle me-1"></i> Note:
                    </p>
                    <p
                      className="mb-0 x-small text-muted mt-1"
                      style={{ fontSize: "11px" }}
                    >
                      Support team usually responds within 24 hours.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer gap-2 border-0 bg-light-gray">
              <button
                type="button"
                className="btn btn-outline-secondary px-4"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-4"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Creating...
                  </>
                ) : (
                  <>Save Ticket</>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddHelpDeskTickitsModal;
