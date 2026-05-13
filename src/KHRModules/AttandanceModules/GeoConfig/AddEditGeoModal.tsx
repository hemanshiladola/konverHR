import MultiSelect from "@/KHRModules/commanForm/inputComman/MultiSelect";
import React, { useEffect, useState } from "react";
import { addGeoConfig, updateGeoConfig } from "./GeoServices";
import { getEmployeesBasicInfo } from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
import { toast } from "react-toastify";

interface Props {
  data: any | null;
  onSuccess: () => void;
  onClose: () => void; // <--- Made Required
}

interface Option {
  id: number;
  name: string;
  role: string;
  department: string; // 🔥 Added
  department_id?: number; // 🔥 Added
  job_position?: string; // 🔥 Added
}

const AddEditGeoModal: React.FC<Props> = ({ data, onSuccess, onClose }) => {
  const initialFormState = {
    name: "",
    latitude: "",
    longitude: "",
    radius_km: "",
    employees_selection: [],
  };

  const [formData, setFormData] = useState<any>(initialFormState);
  const [errors, setErrors] = useState<any>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [employeesList, setEmployeeList] = useState<Option[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  // 1. Fetch Employees
  useEffect(() => {
    const fetchEmploymentData = async () => {
      try {
        const employees = await getEmployeesBasicInfo();
        setEmployeeList(employees || []);
      } catch (error) {
        console.error("Error loading employees:", error);
      }
    };
    fetchEmploymentData();
  }, []);

  const uniqueDepts = [
    "All",
    ...new Set(employeesList.map((emp: any) => emp.department).filter(Boolean)),
  ];

  const getFilteredEmployees = () => {
    return employeesList.filter(
      (emp) =>
        (selectedDept === "All" || emp.department === selectedDept) &&
        (emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          emp.job_position?.toLowerCase().includes(searchTerm.toLowerCase())),
    );
  };

  // 2. BOOTSTRAP EVENT LISTENER (Force clear & Parent Reset on close)
  useEffect(() => {
    const modalElement = document.getElementById("add_geo_config");

    const handleHidden = () => {
      resetForm();
      onClose(); // <--- CRITICAL: Resets parent state 'selectedGeo' to null
    };

    if (modalElement) {
      modalElement.addEventListener("hidden.bs.modal", handleHidden);
    }

    return () => {
      if (modalElement) {
        modalElement.removeEventListener("hidden.bs.modal", handleHidden);
      }
    };
  }, [onClose]); // Added dependency

  // 3. Populate Form
  useEffect(() => {
    if (data) {
      setFormData({
        name: data.name || "",
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        radius_km: data.radius_km || "",
        employees_selection: data.employees_selection || [],
      });
    } else {
      resetForm();
    }
  }, [data]);

  const resetForm = () => {
    setFormData(initialFormState);
    setErrors({});
    setIsSubmitted(false);
    setIsSubmitting(false);
  };

  const getInputClass = (fieldName: string) => {
    if (errors[fieldName]) return "form-control is-invalid";
    if (isSubmitted && formData[fieldName] && !errors[fieldName])
      return "form-control is-valid";
    return "form-control";
  };

  const clearError = (field: string) => {
    if (errors[field]) {
      setErrors((prev: any) => ({ ...prev, [field]: null }));
    }
  };

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
    clearError(name);
  };

  // 🔥 NEW: Coordinate/Decimal handler (allows numbers, decimals, and negative sign, blocks 'e')
  const handleGeoCoordinateChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxLimit: number,
  ) => {
    const { name, value } = e.target;

    // Allow digits, one decimal point, and an optional leading minus sign
    let sanitized = value
      .replace(/[^0-9.-]/g, "") // remove invalid chars
      .replace(/(?!^)-/g, "") // remove minus sign if not at start
      .replace(/(\..*?)\..*/g, "$1"); // allow only one decimal

    if (sanitized === "" || sanitized === "-") {
      setFormData((prev: any) => ({ ...prev, [name]: sanitized }));
      clearError(name);
      return;
    }

    let num = parseFloat(sanitized);
    // Enforce absolute max limit (e.g. 180 for Longitude, 90 for Latitude)
    if (Math.abs(num) > maxLimit) {
      sanitized = (num > 0 ? maxLimit : -maxLimit).toString();
    }

    setFormData((prev: any) => ({ ...prev, [name]: sanitized }));
    clearError(name);
  };

  const validate = () => {
    let tempErrors: any = {};
    let isValid = true;

    if (!formData.name?.toString().trim()) {
      tempErrors.name = "Location Name is required";
      isValid = false;
    }
    if (!formData.latitude) {
      tempErrors.latitude = "Latitude is required";
      isValid = false;
    }
    if (!formData.longitude) {
      tempErrors.longitude = "Longitude is required";
      isValid = false;
    }
    if (!formData.radius_km || Number(formData.radius_km) <= 0) {
      tempErrors.radius_km = "Valid Radius is required";
      isValid = false;
    }

    setErrors(tempErrors);
    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    if (!validate()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    setIsSubmitting(true);

    const payload: any = {
      name: formData.name,
      latitude: Number(formData.latitude),
      longitude: Number(formData.longitude),
      radius_km: Number(formData.radius_km),
      hr_employee_ids: formData.employees_selection.map((e: any) => e.id),
    };

    try {
      if (data && data.id) {
        await updateGeoConfig(data.id, payload);
        toast.success("Geo Configuration Updated Successfully");
      } else {
        await addGeoConfig(payload);
        toast.success("Geo Configuration Created Successfully");
      }

      onSuccess();
      // Close button click triggers 'hidden.bs.modal' which calls onClose()
      document.getElementById("close-btn-geo")?.click();
    } catch (error) {
      console.error("Error saving geo config:", error);
      toast.error("Failed to save configuration");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <style>
        {`
          #add_geo_config { z-index: 1055 !important; }
          #add_geo_config .modal-content, 
          #add_geo_config .modal-body { 
            overflow: visible !important; 
          }
          .react-select__menu { z-index: 9999 !important; }
          .css-1nmdiq5-menu { z-index: 9999 !important; } 
          .is-invalid + .invalid-feedback { display: block; }
        `}
      </style>

      <div
        className="modal fade"
        id="add_geo_config"
        tabIndex={-1}
        aria-hidden="true"
        data-bs-backdrop="static" // Prevent accidental closing
      >
        <div className="modal-dialog modal-dialog-centered modal-lg">
          <div className="modal-content border-0 shadow-lg">
            <div className="modal-header border-bottom bg-light py-2">
              <h5 className="modal-title fw-bold fs-15">
                <i className="ti ti-map-pin me-2 text-primary"></i>
                {data ? "Edit Geo Configuration" : "Add Geo Configuration"}
              </h5>
              <button
                type="button"
                className="btn-close"
                data-bs-dismiss="modal"
                id="close-btn-geo"
                onClick={resetForm}
              ></button>
            </div>

            <div className="modal-body p-4">
              <form onSubmit={handleSubmit} noValidate>
                <div className="mb-3">
                  <label className="form-label fs-13 fw-bold">
                    Location Name <span className="text-danger">*</span>
                  </label>
                  <input
                    type="text"
                    name="name"
                    className={getInputClass("name")}
                    placeholder="e.g. Head Office Zone"
                    value={formData.name}
                    // onChange={(e) => {
                    //   setFormData({ ...formData, name: e.target.value });
                    //   clearError("name");
                    // }}
                    onChange={(e) => handleTextChange(e, 100)} // 🔥 Max 100 chars
                    maxLength={100}
                  />
                  <div className="invalid-feedback">{errors.name}</div>
                </div>

                <div className="row g-3 mb-3">
                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-bold">
                      Latitude <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="latitude"
                      className={getInputClass("latitude")}
                      placeholder="e.g. 23.0225"
                      value={formData.latitude}
                      // onChange={(e) => {
                      //   setFormData({ ...formData, latitude: e.target.value });
                      //   clearError("latitude");
                      // }}
                      onChange={(e) => handleGeoCoordinateChange(e, 90)} // Max Lat is 90
                    />
                    <div className="invalid-feedback">{errors.latitude}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-bold">
                      Longitude <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="longitude"
                      className={getInputClass("longitude")}
                      placeholder="e.g. 72.5714"
                      value={formData.longitude}
                      // onChange={(e) => {
                      //   setFormData({ ...formData, longitude: e.target.value });
                      //   clearError("longitude");
                      // }}
                      onChange={(e) => handleGeoCoordinateChange(e, 180)} // Max Long is 180
                    />
                    <div className="invalid-feedback">{errors.longitude}</div>
                  </div>
                  <div className="col-md-4">
                    <label className="form-label fs-13 fw-bold">
                      Radius (Km) <span className="text-danger">*</span>
                    </label>
                    <input
                      type="number"
                      name="radius_km"
                      className={getInputClass("radius_km")}
                      placeholder="e.g. 0.5"
                      value={formData.radius_km}
                      // onChange={(e) => {
                      //   setFormData({ ...formData, radius_km: e.target.value });
                      //   clearError("radius_km");
                      // }}
                      onChange={(e) => handleGeoCoordinateChange(e, 9999)} // Arbitrary max radius
                    />
                    <div className="invalid-feedback">{errors.radius_km}</div>
                  </div>
                </div>

                {/* <div
                  className="mb-3"
                  style={{ position: "relative", zIndex: 100 }}
                >
                  <MultiSelect
                    label="Assigned Employees"
                    value={formData.employees_selection.map(
                      (e: { id: any }) => e.id,
                    )}
                    options={employeesList || []}
                    onChange={(selectedIds: number[]) =>
                      setFormData({
                        ...formData,
                        employees_selection: employeesList?.filter((e) =>
                          selectedIds.includes(e.id),
                        ),
                      })
                    }
                  />
                  <div className="form-text text-muted">
                    Leave empty to apply globally or select specific employees.
                  </div>
                </div> */}

                <div className="mb-3">
                  {/* Header with Selection Count */}
                  <div className="d-flex justify-content-between align-items-center mb-2">
                    <label className="form-label fs-13 fw-bold mb-0">
                      Assigned Employees
                    </label>
                    <span className="badge bg-soft-danger text-danger px-2 py-1">
                      {formData.employees_selection.length} Selected
                    </span>
                  </div>

                  {/* Selected Employees Chips */}
                  {formData.employees_selection.length > 0 && (
                    <div className="d-flex flex-wrap gap-1 mb-2 p-2 border rounded bg-light" style={{ maxHeight: '110px', overflowY: 'auto' }}>
                      {formData.employees_selection.map((emp: any) => (
                        <span key={`selected-${emp.id}`} className="badge bg-soft-primary text-primary border border-primary d-flex align-items-center px-2 py-1 fw-medium" style={{ fontSize: "11px" }}>
                          {emp.name || emp.label || emp.employee_name || `Employee #${emp.id}`}
                          <i 
                            className="ti ti-x ms-1 cursor-pointer text-danger" 
                            style={{ fontSize: '14px' }}
                            onClick={(e) => {
                              e.preventDefault();
                              const current = [...formData.employees_selection];
                              setFormData({
                                ...formData,
                                employees_selection: current.filter((i: any) => i.id !== emp.id),
                              });
                            }}
                          ></i>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Search & Filter Bar */}
                  <div className="row g-2 mb-2">
                    <div className="col-md-7">
                      <div className="input-group input-group-sm shadow-sm">
                        <span className="input-group-text bg-white border-end-0">
                          <i className="ti ti-search text-muted"></i>
                        </span>
                        <input
                          type="text"
                          className="form-control border-start-0 fs-12"
                          placeholder="Search name or position..."
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    </div>
                    <div className="col-md-5">
                      <select
                        className="form-select form-select-sm fs-12 shadow-sm"
                        onChange={(e) => setSelectedDept(e.target.value)}
                      >
                        <option value="All">All Departments</option>
                        {[
                          ...new Set(employeesList.map((e) => e.department)),
                        ].map((dept) => (
                          <option key={dept} value={dept}>
                            {dept}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Select All Toggle */}
                  <div className="d-flex justify-content-between align-items-center p-2 bg-light border border-bottom-0 rounded-top">
                    <div className="form-check mb-0">
                      <input
                        className="form-check-input ms-0"
                        type="checkbox"
                        id="selectAllCheck"
                        onChange={(e) => {
                          if (e.target.checked) {
                            const visible = employeesList.filter(
                              (emp) =>
                                (selectedDept === "All" ||
                                  emp.department === selectedDept) &&
                                emp.name
                                  .toLowerCase()
                                  .includes(searchTerm.toLowerCase()),
                            );
                            setFormData({
                              ...formData,
                              employees_selection: visible,
                            });
                          } else {
                            setFormData({
                              ...formData,
                              employees_selection: [],
                            });
                          }
                        }}
                      />
                      <label
                        className="form-check-label fs-12 fw-bold ms-2 cursor-pointer"
                        htmlFor="selectAllCheck"
                      >
                        Select All Visible
                      </label>
                    </div>
                    <button
                      type="button"
                      className="btn btn-link btn-sm text-decoration-none p-0 fs-11 text-danger"
                      onClick={() =>
                        setFormData({ ...formData, employees_selection: [] })
                      }
                    >
                      Clear All
                    </button>
                  </div>

                  {/* Scrollable Checklist */}
                  <div
                    className="border rounded-bottom bg-white overflow-auto"
                    style={{ maxHeight: "200px", borderStyle: "dashed" }}
                  >
                    <div className="list-group list-group-flush">
                      {employeesList
                        .filter(
                          (emp) =>
                            (selectedDept === "All" ||
                              emp.department === selectedDept) &&
                            emp.name
                              .toLowerCase()
                              .includes(searchTerm.toLowerCase()),
                        )
                        .map((emp) => {
                          const isChecked = formData.employees_selection.some(
                            (s: any) => s.id === emp.id,
                          );
                          return (
                            <label
                              key={emp.id}
                              className="list-group-item d-flex align-items-center py-2 border-bottom-dashed"
                            >
                              <input
                                className="form-check-input me-3 mt-0"
                                type="checkbox"
                                checked={isChecked}
                                onChange={() => {
                                  const current = [
                                    ...formData.employees_selection,
                                  ];
                                  isChecked
                                    ? setFormData({
                                        ...formData,
                                        employees_selection: current.filter(
                                          (i: any) => i.id !== emp.id,
                                        ),
                                      })
                                    : setFormData({
                                        ...formData,
                                        employees_selection: [...current, emp],
                                      });
                                }}
                              />
                              <div className="lh-1">
                                <div className="fs-13 fw-bold text-dark">
                                  {emp.name}
                                </div>
                                <div className="fs-11 text-muted mt-1">
                                  {emp.job_position} •{" "}
                                  <span className="text-primary">
                                    {emp.department}
                                  </span>
                                </div>
                              </div>
                            </label>
                          );
                        })}
                    </div>
                  </div>
                </div>

                <div className="modal-footer border-0 px-0 mt-4 pb-0">
                  <button
                    type="button"
                    className="btn btn-outline-secondary px-4 me-2"
                    data-bs-dismiss="modal"
                    onClick={resetForm}
                  >
                    Discard
                  </button>
                  <button
                    type="submit"
                    className="btn btn-primary px-5 shadow-sm"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <span
                          className="spinner-border spinner-border-sm me-2"
                          role="status"
                          aria-hidden="true"
                        ></span>
                        Saving...
                      </>
                    ) : (
                      <>
                        <i className="ti ti-device-floppy me-1"></i>
                        Save Configuration
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default AddEditGeoModal;

// import CommonModal from "@/KHRModules/commanForm/CommanModal/CommanModal";
// import { useFormValidation } from "@/KHRModules/commanForm/FormValidation";
// import FormInput from "@/KHRModules/commanForm/inputComman/FormInput";
// import MultiSelect from "@/KHRModules/commanForm/inputComman/MultiSelect";
// import React, { useEffect, useState } from "react";
// import { addGeoConfig, updateGeoConfig } from "./GeoServices";
// import { getEmployees } from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
// import { Modal } from "react-bootstrap";

// const employeesList = [
//   { id: 16674, name: "John Doe", role: "Developer" },
//   { id: 16675, name: "Jane Smith", role: "UI/UX Designer" },
// ];

// interface Props {
//   data: any | null; // null for add, object for edit
//   onSuccess: () => void; // refresh parent table
//   onClose?: () => void;
// }

// interface Option {
//   id: number;
//   name: string;
//   role: string;
// }

// const AddEditGeoModal: React.FC<Props> = ({ data, onSuccess, onClose }) => {
//   const [formData, setFormData] = useState<any>({
//     name: "",
//     latitude: "",
//     longitude: "",
//     radius_km: "",
//     employees_selection: [],
//   });
//   const [errors, setErrors] = useState<any>({});
//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const { validateAttendancePolicy } = useFormValidation();
//   const [employeesList, setEmployeeList] = useState<Option[]>();
//   const user_id = Number(localStorage.getItem("user_id") || 0);

//   useEffect(() => {
//     const fetchEmploymentData = async () => {
//       try {
//         const employees = await getEmployees();
//         setEmployeeList(employees || []);
//       } catch (error) {
//         console.error("Error loading employees:", error);
//       }
//     };
//     fetchEmploymentData();
//   }, []);

//   useEffect(() => {
//     if (data) {
//       // Prefill for edit
//       setFormData({
//         name: data.name || "",
//         latitude: data.latitude || "",
//         longitude: data.longitude || "",
//         radius_km: data.radius_km || "",
//         employees_selection: data.employees_selection || [],
//       });
//     } else {
//       // Reset for add
//       setFormData({
//         name: "",
//         latitude: "",
//         longitude: "",
//         radius_km: "",
//         employees_selection: [],
//       });
//       setErrors({});
//       setIsSubmitted(false);
//     }
//   }, [data]);

//   // const handleSubmit = async () => {
//   //   setIsSubmitted(true);
//   //   console.log("handle SUbnmit Called ");

//   //   const validationErrors = validateAttendancePolicy(formData);
//   //   if (Object.keys(validationErrors).length) {
//   //     setErrors(validationErrors);
//   //     console.log("handle SUbnmit Validate", validationErrors);
//   //     return;
//   //   }

//   //   // Payload
//   //   const payload: any = {
//   //     name: formData.name,
//   //     latitude: Number(formData.latitude),
//   //     longitude: Number(formData.longitude),
//   //     radius_km: Number(formData.radius_km),
//   //     hr_employee_ids: formData.employees_selection.map((e: any) => e.id),
//   //   };
//   //   console.log("Payload", payload);

//   //   try {
//   //     if (data && data.id) {
//   //       await updateGeoConfig(data.id, payload);
//   //       console.log("UpdateGEO CONFIGUR", payload);
//   //     } else {
//   //       await addGeoConfig(payload);
//   //       console.log("add GEO COnfigur", payload);
//   //     }
//   //     const modalElement = document.getElementById("add_geo_config");
//   //     if (modalElement) {
//   //       const modalInstance = bootstrap.Modal.getInstance(modalElement);
//   //       if (modalInstance) {
//   //         modalInstance.hide();
//   //       }
//   //     }

//   //     onSuccess();
//   //     handleClose();
//   //   } catch (error) {
//   //     console.error("Error saving geo config:", error);
//   //   }
//   // };

//   const handleSubmit = async () => {
//     setIsSubmitted(true);
//     console.log("handle SUbnmit Called ");

//     const validationErrors = validateAttendancePolicy(formData);
//     if (Object.keys(validationErrors).length) {
//       setErrors(validationErrors);
//       console.log("handle SUbnmit Validate", validationErrors);
//       return;
//     }

//     // Payload
//     const payload: any = {
//       name: formData.name,
//       latitude: Number(formData.latitude),
//       longitude: Number(formData.longitude),
//       radius_km: Number(formData.radius_km),
//       hr_employee_ids: formData.employees_selection.map((e: any) => e.id),
//     };
//     console.log("Payload", payload);

//     try {
//       if (data && data.id) {
//         await updateGeoConfig(data.id, payload);
//         console.log("UpdateGEO CONFIGUR", payload);
//       } else {
//         await addGeoConfig(payload);
//         console.log("add GEO COnfigur", payload);
//       }

//       // --- FIX START: Use the 'Click' Trick ---
//       const modalElement = document.getElementById("add_geo_config");

//       // Find the "close" button (the 'x' or 'Cancel' button) inside the modal
//       // These buttons usually have the attribute data-bs-dismiss="modal"
//       const closeBtn = modalElement?.querySelector(
//         '[data-bs-dismiss="modal"]'
//       ) as HTMLElement;

//       if (closeBtn) {
//         // Clicking this button triggers Bootstrap's native close & cleanup
//         closeBtn.click();
//       }
//       // --- FIX END ---

//       onSuccess();
//       handleClose();
//     } catch (error) {
//       console.error("Error saving geo config:", error);
//     }
//   };

//   const handleClose = () => {
//     setFormData({
//       name: "",
//       latitude: "",
//       longitude: "",
//       radius_km: "",
//       employees_selection: [],
//     });
//     setErrors({});
//     setIsSubmitted(false);
//     onClose && onClose();
//   };

//   return (
//     <CommonModal
//       id="add_geo_config"
//       title={data ? "Edit Geo Configuration" : "Add Geo Configuration"}
//       onSubmit={handleSubmit}
//       // onClose={handleClose}
//     >
//       <FormInput
//         label="Name"
//         name="name"
//         value={formData.name}
//         error={errors.name}
//         isSubmitted={isSubmitted}
//         onChange={(e) => setFormData({ ...formData, name: e.target.value })}
//       />

//       <div className="row">
//         <div className="col-md-4">
//           <FormInput
//             label="Latitude"
//             type="number"
//             name="latitude"
//             value={formData.latitude}
//             error={errors.latitude}
//             isSubmitted={isSubmitted}
//             onChange={(e) =>
//               setFormData({ ...formData, latitude: e.target.value })
//             }
//           />
//         </div>
//         <div className="col-md-4">
//           <FormInput
//             label="Longitude"
//             type="number"
//             name="longitude"
//             value={formData.longitude}
//             error={errors.longitude}
//             isSubmitted={isSubmitted}
//             onChange={(e) =>
//               setFormData({ ...formData, longitude: e.target.value })
//             }
//           />
//         </div>
//         <div className="col-md-4">
//           <FormInput
//             label="Radius (Km)"
//             type="number"
//             name="radius_km"
//             value={formData.radius_km}
//             error={errors.radius_km}
//             isSubmitted={isSubmitted}
//             onChange={(e) =>
//               setFormData({ ...formData, radius_km: e.target.value })
//             }
//           />
//         </div>
//       </div>

//       {/* <MultiSelect
// label="Employees"
// value={formData.employees_selection.map((e: any) => e.id)}
// options={employeesList || []}
// isSubmitted={isSubmitted}
// error={errors.employees_selection}
// onChange={(ids) =>
// setFormData({
// ...formData,
// employees_selection: employeesList.filter((e) =>
// ids.includes(e.id)
// ),
// })
// }
// /> */}
//       <MultiSelect
//         label="Employees"
//         value={formData.employees_selection.map((e: { id: any }) => e.id)}
//         options={employeesList || []} // always defined as array
//         // isSubmitted={false}
//         // error={""}
//         onChange={(selectedIds: number[]) =>
//           setFormData({
//             ...formData,
//             employees_selection: employeesList?.filter((e) =>
//               selectedIds.includes(e.id)
//             ),
//           })
//         }
//       />
//     </CommonModal>
//   );
// };

// export default AddEditGeoModal;
