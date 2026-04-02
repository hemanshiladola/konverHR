import React, { useEffect } from "react";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { createPortal } from "react-dom";

interface Props {
  data: any | null;
  onClose: () => void;
}

const ViewPayslipModal: React.FC<Props> = ({ data, onClose }) => {
  // AUTO-OPEN LOGIC: Ensures the modal opens on the first click
  useEffect(() => {
    if (data) {
      const modalElement = document.getElementById("view_payslip_modal");
      if (modalElement) {
        const modal = new (window as any).bootstrap.Modal(modalElement);
        modal.show();

        const handleHidden = () => {
          onClose();
          // Remove the backdrop manually to prevent UI freezing
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

  // 1. Filter Financial Lines
  const earnings =
    data.line_ids?.filter((l: any) =>
      ["Basic", "Allowance", "Other Allowance"].includes(l.category),
    ) || [];

  const deductions =
    data.line_ids?.filter((l: any) => l.category === "Deduction") || [];

  const totalEarnings = earnings.reduce(
    (sum: number, item: any) => sum + item.total,
    0,
  );
  const totalDeductions = deductions.reduce(
    (sum: number, item: any) => sum + Math.abs(item.total),
    0,
  );

  // 2. Attendance Data
  const workedDays = data.worked_days_line_ids || [];

  return createPortal(
    <div
      className="modal fade"
      id="view_payslip_modal"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-bottom bg-light py-2">
            <h5 className="modal-title fw-bold fs-14 text-dark">
              <i className="ti ti-file-description me-2 text-primary"></i>
              Payslip Reference: {data.number || "Draft"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              aria-label="Close"
            ></button>
          </div>

          <div className="modal-body p-4">
            <div id="printableArea">
              {/* Header: Company Info */}
              <div className="row align-items-center mb-4">
                <div className="col-6">
                  <ImageWithBasePath
                    src="assets/img/logo.svg"
                    className="img-fluid mb-2"
                    alt="Logo"
                  />
                  <h5 className="fw-bold mb-0">Pixelytics Solution</h5>
                  <p className="text-muted small mb-0">
                    Ahmedabad, Gujarat, India
                  </p>
                </div>
                <div className="col-6 text-end">
                  <h3 className="text-primary fw-bold mb-1">PAYSLIP</h3>
                  <p className="mb-0 fw-bold">
                    Period: {data.date_from} to {data.date_to}
                  </p>
                  <span className="badge bg-soft-info text-info border border-info px-3">
                    Status: {data.state?.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Employee & Attendance Grid */}
              <div className="row g-3 mb-4">
                <div className="col-md-7">
                  <div className="border rounded p-3 bg-light h-100">
                    <h6 className="text-uppercase fw-bold text-muted small border-bottom pb-2 mb-2">
                      Employee Details
                    </h6>
                    <div className="row">
                      <div className="col-4 text-muted small">Name:</div>
                      <div className="col-8 fw-bold text-dark">
                        {data.employee_name}
                      </div>
                      <div className="col-4 text-muted small">ID:</div>
                      <div className="col-8 fw-bold text-dark">
                        {data.employee_id}
                      </div>
                      <div className="col-4 text-muted small">Dept:</div>
                      <div className="col-8 fw-bold text-dark">
                        {data.department}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="col-md-5">
                  <div className="border rounded p-3 bg-light h-100">
                    <h6 className="text-uppercase fw-bold text-muted small border-bottom pb-2 mb-2">
                      Attendance Summary
                    </h6>
                    <table className="table table-sm table-borderless mb-0 fs-12">
                      <thead>
                        <tr className="text-muted">
                          <th>Description</th>
                          <th className="text-center">Days</th>
                          <th className="text-end">Hours</th>
                        </tr>
                      </thead>
                      <tbody>
                        {workedDays.map((day: any, i: number) => (
                          <tr key={i}>
                            <td className="fw-medium">{day.name}</td>
                            <td className="text-center">
                              {Number(day.number_of_days).toFixed(1)}
                            </td>
                            <td className="text-end">
                              {Number(day.number_of_hours).toFixed(1)}h
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="row mb-4">
                <div className="col-md-6">
                  <table className="table table-bordered fs-13 mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2">Earnings</th>
                        <th className="text-end py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {earnings.map((item: any, i: number) => (
                        <tr key={i}>
                          <td className="text-muted">{item.name}</td>
                          <td className="text-end fw-medium">
                            {item.total.toLocaleString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td>Gross Earnings</td>
                        <td className="text-end text-success">
                          {totalEarnings.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>

                <div className="col-md-6">
                  <table className="table table-bordered fs-13 mb-0">
                    <thead className="table-light">
                      <tr>
                        <th className="py-2">Deductions</th>
                        <th className="text-end py-2">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {deductions.length > 0 ? (
                        deductions.map((item: any, i: number) => (
                          <tr key={i}>
                            <td className="text-muted">{item.name}</td>
                            <td className="text-end fw-medium text-danger">
                              {Math.abs(item.total).toLocaleString()}
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td
                            colSpan={2}
                            className="text-center text-muted py-3 small italic"
                          >
                            No deductions this month
                          </td>
                        </tr>
                      )}
                    </tbody>
                    <tfoot className="table-light fw-bold">
                      <tr>
                        <td>Total Deductions</td>
                        <td className="text-end text-danger">
                          {totalDeductions.toLocaleString()}
                        </td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </div>

              {/* Final Net Wage Section */}
              <div className="card bg-primary border-0 shadow-sm">
                <div className="card-body p-3 d-flex justify-content-between align-items-center">
                  <div>
                    <p className="text-white-50 small text-uppercase fw-bold mb-0">
                      Net Amount Payable
                    </p>
                    <h2 className="text-white fw-bolder mb-0">
                      {data.currency}{" "}
                      {data.net_wage?.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </h2>
                  </div>
                  <div className="text-end text-white">
                    <i className="ti ti-wallet fs-40 opacity-25"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer bg-light border-top-0">
            <button
              type="button"
              className="btn btn-outline-secondary px-4"
              data-bs-dismiss="modal"
            >
              Close
            </button>
            <button
              type="button"
              className="btn btn-primary px-4 shadow-sm"
              onClick={() => window.print()}
            >
              <i className="ti ti-printer me-2"></i>Print Payslip
            </button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default ViewPayslipModal;
