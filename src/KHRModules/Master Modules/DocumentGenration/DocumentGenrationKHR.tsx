import React, { useState, useEffect } from "react";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import { all_routes } from "../../../router/all_routes";
import {
  getEmployeesBasicInfo,
  getDocumentTemplatesList,
  generateDocumentApi,
} from "./DocumentGenrationServices";
import { toast } from "react-toastify";

const DocumentGenrationKHR = () => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [employees, setEmployees] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [selectedEmp, setSelectedEmp] = useState<any>(null);
  const [selectedTpl, setSelectedTpl] = useState<any>(null);
  const [pdfBlobUrl, setPdfBlobUrl] = useState<string>("");

  useEffect(() => {
    const loadInitialData = async () => {
      setLoading(true);
      try {
        const [empData, tplData] = await Promise.all([
          getEmployeesBasicInfo(),
          getDocumentTemplatesList(),
        ]);
        setEmployees(empData);
        setTemplates(tplData);
      } catch (error) {
        toast.error("Failed to load system data.");
      } finally {
        setLoading(false);
      }
    };
    loadInitialData();
  }, []);

  const handleGenerate = async () => {
    if (!selectedEmp || !selectedTpl) return;
    setLoading(true);
    try {
      const response = await generateDocumentApi(
        selectedEmp.id,
        selectedTpl.id,
      );
      if (response.status === "success" && response.datas) {
        const pureBase64 = response.datas.replace(/\s/g, "");
        const byteCharacters = atob(pureBase64);
        const byteNumbers = new Array(byteCharacters.length);
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        const blob = new Blob([byteArray], { type: "application/pdf" });
        const url = URL.createObjectURL(blob);
        setPdfBlobUrl(url);
        setStep(3);
      } else {
        toast.error(response.message || "Could not generate document.");
      }
    } catch (error) {
      toast.error("Network error during generation.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    const link = document.createElement("a");
    link.href = pdfBlobUrl;
    link.download = `${selectedEmp.name}_Document.pdf`;
    link.click();
  };

  return (
    <div
      className="page-wrapper"
      style={{ background: "#F1F5F9", minHeight: "100vh" }}
    >
      <div className="content">
        <CommonHeader
          title="Generation Studio"
          parentMenu="KAVACH"
          activeMenu="Wizard"
          routes={all_routes}
        />

        <div className="row justify-content-center mt-3">
          <div className="col-12">
            <div
              className="main-studio-card border-0 shadow-lg overflow-hidden"
              style={{
                borderRadius: "24px",
                background: "#fff",
                minHeight: "80vh",
              }}
            >
              <div className="row g-0 h-100">
                {/* --- LEFT SIDEBAR: STEP PROGRESS & SUMMARY --- */}
                <div className="col-lg-3 border-end bg-light p-4 d-flex flex-column justify-content-between">
                  <div>
                    <h5 className="fw-black mb-4">Wizard Progress</h5>
                    <div className="ux-stepper">
                      <UXStep
                        nr={1}
                        label="Recipient"
                        active={step >= 1}
                        done={step > 1}
                        sub={selectedEmp?.name}
                      />
                      <UXStep
                        nr={2}
                        label="Template"
                        active={step >= 2}
                        done={step > 2}
                        sub={selectedTpl?.name}
                      />
                      <UXStep
                        nr={3}
                        label="Review"
                        active={step >= 3}
                        done={step > 3}
                      />
                    </div>
                  </div>

                  {selectedEmp && (
                    <div className="selection-summary-card p-3 rounded-4 bg-white border shadow-sm animate__animated animate__fadeInUp">
                      <p className="text-muted x-small mb-2 fw-bold">
                        ACTIVE SELECTION
                      </p>
                      <div className="d-flex align-items-center mb-2">
                        <div
                          className="avatar-xs rounded-circle bg-primary text-white me-2 d-flex align-items-center justify-content-center"
                          style={{
                            width: "30px",
                            height: "30px",
                            fontSize: "12px",
                          }}
                        >
                          {selectedEmp.name?.charAt(0)}
                        </div>
                        <span className="small fw-bold text-truncate">
                          {selectedEmp.name}
                        </span>
                      </div>
                      {selectedTpl && (
                        <div className="d-flex align-items-center">
                          <i className="ti ti-file-description text-warning me-2"></i>
                          <span className="small text-muted text-truncate">
                            {selectedTpl.name}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* --- RIGHT PANEL: INTERACTIVE CONTENT --- */}
                <div
                  className="col-lg-9 d-flex flex-column"
                  style={{ background: "#fff" }}
                >
                  {/* DYNAMIC HEADER */}
                  <div className="p-4 border-bottom d-flex justify-content-between align-items-center">
                    <h4 className="fw-bold mb-0">
                      {step === 1
                        ? "Choose Recipient"
                        : step === 2
                          ? "Select Document Format"
                          : "Final Review"}
                    </h4>
                    {step > 1 && step < 3 && (
                      <button
                        className="btn btn-soft-secondary btn-sm"
                        onClick={() => setStep(step - 1)}
                      >
                        <i className="ti ti-arrow-back-up me-1"></i> Back
                      </button>
                    )}
                  </div>

                  <div
                    className="flex-grow-1 p-4 overflow-auto"
                    style={{ maxHeight: "calc(100vh - 300px)" }}
                  >
                    {/* STEP 1: EMPLOYEE SELECTION WITH SEARCH */}
                    {step === 1 && (
                      <div className="animate__animated animate__fadeIn">
                        <div className="mb-4">
                          <input
                            type="text"
                            className="form-control form-control-lg border-0 bg-light rounded-4 px-4"
                            placeholder="Type to search employees..."
                            onChange={(e) => setSearchTerm(e.target.value)}
                          />
                        </div>
                        <div className="row g-3">
                          {employees
                            .filter((e) =>
                              e.name
                                ?.toLowerCase()
                                .includes(searchTerm.toLowerCase()),
                            )
                            .map((emp) => (
                              <div className="col-md-4" key={emp.id}>
                                <div
                                  className={`ux-selection-card ${selectedEmp?.id === emp.id ? "active" : ""}`}
                                  onClick={() => setSelectedEmp(emp)}
                                >
                                  <div className="d-flex align-items-center">
                                    <div className="ux-avatar me-3">
                                      {emp.name?.charAt(0)}
                                    </div>
                                    <div className="flex-grow-1 overflow-hidden">
                                      <h6 className="mb-0 fw-bold text-truncate">
                                        {emp.name}
                                      </h6>
                                      <small className="text-muted">
                                        {emp.job_title || "Employee"}
                                      </small>
                                    </div>
                                    {selectedEmp?.id === emp.id && (
                                      <i className="ti ti-circle-check-filled text-primary fs-4"></i>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                        </div>
                      </div>
                    )}

                    {/* STEP 2: TEMPLATE TILE SELECTION */}
                    {step === 2 && (
                      <div className="row g-4 animate__animated animate__fadeIn">
                        {templates.map((tpl) => (
                          <div className="col-md-6" key={tpl.id}>
                            <div
                              className={`ux-template-card ${selectedTpl?.id === tpl.id ? "active" : ""}`}
                              onClick={() => setSelectedTpl(tpl)}
                            >
                              <div className="d-flex align-items-center mb-3">
                                <div className="icon-wrap bg-soft-warning text-warning me-3">
                                  <i className="ti ti-template fs-3"></i>
                                </div>
                                <h6 className="fw-bold mb-0">{tpl.name}</h6>
                              </div>
                              <p className="text-muted x-small mb-0">
                                Document Type:{" "}
                                <strong>{tpl.document_type}</strong>
                              </p>
                              {selectedTpl?.id === tpl.id && (
                                <div className="active-glow"></div>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* STEP 3: FULL SCREEN PREVIEW */}
                    {step === 3 && (
                      <div className="h-100 animate__animated animate__zoomIn">
                        <iframe
                          src={`${pdfBlobUrl}#toolbar=0`}
                          width="100%"
                          height="600px"
                          className="rounded-4 border shadow-sm"
                        />
                      </div>
                    )}
                  </div>

                  {/* ACTION FOOTER */}
                  <div className="p-4 bg-light border-top d-flex justify-content-end gap-3">
                    {step === 1 && (
                      <button
                        className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
                        disabled={!selectedEmp}
                        onClick={() => setStep(2)}
                      >
                        Next: Select Template{" "}
                        <i className="ti ti-arrow-right ms-2"></i>
                      </button>
                    )}
                    {step === 2 && (
                      <button
                        className="btn btn-primary btn-lg rounded-pill px-5 shadow-sm"
                        disabled={!selectedTpl || loading}
                        onClick={handleGenerate}
                      >
                        {loading ? "Generating..." : "Generate Preview"}{" "}
                        <i className="ti ti-wand ms-2"></i>
                      </button>
                    )}
                    {step === 3 && (
                      <>
                        <button
                          className="btn btn-outline-secondary btn-lg rounded-pill"
                          onClick={() => setStep(1)}
                        >
                          New Generation
                        </button>
                        <button
                          className="btn btn-success btn-lg rounded-pill px-5 shadow-lg"
                          onClick={handleDownload}
                        >
                          <i className="ti ti-download me-2"></i> Download
                          Document
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <style>{`
        .fw-black { font-weight: 900; }
        .x-small { font-size: 11px; letter-spacing: 0.5px; }
        .bg-soft-warning { background: rgba(255, 193, 7, 0.15); }
        .ux-stepper { display: flex; flex-direction: column; gap: 2rem; }
        
        .ux-selection-card {
          padding: 1.2rem;
          border-radius: 16px;
          border: 1px solid #E2E8F0;
          cursor: pointer;
          transition: 0.3s;
          background: #fff;
        }
        .ux-selection-card:hover { transform: translateY(-3px); box-shadow: 0 10px 15px -3px rgba(0,0,0,0.1); }
        .ux-selection-card.active { border-color: #0d6efd; background: #F0F7FF; }
        
        .ux-avatar {
          width: 45px; height: 45px;
          background: #F1F5F9;
          border-radius: 12px;
          display: flex; align-items: center; justify-content: center;
          font-weight: bold; color: #64748B;
        }

        .ux-template-card {
          padding: 1.5rem;
          border-radius: 20px;
          border: 2px solid #F1F5F9;
          position: relative;
          cursor: pointer;
          transition: 0.3s;
        }
        .ux-template-card.active { border-color: #0d6efd; background: #fff; }
        .icon-wrap { width: 50px; height: 50px; border-radius: 15px; display: flex; align-items: center; justify-content: center; }

        .btn-soft-secondary { background: #F1F5F9; color: #475569; border: none; font-weight: 600; }
      `}</style>
    </div>
  );
};

const UXStep = ({ nr, label, active, done, sub }: any) => (
  <div
    className={`d-flex align-items-center ${active ? "opacity-100" : "opacity-40"}`}
  >
    <div
      className={`rounded-4 d-flex align-items-center justify-content-center me-3 ${done ? "bg-success text-white" : active ? "bg-primary text-white shadow" : "bg-white border"}`}
      style={{ width: "40px", height: "40px", fontWeight: "700" }}
    >
      {done ? <i className="ti ti-check"></i> : nr}
    </div>
    <div>
      <p className="mb-0 fw-bold small">{label}</p>
      {sub && (
        <p
          className="mb-0 text-primary x-small text-truncate"
          style={{ maxWidth: "150px" }}
        >
          {sub}
        </p>
      )}
    </div>
  </div>
);

export default DocumentGenrationKHR;
