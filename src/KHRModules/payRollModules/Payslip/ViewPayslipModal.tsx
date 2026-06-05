import React, { useEffect } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { createPortal } from "react-dom";

interface Props {
  data: any | null;
  onClose: () => void;
}

const ViewPayslipModal: React.FC<Props> = ({ data, onClose }) => {
  useEffect(() => {
    if (data) {
      const modalElement = document.getElementById("view_payslip_modal");
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();

        const handleHidden = () => {
          onClose();
          document
            .querySelectorAll(".modal-backdrop")
            .forEach((el) => el.remove());
        };

        modalElement.addEventListener("hidden.bs.modal", handleHidden);
        return () =>
          modalElement.removeEventListener("hidden.bs.modal", handleHidden);
      }
    }
  }, [data, onClose]);

  if (!data) return null;

  const earnings =
    data.line_ids?.filter((l: any) =>
      ["Basic", "Allowance", "Other Allowance"].includes(l.category) &&
      Number(l.total) !== 0,
    ) || [];

  const deductions =
    data.line_ids?.filter((l: any) =>
      l.category === "Deduction" && Number(l.total) !== 0,
    ) || [];

  const totalEarnings = earnings.reduce((sum: number, item: any) => sum + item.total, 0);
  const totalDeductions = deductions.reduce((sum: number, item: any) => sum + Math.abs(item.total), 0);

  const workedDays = data.worked_days_line_ids || [];

  const getStatusBadge = (state: string) => {
    const states: any = {
      draft: "bg-soft-secondary text-secondary",
      verify: "bg-soft-warning text-warning",
      done: "bg-soft-info text-info",
      paid: "bg-soft-success text-success",
      cancel: "bg-soft-danger text-danger",
    };
    return states[state] || "bg-soft-primary text-primary";
  };

  const netSalaryLine = data.line_ids?.find((l: any) => l.code === "Net" || l.category === "Net");
  const netSalaryAmount = netSalaryLine ? netSalaryLine.total : (data.net_wage || 0);

  const handlePrint = () => {
    document.body.classList.add("print-payslip-only");
    window.print();
    document.body.classList.remove("print-payslip-only");
  };

  return createPortal(
    <>
      <style>
        {`
          @media print {
            @page {
              margin: 5mm;
              size: A4 portrait;
            }
            body.print-payslip-only * {
              -webkit-print-color-adjust: exact !important;
              print-color-adjust: exact !important;
              color-adjust: exact !important;
            }
            body.print-payslip-only > *:not(#view_payslip_modal) {
              display: none !important;
            }
            body.print-payslip-only #view_payslip_modal {
              display: block !important;
              position: static;
              overflow: visible;
              background: transparent;
            }
            body.print-payslip-only .modal-dialog {
              margin: 0;
              max-width: 100%;
              width: 100%;
            }
            body.print-payslip-only .modal-content {
              border: none;
              box-shadow: none;
            }
            body.print-payslip-only .modal-header,
            body.print-payslip-only .modal-footer {
              display: none !important;
            }
            body.print-payslip-only .modal-body {
              padding: 0 !important;
              background: white !important;
            }
            body.print-payslip-only #printableArea {
              box-shadow: none !important;
              border: none !important;
              padding: 10px !important;
              zoom: 0.9;
            }
            body.print-payslip-only .card,
            body.print-payslip-only .row,
            body.print-payslip-only table {
              page-break-inside: avoid !important;
            }
          }
        `}
      </style>
      <div className="modal fade" id="view_payslip_modal" tabIndex={-1} aria-hidden="true">
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-bottom bg-light py-2">
              <h5 className="modal-title fw-bold fs-15 text-dark">
                <i className="ti ti-file-description me-2 text-primary"></i>
                Payslip : {data.number || "Draft"}
              </h5>
              <button type="button" className="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
            </div>

            <div className="modal-body p-4 bg-light-subtle">
              <div id="printableArea" className="bg-white p-4 rounded shadow-sm border">

                {/* Header Section */}
                <div className="d-flex justify-content-between align-items-center border-bottom pb-4 mb-4">
                  <div className="d-flex align-items-center gap-3">
                    <div>
                      <h5 className="fw-bolder text-dark mb-1">
                        {localStorage.getItem("company_name") || "Company Name"}
                      </h5>
                    </div>
                  </div>
                  <div className="text-end">
                    <h3 className="fw-black text-primary tracking-wider mb-2">SALARY SLIP</h3>
                    <div className={`badge ${getStatusBadge(data.state)} px-3 py-1 fs-12 fw-bold text-uppercase border`}>
                      {data.state}
                    </div>
                  </div>
                </div>

                {/* Info Grid */}
                <div className="row g-4 mb-4">
                  <div className="col-md-6">
                    <div className="card border-0 bg-light-gray h-100 rounded-3">
                      <div className="card-body p-3">
                        <h6 className="fw-bold text-uppercase fs-12 text-muted mb-3 border-bottom pb-2">Employee Summary</h6>
                        <div className="d-flex flex-column gap-2 fs-13">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Name</span>
                            <span className="fw-bold text-dark">{data.employee_name}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Employee ID</span>
                            <span className="fw-bold text-dark">{data.employee_id}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Department</span>
                            <span className="fw-bold text-dark">{data.department || "N/A"}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="col-md-6">
                    <div className="card border-0 bg-light-gray h-100 rounded-3">
                      <div className="card-body p-3">
                        <h6 className="fw-bold text-uppercase fs-12 text-muted mb-3 border-bottom pb-2">Payslip Details</h6>
                        <div className="d-flex flex-column gap-2 fs-13">
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Slip No.</span>
                            <span className="fw-bold text-dark">{data.number}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Pay Period</span>
                            <span className="fw-bold text-dark">{data.date_from} to {data.date_to}</span>
                          </div>
                          <div className="d-flex justify-content-between">
                            <span className="text-muted">Working Days</span>
                            <span className="fw-bold text-dark">
                              {workedDays.reduce((acc: number, val: any) => acc + Number(val.number_of_days || 0), 0).toFixed(1)} Days
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Earnings & Deductions Tables */}
                <div className="row g-4 mb-4">
                  {/* Earnings Table */}
                  <div className="col-md-6">
                    <div className="border rounded overflow-hidden h-100">
                      <table className="table table-sm table-hover mb-0 fs-13">
                        <thead className="bg-soft-success">
                          <tr>
                            <th className="py-2 ps-3 text-success">Earnings</th>
                            <th className="text-end py-2 pe-3 text-success">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {earnings.map((item: any, i: number) => (
                            <tr key={i}>
                              <td className="ps-3 fw-medium text-dark">{item.name}</td>
                              <td className="text-end pe-3 text-muted">{item.total.toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot className="bg-light">
                          <tr>
                            <td className="ps-3 py-2 fw-bold text-dark">Gross Earnings</td>
                            <td className="text-end pe-3 py-2 fw-bold text-success">
                              {totalEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>

                  {/* Deductions Table */}
                  <div className="col-md-6">
                    <div className="border rounded overflow-hidden h-100">
                      <table className="table table-sm table-hover mb-0 fs-13">
                        <thead className="bg-soft-danger">
                          <tr>
                            <th className="py-2 ps-3 text-danger">Deductions</th>
                            <th className="text-end py-2 pe-3 text-danger">Amount</th>
                          </tr>
                        </thead>
                        <tbody>
                          {deductions.length > 0 ? (
                            deductions.map((item: any, i: number) => (
                              <tr key={i}>
                                <td className="ps-3 fw-medium text-dark">{item.name}</td>
                                <td className="text-end pe-3 text-muted">{Math.abs(item.total).toLocaleString(undefined, { minimumFractionDigits: 2 })}</td>
                              </tr>
                            ))
                          ) : (
                            <tr>
                              <td colSpan={2} className="text-center text-muted py-3 small fst-italic">No deductions</td>
                            </tr>
                          )}
                        </tbody>
                        <tfoot className="bg-light">
                          <tr>
                            <td className="ps-3 py-2 fw-bold text-dark">Total Deductions</td>
                            <td className="text-end pe-3 py-2 fw-bold text-danger">
                              {totalDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                            </td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  </div>
                </div>

                {/* Final Net Amount */}
                <div className="card bg-primary text-white border-0 shadow-sm rounded-3 mt-2">
                  <div className="card-body p-4 d-flex justify-content-between align-items-center">
                    <div>
                      <p className="text-white-50 fs-12 text-uppercase fw-bold mb-1 tracking-wider">
                        Net Salary Payable
                      </p>
                      <h2 className="text-white fw-black mb-0 display-6">
                        {data.currency} {netSalaryAmount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </h2>
                    </div>
                    <div className="bg-white bg-opacity-25 p-3 rounded-circle d-none d-sm-flex align-items-center justify-content-center">
                      <i className="ti ti-wallet fs-1"></i>
                    </div>
                  </div>
                </div>

              </div>
            </div>

            <div className="modal-footer border-top-0 bg-light py-3">
              <button type="button" className="btn btn-outline-secondary px-4 fw-medium" data-bs-dismiss="modal">
                Close View
              </button>
              <button type="button" className="btn btn-primary px-4 shadow-sm fw-medium d-flex align-items-center gap-2" onClick={handlePrint}>
                <i className="ti ti-printer fs-18"></i> Print / Save PDF
              </button>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body,
  );
};

export default ViewPayslipModal;
