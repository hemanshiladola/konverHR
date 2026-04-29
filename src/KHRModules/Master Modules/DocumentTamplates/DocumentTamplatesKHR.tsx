import React, { useState, useEffect } from "react";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import AddEditDocumentTamplatesKHRModal from "./AddEditDocumentTamplatesKHRModal";
import { all_routes } from "../../../router/all_routes";
import {
  getDocumentTemplates,
  deleteDocumentTemplate,
} from "./DocumentTamplatesServices";
import { toast } from "react-toastify";

const DocumentTemplatesKHR: React.FC = () => {
  const routes = all_routes;
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

  const fetchTemplates = async () => {
    setLoading(true);
    try {
      const data = await getDocumentTemplates();
      // Map API fields (document_type, html_content) to UI fields (type, content)
      const formatted = data.map((t: any) => ({
        id: t.id,
        name: t.name,
        type: t.document_type || "offer_letter",
        content: t.html_content || "",
        last_updated:
          t.write_date?.split(" ")[0] ||
          t.create_date?.split(" ")[0] ||
          "Recent",
      }));
      setTemplates(formatted);
    } catch (error) {
      toast.error("Failed to load templates");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDelete = async (id: number) => {
    if (window.confirm("Delete this template permanently?")) {
      try {
        await deleteDocumentTemplate(id);
        toast.success("Template deleted successfully");
        fetchTemplates();
      } catch (error) {
        toast.error("Failed to delete template");
      }
    }
  };

  const simulatePreview = (tpl: any) => {
    const previewHtml = tpl.content
      .replace(/{{name}}/g, "<strong>[Employee Name]</strong>")
      .replace(/{{job_id}}/g, "<strong>[Designation]</strong>");
    const win = window.open("", "_blank");
    win?.document.write(
      `<html><body style="padding:50px;">${previewHtml}</body></html>`,
    );
    win?.document.close();
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div onClick={() => setSelectedTemplate(null)}>
          <CommonHeader
            title="Document Templates"
            parentMenu="Master"
            activeMenu="Templates"
            routes={routes}
            buttonText="Add Template"
            modalTarget="#add_template_modal"
          />
        </div>

        {loading ? (
          <div className="text-center p-5">
            <div className="spinner-border text-primary"></div>
          </div>
        ) : (
          <div className="row g-4 mt-3">
            {templates.map((tpl) => (
              <div
                className="col-xxl-2 col-xl-3 col-lg-4 col-md-6"
                key={tpl.id}
              >
                <div className="folder-item card border-0 shadow-none text-center h-100 transition-all">
                  <div className="card-body p-3">
                    <div className="folder-icon-wrap position-relative mb-3 mx-auto">
                      <div
                        className="bg-soft-primary rounded-circle d-flex align-items-center justify-content-center mx-auto"
                        style={{ width: "80px", height: "80px" }}
                      >
                        <i className="ti ti-folder text-primary fs-40"></i>
                      </div>
                      <span className="position-absolute top-0 end-0 badge rounded-pill bg-primary fs-10">
                        {tpl.type.split("_")[0].toUpperCase()}
                      </span>
                    </div>

                    <h6
                      className="text-dark fw-bold mb-1 text-truncate"
                      title={tpl.name}
                    >
                      {tpl.name}
                    </h6>
                    <p className="text-muted fs-11 mb-3">
                      Updated: {tpl.last_updated}
                    </p>

                    <div className="d-flex gap-2 justify-content-center border-top pt-3">
                      <button
                        className="btn btn-icon btn-soft-info btn-sm rounded-circle"
                        data-bs-toggle="modal"
                        data-bs-target="#add_template_modal"
                        onClick={() => setSelectedTemplate(tpl)}
                        title="Edit"
                      >
                        <i className="ti ti-edit fs-14"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-soft-primary btn-sm rounded-circle"
                        onClick={() => simulatePreview(tpl)}
                        title="Preview"
                      >
                        <i className="ti ti-eye fs-14"></i>
                      </button>
                      <button
                        className="btn btn-icon btn-soft-danger btn-sm rounded-circle"
                        onClick={() => handleDelete(tpl.id)}
                        title="Delete"
                      >
                        <i className="ti ti-trash fs-14"></i>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-6">
              <div
                className="folder-item card border-dashed h-100 d-flex align-items-center justify-content-center bg-transparent cursor-pointer"
                data-bs-toggle="modal"
                data-bs-target="#add_template_modal"
                onClick={() => setSelectedTemplate(null)}
              >
                <div className="text-center p-3">
                  <div
                    className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
                    style={{ width: "50px", height: "50px" }}
                  >
                    <i className="ti ti-plus text-muted fs-24"></i>
                  </div>
                  <span className="fw-bold text-muted fs-13">New Format</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <AddEditDocumentTamplatesKHRModal
        onSuccess={fetchTemplates}
        data={selectedTemplate}
        onClose={() => setSelectedTemplate(null)}
      />
    </div>
  );
};

export default DocumentTemplatesKHR;

// import React, { useState, useEffect } from "react";
// import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
// import AddEditDocumentTamplatesKHRModal from "./AddEditDocumentTamplatesKHRModal";
// import { all_routes } from "../../../router/all_routes";

// const DocumentTemplatesKHR: React.FC = () => {
//   const routes = all_routes;
//   const [templates, setTemplates] = useState<any[]>([]);
//   const [selectedTemplate, setSelectedTemplate] = useState<any | null>(null);

//   const defaultTemplates = [
//     {
//       id: "default_1",
//       name: "Modern Appointment Letter",
//       type: "offer_letter",
//       content: `<div style="font-family: 'Helvetica Neue', Arial; padding: 40px; border: 1px solid #e2e8f0;">
//                   <h2 style="color: #2c5282;">Appointment Letter</h2>
//                   <p>Dear {{name}},</p>
//                   <p>We are pleased to appoint you as {{job_id}}.</p>
//                 </div>`,
//       last_updated: "2026-03-20",
//     },
//     {
//       id: "default_2",
//       name: "Standard Experience Letter",
//       type: "exp_letter",
//       content: `<div>Experience Letter Content</div>`,
//       last_updated: "2026-03-19",
//     },
//   ];

//   const loadLocalData = () => {
//     const saved = localStorage.getItem("local_document_templates");
//     if (saved && saved !== "[]") {
//       setTemplates(JSON.parse(saved));
//     } else {
//       setTemplates(defaultTemplates);
//       localStorage.setItem(
//         "local_document_templates",
//         JSON.stringify(defaultTemplates),
//       );
//     }
//   };

//   useEffect(() => {
//     loadLocalData();
//   }, []);

//   const simulatePreview = (tpl: any) => {
//     const previewHtml = tpl.content
//       .replace(/{{name}}/g, "<strong>Dhaval Zalam</strong>")
//       .replace(/{{job_id}}/g, "<strong>Senior HR Manager</strong>");
//     const win = window.open("", "_blank");
//     win?.document.write(
//       `<html><body style="padding:50px;">${previewHtml}</body></html>`,
//     );
//     win?.document.close();
//   };

//   return (
//     <div className="page-wrapper">
//       <div className="content">
//         <div onClick={() => setSelectedTemplate(null)}>
//           <CommonHeader
//             title="Document Templates"
//             parentMenu="Master"
//             activeMenu="Templates"
//             routes={routes}
//             buttonText="Add Template"
//             modalTarget="#add_template_modal"
//           />
//         </div>

//         {/* --- FOLDER GRID VIEW --- */}
//         <div className="row g-4 mt-3">
//           {templates.map((tpl) => (
//             <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-6" key={tpl.id}>
//               <div className="folder-item card border-0 shadow-none text-center h-100 transition-all">
//                 <div className="card-body p-3">
//                   {/* Folder Icon Wrapper */}
//                   <div className="folder-icon-wrap position-relative mb-3 mx-auto">
//                     <div
//                       className="bg-soft-primary rounded-circle d-flex align-items-center justify-content-center mx-auto"
//                       style={{ width: "80px", height: "80px" }}
//                     >
//                       <i className="ti ti-folder text-primary fs-40"></i>
//                     </div>
//                     {/* Badge for Type Overlay */}
//                     <span className="position-absolute top-0 end-0 badge rounded-pill bg-primary fs-10">
//                       {tpl.type.split("_")[0].toUpperCase()}
//                     </span>
//                   </div>

//                   {/* Template Details */}
//                   <h6
//                     className="text-dark fw-bold mb-1 text-truncate"
//                     title={tpl.name}
//                   >
//                     {tpl.name}
//                   </h6>
//                   <p className="text-muted fs-11 mb-3">
//                     Updated: {tpl.last_updated}
//                   </p>

//                   {/* Folder Action Buttons */}
//                   <div className="d-flex gap-2 justify-content-center border-top pt-3">
//                     <button
//                       className="btn btn-icon btn-soft-info btn-sm rounded-circle"
//                       data-bs-toggle="modal"
//                       data-bs-target="#add_template_modal"
//                       onClick={() => setSelectedTemplate(tpl)}
//                       title="Edit Template"
//                     >
//                       <i className="ti ti-edit fs-14"></i>
//                     </button>
//                     <button
//                       className="btn btn-icon btn-soft-primary btn-sm rounded-circle"
//                       onClick={() => simulatePreview(tpl)}
//                       title="Quick Preview"
//                     >
//                       <i className="ti ti-eye fs-14"></i>
//                     </button>
//                     <button
//                       className="btn btn-icon btn-soft-danger btn-sm rounded-circle"
//                       onClick={() => {
//                         if (window.confirm("Delete this template?")) {
//                           const updated = templates.filter(
//                             (t) => t.id !== tpl.id,
//                           );
//                           setTemplates(updated);
//                           localStorage.setItem(
//                             "local_document_templates",
//                             JSON.stringify(updated),
//                           );
//                         }
//                       }}
//                       title="Remove"
//                     >
//                       <i className="ti ti-trash fs-14"></i>
//                     </button>
//                   </div>
//                 </div>
//               </div>
//             </div>
//           ))}

//           {/* ADD NEW PLACEHOLDER FOLDER */}
//           <div className="col-xxl-2 col-xl-3 col-lg-4 col-md-6">
//             <div
//               className="folder-item card border-dashed h-100 d-flex align-items-center justify-content-center bg-transparent cursor-pointer"
//               style={{ minHeight: "200px", cursor: "pointer" }}
//               data-bs-toggle="modal"
//               data-bs-target="#add_template_modal"
//               onClick={() => setSelectedTemplate(null)}
//             >
//               <div className="text-center p-3">
//                 <div
//                   className="bg-light rounded-circle d-flex align-items-center justify-content-center mx-auto mb-2"
//                   style={{ width: "50px", height: "50px" }}
//                 >
//                   <i className="ti ti-plus text-muted fs-24"></i>
//                 </div>
//                 <span className="fw-bold text-muted fs-13">New Format</span>
//               </div>
//             </div>
//           </div>
//         </div>
//       </div>

//       <AddEditDocumentTamplatesKHRModal
//         onSuccess={loadLocalData}
//         data={selectedTemplate}
//         onClose={() => setSelectedTemplate(null)}
//       />

//       <style>{`
//         .folder-item {
//           border: 1px solid transparent;
//           background: #fff;
//         }
//         .folder-item:hover {
//           border-color: #3182ce;
//           background: #f8fbff;
//           transform: translateY(-5px);
//           box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1) !important;
//         }
//         .bg-soft-primary {
//           background-color: rgba(49, 130, 206, 0.1);
//         }
//         .cursor-pointer {
//           cursor: pointer;
//         }
//         .border-dashed {
//           border: 2px dashed #cbd5e0 !important;
//         }
//       `}</style>
//     </div>
//   );
// };

// export default DocumentTemplatesKHR;
