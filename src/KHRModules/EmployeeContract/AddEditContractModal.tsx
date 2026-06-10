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
  getStructureHeaders,
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
  work_entry_source: "attendance",
  resource_calendar_id: 0,
  structure_type_id: 0,
  department_id: 0,
  contract_type_id: 0,
  wage_type: "monthly",
  schedule_pay: "monthly",
  wage: 0,
  components: [
    { structure_head_id: 1, amount: 0, addition: true },
    { structure_head_id: 3, amount: 0, addition: true },
    { structure_head_id: 4, amount: 0, addition: true },
    { structure_head_id: 20, amount: 0, deduction: true },
  ],
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
  const [manualPFBase, setManualPFBase] = useState<number | null>(null);
  const [manualESICBase, setManualESICBase] = useState<number | null>(null);
  const [editingPFBase, setEditingPFBase] = useState(false);
  const [editingESICBase, setEditingESICBase] = useState(false);

  const [manualEmployerPF, setManualEmployerPF] = useState<number | null>(null);
  const [manualEmployerESIC, setManualEmployerESIC] = useState<number | null>(null);
  const [employerPFPct, setEmployerPFPct] = useState<number>(13);
  const [employerESICPct, setEmployerESICPct] = useState<number>(3.25);
  const [editingEmployerPF, setEditingEmployerPF] = useState(false);
  const [editingEmployerESIC, setEditingEmployerESIC] = useState(false);

  // Salary Structure Headers
  const [structureHeaders, setStructureHeaders] = useState<any[]>([]);

  // Form States
  const [formData, setFormData] = useState<Omit<Contract, "id">>({
    name: "",
    employee_code: "",
    employee_id: 0,
    job_id: 0,
    date_start: "",
    date_end: "",
    work_entry_source: "attendance",
    resource_calendar_id: 0,
    structure_type_id: 0,
    department_id: 0,
    contract_type_id: 0,
    wage_type: "monthly",
    schedule_pay: "monthly",
    wage: 0,
    components: [
      { structure_head_id: 1, amount: 0, addition: true },
      { structure_head_id: 3, amount: 0, addition: true },
      { structure_head_id: 4, amount: 0, addition: true },
      { structure_head_id: 20, amount: 0, deduction: true },
    ],
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

        // 6. Check Structure Headers
        const headersRes = await getStructureHeaders();
        console.log("CHECKPOINT: getStructureHeaders finished", headersRes);
        setStructureHeaders(extractDataArray(headersRes, "StructureHeaders"));

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
        components:
          (data as any).dynamic_fields &&
            (data as any).dynamic_fields.length > 0
            ? (data as any).dynamic_fields.map((f: any) => {
              let headId: any = f.structure_header_id
                ? Number(f.structure_header_id)
                : "";

              // Fallbacks for missing header IDs
              if (!headId && f.name) {
                const nameStr = f.name.toLowerCase().trim();
                if (nameStr === "basic") headId = 1;
                else if (nameStr === "dearness allowance") headId = 2;
                else if (nameStr === "hra") headId = 3;
                else if (nameStr === "skill allowance") headId = 4;
                else if (nameStr === "attendance allowance") headId = 5;
                else if (nameStr === "food allowance") headId = 6;
                else if (nameStr === "washing allowance") headId = 7;
                else if (nameStr === "conveyance") headId = 8;
                else if (nameStr === "leave allowance") headId = 9;
                else if (nameStr === "bonus") headId = 10;
                else if (nameStr === "gratuity") headId = 11;
                else if (nameStr === "other" || nameStr === "other allowance")
                  headId = 12;
                else if (nameStr === "uniform allowance") headId = 13;
                else if (nameStr === "mobile allowance") headId = 14;
                else if (nameStr === "travel allowance") headId = 15;
                else if (nameStr === "educational allowance") headId = 16;
                else if (nameStr === "city compensatory allowance")
                  headId = 17;
                else if (nameStr === "pf employee") headId = 18;
                else if (nameStr === "esic employee") headId = 19;
                else if (nameStr === "pt" || nameStr === "professional tax")
                  headId = 20;
                else if (nameStr === "lta") headId = 21;
                else if (nameStr === "variable pay") headId = 22;
              }

              // If backend sends false for both addition and deduction, default to a category
              let isAdd = f.is_addition;
              let isDed = f.is_deduction;
              if (!isAdd && !isDed) {
                if (headId === 18 || headId === 19 || headId === 20) {
                  isDed = true;
                } else {
                  isAdd = true;
                }
              }

              return {
                structure_head_id: headId,
                amount: Number(f.value) || 0,
                addition: isAdd,
                deduction: isDed,
                is_pf_base: Boolean(f.is_adding_in_pf ?? f.is_pf_base),
                is_esic_base: Boolean(f.is_adding_in_esic ?? f.is_esic_base),
              };
            })
            : data.components && data.components.length > 0
              ? data.components.map((component: any) => ({
                ...component,
                is_pf_base: Boolean(
                  component.is_adding_in_pf ?? component.is_pf_base,
                ),
                is_esic_base: Boolean(
                  component.is_adding_in_esic ?? component.is_esic_base,
                ),
              }))
              : initialContractState.components,
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
          from_date: l.date_start || l.date_from || "",
          to_date:
            l.end_date === false || l.date_to === false
              ? ""
              : l.end_date || l.date_to,
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
    setManualPFBase(null);
    setManualESICBase(null);
    setEditingPFBase(false);
    setEditingESICBase(false);
    setManualEmployerPF(null);
    setManualEmployerESIC(null);
    setEmployerPFPct(13);
    setEmployerESICPct(3.25);
    setEditingEmployerPF(false);
    setEditingEmployerESIC(false);
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

  // const handleEmployeeChange = (employeeId: number) => {
  //   const selectedEmployee = employees.find((emp) => emp.id === employeeId);
  //   const uniqueSuffix = dayjs().format("DD-MMM-YYYY");
  //   if (selectedEmployee) {
  //     setFormData((prev) => ({
  //       ...prev,
  //       employee_id: employeeId,
  //       employee_code: selectedEmployee.employee_code,
  //       name: `Contract - ${selectedEmployee.name} (${uniqueSuffix})`,
  //     }));
  //   }
  // };

  // ==========================================
  // VALIDATION LOGIC
  // ==========================================

  const handleEmployeeChange = (employeeId: number) => {
    const selectedEmployee = employees.find((emp) => emp.id === employeeId);
    const uniqueSuffix = dayjs().format("DD-MMM-YYYY");

    if (selectedEmployee) {
      // Determine the Start Date (Using joining date if available)
      const startDate =
        selectedEmployee.joinning_date || dayjs().format("YYYY-MM-DD");

      setFormData((prev) => ({
        ...prev,
        employee_id: employeeId,
        employee_code: selectedEmployee.employee_code || "",
        // Set Reference automatically
        name: `Contract - ${selectedEmployee.name} (${uniqueSuffix})`,
        // Auto-fill from API response
        department_id: selectedEmployee.department_id || 0,
        resource_calendar_id: selectedEmployee.resource_calendar_id || 0,
        date_start: startDate,
        job_id: selectedEmployee.job_id || 0,
      }));
    }
  };

  const tabFieldsMap: { [key: string]: string[] } = {
    basic: ["name", "employee_id", "date_start", "date_end", "wage"],
    salary: ["components"],
    leave_config: ["leave_allocation_ids"],
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

    if (!String(formData.name || "").trim()) {
      tempErrors.name = "Contract reference is required";
      isValid = false;
    }
    if (!formData.employee_id) {
      tempErrors.employee_id = "Employee is required";
      isValid = false;
    }
    if (!formData.date_start) {
      tempErrors.date_start = "Start Date is required";
      isValid = false;
    }
    if (!formData.date_end) {
      tempErrors.date_end = "End Date is required";
      isValid = false;
    }
    if (
      formData.date_start &&
      formData.date_end &&
      dayjs(formData.date_end).isBefore(dayjs(formData.date_start), "day")
    ) {
      tempErrors.date_end = "End Date cannot be before Start Date";
      isValid = false;
    }
    if (!formData.wage || Number(formData.wage) <= 0) {
      tempErrors.wage = "Valid wage amount is required";
      isValid = false;
    }

    setErrors((prev: any) => {
      const newErrors = { ...prev };
      ["name", "employee_id", "date_start", "date_end", "wage"].forEach(
        (field) => delete newErrors[field],
      );
      return { ...newErrors, ...tempErrors };
    });
    return isValid;
  };

  const validateSalaryTab = () => {
    const selectedComponents = (formData.components || []).filter(
      (c: any) => c.structure_head_id,
    );

    if (selectedComponents.length === 0) {
      setErrors((prev: any) => ({
        ...prev,
        components: "Add at least one salary component.",
      }));
      return false;
    }

    // Only validate that every row has a type selected (no empty dropdowns)
    const hasEmptyDropdown = (formData.components || []).some(
      (c: any) => !c.structure_head_id
    );

    if (hasEmptyDropdown) {
      setErrors((prev: any) => ({
        ...prev,
        components: "Please select a type for all components or remove empty rows.",
      }));
      return false;
    }

    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors.components;
      return newErrors;
    });
    return true;
  };

  const validateLeaveConfigTab = () => {
    const hasManualLeaves = leaveAllocations.length > 0;
    const hasPreviewLeaves = selectedLeaveConfig && leavePreview.length > 0;
    const leavesToValidate = hasManualLeaves ? leaveAllocations : leavePreview;

    if (!hasManualLeaves && !hasPreviewLeaves) {
      setErrors((prev: any) => ({
        ...prev,
        leave_allocation_ids:
          "Select a leave configuration that has allocation rows.",
      }));
      return false;
    }

    const hasInvalidLeave = leavesToValidate.some((l: any) => {
      const holidayStatusId = Array.isArray(l.holiday_status_id)
        ? l.holiday_status_id[0]
        : l.holiday_status_id || l.leave_type_id;
      const fromDate = l.from_date || l.date_start || l.date_from;
      const toDate = l.to_date || l.end_date || l.date_to;
      const numberOfDays = l.allocation_days || l.number_of_days;

      return (
        !Number(holidayStatusId) ||
        !fromDate ||
        !toDate ||
        Number(numberOfDays) <= 0 ||
        dayjs(toDate).isBefore(dayjs(fromDate), "day")
      );
    });

    if (hasInvalidLeave) {
      setErrors((prev: any) => ({
        ...prev,
        leave_allocation_ids:
          "Leave allocation rows must have a leave type, valid dates, and days greater than 0.",
      }));
      return false;
    }

    setErrors((prev: any) => {
      const newErrors = { ...prev };
      delete newErrors.leave_allocation_ids;
      return newErrors;
    });
    return true;
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
        contract_start: formData.date_start,
        contract_end: formData.date_end || null,
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

    // Clear validation error if it exists
    if (errors[name]) {
      setErrors((prev: any) => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  // 🔥 NEW: Wage/CTC boundary handler (blocks 'e' and '-', max logical limit)
  const handleWageChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxLimit: number = 999999999,
  ) => {
    const { name, value } = e.target;

    // Remove formatting commas and non-digits (except decimal)
    let sanitized = value
      .replace(/,/g, "")
      .replace(/[^0-9.]/g, "")
      .replace(/(\..*?)\..*/g, "$1");

    if (sanitized === "") {
      setFormData((prev: any) => ({ ...prev, [name]: 0 }));
      if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: null }));
      return;
    }

    let num = parseFloat(sanitized);
    if (num > maxLimit) {
      num = maxLimit;
    }

    setFormData((prev: any) => ({ ...prev, [name]: num }));
    if (errors[name]) setErrors((prev: any) => ({ ...prev, [name]: null }));
  };

  const recalculatePFESIC = (
    comps: any[],
    pfBaseOverride: number | null = manualPFBase,
    esicBaseOverride: number | null = manualESICBase,
  ) => {
    const autoPFBase = comps
      .filter((c) => c.addition && c.is_pf_base)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
    const autoESICBase = comps
      .filter((c) => c.addition && c.is_esic_base)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

    const finalPFBase = pfBaseOverride !== null ? pfBaseOverride : autoPFBase;
    const finalESICBase =
      esicBaseOverride !== null ? esicBaseOverride : autoESICBase;

    // Calculate Gross for PT slab and ESIC eligibility
    const grossTotal = comps
      .filter((c) => c.addition)
      .reduce((sum, c) => sum + (Number(c.amount) || 0), 0);


    const basicAmount =
      comps.find((c) => c.structure_head_id === 1)?.amount || 0;
    // If gross >= 21000, clear ESI base from all allowances and remove ESIC deduction
    if (basicAmount >= 21000) {
      comps.forEach((c) => {
        if (c.addition) c.is_esic_base = false;
      });
      // Remove ESIC employee deduction component
      const esicIndex = comps.findIndex((c) => c.deduction && c.structure_head_id === 19);
      if (esicIndex !== -1) comps.splice(esicIndex, 1);
    }

    comps.forEach((c) => {
      if (c.structure_head_id === 18) {
        const pct = c.percentage !== undefined ? c.percentage : 12; // Employee PF 12%
        c.percentage = pct;
        c.amount = parseFloat(((finalPFBase * pct) / 100).toFixed(2));
      }
      if (c.structure_head_id === 19) {
        const pct = c.percentage !== undefined ? c.percentage : 0.75; // Employee ESIC 0.75%
        c.percentage = pct;
        // c.amount = grossTotal < 21000
        //   ? parseFloat(((finalESICBase * pct) / 100).toFixed(2))
        //   : 0;

        c.amount = basicAmount <= 21000
  ? parseFloat(((finalESICBase * pct) / 100).toFixed(2))
  : 0;
      }
      // Professional Tax - Gujarat State Slabs
      if (c.structure_head_id === 20) {
        let ptAmount = 0;
        if (grossTotal >= 12000) ptAmount = 200;
        else ptAmount = 0;
        c.amount = ptAmount;
      }
    });
    return comps;
  };

  useEffect(() => {
    const autoPFBase = (formData.components || [])
      .filter((c: any) => c.addition && c.is_pf_base)
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const finalPFBase = manualPFBase !== null ? manualPFBase : autoPFBase;

    const autoESICBase = (formData.components || [])
      .filter((c: any) => c.addition && c.is_esic_base)
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
    const finalESICBase = manualESICBase !== null ? manualESICBase : autoESICBase;

    const employerPF = manualEmployerPF !== null ? manualEmployerPF : (finalPFBase * employerPFPct) / 100;
    const employerESIC = manualEmployerESIC !== null ? manualEmployerESIC : (finalESICBase * employerESICPct) / 100;

    const grossAllowances = (formData.components || [])
      .filter((c: any) => c.addition)
      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);

    const totalCTCMonthly = grossAllowances + employerPF + employerESIC;
    const totalCTCYearly = Math.round(totalCTCMonthly * 12);

    if (totalCTCYearly > 0 && formData.wage !== totalCTCYearly) {
      setFormData((prev: any) => ({ ...prev, wage: totalCTCYearly }));
      if (errors.wage) {
        setErrors((prev: any) => {
          const newErrors = { ...prev };
          delete newErrors.wage;
          return newErrors;
        });
      }
    }
  }, [
    formData.components,
    manualPFBase,
    manualESICBase,
    manualEmployerPF,
    manualEmployerESIC,
    employerPFPct,
    employerESICPct
  ]);

  const handleBaseCheckboxChange = (
    index: number,
    field: "is_pf_base" | "is_esic_base",
    checked: boolean,
  ) => {
    let newComps = [...(formData.components || [])];
    newComps[index] = { ...newComps[index], [field]: checked };

    // Auto-add deduction component when checkbox is checked
    if (checked) {
      const deductionHeadId = field === "is_pf_base" ? 18 : 19; // 18 = PF Employee, 19 = ESIC Employee
      const alreadyExists = newComps.some((c) => c.deduction && c.structure_head_id === deductionHeadId);
      if (!alreadyExists) {
        newComps.push({
          structure_head_id: deductionHeadId,
          amount: 0,
          deduction: true,
          percentage: deductionHeadId === 18 ? 12 : 0.75,
        });
      }
    } else {
      // When unchecked, check if any other component still has this base checked
      const otherStillChecked = newComps.some((c, i) => i !== index && c.addition && c[field]);
      if (!otherStillChecked) {
        // Remove the deduction component if no other allowance uses this base
        const deductionHeadId = field === "is_pf_base" ? 18 : 19;
        newComps = newComps.filter((c) => !(c.deduction && c.structure_head_id === deductionHeadId));
      }
    }

    newComps = recalculatePFESIC(newComps);
    setFormData({ ...formData, components: newComps });
  };

  const handleManualPFBaseChange = (value: number | null) => {
    setManualPFBase(value);
    let newComps = [...(formData.components || [])];
    newComps = recalculatePFESIC(newComps, value, manualESICBase);
    setFormData({ ...formData, components: newComps });
  };

  const handleManualESICBaseChange = (value: number | null) => {
    setManualESICBase(value);
    let newComps = [...(formData.components || [])];
    newComps = recalculatePFESIC(newComps, manualPFBase, value);
    setFormData({ ...formData, components: newComps });
  };

  const handleDeductionPercentageChange = (index: number, pct: number) => {
    let newComps = [...(formData.components || [])];
    newComps[index] = { ...newComps[index], percentage: pct };
    newComps = recalculatePFESIC(newComps);
    setFormData({ ...formData, components: newComps });
  };

  // 🔥 NEW: Array numeric boundary handler for Allowances and Deductions
  const handleComponentAmountChange = (
    index: number,
    value: string,
    maxLimit: number = 99999999, // Max 9.99 Crores per component
  ) => {
    // Allow numbers and one decimal point. Block 'e', '-', '+'
    let sanitized = value.replace(/[^0-9.]/g, "").replace(/(\..*?)\..*/g, "$1");

    let num = 0;
    if (sanitized !== "") {
      num = parseFloat(sanitized);
      if (num > maxLimit) {
        num = maxLimit;
      }
    }

    let newComps = [...(formData.components || [])];
    newComps[index] = { ...newComps[index], amount: num };

    newComps = recalculatePFESIC(newComps);
    setFormData({ ...formData, components: newComps });
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

    const isBasicValid = validateBasicTab();
    const isSalaryValid = validateSalaryTab();
    const isLeaveConfigValid = validateLeaveConfigTab();

    if (!isBasicValid || !isSalaryValid || !isLeaveConfigValid) {
      if (!isBasicValid) {
        setActiveTab("basic");
      } else if (!isSalaryValid) {
        setActiveTab("salary");
      } else {
        setActiveTab("leave_config");
      }
      toast.error("Please fix the highlighted fields before saving.");
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
      const leavesForPayload =
        leaveAllocations.length > 0 ? leaveAllocations : leavePreview;
      const isExistingLeaveList = leaveAllocations.length > 0;

      const activeLeaves = leavesForPayload.map((l) => {
        const holidayStatusId = Array.isArray(l.holiday_status_id)
          ? l.holiday_status_id[0]
          : l.holiday_status_id || l.leave_type_id;
        const fromDate = l.from_date || l.date_start || l.date_from;
        const toDate = l.to_date || l.end_date || l.date_to;
        const numberOfDays = l.allocation_days || l.number_of_days;

        return {
          ...(isExistingLeaveList && l.id ? { id: l.id } : {}),
          employee_id: Number(formData.employee_id),
          holiday_status_id: Number(holidayStatusId),
          date_start: fromDate,
          end_date: toDate ? toDate : (false as const),
          number_of_days: Number(numberOfDays),
          allocation_type: l.allocation_type || "regular",
          ...(l.accrual_plan_id
            ? { accrual_plan_id: Number(l.accrual_plan_id) }
            : {}),
          ...(l.description ? { description: l.description } : {}),
        };
      });

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

      const finalPayload: any = {
        ...contractData,
        employee_id: Number(formData.employee_id),
        contract_end: formData.date_end || null,
        components: (contractData.components || [])
          .filter((c: any) => c.structure_head_id)
          .map((c: any) => ({
            structure_head_id: Number(c.structure_head_id),
            amount: Number(c.amount),
            addition: c.addition ? true : undefined,
            deduction: c.deduction ? true : undefined,
            is_adding_in_pf: !!(c.is_adding_in_pf ?? c.is_pf_base),
            is_adding_in_esic: !!(c.is_adding_in_esic ?? c.is_esic_base),
          })),
        leave_allocation_ids: [...activeLeaves, ...deletedLeaves],
        net_salary: parseFloat((
          (formData.components || [])
            .filter((c: any) => c.addition)
            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0) -
          (formData.components || [])
            .filter((c: any) => c.deduction)
            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
        ).toFixed(2)),
      };

      // 4. Call Single API (Add or Edit)
      // Note: Use contract_id from the JSON response if available

      // 🔥 Add selectedLeaveConfig if it exists
      if (selectedLeaveConfig) {
        finalPayload.leave_configuration_id = Number(selectedLeaveConfig);
      }

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

  // Helper function to convert numbers to words (Indian System)
  const convertNumberToWords = (amount: number) => {
    if (!amount || isNaN(amount) || amount === 0) return "";

    const single = [
      "",
      "One",
      "Two",
      "Three",
      "Four",
      "Five",
      "Six",
      "Seven",
      "Eight",
      "Nine",
      "Ten",
      "Eleven",
      "Twelve",
      "Thirteen",
      "Fourteen",
      "Fifteen",
      "Sixteen",
      "Seventeen",
      "Eighteen",
      "Nineteen",
    ];
    const tens = [
      "",
      "",
      "Twenty",
      "Thirty",
      "Forty",
      "Fifty",
      "Sixty",
      "Seventy",
      "Eighty",
      "Ninety",
    ];

    const formatCTC = (n: number): string => {
      if (n < 20) return single[n];
      if (n < 100)
        return (
          tens[Math.floor(n / 10)] + (n % 10 !== 0 ? " " + single[n % 10] : "")
        );
      if (n < 1000)
        return (
          single[Math.floor(n / 100)] +
          " Hundred" +
          (n % 100 !== 0 ? " " + formatCTC(n % 100) : "")
        );
      if (n < 100000)
        return (
          formatCTC(Math.floor(n / 1000)) +
          " Thousand" +
          (n % 1000 !== 0 ? " " + formatCTC(n % 1000) : "")
        );
      if (n < 10000000)
        return (
          formatCTC(Math.floor(n / 100000)) +
          " Lakh" +
          (n % 100000 !== 0 ? " " + formatCTC(n % 100000) : "")
        );
      return (
        formatCTC(Math.floor(n / 10000000)) +
        " Crore" +
        (n % 10000000 !== 0 ? " " + formatCTC(n % 10000000) : "")
      );
    };

    return formatCTC(Number(amount)) + " Rupees Only";
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
                                  // label: e.name || "Unknown Employee",
                                  label: e.employee_code
                                    ? `${e.name} (${e.employee_code})`
                                    : e.name || "Unknown Employee",
                                }))}
                                placeholder="Select Employee"
                                // value={
                                //   formData.employee_id
                                //     ? {
                                //         value: String(formData.employee_id),
                                //         label:
                                //           employees.find(
                                //             (e) =>
                                //               e.id === formData.employee_id,
                                //           )?.name || "",
                                //       }
                                //     : null
                                // }
                                value={
                                  formData.employee_id
                                    ? {
                                      value: String(formData.employee_id),
                                      // 🔥 Make sure the selected value also shows the code
                                      label: (() => {
                                        const emp = employees.find(
                                          (e: any) =>
                                            e.id === formData.employee_id,
                                        );
                                        if (!emp) return "";
                                        return emp.employee_code
                                          ? `${emp.name} (${emp.employee_code})`
                                          : emp.name;
                                      })(),
                                    }
                                    : null
                                }
                                onChange={(opt) => {
                                  handleEmployeeChange(Number(opt?.value));
                                  if (errors.employee_id || errors.name) {
                                    setErrors({
                                      ...errors,
                                      employee_id: null,
                                      name: null,
                                    });
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
                              Contract Reference{" "}
                              <span className="text-danger">*</span>
                            </label>
                            <input
                              type="text"
                              name="name"
                              className={`form-control ${isSubmitted ? (errors.name ? "is-invalid border-danger" : "is-valid border-success") : ""}`}
                              value={formData.name}
                              disabled={!!formData.employee_id} // 🔥 Disable after selection
                              // onChange={(e) =>
                              //   setFormData({
                              //     ...formData,
                              //     name: e.target.value,
                              //   })
                              // }
                              onChange={(e) => handleTextChange(e, 100)} // 🔥 Max 100 chars
                              maxLength={100}
                            />
                            {isSubmitted && errors.name && (
                              <div className="text-danger fs-11 mt-1">
                                {errors.name}
                              </div>
                            )}
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
                                if (errors.date_end) {
                                  setErrors({ ...errors, date_end: null });
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
                              disabled={!!formData.employee_id} // 🔥 Disable after selection
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
                              disabled={!!formData.employee_id} // 🔥 Disable after selection
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
                          {/* 
                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Wage (CTC in LPA){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-white fw-bold">
                                ₹
                              </span>
                              <input
                                type="number"
                                step="0.01"
                                min="0"
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
                          </div> */}
                          <div className="col-md-4 px-1">
                            <label className="form-label fs-13 fw-bold">
                              Wage (CTC in LPA){" "}
                              <span className="text-danger">*</span>
                            </label>
                            <div className="input-group">
                              <span className="input-group-text bg-white fw-bold text-muted">
                                ₹
                              </span>
                              <input
                                type="text"
                                name="wage"
                                readOnly
                                placeholder="Auto-calculated from Salary Structure"
                                className={`form-control fw-bold text-success bg-light ${isSubmitted
                                  ? errors.wage
                                    ? "is-invalid border-danger"
                                    : "is-valid border-success"
                                  : "border-primary"
                                  }`}
                                // 🔥 Removed " LPA" from the value, leaving only the comma-separated number
                                value={
                                  !formData.wage || formData.wage === 0
                                    ? ""
                                    : Number(formData.wage).toLocaleString(
                                      "en-IN",
                                    )
                                }
                              // onChange={(e) => handleWageChange(e, 999999999)} // 🔥 Handled by auto-calculate
                              />
                            </div>

                            {/* Shows the text format (e.g. "Five Lakh Rupees Only") */}
                            {formData.wage > 0 && !errors.wage && (
                              <div className="text-primary fs-16 mt-1 fw-medium fst-italic">
                                {convertNumberToWords(formData.wage)}
                              </div>
                            )}

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
                        {isSubmitted && errors.components && (
                          <div className="alert alert-danger py-2 fs-12 mb-3">
                            {errors.components}
                          </div>
                        )}
                        <div className="row g-4 mx-0">
                          {/* Left Column: Allowances */}
                          <div className="col-md-6 border-end pe-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                              <h6 className="fw-bold text-success mb-0 fs-14">
                                <i className="ti ti-circle-plus me-2"></i>{" "}
                                Allowances & Benefits
                              </h6>
                              <button
                                type="button"
                                className="btn btn-sm btn-success-transparent"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    components: [
                                      ...(formData.components || []),
                                      {
                                        structure_head_id: null,
                                        amount: 0,
                                        addition: true,
                                      },
                                    ],
                                  });
                                }}
                              >
                                <i className="ti ti-plus me-1"></i> Add
                              </button>
                            </div>

                            <div className="row g-2">
                              {(formData.components || []).map(
                                (comp: any, index: number) => {
                                  if (!comp.addition) return null;

                                  // Calculate gross total to determine ESI eligibility
                                  // const grossTotal = (formData.components || [])
                                  //   .filter((c: any) => c.addition)
                                  //   .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0);
                                  // const esicEligible = grossTotal < 21000;
                                  const basicAmount =
                                    (formData.components || []).find(
                                      (c: any) => c.structure_head_id === 1
                                    )?.amount || 0;

                                  const esicEligible = basicAmount <= 21000;

                                  return (
                                    <div className="col-12" key={index}>
                                      <div className="d-flex gap-2 mb-2 align-items-center">
                                        <div className="d-flex flex-column gap-1 me-1" style={{ width: '45px' }}>
                                          <div className="form-check form-check-sm mb-0 d-flex align-items-center gap-1" title="Include in PF Base">
                                            <input className="form-check-input mt-0" style={{ width: '14px', height: '14px', cursor: 'pointer' }} type="checkbox" checked={comp.is_pf_base || false} onChange={(e) => handleBaseCheckboxChange(index, 'is_pf_base', e.target.checked)} />
                                            <label className="form-check-label fs-10 fw-bold text-muted mb-0" style={{ cursor: 'pointer' }}>PF</label>
                                          </div>
                                          {esicEligible ? (
                                            <div className="form-check form-check-sm mb-0 d-flex align-items-center gap-1" title="Include in ESIC Base">
                                              <input className="form-check-input mt-0" style={{ width: '14px', height: '14px', cursor: 'pointer' }} type="checkbox" checked={comp.is_esic_base || false} onChange={(e) => handleBaseCheckboxChange(index, 'is_esic_base', e.target.checked)} />
                                              <label className="form-check-label fs-10 fw-bold text-muted mb-0" style={{ cursor: 'pointer' }}>ESI</label>
                                            </div>
                                          ) : (
                                            <div title="ESI not applicable (Gross ≥ ₹21,000)" style={{ height: '18px' }}>
                                              <span className="fs-10 text-danger fw-bold" style={{ lineHeight: '18px' }}>ESI✕</span>
                                            </div>
                                          )}
                                        </div>
                                        <select
                                          className="form-select form-select-sm w-50"
                                          value={comp.structure_head_id || ""}
                                          onChange={(e) => {
                                            let newComps = [
                                              ...(formData.components || []),
                                            ];
                                            newComps[index] = {
                                              ...newComps[index],
                                              structure_head_id: Number(
                                                e.target.value,
                                              ),
                                            };
                                            newComps = recalculatePFESIC(newComps);
                                            setFormData({
                                              ...formData,
                                              components: newComps,
                                            });
                                          }}
                                        >
                                          <option value="" disabled>
                                            Select Allowance
                                          </option>
                                          {structureHeaders
                                            .filter(
                                              (h) =>
                                                h.header_type === "addition",
                                            )
                                            .map((h) => {
                                              const isSelectedElsewhere = formData.components?.some((c: any, i: number) => i !== index && c.structure_head_id === h.id);
                                              return (
                                                <option key={h.id} value={h.id} disabled={isSelectedElsewhere}>
                                                  {h.name} {isSelectedElsewhere ? "(Already Added)" : ""}
                                                </option>
                                              );
                                            })}
                                        </select>
                                        <div className="input-group input-group-sm w-50">
                                          <span className="input-group-text bg-light text-muted">
                                            ₹
                                          </span>
                                          <input
                                            type="text"
                                            className="form-control"
                                            placeholder="0"
                                            value={comp.amount}
                                            // onChange={(e) => {
                                            //   const newComps = [
                                            //     ...(formData.components || []),
                                            //   ];
                                            //   newComps[index] = {
                                            //     ...newComps[index],
                                            //     amount: Number(e.target.value),
                                            //   };
                                            //   setFormData({
                                            //     ...formData,
                                            //     components: newComps,
                                            //   });
                                            // }}
                                            onChange={(e) =>
                                              handleComponentAmountChange(
                                                index,
                                                e.target.value,
                                              )
                                            } // 🔥 Use the new array handler
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-danger-transparent px-2 border-start-0"
                                            style={{
                                              border: "1px solid #dee2e6",
                                            }}
                                            onClick={() => {
                                              const newComps = [
                                                ...(formData.components || []),
                                              ];
                                              newComps.splice(index, 1);
                                              setFormData({
                                                ...formData,
                                                components: newComps,
                                              });
                                            }}
                                          >
                                            <i className="ti ti-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                              {(!formData.components ||
                                !formData.components.some(
                                  (c: any) => c.addition,
                                )) && (
                                  <div className="text-center text-muted py-3 fs-13">
                                    No allowances added.
                                  </div>
                                )}
                              <div className="mt-3 p-3 bg-light rounded border border-success-subtle">
                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold fs-12 text-muted">PF Base Amount:</span>
                                  <div className="d-flex align-items-center gap-2">
                                    {editingPFBase ? (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        style={{ width: "100px" }}
                                        value={manualPFBase !== null ? manualPFBase : ""}
                                        placeholder={String(
                                          (formData.components || [])
                                            .filter((c: any) => c.addition && c.is_pf_base)
                                            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                        )}
                                        onChange={(e) => handleManualPFBaseChange(e.target.value ? Number(e.target.value) : null)}
                                        onBlur={() => setEditingPFBase(false)}
                                        autoFocus
                                      />
                                    ) : (
                                      <>
                                        <span className="fw-bold fs-13 text-primary">
                                          ₹{manualPFBase !== null
                                            ? manualPFBase.toFixed(2)
                                            : (formData.components || [])
                                              .filter((c: any) => c.addition && c.is_pf_base)
                                              .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                              .toFixed(2)}
                                        </span>
                                        <i className="ti ti-edit text-muted" style={{ cursor: "pointer" }} onClick={() => setEditingPFBase(true)} title="Edit PF Base"></i>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold fs-12 text-muted">ESIC Base Amount:</span>
                                  <div className="d-flex align-items-center gap-2">
                                    {editingESICBase ? (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        style={{ width: "100px" }}
                                        value={manualESICBase !== null ? manualESICBase : ""}
                                        placeholder={String(
                                          (formData.components || [])
                                            .filter((c: any) => c.addition && c.is_esic_base)
                                            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                        )}
                                        onChange={(e) => handleManualESICBaseChange(e.target.value ? Number(e.target.value) : null)}
                                        onBlur={() => setEditingESICBase(false)}
                                        autoFocus
                                      />
                                    ) : (
                                      <>
                                        <span className="fw-bold fs-13 text-primary">
                                          ₹{manualESICBase !== null
                                            ? manualESICBase.toFixed(2)
                                            : (formData.components || [])
                                              .filter((c: any) => c.addition && c.is_esic_base)
                                              .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                              .toFixed(2)}
                                        </span>
                                        <i className="ti ti-edit text-muted" style={{ cursor: "pointer" }} onClick={() => setEditingESICBase(true)} title="Edit ESIC Base"></i>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <hr className="my-2 border-success-subtle" />

                                <div className="d-flex justify-content-between align-items-center mb-1">
                                  <span className="fw-bold fs-12 text-muted">Employer PF ({employerPFPct}%):</span>
                                  <div className="d-flex align-items-center gap-2">
                                    {editingEmployerPF ? (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        style={{ width: "100px" }}
                                        value={manualEmployerPF !== null ? manualEmployerPF : ""}
                                        placeholder={String(
                                          (
                                            (manualPFBase !== null
                                              ? manualPFBase
                                              : (formData.components || [])
                                                .filter((c: any) => c.addition && c.is_pf_base)
                                                .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                            employerPFPct
                                          ) / 100
                                        )}
                                        onChange={(e) => setManualEmployerPF(e.target.value ? Number(e.target.value) : null)}
                                        onBlur={() => setEditingEmployerPF(false)}
                                        autoFocus
                                      />
                                    ) : (
                                      <>
                                        <span className="fw-bold fs-13 text-secondary">
                                          ₹{manualEmployerPF !== null
                                            ? manualEmployerPF.toFixed(2)
                                            : (
                                              ((manualPFBase !== null
                                                ? manualPFBase
                                                : (formData.components || [])
                                                  .filter((c: any) => c.addition && c.is_pf_base)
                                                  .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                                employerPFPct) /
                                              100
                                            ).toFixed(2)}
                                        </span>
                                        <i className="ti ti-edit text-muted" style={{ cursor: "pointer" }} onClick={() => setEditingEmployerPF(true)} title="Edit Employer PF"></i>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <div className="d-flex justify-content-between align-items-center mb-2">
                                  <span className="fw-bold fs-12 text-muted">Employer ESIC ({employerESICPct}%):</span>
                                  <div className="d-flex align-items-center gap-2">
                                    {editingEmployerESIC ? (
                                      <input
                                        type="number"
                                        className="form-control form-control-sm text-end"
                                        style={{ width: "100px" }}
                                        value={manualEmployerESIC !== null ? manualEmployerESIC : ""}
                                        placeholder={String(
                                          (
                                            (manualESICBase !== null
                                              ? manualESICBase
                                              : (formData.components || [])
                                                .filter((c: any) => c.addition && c.is_esic_base)
                                                .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                            employerESICPct
                                          ) / 100
                                        )}
                                        onChange={(e) => setManualEmployerESIC(e.target.value ? Number(e.target.value) : null)}
                                        onBlur={() => setEditingEmployerESIC(false)}
                                        autoFocus
                                      />
                                    ) : (
                                      <>
                                        <span className="fw-bold fs-13 text-secondary">
                                          ₹{manualEmployerESIC !== null
                                            ? manualEmployerESIC.toFixed(2)
                                            : (
                                              ((manualESICBase !== null
                                                ? manualESICBase
                                                : (formData.components || [])
                                                  .filter((c: any) => c.addition && c.is_esic_base)
                                                  .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                                employerESICPct) /
                                              100
                                            ).toFixed(2)}
                                        </span>
                                        <i className="ti ti-edit text-muted" style={{ cursor: "pointer" }} onClick={() => setEditingEmployerESIC(true)} title="Edit Employer ESIC"></i>
                                      </>
                                    )}
                                  </div>
                                </div>

                                <hr className="my-2 border-success-subtle" />

                                <div className="d-flex justify-content-between mb-1">
                                  <span className="fw-bold fs-14 text-dark">Gross Total Amount :</span>
                                  <span className="fw-bold fs-14 text-success">
                                    ₹{(formData.components || [])
                                      .filter((c: any) => c.addition)
                                      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                      .toFixed(2)}
                                  </span>
                                </div>

                                <div className="d-flex justify-content-between">
                                  <span className="fw-bold fs-14 text-dark">Total CTC:</span>
                                  <span className="fw-bold fs-14 text-success">
                                    ₹{(
                                      ((formData.components || [])
                                        .filter((c: any) => c.addition)
                                        .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) +
                                      (manualEmployerPF !== null
                                        ? manualEmployerPF
                                        : ((manualPFBase !== null
                                          ? manualPFBase
                                          : (formData.components || [])
                                            .filter((c: any) => c.addition && c.is_pf_base)
                                            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                          employerPFPct) /
                                        100) +
                                      (manualEmployerESIC !== null
                                        ? manualEmployerESIC
                                        : ((manualESICBase !== null
                                          ? manualESICBase
                                          : (formData.components || [])
                                            .filter((c: any) => c.addition && c.is_esic_base)
                                            .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)) *
                                          employerESICPct) /
                                        100)
                                    ).toFixed(2)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>

                          {/* Right Column: Deductions */}
                          <div className="col-md-6 ps-4">
                            <div className="d-flex justify-content-between align-items-center mb-3 border-bottom pb-2">
                              <h6 className="fw-bold text-danger mb-0 fs-14">
                                <i className="ti ti-circle-minus me-2"></i>{" "}
                                Deductions & Statutory
                              </h6>
                              <button
                                type="button"
                                className="btn btn-sm btn-danger-transparent"
                                onClick={() => {
                                  setFormData({
                                    ...formData,
                                    components: [
                                      ...(formData.components || []),
                                      {
                                        structure_head_id: null,
                                        amount: 0,
                                        deduction: true,
                                      },
                                    ],
                                  });
                                }}
                              >
                                <i className="ti ti-plus me-1"></i> Add
                              </button>
                            </div>

                            <div className="row g-2">
                              {(formData.components || []).map(
                                (comp: any, index: number) => {
                                  if (!comp.deduction) return null;
                                  return (
                                    <div className="col-12" key={index}>
                                      <div className="d-flex gap-2 mb-2 align-items-center">
                                        <div className="w-50 d-flex gap-2 align-items-center">
                                          <select
                                            className="form-select form-select-sm border-danger flex-grow-1"
                                            value={comp.structure_head_id || ""}
                                            onChange={(e) => {
                                              let newComps = [
                                                ...(formData.components || []),
                                              ];
                                              newComps[index] = {
                                                ...newComps[index],
                                                structure_head_id: Number(
                                                  e.target.value,
                                                ),
                                              };
                                              newComps = recalculatePFESIC(newComps);
                                              setFormData({
                                                ...formData,
                                                components: newComps,
                                              });
                                            }}
                                          >
                                            <option value="" disabled>
                                              Select Deduction
                                            </option>
                                            {structureHeaders
                                              .filter(
                                                (h) =>
                                                  h.header_type === "deduction",
                                              )
                                              .map((h) => {
                                                const isSelectedElsewhere = formData.components?.some((c: any, i: number) => i !== index && c.structure_head_id === h.id);
                                                return (
                                                  <option key={h.id} value={h.id} disabled={isSelectedElsewhere}>
                                                    {h.name} {isSelectedElsewhere ? "(Already Added)" : ""}
                                                  </option>
                                                );
                                              })}
                                          </select>

                                          {(comp.structure_head_id === 18 || comp.structure_head_id === 19) && (
                                            <div className="input-group input-group-sm flex-shrink-0" style={{ width: '90px' }} title="Employee % Rate">
                                              <input
                                                type="number"
                                                step="0.01"
                                                className="form-control border-danger px-2"
                                                placeholder={comp.structure_head_id === 18 ? "12" : "0.75"}
                                                value={comp.percentage !== undefined ? comp.percentage : ""}
                                                onChange={(e) =>
                                                  handleDeductionPercentageChange(
                                                    index,
                                                    e.target.value === "" ? (comp.structure_head_id === 18 ? 12 : 0.75) : Number(e.target.value),
                                                  )
                                                }
                                              />
                                              <span className="input-group-text bg-white text-danger border-danger px-2">
                                                %
                                              </span>
                                            </div>
                                          )}
                                        </div>

                                        <div className="input-group input-group-sm w-50">
                                          <span className="input-group-text text-danger border-danger">
                                            ₹
                                          </span>
                                          <input
                                            type="text"
                                            className="form-control border-danger"
                                            placeholder="0"
                                            value={comp.amount}
                                            readOnly={comp.structure_head_id === 18 || comp.structure_head_id === 19 || comp.structure_head_id === 20}
                                            onChange={(e) =>
                                              handleComponentAmountChange(
                                                index,
                                                e.target.value,
                                              )
                                            }
                                          />
                                          <button
                                            type="button"
                                            className="btn btn-danger-transparent px-2 border border-danger border-start-0"
                                            onClick={() => {
                                              const newComps = [
                                                ...(formData.components || []),
                                              ];
                                              newComps.splice(index, 1);
                                              setFormData({
                                                ...formData,
                                                components: newComps,
                                              });
                                            }}
                                          >
                                            <i className="ti ti-trash"></i>
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  );
                                },
                              )}
                              {(!formData.components ||
                                !formData.components.some(
                                  (c: any) => c.deduction,
                                )) && (
                                  <div className="text-center text-muted py-3 fs-13">
                                    No deductions added.
                                  </div>
                                )}

                              <hr className="my-2 border-danger-subtle" />

                              <div className="d-flex justify-content-between mb-1">
                                <span className="fw-bold fs-14 text-dark">Total Deductions :</span>
                                <span className="fw-bold fs-14 text-danger">
                                  ₹{(formData.components || [])
                                    .filter((c: any) => c.deduction)
                                    .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                    .toFixed(2)}
                                </span>
                              </div>

                              <div className="d-flex justify-content-between">
                                <span className="fw-bold fs-14 text-dark">Net Salary :</span>
                                <span className="fw-bold fs-14 text-primary">
                                  ₹{(
                                    (formData.components || [])
                                      .filter((c: any) => c.addition)
                                      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0) -
                                    (formData.components || [])
                                      .filter((c: any) => c.deduction)
                                      .reduce((sum: number, c: any) => sum + (Number(c.amount) || 0), 0)
                                  ).toFixed(2)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}

                    {activeTab === "leave_config" && (
                      <div className="animate__animated animate__fadeIn">
                        {isSubmitted && errors.leave_allocation_ids && (
                          <div className="alert alert-danger py-2 fs-12 mb-3">
                            {errors.leave_allocation_ids}
                          </div>
                        )}
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
                                onChange={(opt) => {
                                  handleLeaveConfigChange(opt?.value || "");
                                  if (errors.leave_allocation_ids) {
                                    setErrors({
                                      ...errors,
                                      leave_allocation_ids: null,
                                    });
                                  }
                                }}
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
