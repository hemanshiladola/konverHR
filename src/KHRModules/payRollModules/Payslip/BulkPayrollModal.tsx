import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getDepartments } from "../../EmployeModules/Employee/EmployeeServices";
import { generateBulkPayroll } from "./PayslipServices";
import CommonSelect from "../../../core/common/commonSelect";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import { createPortal } from "react-dom";

interface BulkPayrollModalProps {
  onSuccess: () => void;
}

const BulkPayrollModal: React.FC<BulkPayrollModalProps> = ({ onSuccess }) => {
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    start_date: "",
    end_date: "",
    department_ids: [] as string[],
    is_all: false,
  });

  const [errors, setErrors] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);

  useEffect(() => {
    const fetchDepartments = async () => {
      setLoading(true);
      try {
        const depts = await getDepartments();
        const formatted = depts.map((d: any) => ({
          value: String(d.id || d.value),
          label: String(d.name || d.label),
        }));
        setDepartments(formatted);
      } catch (error) {
        toast.error("Failed to fetch departments");
      } finally {
        setLoading(false);
      }
    };
    fetchDepartments();
  }, []);

  const validate = () => {
    let newErrors: any = {};
    if (!formData.name.trim()) newErrors.name = "Name is required";
    if (!formData.start_date) newErrors.start_date = "Start Date is required";
    if (!formData.end_date) newErrors.end_date = "End Date is required";
    if (!formData.is_all && formData.department_ids.length === 0) {
      newErrors.department_ids = "Please select at least one department or check 'All Employees'";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSelectChange = (selectedOptions: any) => {
    const values = selectedOptions ? selectedOptions.map((opt: any) => opt.value) : [];
    setFormData({ ...formData, department_ids: values });
    if (errors.department_ids) setErrors({ ...errors, department_ids: "" });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!validate()) return;

    setIsProcessing(true);
    try {
      const payload: any = {
        name: formData.name,
        start_date: formData.start_date,
        end_date: formData.end_date,
        is_all: formData.is_all,
      };

      if (!formData.is_all) {
        payload.department_ids = formData.department_ids.map(Number);
      }

      await generateBulkPayroll(payload);

      toast.success("Bulk Payroll Generated Successfully!");
      document.getElementById("bulk-payroll-modal-close-btn")?.click();
      resetForm();
      setTimeout(() => {
        onSuccess();
      }, 500);
    } catch (error: any) {
      toast.error(error?.response?.data?.message || "Failed to generate bulk payroll.");
    } finally {
      setIsProcessing(false);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      start_date: "",
      end_date: "",
      department_ids: [],
      is_all: false,
    });
    setIsSubmitted(false);
    setErrors({});
  };

  return createPortal(
    <div
      className="modal fade"
      id="bulk_payroll_modal"
      tabIndex={-1}
      aria-hidden="true"
      data-bs-backdrop="static"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          <div className="modal-header border-bottom bg-light py-2">
            <h5 className="modal-title fw-bold fs-15">
              <i className="ti ti-calculator me-2 text-primary"></i>
              Bulk Payroll Wizard
            </h5>
            <button
              type="button"
              id="bulk-payroll-modal-close-btn"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={resetForm}
            ></button>
          </div>
          <div className="modal-body p-4">
            <form onSubmit={handleSubmit} noValidate>
              <div className="row g-3">
                <div className="col-md-12">
                  <label className="form-label fs-13 fw-bold">
                    Batch Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    className={`form-control ${isSubmitted && errors.name ? "is-invalid" : ""}`}
                    placeholder="e.g. October 2024 Payroll"
                    value={formData.name}
                    onChange={(e) => {
                      setFormData({ ...formData, name: e.target.value });
                      if (errors.name) setErrors({ ...errors, name: "" });
                    }}
                  />
                  {isSubmitted && errors.name && (
                    <div className="invalid-feedback">{errors.name}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fs-13 fw-bold">
                    Start Date <span className="text-danger">*</span>
                  </label>
                  <DatePicker
                    className={`w-100 form-control ${isSubmitted && errors.start_date ? "is-invalid" : ""}`}
                    value={formData.start_date ? dayjs(formData.start_date) : null}
                    onChange={(_, dateStr) => {
                      setFormData({ ...formData, start_date: dateStr as string });
                      if (errors.start_date) setErrors({ ...errors, start_date: "" });
                    }}
                  />
                  {isSubmitted && errors.start_date && (
                    <div className="invalid-feedback d-block">{errors.start_date}</div>
                  )}
                </div>

                <div className="col-md-6">
                  <label className="form-label fs-13 fw-bold">
                    End Date <span className="text-danger">*</span>
                  </label>
                  <DatePicker
                    className={`w-100 form-control ${isSubmitted && errors.end_date ? "is-invalid" : ""}`}
                    value={formData.end_date ? dayjs(formData.end_date) : null}
                    onChange={(_, dateStr) => {
                      setFormData({ ...formData, end_date: dateStr as string });
                      if (errors.end_date) setErrors({ ...errors, end_date: "" });
                    }}
                  />
                  {isSubmitted && errors.end_date && (
                    <div className="invalid-feedback d-block">{errors.end_date}</div>
                  )}
                </div>

                <div className="col-md-12">
                  <div className="form-check form-switch mb-3">
                    <input
                      className="form-check-input"
                      type="checkbox"
                      id="isAllCheck"
                      checked={formData.is_all}
                      onChange={(e) => {
                        setFormData({ ...formData, is_all: e.target.checked, department_ids: [] });
                        if (errors.department_ids) setErrors({ ...errors, department_ids: "" });
                      }}
                    />
                    <label className="form-check-label fs-13 fw-bold" htmlFor="isAllCheck">
                      Generate for All Employees
                    </label>
                  </div>

                  {!formData.is_all && (
                    <div className="mt-3">
                      <label className="form-label fs-13 fw-bold">
                        Select Departments <span className="text-danger">*</span>
                      </label>
                      <CommonSelect
                        isMulti={true}
                        options={departments}
                        className={isSubmitted && errors.department_ids ? "is-invalid" : ""}
                        placeholder="Choose departments..."
                        value={departments.filter((d) => formData.department_ids.includes(d.value))}
                        onChange={handleSelectChange}
                      />
                      {isSubmitted && errors.department_ids && (
                        <div className="text-danger small mt-1">{errors.department_ids}</div>
                      )}
                    </div>
                  )}
                </div>
              </div>

              <div className="modal-footer border-0 px-0 mt-4 pb-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 me-2"
                  data-bs-dismiss="modal"
                  onClick={resetForm}
                  disabled={isProcessing}
                >
                  Discard
                </button>
                <button type="submit" className="btn btn-primary px-5 shadow-sm text-white" disabled={isProcessing}>
                  {isProcessing ? (
                    <span className="spinner-border spinner-border-sm me-2" role="status"></span>
                  ) : (
                    <i className="ti ti-calculator me-2"></i>
                  )}
                  {isProcessing ? "Generating..." : "Generate Payroll"}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default BulkPayrollModal;
