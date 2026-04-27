import React, { useState, useRef, useEffect } from "react";
import ReactQuill from "react-quill-new";
import "react-quill-new/dist/quill.snow.css";
import { toast } from "react-toastify";
import {
  createDocumentTemplate,
  updateDocumentTemplate,
} from "./DocumentTamplatesServices";

interface Props {
  onSuccess: () => void;
  data: any | null;
  onClose: () => void;
}

const AddEditDocumentTamplatesKHRModal: React.FC<Props> = ({
  onSuccess,
  data,
  onClose,
}) => {
  const [content, setContent] = useState("");
  const [name, setName] = useState("");
  const [type, setType] = useState("offer_letter");
  const [isSourceMode, setIsSourceMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const quillRef = useRef<ReactQuill>(null);

  const resetForm = () => {
    setContent("");
    setName("");
    setType("offer_letter");
    setIsSourceMode(false);
  };

  useEffect(() => {
    const modalElement = document.getElementById("add_template_modal");
    const handleModalHidden = () => {
      resetForm();
      onClose();
    };
    modalElement?.addEventListener("hidden.bs.modal", handleModalHidden);
    return () =>
      modalElement?.removeEventListener("hidden.bs.modal", handleModalHidden);
  }, [onClose]);

  useEffect(() => {
    if (data) {
      setContent(data.content || "");
      setName(data.name || "");
      setType(data.type || "offer_letter");
    } else {
      resetForm();
    }
  }, [data]);

  const handleSaveApi = async () => {
    if (!name.trim()) return toast.error("Template Name is required");

    setLoading(true);
    const payload = {
      name: name,
      document_type: type,
      html_content: content,
    };

    try {
      if (data?.id) {
        await updateDocumentTemplate(data.id, payload);
        toast.success("Template updated");
      } else {
        await createDocumentTemplate(payload);
        toast.success("Template created");
      }
      onSuccess();
      document.getElementById("close-btn-template")?.click();
    } catch (error) {
      toast.error("Failed to sync design");
    } finally {
      setLoading(false);
    }
  };

  const variables = [
    { label: "Current Date", value: "{{date}}" },
    { label: "Company Logo", value: "{{company_logo}}" },
    { label: "Employee Name", value: "{{name}}" },
    { label: "Address", value: "{{address}}" },
    { label: "Work Location", value: "{{location}}" },
    { label: "Work Email", value: "{{work_email}}" },
    { label: "Job Title", value: "{{job}}" },
    { label: "Department", value: "{{department}}" },
    { label: "Date of Joining", value: "{{doj}}" },
    { label: "Salary", value: "{{salary}}" },
    { label: "Company Name", value: "{{company}}" },
    { label: "Street", value: "{{street}}" },
    { label: "Street 2", value: "{{street2}}" },
    { label: "City", value: "{{city}}" },
    { label: "State", value: "{{state}}" },
    { label: "Country", value: "{{country}}" },
    { label: "Pincode", value: "{{pincode}}" },
    { label: "Probation Duration", value: "{{probation}}" },
  ];

  const injectVariable = (v: string) => {
    if (isSourceMode) {
      setContent((prev) => prev + v);
    } else {
      const editor = quillRef.current?.getEditor();
      if (editor) {
        const range = editor.getSelection();
        editor.insertText(range ? range.index : editor.getLength(), v);
      }
    }
  };

  return (
    <div className="modal fade" id="add_template_modal" role="dialog">
      <div className="modal-dialog modal-dialog-centered modal-fullscreen">
        <div className="modal-content border-0">
          <div className="modal-header border-bottom py-2">
            <h5 className="modal-title fw-bold fs-16">
              <i className="ti ti-template me-2 text-primary"></i>
              {data ? "Edit Template" : "Create Template"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              id="close-btn-template"
            ></button>
          </div>

          <div className="modal-body p-0 d-flex bg-light" style={{ overflow: "hidden" }}>
            <div className="bg-white border-end p-4 d-flex flex-column" style={{ width: "300px" }}>
              <h6 className="fs-10 fw-black text-muted text-uppercase mb-3">
                Placeholders
              </h6>
              <div
                className="d-flex flex-column gap-2 mb-4 overflow-auto"
                style={{ flexGrow: 1, paddingRight: "4px" }}
              >
                {variables.map((v) => (
                  <button
                    key={v.value}
                    className="btn btn-outline-light text-dark border d-flex justify-content-between align-items-center p-2 shadow-xs"
                    onClick={() => injectVariable(v.value)}
                  >
                    <span className="fs-12 fw-bold text-start">{v.label}</span>
                    <code className="text-primary fs-11 bg-light px-1 rounded">{v.value}</code>
                  </button>
                ))}
              </div>
              <button
                className="btn btn-dark w-100 fw-bold fs-12"
                onClick={() => setIsSourceMode(!isSourceMode)}
              >
                <i
                  className={`ti ${isSourceMode ? "ti-eye" : "ti-code"} me-2`}
                ></i>
                {isSourceMode ? "Visual View" : "Edit HTML"}
              </button>
            </div>

            <div className="flex-grow-1 p-4 overflow-auto">
              <div className="row g-3 mb-4">
                <div className="col-md-8">
                  <label className="fs-12 fw-bold text-muted">
                    Internal Name
                  </label>
                  <input
                    type="text"
                    className="form-control fw-bold"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
                <div className="col-md-4">
                  <label className="fs-12 fw-bold text-muted">Category</label>
                  <select
                    className="form-select"
                    value={type}
                    onChange={(e) => setType(e.target.value)}
                  >
                    <option value="offer_letter">Offer Letter</option>
                    <option value="exp_letter">Experience Letter</option>
                  </select>
                </div>
              </div>

              <div
                className="card border-0 shadow-sm h-100"
                style={{ minHeight: "600px" }}
              >
                {isSourceMode ? (
                  <textarea
                    className="form-control border-0 p-4 fs-13 h-100"
                    style={{
                      backgroundColor: "#1e1e1e",
                      color: "#dcdcdc",
                      fontFamily: "monospace",
                    }}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                  />
                ) : (
                  <ReactQuill
                    ref={quillRef}
                    theme="snow"
                    value={content}
                    onChange={setContent}
                    style={{ height: "550px" }}
                  />
                )}
              </div>
            </div>
          </div>

          <div className="modal-footer border-top bg-white p-3">
            <button
              type="button"
              className="btn btn-outline-secondary px-4 me-2"
              data-bs-dismiss="modal"
            >
              Discard
            </button>
            <button
              type="button"
              className="btn btn-primary px-5 shadow-sm"
              onClick={handleSaveApi}
              disabled={loading}
            >
              {loading ? (
                <span className="spinner-border spinner-border-sm me-2"></span>
              ) : null}
              Sync Design
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AddEditDocumentTamplatesKHRModal;

// import React, { useState, useRef, useEffect } from "react";
// import ReactQuill from "react-quill-new";
// import "react-quill-new/dist/quill.snow.css";

// interface Props {
//   onSuccess: () => void;
//   data: any | null;
//   onClose: () => void;
// }

// const AddEditDocumentTamplatesKHRModal: React.FC<Props> = ({
//   onSuccess,
//   data,
//   onClose,
// }) => {
//   const [content, setContent] = useState("");
//   const [name, setName] = useState("");
//   const [type, setType] = useState("offer_letter");
//   const [isSourceMode, setIsSourceMode] = useState(false);
//   const quillRef = useRef<ReactQuill>(null);

//   useEffect(() => {
//     const modalElement = document.getElementById("add_template_modal");
//     const handleModalHidden = () => {
//       resetForm();
//       onClose();
//     };
//     modalElement?.addEventListener("hidden.bs.modal", handleModalHidden);
//     return () =>
//       modalElement?.removeEventListener("hidden.bs.modal", handleModalHidden);
//   }, [onClose]);

//   useEffect(() => {
//     if (data) {
//       setContent(data.content || "");
//       setName(data.name || "");
//       setType(data.type || "offer_letter");
//     } else {
//       resetForm();
//     }
//   }, [data]);

//   const resetForm = () => {
//     setContent("");
//     setName("");
//     setType("offer_letter");
//     setIsSourceMode(false);
//   };

//   const variables = [
//     { label: "Full Name", value: "{{name}}" },
//     { label: "Designation", value: "{{job_id}}" },
//   ];

//   const injectVariable = (v: string) => {
//     if (isSourceMode) {
//       setContent((prev) => prev + v);
//     } else {
//       const editor = quillRef.current?.getEditor();
//       if (editor) {
//         const range = editor.getSelection();
//         editor.insertText(range ? range.index : editor.getLength(), v);
//       }
//     }
//   };

//   const handleSaveLocal = () => {
//     if (!name.trim()) return alert("Template Name is required");
//     const saved = localStorage.getItem("local_document_templates");
//     let list = saved ? JSON.parse(saved) : [];
//     const payload = {
//       id: data?.id || `tpl_${Date.now()}`,
//       name,
//       type,
//       content,
//     };

//     if (data?.id) list = list.map((t: any) => (t.id === data.id ? payload : t));
//     else list.push(payload);

//     localStorage.setItem("local_document_templates", JSON.stringify(list));
//     onSuccess();
//     document.getElementById("close-btn-template")?.click();
//   };

//   return (
//     <div className="modal fade" id="add_template_modal" role="dialog">
//       <div className="modal-dialog modal-dialog-centered modal-fullscreen">
//         <div className="modal-content border-0">
//           <div className="modal-header border-bottom py-2">
//             <h5 className="modal-title fw-bold fs-16">
//               <i className="ti ti-template me-2 text-primary"></i>
//               {data ? "Edit Template" : "Create Template"}
//             </h5>
//             <button
//               type="button"
//               className="btn-close"
//               data-bs-dismiss="modal"
//               id="close-btn-template"
//             ></button>
//           </div>

//           <div className="modal-body p-0 d-flex bg-light">
//             {/* Sidebar Variables */}
//             <div className="bg-white border-end p-4" style={{ width: "300px" }}>
//               <h6 className="fs-10 fw-black text-muted text-uppercase mb-3">
//                 Placeholders
//               </h6>
//               <div className="d-flex flex-column gap-2 mb-4">
//                 {variables.map((v) => (
//                   <button
//                     key={v.value}
//                     className="btn btn-outline-light text-dark border d-flex justify-content-between p-2 shadow-xs"
//                     onClick={() => injectVariable(v.value)}
//                   >
//                     <span className="fs-12 fw-bold">{v.label}</span>
//                     <code className="text-primary fs-11">{v.value}</code>
//                   </button>
//                 ))}
//               </div>
//               <button
//                 className="btn btn-dark w-100 fw-bold fs-12"
//                 onClick={() => setIsSourceMode(!isSourceMode)}
//               >
//                 <i
//                   className={`ti ${isSourceMode ? "ti-eye" : "ti-code"} me-2`}
//                 ></i>
//                 {isSourceMode ? "Visual View" : "Edit HTML"}
//               </button>
//             </div>

//             {/* Main Design Area */}
//             <div className="flex-grow-1 p-4 overflow-auto">
//               <div className="row g-3 mb-4">
//                 <div className="col-md-8">
//                   <label className="fs-12 fw-bold text-muted">
//                     Internal Name
//                   </label>
//                   <input
//                     type="text"
//                     className="form-control fw-bold"
//                     value={name}
//                     onChange={(e) => setName(e.target.value)}
//                   />
//                 </div>
//                 <div className="col-md-4">
//                   <label className="fs-12 fw-bold text-muted">Category</label>
//                   <select
//                     className="form-select"
//                     value={type}
//                     onChange={(e) => setType(e.target.value)}
//                   >
//                     <option value="offer_letter">Offer Letter</option>
//                     <option value="exp_letter">Experience Letter</option>
//                   </select>
//                 </div>
//               </div>

//               <div
//                 className="card border-0 shadow-sm h-100"
//                 style={{ minHeight: "600px" }}
//               >
//                 {isSourceMode ? (
//                   <textarea
//                     className="form-control border-0 p-4 fs-13 h-100"
//                     style={{
//                       backgroundColor: "#1e1e1e",
//                       color: "#dcdcdc",
//                       fontFamily: "monospace",
//                     }}
//                     value={content}
//                     onChange={(e) => setContent(e.target.value)}
//                   />
//                 ) : (
//                   <ReactQuill
//                     ref={quillRef}
//                     theme="snow"
//                     value={content}
//                     onChange={setContent}
//                     style={{ height: "550px" }}
//                   />
//                 )}
//               </div>
//             </div>
//           </div>

//           <div className="modal-footer border-top bg-white p-3">
//             <button
//               type="button"
//               className="btn btn-outline-secondary px-4 me-2"
//               data-bs-dismiss="modal"
//             >
//               Discard
//             </button>
//             <button
//               type="button"
//               className="btn btn-primary px-5 shadow-sm"
//               onClick={handleSaveLocal}
//             >
//               Sync Design
//             </button>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddEditDocumentTamplatesKHRModal;
