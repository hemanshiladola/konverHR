import React, { useCallback, useEffect, useState } from "react";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import {
  Contract,
  Employee,
  WorkingSchedule,
  Department,
  createContract,
  updateContract,
  getEmployees,
  getWorkingSchedules,
  getDepartments,
  getLeaveConfigurations,
  getLeavePreview,
} from "./contractService";
import CommonSelect from "@/core/common/commonSelect";
import { DatePicker } from "antd";
import { WorkEntryType } from "../Master Modules/WorkEntryType/WorkEntryTypeServices";
import { createLeaveAllocation } from "../LeaveModules/leaveAllocation/LeaveAllocationServices";
import { getAllLeaveTypes } from "../LeaveModules/leaveTypes/LeavetypesServices";
import { getAccruralPlans } from "../Master Modules/AccruralPlan/AccruralPlanServices";

const initialContractState = {
  name: "",
  employee_code: "",
  employee_id: 0,
  job_id: 0,
  date_start: "",
  date_end: "",
  work_entry_source: "calendar",
  resource_calendar_id: 0,
  structure_type_id: 0,
  department_id: 0,
  contract_type_id: 0,
  wage_type: "monthly",
  schedule_pay: "monthly",
  wage: 0,
  conveyance_allowances: 0,
  skill_allowances: 0,
  food_allowances: 0,
  washing_allowances: 0,
  special_allowances: 0,
  medial_allowances: 0,
  uniform_allowances: 0,
  child_education_allowances: 0,
  other_allowances: 0,
  variable_pay: 0,
  gratuity: 0,
  professional_tax: 0,
  lta: 0,
};

const initialLeaveState = {
  allocation_type: "regular",
  leave_type_id: "",
  accrual_plan_id: "",
  from_date: "",
  to_date: "",
  allocation_days: "",
  description: "",
};

interface AddEditContractModalProps {
  onSuccess: () => void;
  data?: Contract | null;
  onClose: () => void;
}

