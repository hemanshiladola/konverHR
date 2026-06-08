import React, { useEffect, useState } from "react";
import { DatePicker } from "antd";
import dayjs from "dayjs";
import CommonSelect from "../../../core/common/commonSelect";
import { toast } from "react-toastify";
import { createPayslip, computePayslip } from "./PayslipServices";
import { getEmployeesBasicInfo } from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
import { getContracts } from "@/KHRModules/EmployeeContract/contractService";
import { createPortal } from "react-dom";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  data: any | null;
}

const AddEditPayslipModal: React.FC<Props> = ({
  onSuccess,
  onClose,
  data,
}: any) => {
  const modalRef = React.useRef<HTMLDivElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [currentStep, setCurrentStep] = useState<"create" | "compute">(
    "create",
  );
  const [payslipId, setPayslipId] = useState<number | null>(null);
  const [computedData, setComputedData] = useState<any>(null);
  const [createdSlipData, setCreatedSlipData] = useState<any>(null);
  const [errors, setErrors] = useState<any>({});
  const [dropdowns, setDropdowns] = useState<any>({
    employees: [],
    contracts: [],
  });

  const initialFormState = {
    name: "",
    employee_id: "",
    contract_id: "",
    date_from: dayjs().startOf("month").format("YYYY-MM-DD"),
    date_to: dayjs().endOf("month").format("YYYY-MM-DD"),
  };

  const [formData, setFormData] = useState<any>(initialFormState);

  useEffect(() => {
    const loadDropdownData = async () => {
      try {
        const [e, c] = await Promise.all([
          getEmployeesBasicInfo(),
          getContracts(),
        ]);
        setDropdowns({
          employees: Array.isArray(e)
            ? e.map((i: any) => ({ value: i.id, label: i.name, raw: i }))
            : [],
          contracts: Array.isArray(c)
            ? c.map((i: any) => ({
              value: i.contract_id || i.id,
              label: i.name,
            }))
            : [],
        });
      } catch (error) {
        console.error(error);
      }
    };
    loadDropdownData();
  }, []);

  useEffect(() => {
    return () => {
      // Runs when component unmounts
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((b) => b.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const modalEl = modalRef.current;
    if (modalEl) {
      const handleHidden = () => {
        setFormData(initialFormState);
        setCurrentStep("create");
        setCreatedSlipData(null);
        setComputedData(null);
        setErrors({});
        setIsSubmitted(false);
        setIsSubmitting(false);
        onClose();
      };

      modalEl.addEventListener("hidden.bs.modal", handleHidden);
      return () => {
        modalEl.removeEventListener("hidden.bs.modal", handleHidden);
      };
    }
  }, [onClose]);

  // const handleEmployeeChange = (opt: any) => {
  //   const employeeName = opt?.label || "";
  //   const month = dayjs(formData.date_from).format("MMM YYYY");
  //   setFormData((prev: any) => ({
  //     ...prev,
  //     employee_id: opt?.value || "",
  //     name: opt ? `Salary Slip of ${employeeName} for ${month}` : "",
  //   }));
  // };

  // 🔥 NEW: Text boundary handler (prevents leading spaces & enforces max length)
  const handleTextChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxLength: number = 100,
  ) => {
    const { name, value } = e.target;

    // Aggressively remove leading spaces
    const sanitizedValue = value.replace(/^\s+/, "");

    // Enforce max length
    if (sanitizedValue.length > maxLength) return;

    setFormData((prev: any) => ({ ...prev, [name]: sanitizedValue }));

    // Clear specific field error the moment the user types
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const validate = () => {
    const newErrors: any = {};
    if (!formData.employee_id) newErrors.employee_id = "Employee is required.";
    if (!formData.name?.trim()) newErrors.name = "Reference Name is required.";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleEmployeeChange = (opt: any) => {
    const employeeName = opt?.label || "";
    const month = dayjs(formData.date_from).format("MMM YYYY");
    const empContractId = opt?.raw?.contract_id;
    const contractIdToSet =
      empContractId && empContractId !== false ? String(empContractId) : "";

    setFormData((prev: any) => ({
      ...prev,
      employee_id: opt?.value || "",
      contract_id: Number.isInteger(Number(contractIdToSet))
        ? Number(contractIdToSet)
        : null,
      name: opt ? `Salary Slip of ${employeeName} for ${month}` : "",
    }));
    // Clear errors when user selects an employee
    if (errors.employee_id)
      setErrors((prev: any) => ({ ...prev, employee_id: null }));
    if (errors.name) setErrors((prev: any) => ({ ...prev, name: null }));
  };

  const updateField = (name: string, value: any) => {
    setFormData((prev: any) => ({ ...prev, [name]: value }));

    // Clear specific field error the moment the user types
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name]; // Completely removes the error key
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (currentStep === "create") {
        setIsSubmitted(true);

        if (!validate()) {
          toast.error("Please fill in the required fields.");
          return;
        }

        if (!formData.name || !formData.employee_id) return;
        setIsSubmitting(true);
        const response = await createPayslip({
          ...formData,
          employee_id: Number(formData.employee_id),
        });
        setCreatedSlipData(response.data?.data);
        setPayslipId(response.data?.data?.id);
        setCurrentStep("compute");
        onSuccess();
      } else {
        setIsSubmitting(true);
        const res = await computePayslip(payslipId!);
        setComputedData(res.data?.data);
        onSuccess();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.message || "Operation failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  // const resetAndClose = () => {
  //   setFormData(initialFormState);
  //   setCurrentStep("create");
  //   setCreatedSlipData(null);
  //   setComputedData(null);
  //   onClose();
  // };

  const resetAndClose = () => {
    // 1. Get or Create the Bootstrap Modal instance
    const modalElement = document.getElementById("add_payslip_modal");
    if (modalElement) {
      const modalInstance = (
        window as any
      ).bootstrap?.Modal.getOrCreateInstance(modalElement);
      if (modalInstance) {
        modalInstance.hide(); // Triggers the slide/fade out animation
      }
    }

    // 2. Wait for the animation (150ms) before removing the component from the DOM
    setTimeout(() => {
      // 3. NUCLEAR CLEANUP: Force remove any stuck backdrops and reset body scrolling
      const backdrops = document.querySelectorAll(".modal-backdrop");
      backdrops.forEach((b) => b.remove());
      document.body.classList.remove("modal-open");
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";

      // 4. Reset React state and notify parent
      setFormData(initialFormState);
      setCurrentStep("create");
      setCreatedSlipData(null);
      setComputedData(null);
      onClose();
    }, 150);
  };

  // Helper for Category Styling
  const getCategoryStyle = (cat: string) => {
    const map: any = {
      Basic: "bg-soft-primary text-primary",
      Allowance: "bg-soft-success text-success",
      Deduction: "bg-soft-danger text-danger",
    };
    return `badge fs-10 px-2 fw-bold ${map[cat] || "bg-soft-secondary text-secondary"}`;
  };

  return createPortal(
    <div
      className="modal fade"
      id="add_payslip_modal"
      ref={modalRef}
      role="dialog"
      tabIndex={-1}
      aria-hidden="true"
    >
      <div className="modal-dialog modal-dialog-centered modal-lg">
        <div className="modal-content border-0 shadow-lg">
          {/* ORIGINAL HEADER PRESERVED */}
          <div className="modal-header border-bottom bg-light py-2">
            <h5 className="modal-title fw-bold fs-15">
              <i className="ti ti-receipt-2 me-2 text-primary"></i>
              {currentStep === "create"
                ? "Process New Payslip"
                : `Payslip #${payslipId}`}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={resetAndClose}
            ></button>
          </div>

          <div className="modal-body p-4">
            {/* Step Indicators */}
            <div className="d-flex justify-content-center mb-4">
              <div className="bg-light p-1 rounded-pill border d-flex gap-2">
                <span
                  className={`px-4 py-1 rounded-pill fs-11 fw-bold text-uppercase ${currentStep === "create" ? "bg-primary text-white shadow-sm" : "text-muted"}`}
                >
                  1. Create Draft
                </span>
                <span
                  className={`px-4 py-1 rounded-pill fs-11 fw-bold text-uppercase ${currentStep === "compute" ? "bg-warning text-dark shadow-sm" : "text-muted"}`}
                >
                  2. Compute Salary
                </span>
              </div>
            </div>

            <form onSubmit={handleSubmit} noValidate>
              {/* INPUT SECTION: Compacted once results are shown */}
              <div
                className={`row g-3 mb-4 p-3 rounded border bg-white ${computedData ? "d-none" : ""}`}
              >
                <div className="col-md-6">
                  <label
                    className={`form-label fs-13 fw-bold ${isSubmitted && errors.employee_id ? "text-danger" : ""}`}
                  >
                    {" "}
                    Employee <span className="text-danger">*</span>
                  </label>
                  <div
                    className={
                      isSubmitted && errors.employee_id
                        ? "border border-danger rounded shadow-sm"
                        : ""
                    }
                  >
                    <CommonSelect
                      disabled={currentStep !== "create"}
                      options={dropdowns.employees}
                      value={dropdowns.employees.find(
                        (o: any) =>
                          String(o.value) === String(formData.employee_id),
                      )}
                      onChange={handleEmployeeChange}
                    />
                  </div>
                  {isSubmitted && errors.employee_id && (
                    <div className="text-danger fw-medium fs-11 mt-1">
                      {errors.employee_id}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13 fw-bold">Contract</label>
                  <CommonSelect
                    disabled={
                      currentStep !== "create" || !!formData.employee_id
                    }
                    options={dropdowns.contracts}
                    value={dropdowns.contracts.find(
                      (o: any) =>
                        String(o.value) === String(formData.contract_id),
                    )}
                    onChange={(opt: any) =>
                      updateField("contract_id", opt?.value)
                    }
                  />
                </div>

                <div className="col-md-12">
                  <label
                    className={`form-label fs-13 fw-bold ${isSubmitted && errors.name ? "text-danger" : ""}`}
                  >
                    {" "}
                    Reference Name <span className="text-danger">*</span>
                  </label>
                  <input
                    disabled={currentStep !== "create"}
                    name="name"
                    className={`form-control ${isSubmitted && errors.name ? "is-invalid border-danger shadow-sm" : ""}`}
                    value={formData.name}
                    // onChange={(e) => updateField("name", e.target.value)}
                    onChange={(e) => handleTextChange(e, 100)} // 🔥 Use the new text handler
                    maxLength={100}
                  />
                  {isSubmitted && errors.name && (
                    <div className="invalid-feedback d-block fw-medium mt-1">
                      {errors.name}
                    </div>
                  )}
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13 fw-bold">
                    Period From
                  </label>
                  <DatePicker
                    disabled={currentStep !== "create"}
                    className="w-100"
                    value={dayjs(formData.date_from)}
                    onChange={(_, d) => updateField("date_from", String(d))}
                  />
                </div>
                <div className="col-md-6">
                  <label className="form-label fs-13 fw-bold">Period To</label>
                  <DatePicker
                    disabled={currentStep !== "create"}
                    className="w-100"
                    value={dayjs(formData.date_to)}
                    onChange={(_, d) => updateField("date_to", String(d))}
                  />
                </div>
              </div>

              {/* WORKED DAYS SUMMARY */}
              {createdSlipData && (
                <div className="card border shadow-none mb-4 animate__animated animate__fadeIn">
                  <div className="card-header bg-light-gray py-2 border-bottom d-flex justify-content-between">
                    <h6 className="mb-0 fs-13 fw-bold text-dark">
                      <i className="ti ti-calendar-event me-2 text-info"></i>
                      Attendance Verified
                    </h6>
                    <span className="badge bg-soft-info text-info">
                      Step 1 Complete
                    </span>
                  </div>
                  <div className="table-responsive">
                    <table className="table table-sm table-hover mb-0 fs-12">
                      <thead className="table-light">
                        <tr>
                          <th className="ps-3">Work Description</th>
                          <th className="text-center">Days</th>
                          <th className="text-center">Hours</th>
                          <th className="text-end pe-3">Draft Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {createdSlipData.worked_days.map(
                          (item: any, i: number) => (
                            <tr key={i}>
                              <td className="ps-3 fw-medium">
                                {item.work_entry_type_name}
                              </td>
                              <td className="text-center">
                                {Number(item.number_of_days || 0).toFixed(
                                  2,
                                )}{" "}
                              </td>
                              <td className="text-center text-muted">
                                {Number(item.number_of_hours || 0).toFixed(2)}
                                h{" "}
                              </td>
                              <td className="text-end pe-3 fw-bold">
                                {item.currency} {item.amount?.toLocaleString()}
                              </td>
                            </tr>
                          ),
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* SALARY COMPUTATION BREAKDOWN */}
              {computedData && (
                <div className="animate__animated animate__fadeInUp">
                  <div className="card border shadow-none mb-4 overflow-hidden">
                    <div className="card-header bg-soft-primary py-2 border-bottom">
                      <h6 className="mb-0 fs-13 fw-bold text-primary">
                        <i className="ti ti-report-money me-2"></i>Earnings &
                        Deductions
                      </h6>
                    </div>
                    <div className="table-responsive">
                      <table className="table table-sm table-striped mb-0 fs-12">
                        <thead>
                          <tr className="bg-light">
                            <th className="ps-3">Category</th>
                            <th>Description</th>
                            <th className="text-end pe-3">Total Amount</th>
                          </tr>
                        </thead>
                        {/* <tbody>
                          {computedData.salary_lines
                            .filter((l: any) => l.code !== "Net")
                            .map((line: any, i: number) => (
                              <tr key={i}> */}
                        <tbody>
                          {computedData.salary_lines
                            .filter((l: any) => l.code !== "Net" && Number(l.total) !== 0)
                            .sort((a: any, b: any) => {
                              const order: any = {
                                Allowance: 1,
                                Deduction: 2,
                                Net: 3,
                              };

                              return (order[a.category] || 999) - (order[b.category] || 999);
                            })
                            .map((line: any, i: number) => (
                              <tr key={i}>
                                <td className="ps-3">
                                  <span
                                    className={getCategoryStyle(line.category)}
                                  >
                                    {line.category}
                                  </span>
                                </td>
                                <td className="fw-medium text-dark">
                                  {line.name}
                                </td>
                                <td className="text-end pe-3 fw-bold">
                                  {line.currency}{" "}
                                  {line.total?.toLocaleString(undefined, {
                                    minimumFractionDigits: 2,
                                  })}
                                </td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* HIGH IMPACT NET SALARY CARD */}
                  <div className="card bg-primary text-white shadow-sm border-0 mb-2">
                    <div className="card-body d-flex justify-content-between align-items-center py-3">
                      <div>
                        <p className="mb-0 opacity-75 fs-11 fw-bold text-uppercase tracking-wider">
                          Final Net Payable
                        </p>
                        <h2 className="mb-0 fw-bolder">
                          {computedData.salary_lines.find((l: any) => l.code === "Net")?.currency || "INR"}{" "}
                          {(computedData.salary_lines.find((l: any) => l.code === "Net")?.total || 0).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </h2>
                      </div>
                      <div className="bg-white bg-opacity-25 p-3 rounded-circle">
                        <i className="ti ti-wallet fs-24"></i>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="modal-footer border-0 px-0 mt-4 pb-0">
                <button
                  type="button"
                  className="btn btn-outline-secondary px-4 me-2"
                  data-bs-dismiss="modal"
                  onClick={resetAndClose}
                >
                  {computedData ? "Close" : "Discard"}
                </button>
                {!computedData && (
                  <button
                    type="submit"
                    className={`btn px-5 shadow-sm text-white ${currentStep === "create" ? "btn-primary" : "btn-warning"}`}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <span className="spinner-border spinner-border-sm me-2"></span>
                    ) : (
                      <i
                        className={`ti ${currentStep === "create" ? "ti-save" : "ti-calculator"} me-2`}
                      ></i>
                    )}
                    {currentStep === "create"
                      ? "Save & Create Draft"
                      : "Compute Salary Now"}
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
};

export default AddEditPayslipModal;

// import React, { useEffect, useState } from "react";
// import { DatePicker } from "antd";
// import dayjs from "dayjs";
// import CommonSelect from "../../../core/common/commonSelect";
// import { toast } from "react-toastify";
// import {
//   createPayslip,
//   computePayslip,
//   confirmPayslip,
//   markPaidPayslip,
// } from "./PayslipServices";
// import { getEmployeesBasicInfo } from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
// import { getContracts } from "@/KHRModules/EmployeeContract/contractService";

// interface Props {
//   onSuccess: () => void;
//   onClose: () => void;
//   data: any | null;
// }

// const AddEditPayslipModal: React.FC<Props> = ({ onSuccess, onClose, data }) => {
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [isSubmitted, setIsSubmitted] = useState(false);

//   // Workflow Steps: 'create' | 'compute' | 'confirm' | 'pay'
//   const [currentStep, setCurrentStep] = useState<
//     "create" | "compute" | "confirm" | "pay"
//   >("create");
//   const [payslipId, setPayslipId] = useState<number | null>(null);
//   const [computedData, setComputedData] = useState<any>(null);
//   const [createdSlipData, setCreatedSlipData] = useState<any>(null);
//   const [errors, setErrors] = useState<any>({});
//   const [dropdowns, setDropdowns] = useState<any>({
//     employees: [],
//     contracts: [],
//     contracts_raw: [],
//     structures: [],
//   });

//   const initialFormState = {
//     name: "",
//     employee_id: "",
//     contract_id: "",
//     // struct_id: "",
//     date_from: dayjs().startOf("month").format("YYYY-MM-DD"),
//     date_to: dayjs().endOf("month").format("YYYY-MM-DD"),
//     // employee_code: "",
//   };

//   const [formData, setFormData] = useState<any>(initialFormState);

//   useEffect(() => {
//     const loadDropdownData = async () => {
//       try {
//         const [e, c, s] = await Promise.all([
//           getEmployeesBasicInfo(),
//           getContracts(),
//         ]);

//         setDropdowns({
//           employees: Array.isArray(e)
//             ? e.map((i: any) => ({ value: i.id, label: i.name }))
//             : [],
//           contracts: Array.isArray(c)
//             ? c.map((i: any) => ({
//                 value: i.contract_id || i.id,
//                 label: i.name,
//               }))
//             : [],
//           contracts_raw: c || [],
//           structures: Array.isArray(s)
//             ? s.map((i: any) => ({ value: i.id, label: i.name }))
//             : [],
//         });
//       } catch (error) {
//         console.error("Dropdown error", error);
//       }
//     };
//     loadDropdownData();
//   }, []);

//   const updateField = (name: string, value: any) => {
//     setFormData((prev: any) => ({ ...prev, [name]: value }));
//     if (errors[name]) {
//       setErrors((prev: any) => {
//         const newErrors = { ...prev };
//         delete newErrors[name];
//         return newErrors;
//       });
//     }
//   };

//   const validateForm = () => {
//     let tempErrors: any = {};
//     if (!formData.name?.trim()) tempErrors.name = "Payslip title is required.";
//     if (!formData.employee_id)
//       tempErrors.employee_id = "Please select an employee.";
//     if (!formData.date_from) tempErrors.date_from = "Start date is required.";
//     setErrors(tempErrors);
//     return Object.keys(tempErrors).length === 0;
//   };

//   // Update this inside your AddEditPayslipModal.tsx
//   const handleEmployeeChange = (opt: any) => {
//     const employeeId = opt?.value || "";
//     const employeeName = opt?.label || "";

//     // Generate a default name: "Salary Slip of [Name] for [Month] [Year]"
//     const monthName = dayjs(formData.date_from).format("MMM");
//     const yearName = dayjs(formData.date_from).format("YYYY");
//     const defaultTitle = `Salary Slip of ${employeeName} for ${monthName} ${yearName}`;

//     setFormData((prev: any) => ({
//       ...prev,
//       employee_id: employeeId,
//       name: defaultTitle,
//     }));

//     if (errors.employee_id) {
//       setErrors((prev: any) => {
//         const { employee_id, ...rest } = prev;
//         return rest;
//       });
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();

//     try {
//       if (currentStep === "create") {
//         setIsSubmitted(true);
//         if (!validateForm()) {
//           toast.error("Please fill mandatory fields");
//           return;
//         }
//         setIsSubmitting(true);
//         const payload = {
//           ...formData,
//           employee_id: Number(formData.employee_id),
//           contract_id: formData.contract_id
//             ? Number(formData.contract_id)
//             : null,
//           // struct_id: formData.struct_id ? Number(formData.struct_id) : null,
//         };
//         const response = await createPayslip(payload);
//         const slipData = response.data?.data; // Extract the data object
//         setPayslipId(response.data?.payslip_id);
//         setCurrentStep("compute");
//         toast.success("Step 1: Created successfully!");
//         onSuccess();
//       } else if (currentStep === "compute") {
//         setIsSubmitting(true);
//         const res = await computePayslip(payslipId!);
//         setComputedData(res.data?.data || res.data);
//         setCurrentStep("confirm");
//         toast.success("Step 2: Computed successfully!");
//       } else if (currentStep === "confirm") {
//         setIsSubmitting(true);
//         await confirmPayslip(payslipId!);
//         setCurrentStep("pay");
//         toast.success("Step 3: Confirmed!");
//       } else if (currentStep === "pay") {
//         setIsSubmitting(true);
//         await markPaidPayslip(payslipId!);
//         toast.success("Step 4: Finalized successfully!");
//         onSuccess();
//         resetAndClose(); // FULL CLOSE AND CLEAR
//       }
//     } catch (error: any) {
//       toast.error(error.response?.data?.message || "Action failed");
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   const resetAndClose = () => {
//     setFormData(initialFormState);
//     setCurrentStep("create");
//     setPayslipId(null);
//     setCreatedSlipData(null);
//     setComputedData(null);
//     setIsSubmitted(false);
//     setErrors({});
//     onClose();
//   };

//   const getButtonConfig = () => {
//     switch (currentStep) {
//       case "create":
//         return {
//           text: "Save & Create Draft",
//           class: "btn-primary",
//           icon: "ti-save",
//         };
//       case "compute":
//         return {
//           text: "Compute Now",
//           class: "btn-warning",
//           icon: "ti-calculator",
//         };
//       case "confirm":
//         return { text: "Confirm Details", class: "btn-info", icon: "ti-check" };
//       case "pay":
//         return {
//           text: "Finalize Payment",
//           class: "btn-success",
//           icon: "ti-coin",
//         };
//     }
//   };

//   const btn = getButtonConfig();

//   return (
//     <div className="modal fade" id="add_payslip_modal" role="dialog">
//       <div className="modal-dialog modal-dialog-centered modal-lg">
//         <div className="modal-content bg-white border-0 shadow-lg">
//           <div className="modal-header border-bottom bg-light py-2">
//             <h5 className="modal-title fw-bold fs-15">
//               <i className="ti ti-receipt-2 me-2 text-primary"></i>
//               {currentStep === "create"
//                 ? "Process New Payslip"
//                 : `Payslip #${payslipId}`}
//             </h5>
//             <button
//               type="button"
//               className="btn-close"
//               onClick={resetAndClose}
//             ></button>
//           </div>

//           <div className="modal-body p-4">
//             {/* Step Indicators */}
//             <div className="d-flex justify-content-between mb-4 bg-light p-2 rounded border small fw-bold text-uppercase">
//               <div
//                 className={`px-2 py-1 rounded ${currentStep === "create" ? "bg-primary text-white" : "text-muted"}`}
//               >
//                 1. Create
//               </div>
//               <div
//                 className={`px-2 py-1 rounded ${currentStep === "compute" ? "bg-warning text-dark" : "text-muted"}`}
//               >
//                 2. Compute
//               </div>
//               <div
//                 className={`px-2 py-1 rounded ${currentStep === "confirm" ? "bg-info text-white" : "text-muted"}`}
//               >
//                 3. Confirm
//               </div>
//               <div
//                 className={`px-2 py-1 rounded ${currentStep === "pay" ? "bg-success text-white" : "text-muted"}`}
//               >
//                 4. Paid
//               </div>
//             </div>

//             <form onSubmit={handleSubmit} noValidate>
//               {/* Replace the form section in your Modal with this layout */}
//               <div className="row g-3">
//                 {/* Row 1: Employee & Contract */}
//                 <div className="col-md-6">
//                   <label className="form-label fs-13 fw-bold">
//                     Employee <span className="text-danger">*</span>
//                   </label>
//                   <CommonSelect
//                     disabled={currentStep !== "create"}
//                     options={dropdowns.employees}
//                     value={
//                       dropdowns.employees.find(
//                         (opt: any) => opt.value === formData.employee_id,
//                       ) || null
//                     }
//                     onChange={handleEmployeeChange}
//                   />
//                   {isSubmitted && errors.employee_id && (
//                     <div className="text-danger fs-11 mt-1">
//                       {errors.employee_id}
//                     </div>
//                   )}
//                 </div>

//                 <div className="col-md-6">
//                   <label className="form-label fs-13 fw-bold">Contract</label>
//                   <CommonSelect
//                     disabled={currentStep !== "create"}
//                     options={dropdowns.contracts}
//                     value={
//                       dropdowns.contracts.find(
//                         (opt: any) => opt.value === formData.contract_id,
//                       ) || null
//                     }
//                     onChange={(opt: any) =>
//                       updateField("contract_id", opt?.value || "")
//                     }
//                   />
//                 </div>

//                 {/* Row 2: Generated Title (Full Width) */}
//                 <div className="col-md-12">
//                   <label className="form-label fs-13 fw-bold">
//                     Payslip Reference Name{" "}
//                     <span className="text-danger">*</span>
//                   </label>
//                   <input
//                     type="text"
//                     disabled={currentStep !== "create"}
//                     className={`form-control ${isSubmitted && (errors.name ? "is-invalid" : "is-valid")}`}
//                     value={formData.name}
//                     onChange={(e) => updateField("name", e.target.value)}
//                     placeholder="e.g. Salary Slip - John Doe - Feb 2026"
//                   />
//                   {isSubmitted && errors.name && (
//                     <div className="text-danger fs-11 mt-1">{errors.name}</div>
//                   )}
//                 </div>

//                 {/* Row 3: Date Range */}
//                 <div className="col-md-6">
//                   <label className="form-label fs-13 fw-bold">
//                     Date From <span className="text-danger">*</span>
//                   </label>
//                   <DatePicker
//                     disabled={currentStep !== "create"}
//                     className={`w-100 form-control ${isSubmitted && (errors.date_from ? "is-invalid" : "is-valid")}`}
//                     value={
//                       formData.date_from ? dayjs(formData.date_from) : null
//                     }
//                     onChange={(_, d) => updateField("date_from", String(d))}
//                   />
//                 </div>

//                 <div className="col-md-6">
//                   <label className="form-label fs-13 fw-bold">Date To</label>
//                   <DatePicker
//                     disabled={currentStep !== "create"}
//                     className="w-100 form-control"
//                     value={formData.date_to ? dayjs(formData.date_to) : null}
//                     onChange={(_, d) => updateField("date_to", String(d))}
//                   />
//                 </div>
//               </div>

//               {/* --- Worked Days Summary (Visible after Step 1) --- */}
//               {createdSlipData && createdSlipData.worked_days && (
//                 <div className="col-md-12 mt-4 animate__animated animate__fadeIn">
//                   <div className="card border shadow-none bg-light-gray">
//                     <div className="card-header bg-white py-2 border-bottom">
//                       <h6 className="fw-bold mb-0 fs-13 text-dark">
//                         <i className="ti ti-calendar-event me-2 text-primary"></i>
//                         Attendance & Worked Days Summary
//                       </h6>
//                     </div>
//                     <div className="card-body p-0">
//                       <div className="table-responsive">
//                         <table className="table table-sm mb-0 fs-12">
//                           <thead className="table-light">
//                             <tr>
//                               <th>Description</th>
//                               <th>Type</th>
//                               <th className="text-center">Days</th>
//                               <th className="text-center">Hours</th>
//                               <th className="text-end">Amount</th>
//                             </tr>
//                           </thead>
//                           <tbody>
//                             {createdSlipData.worked_days.map(
//                               (item: any, idx: number) => (
//                                 <tr key={idx}>
//                                   <td className="fw-medium">{item.name}</td>
//                                   <td>
//                                     <span className="badge bg-soft-info text-info">
//                                       {item.work_entry_type_name}
//                                     </span>
//                                   </td>
//                                   <td className="text-center">
//                                     {item.number_of_days}
//                                   </td>
//                                   <td className="text-center">
//                                     {item.number_of_hours}
//                                   </td>
//                                   <td className="text-end fw-bold">
//                                     {item.currency}{" "}
//                                     {item.amount?.toLocaleString()}
//                                   </td>
//                                 </tr>
//                               ),
//                             )}
//                           </tbody>
//                         </table>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               )}

//               <div className="modal-footer border-0 bg-white px-0 mt-4 pb-0">
//                 <button
//                   type="button"
//                   className="btn btn-outline-secondary px-4 me-2"
//                   onClick={resetAndClose}
//                 >
//                   {currentStep === "create" ? "Cancel" : "Exit Process"}
//                 </button>
//                 <button
//                   type="submit"
//                   className={`btn ${btn.class} px-5 shadow-sm text-white`}
//                   disabled={isSubmitting}
//                 >
//                   {isSubmitting ? (
//                     <>
//                       <span className="spinner-border spinner-border-sm me-2"></span>
//                       Processing...
//                     </>
//                   ) : (
//                     <>
//                       <i className={`ti ${btn.icon} me-2`}></i>
//                       {btn.text}
//                     </>
//                   )}
//                 </button>
//               </div>
//             </form>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddEditPayslipModal;
