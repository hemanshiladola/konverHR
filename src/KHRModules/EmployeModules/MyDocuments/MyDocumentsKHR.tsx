import React, { useState, useEffect } from "react";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import { all_routes } from "../../../router/all_routes";
import { getMyDocumentsApi } from "./MyDocumentsKHRServices";
import { toast } from "react-toastify";

const MyDocumentsKHR = () => {
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<any[]>([]);
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  useEffect(() => {
    fetchDocs();
  }, []);

  const fetchDocs = async () => {
    setLoading(true);
    const res = await getMyDocumentsApi();
    if (res.status === "success") {
      setDocuments(res.attachments || []);
      // Auto-select the first document for preview
      if (res.attachments?.length > 0) {
        handleSelectDoc(res.attachments[0]);
      }
    }
    setLoading(false);
  };

  const handleSelectDoc = (doc: any) => {
    setSelectedDoc(doc);
    if (doc.file_data) {
      // Convert Base64 to Blob URL for the iframe preview
      const pureBase64 = doc.file_data.replace(/\s/g, "");
      const byteCharacters = atob(pureBase64);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {
        type: doc.mimetype || "application/pdf",
      });
      const url = URL.createObjectURL(blob);
      setPreviewUrl(url);
    }
  };

  const downloadFile = (doc: any) => {
    const link = document.createElement("a");
    link.href = previewUrl;
    link.download = doc.name;
    link.click();
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <CommonHeader
          title="My Document Vault"
          parentMenu="Employee"
          activeMenu="Documents"
          routes={all_routes}
        />

        <div className="row g-4 mt-2">
          {/* --- LEFT: DOCUMENT LIST --- */}
          <div className="col-xl-4 col-lg-5">
            <div
              className="card border-0 shadow-sm overflow-hidden"
              style={{ borderRadius: "20px" }}
            >
              <div className="card-header bg-white py-3 border-light">
                <h6 className="fw-bold mb-0">Available Documents</h6>
              </div>
              <div
                className="list-group list-group-flush overflow-auto"
                style={{ maxHeight: "700px" }}
              >
                {loading ? (
                  <div className="text-center p-5">
                    <div className="spinner-border spinner-border-sm text-primary"></div>
                  </div>
                ) : documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className={`list-group-item list-group-item-action p-3 border-light cursor-pointer transition-all ${selectedDoc?.id === doc.id ? "bg-soft-primary active-doc" : ""}`}
                      onClick={() => handleSelectDoc(doc)}
                    >
                      <div className="d-flex align-items-center">
                        <div
                          className={`icon-box rounded-3 me-3 ${selectedDoc?.id === doc.id ? "bg-primary text-white" : "bg-light text-muted"}`}
                        >
                          <i className="ti ti-file-text fs-4"></i>
                        </div>
                        <div className="flex-grow-1 overflow-hidden">
                          <p className="mb-0 fw-bold text-truncate small">
                            {doc.name}
                          </p>
                          <small
                            className="text-muted"
                            style={{ fontSize: "10px" }}
                          >
                            {doc.create_date?.split(" ")[0]} •{" "}
                            {(doc.file_size / 1024).toFixed(1)} KB
                          </small>
                        </div>
                        {selectedDoc?.id === doc.id && (
                          <i className="ti ti-chevron-right text-primary"></i>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-5 text-center text-muted small">
                    No documents generated yet.
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* --- RIGHT: PREVIEW PANEL --- */}
          <div className="col-xl-8 col-lg-7">
            {selectedDoc ? (
              <div
                className="card border-0 shadow-sm overflow-hidden"
                style={{ borderRadius: "20px" }}
              >
                <div className="card-header bg-white py-3 d-flex justify-content-between align-items-center border-light">
                  <div>
                    <h6 className="fw-bold mb-0 text-primary">
                      {selectedDoc.name}
                    </h6>
                    <small className="text-muted">
                      Official Document Preview
                    </small>
                  </div>
                  <button
                    className="btn btn-primary px-4 btn-sm rounded-pill shadow-sm"
                    onClick={() => downloadFile(selectedDoc)}
                  >
                    <i className="ti ti-download me-2"></i> Download PDF
                  </button>
                </div>
                <div
                  className="card-body p-0 bg-dark-gray"
                  style={{ height: "750px" }}
                >
                  <iframe
                    src={`${previewUrl}#toolbar=0`}
                    width="100%"
                    height="100%"
                    className="border-0"
                    title="PDF Viewer"
                  />
                </div>
              </div>
            ) : (
              <div className="h-100 d-flex align-items-center justify-content-center flex-column text-muted opacity-50">
                <i className="ti ti-file-search display-1 mb-3"></i>
                <p className="fw-bold">Select a document to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .bg-soft-primary { background: rgba(13, 110, 253, 0.05); }
        .active-doc { border-left: 4px solid #0d6efd !important; }
        .icon-box { width: 45px; height: 45px; display: flex; align-items: center; justify-content: center; transition: 0.3s; }
        .bg-dark-gray { background: #525659; }
        .cursor-pointer { cursor: pointer; }
      `}</style>
    </div>
  );
};

export default MyDocumentsKHR;