const AddEditContractModal: React.FC<AddEditContractModalProps> = ({
  onSuccess,
  data,
  onClose,
}) => {
  const [loading, setLoading] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [activeTab, setActiveTab] = useState("basic");

  // Dropdown States
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [workingSchedules, setWorkingSchedules] = useState<WorkingSchedule[]>(
    [],
  );
  const [departments, setDepartments] = useState<Department[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
  const [accrualPlans, setAccrualPlans] = useState<any[]>([]);
  const [loadingDropdowns, setLoadingDropdowns] = useState(true);

  const [deletedLeaveIds, setDeletedLeaveIds] = useState<number[]>([]);
  // State for the list of added leaves
  const [leaveAllocations, setLeaveAllocations] = useState<any[]>([]);
  const [editingLeaveIndex, setEditingLeaveIndex] = useState<number>(-1);
  const [leaveConfigs, setLeaveConfigs] = useState<any[]>([]);
  const [selectedLeaveConfig, setSelectedLeaveConfig] = useState<string>("");
  const [leavePreview, setLeavePreview] = useState<any[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [leaveErrors, setLeaveErrors] = useState<any>({}); // Dedicated validation for the entry form
  const [errors, setErrors] = useState<any>({});

  // Form States
  const [formData, setFormData] = useState<Omit<Contract, "id">>({
    name: "",
    employee_code: "",
    employee_id: 0,
    job_id: 0,
    date_start: "",
    date_end: "",
    work_entry_source: "calendar",
    resource_calendar_id: 0,
    structure_type_id: 0,
    department_id: 0,
    contract_type_id: 0,
    wage_type: "monthly",
    schedule_pay: "monthly",
    wage: 0,
    conveyance_allowances: 0,
    skill_allowances: 0,
    food_allowances: 0,
    washing_allowances: 0,
    special_allowances: 0,
    medial_allowances: 0,
    uniform_allowances: 0,
    child_education_allowances: 0,
    other_allowances: 0,
    variable_pay: 0,
    gratuity: 0,
    professional_tax: 0,
    lta: 0,
  });

  const [leaveFormData, setLeaveFormData] = useState({
    allocation_type: "regular",
    leave_type_id: "",
    accrual_plan_id: "",
    from_date: "",
    to_date: "",
    allocation_days: "",
    description: "",
  });

  const extractDataArray = (res: any, name: string) => {
    console.log(`DEBUG: Raw ${name} Response:`, res);

    let result = [];
    if (Array.isArray(res)) {
      result = res;
    } else if (res?.data && Array.isArray(res.data)) {
      result = res.data;
    } else if (res?.data?.data && Array.isArray(res.data.data)) {
      result = res.data.data;
    } else if (res?.data?.result && Array.isArray(res.data.result)) {
      result = res.data.result;
    }

    console.log(
      `DEBUG: Processed ${name} List (Length: ${result.length}):`,
      result,
    );
    return result;
  };

  useEffect(() => {
    const loadDropdownData = async () => {
      setLoadingDropdowns(true);
      console.log("--- CHECKPOINT 1: Starting individual API calls ---");

      try {
        // 1. Check Employees
        const empRes = await getEmployees();
        console.log("CHECKPOINT: getEmployees finished", empRes);
        setEmployees(extractDataArray(empRes, "Employees"));

        // 2. Check Working Schedules
        const scheduleRes = await getWorkingSchedules();
        console.log("CHECKPOINT: getWorkingSchedules finished", scheduleRes);
        setWorkingSchedules(extractDataArray(scheduleRes, "WorkingSchedules"));

        // 3. Check Departments
        const deptRes = await getDepartments();
        console.log("CHECKPOINT: getDepartments finished", deptRes);
        setDepartments(extractDataArray(deptRes, "Departments"));

        // 4. Check Leave Types
        const leaveRes = await getAllLeaveTypes();
        console.log("CHECKPOINT: getLeaveTypesCode finished", leaveRes);
        setLeaveTypes(extractDataArray(leaveRes, "LeaveTypes"));

        // 5. Check Accrual Plans
        const accrualRes = await getAccruralPlans();
        console.log("CHECKPOINT: getAccruralPlans finished", accrualRes);
        setAccrualPlans(extractDataArray(accrualRes, "AccrualPlans"));

        const configRes = await getLeaveConfigurations();
        setLeaveConfigs(extractDataArray(configRes, "LeaveConfigurations"));

        console.log("--- CHECKPOINT 2: All states updated ---");
      } catch (error) {
        console.error("CRITICAL ERROR during setup:", error);
        toast.error("A background service failed to load.");
      } finally {
        setLoadingDropdowns(false);
      }
    };
    loadDropdownData();
  }, []);

  // useEffect(() => {
  //   if (data) {
  //     // Safely extract ID from [id, "name"] or handle boolean/null
  //     const getVal = (field: any) => {
  //       if (Array.isArray(field)) return field[0];
  //       if (field === false || field === null) return 0;
  //       return field;
  //     };

  //     // 1. Map Main Contract Fields
  //     setFormData({
  //       ...initialContractState,
  //       ...data,
  //       employee_id: getVal(data.employee), // Extracts 16952 from [16952, "Santa Bhai"]
  //       resource_calendar_id: getVal(data.resource_calendar_id),
  //       job_id: getVal(data.job_id),
  //       department_id: getVal(data.department_id),
  //       contract_type_id: getVal(data.contract_type_id),
  //       structure_type_id: getVal(data.structure_type_id),
  //     });

  //     // 2. Map Nested Leave Allocations into the Table State
  //     // Use the field name 'leave_allocations' from your GET response
  //     if (data.leave_allocations && Array.isArray(data.leave_allocations)) {
  //       const mappedLeaves = data.leave_allocations.map((l: any) => ({
  //         id: l.id,
  //         leave_type_id: getVal(l.holiday_status_id),
  //         allocation_type: l.allocation_type || "regular",
  //         // Convert API 'false' to "" for the Select/DatePicker UI
  //         accrual_plan_id:
  //           l.accrual_plan_id === false ? "" : String(l.accrual_plan_id),
  //         from_date: l.date_from || "",
  //         to_date: l.date_to === false ? "" : l.date_to,
  //         allocation_days: l.number_of_days || 0,
  //         description: l.description || "",
  //       }));
  //       setLeaveAllocations(mappedLeaves);
  //     }
  //   }
  // }, [data]);

  useEffect(() => {
    if (data) {
      // Helper to extract the first element from [id, "name"] or return the direct value
      const getVal = (field: any) => {
        if (Array.isArray(field)) return field[0];
        if (field === false || field === null) return 0;
        return field;
      };

      // 1. Map Main Contract Fields
      setFormData({
        ...initialContractState,
        ...data,
        employee_id: getVal(data.employee), // Extracts 16952 from [16952, "Santa Bhai"]
        resource_calendar_id: getVal(data.resource_calendar_id),
        job_id: getVal(data.job_id),
        department_id: getVal(data.department_id),
        contract_type_id: getVal(data.contract_type_id),
        structure_type_id: getVal(data.structure_type_id),
        // Handle allowance naming difference if applicable
      });

      // 2. Map Nested Leave Allocations into the Table State
      // We use the 'leave_allocations' key from your GET response
      if (data.leave_allocations && Array.isArray(data.leave_allocations)) {
        const mappedLeaves = data.leave_allocations.map((l: any) => ({
          id: l.id, // Preserve existing IDs so they aren't recreated as new
          leave_type_id: getVal(l.holiday_status_id),
          allocation_type: l.allocation_type || "regular",
          // Map false/null to empty string for UI components
          accrual_plan_id:
            l.accrual_plan_id === false ? "" : String(l.accrual_plan_id),
          from_date: l.date_from || "",
          to_date: l.date_to === false ? "" : l.date_to,
          allocation_days: l.number_of_days || 0,
          description: l.description || "",
        }));

        console.log("DEBUG: Table Data Loaded:", mappedLeaves);
        setLeaveAllocations(mappedLeaves);
      }
    }
  }, [data]);

  const resetForm = () => {
    setFormData(initialContractState);
    setLeaveFormData(initialLeaveState);
    setLeaveAllocations([]);
    setDeletedLeaveIds([]); // <--- Add this line
    setErrors({});
    setLeaveErrors({});
    setIsSubmitted(false);
    setActiveTab("basic");
  };

  useEffect(() => {
    const modalElement = document.getElementById("add_contract");

    const handleModalHidden = () => {
      resetForm();
      onClose();
    };

    modalElement?.addEventListener("hidden.bs.modal", handleModalHidden);

    return () => {
      modalElement?.removeEventListener("hidden.bs.modal", handleModalHidden);
    };
  }, [onClose, resetForm]);

  const leaveTypeOptions = leaveTypes.map((t: any) => ({
    value: String(t.id),
    label: t.name,
  }));
  const accruralPlanOptions = accrualPlans.map((p: any) => ({
    value: String(p.id),
    label: p.name,
  }));

  const handleEmployeeChange = (employeeId: number) => {
    const selectedEmployee = employees.find((emp) => emp.id === employeeId);
    const uniqueSuffix = dayjs().format("DD-MMM-YYYY");
    if (selectedEmployee) {
      setFormData((prev) => ({
        ...prev,
        employee_id: employeeId,
        employee_code: selectedEmployee.employee_code,
        name: `Contract - ${selectedEmployee.name} (${uniqueSuffix})`,
      }));
    }
  };

  // ==========================================
  // VALIDATION LOGIC
  // ==========================================

  const tabFieldsMap: { [key: string]: string[] } = {
    basic: ["employee_id", "date_start", "wage"],
    salary: [], // Add required fields here if needed
    leave: [
      "leave_type_id",
      "accrual_plan_id",
      "from_date",
      "to_date",
      "allocation_days",
    ],
  };

  const hasTabErrors = (tabName: string) => {
    if (!isSubmitted) return false;
    const currentTabFields = tabFieldsMap[tabName] || [];
    return currentTabFields.some((field) => errors[field]);
  };

  const validateBasicTab = () => {
    let tempErrors: any = {};
    let isValid = true;

    if (!formData.employee_id) {
      tempErrors.employee_id = "Employee is required";
      isValid = false;
    }
    if (!formData.date_start) {
      tempErrors.date_start = "Start Date is required";
      isValid = false;
    }
    if (!formData.wage || Number(formData.wage) <= 0) {
      tempErrors.wage = "Valid wage amount is required";
      isValid = false;
    }

    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return isValid;
  };

  const handleLeaveConfigChange = async (configId: string) => {
    setSelectedLeaveConfig(configId);
    if (!configId) {
      setLeavePreview([]);
      return;
    }
    if (!formData.employee_id || !formData.date_start) {
      toast.warning(
        "Please select an Employee and a Start Date first to see the leave preview.",
      );
      setSelectedLeaveConfig(""); // Reset selection
      return;
    }

    setLoadingPreview(true);
    try {
      const payload = {
        employee_id: Number(formData.employee_id),
        leave_configuration_id: Number(configId),
        contract_start: formData.date_start, // Uses the value from Tab 1
      };

      const res = await getLeavePreview(payload);
      // Use your extractDataArray helper to handle the {status, data} nesting
      setLeavePreview(extractDataArray(res, "LeavePreview"));
    } catch (error) {
      toast.error("Failed to load leave preview.");
    } finally {
      setLoadingPreview(false);
    }
  };

  const validateLeaveEntry = () => {
    let tempErrors: any = {};
    let isValid = true;

    if (!leaveFormData.leave_type_id) {
      tempErrors.leave_type_id = "Leave Type is required";
      isValid = false;
    }
    if (
      !leaveFormData.allocation_days ||
      Number(leaveFormData.allocation_days) <= 0
    ) {
      tempErrors.allocation_days = "Allocation Days are required";
      isValid = false;
    }
    if (!leaveFormData.from_date) {
      tempErrors.from_date = "From Date is required";
      isValid = false;
    }
    if (!leaveFormData.to_date) {
      tempErrors.to_date = "To Date is required";
      isValid = false;
    }

    if (
      leaveFormData.allocation_type === "accrual" &&
      !leaveFormData.accrual_plan_id
    ) {
      tempErrors.accrual_plan_id = "Accrual Plan is required";
      isValid = false;
    }

    setLeaveErrors(tempErrors);
    return isValid;
  };

  const handleAddLeaveToList = () => {
    if (!validateLeaveEntry()) {
      toast.error("Please fill all required leave fields.");
      return;
    }

    if (editingLeaveIndex > -1) {
      const updated = [...leaveAllocations];
      updated[editingLeaveIndex] = { ...leaveFormData };
      setLeaveAllocations(updated);
      setEditingLeaveIndex(-1);
      toast.info("Entry updated");
    } else {
      setLeaveAllocations([...leaveAllocations, { ...leaveFormData }]);
      toast.success("Entry added to list");
    }

    // Reset entry form and clear leave-specific errors
    setLeaveFormData(initialLeaveState);
    setLeaveErrors({});
  };

  const handleEditLeaveInList = (index: number) => {
    setLeaveFormData(leaveAllocations[index]);
    setEditingLeaveIndex(index);
    setLeaveErrors({}); // Clear errors when editing
  };

  const handleDeleteLeaveFromList = (index: number) => {
    const itemToDelete = leaveAllocations[index];

    // If the item has an ID, it exists in the database, so track it for deletion
    if (itemToDelete.id) {
      setDeletedLeaveIds((prev) => [...prev, itemToDelete.id]);
    }

    setLeaveAllocations((prev) => prev.filter((_, i) => i !== index));

    if (editingLeaveIndex === index) {
      setEditingLeaveIndex(-1);
      setLeaveFormData(initialLeaveState);
    }
  };

  // const handleSubmit = async (e: React.FormEvent) => {
  //   e.preventDefault();
  //   setIsSubmitted(true);

  //   // Run Validations
  //   const isBasicValid = validateBasicTab();
  //   const isLeaveValid = validateLeaveTab();

  //   if (!isBasicValid || !isLeaveValid) {
  //     // Auto-switch to the first tab with an error
  //     const tabOrder = ["basic", "salary", "leave"];
  //     const firstErrorTab = tabOrder.find((tab) => hasTabErrors(tab));
  //     if (firstErrorTab) {
  //       setActiveTab(firstErrorTab);
  //     }
  //     toast.error("Please fill in all required fields marked in red.");
  //     return;
  //   }

  //   setLoading(true);
  //   try {
  //     // 1. Contract Submission
  //     if (data?.id) {
  //       await updateContract(data.id, formData);
  //       toast.success("Contract updated successfully");
  //     } else {
  //       await createContract(formData);
  //       toast.success("Contract created successfully");
  //     }

  //     // 2. Leave Submission
  //     if (leaveFormData.leave_type_id) {
  //       const leavePayload = {
  //         ...leaveFormData,
  //         employee_id: formData.employee_id,
  //         holiday_status_id: Number(leaveFormData.leave_type_id),
  //         leave_type: Number(leaveFormData.leave_type_id),
  //         date_from: leaveFormData.from_date,
  //         date_to: leaveFormData.to_date,
  //         number_of_days: Number(leaveFormData.allocation_days),
  //       };

  //       if (
  //         leaveFormData.allocation_type === "accrual" &&
  //         leaveFormData.accrual_plan_id
  //       ) {
  //         (leavePayload as any).accrual_plan_id = Number(
  //           leaveFormData.accrual_plan_id,
  //         );
  //       }

  //       await createLeaveAllocation(leavePayload);
  //       toast.success("Leave allocation configured");
  //     }

  //     onSuccess();
  //     resetForm();
  //     onClose();
  //   } catch (error: any) {
  //     toast.error(error.message || "Failed to save contract/leave data");
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitted(true);

    // 1. Validate Basic Contract Information
    const isBasicValid = validateBasicTab();

    if (!isBasicValid) {
      setActiveTab("basic");
      toast.error("Please fill in all required contract fields.");
      return;
    }

    // 2. Optional: Check if user forgot to click "Add to List"
    // If the leave form has data but hasn't been added to the table
    const hasUnsavedLeave =
      leaveFormData.leave_type_id || leaveFormData.allocation_days;
    if (hasUnsavedLeave && leaveAllocations.length === 0) {
      setActiveTab("leave");
      toast.warning(
        "You have leave details typed but not added to the list. Please click 'Add to Allocation List' first.",
      );
      return;
    }

    setLoading(true);
    try {
      // 3. Construct Single Consolidated Payload
      const activeLeaves = leaveAllocations.map((l) => ({
        ...(l.id ? { id: l.id } : {}),
        employee_id: Number(formData.employee_id),
        holiday_status_id: Number(l.leave_type_id),
        allocation_type: l.allocation_type,
        accrual_plan_id: l.accrual_plan_id
          ? Number(l.accrual_plan_id)
          : (false as const),
        date_from: l.from_date,
        date_to: l.to_date ? l.to_date : (false as const),
        number_of_days: Number(l.allocation_days),
        description: l.description || "",
      }));

      const deletedLeaves = deletedLeaveIds.map((id) => ({
        id: id,
        delete: true,
      }));

      // Inside handleSubmit in AddEditContractModal.tsx
      const {
        leave_allocations,
        id: _id,
        key,
        formatted_wage,
        formatted_date,
        employee_name,
        department_name,
        employee, // remove the array tuple [id, name]
        ...contractData
      } = formData as any;

      const finalPayload = {
        ...contractData,
        employee_id: Number(formData.employee_id),
        if(selectedLeaveConfig: any) {
          finalPayload.leave_configuration_id = Number(selectedLeaveConfig);
        },
        // leave_allocation_ids: leaveAllocations.map((l) => ({
        //   // 3. Conditional ID: Only include the key if l.id exists (for existing items)
        //   ...(l.id ? { id: l.id } : {}),

        //   employee_id: Number(formData.employee_id),
        //   holiday_status_id: Number(l.leave_type_id),
        //   allocation_type: l.allocation_type,

        //   // Backend requirement: literal false for empty fields
        //   accrual_plan_id: l.accrual_plan_id
        //     ? Number(l.accrual_plan_id)
        //     : (false as const),

        //   date_from: l.from_date,
        //   date_to: l.to_date ? l.to_date : (false as const),
        //   number_of_days: Number(l.allocation_days),
        //   description: l.description || "",
        // })),
        // leave_allocation_ids: [...activeLeaves, ...deletedLeaves],
      };

      // 4. Call Single API (Add or Edit)
      // Note: Use contract_id from the JSON response if available
      const id = data?.contract_id || data?.id;

      if (id && id !== "undefined") {
        await updateContract(String(id), finalPayload);
        toast.success("Contract and allocations updated successfully");
      } else {
        await createContract(finalPayload);
        toast.success("Contract created successfully");
      }

      onSuccess();
      resetForm();
      onClose();
    } catch (error: any) {
      toast.error(error.message || "Failed to save contract data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal fade" id="add_contract" tabIndex={-1} role="dialog">
      <div
        className="modal-dialog modal-xl modal-dialog-centered"
        role="document"
      >
        <div className="modal-content bg-white border-0 shadow-lg">
          <div className="modal-header border-bottom bg-light py-2">
            <h5 className="modal-title fw-bold fs-15">
              <i className="ti ti-file-certificate me-2 text-primary"></i>
              {data ? "Edit Contract Detail" : "Add New Contract"}
            </h5>
            <button
              type="button"
              className="btn-close"
              data-bs-dismiss="modal"
              onClick={onClose}
            />
          </div>

          <form onSubmit={handleSubmit}>
            <div className="modal-body">
              {loadingDropdowns ? (
                <div className="text-center p-5">
                  <div className="spinner-border text-primary" />
                  <div className="mt-2 text-muted">Syncing...</div>
                </div>
              ) : (
                <>
                  {/* TABS NAVIGATION */}
                  <div className="employee-tabs-scrollable border-bottom mb-4">
                    <ul
                      className="nav nav-tabs flex-nowrap overflow-auto hide-scrollbar"
                      role="tablist"
                    >
                      <li className="nav-item">
                        <button
                          className={`nav-link fw-medium d-flex align-items-center ${activeTab === "basic" ? "active" : ""} ${hasTabErrors("basic") ? "text-danger" : ""}`}
                          onClick={() => setActiveTab("basic")}
                          type="button"
                        >
                          <i className="ti ti-info-circle me-2 fs-16"></i> Basic
                          Information
                          {hasTabErrors("basic") && (
                            <i className="ti ti-alert-circle-filled ms-2 fs-16 animate__animated animate__pulse animate__infinite"></i>
                          )}
                        </button>
                      </li>
                      <li className="nav-item">
                        <button
                          className={`nav-link fw-medium d-flex align-items-center ${activeTab === "salary" ? "active" : ""}`}
                          onClick={() => setActiveTab("salary")}
                          type="button"
                        >
                          <i className="ti ti-wallet me-2 fs-16"></i> Salary
                          Structure
                        </button>
                      </li>
                      {/* 🟢 NEW TAB: Leave Configuration */}
                      <li className="nav-item">
                        <button
                          className={`nav-link fw-medium ${activeTab === "leave_config" ? "active" : ""}`}
                          onClick={() => setActiveTab("leave_config")}
                          type="button"
                        >
                          <i className="ti ti-settings-automation me-2 fs-16"></i>{" "}
                          Leave Configuration
                        </button>
                      </li>
                      {/* <li className="nav-item">

                        <button
                          className={`nav-link fw-medium d-flex align-items-center ${activeTab === "leave" ? "active" : ""} ${hasTabErrors("leave") ? "text-danger" : ""}`}
                          onClick={() => setActiveTab("leave")}
                          type="button"
                        >
                          <i className="ti ti-calendar-share me-2 fs-16"></i>{" "}
                          Leave Structure
                          {hasTabErrors("leave") && (
                            <i className="ti ti-alert-circle-filled ms-2 fs-16 animate__animated animate__pulse animate__infinite"></i>
                          )}
                        </button>
                      </li> */}
                    </ul>
                  </div>

                  <div
                    className="tab-content px-1"
                    style={{ minHeight: "420px" }}
                  >
                    {/* TAB 1: BASIC INFORMATION */}
                    {activeTab === "basic" && (
                      <div className="animate__animated animate__fadeIn">
                        <h6 className="fw-bold text-primary mb-3 fs-14">
                          <i className="ti ti-user-check me-2"></i> Employee
                          Assignment
                        </h6>
                        <div className="row g-3 mx-0 mb-4">
                          <div className="col-md-5 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Employee Name{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div
                              className={
                                isSubmitted
                                  ? errors.employee_id
                                    ? "border border-danger rounded shadow-sm"
                                    : "border border-success rounded shadow-sm"
                                  : ""
                              }
                            >
                              <CommonSelect
                                key={`emp-select-${employees.length}`} // Forces re-render when data loads
                                options={employees.map((e) => ({
                                  value: String(e.id),
                                  label: e.name || "Unknown Employee",
                                }))}
                                placeholder="Select Employee"
                                value={
                                  formData.employee_id
                                    ? {
                                        value: String(formData.employee_id),
                                        label:
                                          employees.find(
                                            (e) =>
                                              e.id === formData.employee_id,
                                          )?.name || "",
                                      }
                                    : null
                                }
                                onChange={(opt) => {
                                  handleEmployeeChange(Number(opt?.value));
                                  if (errors.employee_id) {
                                    setErrors({ ...errors, employee_id: null });
                                  }
                                }}
                              />
                            </div>
                            {isSubmitted && errors.employee_id && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.employee_id}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Contract Reference
                            </label>
                            <input
                              type="text"
                              className="form-control"
                              value={formData.name}
                              onChange={(e) =>
                                setFormData({
                                  ...formData,
                                  name: e.target.value,
                                })
                              }
                            />
                          </div>
                        </div>

                        <hr className="my-4 opacity-25" />

                        <h6 className="fw-bold text-primary mb-3 fs-14">
                          <i className="ti ti-settings me-2"></i> Configuration
                          Details
                        </h6>
                        <div className="row g-3 mx-0">
                          <div className="col-md-2 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Start Date <span className="text-danger">*</span>
                            </label>
                            <DatePicker
                              className={`form-control w-100 ${isSubmitted ? (errors.date_start ? "is-invalid border-danger" : "is-valid border-success") : ""}`}
                              value={
                                formData.date_start
                                  ? dayjs(formData.date_start)
                                  : null
                              }
                              format="YYYY-MM-DD"
                              onChange={(date, dateStr) => {
                                setFormData({
                                  ...formData,
                                  date_start: Array.isArray(dateStr)
                                    ? dateStr[0]
                                    : dateStr,
                                });
                                if (errors.date_start) {
                                  setErrors({ ...errors, date_start: null });
                                }
                              }}
                            />
                            {isSubmitted && errors.date_start && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.date_start}
                              </div>
                            )}
                          </div>
                          <div className="col-md-2 px-1">
                            <label className="form-label fs-13 fw-bold">
                              End Date <span className="text-danger">*</span>
                            </label>
                            <DatePicker
                              className={`form-control w-100 ${isSubmitted ? (errors.date_end ? "is-invalid border-danger" : "is-valid border-success") : ""}`}
                              value={
                                formData.date_end
                                  ? dayjs(formData.date_end)
                                  : null
                              }
                              format="YYYY-MM-DD"
                              onChange={(date, dateStr) => {
                                setFormData({
                                  ...formData,
                                  date_end: Array.isArray(dateStr)
                                    ? dateStr[0]
                                    : dateStr,
                                });
                                if (errors.date_start) {
                                  setErrors({ ...errors, date_start: null });
                                }
                              }}
                            />
                            {isSubmitted && errors.date_end && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.date_end}
                              </div>
                            )}
                          </div>

                          {/* <div className="col-md-4 px-1">
                            <label className="form-label fs-13">
                              Work Entry Source
                            </label>
                            <CommonSelect
                              options={[
                                {
                                  value: "calendar",
                                  label: "Working Schedule",
                                },
                                { value: "attendance", label: "Attendance" },
                              ]}
                              value={
                                formData.work_entry_source
                                  ? {
                                      value: formData.work_entry_source,
                                      label:
                                        formData.work_entry_source ===
                                        "calendar"
                                          ? "Working Schedule"
                                          : "Attendance",
                                    }
                                  : null
                              }
                              onChange={(opt) =>
                                setFormData({
                                  ...formData,
                                  work_entry_source: opt?.value || "",
                                })
                              }
                            />
                          </div> */}

                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13">
                              Working Schedule
                            </label>
                            <CommonSelect
                              key={`schedule-${workingSchedules.length}`}
                              options={workingSchedules.map((s: any) => ({
                                value: String(s.id),
                                label: s.name,
                              }))}
                              value={
                                formData.resource_calendar_id
                                  ? {
                                      value: String(
                                        formData.resource_calendar_id,
                                      ),
                                      label:
                                        workingSchedules.find(
                                          (s: any) =>
                                            s.id ===
                                            Number(
                                              formData.resource_calendar_id,
                                            ),
                                        )?.name || "",
                                    }
                                  : null
                              }
                              onChange={(opt) => {
                                setFormData({
                                  ...formData,
                                  resource_calendar_id: Number(opt?.value),
                                });
                                if (errors.resource_calendar_id)
                                  setErrors({
                                    ...errors,
                                    resource_calendar_id: null,
                                  });
                              }}
                            />
                            {isSubmitted && errors.resource_calendar_id && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.resource_calendar_id}
                              </div>
                            )}
                          </div>

                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13">
                              Department
                            </label>
                            <CommonSelect
                              options={departments.map((d) => ({
                                value: String(d.id),
                                label: d.name,
                              }))}
                              value={
                                formData.department_id
                                  ? {
                                      value: String(formData.department_id),
                                      label:
                                        departments.find(
                                          (d) =>
                                            d.id === formData.department_id,
                                        )?.name || "",
                                    }
                                  : null
                              }
                              onChange={(opt) =>
                                setFormData({
                                  ...formData,
                                  department_id: Number(opt?.value),
                                })
                              }
                            />
                          </div>

                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13">
                              Wage Type
                            </label>
                            <CommonSelect
                              options={[
                                { value: "monthly", label: "Fixed Wage" },
                                { value: "hourly", label: "Hourly Wage" },
                              ]}
                              value={
                                formData.wage_type
                                  ? {
                                      value: formData.wage_type,
                                      label:
                                        formData.wage_type === "monthly"
                                          ? "Fixed Wage"
                                          : "Hourly Wage",
                                    }
                                  : null
                              }
                              onChange={(opt) =>
                                setFormData({
                                  ...formData,
                                  wage_type: opt?.value || "",
                                })
                              }
                            />
                          </div>

                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Wage (CTC) <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-white fw-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                className={`form-control fw-bold text-success ${isSubmitted ? (errors.wage ? "is-invalid border-danger" : "is-valid border-success") : "border-primary"}`}
                                value={formData.wage}
                                onChange={(e) => {
                                  setFormData({
                                    ...formData,
                                    wage: Number(e.target.value),
                                  });
                                  if (errors.wage) {
                                    setErrors({ ...errors, wage: null });
                                  }
                                }}
                              />
                            </div>
                            {isSubmitted && errors.wage && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.wage}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {/* TAB 2: SALARY STRUCTURE */}

                    {/* TAB 2: SALARY STRUCTURE */}

                    {activeTab === "salary" && (
                      <div className="animate__animated animate__fadeIn">
                        <div className="row g-4 mx-0">
                          <div className="col-md-7 border-end pe-4">
                            <h6 className="fw-bold text-success mb-3 border-bottom pb-2 fs-14">
                              <i className="ti ti-circle-plus me-2"></i>{" "}
                              Allowances & Benefits
                            </h6>

                            <div className="row g-2">
                              {[
                                {
                                  label: "Conveyance",

                                  key: "conveyance_allowances",
                                },

                                { label: "Skill", key: "skill_allowances" },

                                { label: "Food", key: "food_allowances" },

                                { label: "Washing", key: "washing_allowances" },

                                { label: "Special", key: "special_allowances" },

                                { label: "Medical", key: "medial_allowances" },

                                { label: "Uniform", key: "uniform_allowances" },

                                {
                                  label: "Child Education",

                                  key: "child_education_allowances",
                                },

                                {
                                  label: "Other Allowances",

                                  key: "other_allowances",
                                },

                                { label: "LTA", key: "lta" },

                                { label: "Variable Pay", key: "variable_pay" },
                              ].map((item) => (
                                <div className="col-md-6" key={item.key}>
                                  <label className="form-label fs-12 mb-1">
                                    {item.label}
                                  </label>

                                  <div className="input-group input-group-sm">
                                    <span className="input-group-text bg-light text-muted">
                                      ₹
                                    </span>

                                    <input
                                      type="number"
                                      className="form-control"
                                      value={(formData as any)[item.key]}
                                      onChange={(e) =>
                                        setFormData({
                                          ...formData,

                                          [item.key]: Number(e.target.value),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>

                          <div className="col-md-5 ps-4">
                            <h6 className="fw-bold text-danger mb-3 border-bottom pb-2 fs-14">
                              <i className="ti ti-circle-minus me-2"></i>{" "}
                              Deductions & Statutory
                            </h6>

                            <div className="row g-3">
                              <div className="col-12">
                                <label className="form-label fs-13">
                                  Professional Tax (PT)
                                </label>

                                <div className="input-group input-group-sm">
                                  <span className="input-group-text text-danger border-danger">
                                    ₹
                                  </span>

                                  <input
                                    type="number"
                                    className="form-control border-danger"
                                    value={formData.professional_tax}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,

                                        professional_tax: Number(
                                          e.target.value,
                                        ),
                                      })
                                    }
                                  />
                                </div>
                              </div>

                              <div className="col-12">
                                <label className="form-label fs-13">
                                  Gratuity Provision
                                </label>

                                <div className="input-group input-group-sm">
                                  <span className="input-group-text">₹</span>

                                  <input
                                    type="number"
                                    className="form-control"
                                    value={formData.gratuity}
                                    onChange={(e) =>
                                      setFormData({
                                        ...formData,

                                        gratuity: Number(e.target.value),
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "leave_config" && (
                      <div className="animate__animated animate__fadeIn">
                        {/* CONFIGURATION SELECTION CARD */}
                        <div className="card border-0 shadow-sm mb-4 bg-light-subtle rounded-4">
                          <div className="card-body p-4">
                            <div className="col-md-6">
                              <label className="form-label fs-13 fw-bold mb-1">
                                Leave Allocation Configuration{" "}
                                <span className="text-danger">*</span>
                              </label>
                              <CommonSelect
                                options={leaveConfigs.map((c) => ({
                                  value: String(c.id),
                                  label: c.name,
                                }))}
                                placeholder="Select Configuration"
                                value={
                                  leaveConfigs.find(
                                    (c) => String(c.id) === selectedLeaveConfig,
                                  )
                                    ? {
                                        value: selectedLeaveConfig,
                                        label: leaveConfigs.find(
                                          (c) =>
                                            String(c.id) ===
                                            selectedLeaveConfig,
                                        )?.name,
                                      }
                                    : null
                                }
                                onChange={(opt) =>
                                  handleLeaveConfigChange(opt?.value || "")
                                }
                              />
                            </div>
                          </div>
                        </div>

                        {/* PREVIEW TABLE (BASED ON YOUR JSON RESPONSE) */}
                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                            <h6 className="mb-0 fw-bold text-dark fs-14">
                              Leave Preview Details
                            </h6>
                            {loadingPreview && (
                              <div className="spinner-border spinner-border-sm text-primary" />
                            )}
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                              <thead className="bg-light">
                                <tr>
                                  <th className="fs-11 text-uppercase fw-bold text-muted ps-4">
                                    Leave Type
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted">
                                    Mode
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted text-center">
                                    Days
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted">
                                    Validity
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted">
                                    Status
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {leavePreview.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="text-center py-5 text-muted"
                                    >
                                      {selectedLeaveConfig
                                        ? "No allocations found for this config."
                                        : "Please select a configuration above."}
                                    </td>
                                  </tr>
                                ) : (
                                  leavePreview.map((item) => (
                                    <tr key={item.id}>
                                      {/* Extract name from [id, name] array */}
                                      <td className="ps-4 fw-bold text-dark">
                                        {Array.isArray(item.holiday_status_id)
                                          ? item.holiday_status_id[1]
                                          : "N/A"}
                                      </td>
                                      <td>
                                        <span
                                          className={`badge rounded-pill ${item.allocation_type === "accrual" ? "bg-info-transparent text-info" : "bg-primary-transparent text-primary"} fs-10`}
                                        >
                                          {item.allocation_type?.toUpperCase()}
                                        </span>
                                      </td>
                                      <td className="text-center fw-extrabold text-primary">
                                        {item.number_of_days}
                                      </td>
                                      <td>
                                        <div className="fs-12 text-muted">
                                          <i className="ti ti-calendar-event me-1"></i>
                                          {dayjs(item.date_from).format(
                                            "DD MMM YYYY",
                                          )}{" "}
                                          -{" "}
                                          {dayjs(item.date_to).format(
                                            "DD MMM YYYY",
                                          )}
                                        </div>
                                      </td>
                                      <td>
                                        <span className="badge badge-soft-success">
                                          {item.state?.toUpperCase()}
                                        </span>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )}
                    {/* {activeTab === "leave" && (
                      <div className="animate__animated animate__fadeIn">
                        <div className="card border-0 shadow-sm mb-4 bg-light-subtle rounded-4 overflow-hidden">
                          <div className="card-body p-4">
                            <div className="d-flex align-items-center mb-4">
                              <div className="bg-primary text-white rounded-circle p-2 me-3 shadow-sm">
                                <i
                                  className={`ti ti-${editingLeaveIndex > -1 ? "edit" : "plus"} fs-20`}
                                ></i>
                              </div>
                              <h6 className="mb-0 fw-bold text-dark fs-16">
                                {editingLeaveIndex > -1
                                  ? "Update Leave Entry"
                                  : "Add Leave Allocation"}
                              </h6>
                            </div>

                            <div className="row g-3">
                              <div className="col-md-4">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Leave Type{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <div
                                  className={
                                    leaveErrors.leave_type_id
                                      ? "border border-danger rounded shadow-sm"
                                      : ""
                                  }
                                >
                                  <CommonSelect
                                    options={leaveTypeOptions}
                                    placeholder="Select Leave"
                                    value={
                                      leaveTypeOptions.find(
                                        (o) =>
                                          o.value ===
                                          String(leaveFormData.leave_type_id),
                                      ) || null
                                    }
                                    onChange={(opt) => {
                                      setLeaveFormData({
                                        ...leaveFormData,
                                        leave_type_id: opt?.value || "",
                                      });
                                      if (leaveErrors.leave_type_id)
                                        setLeaveErrors({
                                          ...leaveErrors,
                                          leave_type_id: null,
                                        });
                                    }}
                                  />
                                </div>
                                {leaveErrors.leave_type_id && (
                                  <div className="text-danger fs-11 mt-1">
                                    {leaveErrors.leave_type_id}
                                  </div>
                                )}
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Allocation Method
                                </label>
                                <CommonSelect
                                  options={[
                                    { value: "regular", label: "Regular" },
                                    { value: "accrual", label: "Accrual" },
                                  ]}
                                  value={{
                                    value: leaveFormData.allocation_type,
                                    label:
                                      leaveFormData.allocation_type ===
                                      "accrual"
                                        ? "Accrual"
                                        : "Regular",
                                  }}
                                  onChange={(opt) =>
                                    setLeaveFormData({
                                      ...leaveFormData,
                                      allocation_type: opt?.value || "regular",
                                    })
                                  }
                                />
                                {leaveErrors.allocation_type && (
                                  <div className="text-danger fs-11 mt-1">
                                    {leaveErrors.allocation_type}
                                  </div>
                                )}
                              </div>

                              {leaveFormData.allocation_type === "accrual" && (
                                <div className="col-md-4 animate__animated animate__fadeInDown">
                                  <label className="form-label fs-13 fw-bold mb-1">
                                    Accrual Plan{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div
                                    className={
                                      leaveErrors.accrual_plan_id
                                        ? "border border-danger rounded shadow-sm"
                                        : ""
                                    }
                                  >
                                    <CommonSelect
                                      options={accruralPlanOptions}
                                      placeholder="Select Plan"
                                      value={
                                        accruralPlanOptions.find(
                                          (o) =>
                                            o.value ===
                                            String(
                                              leaveFormData.accrual_plan_id,
                                            ),
                                        ) || null
                                      }
                                      onChange={(opt) => {
                                        setLeaveFormData({
                                          ...leaveFormData,
                                          accrual_plan_id: opt?.value || "",
                                        });
                                        if (leaveErrors.accrual_plan_id)
                                          setLeaveErrors({
                                            ...leaveErrors,
                                            accrual_plan_id: null,
                                          });
                                      }}
                                    />
                                  </div>
                                  {leaveErrors.accrual_plan_id && (
                                    <div className="text-danger fs-11 mt-1">
                                      {leaveErrors.accrual_plan_id}
                                    </div>
                                  )}
                                </div>
                              )}

                              <div className="col-md-2">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Total Days{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <input
                                  type="number"
                                  className={`form-control ${leaveErrors.allocation_days ? "is-invalid shadow-sm" : ""}`}
                                  placeholder="0.0"
                                  value={leaveFormData.allocation_days}
                                  onChange={(e) => {
                                    setLeaveFormData({
                                      ...leaveFormData,
                                      allocation_days: e.target.value,
                                    });
                                    if (leaveErrors.allocation_days)
                                      setLeaveErrors({
                                        ...leaveErrors,
                                        allocation_days: null,
                                      });
                                  }}
                                />
                                {leaveErrors.allocation_days && (
                                  <div className="text-danger fs-11 mt-1">
                                    {leaveErrors.allocation_days}
                                  </div>
                                )}
                              </div>

                              <div className="col-md-3">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Valid From{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <DatePicker
                                  className={`form-control w-100 ${leaveErrors.from_date ? "is-invalid border-danger shadow-sm" : ""}`}
                                  value={
                                    leaveFormData.from_date
                                      ? dayjs(leaveFormData.from_date)
                                      : null
                                  }
                                  onChange={(_, dateStr) => {
                                    setLeaveFormData({
                                      ...leaveFormData,
                                      from_date: String(dateStr),
                                    });

                                    if (leaveErrors.from_date)
                                      setLeaveErrors({
                                        ...leaveErrors,
                                        from_date: null,
                                      });
                                  }}
                                />
                                {leaveErrors.from_date && (
                                  <div className="text-danger fs-11 mt-1">
                                    {leaveErrors.from_date}
                                  </div>
                                )}
                              </div>

                              <div className="col-md-3">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Valid To{" "}
                                  <span className="text-danger">*</span>
                                </label>
                                <DatePicker
                                  className={`form-control w-100 ${leaveErrors.to_date ? "is-invalid border-danger shadow-sm" : ""}`}
                                  value={
                                    leaveFormData.to_date
                                      ? dayjs(leaveFormData.to_date)
                                      : null
                                  }
                                  onChange={(_, dateStr) => {
                                    setLeaveFormData({
                                      ...leaveFormData,
                                      to_date: String(dateStr),
                                    });
                                    if (leaveErrors.to_date)
                                      setLeaveErrors({
                                        ...leaveErrors,
                                        to_date: null,
                                      });
                                  }}
                                />
                                {leaveErrors.to_date && (
                                  <div className="text-danger fs-11 mt-1">
                                    {leaveErrors.to_date}
                                  </div>
                                )}
                              </div>

                              <div className="col-md-4">
                                <label className="form-label fs-13 fw-bold mb-1">
                                  Description
                                </label>
                                <input
                                  type="text"
                                  className="form-control"
                                  placeholder="Add remarks..."
                                  value={leaveFormData.description}
                                  onChange={(e) =>
                                    setLeaveFormData({
                                      ...leaveFormData,
                                      description: e.target.value,
                                    })
                                  }
                                />
                              </div>

                              <div className="col-md-12 d-flex justify-content-end gap-2 mt-2">
                                {editingLeaveIndex > -1 && (
                                  <button
                                    type="button"
                                    className="btn btn-light btn-sm px-3"
                                    onClick={() => {
                                      setEditingLeaveIndex(-1);
                                      setLeaveFormData(initialLeaveState);
                                      setLeaveErrors({});
                                    }}
                                  >
                                    Cancel Edit
                                  </button>
                                )}
                                <button
                                  type="button"
                                  className={`btn btn-sm px-4 shadow-sm ${editingLeaveIndex > -1 ? "btn-warning text-dark" : "btn-primary"}`}
                                  onClick={handleAddLeaveToList}
                                >
                                  <i
                                    className={`ti ti-${editingLeaveIndex > -1 ? "check" : "plus"} me-1`}
                                  ></i>
                                  {editingLeaveIndex > -1
                                    ? "Update Entry"
                                    : "Add to Allocation List"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="card border-0 shadow-sm rounded-4 overflow-hidden bg-white">
                          <div className="card-header bg-white py-3 border-bottom d-flex align-items-center justify-content-between">
                            <h6 className="mb-0 fw-bold text-dark fs-14">
                              Added Allocations ({leaveAllocations.length})
                            </h6>
                            <span className="text-muted fs-12 italic">
                              The table below will be saved with the contract
                            </span>
                          </div>
                          <div className="table-responsive">
                            <table className="table table-hover align-middle mb-0">
                              <thead className="bg-light">
                                <tr>
                                  <th className="fs-11 text-uppercase fw-bold text-muted ps-4">
                                    Leave Type
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted">
                                    Method
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted text-center">
                                    Days
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted">
                                    Validity
                                  </th>
                                  <th className="fs-11 text-uppercase fw-bold text-muted text-end pe-4">
                                    Action
                                  </th>
                                </tr>
                              </thead>
                              <tbody>
                                {leaveAllocations.length === 0 ? (
                                  <tr>
                                    <td
                                      colSpan={5}
                                      className="text-center py-5"
                                    >
                                      <div className="d-flex flex-column align-items-center opacity-50">
                                        <i className="ti ti-calendar-cancel fs-40 mb-2"></i>
                                        <span className="fs-13">
                                          No leaves added to the list yet.
                                        </span>
                                      </div>
                                    </td>
                                  </tr>
                                ) : (
                                  leaveAllocations.map((item, index) => (
                                    <tr
                                      key={index}
                                      className={
                                        editingLeaveIndex === index
                                          ? "table-active"
                                          : ""
                                      }
                                    >
                                      <td className="ps-4">
                                        <div className="fw-bold text-dark fs-13">
                                          {leaveTypes.find(
                                            (t) =>
                                              String(t.id) ===
                                              String(item.leave_type_id),
                                          )?.name || "Leave"}
                                        </div>
                                        <div
                                          className="fs-11 text-muted text-truncate"
                                          style={{ maxWidth: "200px" }}
                                        >
                                          {item.description || "No description"}
                                        </div>
                                      </td>
                                      <td>
                                        <span
                                          className={`badge rounded-pill ${item.allocation_type === "accrual" ? "bg-info-transparent text-info" : "bg-primary-transparent text-primary"} fs-10 px-2`}
                                        >
                                          {item.allocation_type.toUpperCase()}
                                        </span>
                                        {item.accrual_plan_id && (
                                          <div className="fs-10 text-muted mt-1">
                                            Plan:{" "}
                                            {
                                              accrualPlans.find(
                                                (p) =>
                                                  String(p.id) ===
                                                  String(item.accrual_plan_id),
                                              )?.name
                                            }
                                          </div>
                                        )}
                                      </td>
                                      <td className="text-center">
                                        <span className="fw-bold text-dark fs-14">
                                          {item.allocation_days}
                                        </span>{" "}
                                        <small className="text-muted">
                                          Days
                                        </small>
                                      </td>
                                      <td>
                                        <div className="d-flex align-items-center fs-12 text-dark">
                                          <i className="ti ti-calendar-event me-2 text-muted fs-16"></i>
                                          {dayjs(item.from_date).format(
                                            "MMM DD",
                                          )}{" "}
                                          -{" "}
                                          {dayjs(item.to_date).format(
                                            "MMM DD, YYYY",
                                          )}
                                        </div>
                                      </td>
                                      <td className="text-end pe-4">
                                        <div className="d-flex justify-content-end gap-1">
                                          <button
                                            type="button"
                                            className="btn btn-icon btn-sm text-primary bg-primary-transparent rounded-circle"
                                            onClick={() =>
                                              handleEditLeaveInList(index)
                                            }
                                          >
                                            <i className="ti ti-edit fs-16"></i>
                                          </button>
                                          <button
                                            type="button"
                                            className="btn btn-icon btn-sm text-danger bg-danger-transparent rounded-circle"
                                            onClick={() =>
                                              handleDeleteLeaveFromList(index)
                                            }
                                          >
                                            <i className="ti ti-trash fs-16"></i>
                                          </button>
                                        </div>
                                      </td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      </div>
                    )} */}
                  </div>
                </>
              )}
            </div>

            <div className="modal-footer border-0 bg-white px-4">
              <button
                type="button"
                className="btn btn-light px-4"
                data-bs-dismiss="modal"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="btn btn-primary px-5 shadow-sm"
                disabled={loading}
              >
                {loading && (
                  <span className="spinner-border spinner-border-sm me-2" />
                )}
                {data ? "Update Contract" : "Save Contract"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddEditContractModal;

// ===============================================================================================================================================

// import React, { useEffect, useState } from "react";
// import { toast } from "react-toastify";
// import dayjs from "dayjs"; // Make sure to import dayjs
// import {
//   Contract,
//   Employee,
//   WorkingSchedule,
//   Department,
//   createContract,
//   updateContract,
//   getEmployees,
//   getWorkingSchedules,
//   getDepartments,
// } from "./contractService";
// import CommonSelect from "@/core/common/commonSelect";
// import { DatePicker } from "antd";
// import { WorkEntryType } from "../Master Modules/WorkEntryType/WorkEntryTypeServices";
// import {
//   createLeaveAllocation,
//   updateLeaveAllocation,
// } from "../LeaveModules/leaveAllocation/LeaveAllocationServices";
// import { getLeaveTypesCode } from "../LeaveModules/leaveTypes/LeavetypesServices";
// import { getAccruralPlans } from "../Master Modules/AccruralPlan/AccruralPlanServices";

// interface AddEditContractModalProps {
//   onSuccess: () => void;
//   data?: Contract | null;
//   onClose: () => void;
// }

// const AddEditContractModal: React.FC<AddEditContractModalProps> = ({
//   onSuccess,
//   data,
//   onClose,
// }) => {
//   const [loading, setLoading] = useState(false);
//   const [isSubmitted, setIsSubmitted] = useState(false); // Add this for validation
//   const [activeTab, setActiveTab] = useState("basic");
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [workingSchedules, setWorkingSchedules] = useState<WorkingSchedule[]>(
//     [],
//   );
//   const [departments, setDepartments] = useState<Department[]>([]);
//   const [loadingDropdowns, setLoadingDropdowns] = useState(true);
//   const [leaveTypes, setLeaveTypes] = useState<any[]>([]);
//   const [accrualPlans, setAccrualPlans] = useState<any[]>([]);
//   const [errors, setErrors] = useState<any>({});

//   const [formData, setFormData] = useState<Omit<Contract, "id">>({
//     name: "",
//     employee_code: "",
//     employee_id: 0,
//     job_id: 0,
//     date_start: "",
//     date_end: "",
//     work_entry_source: "calendar",
//     resource_calendar_id: 0,
//     structure_type_id: 0,
//     department_id: 0,
//     contract_type_id: 0,
//     wage_type: "monthly",
//     schedule_pay: "monthly",
//     wage: 0,
//     conveyance_allowances: 0,
//     skill_allowances: 0,
//     food_allowances: 0,
//     washing_allowances: 0,
//     special_allowances: 0,
//     medial_allowances: 0,
//     uniform_allowances: 0,
//     child_education_allowances: 0,
//     other_allowances: 0,
//     variable_pay: 0,
//     gratuity: 0,
//     professional_tax: 0,
//     lta: 0,
//   });

//   const [leaveFormData, setLeaveFormData] = useState({
//     allocation_type: "regular",
//     leave_type_id: "",
//     accrual_plan_id: "",
//     from_date: "",
//     to_date: "",
//     allocation_days: "",
//     description: "",
//   });

//   useEffect(() => {
//     const loadDropdownData = async () => {
//       setLoadingDropdowns(true);
//       try {
//         const [empData, scheduleData, deptData, leaveData, accrualData] =
//           await Promise.all([
//             getEmployees(),
//             getWorkingSchedules(),
//             getDepartments(),
//             getLeaveTypesCode(),
//             getAccruralPlans(),
//           ]);
//         setEmployees(empData);
//         setWorkingSchedules(scheduleData);
//         setDepartments(deptData);
//         setLeaveTypes(leaveData);
//         setAccrualPlans(accrualData);
//       } catch (error) {
//         toast.error("Failed to load schema data");
//       } finally {
//         setLoadingDropdowns(false);
//       }
//     };
//     loadDropdownData();
//   }, []);

//   useEffect(() => {
//     if (data) {
//       setFormData({ ...data });
//     }
//   }, [data]);

//   const leaveTypeOptions = leaveTypes.map((t: any) => ({
//     value: String(t.id),
//     label: t.name,
//   }));
//   const accruralPlanOptions = accrualPlans.map((p: any) => ({
//     value: String(p.id),
//     label: p.name,
//   }));

//   const handleEmployeeChange = (employeeId: number) => {
//     const selectedEmployee = employees.find((emp) => emp.id === employeeId);
//     if (selectedEmployee) {
//       setFormData((prev) => ({
//         ...prev,
//         employee_id: employeeId,
//         employee_code: selectedEmployee.employee_code,
//         name: `Contract for ${selectedEmployee.name}`,
//       }));
//     }
//   };

//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     setIsSubmitted(true);

//     let tempErrors: any = {};
//     let isValid = true;

//     // Simple Validation Check
//     if (!formData.employee_id) {
//       tempErrors.employee_id = "Employee is required";
//       isValid = false;
//     }
//     if (!formData.date_start) {
//       tempErrors.date_start = "Start Date is required";
//       isValid = false;
//     }

//     const isLeaveActive =
//       leaveFormData.leave_type_id ||
//       leaveFormData.allocation_days ||
//       leaveFormData.from_date;

//     if (isLeaveActive) {
//       if (!leaveFormData.leave_type_id) {
//         tempErrors.leave_type_id = "Leave Type is required";
//         isValid = false;
//       }
//       if (
//         leaveFormData.allocation_type === "accrual" &&
//         !leaveFormData.accrual_plan_id
//       ) {
//         tempErrors.accrual_plan_id = "Accrual Plan is required";
//         isValid = false;
//       }
//       if (!leaveFormData.from_date) {
//         tempErrors.from_date = "From Date is required";
//         isValid = false;
//       }
//       if (!leaveFormData.to_date) {
//         tempErrors.to_date = "To Date is required";
//         isValid = false;
//       }
//       if (!leaveFormData.allocation_days) {
//         tempErrors.allocation_days = "Allocation Days are required";
//         isValid = false;
//       }
//     }

//     setErrors(tempErrors);

//     if (!isValid) {
//       toast.error("Please fill in all required fields marked in red.");
//       return;
//     }

//     setLoading(true);
//     try {
//       if (data?.id) {
//         await updateContract(data.id, formData);
//         toast.success("Contract updated successfully");
//       } else {
//         await createContract(formData);
//         toast.success("Contract created successfully");
//       }
//       if (leaveFormData.leave_type_id) {
//         const leavePayload = {
//           ...leaveFormData,
//           employee_id: formData.employee_id, // Link to the same employee
//           number_of_days: leaveFormData.allocation_days,
//         };

//         await createLeaveAllocation(leavePayload);
//         toast.success("Leave allocation configured");
//       }
//       onSuccess();
//       onClose();
//     } catch (error: any) {
//       toast.error(error.message || "Failed to save contract/leave data");
//     } finally {
//       setLoading(false);
//     }
//   };

//   return (
//     <div className="modal fade" id="add_contract" tabIndex={-1} role="dialog">
//       <div
//         className="modal-dialog modal-xl modal-dialog-centered"
//         role="document"
//       >
//         <div className="modal-content bg-white border-0 shadow-lg">
//           <div className="modal-header border-bottom bg-light py-2">
//             <h5 className="modal-title fw-bold fs-15">
//               <i className="ti ti-file-certificate me-2 text-primary"></i>
//               {data ? "Edit Contract Detail" : "Add New Contract"}
//             </h5>
//             <button
//               type="button"
//               className="btn-close"
//               data-bs-dismiss="modal"
//               onClick={onClose}
//             />
//           </div>

//           <form onSubmit={handleSubmit}>
//             <div className="modal-body">
//               {loadingDropdowns ? (
//                 <div className="text-center p-5">
//                   <div className="spinner-border text-primary" />
//                   <div className="mt-2 text-muted">
//                     Syncing contract data...
//                   </div>
//                 </div>
//               ) : (
//                 <>
//                   <div className="employee-tabs-scrollable border-bottom mb-4">
//                     <ul
//                       className="nav nav-tabs flex-nowrap overflow-auto hide-scrollbar"
//                       role="tablist"
//                     >
//                       <li className="nav-item">
//                         <button
//                           className={`nav-link fw-medium d-flex align-items-center ${activeTab === "basic" ? "active" : ""}`}
//                           onClick={() => setActiveTab("basic")}
//                           type="button"
//                         >
//                           <i className="ti ti-info-circle me-2 fs-16"></i> Basic
//                           Information
//                         </button>
//                       </li>
//                       <li className="nav-item">
//                         <button
//                           className={`nav-link fw-medium d-flex align-items-center ${activeTab === "salary" ? "active" : ""}`}
//                           onClick={() => setActiveTab("salary")}
//                           type="button"
//                         >
//                           <i className="ti ti-wallet me-2 fs-16"></i> Salary
//                           Structure
//                         </button>
//                       </li>
//                       <li className="nav-item">
//                         <button
//                           className={`nav-link fw-medium d-flex align-items-center ${activeTab === "leave" ? "active" : ""}`}
//                           onClick={() => setActiveTab("leave")}
//                           type="button"
//                         >
//                           <i className="ti ti-calendar me-2 fs-16"></i> Leave
//                           Structure
//                         </button>
//                       </li>
//                     </ul>
//                   </div>

//                   <div
//                     className="tab-content px-1"
//                     style={{ minHeight: "420px" }}
//                   >
//                     {activeTab === "basic" && (
//                       <div className="animate__animated animate__fadeIn">
//                         <h6 className="fw-bold text-primary mb-3 fs-14">
//                           <i className="ti ti-user-check me-2"></i> Employee
//                           Assignment
//                         </h6>
//                         <div className="row g-3 mx-0 mb-4">
//                           <div className="col-md-5 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Employee Name{" "}
//                               <span className="text-danger">*</span>
//                             </label>
//                             <CommonSelect
//                               options={employees.map((e) => ({
//                                 value: String(e.id),
//                                 label: e.name,
//                               }))}
//                               placeholder="Select Employee"
//                               value={
//                                 formData.employee_id
//                                   ? {
//                                       value: String(formData.employee_id),
//                                       label:
//                                         employees.find(
//                                           (e) => e.id === formData.employee_id,
//                                         )?.name || "",
//                                     }
//                                   : null
//                               }
//                               onChange={(opt) =>
//                                 handleEmployeeChange(Number(opt?.value))
//                               }
//                             />{" "}
//                             {errors.employee_id && (
//                               <div className="text-danger fs-11 mt-1">
//                                 {errors.employee_id}
//                               </div>
//                             )}
//                           </div>
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Contract Reference
//                             </label>
//                             <input
//                               type="text"
//                               className="form-control"
//                               value={formData.name}
//                               onChange={(e) =>
//                                 setFormData({
//                                   ...formData,
//                                   name: e.target.value,
//                                 })
//                               }
//                             />
//                           </div>
//                         </div>

//                         <hr className="my-4 opacity-25" />

//                         <h6 className="fw-bold text-primary mb-3 fs-14">
//                           <i className="ti ti-settings me-2"></i> Configuration
//                           Details
//                         </h6>
//                         <div className="row g-3 mx-0">
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Start Date <span className="text-danger">*</span>
//                             </label>
//                             <DatePicker
//                               className={`form-control w-100 ${isSubmitted && !formData.date_start ? "is-invalid" : ""}`}
//                               value={
//                                 formData.date_start
//                                   ? dayjs(formData.date_start)
//                                   : null
//                               }
//                               format="YYYY-MM-DD"
//                               onChange={(date, dateStr) => {
//                                 setFormData({
//                                   ...formData,
//                                   date_start: Array.isArray(dateStr)
//                                     ? dateStr[0]
//                                     : dateStr,
//                                 });
//                               }}
//                             />
//                             {errors.date_start && (
//                               <div className="text-danger fs-11 mt-1">
//                                 {errors.date_start}
//                               </div>
//                             )}
//                           </div>

//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13">
//                               Work Entry Source
//                             </label>
//                             <CommonSelect
//                               options={[
//                                 {
//                                   value: "calendar",
//                                   label: "Working Schedule",
//                                 },
//                                 { value: "attendances", label: "Attendances" },
//                               ]}
//                               value={
//                                 formData.work_entry_source
//                                   ? {
//                                       value: formData.work_entry_source,
//                                       label:
//                                         formData.work_entry_source ===
//                                         "calendar"
//                                           ? "Working Schedule"
//                                           : "Attendances",
//                                     }
//                                   : null
//                               }
//                               onChange={(opt) =>
//                                 setFormData({
//                                   ...formData,
//                                   work_entry_source: opt?.value || "",
//                                 })
//                               }
//                             />
//                           </div>
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13">
//                               Working Schedule
//                             </label>
//                             <CommonSelect
//                               options={workingSchedules.map((s) => ({
//                                 value: String(s.id),
//                                 label: s.name,
//                               }))}
//                               value={
//                                 formData.resource_calendar_id
//                                   ? {
//                                       value: String(
//                                         formData.resource_calendar_id,
//                                       ),
//                                       label:
//                                         workingSchedules.find(
//                                           (s) =>
//                                             s.id ===
//                                             formData.resource_calendar_id,
//                                         )?.name || "",
//                                     }
//                                   : null
//                               }
//                               onChange={(opt) =>
//                                 setFormData({
//                                   ...formData,
//                                   resource_calendar_id: Number(opt?.value),
//                                 })
//                               }
//                             />
//                           </div>
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13">
//                               Department
//                             </label>
//                             <CommonSelect
//                               options={departments.map((d) => ({
//                                 value: String(d.id),
//                                 label: d.name,
//                               }))}
//                               value={
//                                 formData.department_id
//                                   ? {
//                                       value: String(formData.department_id),
//                                       label:
//                                         departments.find(
//                                           (d) =>
//                                             d.id === formData.department_id,
//                                         )?.name || "",
//                                     }
//                                   : null
//                               }
//                               onChange={(opt) =>
//                                 setFormData({
//                                   ...formData,
//                                   department_id: Number(opt?.value),
//                                 })
//                               }
//                             />
//                           </div>
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13">
//                               Wage Type
//                             </label>
//                             <CommonSelect
//                               options={[
//                                 { value: "monthly", label: "Fixed Wage" },
//                                 { value: "hourly", label: "Hourly Wage" },
//                               ]}
//                               value={
//                                 formData.wage_type
//                                   ? {
//                                       value: formData.wage_type,
//                                       label:
//                                         formData.wage_type === "monthly"
//                                           ? "Fixed Wage"
//                                           : "Hourly Wage",
//                                     }
//                                   : null
//                               }
//                               onChange={(opt) =>
//                                 setFormData({
//                                   ...formData,
//                                   wage_type: opt?.value || "",
//                                 })
//                               }
//                             />
//                           </div>
//                           <div className="col-md-4 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Wage (CTC) <span className="text-danger">*</span>
//                             </label>
//                             <div className="input-group">
//                               <span className="input-group-text bg-white fw-bold">
//                                 ₹
//                               </span>
//                               <input
//                                 type="number"
//                                 className="form-control border-primary fw-bold text-success"
//                                 value={formData.wage}
//                                 onChange={(e) =>
//                                   setFormData({
//                                     ...formData,
//                                     wage: Number(e.target.value),
//                                   })
//                                 }
//                               />
//                               {errors.wage && (
//                                 <div className="text-danger fs-11 mt-1">
//                                   {errors.wage}
//                                 </div>
//                               )}
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* TAB 2: SALARY STRUCTURE */}
//                     {activeTab === "salary" && (
//                       <div className="animate__animated animate__fadeIn">
//                         <div className="row g-4 mx-0">
//                           {/* COLUMN 1: EARNINGS & ALLOWANCES */}
//                           <div className="col-md-7 border-end pe-4">
//                             <h6 className="fw-bold text-success mb-3 border-bottom pb-2 fs-14">
//                               <i className="ti ti-circle-plus me-2"></i>{" "}
//                               Allowances & Benefits
//                             </h6>
//                             <div className="row g-2">
//                               {[
//                                 {
//                                   label: "Conveyance",
//                                   key: "conveyance_allowances",
//                                 },
//                                 { label: "Skill", key: "skill_allowances" },
//                                 { label: "Food", key: "food_allowances" },
//                                 { label: "Washing", key: "washing_allowances" },
//                                 { label: "Special", key: "special_allowances" },
//                                 { label: "Medical", key: "medial_allowances" },
//                                 { label: "Uniform", key: "uniform_allowances" },
//                                 {
//                                   label: "Child Education",
//                                   key: "child_education_allowances",
//                                 },
//                                 {
//                                   label: "Other Allowances",
//                                   key: "other_allowances",
//                                 },
//                                 { label: "LTA", key: "lta" },
//                                 { label: "Variable Pay", key: "variable_pay" },
//                               ].map((item) => (
//                                 <div className="col-md-6" key={item.key}>
//                                   <label className="form-label fs-12 mb-1">
//                                     {item.label}
//                                   </label>
//                                   <div className="input-group input-group-sm">
//                                     <span className="input-group-text bg-light text-muted">
//                                       ₹
//                                     </span>
//                                     <input
//                                       type="number"
//                                       className="form-control"
//                                       value={(formData as any)[item.key]}
//                                       onChange={(e) =>
//                                         setFormData({
//                                           ...formData,
//                                           [item.key]: Number(e.target.value),
//                                         })
//                                       }
//                                     />
//                                   </div>
//                                 </div>
//                               ))}
//                             </div>
//                           </div>

//                           {/* COLUMN 2: DEDUCTIONS */}
//                           <div className="col-md-5 ps-4">
//                             <h6 className="fw-bold text-danger mb-3 border-bottom pb-2 fs-14">
//                               <i className="ti ti-circle-minus me-2"></i>{" "}
//                               Deductions & Statutory
//                             </h6>
//                             <div className="row g-3">
//                               <div className="col-12">
//                                 <label className="form-label fs-13">
//                                   Professional Tax (PT)
//                                 </label>
//                                 <div className="input-group input-group-sm">
//                                   <span className="input-group-text text-danger border-danger">
//                                     ₹
//                                   </span>
//                                   <input
//                                     type="number"
//                                     className="form-control border-danger"
//                                     value={formData.professional_tax}
//                                     onChange={(e) =>
//                                       setFormData({
//                                         ...formData,
//                                         professional_tax: Number(
//                                           e.target.value,
//                                         ),
//                                       })
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                               <div className="col-12">
//                                 <label className="form-label fs-13">
//                                   Gratuity Provision
//                                 </label>
//                                 <div className="input-group input-group-sm">
//                                   <span className="input-group-text">₹</span>
//                                   <input
//                                     type="number"
//                                     className="form-control"
//                                     value={formData.gratuity}
//                                     onChange={(e) =>
//                                       setFormData({
//                                         ...formData,
//                                         gratuity: Number(e.target.value),
//                                       })
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>
//                     )}

//                     {/* TAB 2: SALARY STRUCTURE */}
//                     {/* TAB 3: LEAVE STRUCTURE */}
//                     {activeTab === "leave" && (
//                       <div className="animate__animated animate__fadeIn">
//                         <h6 className="fw-bold text-primary mb-3 fs-14">
//                           <i className="ti ti-calendar-share me-2"></i> Leave
//                           Allocation Configuration
//                         </h6>
//                         <div className="row g-3 mx-0">
//                           {/* Allocation Type */}
//                           <div className="col-md-6 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Allocation Type
//                             </label>
//                             <CommonSelect
//                               options={[
//                                 { value: "regular", label: "Regular" },
//                                 { value: "accrual", label: "Accrual" },
//                               ]}
//                               value={{
//                                 value: leaveFormData.allocation_type,
//                                 label:
//                                   leaveFormData.allocation_type === "accrual"
//                                     ? "Accrual"
//                                     : "Regular",
//                               }}
//                               onChange={(opt) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   allocation_type: opt?.value || "regular",
//                                 })
//                               }
//                             />
//                           </div>

//                           {/* Leave Type */}
//                           <div className="col-md-6 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Leave Type <span className="text-danger">*</span>
//                             </label>
//                             <CommonSelect
//                               options={leaveTypeOptions}
//                               placeholder="Select Leave Type"
//                               value={
//                                 leaveTypeOptions.find(
//                                   (opt) =>
//                                     opt.value ===
//                                     String(leaveFormData.leave_type_id),
//                                 ) || null
//                               }
//                               onChange={(opt) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   leave_type_id: opt?.value || "",
//                                 })
//                               }
//                             />
//                           </div>

//                           {/* Accrual Plan - Only visible if type is accrual */}
//                           {leaveFormData.allocation_type === "accrual" && (
//                             <div className="col-md-6 px-1">
//                               <label className="form-label fs-13 fw-bold">
//                                 Accrual Plan
//                               </label>
//                               <CommonSelect
//                                 options={accruralPlanOptions}
//                                 placeholder="Select Plan"
//                                 value={
//                                   accruralPlanOptions.find(
//                                     (opt) =>
//                                       opt.value ===
//                                       String(leaveFormData.accrual_plan_id),
//                                   ) || null
//                                 }
//                                 onChange={(opt) =>
//                                   setLeaveFormData({
//                                     ...leaveFormData,
//                                     accrual_plan_id: opt?.value || "",
//                                   })
//                                 }
//                               />
//                             </div>
//                           )}

//                           {/* Allocation Days */}
//                           <div className="col-md-6 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Allocation Days
//                             </label>
//                             <input
//                               type="number"
//                               className="form-control"
//                               placeholder="e.g. 15"
//                               value={leaveFormData.allocation_days}
//                               onChange={(e) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   allocation_days: e.target.value,
//                                 })
//                               }
//                             />
//                           </div>

//                           {/* Validity Dates */}
//                           <div className="col-md-6 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Valid From
//                             </label>
//                             <DatePicker
//                               className="form-control w-100"
//                               value={
//                                 leaveFormData.from_date
//                                   ? dayjs(leaveFormData.from_date)
//                                   : null
//                               }
//                               onChange={(_, dateStr) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   from_date: String(dateStr),
//                                 })
//                               }
//                             />
//                           </div>

//                           <div className="col-md-6 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Valid To
//                             </label>
//                             <DatePicker
//                               className="form-control w-100"
//                               value={
//                                 leaveFormData.to_date
//                                   ? dayjs(leaveFormData.to_date)
//                                   : null
//                               }
//                               onChange={(_, dateStr) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   to_date: String(dateStr),
//                                 })
//                               }
//                             />
//                           </div>

//                           {/* Description */}
//                           <div className="col-12 px-1">
//                             <label className="form-label fs-13 fw-bold">
//                               Description
//                             </label>
//                             <textarea
//                               className="form-control"
//                               rows={2}
//                               placeholder="Add any notes regarding this allocation..."
//                               value={leaveFormData.description}
//                               onChange={(e) =>
//                                 setLeaveFormData({
//                                   ...leaveFormData,
//                                   description: e.target.value,
//                                 })
//                               }
//                             />
//                           </div>
//                         </div>
//                       </div>
//                     )}
//                   </div>
//                 </>
//               )}
//             </div>

//             <div className="modal-footer border-0 bg-white px-4">
//               <button
//                 type="button"
//                 className="btn btn-light px-4"
//                 data-bs-dismiss="modal"
//                 onClick={onClose}
//               >
//                 Cancel
//               </button>
//               <button
//                 type="submit"
//                 className="btn btn-primary px-5 shadow-sm"
//                 disabled={loading}
//               >
//                 {loading && (
//                   <span className="spinner-border spinner-border-sm me-2" />
//                 )}
//                 {data ? "Update Contract" : "Save Contract"}
//               </button>
//             </div>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default AddEditContractModal;
