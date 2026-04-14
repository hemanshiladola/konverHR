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
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    attachment: "",
    fileName: "",
  });

  const resetForm = () => {
    setFormData({ name: "", description: "", attachment: "", fileName: "" });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  useEffect(() => {
    const modalElement = document.getElementById("add_ticket_modal");
    const handleHidden = () => {
      if (!data) resetForm();
    };
    modalElement?.addEventListener("hidden.bs.modal", handleHidden);
    return () =>
      modalElement?.removeEventListener("hidden.bs.modal", handleHidden);
  }, [data]);

  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        description: data.description || "",
        attachment: "",
        fileName: "",
      });
    } else {
      resetForm();
    }
  }, [data]);

  const processFile = (file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("File size should be less than 5MB");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const pureBase64 = base64String.includes(",")
        ? base64String.split(",")[1]
        : base64String;
      setFormData((prev) => ({
        ...prev,
        attachment: pureBase64,
        fileName: file.name,
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const onDragLeave = () => setIsDragging(false);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error("Please enter a ticket subject");
      return;
    }

    setLoading(true);
    try {
      const response = await createTicketApi(formData as any);
      if (response.status === "success" || response.id) {
        toast.success("Ticket created successfully!");
        onSuccess();
        const successEvent = new CustomEvent("ticketCreatedSuccess");
        document.dispatchEvent(successEvent);
        document.getElementById("close-ticket-modal")?.click();
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
          className="modal-content border-0 shadow-lg"
          style={{ borderRadius: "15px" }}
        >
          <div className="modal-header border-bottom-0 pt-4 px-4">
            <h4 className="modal-title fw-bold text-dark d-flex align-items-center">
              <span
                className="bg-primary-transparent me-2 rounded-3 d-flex align-items-center justify-content-center"
                style={{ width: "35px", height: "35px" }}
              >
                <i className="ti ti-headset text-primary fs-18"></i>
              </span>
              {data ? "Edit Ticket" : "Create New Ticket"}
            </h4>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              id="close-ticket-modal"
            ></button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body px-4 pb-4">
              <div className="row g-4">
                {/* Left Side: Inputs */}
                <div className="col-lg-7">
                  <div className="mb-3">
                    <label className="form-label fw-bold text-muted small">
                      Ticket Subject <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control form-control-lg fs-14 border-light-gray"
                      placeholder="e.g. Payroll discrepancy in March"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                    />
                  </div>

                  <div className="mb-0">
                    <label className="form-label fw-bold text-muted small">
                      Issue Description
                    </label>
                    <textarea
                      className="form-control fs-14 border-light-gray"
                      rows={6}
                      placeholder="Please provide as much detail as possible..."
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      style={{ resize: "none", borderRadius: "10px" }}
                    ></textarea>
                  </div>
                </div>

                {/* Right Side: Dropbox & Info */}
                <div className="col-lg-5 border-start-lg">
                  <label className="form-label fw-bold text-muted small">
                    Supporting Documents
                  </label>

                  <div
                    className={`dropbox-area ${isDragging ? "dragging" : ""} ${formData.attachment ? "has-file" : ""}`}
                    onDragOver={onDragOver}
                    onDragLeave={onDragLeave}
                    onDrop={onDrop}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input
                      type="file"
                      ref={fileInputRef}
                      className="d-none"
                      accept="image/*,.pdf"
                      onChange={handleFileChange}
                    />

                    <div className="text-center py-4">
                      {formData.attachment ? (
                        <>
                          <i className="ti ti-file-check text-success display-6"></i>
                          <p className="mt-2 mb-0 fw-bold text-dark small text-truncate px-2">
                            {formData.fileName}
                          </p>
                          <span className="text-primary x-small cursor-pointer">
                            Change file
                          </span>
                        </>
                      ) : (
                        <>
                          <i className="ti ti-cloud-upload text-primary display-6 opacity-50"></i>
                          <p className="mt-2 mb-1 fw-bold text-dark small">
                            Click or drag to upload
                          </p>
                          <p className="x-small text-muted mb-0">
                            PDF or Images (Max 5MB)
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="mt-4 p-3 rounded-4 bg-light border border-dashed">
                    <div className="d-flex align-items-start">
                      <i className="ti ti-info-circle-filled text-primary me-2 mt-1"></i>
                      <div>
                        <p className="mb-1 fw-bold text-dark small">
                          Response Time
                        </p>
                        <p
                          className="mb-0 text-muted"
                          style={{ fontSize: "11px", lineHeight: "1.4" }}
                        >
                          Our support team typically reviews and responds to
                          tickets within <strong>24 business hours</strong>.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="modal-footer border-top-0 px-4 pb-4 pt-0 justify-content-end gap-2">
              <button
                type="button"
                className="btn btn-white btn-lg fs-14 fw-bold px-4 border"
                data-bs-dismiss="modal"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary btn-lg fs-14 fw-bold px-5 shadow-sm"
                disabled={loading}
              >
                {loading ? (
                  <>
                    <span className="spinner-border spinner-border-sm me-2"></span>
                    Processing...
                  </>
                ) : (
                  "Submit Ticket"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>

      <style>{`
        .bg-primary-transparent { background-color: rgba(13, 110, 253, 0.1); }
        .border-light-gray { border: 1px solid #e9ecef; }
        .fs-18 { font-size: 18px; }
        .x-small { font-size: 11px; }
        
        .dropbox-area {
          border: 2px dashed #e9ecef;
          border-radius: 12px;
          cursor: pointer;
          transition: all 0.2s ease;
          background: #fdfdfd;
        }
        .dropbox-area:hover, .dropbox-area.dragging {
          border-color: #0d6efd;
          background-color: rgba(13, 110, 253, 0.02);
        }
        .dropbox-area.has-file {
          border-style: solid;
          border-color: #48bb78;
          background-color: rgba(72, 187, 120, 0.02);
        }
        
        @media (min-width: 992px) {
          .border-start-lg { border-left: 1px solid #f1f1f1 !important; }
        }
      `}</style>
    </div>,
    document.body,
  );
};

export default AddHelpDeskTickitsModal;

// /* eslint-disable @typescript-eslint/no-unused-vars */
// import React, { useState, useEffect, useRef } from "react";
// import { createPortal } from "react-dom";
// import { toast } from "react-toastify";
// import { createTicketApi, Ticket } from "./HelpDeskTickitsKHRServices";

// interface ModalProps {
//   onSuccess: () => void;
//   data?: any;
// }

// const AddHelpDeskTickitsModal = ({ onSuccess, data }: ModalProps) => {
//   const [loading, setLoading] = useState(false);
//   const fileInputRef = useRef<HTMLInputElement>(null); // Ref to clear the file input field

//   const [formData, setFormData] = useState({
//     name: "",
//     description: "",
//     attachment: "",
//   });

//   // Function to reset form to empty state
//   const resetForm = () => {
//     setFormData({ name: "", description: "", attachment: "" });
//     if (fileInputRef.current) fileInputRef.current.value = ""; // Clear the actual file input
//   };

//   // Handle Bootstrap's "hidden" event to clear form whenever modal closes
//   useEffect(() => {
//     const modalElement = document.getElementById("add_ticket_modal");

//     const handleHidden = () => {
//       if (!data) {
//         // Only reset if we aren't in "edit mode"
//         resetForm();
//       }
//     };

//     modalElement?.addEventListener("hidden.bs.modal", handleHidden);
//     return () => {
//       modalElement?.removeEventListener("hidden.bs.modal", handleHidden);
//     };
//   }, [data]);

//   useEffect(() => {
//     if (data) {
//       setFormData({
//         name: data.name || "",
//         description: data.description || "",
//         attachment: "",
//       });
//     } else {
//       resetForm();
//     }
//   }, [data]);

//   const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         const base64String = reader.result as string;
//         const pureBase64 = base64String.includes(",")
//           ? base64String.split(",")[1]
//           : base64String;
//         setFormData((prev) => ({ ...prev, attachment: pureBase64 }));
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     if (!formData.name.trim()) {
//       toast.error("Please enter a ticket subject");
//       return;
//     }

//     setLoading(true);
//     try {
//       const response = await createTicketApi(formData as Ticket);
//       if (response.status === "success" || response.id) {
//         toast.success("Ticket created successfully!");
//         onSuccess();
//         const closeBtn = document.getElementById("close-ticket-modal");
//         closeBtn?.click();
//         // resetForm() is now handled by the useEffect listener above
//       } else {
//         toast.error(response.message || "Failed to create ticket");
//       }
//     } catch (error: any) {
//       toast.error("Server error occurred");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return createPortal(
//     <div
//       className="modal fade"
//       id="add_ticket_modal"
//       tabIndex={-1}
//       aria-hidden="true"
//     >
//       <div className="modal-dialog modal-dialog-centered modal-lg">
//         <div
//           className="modal-content border-0"
//           style={{ borderRadius: "12px" }}
//         >
//           <div className="modal-header bg-light border-0 py-3">
//             <h5 className="modal-title fw-bold d-flex align-items-center">
//               <i className="ti ti-ticket me-2 text-primary fs-20"></i>
//               Add Help Desk Ticket
//             </h5>
//             <button
//               type="button"
//               className="btn-close"
//               data-bs-dismiss="modal"
//               id="close-ticket-modal"
//             ></button>
//           </div>

//           <form onSubmit={handleSubmit}>
//             <div className="modal-body p-4">
//               <div className="row">
//                 <div className="col-lg-8 border-end">
//                   <div className="mb-3">
//                     <label className="form-label fw-bold small text-muted">
//                       TICKET SUBJECT <span className="text-danger">*</span>
//                     </label>
//                     <input
//                       type="text"
//                       className="form-control"
//                       placeholder="e.g. Leave balance not updating"
//                       value={formData.name}
//                       onChange={(e) =>
//                         setFormData({ ...formData, name: e.target.value })
//                       }
//                     />
//                   </div>
//                   <div className="mb-0">
//                     <label className="form-label fw-bold small text-muted">
//                       ISSUE DESCRIPTION
//                     </label>
//                     <textarea
//                       className="form-control"
//                       rows={5}
//                       placeholder="Describe the issue in detail..."
//                       value={formData.description}
//                       onChange={(e) =>
//                         setFormData({
//                           ...formData,
//                           description: e.target.value,
//                         })
//                       }
//                       style={{ resize: "none" }}
//                     ></textarea>
//                   </div>
//                 </div>

//                 <div className="col-lg-4">
//                   <div className="mb-3">
//                     <label className="form-label fw-bold small text-muted">
//                       ATTACHMENT
//                     </label>
//                     <div className="file-upload-wrapper">
//                       <input
//                         type="file"
//                         ref={fileInputRef} // Attached ref here
//                         className="form-control form-control-sm"
//                         accept="image/*,.pdf"
//                         onChange={handleFileChange}
//                       />
//                       <div className="mt-2 text-center p-3 bg-light rounded border border-dashed">
//                         <i className="ti ti-cloud-upload fs-1 text-muted"></i>
//                         <p className="small text-muted mb-0 mt-1">
//                           Upload Screenshot
//                         </p>
//                       </div>
//                     </div>
//                   </div>

//                   {formData.attachment && (
//                     <div className="alert alert-soft-success d-flex align-items-center p-2 mt-2">
//                       <i className="ti ti-check-circle me-2"></i>
//                       <span className="small font-bold">File Attached</span>
//                     </div>
//                   )}

//                   <div className="mt-4 p-3 rounded bg-soft-warning">
//                     <p className="mb-0 small text-dark font-bold">
//                       <i className="ti ti-info-circle me-1"></i> Note:
//                     </p>
//                     <p
//                       className="mb-0 x-small text-muted mt-1"
//                       style={{ fontSize: "11px" }}
//                     >
//                       Support team usually responds within 24 hours.
//                     </p>
//                   </div>
//                 </div>
//               </div>
//             </div>

//             <div className="modal-footer gap-2 border-0 bg-light-gray">
//               <button
//                 type="button"
//                 className="btn btn-outline-secondary px-4"
//                 data-bs-dismiss="modal"
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="btn btn-primary px-4"
//                 disabled={loading}
//               >
//                 {loading ? (
//                   <>
//                     <span className="spinner-border spinner-border-sm me-2"></span>
//                     Creating...
//                   </>
//                 ) : (
//                   <>Save Ticket</>
//                 )}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>,
//     document.body,
//   );
// };

// export default AddHelpDeskTickitsModal;
