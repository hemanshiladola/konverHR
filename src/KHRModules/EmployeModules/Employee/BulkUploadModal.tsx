import React, { useState, useEffect, useRef } from "react";
import { toast } from "react-toastify";
import {
  generateBulkUploadTemplate,
  parseExcelFile,
  validateExcelRow,
  mapExcelRowToPayload
} from "../../../utils/excelParser";
import {
  getDepartments,
  getDesignations,
  getBranches,
  getAttendancePolicies,
  getStates,
  addEmployee,
  getCountries,
  getBanks,
  getReportingManagers,
  getWorkingSchedules,
  getShiftRosters
} from "./EmployeeServices";
import { createPortal } from "react-dom";

interface BulkUploadModalProps {
  onSuccess: () => void;
  onClose: () => void;
}

const BulkUploadModal: React.FC<BulkUploadModalProps> = ({ onSuccess, onClose }) => {
  const [masters, setMasters] = useState<any>({
    departments: [],
    designations: [],
    branches: [],
    attendancePolicies: [],
    states: [],
    countries: [],
    banks: [],
    managers: [],
    workingSchedules: [],
    shiftRosters: [],
    districts: []
  });

  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewData, setPreviewData] = useState<any[]>([]);
  const [rawRows, setRawRows] = useState<any[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchMasters = async () => {
      setLoading(true);
      try {
        const [
          depts,
          desigs,
          brnchs,
          policies,
          stts,
          cntrs,
          bnks,
          mgrs,
          schedules,
          rosters
        ] = await Promise.all([
          getDepartments(),
          getDesignations(),
          getBranches(),
          getAttendancePolicies(),
          getStates("104"),
          getCountries(),
          getBanks(),
          getReportingManagers(),
          getWorkingSchedules(),
          getShiftRosters()
        ]);

        const formatOptions = (data: any[]) => {
          if (!Array.isArray(data)) return [];
          return data.map((item: any) => ({
            value: String(item.id || item.value || ""),
            label: String(item.name || item.job_title || item.label || "")
          }));
        };

        setMasters({
          departments: formatOptions(depts),
          designations: formatOptions(desigs),
          branches: formatOptions(brnchs),
          attendancePolicies: formatOptions(policies),
          states: formatOptions(stts),
          countries: formatOptions(cntrs),
          banks: formatOptions(bnks),
          managers: formatOptions(mgrs),
          workingSchedules: formatOptions(schedules),
          shiftRosters: formatOptions(rosters),
          districts: [] // Handled as text or via future enhancement
        });
      } catch (error) {
        console.error("Failed to load masters:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchMasters();
  }, []);

  const handleDownloadTemplate = () => {
    generateBulkUploadTemplate(masters);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const parsedData = await parseExcelFile(file);
      if (!parsedData || parsedData.length === 0) {
        toast.error("The uploaded file is empty or invalid.");
        return;
      }

      const rowsWithValidation = parsedData.map((row: any, index: number) => {
        const payload = mapExcelRowToPayload(row, masters);
        const errors = validateExcelRow(row, payload);
        return {
          rowNumber: index + 2, // Excel rows start at 2 (including header)
          originalData: row,
          payload,
          errors,
          isValid: errors.length === 0
        };
      });

      setPreviewData(rowsWithValidation);
      setRawRows(parsedData);
      
      // Reset input
      if (fileInputRef.current) fileInputRef.current.value = "";
    } catch (error) {
      console.error("Excel Parsing Error:", error);
      toast.error("Failed to parse Excel file. Please ensure it follows the template format.");
    }
  };

  const submitBulkUpload = async () => {
    const validRows = previewData.filter(d => d.isValid);
    if (validRows.length === 0) {
      toast.error("No valid rows to upload. Please fix errors and try again.");
      return;
    }

    setIsProcessing(true);
    let successCount = 0;
    let failCount = 0;

    for (const data of validRows) {
      try {
        await addEmployee(data.payload);
        successCount++;
      } catch (error) {
        failCount++;
        console.error(`Failed to add employee at row ${data.rowNumber}:`, error);
      }
    }

    setIsProcessing(false);
    toast.success(`Bulk Upload Complete! Success: ${successCount}, Failed: ${failCount}`);
    
    document.getElementById("bulk-modal-close-btn")?.click();
    setTimeout(() => {
        onSuccess();
    }, 500);
  };

  const handleModalClose = () => {
    setPreviewData([]);
    setRawRows([]);
    onClose();
  };

  return createPortal(
    <div
      className="modal fade"
      id="bulk_upload_modal"
      tabIndex={-1}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered modal-xl wizard-modal">
        <div className="modal-content">
          <div className="modal-header bg-white border-bottom px-4 py-3">
            <h5 className="modal-title fw-bold d-flex align-items-center">
              <i className="ti ti-upload text-primary me-2 fs-20"></i>{" "}
              Bulk Upload Employees
            </h5>
            <button
              type="button"
              id="bulk-modal-close-btn"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={handleModalClose}
            ></button>
          </div>
          <div className="modal-body p-4 bg-light-subtle">
            <div className="row mb-4">
              <div className="col-md-6 border-end">
                <h6 className="fw-bold mb-3">Step 1: Download Template</h6>
                <p className="text-muted small">
                  Download the Excel template which contains all necessary columns and valid data dropdown instructions.
                </p>
                <button
                  className="btn btn-outline-primary"
                  onClick={handleDownloadTemplate}
                  disabled={loading}
                >
                  <i className="ti ti-download me-2"></i> Download Template
                </button>
              </div>
              <div className="col-md-6 ps-4">
                <h6 className="fw-bold mb-3">Step 2: Upload Filled Template</h6>
                <p className="text-muted small">
                  Once filled, upload the .xlsx file here to preview and submit.
                </p>
                <input
                  type="file"
                  className="form-control"
                  accept=".xlsx, .xls"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                />
              </div>
            </div>

            {previewData.length > 0 && (
              <div className="card shadow-sm border-0">
                <div className="card-header bg-primary text-white d-flex justify-content-between align-items-center">
                  <h6 className="mb-0">Data Preview</h6>
                  <span className="badge bg-white text-primary">
                    {previewData.filter(d => d.isValid).length} Valid / {previewData.length} Total
                  </span>
                </div>
                <div className="card-body p-0">
                  <div className="table-responsive" style={{ maxHeight: "400px" }}>
                    <table className="table table-hover table-striped mb-0">
                      <thead className="table-light sticky-top">
                        <tr>
                          <th>Row</th>
                          <th>Name</th>
                          <th>Email</th>
                          <th>Department</th>
                          <th>Designation</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {previewData.map((row, idx) => (
                          <tr key={idx} className={row.isValid ? "" : "table-danger"}>
                            <td>{row.rowNumber}</td>
                            <td>{row.originalData["Employee Name *"]}</td>
                            <td>{row.originalData["Private Email *"]}</td>
                            <td>{row.originalData["Department *"]}</td>
                            <td>{row.originalData["Designation *"]}</td>
                            <td>
                              {row.isValid ? (
                                <span className="badge bg-success">Valid</span>
                              ) : (
                                <span className="badge bg-danger text-wrap text-start" style={{ maxWidth: "200px" }}>
                                  {row.errors.join(", ")}
                                </span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
                <div className="card-footer px-4 py-3 text-end bg-white">
                  <button
                    className="btn btn-light me-2"
                    onClick={() => setPreviewData([])}
                    disabled={isProcessing}
                  >
                    Clear Preview
                  </button>
                  <button
                    className="btn btn-primary"
                    onClick={submitBulkUpload}
                    disabled={previewData.filter(d => d.isValid).length === 0 || isProcessing}
                  >
                    {isProcessing ? (
                      <><span className="spinner-border spinner-border-sm me-2" role="status"></span> Processing...</>
                    ) : (
                      "Submit Valid Rows"
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkUploadModal;
