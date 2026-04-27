import React, { useEffect, useRef, useState } from "react";
import { DatePicker, Radio, Slider } from "antd";
import dayjs from "dayjs";
import { createPortal } from "react-dom";
import CommonSelect from "../../../core/common/commonSelect";
import { toast } from "react-toastify";
import {
  addEmployee,
  getAttendancePolicies,
  getBranches,
  getBusinessLocations,
  getBusinessTypes,
  getCountries,
  getDepartments,
  getDesignations,
  getDistricts,
  getReportingManagers,
  getShiftRosters,
  getStates,
  getTimezones,
  getWorkingSchedules,
  getWorkLocations,
  updateEmployee,
  getApprovalGroups,
  getGroupUsers,
} from "./EmployeeServices";
import { getBanks } from "@/KHRModules/Master Modules/BanksKHR/BanksServices";

interface Props {
  onSuccess: () => void;
  onClose: () => void;
  data: any | null; // For editing existing
  draftData?: any | null; // ✅ NEW: For loading a specific draft
  preventClose?: boolean;
  isViewOnly?: boolean;
}

const AddEditEmployeeModal2: React.FC<Props> = ({
  onSuccess,
  onClose,
  data,
  draftData,
  preventClose = false,
  isViewOnly = false,
}) => {
  const [activeTab, setActiveTab] = useState("legal");
  const [validated, setValidated] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgPreview, setImgPreview] = useState<string | null>(null);

  // --- DRAFT & UNSAVED CHANGES STATE ---
  const [isDirty, setIsDirty] = useState(false);
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);
  const [loadedDraftId, setLoadedDraftId] = useState<string | null>(null); // ✅ Track which draft we are editing

  const [attendancePolicies, setAttendancePolicies] = useState<
    { value: string; label: string }[]
  >([]);
  const [workingSchedules, setWorkingSchedules] = useState<
    { value: string; label: string }[]
  >([]);

  interface Option {
    value: string;
    label: string;
    swift?: string;
  }

  const [timezones, setTimezones] = useState<Option[]>([]);
  const [shiftRosters, setShiftRosters] = useState<Option[]>([]);
  const [countries, setCountries] = useState<Option[]>([]);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [errors, setErrors] = useState<any>({});
  const [states, setStates] = useState<Option[]>([]);
  const [districts, setDistricts] = useState<Option[]>([]);
  const [businessTypes, setBusinessTypes] = useState<Option[]>([]);
  const [businessLocations, setBusinessLocations] = useState<Option[]>([]);
  const [departments, setDepartments] = useState<Option[]>([]);
  const [designations, setDesignations] = useState<Option[]>([]);
  const [workLocations, setWorkLocations] = useState<Option[]>([]);
  const [managers, setManagers] = useState<Option[]>([]);
  const [banks, setBanks] = useState<Option[]>([]);
  const [bankMasterList, setBankMasterList] = useState<any[]>([]);
  const [branches, setBranches] = useState<Option[]>([]);
  const [showErrorAlert, setShowErrorAlert] = useState(false);
  const [groupOptions, setGroupOptions] = useState<Option[]>([]);
  const [groupUserOptions, setGroupUserOptions] = useState<
    Record<string, Option[]>
  >({});
  const [showPassword, setShowPassword] = useState(false);

  const tabConfig = [
    { id: "legal", label: "Legal & ID", icon: "ti-id" },
    { id: "personal", label: "Personal Info", icon: "ti-user-circle" },
    { id: "address", label: "Address Details", icon: "ti-map-pin" },
    { id: "emergency", label: "Emergency Contact", icon: "ti-phone-call" },
    { id: "employment", label: "Employment Information", icon: "ti-briefcase" },
    { id: "banking", label: "Banking & Salary", icon: "ti-building-bank" },
    { id: "notice", label: "Separation / Notice", icon: "ti-door-exit" },
    { id: "device", label: "Mobile App Access", icon: "ti-device-mobile" },
    { id: "group_access", label: "Group Approvals", icon: "ti-users-group" },
  ];

  const currentTabIndex = tabConfig.findIndex((t) => t.id === activeTab);
  const isFirstTab = currentTabIndex === 0;
  const isLastTab = currentTabIndex === tabConfig.length - 1;

  const [groupAccessLines, setGroupAccessLines] = useState<any[]>([
    {
      model: "leave",
      group_id: "",
      approval_user_id: "",
      approval_sequance: 0,
    },
  ]);

  const [showExpModal, setShowExpModal] = useState(false);
  const [experienceDocs, setExperienceDocs] = useState<any[]>([]);
  const [tempDoc, setTempDoc] = useState({
    category: "",
    file: null as File | null,
  });

  // ? Refs to handle stale closures in global event listeners
  const latestAttemptClose = useRef<() => void>(() => { });
  const latestIsDirty = useRef<boolean>(false);

  useEffect(() => {
    latestIsDirty.current = isDirty;
  }, [isDirty]);

  // ? Bug Fix: Prevent parent bootstrap modal from closing on ESC when inner modals are open
  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        if (showCloseConfirm) {
          e.stopPropagation();
          e.preventDefault();
          setShowCloseConfirm(false);
        } else if (showExpModal) {
          e.stopPropagation();
          e.preventDefault();
          setShowExpModal(false);
        } else {
          // If we hit Escape on the main modal, delegate to attempt close
          // This will either show the draft confirm or close and reset properly
          e.stopPropagation();
          e.preventDefault();
          latestAttemptClose.current();
        }
      }
    };

    // Attach in capture phase to intercept before Bootstrap modal catches it
    window.addEventListener("keydown", handleGlobalKeyDown, true);
    return () =>
      window.removeEventListener("keydown", handleGlobalKeyDown, true);
  }, [showCloseConfirm, showExpModal]);

  // ? Prevent data loss on page reload
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (latestIsDirty.current) {
        e.preventDefault();
        e.returnValue =
          "You have unsaved changes. Are you sure you want to leave?";
        return e.returnValue;
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, []);

  const todayStr = dayjs().format("YYYY-MM-DD");

  const initialFormData = {
    name: "",
    father_name: "",
    name_of_client: "",
    attendance_policy_id: "",
    employee_category: "staff",
    resource_calendar_id: "",
    shift_roster_id: "",
    timezone: "Asia/Kolkata",
    is_geo_tracking: false,
    image_1920: null,
    aadhaar_number: "",
    pan_number: "",
    voter_id: "",
    passport_no: "",
    probation_period: 6,
    in_probation: true,
    driving_license: null,
    is_uan_number_applicable: false,
    uan_number: "",
    esi_number: "",
    category: "general",
    cd_employee_num: "",
    gender: "male",
    marital: "single",
    spouse_name: "",
    date_of_marriage: null,
    birthday: null,
    blood_group: "",
    name_of_post_graduation: "",
    name_of_any_other_education: "",
    total_experiance: "",
    country_id: "",
    religion: "",
    work_phone: "",
    mobile_phone: "",
    private_email: "",
    upload_passbook: null,
    present_address: "",
    permanent_address: "",
    pin_code: "",
    district_id: "",
    state_id: "",
    joining_date: todayStr,
    emergency_contact_name: "",
    emergency_contact_relation: "",
    emergency_contact_mobile: "",
    emergency_contact_address: "",
    bank_id: "",
    account_number: "",
    bank_iafc_code: "",
    bank_swift_code: "",
    currency_id: "INR",
    attendance_capture_mode: "mobile",
    department_id: "",
    job_id: "",
    employment_type: "permanent",
    employee_password: "",
    status: "active",
    pin: "",
    latitude: "",
    longitude: "",
    device_id: "",
    device_unique_id: "",
    device_name: "",
    system_version: "",
    ip_address: "",
    device_platform: "",
    type_of_sepration: "",
    resignation_date: null,
    notice_period_days: 0,
    in_notice_period: false,
    notice_period_end_date: null,
    hold_status: false,
    hold_remarks: "",
    reporting_manager_id: "",
    head_of_department_id: "",
    random_code_for_reg: "",
    cv_file: null,
  };

  const [formData, setFormData] = useState<any>({ ...initialFormData });

  const docCategories = [
    { value: "exp_letter", label: "Experience Letter" },
    { value: "relieving_letter", label: "Relieving Letter" },
    { value: "salary_slip", label: "Salary Slip" },
    { value: "offer_letter", label: "Offer Letter" },
    { value: "other", label: "Other Docs" },
  ];

  // ===================== DRAFT & MULTIPLE SAVE LOGIC =====================

  // ✅ LOAD SPECIFIC DRAFT
  useEffect(() => {
    if (draftData && !data) {
      setFormData((prev: any) => ({
        ...initialFormData,
        ...draftData.formData,
      }));

      if (
        draftData.groupAccessLines &&
        Array.isArray(draftData.groupAccessLines)
      ) {
        setGroupAccessLines(draftData.groupAccessLines);
      }

      if (draftData.experienceDocs && Array.isArray(draftData.experienceDocs)) {
        const restoredDocs = draftData.experienceDocs.map((doc: any) => {
          if (doc.base64 && !doc.file) {
            try {
              const byteString = atob(doc.base64);
              const ab = new ArrayBuffer(byteString.length);
              const ia = new Uint8Array(ab);
              for (let i = 0; i < byteString.length; i++) {
                ia[i] = byteString.charCodeAt(i);
              }
              const blob = new Blob([ab], { type: doc.fileType || "application/pdf" });
              const file = new File([blob], doc.fileName || "document", { type: doc.fileType || "application/pdf" });
              return {
                ...doc,
                file: file,
                previewUrl: doc.previewUrl || URL.createObjectURL(file)
              };
            } catch (e) {
              console.error("Failed to restore file from base64", e);
              return doc;
            }
          }
          return doc;
        });
        setExperienceDocs(restoredDocs);
      } else {
        setExperienceDocs([]);
      }

      setLoadedDraftId(draftData.id);
      setIsDraftLoaded(true);
      toast.info(
        "Draft loaded successfully.",
      );
    } else if (!data) {
      setIsDraftLoaded(false);
      setLoadedDraftId(null);
    }
  }, [draftData, data]);

  const updateFormData = (updates: any) => {
    setFormData((prev: any) => {
      setIsDirty(true);
      return { ...prev, ...updates };
    });
  };

  const handleAttemptClose = () => {
    if (preventClose) {
      toast.warning("Please complete your profile before closing.");
      return;
    }
    if (isDirty && !isViewOnly) {
      setShowCloseConfirm(true);
    } else {
      executeClose();
    }
  };
  latestAttemptClose.current = handleAttemptClose;

  const executeClose = () => {
    setShowCloseConfirm(false);
    resetForm();
    setIsDirty(false);
    document.getElementById("actual-modal-close-btn")?.click();
    if (onClose) onClose();
  };

  // ✅ SAVE MULTIPLE DRAFTS
  // ✅ BULLETPROOF: SAVE MULTIPLE DRAFTS
  const handleSaveDraft = async () => {
    try {
      // 1. Exclude ALL File objects explicitly
      const {
        image_1920,
        driving_license,
        upload_passbook,
        cv_file,
        ...restFormData
      } = formData;

      // 2. Deep clean the data: This completely strips out any accidental Event objects,
      // circular references, or complex DayJS instances that crash JSON.stringify.
      const safeFormData = JSON.parse(JSON.stringify(restFormData));

      // ✅ Process experienceDocs to base64 if it's a new file
      const safeExperienceDocs = await Promise.all(
        experienceDocs.map(async (doc) => {
          if (doc.file instanceof File) {
            try {
              const base64 = await fileToBase64(doc.file);
              return {
                category: doc.category,
                fileName: doc.file.name,
                fileType: doc.file.type,
                base64: base64,
                previewUrl: doc.previewUrl || null,
              };
            } catch (e) {
              console.error("Failed to convert file to base64", e);
              return null;
            }
          }
          return {
            category: doc.category,
            fileName: doc.fileName || (doc.file && doc.file.name) || "Untitled Document",
            fileType: doc.fileType || (doc.file && doc.file.type) || "application/pdf",
            base64: doc.base64 || null,
            previewUrl: doc.previewUrl || null,
            isExisting: doc.isExisting || false,
            id: doc.id || null,
          };
        })
      );
      const finalExperienceDocs = safeExperienceDocs.filter(Boolean);

      // Generate an ID if this is a brand new draft, otherwise keep existing ID
      const draftId = loadedDraftId || Date.now().toString();

      // Give it a human readable title
      const draftTitle =
        safeFormData.name || safeFormData.private_email || "Unnamed Employee";

      const newDraftPayload = {
        id: draftId,
        title: draftTitle,
        lastModified: new Date().toISOString(),
        formData: safeFormData,
        groupAccessLines: groupAccessLines, // Ensure group access is saved
        experienceDocs: finalExperienceDocs, // ✅ Include vault attachments
      };

      // 3. Get existing drafts array safely
      const existingDraftsStr = localStorage.getItem("emp_form_drafts");
      let drafts = [];

      if (existingDraftsStr) {
        try {
          const parsed = JSON.parse(existingDraftsStr);
          // Ensure it is strictly an array, otherwise default to empty array
          drafts = Array.isArray(parsed) ? parsed : [];
        } catch (parseError) {
          console.error(
            "Corrupted drafts found, clearing storage.",
            parseError,
          );
          drafts = [];
        }
      }

      // 4. Update existing or push new
      if (loadedDraftId) {
        drafts = drafts.map((d: any) =>
          d.id === loadedDraftId ? newDraftPayload : d,
        );
      } else {
        drafts.push(newDraftPayload);
      }

      // 5. Save back to storage
      localStorage.setItem("emp_form_drafts", JSON.stringify(drafts));
      toast.success("Draft saved successfully with attachments.");
      executeClose();
    } catch (error: any) {
      console.error("CRITICAL ERROR saving draft:", error);
      if (error.name === "QuotaExceededError" || (error.message && error.message.toLowerCase().includes("quota"))) {
        toast.error(
          "Failed to save draft. Attachments are too large for storage. Please remove some attachments and try again."
        );
      } else {
        toast.error(
          "Failed to save draft. Form contains invalid or corrupted data."
        );
      }
    }
  };

  const handleDiscardDraft = () => {
    // If they were editing a specific draft and discard it, remove it from array
    if (loadedDraftId) {
      const existingDraftsStr = localStorage.getItem("emp_form_drafts");
      if (existingDraftsStr) {
        const drafts = JSON.parse(existingDraftsStr).filter(
          (d: any) => d.id !== loadedDraftId,
        );
        localStorage.setItem("emp_form_drafts", JSON.stringify(drafts));
      }
    }
    executeClose();
  };

  const handleStartFresh = () => {
    handleDiscardDraft(); // Deletes current draft and closes
    setTimeout(() => {
      // Optional: Re-open immediately empty
      const modalElement = document.getElementById("add_employee_modal2");
      if (modalElement)
        new (window as any).bootstrap.Modal(modalElement).show();
    }, 400);
  };

  const resetForm = () => {
    const defaultBranch = branches.length > 0 ? branches[0].value : "";
    setFormData({ ...initialFormData, name_of_client: defaultBranch });
    setImgPreview(null);
    setErrors({});
    setIsSubmitted(false);
    setValidated(false);
    setActiveTab("legal");
    setShowErrorAlert(false);
    setLoadedDraftId(null);
    setIsDraftLoaded(false);
    setGroupAccessLines([
      {
        group_id: "",
        approval_user_id: "",
        approval_sequance: 0,
        model: "leave",
      },
    ]);
    setExperienceDocs([]); // Clear document vault
  };

  const handleNextStep = () => {
    if (!isLastTab) {
      setActiveTab(tabConfig[currentTabIndex + 1].id);
      document
        .querySelector(".wizard-content-scroll")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handlePrevStep = () => {
    if (!isFirstTab) {
      setActiveTab(tabConfig[currentTabIndex - 1].id);
      document
        .querySelector(".wizard-content-scroll")
        ?.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  // ===================== FILE HANDLING =====================
  const handleStageDocument = () => {
    if (tempDoc.category && tempDoc.file) {
      const previewUrl = URL.createObjectURL(tempDoc.file);
      setExperienceDocs((prev) => [...prev, { ...tempDoc, previewUrl }]);
      setTempDoc({ category: "", file: null });
      const fileInput = document.getElementById(
        "vault-file-input-single",
      ) as HTMLInputElement;
      if (fileInput) fileInput.value = "";
      setIsDirty(true);
    }
  };

  const handleViewFile = (doc: any) => {
    if (doc.previewUrl) window.open(doc.previewUrl, "_blank");
    else if (doc.file instanceof File)
      window.open(URL.createObjectURL(doc.file), "_blank");
    else toast.error("Unable to open file preview");
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve((reader.result as string).split(",")[1]);
      reader.onerror = (error) => reject(error);
    });
  };

  // ===================== DATA LOADING & EFFECTS =====================
  useEffect(() => {
    const incomingId = data?.id ? String(data.id) : null;
    const currentId = formData.id ? String(formData.id) : null;

    if (incomingId !== currentId && data) {
      const getVal = (field: any) => {
        if (Array.isArray(field)) return String(field[0]); // Extracts 74 from [74, "Name"]
        if (field === false || field === null || field === undefined) return "";
        return String(field);
      };

      const cId = getVal(data.country_id) || "104";
      const sId = getVal(data.state_id);
      const dId = getVal(data.department_id);
      loadStates(cId);
      if (sId) loadDistricts(cId, sId);
      if (dId) loadFilteredDesignations(dId);

      const bankDetails = data.bank_account_details || {};
      const imgUrl = data.image_url || null;
      // const licenseUrl = data.driving_license_url || null;
      const licenseUrl =
        typeof data.driving_license === "string" ? data.driving_license : null;
      // const passbookUrl = data.passbook_url || null;
      const passbookUrl =
        typeof data.upload_passbook === "string" ? data.upload_passbook : null;

      if (data.attachments && Array.isArray(data.attachments)) {
        setExperienceDocs(
          data.attachments.map((att: any) => ({
            category: att.document_type || "",
            file: {
              name: att.name || "Untitled Document",
              type: att.mimetype || "application/pdf",
            },
            previewUrl: att.download_url
              ? `https://odooapi.konverthr.com${att.download_url}`
              : null,
            isExisting: true,
            id: att.id,
          })),
        );
      } else {
        setExperienceDocs([]);
      }

      setFormData({
        ...initialFormData,
        ...data,
        work_phone: data.work_phone ? String(data.work_phone) : "",
        attendance_policy_id: getVal(data.attendance_policy_id),
        name_of_client: getVal(data.name_of_site || data.name_of_client),
        resource_calendar_id: getVal(data.resource_calendar_id),
        shift_roster_id: getVal(data.shift_roster_id),
        country_id: cId,
        state_id: sId,
        district_id: getVal(data.district_id),
        department_id: dId,
        job_id: getVal(data.job_id),
        bank_id: getVal(bankDetails.bank_id),
        account_number: bankDetails.account_number || "",
        bank_iafc_code: bankDetails.bank_iafc_code || "",
        bank_swift_code: bankDetails.bank_swift_code || "",
        currency_id: bankDetails.currency_name || "INR",
        reporting_manager_id: getVal(data.reporting_manager_id),
        head_of_department_id: getVal(data.head_of_department_id),
        employment_type: data.employment_type
          ? data.employment_type.toLowerCase()
          : "permanent",
        employee_category: data.employee_category
          ? data.employee_category.toLowerCase()
          : "staff",
        attendance_capture_mode: data.attendance_capture_mode || "mobile",
        pin_code: data.pin_code === 0 ? "" : data.pin_code,
        probation_period: data.probation_period || 6,
        notice_period_days: data.notice_period_days || 0,
        in_probation:
          data.in_probation !== undefined ? data.in_probation : true,
        birthday: data.birthday || null,
        joining_date: data.joining_date || null,
        confirmation_date: data.confirmation_date || null,
        resignation_date: data.resignation_date || null,
        notice_period_end_date: data.notice_period_end_date || null,
        probation_end_date: data.probation_end_date || null,
        group_company_joining_date: data.group_company_joining_date || null,
        date_of_marriage: data.date_of_marriage || null,
        image_1920: imgUrl,
        driving_license: licenseUrl,
        upload_passbook: passbookUrl,
        latitude: data.latitude || "",
        longitude: data.longitude || "",
        random_code_for_reg: data.random_code_for_reg || "",
        device_id: data.device_id || "",
        device_unique_id: data.device_unique_id || "",
        device_name: data.device_name || "",
        system_version: data.system_version || "",
        ip_address: data.ip_address || "",
        device_platform: data.device_platform || "",
      });

      setActiveTab("legal");
      let loadedGroupAccess: any[] = [];
      if (
        data.approvals &&
        Array.isArray(data.approvals) &&
        data.approvals.length > 0
      ) {
        loadedGroupAccess = data.approvals.map((item: any) => ({
          model: item.model || "leave",
          group_id: getVal(item.group_id),
          approval_user_id: getVal(item.approval_user_id),
          approval_sequance: item.approval_sequance || 0,
        }));
      } else if (data.group_access && Array.isArray(data.group_access)) {
        loadedGroupAccess = data.group_access.map((item: any) => ({
          ...item,
          model: item.model || "leave",
          group_id: getVal(item.group_id),
          approval_user_id: getVal(item.approval_user_id),
        }));
      } else {
        const cleanGroupId = getVal(data.group_id);
        if (cleanGroupId) {
          loadedGroupAccess = [
            {
              model: "leave",
              group_id: cleanGroupId,
              approval_user_id: getVal(data.approval_user_id),
              approval_sequance: data.approval_sequance || 0,
            },
          ];
        }
      }

      if (loadedGroupAccess.length > 0) {
        const loadInitialUsers = async () => {
          const newOptions: Record<string, any[]> = { ...groupUserOptions };

          for (const line of loadedGroupAccess) {
            const gId = String(line.group_id);
            const targetUserId = String(line.approval_user_id); // The ID from the DB

            if (gId && gId !== "0" && !newOptions[gId]) {
              try {
                const response = await getGroupUsers(gId);

                // ROBUST EXTRACTION
                let rawUsers: any[] = [];
                if (response?.data?.users && Array.isArray(response.data.users))
                  rawUsers = response.data.users;
                else if (
                  response?.data?.data?.users &&
                  Array.isArray(response.data.data.users)
                )
                  rawUsers = response.data.data.users;
                else if (response?.users && Array.isArray(response.users))
                  rawUsers = response.users;
                else if (Array.isArray(response?.data))
                  rawUsers = response.data;
                else if (Array.isArray(response)) rawUsers = response;
                else if (
                  response?.data?.result &&
                  Array.isArray(response.data.result)
                )
                  rawUsers = response.data.result;
                else if (
                  response?.data?.data &&
                  Array.isArray(response.data.data)
                )
                  rawUsers = response.data.data;
                else if (response?.result && Array.isArray(response.result))
                  rawUsers = response.result;

                const formattedOptions = rawUsers.map((u: any) => ({
                  value: String(u.user_id || u.id),
                  label: u.name || u.login || "Unknown User",
                }));

                // FALLBACK INJECTION (Prevents empty dropdown if DB has an old user ID)
                if (
                  targetUserId &&
                  targetUserId !== "0" &&
                  targetUserId !== ""
                ) {
                  const userExists = formattedOptions.some(
                    (opt: any) => opt.value === targetUserId,
                  );
                  if (!userExists) {
                    formattedOptions.push({
                      value: targetUserId,
                      label: `Historical User (${targetUserId})`,
                    });
                  }
                }

                newOptions[gId] = formattedOptions;
              } catch (e) {
                console.error("Error loading group users:", e);
              }
            }
          }

          setGroupUserOptions(newOptions);
          setGroupAccessLines(loadedGroupAccess);
        };

        loadInitialUsers();
      } else {
        setGroupAccessLines([
          {
            model: "leave",
            group_id: "",
            approval_user_id: "",
            approval_sequance: 0,
          },
        ]);
      }

      if (imgUrl) {
        setImgPreview(imgUrl);
      } else if (data.image_1920 && typeof data.image_1920 === "string") {
        const prefix = data.image_1920.startsWith("data:")
          ? ""
          : "data:image/png;base64,";
        setImgPreview(`${prefix}${data.image_1920}`);
      } else {
        setImgPreview(null);
      }

      setIsDirty(false);
    }
  }, [data]);

  useEffect(() => {
    if (formData.joining_date && formData.probation_period > 0) {
      const calculatedDate = dayjs(formData.joining_date)
        .add(Number(formData.probation_period), "month")
        .format("YYYY-MM-DD");
      if (formData.probation_end_date !== calculatedDate) {
        updateFormData({
          probation_end_date: calculatedDate,
          in_probation: true,
        });
      }
    } else if (
      Number(formData.probation_period) === 0 &&
      formData.in_probation
    ) {
      updateFormData({ in_probation: false });
    }
  }, [formData.joining_date, formData.probation_period]);

  useEffect(() => {
    const loadMasterBanks = async () => {
      try {
        const bankResponse: any = await getBanks();
        const rawBanks =
          bankResponse?.banks ||
          bankResponse?.data ||
          (Array.isArray(bankResponse) ? bankResponse : []);
        setBankMasterList(
          rawBanks.map((b: any) => ({
            value: String(b.id),
            label: b.name,
            swift: b.swift_code || "",
          })),
        );
      } catch (error) {
        console.error("Error loading banks:", error);
      }
    };
    loadMasterBanks();
  }, []);

  const calculateNoticeEndDate = (days: number, resDate: any) => {
    if (resDate && days > 0) {
      const endDate = dayjs(resDate).add(days, "day").format("YYYY-MM-DD");
      updateFormData({
        notice_period_end_date: endDate,
        in_notice_period: true,
      });
    } else {
      updateFormData({ notice_period_end_date: null, in_notice_period: false });
    }
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    fieldName: string,
    config: {
      type: "numeric" | "alpha" | "alphanumeric" | "pan" | "all";
      maxLength?: number;
    },
  ) => {
    let val = e.target.value;
    if (config.type === "numeric") val = val.replace(/\D/g, "");
    if (config.type === "alpha") val = val.replace(/[^a-zA-Z\s]/g, "");
    if (config.type === "alphanumeric") val = val.replace(/[^a-zA-Z0-9]/g, "");
    if (config.type === "pan")
      val = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
    if (config.maxLength) val = val.slice(0, config.maxLength);
    if (formData[fieldName] === val) return;
    updateFormData({ [fieldName]: val });
    if (errors[fieldName])
      setErrors((prev: any) => ({ ...prev, [fieldName]: "" }));
  };

  // ===================== VALIDATIONS =====================
  const validateHeader = () => {
    let tempErrors: any = {};
    if (!formData.name?.trim()) tempErrors.name = "Employee Name is required.";
    if (!formData.father_name?.trim())
      tempErrors.father_name = "Father's Name is required.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateLegalTab = () => {
    let tempErrors: any = {};
    if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12)
      tempErrors.aadhaar_number = "12-digit Aadhaar number is required.";
    if (
      formData.passport_id &&
      (formData.passport_id.length !== 8 ||
        !/^[A-Z][0-9]{7}$/.test(formData.passport_id))
    )
      tempErrors.passport_id = "Invalid Passport format.";
    if (
      formData.voter_id &&
      (formData.voter_id.length !== 10 ||
        !/^[A-Z]{3}[0-9]{7}$/.test(formData.voter_id))
    )
      tempErrors.voter_id = "Invalid Voter ID format.";
    if (
      formData.pan_number &&
      (formData.pan_number.length !== 10 ||
        !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number))
    )
      tempErrors.pan_number = "Invalid PAN format.";
    if (
      formData.is_uan_number_applicable &&
      (!formData.uan_number || formData.uan_number.length !== 12)
    )
      tempErrors.uan_number = "12-digit UAN required.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validatePersonalTab = () => {
    let tempErrors: any = {};
    if (!formData.gender) tempErrors.gender = "Please select a gender.";
    if (!formData.birthday) tempErrors.birthday = "Date of birth is required.";
    if (!formData.blood_group)
      tempErrors.blood_group = "Blood group is required.";
    if (formData.marital === "married") {
      if (!formData.spouse_name?.trim())
        tempErrors.spouse_name = "Spouse name is required.";
      if (!formData.date_of_marriage)
        tempErrors.date_of_marriage = "Marriage date is required.";
    }
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateAddressTab = () => {
    let tempErrors: any = {};
    if (!formData.present_address?.trim())
      tempErrors.present_address = "Present Address is required.";
    if (!formData.permanent_address?.trim())
      tempErrors.permanent_address = "Permanent Address is required.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateEmergencyTab = () => {
    let tempErrors: any = {};
    if (!formData.work_phone || !/^[0-9]{10}$/.test(formData.work_phone))
      tempErrors.work_phone = "Valid 10-digit mobile required.";
    if (
      !formData.private_email ||
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.private_email)
    )
      tempErrors.private_email = "Valid email is required.";
    if (!formData.emergency_contact_name?.trim())
      tempErrors.emergency_contact_name = "Emergency Contact Name required.";
    if (!formData.emergency_contact_relation?.trim())
      tempErrors.emergency_contact_relation = "Relation required.";
    if (
      !formData.emergency_contact_mobile ||
      !/^[0-9]{10}$/.test(formData.emergency_contact_mobile)
    )
      tempErrors.emergency_contact_mobile = "10-digit mobile required.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateEmploymentTab = () => {
    let tempErrors: any = {};
    if (!formData.department_id)
      tempErrors.department_id = "Department is required.";
    if (!formData.job_id) tempErrors.job_id = "Designation is required.";
    if (formData.hold_status && !formData.hold_remarks?.trim())
      tempErrors.hold_remarks = "Reason required.";

    const password = formData.employee_password?.trim() || "";
    if (!password) {
      tempErrors.employee_password = "Login Password required.";
    } else {
      if (password.length < 8) {
        tempErrors.employee_password = "Password must be at least 8 characters.";
      } else if (password.length > 30) {
        tempErrors.employee_password = "Password cannot exceed 30 characters.";
      } else if (!/[A-Z]/.test(password)) {
        tempErrors.employee_password = "Password must contain at least one uppercase letter.";
      } else if (!/[a-z]/.test(password)) {
        tempErrors.employee_password = "Password must contain at least one lowercase letter.";
      } else if (!/[0-9]/.test(password)) {
        tempErrors.employee_password = "Password must contain at least one number.";
      } else if (!/[!@#$%^&*(),.?":{}|<>\-_+=\[\]\\/'`]/.test(password)) {
        tempErrors.employee_password = "Password must contain at least one special character.";
      }
    }

    if (!formData.joining_date)
      tempErrors.joining_date = "Joining Date required.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateBankingTab = () => {
    let tempErrors: any = {};
    if (!formData.bank_id) tempErrors.bank_id = "Bank selection is required.";
    if (!formData.account_number?.toString().trim())
      tempErrors.account_number = "Account number is required.";
    else if (!/^\d+$/.test(formData.account_number))
      tempErrors.account_number = "Only digits allowed.";
    else if (
      formData.account_number.length < 9 ||
      formData.account_number.length > 18
    )
      tempErrors.account_number = "Length should be 9-18 digits.";
    if (!formData.bank_iafc_code?.trim())
      tempErrors.bank_iafc_code = "IFSC Code required.";
    else if (
      formData.bank_iafc_code.length !== 11 ||
      !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_iafc_code)
    )
      tempErrors.bank_iafc_code = "Invalid IFSC format.";
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const validateDeviceTab = () => true;

  const validateNoticeTab = () => {
    let tempErrors: any = {};
    if (formData.type_of_sepration || formData.resignation_date) {
      if (!formData.type_of_sepration)
        tempErrors.type_of_sepration = "Separation type required.";
      if (!formData.resignation_date)
        tempErrors.resignation_date = "Resignation date required.";
      if (!formData.notice_period_days || formData.notice_period_days <= 0)
        tempErrors.notice_period_days = "Valid notice days required.";
    }
    setErrors((prev: any) => ({ ...prev, ...tempErrors }));
    return Object.keys(tempErrors).length === 0;
  };

  const tabFieldsMap: { [key: string]: string[] } = {
    legal: [
      "aadhaar_number",
      "passport_id",
      "passport_no",
      "voter_id",
      "pan_number",
      "uan_number",
    ],
    personal: [
      "gender",
      "birthday",
      "blood_group",
      "spouse_name",
      "date_of_marriage",
    ],
    address: ["present_address", "permanent_address"],
    emergency: [
      "work_phone",
      "private_email",
      "emergency_contact_name",
      "emergency_contact_relation",
      "emergency_contact_mobile",
    ],
    employment: [
      "department_id",
      "job_id",
      "employee_password",
      "hold_remarks",
      "joining_date",
    ],
    banking: ["bank_id", "account_number", "bank_iafc_code"],
    notice: ["type_of_sepration", "resignation_date", "notice_period_days"],
    device: [],
    group_access: [],
  };

  const hasTabErrors = (tabName: string) => {
    if (!isSubmitted) return false;
    const currentTabFields = tabFieldsMap[tabName] || [];
    return currentTabFields.some((field) => errors[field]);
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      updateFormData({ image_1920: file });
      const reader = new FileReader();
      reader.onloadend = () => setImgPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleProbationChange = (months: number) => {
    const joiningDate = formData.joining_date;
    if (joiningDate && months > 0) {
      const endDate = dayjs(joiningDate)
        .add(months, "month")
        .format("YYYY-MM-DD");
      updateFormData({ probation_period: months, probation_end_date: endDate });
    } else {
      updateFormData({ probation_period: months });
    }
  };

  const loadStates = async (countryId: string) => {
    const data = await getStates(countryId);
    setStates(
      data.map((s: any) => ({ value: s.id.toString(), label: s.name })),
    );
  };

  const loadDistricts = async (countryId: string, stateId: string) => {
    const data = await getDistricts(countryId, stateId);
    setDistricts(
      data.map((d: any) => ({ value: d.id.toString(), label: d.name })),
    );
  };

  const loadFilteredDesignations = async (deptId: string) => {
    try {
      const jobs = await getDesignations(deptId);
      setDesignations(
        jobs.map((i: any) => ({
          value: String(i.job_id || i.id),
          label: i.name,
        })),
      );
    } catch (error) {
      console.error("Error loading designations:", error);
    }
  };

  // const handleGroupSelect = async (index: number, groupId: string) => {
  //   const list = [...groupAccessLines];
  //   list[index].group_id = groupId;
  //   list[index].approval_user_id = "";
  //   setGroupAccessLines(list);
  //   setIsDirty(true);

  //   if (groupId && !groupUserOptions[groupId]) {
  //     try {
  //       const response = await getGroupUsers(groupId);
  //       let userList: any[] = [];
  //       if (response?.data?.users) userList = response.data.users;
  //       else if (response?.data?.data?.users)
  //         userList = response.data.data.users;
  //       else if (response?.users) userList = response.users;
  //       else if (Array.isArray(response)) userList = response;

  //       setGroupUserOptions((prev) => ({
  //         ...prev,
  //         [groupId]: userList.map((u: any) => ({
  //           value: String(u.user_id),
  //           label: u.name || u.login,
  //         })),
  //       }));
  //     } catch (error) {
  //       console.error("Failed to load group users", error);
  //     }
  //   }
  // };

  const handleGroupSelect = async (index: number, groupId: string) => {
    // 1. Update the line state immediately
    const list = [...groupAccessLines];
    list[index].group_id = groupId;
    list[index].approval_user_id = ""; // Reset user when group changes
    setGroupAccessLines(list);
    setIsDirty(true);

    // 2. Fetch users for the newly selected group
    if (groupId && groupId !== "0" && !groupUserOptions[groupId]) {
      try {
        const response = await getGroupUsers(groupId);

        // --- BULLETPROOF EXTRACTION LOGIC ---
        let rawUsers: any[] = [];
        if (response?.data?.users && Array.isArray(response.data.users))
          rawUsers = response.data.users;
        else if (
          response?.data?.data?.users &&
          Array.isArray(response.data.data.users)
        )
          rawUsers = response.data.data.users;
        else if (response?.users && Array.isArray(response.users))
          rawUsers = response.users;
        else if (Array.isArray(response?.data)) rawUsers = response.data;
        else if (Array.isArray(response)) rawUsers = response;
        else if (response?.data?.result && Array.isArray(response.data.result))
          rawUsers = response.data.result;
        else if (response?.data?.data && Array.isArray(response.data.data))
          rawUsers = response.data.data;
        else if (response?.result && Array.isArray(response.result))
          rawUsers = response.result;

        // 3. CRITICAL FIX: Extract user_id OR id safely
        const formattedOptions = rawUsers.map((u: any) => ({
          value: String(u.user_id || u.id),
          label: u.name || u.login || "Unknown User",
        }));

        // 4. Update the options state so the User dropdown populates
        setGroupUserOptions((prev) => ({
          ...prev,
          [groupId]: formattedOptions,
        }));
      } catch (error) {
        console.error("Failed to load group users", error);
      }
    }
  };

  const handleLineChange = (index: number, field: string, value: any) => {
    const list = [...groupAccessLines];
    list[index][field] = value;
    setGroupAccessLines(list);
    setIsDirty(true);
  };

  const handleRemoveLine = (indexToRemove: number) => {
    setGroupAccessLines((prevLines) =>
      prevLines.filter((_, index) => index !== indexToRemove),
    );
  };

  // API Data Loading Effects
  useEffect(() => {
    loadStates("104");
  }, []);

  useEffect(() => {
    const fetchBranchData = async () => {
      try {
        const response = await getBranches();
        const branchList = Array.isArray(response) ? response : [];
        const formattedBranches = branchList.map((b: any) => ({
          value: String(b.id),
          label: `${b.name || b.RegisteredCompnany} | ${b.address}`,
        }));
        setBranches(formattedBranches);
        if (
          !data &&
          !draftData &&
          formattedBranches.length > 0 &&
          !formData.name_of_client
        ) {
          setFormData((prev: any) => ({
            ...prev,
            name_of_client: formattedBranches[0].value,
          }));
        }
      } catch (error) {
        console.error("Error fetching branches:", error);
      }
    };
    fetchBranchData();
  }, [data, draftData]);

  useEffect(() => {
    const fetchDropdownData = async () => {
      const [policies, schedules] = await Promise.all([
        getAttendancePolicies(),
        getWorkingSchedules(),
      ]);
      setAttendancePolicies(
        policies.map((p: any) => ({ value: p.id, label: p.name })),
      );
      setWorkingSchedules(
        schedules.map((s: any) => ({ value: s.id, label: s.name })),
      );
    };
    fetchDropdownData();
  }, []);

  useEffect(() => {
    const fetchGroupsData = async () => {
      try {
        const response = await getApprovalGroups();
        let groupsList: any[] = [];
        if (Array.isArray(response)) groupsList = response;
        else if (response && Array.isArray(response.data))
          groupsList = response.data;
        else if (response?.data?.data && Array.isArray(response.data.data))
          groupsList = response.data.data;

        setGroupOptions(
          groupsList.map((g: any) => ({
            value: String(g.group_id || g.id || g._id || ""),
            label: g.group_name || g.name || g.groupName || "Unknown Group",
          })),
        );
      } catch (err) {
        console.error("Error setting group options", err);
      }
    };
    fetchGroupsData();
  }, []);

  useEffect(() => {
    const fetchCountries = async () => {
      const data = await getCountries();
      setCountries(
        data.map((c: any) => ({ value: c.id.toString(), label: c.name })),
      );
    };
    fetchCountries();
  }, []);

  useEffect(() => {
    const fetchEmploymentData = async () => {
      try {
        const [bTypes, bLocs, deptsRes, wLocs, empList] = await Promise.all([
          getBusinessTypes().catch(() => []),
          getBusinessLocations().catch(() => []),
          getDepartments(),
          getWorkLocations().catch(() => []),
          getReportingManagers(),
        ]);
        setDepartments(
          (deptsRes?.data || deptsRes || []).map((i: any) => ({
            value: String(i.id),
            label: i.name,
          })),
        );
        setManagers(
          (empList?.data || empList || []).map((i: any) => ({
            value: String(i.id),
            label: i.name,
          })),
        );
        setBusinessTypes(
          (bTypes?.data || bTypes || []).map((i: any) => ({
            value: String(i.id),
            label: i.name,
          })),
        );
        setBusinessLocations(
          (bLocs?.data || bLocs || []).map((i: any) => ({
            value: String(i.id),
            label: i.name,
          })),
        );
        setWorkLocations(
          (wLocs?.data || wLocs || []).map((i: any) => ({
            value: String(i.id),
            label: i.name,
          })),
        );
      } catch (error) {
        console.error("Promise.all failed", error);
      }
    };
    fetchEmploymentData();
  }, [data]);

  useEffect(() => {
    const loadTimezones = async () => {
      setTimezones(await getTimezones());
    };
    const loadRosters = async () => {
      const res = await getShiftRosters();
      setShiftRosters(
        res.map((item: any) => ({
          value: item.id.toString(),
          label: item.name,
        })),
      );
    };
    loadTimezones();
    loadRosters();
  }, []);

  // ===================== FINAL SUBMISSION =====================
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitted(true);

    const validations = {
      header: validateHeader(),
      legal: validateLegalTab(),
      personal: validatePersonalTab(),
      address: validateAddressTab(),
      employment: validateEmploymentTab(),
      emergency: validateEmergencyTab(),
      banking: validateBankingTab(),
      notice: validateNoticeTab(),
      device: validateDeviceTab(),
    };

    const isFormValid = Object.values(validations).every(
      (isValid) => isValid === true,
    );

    if (!isFormValid) {
      const firstErrorTab = tabConfig.find((tab) => hasTabErrors(tab.id));
      if (firstErrorTab) {
        setActiveTab(firstErrorTab.id);
        document
          .querySelector(".wizard-content-scroll")
          ?.scrollTo({ top: 0, behavior: "smooth" });
      }
      toast.error(
        "Required fields are missing or invalid. Please check the highlighted tabs.",
      );
      setShowErrorAlert(true);
      return;
    }

    setIsSubmitting(true);
    setShowErrorAlert(false);

    try {
      const processToPayload = async (fieldValue: any) => {
        if (!fieldValue) return null;
        if (fieldValue instanceof File) return await fileToBase64(fieldValue);
        if (typeof fieldValue === "string" && fieldValue.startsWith("http")) {
          try {
            const response = await fetch(fieldValue);
            const blob = await response.blob();
            return new Promise((resolve, reject) => {
              const reader = new FileReader();
              reader.onloadend = () =>
                resolve((reader.result as string).split(",")[1]);
              reader.onerror = reject;
              reader.readAsDataURL(blob);
            });
          } catch (error) {
            return null;
          }
        }
        return fieldValue.includes("base64,")
          ? fieldValue.split("base64,")[1]
          : fieldValue;
      };

      const [licenseBase64, passbookBase64, imageBase64] = await Promise.all([
        processToPayload(formData.driving_license),
        processToPayload(formData.upload_passbook),
        processToPayload(formData.image_1920),
      ]);

      const processedAttachments = await Promise.all(
        experienceDocs.map(async (doc) => {
          if (doc.file instanceof File) {
            return {
              name: doc.file.name,
              file_data: await fileToBase64(doc.file),
              mimetype: doc.file.type,
              document_type: doc.category,
            };
          }
          return {
            name: doc.file?.name || "existing_file",
            file_data: doc.file_data || null,
            mimetype: doc.mimetype || "application/pdf",
            document_type: doc.category,
          };
        }),
      );

      const finalPayload = {
        name: formData.name,
        father_name: formData.father_name,
        gender: formData.gender,
        birthday: formData.birthday
          ? dayjs(formData.birthday).format("YYYY-MM-DD")
          : null,
        blood_group: formData.blood_group,
        work_phone: formData.work_phone ? Number(formData.work_phone) : 0,
        private_email: formData.private_email,
        present_address: formData.present_address,
        permanent_address: formData.permanent_address,
        emergency_contact_name: formData.emergency_contact_name,
        emergency_contact_relation: formData.emergency_contact_relation,
        emergency_contact_mobile: formData.emergency_contact_mobile,
        emergency_contact_address: formData.emergency_contact_address,
        mobile_phone: formData.mobile_phone,
        pin_code: formData.pin_code,
        attendance_policy_id: Number(formData.attendance_policy_id),
        employee_category: formData.employee_category?.toLowerCase(),
        shift_roster_id: Number(formData.shift_roster_id),
        resource_calendar_id: Number(formData.resource_calendar_id),
        timezone: formData.timezone,
        district_id: Number(formData.district_id),
        state_id: Number(formData.state_id),
        job_id: Number(formData.job_id),
        department_id: Number(formData.department_id),
        country_id: Number(formData.country_id),
        is_geo_tracking: formData.is_geo_tracking,
        aadhaar_number: formData.aadhaar_number,
        pan_number: formData.pan_number,
        voter_id: formData.voter_id,
        passport_id: formData.passport_id,
        esi_number: formData.esi_number,
        category: formData.category,
        is_uan_number_applicable: formData.is_uan_number_applicable,
        uan_number: formData.uan_number,
        cd_employee_num: formData.cd_employee_num,
        name_of_post_graduation: formData.name_of_post_graduation,
        name_of_any_other_education: formData.name_of_any_other_education,
        total_experiance: formData.total_experiance,
        religion: formData.religion,
        date_of_marriage: formData.date_of_marriage
          ? dayjs(formData.date_of_marriage).format("YYYY-MM-DD")
          : null,
        probation_period: Number(formData.probation_period),
        confirmation_date: formData.confirmation_date
          ? dayjs(formData.confirmation_date).format("YYYY-MM-DD")
          : null,
        hold_remarks: formData.hold_remarks,
        is_lapse_allocation: formData.is_lapse_allocation || false,
        group_company_joining_date: formData.group_company_joining_date
          ? dayjs(formData.group_company_joining_date).format("YYYY-MM-DD")
          : null,
        week_off: formData.week_off,
        grade_band: formData.grade_band,
        status: formData.status,
        employee_password: formData.employee_password,
        hold_status: formData.hold_status,
        bank_id: Number(formData.bank_id),
        account_number: formData.account_number,
        bank_iafc_code: formData.bank_iafc_code,
        bank_swift_code: formData.bank_swift_code,
        currency_id: formData.currency_id,
        reporting_manager_id: formData.reporting_manager_id
          ? Number(formData.reporting_manager_id)
          : null,
        head_of_department_id: formData.head_of_department_id
          ? Number(formData.head_of_department_id)
          : null,
        attendance_capture_mode:
          formData.attendance_capture_mode?.toLowerCase(),
        pin: formData.pin,
        type_of_sepration: formData.type_of_sepration,
        resignation_date: formData.resignation_date
          ? dayjs(formData.resignation_date).format("YYYY-MM-DD")
          : null,
        notice_period_days: Number(formData.notice_period_days),
        joining_date: formData.joining_date
          ? dayjs(formData.joining_date).format("YYYY-MM-DD")
          : null,
        employment_type: formData.employment_type?.toLowerCase(),
        driving_license: licenseBase64,
        upload_passbook: passbookBase64,
        image_1920: imageBase64,
        attachments: processedAttachments,
        name_of_site: Number(formData.name_of_client),
        Spouse_name: formData.spouse_name,
        device_id: formData.device_id,
        device_name: formData.device_name,
        device_platform: formData.device_platform,
        device_unique_id: formData.device_unique_id,
        ip_address: formData.ip_address,
        random_code_for_reg: formData.random_code_for_reg,
        system_version: formData.system_version,
        approvals: groupAccessLines.map((line) => ({
          group_id: Number(line.group_id || 0),
          approval_user_id: Number(line.approval_user_id || 0),
          approval_sequance: Number(line.approval_sequance || 0),
          model: line.model || "leave",
        })),
      };

      if (data?.id) await updateEmployee(data.id, finalPayload);
      else await addEmployee(finalPayload);

      toast.success(
        data?.id
          ? "Employee updated successfully"
          : "Employee created successfully",
      );

      // Remove specific draft if loaded
      if (loadedDraftId) {
        const existingStr = localStorage.getItem("emp_form_drafts");
        if (existingStr) {
          const updated = JSON.parse(existingStr).filter(
            (d: any) => d.id !== loadedDraftId,
          );
          localStorage.setItem("emp_form_drafts", JSON.stringify(updated));
        }
      }

      setIsDirty(false);
      onSuccess();
      document.getElementById("actual-modal-close-btn")?.click();
    } catch (err: any) {
      if (err.response)
        toast.error(err.response.data?.message || "Server Error");
      else if (err.request) toast.error("Server not responding / CORS issue");
      else toast.error(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return createPortal(
    <>
      <div
        className="modal fade"
        id="add_employee_modal2"
        role="dialog"
        data-bs-backdrop="static"
        data-bs-keyboard={preventClose ? "false" : "true"}
      >
        <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
          <div className="modal-content bg-light border-0 shadow-lg overflow-hidden h-100">
            <button
              id="actual-modal-close-btn"
              data-bs-dismiss="modal"
              className="d-none"
            ></button>

            <div className="modal-header bg-white border-bottom py-3 px-4 shadow-sm z-3">
              <h5 className="modal-title fw-bold fs-16 d-flex align-items-center">
                <div
                  className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
                  style={{ width: "40px", height: "40px" }}
                >
                  <i className="ti ti-user-plus fs-20"></i>
                </div>
                <div>
                  {preventClose
                    ? "Complete Admin Profile"
                    : isViewOnly
                      ? "View Employee Profile"
                      : data
                        ? "Edit Employee Profile"
                        : "Onboard New Employee"}
                  <div className="fs-12 text-muted fw-normal mt-1">
                    {isViewOnly
                      ? "Viewing the details of this employee profile"
                      : "Fill in the necessary details across the sections below"}
                  </div>
                </div>
              </h5>
              <div className="d-flex align-items-center gap-2">
                {formData.employee_category?.toLowerCase() === "staff" && (
                  <button
                    type="button"
                    className="btn btn-soft-primary d-flex align-items-center px-3 py-2"
                    onClick={() => setShowExpModal(true)}
                  >
                    <i className="ti ti-paperclip me-2 fs-16"></i>
                    <span className="fs-13 fw-bold">
                      {experienceDocs.length > 0
                        ? `${experienceDocs.length} Docs Attached`
                        : "Vault Attachments"}
                    </span>
                  </button>
                )}
                {!preventClose && (
                  <button
                    type="button"
                    className="btn-close ms-2"
                    onClick={handleAttemptClose}
                  ></button>
                )}
              </div>
            </div>

            <div className="modal-body p-0 d-flex flex-column h-100">
              {/* --- DRAFT MODE WARNING BANNER --- */}
              {isDraftLoaded && !data && (
                <div className="bg-warning-subtle border-bottom border-warning px-4 py-2 d-flex justify-content-between align-items-center z-2 shadow-sm">
                  <div className="text-warning-emphasis fs-13 d-flex align-items-center">
                    <i className="ti ti-info-circle-filled fs-18 me-2 text-warning"></i>
                    <span>
                      <strong>Draft Mode:</strong> Resuming an unsaved profile.
                      File attachments cannot be saved in drafts.
                    </span>
                  </div>
                  <button
                    type="button"
                    className="btn btn-sm btn-warning rounded-pill py-1 fs-12 fw-bold"
                    onClick={handleStartFresh}
                  >
                    <i className="ti ti-trash me-1"></i> Discard Draft & Start
                    Fresh
                  </button>
                </div>
              )}

              <form
                className={`needs-validation h-100 d-flex flex-column ${validated ? "was-validated" : ""}`}
                noValidate
                onSubmit={handleSubmit}
                autoComplete="off"
              >
                {/* 👇 These hidden inputs "catch" the browser's autofill so your real fields stay clean 👇 */}
                <input
                  disabled={isViewOnly || isSubmitting}
                  readOnly={isViewOnly}
                  type="text"
                  style={{ display: "none" }}
                />
                <input
                  disabled={isViewOnly || isSubmitting}
                  readOnly={isViewOnly}
                  type="password"
                  style={{ display: "none" }}
                />
                <div
                  className="d-flex flex-row flex-grow-1"
                  style={{ minHeight: "65vh" }}
                >
                  {/* --- LEFT SIDEBAR --- */}
                  <div
                    className="bg-white border-end d-flex flex-column"
                    style={{ width: "280px", zIndex: 2 }}
                  >
                    <div className="p-3 border-bottom bg-light-subtle">
                      <span className="text-muted fs-11 fw-bold text-uppercase tracking-wider">
                        Form Sections
                      </span>
                    </div>
                    <div className="flex-grow-1 overflow-auto hide-scrollbar p-3">
                      {tabConfig.map((tab, idx) => {
                        const isError = hasTabErrors(tab.id);
                        const isActive = activeTab === tab.id;
                        return (
                          <button
                            key={tab.id}
                            type="button"
                            onClick={() => setActiveTab(tab.id)}
                            className={`btn w-100 text-start border-0 mb-2 px-3 py-2 rounded-3 transition-all d-flex align-items-center justify-content-between ${isActive ? "bg-primary text-white shadow-sm" : isError ? "bg-danger-subtle text-danger" : "bg-light text-dark hover-bg-light-subtle"}`}
                          >
                            <div className="d-flex align-items-center">
                              <div
                                className={`d-flex align-items-center justify-content-center rounded-circle me-2 ${isActive ? "bg-white text-primary" : isError ? "bg-danger text-white" : "bg-white text-muted border"}`}
                                style={{
                                  width: "28px",
                                  height: "28px",
                                  fontSize: "12px",
                                  fontWeight: "bold",
                                }}
                              >
                                {idx + 1}
                              </div>
                              <span className="fs-13 fw-medium">
                                {tab.label}
                              </span>
                            </div>
                            {isError && (
                              <i className="ti ti-alert-circle-filled fs-16 animate__animated animate__pulse animate__infinite"></i>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* --- RIGHT CONTENT AREA --- */}
                  <div className="flex-grow-1 d-flex flex-column position-relative bg-light-subtle wizard-content-scroll overflow-auto hide-scrollbar">
                    <div className="p-4 flex-grow-1">
                      {preventClose && (
                        <div className="alert alert-soft-danger d-flex align-items-center mb-4 border-0 shadow-sm rounded-3">
                          <i className="ti ti-alert-circle fs-24 me-3"></i>
                          <div>
                            <h6 className="mb-1 fw-bold">
                              Profile Completion Required
                            </h6>
                            <p className="mb-0 fs-13">
                              Please fill in all mandatory fields to unlock full
                              access.
                            </p>
                          </div>
                        </div>
                      )}

                      {/* --- GLOBAL HEADER CARD --- */}
                      <div className="card border-0 shadow-sm rounded-3 mb-4">
                        <div className="card-body p-4">
                          <div className="row g-3 align-items-center mx-0">
                            <div className="col-md-10">
                              <div className="row g-3">
                                <div className="col-md-4">
                                  <label className="form-label fs-13 fw-bold">
                                    Full Name{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted ? (errors.name ? "is-invalid" : formData.name ? "is-valid" : "") : ""}`}
                                    placeholder="Enter Fullname here"
                                    value={formData.name}
                                    onChange={(e) =>
                                      handleInputChange(e, "name", {
                                        type: "alpha",
                                        maxLength: 50,
                                      })
                                    }
                                  />
                                  {isSubmitted && errors.name && (
                                    <div className="text-danger fs-11 mt-1">
                                      <i className="ti ti-info-circle me-1"></i>
                                      {errors.name}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13 fw-bold">
                                    Father's Name{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted ? (errors.father_name ? "is-invalid" : formData.father_name ? "is-valid" : "") : ""}`}
                                    placeholder="Enter Father's Name"
                                    value={formData.father_name}
                                    onChange={(e) =>
                                      handleInputChange(e, "father_name", {
                                        type: "alpha",
                                        maxLength: 50,
                                      })
                                    }
                                  />
                                  {isSubmitted && errors.father_name && (
                                    <div className="text-danger fs-11 mt-1">
                                      <i className="ti ti-info-circle me-1"></i>
                                      {errors.father_name}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13 fw-bold">
                                    Branch
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    key={`branch-field-${formData.name_of_client}-${branches.length}`}
                                    options={branches}
                                    placeholder="Select Branch"
                                    value={
                                      branches.find(
                                        (b) =>
                                          b.value ===
                                          String(formData.name_of_client),
                                      ) || null
                                    }
                                    onChange={(opt) =>
                                      updateFormData({
                                        name_of_client: opt?.value || "",
                                      })
                                    }
                                    formatOptionLabel={(option: any) => {
                                      const [company, address] =
                                        option.label.split(" | ");
                                      return (
                                        <div className="d-flex flex-column py-1">
                                          <span className="fw-bold fs-13 text-dark mb-1">
                                            {company}
                                          </span>
                                          {address && (
                                            <small className="text-muted fs-11 lh-sm">
                                              <i className="ti ti-map-pin me-1"></i>
                                              {address}
                                            </small>
                                          )}
                                        </div>
                                      );
                                    }}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Employee Category
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={[
                                      { value: "staff", label: "Staff" },
                                      { value: "contract", label: "Contract" },
                                      { value: "intern", label: "Intern" },
                                    ]}
                                    defaultValue={[
                                      { value: "staff", label: "Staff" },
                                      { value: "contract", label: "Contract" },
                                      { value: "intern", label: "Intern" },
                                    ].find(
                                      (o) =>
                                        o.value === formData.employee_category,
                                    )}
                                    onChange={(opt) =>
                                      updateFormData({
                                        employee_category: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Working Hours
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={workingSchedules}
                                    placeholder="Select Hours"
                                    value={
                                      workingSchedules.find(
                                        (o) =>
                                          String(o.value) ===
                                          String(formData.resource_calendar_id),
                                      ) || null
                                    }
                                    onChange={(opt) =>
                                      updateFormData({
                                        resource_calendar_id: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label fs-13 fw-bold text-dark mb-0">
                                      Experience
                                    </label>
                                    <span
                                      className="badge rounded-pill px-2 py-1"
                                      style={{
                                        backgroundColor:
                                          "rgba(228, 33, 40, 0.1)",
                                        color: "#E42128",
                                        border:
                                          "1px solid rgba(228, 33, 40, 0.2)",
                                      }}
                                    >
                                      {formData.total_experiance || 0} Yrs
                                    </span>
                                  </div>
                                  <div className="px-2">
                                    <Slider
                                      min={0}
                                      max={30}
                                      step={1}
                                      disabled={isViewOnly}
                                      value={
                                        Number(formData.total_experiance) || 0
                                      }
                                      onChange={(val) =>
                                        updateFormData({
                                          total_experiance: val.toString(),
                                        })
                                      }
                                      styles={{
                                        track: { backgroundColor: "#E42128" },
                                        handle: {
                                          borderColor: "#E42128",
                                          backgroundColor: "#fff",
                                        },
                                      }}
                                    />
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div className="col-md-2 text-center border-start py-2">
                              <div
                                className="profile-pic-box border border-dashed rounded p-1 mx-auto bg-white shadow-sm"
                                style={{
                                  width: "100px",
                                  height: "100px",
                                  position: "relative",
                                }}
                              >
                                {imgPreview ? (
                                  <img
                                    src={imgPreview}
                                    className="img-fluid rounded w-100 h-100 object-fit-cover"
                                    alt="Preview"
                                  />
                                ) : (
                                  <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-light rounded">
                                    <i className="ti ti-user fs-48 text-muted opacity-50"></i>
                                  </div>
                                )}
                                <label
                                  htmlFor="emp_img_header"
                                  className="btn btn-primary btn-icon btn-xs rounded-circle position-absolute"
                                  style={{
                                    bottom: "-10px",
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                    width: "26px",
                                    height: "26px",
                                    padding: 0,
                                    display: "grid",
                                    placeItems: "center",
                                    cursor: "pointer",
                                  }}
                                >
                                  <i className="ti ti-upload fs-12"></i>
                                </label>
                                <input
                                  disabled={isViewOnly || isSubmitting}
                                  readOnly={isViewOnly}
                                  type="file"
                                  id="emp_img_header"
                                  className="d-none"
                                  accept="image/*"
                                  onChange={handleImageChange}
                                />
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* --- DYNAMIC TAB CONTENT --- */}
                      <div className="card border-0 shadow-sm rounded-3">
                        <div className="card-header bg-white border-bottom py-3 px-4">
                          <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
                            <i
                              className={`ti ${tabConfig[currentTabIndex].icon} fs-20 me-2`}
                            ></i>
                            {tabConfig[currentTabIndex].label}
                          </h6>
                        </div>
                        <div className="card-body p-4">
                          {activeTab === "legal" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="row g-4">
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Aadhaar Number{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted ? (errors.aadhaar_number ? "is-invalid" : formData.aadhaar_number ? "is-valid" : "") : ""}`}
                                    placeholder="12 Digit Aadhaar"
                                    value={formData.aadhaar_number}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 12);
                                      updateFormData({ aadhaar_number: val });
                                      if (errors.aadhaar_number)
                                        setErrors({
                                          ...errors,
                                          aadhaar_number: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.aadhaar_number && (
                                    <div className="invalid-feedback">
                                      {errors.aadhaar_number}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    PAN Number
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control text-uppercase ${isSubmitted ? (errors.pan_number ? "is-invalid" : formData.pan_number ? "is-valid" : "") : ""}`}
                                    maxLength={10}
                                    placeholder="ABCDE1234F"
                                    value={formData.pan_number}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, "");
                                      updateFormData({ pan_number: val });
                                      if (errors.pan_number)
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          pan_number: "",
                                        }));
                                    }}
                                  />
                                  {isSubmitted && errors.pan_number && (
                                    <div className="invalid-feedback">
                                      {errors.pan_number}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Voter ID
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control text-uppercase ${isSubmitted && errors.voter_id ? "is-invalid" : ""}`}
                                    placeholder="ABC1234567"
                                    maxLength={10}
                                    value={formData.voter_id}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, "");
                                      updateFormData({ voter_id: val });
                                      if (errors.voter_id)
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          voter_id: "",
                                        }));
                                    }}
                                  />
                                  {isSubmitted && errors.voter_id && (
                                    <div className="invalid-feedback">
                                      {errors.voter_id}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Passport No
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    maxLength={8}
                                    className={`form-control text-uppercase ${isSubmitted && errors.passport_id ? "is-invalid" : ""}`}
                                    placeholder="A1234567"
                                    value={formData.passport_id}
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .toUpperCase()
                                        .replace(/[^A-Z0-9]/g, "");
                                      updateFormData({ passport_id: val });
                                      if (errors.passport_id)
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          passport_id: "",
                                        }));
                                    }}
                                  />
                                  {isSubmitted && errors.passport_id && (
                                    <div className="invalid-feedback">
                                      {errors.passport_id}
                                    </div>
                                  )}
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>

                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    ESI Number
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    placeholder="Enter ESI Number"
                                    value={formData.esi_number}
                                    onChange={(e) =>
                                      handleInputChange(e, "esi_number", {
                                        type: "numeric",
                                        maxLength: 17,
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-2 d-flex align-items-center pt-4">
                                  <div className="form-check">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="checkbox"
                                      className="form-check-input"
                                      id="uanCheckLegal"
                                      checked={
                                        formData.is_uan_number_applicable
                                      }
                                      onChange={(e) =>
                                        updateFormData({
                                          is_uan_number_applicable:
                                            e.target.checked,
                                        })
                                      }
                                    />
                                    <label
                                      className="form-check-label fs-13 ms-2"
                                      htmlFor="uanCheckLegal"
                                    >
                                      UAN Applicable?
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    UAN Number{" "}
                                    {formData.is_uan_number_applicable && (
                                      <span className="text-danger">*</span>
                                    )}
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly ||
                                      isSubmitting ||
                                      !formData.is_uan_number_applicable
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted && formData.is_uan_number_applicable ? (errors.uan_number ? "is-invalid" : "is-valid") : ""}`}
                                    placeholder="12 Digit UAN"
                                    value={formData.uan_number}
                                    onChange={(e) =>
                                      handleInputChange(e, "uan_number", {
                                        type: "numeric",
                                        maxLength: 12,
                                      })
                                    }
                                  />
                                  {isSubmitted && errors.uan_number && (
                                    <div className="invalid-feedback">
                                      {errors.uan_number}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-12 mb-1">
                                    Upload Driving License
                                  </label>
                                  <div className="d-flex align-items-center gap-2">
                                    <div className="position-relative">
                                      <input
                                        disabled={isViewOnly || isSubmitting}
                                        readOnly={isViewOnly}
                                        type="file"
                                        id="license_upload_input"
                                        className="d-none"
                                        onChange={(e) =>
                                          updateFormData({
                                            driving_license:
                                              e.target.files?.[0] || null,
                                          })
                                        }
                                      />
                                      <label
                                        htmlFor="license_upload_input"
                                        className={`btn btn-icon mb-0 ${formData.driving_license ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
                                        style={{
                                          width: "40px",
                                          height: "40px",
                                          cursor: "pointer",
                                        }}
                                        title="Upload License"
                                      >
                                        <i
                                          className={`ti ${formData.driving_license ? "ti-file-check" : "ti-upload"} fs-18`}
                                        ></i>
                                      </label>
                                    </div>
                                    {/* {formData.driving_license && (
                                      <div className="d-flex align-items-center animate__animated animate__fadeIn">
                                        {typeof formData.driving_license ===
                                          "string" && (
                                          <a
                                            href={formData.driving_license}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-icon btn-sm btn-ghost-info"
                                          >
                                            <i className="ti ti-eye fs-18"></i>
                                          </a>
                                        )}
                                        {formData.driving_license instanceof
                                          File && (
                                          <i className="ti ti-circle-check-filled text-success fs-20 ms-1"></i>
                                        )}
                                      </div>
                                    )} */}
                                    {formData.driving_license && (
                                      <div className="d-flex align-items-center animate__animated animate__fadeIn">
                                        {/* 1. Show EYE ICON if the value is a URL string from the backend */}
                                        {typeof formData.driving_license ===
                                          "string" && (
                                            <a
                                              href={formData.driving_license}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="btn btn-icon btn-sm btn-ghost-info ms-1"
                                              title="View Current License"
                                            >
                                              <i className="ti ti-eye fs-18"></i>
                                            </a>
                                          )}

                                        {/* 2. Show CHECKMARK if a new File object has been selected */}
                                        {formData.driving_license instanceof
                                          File && (
                                            <i
                                              className="ti ti-circle-check-filled text-success fs-20 ms-1"
                                              title="New file selected"
                                            ></i>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "personal" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="row g-4">
                                <div className="col-md-3">
                                  <label className="form-label fs-13 text-muted">
                                    Employee Code
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control bg-light border-dashed"
                                    value="ex. EMP001"
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Marital Status
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={[
                                      { value: "single", label: "Single" },
                                      { value: "married", label: "Married" },
                                      {
                                        value: "cohabitant",
                                        label: "Legal Cohabitant",
                                      },
                                      { value: "widower", label: "Widower" },
                                      { value: "divorced", label: "Divorced" },
                                    ]}
                                    defaultValue={{
                                      value: formData.marital,
                                      label: formData.marital
                                        ? formData.marital
                                          .charAt(0)
                                          .toUpperCase() +
                                        formData.marital.slice(1)
                                        : "Select",
                                    }}
                                    onChange={(opt) => {
                                      updateFormData({
                                        marital: opt?.value || "",
                                        spouse_name:
                                          opt?.value !== "married"
                                            ? ""
                                            : formData.spouse_name,
                                        date_of_marriage:
                                          opt?.value !== "married"
                                            ? null
                                            : formData.date_of_marriage,
                                      });
                                    }}
                                  />
                                </div>
                                {formData.marital === "married" && (
                                  <>
                                    <div className="col-md-3 animate__animated animate__fadeInDown">
                                      <label className="form-label fs-13">
                                        Spouse Name{" "}
                                        <span className="text-danger">*</span>
                                      </label>
                                      <input
                                        disabled={isViewOnly || isSubmitting}
                                        readOnly={isViewOnly}
                                        type="text"
                                        className={`form-control ${isSubmitted ? (errors.spouse_name ? "is-invalid" : formData.spouse_name ? "is-valid" : "") : ""}`}
                                        placeholder="Spouse Name"
                                        value={formData.spouse_name}
                                        onChange={(e) =>
                                          handleInputChange(e, "spouse_name", {
                                            type: "alpha",
                                            maxLength: 50,
                                          })
                                        }
                                      />
                                      {isSubmitted && errors.spouse_name && (
                                        <div className="invalid-feedback">
                                          {errors.spouse_name}
                                        </div>
                                      )}
                                    </div>
                                    <div className="col-md-3 animate__animated animate__fadeInDown">
                                      <label className="form-label fs-13">
                                        Date of Marriage{" "}
                                        <span className="text-danger">*</span>
                                      </label>
                                      <DatePicker
                                        disabled={isViewOnly}
                                        className={`form-control w-100 ${isSubmitted ? (errors.date_of_marriage ? "is-invalid" : formData.date_of_marriage ? "is-valid" : "") : ""}`}
                                        value={
                                          formData.date_of_marriage
                                            ? dayjs(formData.date_of_marriage)
                                            : null
                                        }
                                        onChange={(_, dateStr) => {
                                          updateFormData({
                                            date_of_marriage: dateStr,
                                          });
                                          if (errors.date_of_marriage)
                                            setErrors({
                                              ...errors,
                                              date_of_marriage: "",
                                            });
                                        }}
                                      />
                                      {isSubmitted &&
                                        errors.date_of_marriage && (
                                          <div className="invalid-feedback d-block">
                                            {errors.date_of_marriage}
                                          </div>
                                        )}
                                    </div>
                                  </>
                                )}
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Date of Birth{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <DatePicker
                                    disabled={isViewOnly}
                                    className={`form-control w-100 ${isSubmitted ? (errors.birthday ? "is-invalid" : formData.birthday ? "is-valid" : "") : ""}`}
                                    value={
                                      formData.birthday
                                        ? dayjs(formData.birthday)
                                        : null
                                    }
                                    onChange={(_, dateStr) => {
                                      updateFormData({ birthday: dateStr });
                                      if (errors.birthday)
                                        setErrors({ ...errors, birthday: "" });
                                    }}
                                  />
                                  {isSubmitted && errors.birthday && (
                                    <div className="invalid-feedback d-block">
                                      {errors.birthday}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Blood Group{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div
                                    className={
                                      isSubmitted
                                        ? errors.blood_group
                                          ? "border border-danger rounded"
                                          : formData.blood_group
                                            ? "border border-success rounded"
                                            : ""
                                        : ""
                                    }
                                  >
                                    <CommonSelect
                                      disabled={isViewOnly}
                                      options={[
                                        "A+",
                                        "A-",
                                        "B+",
                                        "B-",
                                        "AB+",
                                        "AB-",
                                        "O+",
                                        "O-",
                                      ].map((bg) => ({ value: bg, label: bg }))}
                                      defaultValue={
                                        formData.blood_group
                                          ? {
                                            value: formData.blood_group,
                                            label: formData.blood_group,
                                          }
                                          : undefined
                                      }
                                      onChange={(opt) => {
                                        updateFormData({
                                          blood_group: opt?.value || "",
                                        });
                                        if (errors.blood_group)
                                          setErrors({
                                            ...errors,
                                            blood_group: "",
                                          });
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.blood_group && (
                                    <div className="invalid-feedback d-block">
                                      {errors.blood_group}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13 d-block">
                                    Gender{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div
                                    className={`pt-1 ps-2 rounded ${isSubmitted && errors.gender ? "border border-danger" : ""}`}
                                  >
                                    <Radio.Group
                                      className="custom-radio-group"
                                      value={formData.gender}
                                      disabled={isViewOnly}
                                      onChange={(e) => {
                                        updateFormData({
                                          gender: e.target.value,
                                        });
                                        if (errors.gender)
                                          setErrors({ ...errors, gender: "" });
                                      }}
                                    >
                                      <Radio value="male">Male</Radio>
                                      <Radio value="female">Female</Radio>
                                      <Radio value="other">Other</Radio>
                                    </Radio.Group>
                                  </div>
                                  {isSubmitted && errors.gender && (
                                    <div className="invalid-feedback d-block">
                                      {errors.gender}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Category
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={[
                                      { value: "general", label: "General" },
                                      { value: "sc", label: "SC" },
                                      { value: "st", label: "ST" },
                                      { value: "obc", label: "OBC" },
                                      { value: "others", label: "Others" },
                                    ]}
                                    placeholder="Select Category"
                                    defaultValue={
                                      formData.category
                                        ? {
                                          value: formData.category,
                                          label:
                                            formData.category.toUpperCase(),
                                        }
                                        : undefined
                                    }
                                    onChange={(opt) =>
                                      updateFormData({
                                        category: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Educational Qualification
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    placeholder="BCA, MBA, etc."
                                    value={formData.name_of_post_graduation}
                                    onChange={(e) =>
                                      handleInputChange(
                                        e,
                                        "name_of_post_graduation",
                                        { type: "alpha", maxLength: 100 },
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    University Name
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.name_of_any_other_education}
                                    onChange={(e) =>
                                      handleInputChange(
                                        e,
                                        "name_of_any_other_education",
                                        { type: "alpha", maxLength: 100 },
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    CV / Resume Attachment
                                  </label>
                                  <div className="d-flex align-items-center gap-2">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="file"
                                      id="cv_upload_input"
                                      accept=".pdf,.doc,.docx"
                                      className="d-none"
                                      onChange={(e) =>
                                        updateFormData({
                                          cv_file: e.target.files?.[0] || null,
                                        })
                                      }
                                    />
                                    <label
                                      htmlFor="cv_upload_input"
                                      className={`btn btn-icon mb-0 ${formData.cv_file ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        cursor: "pointer",
                                      }}
                                      title="Upload CV"
                                    >
                                      <i
                                        className={`ti ${formData.cv_file ? "ti-file-text" : "ti-upload"} fs-18`}
                                      ></i>
                                    </label>
                                    {formData.cv_file && (
                                      <div className="d-flex align-items-center animate__animated animate__fadeIn">
                                        {formData.cv_file instanceof File && (
                                          <span
                                            className="fs-12 text-muted text-truncate ms-2"
                                            style={{ maxWidth: "120px" }}
                                          >
                                            {formData.cv_file.name}
                                          </span>
                                        )}
                                        {typeof formData.cv_file ===
                                          "string" && (
                                            <a
                                              href={formData.cv_file}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="btn btn-icon btn-sm btn-ghost-info ms-2"
                                            >
                                              <i className="ti ti-eye fs-18"></i>
                                            </a>
                                          )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "address" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="row g-4">
                                {/* <div className="col-md-6">
                                  <label className="form-label fs-13">
                                    Present Address{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
                                    rows={3}
                                    className={`form-control ${isSubmitted ? (errors.present_address ? "is-invalid" : formData.present_address ? "is-valid" : "") : ""}`}
                                    maxLength={500}
                                    placeholder="House no, Building, Street..."
                                    value={formData.present_address}
                                    onChange={(e) => {
                                      updateFormData({
                                        present_address: e.target.value,
                                      });
                                      if (errors.present_address)
                                        setErrors({
                                          ...errors,
                                          present_address: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.present_address && (
                                    <div className="invalid-feedback">
                                      {errors.present_address}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fs-13">
                                    Permanent Address{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
                                    rows={3}
                                    className={`form-control ${isSubmitted ? (errors.permanent_address ? "is-invalid" : formData.permanent_address ? "is-valid" : "") : ""}`}
                                    maxLength={500}
                                    placeholder="Same as present or different..."
                                    value={formData.permanent_address}
                                    onChange={(e) => {
                                      updateFormData({
                                        permanent_address: e.target.value,
                                      });
                                      if (errors.permanent_address)
                                        setErrors({
                                          ...errors,
                                          permanent_address: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.permanent_address && (
                                    <div className="invalid-feedback">
                                      {errors.permanent_address}
                                    </div>
                                  )}
                                </div> */}
                                <div className="col-md-6">
                                  <label className="form-label fs-13">
                                    Present Address{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <textarea
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    rows={3}
                                    className={`form-control ${isSubmitted ? (errors.present_address ? "is-invalid" : formData.present_address ? "is-valid" : "") : ""}`}
                                    maxLength={500}
                                    placeholder="House no, Building, Street..."
                                    value={formData.present_address}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      // Update present address, and if checkbox is checked, sync permanent address too
                                      updateFormData({
                                        present_address: val,
                                        ...(formData.is_same_address
                                          ? { permanent_address: val }
                                          : {}),
                                      });
                                      if (errors.present_address)
                                        setErrors({
                                          ...errors,
                                          present_address: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.present_address && (
                                    <div className="invalid-feedback">
                                      {errors.present_address}
                                    </div>
                                  )}
                                </div>

                                {/* Permanent Address */}
                                <div className="col-md-6">
                                  <div className="d-flex justify-content-between align-items-center mb-2">
                                    <label className="form-label fs-13 mb-0">
                                      Permanent Address{" "}
                                      <span className="text-danger">*</span>
                                    </label>
                                    <div className="form-check mb-0">
                                      <input
                                        disabled={isViewOnly || isSubmitting}
                                        readOnly={isViewOnly}
                                        className="form-check-input"
                                        type="checkbox"
                                        id="sameAsAbove"
                                        checked={formData.is_same_address}
                                        onChange={(e) => {
                                          const checked = e.target.checked;
                                          updateFormData({
                                            is_same_address: checked,
                                            permanent_address: checked
                                              ? formData.present_address
                                              : formData.permanent_address,
                                          });
                                          if (
                                            checked &&
                                            errors.permanent_address
                                          ) {
                                            setErrors({
                                              ...errors,
                                              permanent_address: "",
                                            });
                                          }
                                        }}
                                      />
                                      <label
                                        className="form-check-label fs-12 text-primary cursor-pointer"
                                        htmlFor="sameAsAbove"
                                      >
                                        Same as Present
                                      </label>
                                    </div>
                                  </div>
                                  <textarea
                                    disabled={
                                      isViewOnly ||
                                      isSubmitting ||
                                      formData.is_same_address
                                    }
                                    readOnly={isViewOnly}
                                    rows={3}
                                    className={`form-control ${formData.is_same_address ? "bg-light opacity-75" : ""} ${isSubmitted ? (errors.permanent_address ? "is-invalid" : formData.permanent_address ? "is-valid" : "") : ""}`}
                                    maxLength={500}
                                    placeholder={
                                      formData.is_same_address
                                        ? "Matching present address..."
                                        : "Same as present or different..."
                                    }
                                    value={formData.permanent_address}
                                    onChange={(e) => {
                                      updateFormData({
                                        permanent_address: e.target.value,
                                      });
                                      if (errors.permanent_address)
                                        setErrors({
                                          ...errors,
                                          permanent_address: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.permanent_address && (
                                    <div className="invalid-feedback">
                                      {errors.permanent_address}
                                    </div>
                                  )}
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Country
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={countries}
                                    placeholder="Select Country"
                                    defaultValue={countries.find(
                                      (c) => c.value === "104",
                                    )}
                                    onChange={(opt) => {
                                      const countryId = opt?.value || "";
                                      updateFormData({
                                        country_id: countryId,
                                        state_id: "",
                                        district_id: "",
                                      });
                                      loadStates(countryId);
                                    }}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    State
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    key={`state-${formData.country_id}`}
                                    options={states}
                                    placeholder="Select State"
                                    defaultValue={states.find(
                                      (s) =>
                                        s.value === String(formData.state_id),
                                    )}
                                    onChange={(opt) => {
                                      const stateId = opt?.value || "";
                                      updateFormData({
                                        state_id: stateId,
                                        district_id: "",
                                      });
                                      loadDistricts(
                                        formData.country_id || "104",
                                        stateId,
                                      );
                                    }}
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    District
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    key={`city-${formData.state_id}`}
                                    options={districts}
                                    placeholder="Select District"
                                    defaultValue={districts.find(
                                      (d) =>
                                        d.value ===
                                        String(formData.district_id),
                                    )}
                                    onChange={(opt) =>
                                      updateFormData({
                                        district_id: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Pin Code
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    maxLength={6}
                                    placeholder="6-Digits"
                                    value={formData.pin_code}
                                    onChange={(e) =>
                                      updateFormData({
                                        pin_code: e.target.value.replace(
                                          /\D/g,
                                          "",
                                        ),
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "emergency" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="alert alert-soft-warning d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3">
                                <i className="ti ti-info-circle fs-24 me-3"></i>
                                <div className="fs-13">
                                  Please ensure the contact details provided are
                                  accurate for use in case of emergencies.
                                </div>
                              </div>
                              <div className="row g-4">
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Primary Mobile{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div className="input-group">
                                    <span className="input-group-text fs-12 bg-light">
                                      +91
                                    </span>
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="text"
                                      className={`form-control ${isSubmitted ? (errors.work_phone ? "is-invalid" : formData.work_phone ? "is-valid" : "") : ""}`}
                                      maxLength={10}
                                      value={formData.work_phone}
                                      onChange={(e) => {
                                        updateFormData({
                                          work_phone: e.target.value.replace(
                                            /\D/g,
                                            "",
                                          ),
                                        });
                                        if (errors.work_phone)
                                          setErrors({
                                            ...errors,
                                            work_phone: "",
                                          });
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.work_phone && (
                                    <div className="text-danger fs-11 mt-1">
                                      {errors.work_phone}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Personal Email{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="email"
                                    className={`form-control ${isSubmitted ? (errors.private_email ? "is-invalid" : formData.private_email ? "is-valid" : "") : ""}`}
                                    maxLength={100}
                                    placeholder="example@gmail.com"
                                    value={formData.private_email}
                                    onChange={(e) => {
                                      updateFormData({
                                        private_email: e.target.value,
                                      });
                                      if (errors.private_email)
                                        setErrors({
                                          ...errors,
                                          private_email: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.private_email && (
                                    <div className="invalid-feedback d-block">
                                      {errors.private_email}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Secondary Mobile
                                  </label>
                                  <div className="input-group">
                                    <span className="input-group-text fs-12 bg-light">
                                      +91
                                    </span>
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="text"
                                      className="form-control"
                                      maxLength={10}
                                      placeholder="Mobile No."
                                      value={formData.mobile_phone}
                                      onChange={(e) =>
                                        updateFormData({
                                          mobile_phone: e.target.value.replace(
                                            /\D/g,
                                            "",
                                          ),
                                        })
                                      }
                                    />
                                  </div>
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Emergency Contact Name{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted ? (errors.emergency_contact_name ? "is-invalid" : formData.emergency_contact_name ? "is-valid" : "") : ""}`}
                                    placeholder="Full Name"
                                    value={formData.emergency_contact_name}
                                    onChange={(e) =>
                                      handleInputChange(
                                        e,
                                        "emergency_contact_name",
                                        { type: "alpha", maxLength: 50 },
                                      )
                                    }
                                  />
                                  {isSubmitted &&
                                    errors.emergency_contact_name && (
                                      <div className="invalid-feedback">
                                        {errors.emergency_contact_name}
                                      </div>
                                    )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Relation{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted ? (errors.emergency_contact_relation ? "is-invalid" : formData.emergency_contact_relation ? "is-valid" : "") : ""}`}
                                    placeholder="e.g. Spouse, Father"
                                    value={formData.emergency_contact_relation}
                                    onChange={(e) =>
                                      handleInputChange(
                                        e,
                                        "emergency_contact_relation",
                                        { type: "alpha", maxLength: 20 },
                                      )
                                    }
                                  />
                                  {isSubmitted &&
                                    errors.emergency_contact_relation && (
                                      <div className="invalid-feedback">
                                        {errors.emergency_contact_relation}
                                      </div>
                                    )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Emergency Mobile{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div className="input-group">
                                    <span className="input-group-text bg-light fs-12">
                                      +91
                                    </span>
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="text"
                                      className={`form-control ${isSubmitted ? (errors.emergency_contact_mobile ? "is-invalid" : formData.emergency_contact_mobile ? "is-valid" : "") : ""}`}
                                      maxLength={10}
                                      placeholder="10-Digit Mobile"
                                      value={formData.emergency_contact_mobile}
                                      onChange={(e) => {
                                        const val = e.target.value.replace(
                                          /\D/g,
                                          "",
                                        );
                                        updateFormData({
                                          emergency_contact_mobile: val,
                                        });
                                        if (errors.emergency_contact_mobile)
                                          setErrors({
                                            ...errors,
                                            emergency_contact_mobile: "",
                                          });
                                      }}
                                    />
                                  </div>
                                  {isSubmitted &&
                                    errors.emergency_contact_mobile && (
                                      <div className="text-danger fs-11 mt-1">
                                        {errors.emergency_contact_mobile}
                                      </div>
                                    )}
                                </div>
                                <div className="col-md-12">
                                  <label className="form-label fs-13">
                                    Contact Address
                                  </label>
                                  <textarea
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    rows={2}
                                    className="form-control"
                                    maxLength={500}
                                    placeholder="Full Residential Address of the contact person"
                                    value={formData.emergency_contact_address}
                                    onChange={(e) =>
                                      updateFormData({
                                        emergency_contact_address:
                                          e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "employment" && (
                            <div className="animate__animated animate__fadeIn ">
                              <input
                                disabled={isViewOnly || isSubmitting}
                                readOnly={isViewOnly}
                                type="text"
                                name="prevent_autofill"
                                style={{ display: "none" }}
                                tabIndex={-1}
                              />
                              <input
                                disabled={isViewOnly || isSubmitting}
                                readOnly={isViewOnly}
                                type="password"
                                name="prevent_autofill_pwd"
                                style={{ display: "none" }}
                                tabIndex={-1}
                              />
                              <div className="row g-4">
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Department{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div className={isSubmitted && errors.department_id ? "border border-danger rounded" : ""}>
                                    <CommonSelect
                                      disabled={isViewOnly}
                                      key={`dept-list-${departments.length}`}
                                      options={departments}
                                      placeholder="Select Department"
                                      value={departments.find(
                                        (o) =>
                                          o.value ===
                                          String(formData.department_id),
                                      )}
                                      onChange={(opt) => {
                                        const deptId = opt?.value || "";
                                        updateFormData({
                                          department_id: deptId,
                                          job_id: "",
                                        });
                                        if (errors.department_id) {
                                          setErrors((prev: any) => ({ ...prev, department_id: "" }));
                                        }
                                        if (deptId)
                                          loadFilteredDesignations(deptId);
                                        else setDesignations([]);
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.department_id && (
                                    <div className="text-danger fs-11 mt-1">
                                      {errors.department_id}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Designation{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div className={isSubmitted && errors.job_id ? "border border-danger rounded" : ""}>
                                    <CommonSelect
                                      disabled={
                                        isViewOnly || !formData.department_id
                                      }
                                      key={`designation-list-${designations.length}-${formData.job_id}`}
                                      options={designations}
                                      placeholder={
                                        formData.department_id
                                          ? "Select Designation"
                                          : "Select Department First"
                                      }
                                      defaultValue={designations.find(
                                        (o) =>
                                          o.value === String(formData.job_id),
                                      )}
                                      onChange={(opt) => {
                                        updateFormData({
                                          job_id: opt?.value || "",
                                        });
                                        if (errors.job_id) {
                                          setErrors((prev: any) => ({ ...prev, job_id: "" }));
                                        }
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.job_id && (
                                    <div className="text-danger fs-11 mt-1">
                                      {errors.job_id}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Login Password{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div className="input-group">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type={showPassword ? "text" : "password"}
                                      autoComplete="new-password"
                                      className={`form-control ${isSubmitted ? (errors.employee_password ? "is-invalid" : formData.employee_password ? "is-valid" : "") : ""}`}
                                      placeholder="System Access Password"
                                      value={formData.employee_password}
                                      onChange={(e) =>
                                        handleInputChange(
                                          e,
                                          "employee_password",
                                          { type: "all", maxLength: 30 },
                                        )
                                      }
                                    />
                                    <button
                                      className="btn btn-outline-secondary border-start-0"
                                      type="button"
                                      onClick={() =>
                                        setShowPassword(!showPassword)
                                      }
                                    >
                                      <i
                                        className={`ti ${showPassword ? "ti-eye" : "ti-eye-off"} fs-16`}
                                      ></i>
                                    </button>
                                  </div>
                                  {isSubmitted && errors.employee_password && (
                                    <div className="invalid-feedback d-block">
                                      {errors.employee_password}
                                    </div>
                                  )}
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Joining Date{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <DatePicker
                                    disabled={isViewOnly}
                                    className={`w-100 form-control ${isSubmitted && errors.joining_date ? "is-invalid" : ""}`}
                                    value={
                                      formData.joining_date
                                        ? dayjs(formData.joining_date)
                                        : null
                                    }
                                    onChange={(_, dateStr) => {
                                      updateFormData({ joining_date: dateStr });
                                      if (errors.joining_date)
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          joining_date: "",
                                        }));
                                    }}
                                  />
                                  {isSubmitted && errors.joining_date && (
                                    <div className="invalid-feedback d-block">
                                      {errors.joining_date}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3 d-flex align-items-center pt-4">
                                  <div className="form-check">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="checkbox"
                                      className="form-check-input"
                                      id="probCheck"
                                      checked={formData.in_probation}
                                      onChange={(e) =>
                                        updateFormData({
                                          in_probation: e.target.checked,
                                        })
                                      }
                                    />
                                    <label
                                      className="form-check-label fs-13 ms-1"
                                      htmlFor="probCheck"
                                    >
                                      In Probation
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Probation (Months)
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="number"
                                    className="form-control"
                                    value={formData.probation_period}
                                    onChange={(e) =>
                                      handleProbationChange(
                                        Number(e.target.value),
                                      )
                                    }
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13 text-muted">
                                    Probation End Date
                                  </label>
                                  <DatePicker
                                    disabled={isViewOnly}
                                    className="w-100 form-control bg-light"
                                    value={
                                      formData.probation_end_date
                                        ? dayjs(formData.probation_end_date)
                                        : null
                                    }
                                    placeholder="Auto-calculated"
                                  />
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Reporting Manager
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    key={`rep-manager-${managers.length}`}
                                    options={managers}
                                    defaultValue={managers.find(
                                      (o) =>
                                        o.value ===
                                        String(formData.reporting_manager_id),
                                    )}
                                    onChange={(opt) =>
                                      updateFormData({
                                        reporting_manager_id: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Head of Department
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    key={`hod-manager-${managers.length}`}
                                    options={managers}
                                    defaultValue={managers.find(
                                      (o) =>
                                        o.value ===
                                        String(formData.head_of_department_id),
                                    )}
                                    onChange={(opt) =>
                                      updateFormData({
                                        head_of_department_id: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Attendance Mode
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly || true}
                                    options={[
                                      { value: "qr", label: "QR CODE" },
                                      {
                                        value: "biometric",
                                        label: "BIOMETRIC",
                                      },
                                      { value: "mobile", label: "MobileAPP" },
                                    ]}
                                    defaultValue={{
                                      value: "mobile",
                                      label: "MobileAPP",
                                    }}
                                    placeholder="Capture Mode"
                                    onChange={(opt) =>
                                      updateFormData({
                                        attendance_capture_mode:
                                          opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Status
                                  </label>
                                  <CommonSelect
                                    disabled={isViewOnly}
                                    options={[
                                      { value: "active", label: "Active" },
                                      { value: "inactive", label: "Inactive" },
                                    ]}
                                    defaultValue={
                                      formData.status
                                        ? {
                                          value: formData.status,
                                          label:
                                            formData.status.toUpperCase(),
                                        }
                                        : undefined
                                    }
                                    onChange={(opt) =>
                                      updateFormData({
                                        status: opt?.value || "",
                                      })
                                    }
                                  />
                                </div>
                                <div className="col-md-3 d-flex align-items-center pt-4">
                                  <div className="form-check">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="checkbox"
                                      className="form-check-input"
                                      id="holdCheck"
                                      checked={formData.hold_status}
                                      onChange={(e) =>
                                        updateFormData({
                                          hold_status: e.target.checked,
                                        })
                                      }
                                    />
                                    <label
                                      className="form-check-label fs-13 ms-1 text-warning fw-bold"
                                      htmlFor="holdCheck"
                                    >
                                      On Hold
                                    </label>
                                  </div>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fs-13">
                                    Hold Remarks
                                  </label>
                                  <textarea
                                    disabled={
                                      isViewOnly ||
                                      isSubmitting ||
                                      !formData.hold_status
                                    }
                                    readOnly={isViewOnly}
                                    rows={1}
                                    className={`form-control ${isSubmitted && formData.hold_status && errors.hold_remarks ? "is-invalid" : ""}`}
                                    placeholder="Reason for hold..."
                                    value={formData.hold_remarks}
                                    maxLength={150}
                                    onChange={(e) => {
                                      updateFormData({
                                        hold_remarks: e.target.value,
                                      });
                                      if (errors.hold_remarks)
                                        setErrors({
                                          ...errors,
                                          hold_remarks: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted &&
                                    formData.hold_status &&
                                    errors.hold_remarks && (
                                      <div className="invalid-feedback d-block">
                                        {errors.hold_remarks}
                                      </div>
                                    )}
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "banking" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="row g-4">
                                <div className="col-md-4">
                                  <label className="form-label fs-13 fw-bold">
                                    Bank Name{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <div
                                    className={
                                      isSubmitted && errors.bank_id
                                        ? "border border-danger rounded"
                                        : ""
                                    }
                                  >
                                    <CommonSelect
                                      disabled={isViewOnly}
                                      key={`bank-master-${bankMasterList.length}-${formData.bank_id}`}
                                      options={bankMasterList}
                                      placeholder="Select Bank"
                                      defaultValue={bankMasterList.find(
                                        (b) =>
                                          String(b.value) ===
                                          String(formData.bank_id),
                                      )}
                                      onChange={(opt) => {
                                        updateFormData({
                                          bank_id: opt?.value || "",
                                          bank_swift_code: opt?.swift || "",
                                        });
                                        if (errors.bank_id)
                                          setErrors({ ...errors, bank_id: "" });
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.bank_id && (
                                    <div className="text-danger fs-11 mt-1">
                                      {errors.bank_id}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-5">
                                  <label className="form-label fs-13 fw-bold">
                                    Account Number{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    maxLength={18}
                                    className={`form-control ${isSubmitted && errors.account_number ? "is-invalid" : isSubmitted && formData.account_number ? "is-valid" : ""}`}
                                    value={formData.account_number}
                                    placeholder="Enter Account Number (Max 18 digits)"
                                    onChange={(e) => {
                                      const val = e.target.value
                                        .replace(/\D/g, "")
                                        .slice(0, 18);
                                      updateFormData({ account_number: val });
                                      if (errors.account_number)
                                        setErrors((prev: any) => ({
                                          ...prev,
                                          account_number: "",
                                        }));
                                    }}
                                  />
                                  {isSubmitted && errors.account_number && (
                                    <div className="invalid-feedback">
                                      {errors.account_number}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13 fw-bold">
                                    IFSC Code{" "}
                                    <span className="text-danger">*</span>
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="text"
                                    className={`form-control ${isSubmitted && errors.bank_iafc_code ? "is-invalid" : ""}`}
                                    value={formData.bank_iafc_code}
                                    placeholder="e.g. SBIN0001234"
                                    maxLength={11}
                                    onChange={(e) => {
                                      updateFormData({
                                        bank_iafc_code:
                                          e.target.value.toUpperCase(),
                                      });
                                      if (errors.bank_iafc_code)
                                        setErrors({
                                          ...errors,
                                          bank_iafc_code: "",
                                        });
                                    }}
                                  />
                                  {isSubmitted && errors.bank_iafc_code && (
                                    <div className="invalid-feedback">
                                      {errors.bank_iafc_code}
                                    </div>
                                  )}
                                </div>
                                <div className="col-12">
                                  <hr className="my-1 opacity-25" />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13 fw-bold text-muted">
                                    SWIFT Code
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly || true}
                                    type="text"
                                    className="form-control bg-light"
                                    value={formData.bank_swift_code}
                                    placeholder="Auto-populated"
                                  />
                                </div>
                                <div className="col-md-2">
                                  <label className="form-label fs-13 fw-bold">
                                    Currency
                                  </label>
                                  <select
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    className="form-select"
                                    value={formData.currency_id}
                                    onChange={(e) =>
                                      updateFormData({
                                        currency_id: e.target.value,
                                      })
                                    }
                                  >
                                    <option value="INR">INR</option>
                                  </select>
                                </div>
                                <div className="col-md-6">
                                  <label className="form-label fs-13">
                                    Passbook Copy Upload
                                  </label>
                                  <div className="d-flex align-items-center gap-3">
                                    <input
                                      disabled={isViewOnly || isSubmitting}
                                      readOnly={isViewOnly}
                                      type="file"
                                      id="passbook_upload_input"
                                      accept=".jpg,.jpeg,.png,.pdf"
                                      className="d-none"
                                      onChange={(e) =>
                                        updateFormData({
                                          upload_passbook:
                                            e.target.files?.[0] || null,
                                        })
                                      }
                                    />
                                    <label
                                      htmlFor="passbook_upload_input"
                                      className={`btn btn-icon mb-0 ${formData.upload_passbook ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
                                      style={{
                                        width: "40px",
                                        height: "40px",
                                        cursor: "pointer",
                                      }}
                                    >
                                      <i
                                        className={`ti ${formData.upload_passbook ? "ti-book" : "ti-upload"} fs-18`}
                                      ></i>
                                    </label>
                                    {/* {formData.upload_passbook && (
                                      <div className="d-flex align-items-center animate__animated animate__fadeIn">
                                        {typeof formData.upload_passbook ===
                                          "string" && (
                                          <a
                                            href={formData.upload_passbook}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="btn btn-icon btn-sm btn-ghost-info"
                                          >
                                            <i className="ti ti-eye fs-18"></i>
                                          </a>
                                        )}
                                        {formData.upload_passbook instanceof
                                          File && (
                                          <i className="ti ti-circle-check-filled text-success fs-20 ms-1"></i>
                                        )}
                                      </div>
                                    )} */}
                                    {formData.upload_passbook && (
                                      <div className="d-flex align-items-center animate__animated animate__fadeIn">
                                        {/* 1. Show EYE ICON if the value is an existing URL string */}
                                        {typeof formData.upload_passbook ===
                                          "string" && (
                                            <a
                                              href={formData.upload_passbook}
                                              target="_blank"
                                              rel="noreferrer"
                                              className="btn btn-icon btn-sm btn-ghost-info ms-1"
                                              title="View Current Passbook"
                                            >
                                              <i className="ti ti-eye fs-18"></i>
                                            </a>
                                          )}

                                        {/* 2. Show CHECKMARK if a new File object has been selected */}
                                        {formData.upload_passbook instanceof
                                          File && (
                                            <i
                                              className="ti ti-circle-check-filled text-success fs-20 ms-1"
                                              title="New file selected"
                                            ></i>
                                          )}
                                      </div>
                                    )}
                                    <div className="text-info fs-11 lh-sm">
                                      <i className="ti ti-info-circle me-1"></i>
                                      Upload <strong>front page</strong> only
                                      (A/C holder details).
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "notice" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="alert alert-soft-danger d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3">
                                <i className="ti ti-alert-triangle-filled fs-24 me-3 text-danger"></i>
                                <div className="fs-13">
                                  <strong>Warning:</strong> Entering separation
                                  details will automatically update the
                                  employee's status to <em>Resigned</em> across
                                  payroll and attendance modules upon reaching
                                  the end date.
                                </div>
                              </div>
                              <div className="row g-4">
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Type Of Separation
                                  </label>
                                  <div
                                    className={
                                      isSubmitted
                                        ? errors.type_of_sepration
                                          ? "border border-danger rounded"
                                          : formData.type_of_sepration
                                            ? "border border-success rounded"
                                            : ""
                                        : ""
                                    }
                                  >
                                    <CommonSelect
                                      disabled={isViewOnly}
                                      options={[
                                        {
                                          value: "voluntary",
                                          label: "Voluntary",
                                        },
                                        {
                                          value: "involuntary",
                                          label: "Involuntary",
                                        },
                                        {
                                          value: "absconding",
                                          label: "Absconding",
                                        },
                                        {
                                          value: "retirement",
                                          label: "Retirement",
                                        },
                                      ]}
                                      placeholder="Select Type"
                                      defaultValue={
                                        formData.type_of_sepration
                                          ? {
                                            value: formData.type_of_sepration,
                                            label:
                                              formData.type_of_sepration
                                                .charAt(0)
                                                .toUpperCase() +
                                              formData.type_of_sepration.slice(
                                                1,
                                              ),
                                          }
                                          : undefined
                                      }
                                      onChange={(opt) => {
                                        updateFormData({
                                          type_of_sepration: opt?.value || "",
                                        });
                                        if (errors.type_of_sepration)
                                          setErrors({
                                            ...errors,
                                            type_of_sepration: "",
                                          });
                                      }}
                                    />
                                  </div>
                                  {isSubmitted && errors.type_of_sepration && (
                                    <div className="text-danger fs-11 mt-1">
                                      {errors.type_of_sepration}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Resignation Date
                                  </label>
                                  <DatePicker
                                    disabled={isViewOnly}
                                    className={`w-100 form-control ${isSubmitted ? (errors.resignation_date ? "is-invalid" : formData.resignation_date ? "is-valid" : "") : ""}`}
                                    value={
                                      formData.resignation_date
                                        ? dayjs(formData.resignation_date)
                                        : null
                                    }
                                    onChange={(_, dateStr) => {
                                      updateFormData({
                                        resignation_date: dateStr,
                                      });
                                      if (errors.resignation_date)
                                        setErrors({
                                          ...errors,
                                          resignation_date: "",
                                        });
                                      calculateNoticeEndDate(
                                        Number(formData.notice_period_days),
                                        dateStr,
                                      );
                                    }}
                                  />
                                  {isSubmitted && errors.resignation_date && (
                                    <div className="invalid-feedback d-block">
                                      {errors.resignation_date}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13">
                                    Notice Period (Days)
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly}
                                    type="number"
                                    className={`form-control ${isSubmitted ? (errors.notice_period_days ? "is-invalid" : formData.notice_period_days > 0 ? "is-valid" : "") : ""}`}
                                    placeholder="e.g. 30"
                                    value={formData.notice_period_days}
                                    onChange={(e) => {
                                      const val = e.target.value;
                                      updateFormData({
                                        notice_period_days: Number(val),
                                      });
                                      if (errors.notice_period_days)
                                        setErrors({
                                          ...errors,
                                          notice_period_days: "",
                                        });
                                      calculateNoticeEndDate(
                                        Number(val),
                                        formData.resignation_date,
                                      );
                                    }}
                                  />
                                  {isSubmitted && errors.notice_period_days && (
                                    <div className="invalid-feedback d-block">
                                      {errors.notice_period_days}
                                    </div>
                                  )}
                                </div>
                                <div className="col-md-3">
                                  <label className="form-label fs-13 text-muted">
                                    Last Working Day
                                  </label>
                                  <DatePicker
                                    disabled={isViewOnly || true}
                                    className="w-100 form-control bg-light border-dashed"
                                    value={
                                      formData.notice_period_end_date
                                        ? dayjs(formData.notice_period_end_date)
                                        : null
                                    }
                                    placeholder="System Calculated"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "device" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="alert alert-soft-info d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3">
                                <i className="ti ti-info-circle-filled fs-24 me-3 text-info"></i>
                                <div className="fs-13">
                                  This information is typically captured
                                  automatically when an employee logs into the
                                  mobile app for the first time.
                                </div>
                              </div>
                              <div className="row g-4">
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Mobile Device Unique ID
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.device_unique_id}
                                    placeholder="e.g. 3d60c7079ea1ea51"
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Mobile Model Name
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.device_name}
                                    placeholder="e.g. Pixel 6 Pro"
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Mobile Device ID
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.device_id}
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Mobile OS Version Type
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.device_platform}
                                    placeholder="Android / iOS"
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13">
                                    Mobile OS Version number
                                  </label>
                                  <input
                                    disabled={
                                      isViewOnly || isSubmitting || true
                                    }
                                    readOnly={isViewOnly}
                                    type="text"
                                    className="form-control"
                                    value={formData.system_version}
                                    placeholder="e.g. 15"
                                  />
                                </div>
                                <div className="col-md-4">
                                  <label className="form-label fs-13 text-muted">
                                    Reg. Code
                                  </label>
                                  <input
                                    disabled={isViewOnly || isSubmitting}
                                    readOnly={isViewOnly || true}
                                    type="text"
                                    className="form-control bg-light border-dashed fw-bold text-primary"
                                    value={formData.random_code_for_reg}
                                    placeholder="No Code Assigned"
                                  />
                                </div>
                              </div>
                            </div>
                          )}

                          {activeTab === "group_access" && (
                            <div className="animate__animated animate__fadeIn">
                              <div className="border rounded-3 shadow-sm bg-white ">
                                <div
                                  className="table-responsive"
                                  style={{
                                    overflow: "visible",
                                  }}
                                >
                                  <table className="table table-borderless align-middle mb-0">
                                    <thead className="bg-light border-bottom">
                                      <tr>
                                        <th
                                          scope="col"
                                          className="ps-4 py-3"
                                          style={{ width: "25%" }}
                                        >
                                          Model
                                        </th>
                                        <th
                                          scope="col"
                                          className="py-3"
                                          style={{ width: "30%" }}
                                        >
                                          Group
                                        </th>
                                        <th
                                          scope="col"
                                          className="py-3"
                                          style={{ width: "30%" }}
                                        >
                                          Approval User
                                        </th>
                                        <th
                                          scope="col"
                                          className="py-3"
                                          style={{ width: "15%" }}
                                        >
                                          Sequence
                                        </th>
                                        <th className="pe-4 text-center">
                                          Action
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {groupAccessLines.map((line, index) => (
                                        <tr
                                          key={index}
                                          className="border-bottom"
                                        >
                                          <td
                                            className="ps-4 py-3"
                                            style={{ overflow: "visible" }}
                                          >
                                            <CommonSelect
                                              disabled={isViewOnly}
                                              options={[
                                                {
                                                  value: "leave",
                                                  label: "Leave",
                                                },
                                                {
                                                  value: "attendance",
                                                  label: "Attendance",
                                                },
                                                {
                                                  value: "expense",
                                                  label: "Expense",
                                                },
                                              ]}
                                              placeholder="Select Model"
                                              defaultValue={[
                                                {
                                                  value: "leave",
                                                  label: "Leave",
                                                },
                                                {
                                                  value: "attendance",
                                                  label: "Attendance",
                                                },
                                                {
                                                  value: "expense",
                                                  label: "Expense",
                                                },
                                              ].find(
                                                (m) => m.value === line.model,
                                              )}
                                              onChange={(opt) =>
                                                handleLineChange(
                                                  index,
                                                  "model",
                                                  opt?.value || "",
                                                )
                                              }
                                            />
                                          </td>
                                          <td
                                            className="py-3"
                                            style={{ overflow: "visible" }}
                                          >
                                            <CommonSelect
                                              disabled={isViewOnly}
                                              key={`group-select-${index}-${groupOptions.length}`}
                                              options={groupOptions}
                                              placeholder="Select Group"
                                              defaultValue={groupOptions.find(
                                                (g) =>
                                                  String(g.value) ===
                                                  String(line.group_id),
                                              )}
                                              onChange={(opt) =>
                                                handleGroupSelect(
                                                  index,
                                                  opt?.value || "",
                                                )
                                              }
                                            />
                                          </td>
                                          <td
                                            className="py-3"
                                            style={{ overflow: "visible" }}
                                          >
                                            <CommonSelect
                                              disabled={isViewOnly}
                                              key={`user-select-${index}-${line.group_id}-${(groupUserOptions[String(line.group_id)] || []).length}`}
                                              options={
                                                groupUserOptions[
                                                String(line.group_id)
                                                ] || []
                                              }
                                              placeholder={
                                                line.group_id
                                                  ? "Select User"
                                                  : "Select Group First"
                                              }
                                              defaultValue={(
                                                groupUserOptions[
                                                String(line.group_id)
                                                ] || []
                                              ).find(
                                                (u) =>
                                                  String(u.value) ===
                                                  String(line.approval_user_id),
                                              )}
                                              onChange={(opt) =>
                                                handleLineChange(
                                                  index,
                                                  "approval_user_id",
                                                  opt?.value,
                                                )
                                              }
                                            />
                                          </td>
                                          <td className="py-3 pe-4">
                                            <input
                                              disabled={
                                                isViewOnly || isSubmitting
                                              }
                                              readOnly={isViewOnly}
                                              type="number"
                                              className="form-control"
                                              placeholder="0"
                                              value={line.approval_sequance}
                                              onChange={(e) =>
                                                handleLineChange(
                                                  index,
                                                  "approval_sequance",
                                                  e.target.value,
                                                )
                                              }
                                            />
                                          </td>
                                          <td className="py-3 pe-4 text-center">
                                            {!isViewOnly && (
                                              <button
                                                type="button"
                                                className="btn btn-icon btn-sm btn-outline-danger rounded-circle"
                                                onClick={() =>
                                                  handleRemoveLine(index)
                                                }
                                                title="Remove Approval Step"
                                              >
                                                <i className="ti ti-trash" />
                                              </button>
                                            )}
                                          </td>
                                        </tr>
                                      ))}
                                      {groupAccessLines.length === 0 && (
                                        <tr>
                                          <td
                                            colSpan={4}
                                            className="text-center py-5 text-muted fst-italic bg-light-subtle"
                                          >
                                            <div className="d-flex flex-column align-items-center">
                                              <i className="ti ti-list-details fs-24 mb-2 opacity-50" />
                                              <span>
                                                No access groups configured yet.
                                              </span>
                                            </div>
                                          </td>
                                        </tr>
                                      )}
                                    </tbody>
                                  </table>
                                </div>
                                <div className="p-3 border-top bg-light d-flex align-items-center">
                                  <button
                                    type="button"
                                    className="btn btn-sm btn-primary d-flex align-items-center shadow-sm px-3 rounded-pill"
                                    disabled={isViewOnly}
                                    onClick={() =>
                                      setGroupAccessLines([
                                        ...groupAccessLines,
                                        {
                                          model: "leave",
                                          group_id: "",
                                          approval_user_id: "",
                                          approval_sequance: 0,
                                        },
                                      ])
                                    }
                                  >
                                    <i className="ti ti-plus me-1" /> Add New
                                    Line
                                  </button>
                                  <small className="text-muted ms-3">
                                    Configure who can approve requests for
                                    specific modules.
                                  </small>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* --- WIZARD FOOTER (Sticky) --- */}
                    <div className="p-3 bg-white border-top shadow-lg d-flex justify-content-between align-items-center sticky-bottom mt-auto">
                      <div>
                        <button
                          type="button"
                          className="btn btn-outline-secondary px-4 fw-medium rounded-pill"
                          onClick={handlePrevStep}
                          disabled={isFirstTab}
                        >
                          <i className="ti ti-arrow-left me-2"></i> Previous
                        </button>
                      </div>

                      <div className="d-flex align-items-center gap-2 d-none d-md-flex">
                        {tabConfig.map((_, idx) => (
                          <div
                            key={idx}
                            className={`rounded-circle transition-all ${idx === currentTabIndex ? "bg-primary" : "bg-secondary opacity-25"}`}
                            style={{
                              width: idx === currentTabIndex ? "12px" : "8px",
                              height: "8px",
                            }}
                          />
                        ))}
                      </div>

                      <div className="d-flex gap-2">
                        {!preventClose && !isViewOnly && (
                          <button
                            type="button"
                            className="btn btn-light px-4 fw-medium rounded-pill"
                            onClick={handleAttemptClose}
                          >
                            Cancel
                          </button>
                        )}
                        {isViewOnly && (
                          <button
                            type="button"
                            className="btn btn-primary px-4 fw-medium rounded-pill"
                            onClick={executeClose}
                          >
                            Close View
                          </button>
                        )}
                        {!isLastTab ? (
                          <button
                            type="button"
                            className="btn btn-primary px-4 fw-medium rounded-pill"
                            onClick={handleNextStep}
                          >
                            Next Step <i className="ti ti-arrow-right ms-2"></i>
                          </button>
                        ) : (
                          !isViewOnly && (
                            <button
                              type="submit"
                              className="btn btn-success px-5 fw-bold shadow-sm rounded-pill"
                              disabled={isSubmitting}
                            >
                              {isSubmitting ? (
                                <>
                                  <span className="spinner-border spinner-border-sm me-2" />{" "}
                                  Processing...
                                </>
                              ) : preventClose ? (
                                <>
                                  <i className="ti ti-check me-2"></i> Complete
                                  Profile
                                </>
                              ) : (
                                <>
                                  <i className="ti ti-device-floppy me-2"></i>{" "}
                                  Save Employee
                                </>
                              )}
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>

      {/* --- CONFIRM CLOSE (SAVE DRAFT) MODAL --- */}
      {showCloseConfirm && (
        <div
          className="modal fade show d-block animate__animated animate__fadeIn"
          style={{
            backgroundColor: "rgba(0,0,0,0.6)",
            zIndex: 1105,
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-sm">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden text-center p-4">
              <div className="mb-3 mt-2">
                <i
                  className="ti ti-alert-triangle text-warning"
                  style={{ fontSize: "48px" }}
                ></i>
              </div>
              <h5 className="fw-bold text-dark mb-2">Unsaved Changes</h5>
              <p className="fs-13 text-muted mb-3">
                Do you want to save this form as a draft to continue later?
              </p>

              <div className="alert alert-soft-danger py-2 mb-4 text-start">
                <small>
                  <i className="ti ti-info-circle me-1"></i> Note: Uploaded
                  images and documents cannot be saved in drafts and will need
                  to be re-selected.
                </small>
              </div>

              <div className="d-flex flex-column gap-2">
                <button
                  type="button"
                  className="btn btn-primary fw-bold rounded-pill w-100"
                  onClick={handleSaveDraft}
                >
                  Save as Draft
                </button>
                <button
                  type="button"
                  className="btn btn-outline-danger fw-bold rounded-pill w-100"
                  onClick={handleDiscardDraft}
                >
                  Discard Changes
                </button>
                <button
                  type="button"
                  className="btn btn-light fw-bold rounded-pill w-100 mt-2"
                  onClick={() => setShowCloseConfirm(false)}
                >
                  Keep Editing
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* EXPERIENCE DOCUMENTS VAULT MODAL */}
      {showExpModal && (
        <div
          className="modal fade show d-block animate__animated animate__fadeIn"
          style={{
            backgroundColor: "rgba(0,0,0,0.5)",
            zIndex: 1100,
            backdropFilter: "blur(4px)",
          }}
        >
          <div className="modal-dialog modal-dialog-centered modal-lg">
            <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
              <div className="modal-header bg-white border-bottom px-4 py-3">
                <h6 className="modal-title fw-bold text-dark d-flex align-items-center">
                  <i className="ti ti-folder-open me-2 text-primary fs-20"></i>{" "}
                  Experience Documents Vault
                </h6>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowExpModal(false)}
                ></button>
              </div>
              <div className="modal-body p-4 bg-light-subtle">
                {!isViewOnly && (
                  <div className="bg-white p-3 rounded-4 border shadow-sm mb-4">
                    <div className="row g-3 align-items-end">
                      <div className="col-md-5">
                        <label className="form-label fs-12 fw-bold text-muted">
                          Category
                        </label>
                        <select
                          disabled={isViewOnly || isSubmitting}
                          className="form-select fs-13"
                          value={tempDoc.category}
                          onChange={(e) =>
                            setTempDoc({ ...tempDoc, category: e.target.value })
                          }
                          style={{ height: "40px", borderRadius: "8px" }}
                        >
                          <option value="">Select Category...</option>
                          {docCategories.map((cat) => (
                            <option key={cat.value} value={cat.value}>
                              {cat.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="col-md-5">
                        <label className="form-label fs-12 fw-bold text-muted">
                          Source File
                        </label>
                        <input
                          disabled={isViewOnly || isSubmitting}
                          readOnly={isViewOnly}
                          type="file"
                          id="vault-file-input-single"
                          className="form-control fs-13"
                          style={{ height: "40px", borderRadius: "8px" }}
                          onChange={(e) =>
                            setTempDoc({
                              ...tempDoc,
                              file: e.target.files?.[0] || null,
                            })
                          }
                        />
                      </div>
                      <div className="col-md-2">
                        <button
                          type="button"
                          className="btn btn-primary w-100 fw-bold fs-13"
                          style={{ height: "40px", borderRadius: "8px" }}
                          disabled={!tempDoc.category || !tempDoc.file}
                          onClick={handleStageDocument}
                        >
                          ADD
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                <p className="fs-11 fw-bold text-uppercase text-muted mb-3 tracking-wider">
                  Staged Documents ({experienceDocs.length})
                </p>
                <div
                  className="row g-3 hide-scrollbar"
                  style={{ maxHeight: "320px", overflowY: "auto" }}
                >
                  {experienceDocs.length > 0 ? (
                    experienceDocs.map((doc, index) => (
                      <div key={index} className="col-md-4">
                        <div className="card h-100 border-0 shadow-sm text-center p-3 position-relative bg-white rounded-4">
                          {!isViewOnly && (
                            <button
                              className="btn btn-ghost-danger btn-icon btn-sm position-absolute"
                              style={{ top: "5px", right: "5px" }}
                              onClick={() => {
                                setExperienceDocs(
                                  experienceDocs.filter((_, i) => i !== index),
                                );
                                setIsDirty(true);
                              }}
                            >
                              <i className="ti ti-trash fs-16"></i>
                            </button>
                          )}
                          <div className="mb-2">
                            <i className="ti ti-folder-filled text-warning fs-40"></i>
                          </div>
                          <h6
                            className="fs-12 fw-bold text-dark mb-1 text-truncate"
                            title={doc.file?.name}
                          >
                            {doc.file?.name}
                          </h6>
                          <div className="d-flex flex-column gap-2 mt-2">
                            <span className="badge bg-light text-primary border border-primary-subtle fs-10 text-capitalize py-1 px-2 rounded-pill mx-auto">
                              {doc.category.replace("_", " ")}
                            </span>
                            <button
                              type="button"
                              className="btn btn-soft-info btn-sm fs-10 fw-bold py-1 mx-auto rounded-pill"
                              onClick={() => handleViewFile(doc)}
                            >
                              <i className="ti ti-eye me-1"></i> VIEW
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="col-12 text-center py-5 border rounded-4 border-dashed bg-white opacity-75">
                      <p className="text-muted fs-12 mb-0">
                        No documents staged for upload.
                      </p>
                    </div>
                  )}
                </div>
              </div>
              <div className="modal-footer border-top bg-white p-3">
                <button
                  type="button"
                  className="btn btn-light btn-sm px-4 fw-bold rounded-pill"
                  onClick={() => setShowExpModal(false)}
                >
                  Close
                </button>
                {!isViewOnly && (
                  <button
                    type="button"
                    className="btn btn-primary btn-sm px-4 fw-bold shadow-sm rounded-pill"
                    onClick={() => setShowExpModal(false)}
                  >
                    Sync Documents
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>,
    document.body,
  );
};

export default AddEditEmployeeModal2;

// =================================================================================================================================================================================

// import React, { useEffect, useRef, useState } from "react";
// import { DatePicker, Radio, Slider, Checkbox } from "antd";
// import dayjs from "dayjs";
// import { createPortal } from "react-dom";
// import CommonSelect from "../../../core/common/commonSelect";
// import { toast } from "react-toastify";
// import {
//   addEmployee,
//   getAttendancePolicies,
//   getBranches,
//   getBusinessLocations,
//   getBusinessTypes,
//   getCountries,
//   getDepartments,
//   getDesignations,
//   getDistricts,
//   getReportingManagers,
//   getShiftRosters,
//   getStates,
//   getTimezones,
//   getWorkingSchedules,
//   getWorkLocations,
//   updateEmployee,
//   getApprovalGroups,
//   getGroupUsers,
// } from "./EmployeeServices";
// import { getBanks } from "@/KHRModules/Master Modules/BanksKHR/BanksServices";

// interface Props {
//   onSuccess: () => void;
//   onClose: () => void;
//   data: any | null;
//   preventClose?: boolean;
// }

// const AddEditEmployeeModal2: React.FC<Props> = ({
//   onSuccess,
//   onClose,
//   data,
//   preventClose = false,
// }) => {
//   const [activeTab, setActiveTab] = useState("legal");
//   const [validated, setValidated] = useState(false);
//   const [isSubmitting, setIsSubmitting] = useState(false);
//   const [imgPreview, setImgPreview] = useState<string | null>(null);

//   const [attendancePolicies, setAttendancePolicies] = useState<
//     { value: string; label: string }[]
//   >([]);
//   const [workingSchedules, setWorkingSchedules] = useState<
//     { value: string; label: string }[]
//   >([]);

//   interface Option {
//     value: string;
//     label: string;
//     swift?: string;
//   }

//   const [timezones, setTimezones] = useState<Option[]>([]);
//   const [shiftRosters, setShiftRosters] = useState<Option[]>([]);
//   const [countries, setCountries] = useState<Option[]>([]);
//   const [isSubmitted, setIsSubmitted] = useState(false);
//   const [errors, setErrors] = useState<any>({});
//   const [states, setStates] = useState<Option[]>([]);
//   const [districts, setDistricts] = useState<Option[]>([]);
//   const [businessTypes, setBusinessTypes] = useState<Option[]>([]);
//   const [businessLocations, setBusinessLocations] = useState<Option[]>([]);
//   const [departments, setDepartments] = useState<Option[]>([]);
//   const [designations, setDesignations] = useState<Option[]>([]);
//   const [workLocations, setWorkLocations] = useState<Option[]>([]);
//   const [managers, setManagers] = useState<Option[]>([]);
//   const [banks, setBanks] = useState<Option[]>([]);
//   const [bankMasterList, setBankMasterList] = useState<any[]>([]);
//   const [branches, setBranches] = useState<Option[]>([]);
//   const [showErrorAlert, setShowErrorAlert] = useState(false);
//   const [groupOptions, setGroupOptions] = useState<Option[]>([]);
//   const [groupUserOptions, setGroupUserOptions] = useState<
//     Record<string, Option[]>
//   >({});
//   const [showPassword, setShowPassword] = useState(false);

//   // WIZARD CONFIGURATION
//   const tabConfig = [
//     { id: "legal", label: "Legal & ID", icon: "ti-id" },
//     { id: "personal", label: "Personal Info", icon: "ti-user-circle" },
//     { id: "address", label: "Address Details", icon: "ti-map-pin" },
//     { id: "emergency", label: "Emergency Contact", icon: "ti-phone-call" },
//     { id: "employment", label: "Employment", icon: "ti-briefcase" },
//     { id: "banking", label: "Banking & Salary", icon: "ti-building-bank" },
//     { id: "notice", label: "Separation / Notice", icon: "ti-door-exit" },
//     { id: "device", label: "Mobile App Access", icon: "ti-device-mobile" },
//     { id: "group_access", label: "Group Approvals", icon: "ti-users-group" },
//   ];

//   const currentTabIndex = tabConfig.findIndex((t) => t.id === activeTab);
//   const isFirstTab = currentTabIndex === 0;
//   const isLastTab = currentTabIndex === tabConfig.length - 1;

//   const [groupAccessLines, setGroupAccessLines] = useState<any[]>([
//     {
//       model: "leave",
//       group_id: "",
//       approval_user_id: "",
//       approval_sequance: 0,
//     },
//   ]);

//   const [showExpModal, setShowExpModal] = useState(false);
//   const [experienceDocs, setExperienceDocs] = useState<any[]>([]);
//   const [tempDoc, setTempDoc] = useState({
//     category: "",
//     file: null as File | null,
//   });

//   const todayStr = dayjs().format("YYYY-MM-DD");

//   const initialFormData = {
//     name: "",
//     father_name: "",
//     name_of_client: "",
//     attendance_policy_id: "",
//     employee_category: "staff",
//     resource_calendar_id: "",
//     shift_roster_id: "",
//     timezone: "Asia/Kolkata",
//     is_geo_tracking: false,
//     image_1920: null,
//     aadhaar_number: "",
//     pan_number: "",
//     voter_id: "",
//     passport_no: "",
//     probation_period: 6,
//     in_probation: true,
//     driving_license: null,
//     is_uan_number_applicable: false,
//     uan_number: "",
//     esi_number: "",
//     category: "general",
//     cd_employee_num: "",
//     gender: "male",
//     marital: "single",
//     spouse_name: "",
//     date_of_marriage: null,
//     birthday: null,
//     blood_group: "",
//     name_of_post_graduation: "",
//     name_of_any_other_education: "",
//     total_experiance: "",
//     country_id: "",
//     religion: "",
//     work_phone: "",
//     mobile_phone: "",
//     private_email: "",
//     upload_passbook: null,
//     present_address: "",
//     permanent_address: "",
//     pin_code: "",
//     district_id: "",
//     state_id: "",
//     joining_date: todayStr,
//     emergency_contact_name: "",
//     emergency_contact_relation: "",
//     emergency_contact_mobile: "",
//     emergency_contact_address: "",
//     bank_id: "",
//     account_number: "",
//     bank_iafc_code: "",
//     bank_swift_code: "",
//     currency_id: "INR",
//     attendance_capture_mode: "mobile",
//     department_id: "",
//     job_id: "",
//     employment_type: "permanent",
//     employee_password: "",
//     status: "active",
//     pin: "",
//     latitude: "",
//     longitude: "",
//     device_id: "",
//     device_unique_id: "",
//     device_name: "",
//     system_version: "",
//     ip_address: "",
//     device_platform: "",
//     type_of_sepration: "",
//     resignation_date: null,
//     notice_period_days: 0,
//     in_notice_period: false,
//     notice_period_end_date: null,
//     hold_status: false,
//     hold_remarks: "",
//     reporting_manager_id: "",
//     head_of_department_id: "",
//     random_code_for_reg: "",
//   };

//   const [formData, setFormData] = useState<any>({ ...initialFormData });

//   const docCategories = [
//     { value: "exp_letter", label: "Experience Letter" },
//     { value: "relieving_letter", label: "Relieving Letter" },
//     { value: "salary_slip", label: "Salary Slip" },
//     { value: "offer_letter", label: "Offer Letter" },
//     { value: "other", label: "Other Docs" },
//   ];

//   // ===================== WIZARD NAVIGATION HELPERS =====================
//   const handleNextStep = () => {
//     if (!isLastTab) {
//       setActiveTab(tabConfig[currentTabIndex + 1].id);
//       document
//         .querySelector(".wizard-content-scroll")
//         ?.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   const handlePrevStep = () => {
//     if (!isFirstTab) {
//       setActiveTab(tabConfig[currentTabIndex - 1].id);
//       document
//         .querySelector(".wizard-content-scroll")
//         ?.scrollTo({ top: 0, behavior: "smooth" });
//     }
//   };

//   // ===================== RESET & CLEANUP =====================
//   const resetForm = () => {
//     const defaultBranch = branches.length > 0 ? branches[0].value : "";
//     setFormData({ ...initialFormData, name_of_client: defaultBranch });
//     setImgPreview(null);
//     setErrors({});
//     setIsSubmitted(false);
//     setValidated(false);
//     setActiveTab("legal");
//     setShowErrorAlert(false);
//     setGroupAccessLines([
//       {
//         group_id: "",
//         approval_user_id: "",
//         approval_sequance: 0,
//         model: "leave",
//       },
//     ]);
//   };

//   const onCloseRef = useRef(onClose);
//   useEffect(() => {
//     onCloseRef.current = onClose;
//   }, [onClose]);

//   useEffect(() => {
//     const modalElement = document.getElementById("add_employee_modal");
//     const handleModalHidden = () => {
//       resetForm();
//       if (onCloseRef.current) onCloseRef.current();
//     };
//     modalElement?.addEventListener("hidden.bs.modal", handleModalHidden);
//     return () => {
//       modalElement?.removeEventListener("hidden.bs.modal", handleModalHidden);
//     };
//   }, []);

//   // ===================== FILE HANDLING =====================
//   const handleStageDocument = () => {
//     if (tempDoc.category && tempDoc.file) {
//       const previewUrl = URL.createObjectURL(tempDoc.file);
//       setExperienceDocs((prev) => [...prev, { ...tempDoc, previewUrl }]);
//       setTempDoc({ category: "", file: null });
//       const fileInput = document.getElementById(
//         "vault-file-input-single",
//       ) as HTMLInputElement;
//       if (fileInput) fileInput.value = "";
//     }
//   };

//   const handleViewFile = (doc: any) => {
//     if (doc.previewUrl) {
//       window.open(doc.previewUrl, "_blank");
//     } else if (doc.file instanceof File) {
//       const url = URL.createObjectURL(doc.file);
//       window.open(url, "_blank");
//     } else {
//       toast.error("Unable to open file preview");
//     }
//   };

//   const fileToBase64 = (file: File): Promise<string> => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(file);
//       reader.onload = () => resolve((reader.result as string).split(",")[1]);
//       reader.onerror = (error) => reject(error);
//     });
//   };

//   // ===================== DATA LOADING & EFFECTS =====================
//   useEffect(() => {
//     const incomingId = data?.id ? String(data.id) : null;
//     const currentId = formData.id ? String(formData.id) : null;

//     if (incomingId !== currentId && data) {
//       const getVal = (field: any) => {
//         if (Array.isArray(field)) return String(field[0]);
//         if (field === false || field === null || field === 0) return "";
//         return String(field);
//       };

//       const cId = getVal(data.country_id) || "104";
//       const sId = getVal(data.state_id);
//       const dId = getVal(data.department_id);
//       loadStates(cId);
//       if (sId) loadDistricts(cId, sId);
//       if (dId) loadFilteredDesignations(dId);

//       const bankDetails = data.bank_account_details || {};
//       const imgUrl = data.image_url || null;
//       const licenseUrl = data.driving_license_url || null;
//       const passbookUrl = data.passbook_url || null;

//       if (data.attachments && Array.isArray(data.attachments)) {
//         setExperienceDocs(
//           data.attachments.map((att: any) => ({
//             category: att.document_type || "",
//             file: {
//               name: att.name || "Untitled Document",
//               type: att.mimetype || "application/pdf",
//             },
//             previewUrl: att.download_url
//               ? `https://odooapi.konverthr.com${att.download_url}`
//               : null,
//             isExisting: true,
//             id: att.id,
//           })),
//         );
//       } else {
//         setExperienceDocs([]);
//       }

//       setFormData({
//         ...initialFormData,
//         ...data,
//         work_phone: data.work_phone ? String(data.work_phone) : "",
//         attendance_policy_id: getVal(data.attendance_policy_id),
//         name_of_client: getVal(data.name_of_site || data.name_of_client),
//         resource_calendar_id: getVal(data.resource_calendar_id),
//         shift_roster_id: getVal(data.shift_roster_id),
//         country_id: cId,
//         state_id: sId,
//         district_id: getVal(data.district_id),
//         department_id: dId,
//         job_id: getVal(data.job_id),
//         bank_id: getVal(bankDetails.bank_id),
//         account_number: bankDetails.account_number || "",
//         bank_iafc_code: bankDetails.bank_iafc_code || "",
//         bank_swift_code: bankDetails.bank_swift_code || "",
//         currency_id: bankDetails.currency_name || "INR",
//         reporting_manager_id: getVal(data.reporting_manager_id),
//         head_of_department_id: getVal(data.head_of_department_id),
//         employment_type: data.employment_type
//           ? data.employment_type.toLowerCase()
//           : "permanent",
//         employee_category: data.employee_category
//           ? data.employee_category.toLowerCase()
//           : "staff",
//         attendance_capture_mode: data.attendance_capture_mode || "mobile",
//         pin_code: data.pin_code === 0 ? "" : data.pin_code,
//         probation_period: data.probation_period || 6,
//         notice_period_days: data.notice_period_days || 0,
//         in_probation:
//           data.in_probation !== undefined ? data.in_probation : true,
//         birthday: data.birthday || null,
//         joining_date: data.joining_date || null,
//         confirmation_date: data.confirmation_date || null,
//         resignation_date: data.resignation_date || null,
//         notice_period_end_date: data.notice_period_end_date || null,
//         probation_end_date: data.probation_end_date || null,
//         group_company_joining_date: data.group_company_joining_date || null,
//         date_of_marriage: data.date_of_marriage || null,
//         image_1920: imgUrl,
//         driving_license: licenseUrl,
//         upload_passbook: passbookUrl,
//         latitude: data.latitude || "",
//         longitude: data.longitude || "",
//         random_code_for_reg: data.random_code_for_reg || "",
//         device_id: data.device_id || "",
//         device_unique_id: data.device_unique_id || "",
//         device_name: data.device_name || "",
//         system_version: data.system_version || "",
//         ip_address: data.ip_address || "",
//         device_platform: data.device_platform || "",
//       });

//       setActiveTab("legal");
//       let loadedGroupAccess: any[] = [];
//       if (
//         data.approvals &&
//         Array.isArray(data.approvals) &&
//         data.approvals.length > 0
//       ) {
//         loadedGroupAccess = data.approvals.map((item: any) => ({
//           model: item.model || "leave",
//           group_id: getVal(item.group_id),
//           approval_user_id: getVal(item.approval_user_id),
//           approval_sequance: item.approval_sequance || 0,
//         }));
//       } else if (data.group_access && Array.isArray(data.group_access)) {
//         loadedGroupAccess = data.group_access.map((item: any) => ({
//           ...item,
//           model: item.model || "leave",
//           group_id: getVal(item.group_id),
//           approval_user_id: getVal(item.approval_user_id),
//         }));
//       } else {
//         const cleanGroupId = getVal(data.group_id);
//         if (cleanGroupId) {
//           loadedGroupAccess = [
//             {
//               model: "leave",
//               group_id: cleanGroupId,
//               approval_user_id: getVal(data.approval_user_id),
//               approval_sequance: data.approval_sequance || 0,
//             },
//           ];
//         }
//       }

//       if (loadedGroupAccess.length > 0) {
//         const loadInitialUsers = async () => {
//           const newOptions: Record<string, any[]> = { ...groupUserOptions };
//           for (const line of loadedGroupAccess) {
//             const gId = String(line.group_id);
//             if (gId && gId !== "0" && !newOptions[gId]) {
//               try {
//                 const response = await getGroupUsers(gId);
//                 let userList: any[] = [];
//                 if (response?.data?.users) userList = response.data.users;
//                 else if (response?.users) userList = response.users;
//                 else if (Array.isArray(response)) userList = response;
//                 newOptions[gId] = userList.map((u: any) => ({
//                   value: String(u.user_id || u.id),
//                   label: u.name || u.login,
//                 }));
//               } catch (e) {
//                 console.error("Error loading group users:", e);
//               }
//             }
//           }
//           setGroupUserOptions(newOptions);
//           setGroupAccessLines(loadedGroupAccess);
//         };
//         loadInitialUsers();
//       } else {
//         setGroupAccessLines([
//           {
//             model: "leave",
//             group_id: "",
//             approval_user_id: "",
//             approval_sequance: 0,
//           },
//         ]);
//       }

//       if (imgUrl) {
//         setImgPreview(imgUrl);
//       } else if (data.image_1920 && typeof data.image_1920 === "string") {
//         const prefix = data.image_1920.startsWith("data:")
//           ? ""
//           : "data:image/png;base64,";
//         setImgPreview(`${prefix}${data.image_1920}`);
//       } else {
//         setImgPreview(null);
//       }
//     }
//   }, [data]);

//   useEffect(() => {
//     if (formData.joining_date && formData.probation_period > 0) {
//       const calculatedDate = dayjs(formData.joining_date)
//         .add(Number(formData.probation_period), "month")
//         .format("YYYY-MM-DD");
//       if (formData.probation_end_date !== calculatedDate) {
//         setFormData((prev: any) => ({
//           ...prev,
//           probation_end_date: calculatedDate,
//           in_probation: true,
//         }));
//       }
//     } else if (
//       Number(formData.probation_period) === 0 &&
//       formData.in_probation
//     ) {
//       setFormData((prev: any) => ({ ...prev, in_probation: false }));
//     }
//   }, [formData.joining_date, formData.probation_period]);

//   useEffect(() => {
//     const loadMasterBanks = async () => {
//       try {
//         const bankResponse: any = await getBanks();
//         const rawBanks =
//           bankResponse?.banks ||
//           bankResponse?.data ||
//           (Array.isArray(bankResponse) ? bankResponse : []);
//         setBankMasterList(
//           rawBanks.map((b: any) => ({
//             value: String(b.id),
//             label: b.name,
//             swift: b.swift_code || "",
//           })),
//         );
//       } catch (error) {
//         console.error("Error loading banks:", error);
//       }
//     };
//     loadMasterBanks();
//   }, []);

//   const calculateNoticeEndDate = (days: number, resDate: any) => {
//     if (resDate && days > 0) {
//       const endDate = dayjs(resDate).add(days, "day").format("YYYY-MM-DD");
//       setFormData((prev: any) => ({
//         ...prev,
//         notice_period_end_date: endDate,
//         in_notice_period: true,
//       }));
//     } else {
//       setFormData((prev: any) => ({
//         ...prev,
//         notice_period_end_date: null,
//         in_notice_period: false,
//       }));
//     }
//   };

//   const handleInputChange = (
//     e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
//     fieldName: string,
//     config: {
//       type: "numeric" | "alpha" | "alphanumeric" | "pan" | "all";
//       maxLength?: number;
//     },
//   ) => {
//     let val = e.target.value;
//     if (config.type === "numeric") val = val.replace(/\D/g, "");
//     if (config.type === "alpha") val = val.replace(/[^a-zA-Z\s]/g, "");
//     if (config.type === "alphanumeric") val = val.replace(/[^a-zA-Z0-9]/g, "");
//     if (config.type === "pan")
//       val = val.toUpperCase().replace(/[^A-Z0-9]/g, "");
//     if (config.maxLength) val = val.slice(0, config.maxLength);
//     if (formData[fieldName] === val) return;
//     setFormData((prev: any) => ({ ...prev, [fieldName]: val }));
//     if (errors[fieldName])
//       setErrors((prev: any) => ({ ...prev, [fieldName]: "" }));
//   };

//   // ===================== VALIDATIONS =====================
//   const validateHeader = () => {
//     let tempErrors: any = {};
//     if (!formData.name?.trim()) tempErrors.name = "Employee Name is required.";
//     if (!formData.father_name?.trim())
//       tempErrors.father_name = "Father's Name is required.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateLegalTab = () => {
//     let tempErrors: any = {};
//     if (!formData.aadhaar_number || formData.aadhaar_number.length !== 12)
//       tempErrors.aadhaar_number = "12-digit Aadhaar number is required.";
//     if (
//       formData.passport_no &&
//       (formData.passport_no.length !== 8 ||
//         !/^[A-Z][0-9]{7}$/.test(formData.passport_no))
//     )
//       tempErrors.passport_no = "Invalid Passport format.";
//     if (
//       formData.voter_id &&
//       (formData.voter_id.length !== 10 ||
//         !/^[A-Z]{3}[0-9]{7}$/.test(formData.voter_id))
//     )
//       tempErrors.voter_id = "Invalid Voter ID format.";
//     if (
//       formData.pan_number &&
//       (formData.pan_number.length !== 10 ||
//         !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(formData.pan_number))
//     )
//       tempErrors.pan_number = "Invalid PAN format.";
//     if (
//       formData.is_uan_number_applicable &&
//       (!formData.uan_number || formData.uan_number.length !== 12)
//     )
//       tempErrors.uan_number = "12-digit UAN required.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validatePersonalTab = () => {
//     let tempErrors: any = {};
//     if (!formData.gender) tempErrors.gender = "Please select a gender.";
//     if (!formData.birthday) tempErrors.birthday = "Date of birth is required.";
//     if (!formData.blood_group)
//       tempErrors.blood_group = "Blood group is required.";
//     if (!formData.work_phone || !/^[0-9]{10}$/.test(formData.work_phone))
//       tempErrors.work_phone = "Valid 10-digit mobile required.";
//     if (
//       !formData.private_email ||
//       !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.private_email)
//     )
//       tempErrors.private_email = "Valid email is required.";
//     if (formData.marital === "married") {
//       if (!formData.spouse_name?.trim())
//         tempErrors.spouse_name = "Spouse name is required.";
//       if (!formData.date_of_marriage)
//         tempErrors.date_of_marriage = "Marriage date is required.";
//     }
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateAddressTab = () => {
//     let tempErrors: any = {};
//     if (!formData.present_address?.trim())
//       tempErrors.present_address = "Present Address is required.";
//     if (!formData.permanent_address?.trim())
//       tempErrors.permanent_address = "Permanent Address is required.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateEmergencyTab = () => {
//     let tempErrors: any = {};
//     if (!formData.emergency_contact_name?.trim())
//       tempErrors.emergency_contact_name = "Emergency Contact Name required.";
//     if (!formData.emergency_contact_relation?.trim())
//       tempErrors.emergency_contact_relation = "Relation required.";
//     if (
//       !formData.emergency_contact_mobile ||
//       !/^[0-9]{10}$/.test(formData.emergency_contact_mobile)
//     )
//       tempErrors.emergency_contact_mobile = "10-digit mobile required.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateEmploymentTab = () => {
//     let tempErrors: any = {};
//     if (!formData.department_id)
//       tempErrors.department_id = "Department is required.";
//     if (!formData.job_id) tempErrors.job_id = "Designation is required.";
//     if (formData.hold_status && !formData.hold_remarks?.trim())
//       tempErrors.hold_remarks = "Reason required.";
//     if (!formData.employee_password?.trim())
//       tempErrors.employee_password = "Login Password required.";
//     if (!formData.joining_date)
//       tempErrors.joining_date = "Joining Date required.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateBankingTab = () => {
//     let tempErrors: any = {};
//     if (!formData.bank_id) tempErrors.bank_id = "Bank selection is required.";
//     if (!formData.account_number?.toString().trim())
//       tempErrors.account_number = "Account number is required.";
//     else if (!/^\d+$/.test(formData.account_number))
//       tempErrors.account_number = "Only digits allowed.";
//     else if (
//       formData.account_number.length < 9 ||
//       formData.account_number.length > 18
//     )
//       tempErrors.account_number = "Length should be 9-18 digits.";
//     if (!formData.bank_iafc_code?.trim())
//       tempErrors.bank_iafc_code = "IFSC Code required.";
//     else if (
//       formData.bank_iafc_code.length !== 11 ||
//       !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(formData.bank_iafc_code)
//     )
//       tempErrors.bank_iafc_code = "Invalid IFSC format.";
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const validateDeviceTab = () => true;

//   const validateNoticeTab = () => {
//     let tempErrors: any = {};
//     if (formData.type_of_sepration || formData.resignation_date) {
//       if (!formData.type_of_sepration)
//         tempErrors.type_of_sepration = "Separation type required.";
//       if (!formData.resignation_date)
//         tempErrors.resignation_date = "Resignation date required.";
//       if (!formData.notice_period_days || formData.notice_period_days <= 0)
//         tempErrors.notice_period_days = "Valid notice days required.";
//     }
//     setErrors((prev: any) => ({ ...prev, ...tempErrors }));
//     return Object.keys(tempErrors).length === 0;
//   };

//   const tabFieldsMap: { [key: string]: string[] } = {
//     legal: ["aadhaar_number", "uan_number"],
//     personal: [
//       "gender",
//       "birthday",
//       "blood_group",
//       "work_phone",
//       "private_email",
//       "spouse_name",
//       "date_of_marriage",
//     ],
//     address: ["present_address", "permanent_address"],
//     emergency: [
//       "emergency_contact_name",
//       "emergency_contact_relation",
//       "emergency_contact_mobile",
//     ],
//     employment: [
//       "department_id",
//       "job_id",
//       "employee_password",
//       "hold_remarks",
//       "joining_date",
//     ],
//     banking: ["bank_id", "account_number", "bank_iafc_code"],
//     notice: ["type_of_sepration", "resignation_date", "notice_period_days"],
//   };

//   const hasTabErrors = (tabName: string) => {
//     if (!isSubmitted) return false;
//     const currentTabFields = tabFieldsMap[tabName] || [];
//     return currentTabFields.some((field) => errors[field]);
//   };

//   // ===================== OTHER HANDLERS =====================
//   const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const file = e.target.files?.[0];
//     if (file) {
//       setFormData((prev: any) => ({ ...prev, image_1920: file }));
//       const reader = new FileReader();
//       reader.onloadend = () => setImgPreview(reader.result as string);
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleProbationChange = (months: number) => {
//     const joiningDate = formData.joining_date;
//     if (joiningDate && months > 0) {
//       const endDate = dayjs(joiningDate)
//         .add(months, "month")
//         .format("YYYY-MM-DD");
//       setFormData({
//         ...formData,
//         probation_period: months,
//         probation_end_date: endDate,
//       });
//     } else {
//       setFormData({ ...formData, probation_period: months });
//     }
//   };

//   const loadStates = async (countryId: string) => {
//     const data = await getStates(countryId);
//     setStates(
//       data.map((s: any) => ({ value: s.id.toString(), label: s.name })),
//     );
//   };

//   const loadDistricts = async (countryId: string, stateId: string) => {
//     const data = await getDistricts(countryId, stateId);
//     setDistricts(
//       data.map((d: any) => ({ value: d.id.toString(), label: d.name })),
//     );
//   };

//   const loadFilteredDesignations = async (deptId: string) => {
//     try {
//       const jobs = await getDesignations(deptId);
//       setDesignations(
//         jobs.map((i: any) => ({
//           value: String(i.job_id || i.id),
//           label: i.name,
//         })),
//       );
//     } catch (error) {
//       console.error("Error loading designations:", error);
//     }
//   };

//   const handleGroupSelect = async (index: number, groupId: string) => {
//     const list = [...groupAccessLines];
//     list[index].group_id = groupId;
//     list[index].approval_user_id = "";
//     setGroupAccessLines(list);

//     if (groupId && !groupUserOptions[groupId]) {
//       try {
//         const response = await getGroupUsers(groupId);
//         let userList: any[] = [];
//         if (response?.data?.users) userList = response.data.users;
//         else if (response?.data?.data?.users)
//           userList = response.data.data.users;
//         else if (response?.users) userList = response.users;
//         else if (Array.isArray(response)) userList = response;

//         setGroupUserOptions((prev) => ({
//           ...prev,
//           [groupId]: userList.map((u: any) => ({
//             value: String(u.user_id),
//             label: u.name || u.login,
//           })),
//         }));
//       } catch (error) {
//         console.error("Failed to load group users", error);
//       }
//     }
//   };

//   const handleLineChange = (index: number, field: string, value: any) => {
//     const list = [...groupAccessLines];
//     list[index][field] = value;
//     setGroupAccessLines(list);
//   };

//   // API Data Loading Effects
//   useEffect(() => {
//     loadStates("104");
//   }, []);

//   useEffect(() => {
//     const fetchBranchData = async () => {
//       try {
//         const response = await getBranches();
//         const branchList = Array.isArray(response) ? response : [];
//         const formattedBranches = branchList.map((b: any) => ({
//           value: String(b.id),
//           label: `${b.RegisteredCompnany} | ${b.address}`,
//         }));
//         setBranches(formattedBranches);
//         if (!data && formattedBranches.length > 0 && !formData.name_of_client) {
//           setFormData((prev: any) => ({
//             ...prev,
//             name_of_client: formattedBranches[0].value,
//           }));
//         }
//       } catch (error) {
//         console.error("Error fetching branches:", error);
//       }
//     };
//     fetchBranchData();
//   }, []);

//   useEffect(() => {
//     const fetchDropdownData = async () => {
//       const [policies, schedules] = await Promise.all([
//         getAttendancePolicies(),
//         getWorkingSchedules(),
//       ]);
//       setAttendancePolicies(
//         policies.map((p: any) => ({ value: p.id, label: p.name })),
//       );
//       setWorkingSchedules(
//         schedules.map((s: any) => ({ value: s.id, label: s.name })),
//       );
//     };
//     fetchDropdownData();
//   }, []);

//   useEffect(() => {
//     const fetchGroupsData = async () => {
//       try {
//         const response = await getApprovalGroups();
//         let groupsList: any[] = [];
//         if (Array.isArray(response)) groupsList = response;
//         else if (response && Array.isArray(response.data))
//           groupsList = response.data;
//         else if (response?.data?.data && Array.isArray(response.data.data))
//           groupsList = response.data.data;

//         setGroupOptions(
//           groupsList.map((g: any) => ({
//             value: String(g.group_id || g.id || g._id || ""),
//             label: g.group_name || g.name || g.groupName || "Unknown Group",
//           })),
//         );
//       } catch (err) {
//         console.error("Error setting group options", err);
//       }
//     };
//     fetchGroupsData();
//   }, []);

//   useEffect(() => {
//     const fetchCountries = async () => {
//       const data = await getCountries();
//       setCountries(
//         data.map((c: any) => ({ value: c.id.toString(), label: c.name })),
//       );
//     };
//     fetchCountries();
//   }, []);

//   useEffect(() => {
//     const fetchEmploymentData = async () => {
//       try {
//         const [bTypes, bLocs, deptsRes, wLocs, empList] = await Promise.all([
//           getBusinessTypes().catch(() => []),
//           getBusinessLocations().catch(() => []),
//           getDepartments(),
//           getWorkLocations().catch(() => []),
//           getReportingManagers(),
//         ]);
//         setDepartments(
//           (deptsRes?.data || deptsRes || []).map((i: any) => ({
//             value: String(i.id),
//             label: i.name,
//           })),
//         );
//         setManagers(
//           (empList?.data || empList || []).map((i: any) => ({
//             value: String(i.id),
//             label: i.name,
//           })),
//         );
//         setBusinessTypes(
//           (bTypes?.data || bTypes || []).map((i: any) => ({
//             value: String(i.id),
//             label: i.name,
//           })),
//         );
//         setBusinessLocations(
//           (bLocs?.data || bLocs || []).map((i: any) => ({
//             value: String(i.id),
//             label: i.name,
//           })),
//         );
//         setWorkLocations(
//           (wLocs?.data || wLocs || []).map((i: any) => ({
//             value: String(i.id),
//             label: i.name,
//           })),
//         );
//       } catch (error) {
//         console.error("Promise.all failed", error);
//       }
//     };
//     fetchEmploymentData();
//   }, [data]);

//   useEffect(() => {
//     const loadTimezones = async () => {
//       setTimezones(await getTimezones());
//     };
//     const loadRosters = async () => {
//       const res = await getShiftRosters();
//       setShiftRosters(
//         res.map((item: any) => ({
//           value: item.id.toString(),
//           label: item.name,
//         })),
//       );
//     };
//     loadTimezones();
//     loadRosters();
//   }, []);

//   // ===================== FINAL SUBMISSION =====================
//   const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     setIsSubmitted(true);

//     const validations = {
//       header: validateHeader(),
//       legal: validateLegalTab(),
//       personal: validatePersonalTab(),
//       address: validateAddressTab(),
//       employment: validateEmploymentTab(),
//       emergency: validateEmergencyTab(),
//       banking: validateBankingTab(),
//       notice: validateNoticeTab(),
//       device: validateDeviceTab(),
//     };

//     const isFormValid = Object.values(validations).every(
//       (isValid) => isValid === true,
//     );

//     if (!isFormValid) {
//       const firstErrorTab = tabConfig.find((tab) => hasTabErrors(tab.id));
//       if (firstErrorTab) {
//         setActiveTab(firstErrorTab.id);
//         document
//           .querySelector(".wizard-content-scroll")
//           ?.scrollTo({ top: 0, behavior: "smooth" });
//       }
//       toast.error(
//         "Required fields are missing or invalid. Please check the highlighted tabs.",
//       );
//       setShowErrorAlert(true);
//       return;
//     }

//     setIsSubmitting(true);
//     setShowErrorAlert(false);

//     try {
//       const processToPayload = async (fieldValue: any) => {
//         if (!fieldValue) return null;
//         if (fieldValue instanceof File) return await fileToBase64(fieldValue);
//         if (typeof fieldValue === "string" && fieldValue.startsWith("http")) {
//           try {
//             const response = await fetch(fieldValue);
//             const blob = await response.blob();
//             return new Promise((resolve, reject) => {
//               const reader = new FileReader();
//               reader.onloadend = () =>
//                 resolve((reader.result as string).split(",")[1]);
//               reader.onerror = reject;
//               reader.readAsDataURL(blob);
//             });
//           } catch (error) {
//             return null;
//           }
//         }
//         return fieldValue.includes("base64,")
//           ? fieldValue.split("base64,")[1]
//           : fieldValue;
//       };

//       const [licenseBase64, passbookBase64, imageBase64] = await Promise.all([
//         processToPayload(formData.driving_license),
//         processToPayload(formData.upload_passbook),
//         processToPayload(formData.image_1920),
//       ]);

//       const processedAttachments = await Promise.all(
//         experienceDocs.map(async (doc) => {
//           if (doc.file instanceof File) {
//             return {
//               name: doc.file.name,
//               file_data: await fileToBase64(doc.file),
//               mimetype: doc.file.type,
//               document_type: doc.category,
//             };
//           }
//           return {
//             name: doc.file?.name || "existing_file",
//             file_data: doc.file_data || null,
//             mimetype: doc.mimetype || "application/pdf",
//             document_type: doc.category,
//           };
//         }),
//       );

//       const finalPayload = {
//         name: formData.name,
//         father_name: formData.father_name,
//         gender: formData.gender,
//         birthday: formData.birthday
//           ? dayjs(formData.birthday).format("YYYY-MM-DD")
//           : null,
//         blood_group: formData.blood_group,
//         work_phone: formData.work_phone ? Number(formData.work_phone) : 0,
//         private_email: formData.private_email,
//         present_address: formData.present_address,
//         permanent_address: formData.permanent_address,
//         emergency_contact_name: formData.emergency_contact_name,
//         emergency_contact_relation: formData.emergency_contact_relation,
//         emergency_contact_mobile: formData.emergency_contact_mobile,
//         emergency_contact_address: formData.emergency_contact_address,
//         mobile_phone: formData.mobile_phone,
//         pin_code: formData.pin_code,
//         attendance_policy_id: Number(formData.attendance_policy_id),
//         employee_category: formData.employee_category?.toLowerCase(),
//         shift_roster_id: Number(formData.shift_roster_id),
//         resource_calendar_id: Number(formData.resource_calendar_id),
//         timezone: formData.timezone,
//         district_id: Number(formData.district_id),
//         state_id: Number(formData.state_id),
//         job_id: Number(formData.job_id),
//         department_id: Number(formData.department_id),
//         country_id: Number(formData.country_id),
//         is_geo_tracking: formData.is_geo_tracking,
//         aadhaar_number: formData.aadhaar_number,
//         pan_number: formData.pan_number,
//         voter_id: formData.voter_id,
//         passport_id: formData.passport_no,
//         esi_number: formData.esi_number,
//         category: formData.category,
//         is_uan_number_applicable: formData.is_uan_number_applicable,
//         uan_number: formData.uan_number,
//         cd_employee_num: formData.cd_employee_num,
//         name_of_post_graduation: formData.name_of_post_graduation,
//         name_of_any_other_education: formData.name_of_any_other_education,
//         total_experiance: formData.total_experiance,
//         religion: formData.religion,
//         date_of_marriage: formData.date_of_marriage
//           ? dayjs(formData.date_of_marriage).format("YYYY-MM-DD")
//           : null,
//         probation_period: Number(formData.probation_period),
//         confirmation_date: formData.confirmation_date
//           ? dayjs(formData.confirmation_date).format("YYYY-MM-DD")
//           : null,
//         hold_remarks: formData.hold_remarks,
//         is_lapse_allocation: formData.is_lapse_allocation || false,
//         group_company_joining_date: formData.group_company_joining_date
//           ? dayjs(formData.group_company_joining_date).format("YYYY-MM-DD")
//           : null,
//         week_off: formData.week_off,
//         grade_band: formData.grade_band,
//         status: formData.status,
//         employee_password: formData.employee_password,
//         hold_status: formData.hold_status,
//         bank_id: Number(formData.bank_id),
//         account_number: formData.account_number,
//         bank_iafc_code: formData.bank_iafc_code,
//         bank_swift_code: formData.bank_swift_code,
//         currency_id: formData.currency_id,
//         reporting_manager_id: formData.reporting_manager_id
//           ? Number(formData.reporting_manager_id)
//           : null,
//         head_of_department_id: formData.head_of_department_id
//           ? Number(formData.head_of_department_id)
//           : null,
//         attendance_capture_mode:
//           formData.attendance_capture_mode?.toLowerCase(),
//         pin: formData.pin,
//         type_of_sepration: formData.type_of_sepration,
//         resignation_date: formData.resignation_date
//           ? dayjs(formData.resignation_date).format("YYYY-MM-DD")
//           : null,
//         notice_period_days: Number(formData.notice_period_days),
//         joining_date: formData.joining_date
//           ? dayjs(formData.joining_date).format("YYYY-MM-DD")
//           : null,
//         employment_type: formData.employment_type?.toLowerCase(),
//         driving_license: licenseBase64,
//         upload_passbook: passbookBase64,
//         image_1920: imageBase64,
//         attachments: processedAttachments,
//         name_of_site: Number(formData.name_of_client),
//         Spouse_name: formData.spouse_name,
//         device_id: formData.device_id,
//         device_name: formData.device_name,
//         device_platform: formData.device_platform,
//         device_unique_id: formData.device_unique_id,
//         ip_address: formData.ip_address,
//         random_code_for_reg: formData.random_code_for_reg,
//         system_version: formData.system_version,
//         approvals: groupAccessLines.map((line) => ({
//           group_id: Number(line.group_id || 0),
//           approval_user_id: Number(line.approval_user_id || 0),
//           approval_sequance: Number(line.approval_sequance || 0),
//           model: line.model || "leave",
//         })),
//       };

//       if (data?.id) await updateEmployee(data.id, finalPayload);
//       else await addEmployee(finalPayload);

//       toast.success(
//         data?.id
//           ? "Employee updated successfully"
//           : "Employee created successfully",
//       );
//       onSuccess();
//       document.getElementById("close-emp-modal")?.click();
//     } catch (err: any) {
//       if (err.response)
//         toast.error(err.response.data?.message || "Server Error");
//       else if (err.request) toast.error("Server not responding / CORS issue");
//       else toast.error(err.message);
//     } finally {
//       setIsSubmitting(false);
//     }
//   };

//   return createPortal(
//     <>
//       <div
//         className="modal fade"
//         id="add_employee_modal"
//         role="dialog"
//         data-bs-backdrop={preventClose ? "static" : "true"}
//         data-bs-keyboard={preventClose ? "false" : "true"}
//       >
//         <div className="modal-dialog modal-dialog-centered modal-xl modal-dialog-scrollable">
//           <div className="modal-content bg-light border-0 shadow-lg overflow-hidden h-100">
//             {/* --- MODAL HEADER --- */}
//             <div className="modal-header bg-white border-bottom py-3 px-4 shadow-sm z-3">
//               <h5 className="modal-title fw-bold fs-16 d-flex align-items-center">
//                 <div
//                   className="bg-primary-subtle text-primary rounded-circle d-flex align-items-center justify-content-center me-3"
//                   style={{ width: "40px", height: "40px" }}
//                 >
//                   <i className="ti ti-user-plus fs-20"></i>
//                 </div>
//                 <div>
//                   {preventClose
//                     ? "Complete Admin Profile"
//                     : data
//                       ? "Edit Employee Profile"
//                       : "Onboard New Employee"}
//                   <div className="fs-12 text-muted fw-normal mt-1">
//                     Fill in the necessary details across the sections below
//                   </div>
//                 </div>
//               </h5>
//               <div className="d-flex align-items-center gap-2">
//                 {formData.employee_category?.toLowerCase() === "staff" && (
//                   <button
//                     type="button"
//                     className="btn btn-soft-primary d-flex align-items-center px-3 py-2"
//                     onClick={() => setShowExpModal(true)}
//                   >
//                     <i className="ti ti-paperclip me-2 fs-16"></i>
//                     <span className="fs-13 fw-bold">
//                       {experienceDocs.length > 0
//                         ? `${experienceDocs.length} Docs Attached`
//                         : "Vault Attachments"}
//                     </span>
//                   </button>
//                 )}
//                 {!preventClose && (
//                   <button
//                     type="button"
//                     id="close-emp-modal"
//                     className="btn-close ms-2"
//                     data-bs-dismiss="modal"
//                     onClick={resetForm}
//                   ></button>
//                 )}
//               </div>
//             </div>

//             <div className="modal-body p-0 d-flex flex-column h-100">
//               <form
//                 className={`needs-validation h-100 d-flex flex-column ${validated ? "was-validated" : ""}`}
//                 noValidate
//                 onSubmit={handleSubmit}
//               >
//                 <div
//                   className="d-flex flex-row flex-grow-1"
//                   style={{ minHeight: "65vh" }}
//                 >
//                   {/* --- LEFT SIDEBAR (STEPPER NAVIGATION) --- */}
//                   <div
//                     className="bg-white border-end d-flex flex-column"
//                     style={{ width: "280px", zIndex: 2 }}
//                   >
//                     <div className="p-3 border-bottom bg-light-subtle">
//                       <span className="text-muted fs-11 fw-bold text-uppercase tracking-wider">
//                         Form Sections
//                       </span>
//                     </div>
//                     <div className="flex-grow-1 overflow-auto hide-scrollbar p-3">
//                       {tabConfig.map((tab, idx) => {
//                         const isError = hasTabErrors(tab.id);
//                         const isActive = activeTab === tab.id;
//                         return (
//                           <button
//                             key={tab.id}
//                             type="button"
//                             onClick={() => setActiveTab(tab.id)}
//                             className={`btn w-100 text-start border-0 mb-2 px-3 py-2 rounded-3 transition-all d-flex align-items-center justify-content-between ${
//                               isActive
//                                 ? "bg-primary text-white shadow-sm"
//                                 : isError
//                                   ? "bg-danger-subtle text-danger"
//                                   : "bg-light text-dark hover-bg-light-subtle"
//                             }`}
//                           >
//                             <div className="d-flex align-items-center">
//                               <div
//                                 className={`d-flex align-items-center justify-content-center rounded-circle me-2 ${isActive ? "bg-white text-primary" : isError ? "bg-danger text-white" : "bg-white text-muted border"}`}
//                                 style={{
//                                   width: "28px",
//                                   height: "28px",
//                                   fontSize: "12px",
//                                   fontWeight: "bold",
//                                 }}
//                               >
//                                 {idx + 1}
//                               </div>
//                               <span className="fs-13 fw-medium">
//                                 {tab.label}
//                               </span>
//                             </div>
//                             {isError && (
//                               <i className="ti ti-alert-circle-filled fs-16 animate__animated animate__pulse animate__infinite"></i>
//                             )}
//                           </button>
//                         );
//                       })}
//                     </div>
//                   </div>

//                   {/* --- RIGHT CONTENT AREA --- */}
//                   <div className="flex-grow-1 d-flex flex-column position-relative bg-light-subtle wizard-content-scroll overflow-auto hide-scrollbar">
//                     <div className="p-4 flex-grow-1">
//                       {preventClose && (
//                         <div className="alert alert-soft-danger d-flex align-items-center mb-4 border-0 shadow-sm rounded-3">
//                           <i className="ti ti-alert-circle fs-24 me-3"></i>
//                           <div>
//                             <h6 className="mb-1 fw-bold">
//                               Profile Completion Required
//                             </h6>
//                             <p className="mb-0 fs-13">
//                               Please fill in all mandatory fields to unlock full
//                               access to the Kavach HR portal.
//                             </p>
//                           </div>
//                         </div>
//                       )}

//                       {/* --- GLOBAL HEADER CARD (Always Visible on top of scroll) --- */}
//                       <div className="card border-0 shadow-sm rounded-3 mb-4">
//                         <div className="card-body p-4">
//                           <div className="row g-3 align-items-center mx-0">
//                             <div className="col-md-10">
//                               <div className="row g-3">
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Full Name{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted ? (errors.name ? "is-invalid" : formData.name ? "is-valid" : "") : ""}`}
//                                     placeholder="Enter Fullname here"
//                                     value={formData.name}
//                                     onChange={(e) =>
//                                       handleInputChange(e, "name", {
//                                         type: "alpha",
//                                         maxLength: 50,
//                                       })
//                                     }
//                                   />
//                                   {isSubmitted && errors.name && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       <i className="ti ti-info-circle me-1"></i>
//                                       {errors.name}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Father's Name{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted ? (errors.father_name ? "is-invalid" : formData.father_name ? "is-valid" : "") : ""}`}
//                                     placeholder="Enter Father's Name"
//                                     value={formData.father_name}
//                                     onChange={(e) =>
//                                       handleInputChange(e, "father_name", {
//                                         type: "alpha",
//                                         maxLength: 50,
//                                       })
//                                     }
//                                   />
//                                   {isSubmitted && errors.father_name && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       <i className="ti ti-info-circle me-1"></i>
//                                       {errors.father_name}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Branch
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`branch-field-${formData.name_of_client}-${branches.length}`}
//                                     options={branches}
//                                     placeholder="Select Branch"
//                                     value={
//                                       branches.find(
//                                         (b) =>
//                                           b.value ===
//                                           String(formData.name_of_client),
//                                       ) || null
//                                     }
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         name_of_client: opt?.value || "",
//                                       })
//                                     }
//                                     formatOptionLabel={(option: any) => {
//                                       const [company, address] =
//                                         option.label.split(" | ");
//                                       return (
//                                         <div className="d-flex flex-column py-1">
//                                           <span className="fw-bold fs-13 text-dark mb-1">
//                                             {company}
//                                           </span>
//                                           {address && (
//                                             <small className="text-muted fs-11 lh-sm">
//                                               <i className="ti ti-map-pin me-1"></i>
//                                               {address}
//                                             </small>
//                                           )}
//                                         </div>
//                                       );
//                                     }}
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Employee Category
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={[
//                                       { value: "staff", label: "Staff" },
//                                       { value: "contract", label: "Contract" },
//                                       { value: "intern", label: "Intern" },
//                                     ]}
//                                     defaultValue={[
//                                       { value: "staff", label: "Staff" },
//                                       { value: "contract", label: "Contract" },
//                                       { value: "intern", label: "Intern" },
//                                     ].find(
//                                       (o) =>
//                                         o.value === formData.employee_category,
//                                     )}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         employee_category: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Working Hours
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={workingSchedules}
//                                     placeholder="Select Hours"
//                                     defaultValue={workingSchedules.find(
//                                       (opt) =>
//                                         opt.value ===
//                                         formData.resource_calendar_id,
//                                     )}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         resource_calendar_id: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <div className="d-flex justify-content-between align-items-center mb-2">
//                                     <label className="form-label fs-13 fw-bold text-dark mb-0">
//                                       Experience
//                                     </label>
//                                     <span
//                                       className="badge rounded-pill px-2 py-1"
//                                       style={{
//                                         backgroundColor:
//                                           "rgba(228, 33, 40, 0.1)",
//                                         color: "#E42128",
//                                         border:
//                                           "1px solid rgba(228, 33, 40, 0.2)",
//                                       }}
//                                     >
//                                       {formData.total_experiance || 0} Yrs
//                                     </span>
//                                   </div>
//                                   <div className="px-2">
//                                     <Slider
//                                       min={0}
//                                       max={30}
//                                       step={1}
//                                       value={
//                                         Number(formData.total_experiance) || 0
//                                       }
//                                       onChange={(val) =>
//                                         setFormData({
//                                           ...formData,
//                                           total_experiance: val.toString(),
//                                         })
//                                       }
//                                       styles={{
//                                         track: { backgroundColor: "#E42128" },
//                                         handle: {
//                                           borderColor: "#E42128",
//                                           backgroundColor: "#fff",
//                                         },
//                                       }}
//                                     />
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                             <div className="col-md-2 text-center border-start py-2">
//                               <div
//                                 className="profile-pic-box border border-dashed rounded p-1 mx-auto bg-white shadow-sm"
//                                 style={{
//                                   width: "100px",
//                                   height: "100px",
//                                   position: "relative",
//                                 }}
//                               >
//                                 {imgPreview ? (
//                                   <img
//                                     src={imgPreview}
//                                     className="img-fluid rounded w-100 h-100 object-fit-cover"
//                                     alt="Preview"
//                                   />
//                                 ) : (
//                                   <div className="d-flex flex-column align-items-center justify-content-center h-100">
//                                     <i className="ti ti-camera fs-32 text-muted"></i>
//                                     <span className="fs-10 text-muted">
//                                       Photo
//                                     </span>
//                                   </div>
//                                 )}
//                                 <label
//                                   htmlFor="emp_img_header"
//                                   className="btn btn-primary btn-icon btn-xs rounded-circle position-absolute"
//                                   style={{
//                                     bottom: "-10px",
//                                     left: "50%",
//                                     transform: "translateX(-50%)",
//                                     width: "26px",
//                                     height: "26px",
//                                     padding: 0,
//                                     display: "grid",
//                                     placeItems: "center",
//                                   }}
//                                 >
//                                   <i className="ti ti-upload fs-12"></i>
//                                 </label>
//                                 <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                   type="file"
//                                   id="emp_img_header"
//                                   className="d-none"
//                                   accept="image/*"
//                                   onChange={handleImageChange}
//                                 />
//                               </div>
//                             </div>
//                           </div>
//                         </div>
//                       </div>

//                       {/* --- DYNAMIC TAB CONTENT --- */}
//                       <div className="card border-0 shadow-sm rounded-3">
//                         <div className="card-header bg-white border-bottom py-3 px-4">
//                           <h6 className="mb-0 fw-bold text-primary d-flex align-items-center">
//                             <i
//                               className={`ti ${tabConfig[currentTabIndex].icon} fs-20 me-2`}
//                             ></i>
//                             {tabConfig[currentTabIndex].label}
//                           </h6>
//                         </div>
//                         <div className="card-body p-4">
//                           {activeTab === "legal" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="row g-4">
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Aadhaar Number{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted ? (errors.aadhaar_number ? "is-invalid" : formData.aadhaar_number ? "is-valid" : "") : ""}`}
//                                     placeholder="12 Digit Aadhaar"
//                                     value={formData.aadhaar_number}
//                                     onChange={(e) => {
//                                       const val = e.target.value
//                                         .replace(/\D/g, "")
//                                         .slice(0, 12);
//                                       setFormData({
//                                         ...formData,
//                                         aadhaar_number: val,
//                                       });
//                                       if (errors.aadhaar_number)
//                                         setErrors({
//                                           ...errors,
//                                           aadhaar_number: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.aadhaar_number && (
//                                     <div className="invalid-feedback">
//                                       {errors.aadhaar_number}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     PAN Number
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control text-uppercase ${isSubmitted ? (errors.pan_number ? "is-invalid" : formData.pan_number ? "is-valid" : "") : ""}`}
//                                     maxLength={10}
//                                     placeholder="ABCDE1234F"
//                                     value={formData.pan_number}
//                                     onChange={(e) => {
//                                       const val = e.target.value
//                                         .toUpperCase()
//                                         .replace(/[^A-Z0-9]/g, "");
//                                       setFormData({
//                                         ...formData,
//                                         pan_number: val,
//                                       });
//                                       if (errors.pan_number)
//                                         setErrors((prev: any) => ({
//                                           ...prev,
//                                           pan_number: "",
//                                         }));
//                                     }}
//                                   />
//                                   {isSubmitted && errors.pan_number && (
//                                     <div className="invalid-feedback">
//                                       {errors.pan_number}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Voter ID
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control text-uppercase ${isSubmitted && errors.voter_id ? "is-invalid" : ""}`}
//                                     placeholder="ABC1234567"
//                                     maxLength={10}
//                                     value={formData.voter_id}
//                                     onChange={(e) => {
//                                       const val = e.target.value
//                                         .toUpperCase()
//                                         .replace(/[^A-Z0-9]/g, "");
//                                       setFormData({
//                                         ...formData,
//                                         voter_id: val,
//                                       });
//                                       if (errors.voter_id)
//                                         setErrors((prev: any) => ({
//                                           ...prev,
//                                           voter_id: "",
//                                         }));
//                                     }}
//                                   />
//                                   {isSubmitted && errors.voter_id && (
//                                     <div className="invalid-feedback">
//                                       {errors.voter_id}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Passport No
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     maxLength={8}
//                                     className={`form-control text-uppercase ${isSubmitted && errors.passport_no ? "is-invalid" : ""}`}
//                                     placeholder="A1234567"
//                                     value={formData.passport_no}
//                                     onChange={(e) => {
//                                       const val = e.target.value
//                                         .toUpperCase()
//                                         .replace(/[^A-Z0-9]/g, "");
//                                       setFormData({
//                                         ...formData,
//                                         passport_no: val,
//                                       });
//                                       if (errors.passport_no)
//                                         setErrors((prev: any) => ({
//                                           ...prev,
//                                           passport_no: "",
//                                         }));
//                                     }}
//                                   />
//                                   {isSubmitted && errors.passport_no && (
//                                     <div className="invalid-feedback">
//                                       {errors.passport_no}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Category
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={[
//                                       { value: "general", label: "General" },
//                                       { value: "sc", label: "SC" },
//                                       { value: "st", label: "ST" },
//                                       { value: "obc", label: "OBC" },
//                                       { value: "others", label: "Others" },
//                                     ]}
//                                     placeholder="Select Category"
//                                     defaultValue={
//                                       formData.category
//                                         ? {
//                                             value: formData.category,
//                                             label:
//                                               formData.category.toUpperCase(),
//                                           }
//                                         : undefined
//                                     }
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         category: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     ESI Number
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     placeholder="Enter ESI Number"
//                                     value={formData.esi_number}
//                                     onChange={(e) =>
//                                       handleInputChange(e, "esi_number", {
//                                         type: "numeric",
//                                         maxLength: 17,
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-2 d-flex align-items-center pt-4">
//                                   <div className="form-check">
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="checkbox"
//                                       className="form-check-input"
//                                       id="uanCheckLegal"
//                                       checked={
//                                         formData.is_uan_number_applicable
//                                       }
//                                       onChange={(e) =>
//                                         setFormData({
//                                           ...formData,
//                                           is_uan_number_applicable:
//                                             e.target.checked,
//                                         })
//                                       }
//                                     />
//                                     <label
//                                       className="form-check-label fs-13 ms-2"
//                                       htmlFor="uanCheckLegal"
//                                     >
//                                       UAN Applicable?
//                                     </label>
//                                   </div>
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     UAN Number{" "}
//                                     {formData.is_uan_number_applicable && (
//                                       <span className="text-danger">*</span>
//                                     )}
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted && formData.is_uan_number_applicable ? (errors.uan_number ? "is-invalid" : "is-valid") : ""}`}
//                                     disabled={
//                                       !formData.is_uan_number_applicable
//                                     }
//                                     placeholder="12 Digit UAN"
//                                     value={formData.uan_number}
//                                     onChange={(e) =>
//                                       handleInputChange(e, "uan_number", {
//                                         type: "numeric",
//                                         maxLength: 12,
//                                       })
//                                     }
//                                   />
//                                   {isSubmitted && errors.uan_number && (
//                                     <div className="invalid-feedback">
//                                       {errors.uan_number}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-12 mb-1">
//                                     License Copy
//                                   </label>
//                                   <div className="d-flex align-items-center gap-2">
//                                     <div className="position-relative">
//                                       <label
//                                         className={`btn btn-icon mb-0 ${formData.driving_license ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
//                                         style={{
//                                           width: "40px",
//                                           height: "40px",
//                                         }}
//                                         title="Upload License"
//                                       >
//                                         <i
//                                           className={`ti ${formData.driving_license ? "ti-file-check" : "ti-upload"} fs-18`}
//                                         ></i>
//                                         <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                           type="file"
//                                           className="position-absolute opacity-0 w-100 h-100 start-0 top-0 cursor-pointer"
//                                           onChange={(e) =>
//                                             setFormData({
//                                               ...formData,
//                                               driving_license:
//                                                 e.target.files?.[0] || null,
//                                             })
//                                           }
//                                         />
//                                       </label>
//                                     </div>
//                                     {formData.driving_license && (
//                                       <div className="d-flex align-items-center animate__animated animate__fadeIn">
//                                         {typeof formData.driving_license ===
//                                           "string" && (
//                                           <a
//                                             href={formData.driving_license}
//                                             target="_blank"
//                                             rel="noreferrer"
//                                             className="btn btn-icon btn-sm btn-ghost-info"
//                                           >
//                                             <i className="ti ti-eye fs-18"></i>
//                                           </a>
//                                         )}
//                                         {formData.driving_license instanceof
//                                           File && (
//                                           <i className="ti ti-circle-check-filled text-success fs-20 ms-1"></i>
//                                         )}
//                                       </div>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "personal" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="row g-4">
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13 text-muted">
//                                     Employee Code
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control bg-light border-dashed"
//                                     disabled
//                                     value="AUTO-GEN-2025"
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Marital Status
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={[
//                                       { value: "single", label: "Single" },
//                                       { value: "married", label: "Married" },
//                                       {
//                                         value: "cohabitant",
//                                         label: "Legal Cohabitant",
//                                       },
//                                       { value: "widower", label: "Widower" },
//                                       { value: "divorced", label: "Divorced" },
//                                     ]}
//                                     defaultValue={{
//                                       value: formData.marital,
//                                       label: formData.marital
//                                         ? formData.marital
//                                             .charAt(0)
//                                             .toUpperCase() +
//                                           formData.marital.slice(1)
//                                         : "Select",
//                                     }}
//                                     onChange={(opt) => {
//                                       setFormData({
//                                         ...formData,
//                                         marital: opt?.value || "",
//                                         spouse_name:
//                                           opt?.value !== "married"
//                                             ? ""
//                                             : formData.spouse_name,
//                                         date_of_marriage:
//                                           opt?.value !== "married"
//                                             ? null
//                                             : formData.date_of_marriage,
//                                       });
//                                     }}
//                                   />
//                                 </div>

//                                 {formData.marital === "married" && (
//                                   <>
//                                     <div className="col-md-3 animate__animated animate__fadeInDown">
//                                       <label className="form-label fs-13">
//                                         Spouse Name{" "}
//                                         <span className="text-danger">*</span>
//                                       </label>
//                                       <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                         type="text"
//                                         className={`form-control ${isSubmitted ? (errors.spouse_name ? "is-invalid" : formData.spouse_name ? "is-valid" : "") : ""}`}
//                                         placeholder="Spouse Name"
//                                         value={formData.spouse_name}
//                                         onChange={(e) =>
//                                           handleInputChange(e, "spouse_name", {
//                                             type: "alpha",
//                                             maxLength: 50,
//                                           })
//                                         }
//                                       />
//                                       {isSubmitted && errors.spouse_name && (
//                                         <div className="invalid-feedback">
//                                           {errors.spouse_name}
//                                         </div>
//                                       )}
//                                     </div>
//                                     <div className="col-md-3 animate__animated animate__fadeInDown">
//                                       <label className="form-label fs-13">
//                                         Date of Marriage{" "}
//                                         <span className="text-danger">*</span>
//                                       </label>
//                                       <DatePicker disabled={isViewOnly}
//                                         className={`form-control w-100 ${isSubmitted ? (errors.date_of_marriage ? "is-invalid" : formData.date_of_marriage ? "is-valid" : "") : ""}`}
//                                         value={
//                                           formData.date_of_marriage
//                                             ? dayjs(formData.date_of_marriage)
//                                             : null
//                                         }
//                                         onChange={(_, dateStr) => {
//                                           setFormData({
//                                             ...formData,
//                                             date_of_marriage: dateStr,
//                                           });
//                                           if (errors.date_of_marriage)
//                                             setErrors({
//                                               ...errors,
//                                               date_of_marriage: "",
//                                             });
//                                         }}
//                                       />
//                                       {isSubmitted &&
//                                         errors.date_of_marriage && (
//                                           <div className="invalid-feedback d-block">
//                                             {errors.date_of_marriage}
//                                           </div>
//                                         )}
//                                     </div>
//                                   </>
//                                 )}

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Date of Birth{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <DatePicker disabled={isViewOnly}
//                                     className={`form-control w-100 ${isSubmitted ? (errors.birthday ? "is-invalid" : formData.birthday ? "is-valid" : "") : ""}`}
//                                     value={
//                                       formData.birthday
//                                         ? dayjs(formData.birthday)
//                                         : null
//                                     }
//                                     onChange={(_, dateStr) => {
//                                       setFormData({
//                                         ...formData,
//                                         birthday: dateStr,
//                                       });
//                                       if (errors.birthday)
//                                         setErrors({ ...errors, birthday: "" });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.birthday && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.birthday}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Blood Group{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div
//                                     className={
//                                       isSubmitted
//                                         ? errors.blood_group
//                                           ? "border border-danger rounded"
//                                           : formData.blood_group
//                                             ? "border border-success rounded"
//                                             : ""
//                                         : ""
//                                     }
//                                   >
//                                     <CommonSelect disabled={isViewOnly}
//                                       options={[
//                                         "A+",
//                                         "A-",
//                                         "B+",
//                                         "B-",
//                                         "AB+",
//                                         "AB-",
//                                         "O+",
//                                         "O-",
//                                       ].map((bg) => ({ value: bg, label: bg }))}
//                                       defaultValue={
//                                         formData.blood_group
//                                           ? {
//                                               value: formData.blood_group,
//                                               label: formData.blood_group,
//                                             }
//                                           : undefined
//                                       }
//                                       onChange={(opt) => {
//                                         setFormData({
//                                           ...formData,
//                                           blood_group: opt?.value || "",
//                                         });
//                                         if (errors.blood_group)
//                                           setErrors({
//                                             ...errors,
//                                             blood_group: "",
//                                           });
//                                       }}
//                                     />
//                                   </div>
//                                   {isSubmitted && errors.blood_group && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.blood_group}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 d-block">
//                                     Gender{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div
//                                     className={`pt-1 ps-2 rounded ${isSubmitted && errors.gender ? "border border-danger" : ""}`}
//                                   >
//                                     <Radio.Group
//                                       className="custom-radio-group"
//                                       value={formData.gender}
//                                       onChange={(e) => {
//                                         setFormData({
//                                           ...formData,
//                                           gender: e.target.value,
//                                         });
//                                         if (errors.gender)
//                                           setErrors({ ...errors, gender: "" });
//                                       }}
//                                     >
//                                       <Radio value="male">Male</Radio>
//                                       <Radio value="female">Female</Radio>
//                                       <Radio value="other">Other</Radio>
//                                     </Radio.Group>
//                                   </div>
//                                   {isSubmitted && errors.gender && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.gender}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Post Graduation
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     placeholder="MBA, etc."
//                                     value={formData.name_of_post_graduation}
//                                     onChange={(e) =>
//                                       handleInputChange(
//                                         e,
//                                         "name_of_post_graduation",
//                                         { type: "alpha", maxLength: 100 },
//                                       )
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     University Name
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     value={formData.name_of_any_other_education}
//                                     onChange={(e) =>
//                                       handleInputChange(
//                                         e,
//                                         "name_of_any_other_education",
//                                         { type: "alpha", maxLength: 100 },
//                                       )
//                                     }
//                                   />
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     CV / Resume Attachment
//                                   </label>
//                                   <div className="d-flex align-items-center gap-2">
//                                     <label
//                                       className={`btn btn-icon mb-0 ${formData.cv_file ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
//                                       style={{ width: "40px", height: "40px" }}
//                                       title="Upload CV"
//                                     >
//                                       <i
//                                         className={`ti ${formData.cv_file ? "ti-file-text" : "ti-upload"} fs-18`}
//                                       ></i>
//                                       <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                         type="file"
//                                         accept=".pdf,.doc,.docx"
//                                         className="position-absolute opacity-0 w-100 h-100 start-0 top-0 cursor-pointer"
//                                         onChange={(e) =>
//                                           setFormData({
//                                             ...formData,
//                                             cv_file:
//                                               e.target.files?.[0] || null,
//                                           })
//                                         }
//                                       />
//                                     </label>
//                                     {formData.cv_file && (
//                                       <div className="d-flex align-items-center animate__animated animate__fadeIn">
//                                         {formData.cv_file instanceof File && (
//                                           <span
//                                             className="fs-12 text-muted text-truncate ms-2"
//                                             style={{ maxWidth: "120px" }}
//                                           >
//                                             {formData.cv_file.name}
//                                           </span>
//                                         )}
//                                         {typeof formData.cv_file ===
//                                           "string" && (
//                                           <a
//                                             href={formData.cv_file}
//                                             target="_blank"
//                                             rel="noreferrer"
//                                             className="btn btn-icon btn-sm btn-ghost-info ms-2"
//                                           >
//                                             <i className="ti ti-eye fs-18"></i>
//                                           </a>
//                                         )}
//                                       </div>
//                                     )}
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "address" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="row g-4">
//                                 <div className="col-md-6">
//                                   <label className="form-label fs-13">
//                                     Present Address{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     rows={3}
//                                     className={`form-control ${isSubmitted ? (errors.present_address ? "is-invalid" : formData.present_address ? "is-valid" : "") : ""}`}
//                                     maxLength={500}
//                                     placeholder="House no, Building, Street..."
//                                     value={formData.present_address}
//                                     onChange={(e) => {
//                                       setFormData({
//                                         ...formData,
//                                         present_address: e.target.value,
//                                       });
//                                       if (errors.present_address)
//                                         setErrors({
//                                           ...errors,
//                                           present_address: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.present_address && (
//                                     <div className="invalid-feedback">
//                                       {errors.present_address}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-6">
//                                   <label className="form-label fs-13">
//                                     Permanent Address{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     rows={3}
//                                     className={`form-control ${isSubmitted ? (errors.permanent_address ? "is-invalid" : formData.permanent_address ? "is-valid" : "") : ""}`}
//                                     maxLength={500}
//                                     placeholder="Same as present or different..."
//                                     value={formData.permanent_address}
//                                     onChange={(e) => {
//                                       setFormData({
//                                         ...formData,
//                                         permanent_address: e.target.value,
//                                       });
//                                       if (errors.permanent_address)
//                                         setErrors({
//                                           ...errors,
//                                           permanent_address: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.permanent_address && (
//                                     <div className="invalid-feedback">
//                                       {errors.permanent_address}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Country
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={countries}
//                                     placeholder="Select Country"
//                                     defaultValue={countries.find(
//                                       (c) => c.value === "104",
//                                     )}
//                                     onChange={(opt) => {
//                                       const countryId = opt?.value || "";
//                                       setFormData({
//                                         ...formData,
//                                         country_id: countryId,
//                                         state_id: "",
//                                         district_id: "",
//                                       });
//                                       loadStates(countryId);
//                                     }}
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     State
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`state-${formData.country_id}`}
//                                     options={states}
//                                     placeholder="Select State"
//                                     defaultValue={states.find(
//                                       (s) =>
//                                         s.value === String(formData.state_id),
//                                     )}
//                                     onChange={(opt) => {
//                                       const stateId = opt?.value || "";
//                                       setFormData({
//                                         ...formData,
//                                         state_id: stateId,
//                                         district_id: "",
//                                       });
//                                       loadDistricts(
//                                         formData.country_id || "104",
//                                         stateId,
//                                       );
//                                     }}
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     District
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`city-${formData.state_id}`}
//                                     options={districts}
//                                     placeholder="Select City/District"
//                                     defaultValue={districts.find(
//                                       (d) =>
//                                         d.value ===
//                                         String(formData.district_id),
//                                     )}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         district_id: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Pin Code
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     maxLength={6}
//                                     placeholder="6-Digits"
//                                     value={formData.pin_code}
//                                     onChange={(e) =>
//                                       setFormData({
//                                         ...formData,
//                                         pin_code: e.target.value.replace(
//                                           /\D/g,
//                                           "",
//                                         ),
//                                       })
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "emergency" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div
//                                 className="alert alert-soft-warning d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3"
//                                 role="alert"
//                               >
//                                 <i className="ti ti-info-circle fs-24 me-3"></i>
//                                 <div className="fs-13">
//                                   Please ensure the contact details provided are
//                                   accurate for use in case of emergencies.
//                                 </div>
//                               </div>
//                               <div className="row g-4">
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Primary Mobile{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div className="input-group">
//                                     <span className="input-group-text fs-12 bg-light">
//                                       +91
//                                     </span>
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="text"
//                                       className={`form-control ${isSubmitted ? (errors.work_phone ? "is-invalid" : formData.work_phone ? "is-valid" : "") : ""}`}
//                                       maxLength={10}
//                                       value={formData.work_phone}
//                                       onChange={(e) => {
//                                         setFormData({
//                                           ...formData,
//                                           work_phone: e.target.value.replace(
//                                             /\D/g,
//                                             "",
//                                           ),
//                                         });
//                                         if (errors.work_phone)
//                                           setErrors({
//                                             ...errors,
//                                             work_phone: "",
//                                           });
//                                       }}
//                                     />
//                                   </div>
//                                   {isSubmitted && errors.work_phone && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       {errors.work_phone}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Personal Email{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="email"
//                                     className={`form-control ${isSubmitted ? (errors.private_email ? "is-invalid" : formData.private_email ? "is-valid" : "") : ""}`}
//                                     maxLength={100}
//                                     placeholder="example@gmail.com"
//                                     value={formData.private_email}
//                                     onChange={(e) => {
//                                       setFormData({
//                                         ...formData,
//                                         private_email: e.target.value,
//                                       });
//                                       if (errors.private_email)
//                                         setErrors({
//                                           ...errors,
//                                           private_email: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.private_email && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.private_email}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Secondary Mobile
//                                   </label>
//                                   <div className="input-group">
//                                     <span className="input-group-text fs-12 bg-light">
//                                       +91
//                                     </span>
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="text"
//                                       className="form-control"
//                                       maxLength={10}
//                                       placeholder="Mobile No."
//                                       value={formData.mobile_phone}
//                                       onChange={(e) =>
//                                         setFormData({
//                                           ...formData,
//                                           mobile_phone: e.target.value.replace(
//                                             /\D/g,
//                                             "",
//                                           ),
//                                         })
//                                       }
//                                     />
//                                   </div>
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Emergency Contact Name{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted ? (errors.emergency_contact_name ? "is-invalid" : formData.emergency_contact_name ? "is-valid" : "") : ""}`}
//                                     placeholder="Full Name"
//                                     value={formData.emergency_contact_name}
//                                     onChange={(e) =>
//                                       handleInputChange(
//                                         e,
//                                         "emergency_contact_name",
//                                         { type: "alpha", maxLength: 50 },
//                                       )
//                                     }
//                                   />
//                                   {isSubmitted &&
//                                     errors.emergency_contact_name && (
//                                       <div className="invalid-feedback">
//                                         {errors.emergency_contact_name}
//                                       </div>
//                                     )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Relation{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted ? (errors.emergency_contact_relation ? "is-invalid" : formData.emergency_contact_relation ? "is-valid" : "") : ""}`}
//                                     placeholder="e.g. Spouse, Father"
//                                     value={formData.emergency_contact_relation}
//                                     onChange={(e) =>
//                                       handleInputChange(
//                                         e,
//                                         "emergency_contact_relation",
//                                         { type: "alpha", maxLength: 20 },
//                                       )
//                                     }
//                                   />
//                                   {isSubmitted &&
//                                     errors.emergency_contact_relation && (
//                                       <div className="invalid-feedback">
//                                         {errors.emergency_contact_relation}
//                                       </div>
//                                     )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Emergency Mobile{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div className="input-group">
//                                     <span className="input-group-text bg-light fs-12">
//                                       +91
//                                     </span>
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="text"
//                                       className={`form-control ${isSubmitted ? (errors.emergency_contact_mobile ? "is-invalid" : formData.emergency_contact_mobile ? "is-valid" : "") : ""}`}
//                                       maxLength={10}
//                                       placeholder="10-Digit Mobile"
//                                       value={formData.emergency_contact_mobile}
//                                       onChange={(e) => {
//                                         const val = e.target.value.replace(
//                                           /\D/g,
//                                           "",
//                                         );
//                                         setFormData({
//                                           ...formData,
//                                           emergency_contact_mobile: val,
//                                         });
//                                         if (errors.emergency_contact_mobile)
//                                           setErrors({
//                                             ...errors,
//                                             emergency_contact_mobile: "",
//                                           });
//                                       }}
//                                     />
//                                   </div>
//                                   {isSubmitted &&
//                                     errors.emergency_contact_mobile && (
//                                       <div className="text-danger fs-11 mt-1">
//                                         {errors.emergency_contact_mobile}
//                                       </div>
//                                     )}
//                                 </div>
//                                 <div className="col-md-12">
//                                   <label className="form-label fs-13">
//                                     Contact Address
//                                   </label>
//                                   <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     rows={2}
//                                     className="form-control"
//                                     maxLength={500}
//                                     placeholder="Full Residential Address of the contact person"
//                                     value={formData.emergency_contact_address}
//                                     onChange={(e) =>
//                                       setFormData({
//                                         ...formData,
//                                         emergency_contact_address:
//                                           e.target.value,
//                                       })
//                                     }
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "employment" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                 type="text"
//                                 name="prevent_autofill"
//                                 style={{ display: "none" }}
//                                 tabIndex={-1}
//                               />
//                               <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                 type="password"
//                                 name="prevent_autofill_pwd"
//                                 style={{ display: "none" }}
//                                 tabIndex={-1}
//                               />

//                               <div className="row g-4">
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Department{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`dept-list-${departments.length}`}
//                                     options={departments}
//                                     placeholder="Select Department"
//                                     value={departments.find(
//                                       (o) =>
//                                         o.value ===
//                                         String(formData.department_id),
//                                     )}
//                                     onChange={(opt) => {
//                                       const deptId = opt?.value || "";
//                                       setFormData({
//                                         ...formData,
//                                         department_id: deptId,
//                                         job_id: "",
//                                       });
//                                       if (deptId)
//                                         loadFilteredDesignations(deptId);
//                                       else setDesignations([]);
//                                     }}
//                                   />
//                                   {isSubmitted && errors.department_id && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       {errors.department_id}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Designation{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`designation-list-${designations.length}-${formData.job_id}`}
//                                     options={designations}
//                                     placeholder={
//                                       formData.department_id
//                                         ? "Select Designation"
//                                         : "Select Department First"
//                                     }
//                                     defaultValue={designations.find(
//                                       (o) =>
//                                         o.value === String(formData.job_id),
//                                     )}
//                                     disabled={!formData.department_id}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         job_id: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                   {isSubmitted && errors.job_id && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       {errors.job_id}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Login Password{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div className="input-group">
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type={showPassword ? "text" : "password"}
//                                       autoComplete="new-password"
//                                       className={`form-control ${isSubmitted ? (errors.employee_password ? "is-invalid" : formData.employee_password ? "is-valid" : "") : ""}`}
//                                       placeholder="System Access Password"
//                                       value={formData.employee_password}
//                                       onChange={(e) =>
//                                         handleInputChange(
//                                           e,
//                                           "employee_password",
//                                           { type: "all", maxLength: 20 },
//                                         )
//                                       }
//                                     />
//                                     <button
//                                       className="btn btn-outline-secondary border-start-0"
//                                       type="button"
//                                       onClick={() =>
//                                         setShowPassword(!showPassword)
//                                       }
//                                     >
//                                       <i
//                                         className={`ti ${showPassword ? "ti-eye" : "ti-eye-off"} fs-16`}
//                                       ></i>
//                                     </button>
//                                   </div>
//                                   {isSubmitted && errors.employee_password && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.employee_password}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Joining Date{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <DatePicker disabled={isViewOnly}
//                                     className={`w-100 form-control ${isSubmitted && errors.joining_date ? "is-invalid" : ""}`}
//                                     value={
//                                       formData.joining_date
//                                         ? dayjs(formData.joining_date)
//                                         : null
//                                     }
//                                     onChange={(_, dateStr) => {
//                                       setFormData({
//                                         ...formData,
//                                         joining_date: dateStr,
//                                       });
//                                       if (errors.joining_date)
//                                         setErrors((prev: any) => ({
//                                           ...prev,
//                                           joining_date: "",
//                                         }));
//                                     }}
//                                   />
//                                   {isSubmitted && errors.joining_date && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.joining_date}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3 d-flex align-items-center pt-4">
//                                   <div className="form-check">
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="checkbox"
//                                       className="form-check-input"
//                                       id="probCheck"
//                                       checked={formData.in_probation}
//                                       onChange={(e) =>
//                                         setFormData({
//                                           ...formData,
//                                           in_probation: e.target.checked,
//                                         })
//                                       }
//                                     />
//                                     <label
//                                       className="form-check-label fs-13 ms-1"
//                                       htmlFor="probCheck"
//                                     >
//                                       In Probation
//                                     </label>
//                                   </div>
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Probation (Months)
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="number"
//                                     className="form-control"
//                                     value={formData.probation_period}
//                                     onChange={(e) =>
//                                       handleProbationChange(
//                                         Number(e.target.value),
//                                       )
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13 text-muted">
//                                     Probation End Date
//                                   </label>
//                                   <DatePicker disabled={isViewOnly}
//                                     className="w-100 form-control bg-light"
//                                     value={
//                                       formData.probation_end_date
//                                         ? dayjs(formData.probation_end_date)
//                                         : null
//                                     }
//                                     disabled
//                                     placeholder="Auto-calculated"
//                                   />
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Reporting Manager
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`rep-manager-${managers.length}`}
//                                     options={managers}
//                                     defaultValue={managers.find(
//                                       (o) =>
//                                         o.value ===
//                                         String(formData.reporting_manager_id),
//                                     )}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         reporting_manager_id: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Head of Department
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     key={`hod-manager-${managers.length}`}
//                                     options={managers}
//                                     defaultValue={managers.find(
//                                       (o) =>
//                                         o.value ===
//                                         String(formData.head_of_department_id),
//                                     )}
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         head_of_department_id: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Attendance Mode
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={[
//                                       { value: "qr", label: "QR CODE" },
//                                       {
//                                         value: "biometric",
//                                         label: "BIOMETRIC",
//                                       },
//                                       { value: "mobile", label: "MobileAPP" },
//                                     ]}
//                                     defaultValue={{
//                                       value: "mobile",
//                                       label: "MobileAPP",
//                                     }}
//                                     disabled={true}
//                                     placeholder="Capture Mode"
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         attendance_capture_mode:
//                                           opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>

//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Status
//                                   </label>
//                                   <CommonSelect disabled={isViewOnly}
//                                     options={[
//                                       { value: "active", label: "Active" },
//                                       { value: "inactive", label: "Inactive" },
//                                     ]}
//                                     defaultValue={
//                                       formData.status
//                                         ? {
//                                             value: formData.status,
//                                             label:
//                                               formData.status.toUpperCase(),
//                                           }
//                                         : undefined
//                                     }
//                                     onChange={(opt) =>
//                                       setFormData({
//                                         ...formData,
//                                         status: opt?.value || "",
//                                       })
//                                     }
//                                   />
//                                 </div>
//                                 <div className="col-md-3 d-flex align-items-center pt-4">
//                                   <div className="form-check">
//                                     <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                       type="checkbox"
//                                       className="form-check-input"
//                                       id="holdCheck"
//                                       checked={formData.hold_status}
//                                       onChange={(e) =>
//                                         setFormData({
//                                           ...formData,
//                                           hold_status: e.target.checked,
//                                         })
//                                       }
//                                     />
//                                     <label
//                                       className="form-check-label fs-13 ms-1 text-warning fw-bold"
//                                       htmlFor="holdCheck"
//                                     >
//                                       On Hold
//                                     </label>
//                                   </div>
//                                 </div>
//                                 <div className="col-md-6">
//                                   <label className="form-label fs-13">
//                                     Hold Remarks
//                                   </label>
//                                   <textarea disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     rows={1}
//                                     className={`form-control ${isSubmitted && formData.hold_status && errors.hold_remarks ? "is-invalid" : ""}`}
//                                     placeholder="Reason for hold..."
//                                     disabled={!formData.hold_status}
//                                     value={formData.hold_remarks}
//                                     maxLength={150}
//                                     onChange={(e) => {
//                                       setFormData({
//                                         ...formData,
//                                         hold_remarks: e.target.value,
//                                       });
//                                       if (errors.hold_remarks)
//                                         setErrors({
//                                           ...errors,
//                                           hold_remarks: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted &&
//                                     formData.hold_status &&
//                                     errors.hold_remarks && (
//                                       <div className="invalid-feedback d-block">
//                                         {errors.hold_remarks}
//                                       </div>
//                                     )}
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "banking" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="row g-4">
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Bank Name{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <div
//                                     className={
//                                       isSubmitted && errors.bank_id
//                                         ? "border border-danger rounded"
//                                         : ""
//                                     }
//                                   >
//                                     <CommonSelect disabled={isViewOnly}
//                                       key={`bank-master-${bankMasterList.length}-${formData.bank_id}`}
//                                       options={bankMasterList}
//                                       placeholder="Select Bank"
//                                       defaultValue={bankMasterList.find(
//                                         (b) =>
//                                           String(b.value) ===
//                                           String(formData.bank_id),
//                                       )}
//                                       onChange={(opt) => {
//                                         setFormData({
//                                           ...formData,
//                                           bank_id: opt?.value || "",
//                                           bank_swift_code: opt?.swift || "",
//                                         });
//                                         if (errors.bank_id)
//                                           setErrors({ ...errors, bank_id: "" });
//                                       }}
//                                     />
//                                   </div>
//                                   {isSubmitted && errors.bank_id && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       {errors.bank_id}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-5">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Account Number{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     maxLength={18}
//                                     className={`form-control ${isSubmitted && errors.account_number ? "is-invalid" : isSubmitted && formData.account_number ? "is-valid" : ""}`}
//                                     value={formData.account_number}
//                                     placeholder="Enter Account Number (Max 18 digits)"
//                                     onChange={(e) => {
//                                       const val = e.target.value
//                                         .replace(/\D/g, "")
//                                         .slice(0, 18);
//                                       setFormData({
//                                         ...formData,
//                                         account_number: val,
//                                       });
//                                       if (errors.account_number)
//                                         setErrors((prev: any) => ({
//                                           ...prev,
//                                           account_number: "",
//                                         }));
//                                     }}
//                                   />
//                                   {isSubmitted && errors.account_number && (
//                                     <div className="invalid-feedback">
//                                       {errors.account_number}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13 fw-bold">
//                                     IFSC Code{" "}
//                                     <span className="text-danger">*</span>
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className={`form-control ${isSubmitted && errors.bank_iafc_code ? "is-invalid" : ""}`}
//                                     value={formData.bank_iafc_code}
//                                     placeholder="e.g. SBIN0001234"
//                                     maxLength={11}
//                                     onChange={(e) => {
//                                       setFormData({
//                                         ...formData,
//                                         bank_iafc_code:
//                                           e.target.value.toUpperCase(),
//                                       });
//                                       if (errors.bank_iafc_code)
//                                         setErrors({
//                                           ...errors,
//                                           bank_iafc_code: "",
//                                         });
//                                     }}
//                                   />
//                                   {isSubmitted && errors.bank_iafc_code && (
//                                     <div className="invalid-feedback">
//                                       {errors.bank_iafc_code}
//                                     </div>
//                                   )}
//                                 </div>

//                                 <div className="col-12">
//                                   <hr className="my-1 opacity-25" />
//                                 </div>

//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 fw-bold text-muted">
//                                     SWIFT Code
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control bg-light"
//                                     value={formData.bank_swift_code}
//                                     readOnly
//                                     placeholder="Auto-populated"
//                                   />
//                                 </div>
//                                 <div className="col-md-2">
//                                   <label className="form-label fs-13 fw-bold">
//                                     Currency
//                                   </label>
//                                   <select disabled={isViewOnly || isSubmitting}
//                                     className="form-select"
//                                     value={formData.currency_id}
//                                     onChange={(e) =>
//                                       setFormData({
//                                         ...formData,
//                                         currency_id: e.target.value,
//                                       })
//                                     }
//                                     disabled={true}
//                                   >
//                                     <option value="INR">INR</option>
//                                   </select>
//                                 </div>

//                                 <div className="col-md-6">
//                                   <label className="form-label fs-13">
//                                     Passbook Copy Upload
//                                   </label>
//                                   <div className="d-flex align-items-center gap-3">
//                                     <label
//                                       className={`btn btn-icon mb-0 ${formData.upload_passbook ? "btn-soft-success" : "btn-soft-primary"} border-dashed rounded-3`}
//                                       style={{ width: "40px", height: "40px" }}
//                                     >
//                                       <i
//                                         className={`ti ${formData.upload_passbook ? "ti-book" : "ti-upload"} fs-18`}
//                                       ></i>
//                                       <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                         type="file"
//                                         accept=".jpg,.jpeg,.png,.pdf"
//                                         className="position-absolute opacity-0 w-100 h-100 start-0 top-0 cursor-pointer"
//                                         onChange={(e) =>
//                                           setFormData({
//                                             ...formData,
//                                             upload_passbook:
//                                               e.target.files?.[0] || null,
//                                           })
//                                         }
//                                       />
//                                     </label>
//                                     {formData.upload_passbook && (
//                                       <div className="d-flex align-items-center animate__animated animate__fadeIn">
//                                         {typeof formData.upload_passbook ===
//                                           "string" && (
//                                           <a
//                                             href={formData.upload_passbook}
//                                             target="_blank"
//                                             rel="noreferrer"
//                                             className="btn btn-icon btn-sm btn-ghost-info"
//                                           >
//                                             <i className="ti ti-eye fs-18"></i>
//                                           </a>
//                                         )}
//                                         {formData.upload_passbook instanceof
//                                           File && (
//                                           <i className="ti ti-circle-check-filled text-success fs-20 ms-1"></i>
//                                         )}
//                                       </div>
//                                     )}
//                                     <div className="text-info fs-11 lh-sm">
//                                       <i className="ti ti-info-circle me-1"></i>
//                                       Upload <strong>front page</strong> only
//                                       (A/C holder details).
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "notice" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div
//                                 className="alert alert-soft-danger d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3"
//                                 role="alert"
//                               >
//                                 <i className="ti ti-alert-triangle-filled fs-24 me-3 text-danger"></i>
//                                 <div className="fs-13">
//                                   <strong>Warning:</strong> Entering separation
//                                   details will automatically update the
//                                   employee's status to <em>Resigned</em> across
//                                   payroll and attendance modules upon reaching
//                                   the end date.
//                                 </div>
//                               </div>
//                               <div className="row g-4">
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Type Of Separation
//                                   </label>
//                                   <div
//                                     className={
//                                       isSubmitted
//                                         ? errors.type_of_sepration
//                                           ? "border border-danger rounded"
//                                           : formData.type_of_sepration
//                                             ? "border border-success rounded"
//                                             : ""
//                                         : ""
//                                     }
//                                   >
//                                     <CommonSelect disabled={isViewOnly}
//                                       options={[
//                                         {
//                                           value: "voluntary",
//                                           label: "Voluntary",
//                                         },
//                                         {
//                                           value: "involuntary",
//                                           label: "Involuntary",
//                                         },
//                                         {
//                                           value: "absconding",
//                                           label: "Absconding",
//                                         },
//                                         {
//                                           value: "retirement",
//                                           label: "Retirement",
//                                         },
//                                       ]}
//                                       placeholder="Select Type"
//                                       defaultValue={
//                                         formData.type_of_sepration
//                                           ? {
//                                               value: formData.type_of_sepration,
//                                               label:
//                                                 formData.type_of_sepration
//                                                   .charAt(0)
//                                                   .toUpperCase() +
//                                                 formData.type_of_sepration.slice(
//                                                   1,
//                                                 ),
//                                             }
//                                           : undefined
//                                       }
//                                       onChange={(opt) => {
//                                         setFormData({
//                                           ...formData,
//                                           type_of_sepration: opt?.value || "",
//                                         });
//                                         if (errors.type_of_sepration)
//                                           setErrors({
//                                             ...errors,
//                                             type_of_sepration: "",
//                                           });
//                                       }}
//                                     />
//                                   </div>
//                                   {isSubmitted && errors.type_of_sepration && (
//                                     <div className="text-danger fs-11 mt-1">
//                                       {errors.type_of_sepration}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Resignation Date
//                                   </label>
//                                   <DatePicker disabled={isViewOnly}
//                                     className={`w-100 form-control ${isSubmitted ? (errors.resignation_date ? "is-invalid" : formData.resignation_date ? "is-valid" : "") : ""}`}
//                                     value={
//                                       formData.resignation_date
//                                         ? dayjs(formData.resignation_date)
//                                         : null
//                                     }
//                                     onChange={(_, dateStr) => {
//                                       setFormData({
//                                         ...formData,
//                                         resignation_date: dateStr,
//                                       });
//                                       if (errors.resignation_date)
//                                         setErrors({
//                                           ...errors,
//                                           resignation_date: "",
//                                         });
//                                       calculateNoticeEndDate(
//                                         Number(formData.notice_period_days),
//                                         dateStr,
//                                       );
//                                     }}
//                                   />
//                                   {isSubmitted && errors.resignation_date && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.resignation_date}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13">
//                                     Notice Period (Days)
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="number"
//                                     className={`form-control ${isSubmitted ? (errors.notice_period_days ? "is-invalid" : formData.notice_period_days > 0 ? "is-valid" : "") : ""}`}
//                                     placeholder="e.g. 30"
//                                     value={formData.notice_period_days}
//                                     onChange={(e) => {
//                                       const val = e.target.value;
//                                       setFormData({
//                                         ...formData,
//                                         notice_period_days: Number(val),
//                                       });
//                                       if (errors.notice_period_days)
//                                         setErrors({
//                                           ...errors,
//                                           notice_period_days: "",
//                                         });
//                                       calculateNoticeEndDate(
//                                         Number(val),
//                                         formData.resignation_date,
//                                       );
//                                     }}
//                                   />
//                                   {isSubmitted && errors.notice_period_days && (
//                                     <div className="invalid-feedback d-block">
//                                       {errors.notice_period_days}
//                                     </div>
//                                   )}
//                                 </div>
//                                 <div className="col-md-3">
//                                   <label className="form-label fs-13 text-muted">
//                                     Last Working Day
//                                   </label>
//                                   <DatePicker disabled={isViewOnly}
//                                     className="w-100 form-control bg-light border-dashed"
//                                     value={
//                                       formData.notice_period_end_date
//                                         ? dayjs(formData.notice_period_end_date)
//                                         : null
//                                     }
//                                     disabled
//                                     placeholder="System Calculated"
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "device" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="alert alert-soft-info d-flex align-items-center border-0 p-3 shadow-sm mb-4 rounded-3">
//                                 <i className="ti ti-info-circle-filled fs-24 me-3 text-info"></i>
//                                 <div className="fs-13">
//                                   This information is typically captured
//                                   automatically when an employee logs into the
//                                   mobile app for the first time.
//                                 </div>
//                               </div>
//                               <div className="row g-4">
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Mobile Device Unique ID
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     disabled={true}
//                                     value={formData.device_unique_id}
//                                     placeholder="e.g. 3d60c7079ea1ea51"
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Mobile Model Name
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     disabled={true}
//                                     value={formData.device_name}
//                                     placeholder="e.g. Pixel 6 Pro"
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Mobile Device ID
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     disabled={true}
//                                     value={formData.device_id}
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Mobile OS Version Type
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     disabled={true}
//                                     value={formData.device_platform}
//                                     placeholder="Android / iOS"
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13">
//                                     Mobile OS Version number
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     className="form-control"
//                                     disabled={true}
//                                     value={formData.system_version}
//                                     placeholder="e.g. 15"
//                                   />
//                                 </div>
//                                 <div className="col-md-4">
//                                   <label className="form-label fs-13 text-muted">
//                                     Reg. Code
//                                   </label>
//                                   <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                     type="text"
//                                     readOnly
//                                     className="form-control bg-light border-dashed fw-bold text-primary"
//                                     value={formData.random_code_for_reg}
//                                     placeholder="No Code Assigned"
//                                   />
//                                 </div>
//                               </div>
//                             </div>
//                           )}

//                           {activeTab === "group_access" && (
//                             <div className="animate__animated animate__fadeIn">
//                               <div className="border rounded-3 shadow-sm bg-white overflow-hidden">
//                                 <div className="table-responsive">
//                                   <table className="table table-borderless align-middle mb-0">
//                                     <thead className="bg-light border-bottom">
//                                       <tr>
//                                         <th
//                                           scope="col"
//                                           className="ps-4 py-3"
//                                           style={{ width: "25%" }}
//                                         >
//                                           Model
//                                         </th>
//                                         <th
//                                           scope="col"
//                                           className="py-3"
//                                           style={{ width: "30%" }}
//                                         >
//                                           Group
//                                         </th>
//                                         <th
//                                           scope="col"
//                                           className="py-3"
//                                           style={{ width: "30%" }}
//                                         >
//                                           Approval User
//                                         </th>
//                                         <th
//                                           scope="col"
//                                           className="py-3"
//                                           style={{ width: "15%" }}
//                                         >
//                                           Sequence
//                                         </th>
//                                       </tr>
//                                     </thead>
//                                     <tbody>
//                                       {groupAccessLines.map((line, index) => (
//                                         <tr
//                                           key={index}
//                                           className="border-bottom"
//                                         >
//                                           <td
//                                             className="ps-4 py-3"
//                                             style={{ overflow: "visible" }}
//                                           >
//                                             <CommonSelect disabled={isViewOnly}
//                                               options={[
//                                                 {
//                                                   value: "leave",
//                                                   label: "Leave",
//                                                 },
//                                                 {
//                                                   value: "attendance",
//                                                   label: "Attendance",
//                                                 },
//                                                 {
//                                                   value: "expense",
//                                                   label: "Expense",
//                                                 },
//                                               ]}
//                                               placeholder="Select Model"
//                                               defaultValue={[
//                                                 {
//                                                   value: "leave",
//                                                   label: "Leave",
//                                                 },
//                                                 {
//                                                   value: "attendance",
//                                                   label: "Attendance",
//                                                 },
//                                                 {
//                                                   value: "expense",
//                                                   label: "Expense",
//                                                 },
//                                               ].find(
//                                                 (m) => m.value === line.model,
//                                               )}
//                                               onChange={(opt) =>
//                                                 handleLineChange(
//                                                   index,
//                                                   "model",
//                                                   opt?.value || "",
//                                                 )
//                                               }
//                                             />
//                                           </td>
//                                           <td
//                                             className="py-3"
//                                             style={{ overflow: "visible" }}
//                                           >
//                                             <CommonSelect disabled={isViewOnly}
//                                               key={`group-select-${index}-${groupOptions.length}`}
//                                               options={groupOptions}
//                                               placeholder="Select Group"
//                                               defaultValue={groupOptions.find(
//                                                 (g) =>
//                                                   String(g.value) ===
//                                                   String(line.group_id),
//                                               )}
//                                               onChange={(opt) =>
//                                                 handleGroupSelect(
//                                                   index,
//                                                   opt?.value || "",
//                                                 )
//                                               }
//                                             />
//                                           </td>
//                                           <td
//                                             className="py-3"
//                                             style={{ overflow: "visible" }}
//                                           >
//                                             <CommonSelect disabled={isViewOnly}
//                                               key={`user-select-${index}-${line.group_id}-${(groupUserOptions[String(line.group_id)] || []).length}`}
//                                               options={
//                                                 groupUserOptions[
//                                                   String(line.group_id)
//                                                 ] || []
//                                               }
//                                               placeholder={
//                                                 line.group_id
//                                                   ? "Select User"
//                                                   : "Select Group First"
//                                               }
//                                               defaultValue={(
//                                                 groupUserOptions[
//                                                   String(line.group_id)
//                                                 ] || []
//                                               ).find(
//                                                 (u) =>
//                                                   String(u.value) ===
//                                                   String(line.approval_user_id),
//                                               )}
//                                               onChange={(opt) =>
//                                                 handleLineChange(
//                                                   index,
//                                                   "approval_user_id",
//                                                   opt?.value,
//                                                 )
//                                               }
//                                             />
//                                           </td>
//                                           <td className="py-3 pe-4">
//                                             <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                                               type="number"
//                                               className="form-control"
//                                               placeholder="0"
//                                               value={line.approval_sequance}
//                                               onChange={(e) =>
//                                                 handleLineChange(
//                                                   index,
//                                                   "approval_sequance",
//                                                   e.target.value,
//                                                 )
//                                               }
//                                             />
//                                           </td>
//                                         </tr>
//                                       ))}
//                                       {groupAccessLines.length === 0 && (
//                                         <tr>
//                                           <td
//                                             colSpan={4}
//                                             className="text-center py-5 text-muted fst-italic bg-light-subtle"
//                                           >
//                                             <div className="d-flex flex-column align-items-center">
//                                               <i className="ti ti-list-details fs-24 mb-2 opacity-50" />
//                                               <span>
//                                                 No access groups configured yet.
//                                               </span>
//                                             </div>
//                                           </td>
//                                         </tr>
//                                       )}
//                                     </tbody>
//                                   </table>
//                                 </div>
//                                 <div className="p-3 border-top bg-light d-flex align-items-center">
//                                   <button
//                                     type="button"
//                                     className="btn btn-sm btn-primary d-flex align-items-center shadow-sm px-3 rounded-pill"
//                                     onClick={() =>
//                                       setGroupAccessLines([
//                                         ...groupAccessLines,
//                                         {
//                                           model: "leave",
//                                           group_id: "",
//                                           approval_user_id: "",
//                                           approval_sequance: 0,
//                                         },
//                                       ])
//                                     }
//                                   >
//                                     <i className="ti ti-plus me-1" /> Add New
//                                     Line
//                                   </button>
//                                   <small className="text-muted ms-3">
//                                     Configure who can approve requests for
//                                     specific modules.
//                                   </small>
//                                 </div>
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>
//                     </div>

//                     {/* --- WIZARD FOOTER (Sticky) --- */}
//                     <div className="p-3 bg-white border-top shadow-lg d-flex justify-content-between align-items-center sticky-bottom z-3 mt-auto">
//                       <div>
//                         <button
//                           type="button"
//                           className="btn btn-outline-secondary px-4 fw-medium rounded-pill"
//                           onClick={handlePrevStep}
//                           disabled={isFirstTab}
//                         >
//                           <i className="ti ti-arrow-left me-2"></i> Previous
//                         </button>
//                       </div>

//                       <div className="d-flex align-items-center gap-2 d-none d-md-flex">
//                         {tabConfig.map((_, idx) => (
//                           <div
//                             key={idx}
//                             className={`rounded-circle transition-all ${idx === currentTabIndex ? "bg-primary" : "bg-secondary opacity-25"}`}
//                             style={{
//                               width: idx === currentTabIndex ? "12px" : "8px",
//                               height: "8px",
//                             }}
//                           />
//                         ))}
//                       </div>

//                       <div>
//                         {!isLastTab ? (
//                           <button
//                             type="button"
//                             className="btn btn-primary px-4 fw-medium rounded-pill"
//                             onClick={handleNextStep}
//                           >
//                             Next Step <i className="ti ti-arrow-right ms-2"></i>
//                           </button>
//                         ) : (
//                           <button
//                             type="submit"
//                             className="btn btn-success px-5 fw-bold shadow-sm rounded-pill"
//                             disabled={isSubmitting}
//                           >
//                             {isSubmitting ? (
//                               <>
//                                 <span className="spinner-border spinner-border-sm me-2" />{" "}
//                                 Processing...
//                               </>
//                             ) : preventClose ? (
//                               <>
//                                 <i className="ti ti-check me-2"></i> Complete
//                                 Profile
//                               </>
//                             ) : (
//                               <>
//                                 <i className="ti ti-device-floppy me-2"></i>{" "}
//                                 Save Employee
//                               </>
//                             )}
//                           </button>
//                         )}
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </form>
//             </div>
//           </div>
//         </div>
//       </div>

//       {/* EXPERIENCE DOCUMENTS VAULT MODAL */}
//       {showExpModal && (
//         <div
//           className="modal fade show d-block animate__animated animate__fadeIn"
//           style={{
//             backgroundColor: "rgba(0,0,0,0.5)",
//             zIndex: 1100,
//             backdropFilter: "blur(4px)",
//           }}
//         >
//           <div className="modal-dialog modal-dialog-centered modal-lg">
//             <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
//               <div className="modal-header bg-white border-bottom px-4 py-3">
//                 <h6 className="modal-title fw-bold text-dark d-flex align-items-center">
//                   <i className="ti ti-folder-open me-2 text-primary fs-20"></i>{" "}
//                   Experience Documents Vault
//                 </h6>
//                 <button
//                   type="button"
//                   className="btn-close"
//                   onClick={() => setShowExpModal(false)}
//                 ></button>
//               </div>
//               <div className="modal-body p-4 bg-light-subtle">
//                 <div className="bg-white p-3 rounded-4 border shadow-sm mb-4">
//                   <div className="row g-3 align-items-end">
//                     <div className="col-md-5">
//                       <label className="form-label fs-12 fw-bold text-muted">
//                         Category
//                       </label>
//                       <select disabled={isViewOnly || isSubmitting}
//                         className="form-select fs-13"
//                         value={tempDoc.category}
//                         onChange={(e) =>
//                           setTempDoc({ ...tempDoc, category: e.target.value })
//                         }
//                         style={{ height: "40px", borderRadius: "8px" }}
//                       >
//                         <option value="">Select Category...</option>
//                         {docCategories.map((cat) => (
//                           <option key={cat.value} value={cat.value}>
//                             {cat.label}
//                           </option>
//                         ))}
//                       </select>
//                     </div>
//                     <div className="col-md-5">
//                       <label className="form-label fs-12 fw-bold text-muted">
//                         Source File
//                       </label>
//                       <input disabled={isViewOnly || isSubmitting} readOnly={isViewOnly}
//                         type="file"
//                         id="vault-file-input-single"
//                         className="form-control fs-13"
//                         style={{ height: "40px", borderRadius: "8px" }}
//                         onChange={(e) =>
//                           setTempDoc({
//                             ...tempDoc,
//                             file: e.target.files?.[0] || null,
//                           })
//                         }
//                       />
//                     </div>
//                     <div className="col-md-2">
//                       <button
//                         type="button"
//                         className="btn btn-primary w-100 fw-bold fs-13"
//                         style={{ height: "40px", borderRadius: "8px" }}
//                         disabled={!tempDoc.category || !tempDoc.file}
//                         onClick={handleStageDocument}
//                       >
//                         ADD
//                       </button>
//                     </div>
//                   </div>
//                 </div>
//                 <p className="fs-11 fw-bold text-uppercase text-muted mb-3 tracking-wider">
//                   Staged Documents ({experienceDocs.length})
//                 </p>
//                 <div
//                   className="row g-3 hide-scrollbar"
//                   style={{ maxHeight: "320px", overflowY: "auto" }}
//                 >
//                   {experienceDocs.length > 0 ? (
//                     experienceDocs.map((doc, index) => (
//                       <div key={index} className="col-md-4">
//                         <div className="card h-100 border-0 shadow-sm text-center p-3 position-relative bg-white rounded-4">
//                           <button
//                             className="btn btn-ghost-danger btn-icon btn-sm position-absolute"
//                             style={{ top: "5px", right: "5px" }}
//                             onClick={() =>
//                               setExperienceDocs(
//                                 experienceDocs.filter((_, i) => i !== index),
//                               )
//                             }
//                           >
//                             <i className="ti ti-trash fs-16"></i>
//                           </button>
//                           <div className="mb-2">
//                             <i className="ti ti-folder-filled text-warning fs-40"></i>
//                           </div>
//                           <h6
//                             className="fs-12 fw-bold text-dark mb-1 text-truncate"
//                             title={doc.file?.name}
//                           >
//                             {doc.file?.name}
//                           </h6>
//                           <div className="d-flex flex-column gap-2 mt-2">
//                             <span className="badge bg-light text-primary border border-primary-subtle fs-10 text-capitalize py-1 px-2 rounded-pill mx-auto">
//                               {doc.category.replace("_", " ")}
//                             </span>
//                             <button
//                               type="button"
//                               className="btn btn-soft-info btn-sm fs-10 fw-bold py-1 mx-auto rounded-pill"
//                               onClick={() => handleViewFile(doc)}
//                             >
//                               <i className="ti ti-eye me-1"></i> VIEW
//                             </button>
//                           </div>
//                         </div>
//                       </div>
//                     ))
//                   ) : (
//                     <div className="col-12 text-center py-5 border rounded-4 border-dashed bg-white opacity-75">
//                       <p className="text-muted fs-12 mb-0">
//                         No documents staged for upload.
//                       </p>
//                     </div>
//                   )}
//                 </div>
//               </div>
//               <div className="modal-footer border-top bg-white p-3">
//                 <button
//                   type="button"
//                   className="btn btn-light btn-sm px-4 fw-bold rounded-pill"
//                   onClick={() => setShowExpModal(false)}
//                 >
//                   Close
//                 </button>
//                 <button
//                   type="button"
//                   className="btn btn-primary btn-sm px-4 fw-bold shadow-sm rounded-pill"
//                   onClick={() => setShowExpModal(false)}
//                 >
//                   Sync Documents
//                 </button>
//               </div>
//             </div>
//           </div>
//         </div>
//       )}
//     </>,
//     document.body,
//   );
// };

// export default AddEditEmployeeModal2;
