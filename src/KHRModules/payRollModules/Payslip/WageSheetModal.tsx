import React, { useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { toast } from "react-toastify";
import { downloadWageSheet } from "./PayslipServices";
import { createPortal } from "react-dom";

interface WageSheetModalProps {
  show: boolean;
  onClose: () => void;
}



const WageSheetModal: React.FC<WageSheetModalProps> = ({ show, onClose }) => {
  const [selectedMonth, setSelectedMonth] = useState<dayjs.Dayjs | null>(null);
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const modalRef = React.useRef<HTMLDivElement>(null);

  const validate = () => {
    const tempErrors: any = {};
    let isValid = true;

    if (!selectedMonth) {
      tempErrors.month = "Please select a month";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!validate()) {
      toast.error("Please select a month.");
      return;
    }

    const start_date = selectedMonth!.startOf("month").format("YYYY-MM-DD");
    const end_date = selectedMonth!.endOf("month").format("YYYY-MM-DD");

    setLoading(true);
    try {
      const response = await downloadWageSheet({ start_date, end_date });

      const contentType = response.headers?.["content-type"] || "";
      const isExcel =
        contentType.includes("spreadsheet") ||
        contentType.includes("excel") ||
        contentType.includes("xlsx");

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute(
        "download",
        `wage_sheet_${start_date}_to_${end_date}.${isExcel ? "xlsx" : "pdf"}`
      );
      document.body.appendChild(link);
      link.click();
      link.parentNode?.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Wage sheet downloaded successfully");
      handleClose();
    } catch (err: any) {
      toast.error(err.message || "Failed to download wage sheet");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (loading) return;
    setSelectedMonth(null);
    setErrors({});
    setIsSubmitted(false);
    onClose();
  };

  if (!show) return null;

  return createPortal(
    <>
      <div className="modal-backdrop fade show" onClick={handleClose} />

      <div
        className="modal fade show d-block"
        role="dialog"
        tabIndex={-1}
        style={{ zIndex: 1055 }}
      >
        <div className="modal-dialog modal-dialog-centered" style={{ maxWidth: "480px" }}>
          <div
            className="modal-content border-0 shadow-lg"
            ref={modalRef}
            style={{ overflow: "visible", position: "relative" }}
          >
            {/* Header */}
            <div className="modal-header border-bottom bg-light py-2">
              <h5 className="modal-title fw-bold fs-15">
                <i className="ti ti-table-export me-2 text-primary"></i>
                Download Wage Sheet
              </h5>
              <button
                type="button"
                className="btn-close"
                onClick={handleClose}
                disabled={loading}
              />
            </div>

            <div className="modal-body p-4">
              {/* Step pill */}
              <div className="d-flex justify-content-center mb-4">
                <div className="bg-light p-1 rounded-pill border d-flex gap-2">
                  <span className="px-4 py-1 rounded-pill fs-11 fw-bold text-uppercase bg-primary text-white shadow-sm">
                    1. Select Month
                  </span>
                  <span
                    className={`px-4 py-1 rounded-pill fs-11 fw-bold text-uppercase ${
                      loading ? "bg-warning text-dark shadow-sm" : "text-muted"
                    }`}
                  >
                    2. Download File
                  </span>
                </div>
              </div>

              <form onSubmit={handleSubmit} noValidate>
                <div className="row g-3 mb-4 p-3 rounded border bg-white">

                  {/* Month Picker */}
                  <div className="col-12">
                    <label
                      className={`form-label fs-13 fw-bold ${
                        isSubmitted && errors.month ? "text-danger" : ""
                      }`}
                    >
                      Select Month <span className="text-danger">*</span>
                    </label>
                    <DatePicker
                      picker="month"
                      className={`w-100 ${
                        isSubmitted && errors.month ? "border-danger" : ""
                      }`}
                      placeholder="Select month"
                      value={selectedMonth}
                      format="MMMM YYYY"
                      placement="bottomLeft"
                      getPopupContainer={() => modalRef.current || document.body}
                      disabledDate={(current) =>
                        current.isAfter(dayjs(), "month")
                      }
                      onChange={(date) => {
                        setSelectedMonth(date);
                        if (errors.month)
                          setErrors((prev: any) => ({ ...prev, month: null }));
                      }}
                      style={{ height: "40px" }}
                    />
                    {isSubmitted && errors.month && (
                      <div className="text-danger fw-medium fs-11 mt-1">
                        <i className="ti ti-alert-circle me-1"></i>
                        {errors.month}
                      </div>
                    )}
                  </div>

                  {/* Summary card — shown after month is selected */}
                  {selectedMonth && !errors.month && (
                    <div className="col-12">
                      <div className="card border shadow-none mb-0 animate__animated animate__fadeIn">
                        <div className="card-header bg-light-gray py-2 border-bottom d-flex justify-content-between">
                          <h6 className="mb-0 fs-13 fw-bold text-dark">
                            <i className="ti ti-calendar-event me-2 text-info"></i>
                            Selected Period
                          </h6>
                          <span className="badge bg-soft-info text-info">
                            {selectedMonth.daysInMonth()} Days
                          </span>
                        </div>
                        <div className="card-body py-2 px-3">
                          <div className="d-flex align-items-center gap-3 fs-13">
                            <span className="fw-bold text-dark">
                              {selectedMonth.startOf("month").format("DD MMM YYYY")}
                            </span>
                            <i className="ti ti-arrow-right text-muted"></i>
                            <span className="fw-bold text-dark">
                              {selectedMonth.endOf("month").format("DD MMM YYYY")}
                            </span>
                            <span className="ms-auto badge bg-soft-primary text-primary fs-11">
                              {selectedMonth.format("MMMM YYYY")}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                {/* Footer */}
                <div className="modal-footer border-0 px-0 mt-2 pb-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 me-2"
                    onClick={handleClose}
                    disabled={loading}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-5 shadow-sm text-white"
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" />
                        Generating...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-download me-2"></i>
                        Download Wage Sheet
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>,
    document.body
  );
};

export default WageSheetModal;
