import Instance from "../../../api/axiosInstance";

export interface Employee {
  id?: string;
  name: string;
  father_name: string;
  client_id: string;
  site_id: string;
  unit_branch: string;
  attendance_policy: string;
  employee_category: string;
  working_hours: string;
  shift_roster: string;
  timezone: string;
  is_geo_tracking: boolean;
  aadhaar_number: string;
  pan_number: string;
  voter_id: string;
  passport_no: string;
  driving_license: string;
  is_uan_applicable: boolean;
  uan_number: string;
  esi_number: string;
  user_id: number;
}

const getUserId = () => {
  const id = localStorage.getItem("user_id");
  return id ? Number(id) : null;
};

export const getEmployees = async () => {
  try {
    const response = await Instance.get("/api/employees", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

// export const getEmployees = async () => {
//   const userId = getUserId() || 3145; // fallback user ID

//   try {
//     const response = await axios.get(
//       "http://178.236.185.232:9090/api/employees",
//       {
//         params: { user_id: userId },
//       },
//     );

//     // Return response.data.data if exists, else response.data, else empty array
//     return response.data?.data || response.data || [];
//   } catch (error) {
//     console.error("Error fetching employees:", error);
//     return [];
//   }
// };

// export const getEmployees = async () => {
//   const userId = getUserId() || 3145;

//   try {
//     // We now use 'Instance' instead of raw 'axios'
//     // The interceptor will automatically add headers.Authorization
//     const response = await Instance.get("/employees", {
//       params: { user_id: userId },
//     });

//     return response.data?.data || [];
//   } catch (error) {
//     console.error("Error fetching employees:", error);
//     // Returning empty array so your .map() functions don't crash
//     return [];
//   }
// };

// export const getEmployees = async () => {
//   const userId = getUserId() || 3145;

//   try {
//     const response = await InstanceSecond.get("api/employees", {
//       params: { user_id: userId },
//     });

//     return response.data?.data || [];
//   } catch (error: any) {
//     console.error("Error fetching employees:", error);
//     toast.error(error.response?.data?.message || "Failed to load departments");
//     return [];
//   }
// };

export const getEmployeesBasicInfo = async () => {
  try {
    const response = await Instance.get("/api/employees/basic-info", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

// ... existing imports and code

// --- NEW ADDITIONS FOR APPROVAL TAB ---

export const getApprovalGroups = async () => {
  try {
    // Calling: http://localhost:4000/api/groups
    // Note: If Instance base URL is different, use the full URL: await Instance.get("http://localhost:4000/api/groups")
    const response = await Instance.get("/api/get_group_list", {
      params: { user_id: getUserId() },
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching approval groups:", error);
    return [];
  }
};

export const getGroupUsers = async (groupId: string, userId?: string) => {
  if (!groupId) return [];
  try {
    // Calling: http://localhost:4000/api/groups/users?group_id=69
    const response = await Instance.get("/api/get_user_group_users", {
      params: { group_id: groupId, user_id: userId || getUserId() },
    });
    return response.data || [];
  } catch (error) {
    console.error("Error fetching group users:", error);
    return [];
  }
};

// Add to EmployeeServices.ts

// export const getBusinessTypes = async () => {
//   const response = await Instance.get("/employee/business-types", {
//     params: { user_id: getUserId() },
//   });
//   return response.data.data || [];
// };

// export const getBusinessLocations = async () => {
//   const response = await Instance.get("/employee/business_locations", {
//     params: { user_id: getUserId() },
//   });
//   return response.data.data || [];
// };

export const getDepartments = async () => {
  const response = await Instance.get("/api/department", {
    params: { user_id: getUserId() },
  });
  return response.data.data || [];
};

// export const getDesignations = async () => {
//   const response = await Instance.get("/api/job/list", {
//     params: { user_id: getUserId() },
//   });
//   return response.data.data || [];
// };

// Add or update this in EmployeeServices.ts
export const getDesignations = async (departmentId?: string) => {
  const params: any = { user_id: getUserId() }; // Use your current user_id logic
  if (departmentId) {
    params.department_id = departmentId;
  }

  const response = await Instance.get("/api/job_position", { params });
  return response.data.data || [];
};

export const getWorkLocations = async () => {
  const response = await Instance.get("/api/work-location", {
    params: { user_id: getUserId() },
  });
  return response.data.data || [];
};

export const getReportingManagers = async () => {
  const response = await Instance.get("/api/employees/basic-info", {
    params: { user_id: getUserId() },
  });
  return response.data.data || [];
};

// Add these to EmployeeServices.ts

export const getAttendancePolicies = async () => {
  try {
    const response = await Instance.get("/employee/attendance-policies", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getWorkingSchedules = async () => {
  try {
    const response = await Instance.get("/api/WorkingSchedules", {
      params: { user_id: getUserId() },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getShiftRosters = async () => {
  try {
    const response = await Instance.get("/api/shift_rosters", {
      params: { user_id: getUserId() },
    });
    // Assuming the API returns the standard structure { status, data: [...] }
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Error fetching shift rosters:", error);
    return [];
  }
};

// Add to EmployeeServices.ts
export const getCountries = async () => {
  try {
    const response = await Instance.get("/api/countries", {
      params: { user_id: getUserId() },
    });
    // Assuming it returns { data: [{ id: 1, name: 'India' }] }
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getBranches = async () => {
  try {
    const response = await Instance.get("/api/branches", {
      params: { user_id: getUserId() },
    });
    // Assuming the API returns { status: "success", data: [...] }
    return response.data.data || response.data || [];
  } catch (error) {
    console.error("Error fetching branches:", error);
    return [];
  }
};

// export const getStates = async () => {
//   try {
//     const response = await Instance.get("/api/states");
//     return response.data.data || response.data || [];
//   } catch (error) {
//     return [];
//   }
// };

// export const getStates = async (countryId?: string) => {
//   try {
//     const response = await Instance.get(`/api/states`, {
//       params: { country_id: countryId || "104", user_id: getUserId() }, // Default to India if not provided
//     });
//     return response.data.data || response.data || [];
//   } catch (error) {
//     return [];
//   }
// };

// Fetch states for a given country (defaults to India)
export const getStates = async (countryId?: string) => {
  const params = {
    user_id: getUserId(), // Always include user ID
    country_id: countryId ?? "104", // Use provided countryId or default to India
  };

  try {
    const response = await Instance.get("/api/states", { params });

    // Prefer structured data if available
    if (response?.data?.data) return response.data.data;
    if (response?.data) return response.data;

    return [];
  } catch (error) {
    console.error("Failed to fetch states:", error);
    return [];
  }
};

export const getBanks = async () => {
  try {
    const response = await Instance.get("/api/bank-account/list", {
      params: { user_id: getUserId() },
    });
    // The API returns data under the "bank_accounts" key
    return response.data.bank_accounts || [];
  } catch (error) {
    console.error("Error fetching banks:", error);
    return [];
  }
};

// export const getDistricts = async () => {
//   try {
//     const response = await Instance.get("/api/city");
//     return response.data.data || response.data || [];
//   } catch (error) {
//     return [];
//   }
// };

export const getDistricts = async (countryId: string, stateId: string) => {
  try {
    const response = await Instance.get("/api/districts", {
      params: {
        country_id: countryId,
        state_id: stateId,
        user_id: getUserId(),
      },
    });
    return response.data.data || response.data || [];
  } catch (error) {
    return [];
  }
};

export const getTimezones = async () => {
  try {
    const response = await Instance.get("/api/timezones");
    // Returning the data array which contains {value, label} objects
    return response.data.data || [];
  } catch (error) {
    console.error("Error fetching timezones:", error);
    return [];
  }
};

export const addEmployee = async (payload: any) => {
  const userId = getUserId() || 219;
  return await Instance.post(`/api/employee/create`, payload, {
    params: { user_id: userId },
  });
};

export const importEmployees = async (base64File: string) => {
  const userId = getUserId() || 2;
  return await Instance.post(
    `/api/employee/import`,
    { file: base64File },
    { params: { user_id: userId } }
  );
};

export const getLocationByPincode = async (pincode: string) => {
  try {
    const response = await Instance.get("/api/get_location_by_pincode", {
      params: { pincode, user_id: getUserId() },
    });
    return { data: response.data?.data || null, error: null };
  } catch (error: any) {
    const message = error?.response?.data?.message || "Pincode not found";
    return { data: null, error: message };
  }
};

export const getDepartureReasons = async () => {
  const userId = localStorage.getItem("user_id");
  const res = await Instance.get(`/api/departure_reason?user_id=${userId}`);
  return res.data?.data || res.data || [];
};

export const archiveEmployee = async (
  id: string,
  payload: {
    departure_reason_id: number;
    departure_date: string;
    departure_description: string;
  },
) => {
  const res = await Instance.post(`/api/archive_employee/${id}`, payload, {
    params: { user_id: getUserId() },
  });
  return res.data;
};

// export const addEmployee = async (payload: any) => {
//   const userId = getUserId() || 2;
//   return await InstanceSecond.post("/api/employee/create", payload);
// };

export const updateEmployee = async (id: string, data: any) => {
  const payload = { ...data }; // your request body
  return await Instance.put(`/api/update_employee/`, payload, {
    params: { user_id: getUserId(), emp_id: id }, // query params
  });
};

export const deleteEmployee = async (id: string) => {
  return await Instance.delete(`/employee/${id}`, {
    params: { user_id: getUserId() },
  });
};
