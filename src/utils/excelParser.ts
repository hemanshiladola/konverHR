import * as XLSX from "xlsx";
import ExcelJS from "exceljs";
import { saveAs } from "file-saver";

export const generateBulkUploadTemplate = async (masters: any) => {
  const workbook = new ExcelJS.Workbook();
  
  // -------------------------------------------------------------
  // 1. CREATE INSTRUCTIONS SHEET (Colorful & Detailed)
  // -------------------------------------------------------------
  const instructionsSheet = workbook.addWorksheet("Instructions", {
    properties: { tabColor: { argb: 'FFFF0000' } } // Red Tab!
  });
  
  instructionsSheet.columns = [{ width: 5 }, { width: 110 }];
  
  // Title
  instructionsSheet.mergeCells('B2:B3');
  const titleCell = instructionsSheet.getCell('B2');
  titleCell.value = "🎯 Employee Bulk Upload Master Guide";
  titleCell.font = { name: 'Arial', bold: true, size: 20, color: { argb: 'FFFFFFFF' } };
  titleCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF004C8F' } };
  titleCell.alignment = { vertical: 'middle', horizontal: 'center' };
  
  // Subtitle
  instructionsSheet.getCell('B5').value = "📋 How to use this template properly:";
  instructionsSheet.getCell('B5').font = { bold: true, size: 14, color: { argb: 'FFC00000' } };
  
  const rules = [
    "✅ Do NOT rename, move, or delete any columns in the 'Employee_Data' sheet or the parsing will fail.",
    "✅ Columns marked with an asterisk (*) are MANDATORY. You cannot skip them.",
    "✅ Dropdowns: Many columns contain predefined dropdowns. You MUST select an exact value from the list.",
    "✅ Dates: ALL Dates MUST strictly follow the exact YYYY-MM-DD format (example: 2024-05-31).",
    "✅ Mobile Numbers: Must be exactly 10 digits without prefixes (+91).",
    "✅ Sample Data: The row immediately below the headers is filled with Sample Data to guide you. Please overwrite it.",
    "✅ Once completely filled out, save this document and upload it through the Web Portal."
  ];

  let rowIdx = 7;
  rules.forEach(rule => {
    const cell = instructionsSheet.getCell(`B${rowIdx}`);
    cell.value = rule;
    cell.font = { name: 'Arial', size: 12 };
    // Add subtle background banding for readability
    if (rowIdx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };
    cell.alignment = { vertical: 'middle' };
    rowIdx += 2;
  });

  // Highlight warnings
  instructionsSheet.getCell(`B${rowIdx + 1}`).value = "⚠️ CRITICAL: Ensure you do NOT leave empty blank rows between employees.";
  instructionsSheet.getCell(`B${rowIdx + 1}`).font = { bold: true, size: 12, color: { argb: 'FFFF0000' } };


  // -------------------------------------------------------------
  // 2. CREATE MAIN DATA SHEET
  // -------------------------------------------------------------
  const worksheet = workbook.addWorksheet("Employee_Data", {
    views: [{ state: 'frozen', ySplit: 1 }], // FREEZE TOP ROW
    properties: { tabColor: { argb: 'FF92D050' } } // Green Tab!
  });

  // Grouped Headers with specific Theme Colors
  const headerGroups = [
    // 1. BASIC INFO (Blue)
    { h: "Employee Name *", c: "FF0F4C81" },
    { h: "Father's Name *", c: "FF0F4C81" },
    { h: "Department *", c: "FF0F4C81" },
    { h: "Designation *", c: "FF0F4C81" },
    { h: "Branch *", c: "FF0F4C81" },
    { h: "Attendance Policy *", c: "FF0F4C81" },
    // 2. TIMING & TRACKING (Orange)
    { h: "Working Schedule (Resource Calendar)", c: "FFED7D31" },
    { h: "Shift Roster", c: "FFED7D31" },
    { h: "Timezone (Default: Asia/Kolkata)", c: "FFED7D31" },
    { h: "Geo Tracking (Yes/No)", c: "FFED7D31" },
    // 3. STATUTORY (Purple)
    { h: "Aadhaar Number", c: "FF7030A0" },
    { h: "PAN Number", c: "FF7030A0" },
    { h: "Voter ID", c: "FF7030A0" },
    { h: "Passport No", c: "FF7030A0" },
    { h: "Probation Period (Months)", c: "FF7030A0" },
    { h: "In Probation (Yes/No)", c: "FF7030A0" },
    { h: "UAN Number Applicable (Yes/No)", c: "FF7030A0" },
    { h: "UAN Number", c: "FF7030A0" },
    { h: "ESI Number", c: "FF7030A0" },
    { h: "Category (general/obc/sc/st)", c: "FF7030A0" },
    // 4. PERSONAL (Green)
    { h: "Gender (Male/Female)", c: "FF548235" },
    { h: "Marital Status (single/married/divorced/widowed)", c: "FF548235" },
    { h: "Spouse Name", c: "FF548235" },
    { h: "Date of Marriage (YYYY-MM-DD)", c: "FF548235" },
    { h: "Birthday (YYYY-MM-DD) *", c: "FF548235" },
    { h: "Blood Group (O+, A+, etc.)", c: "FF548235" },
    { h: "Post Graduation Name", c: "FF548235" },
    { h: "Other Education", c: "FF548235" },
    { h: "Total Experience", c: "FF548235" },
    { h: "Country", c: "FF548235" },
    { h: "State", c: "FF548235" },
    { h: "District", c: "FF548235" },
    { h: "Religion", c: "FF548235" },
    // 5. CONTACT (Teal)
    { h: "Work Phone", c: "FF00B0F0" },
    { h: "Mobile Phone *", c: "FF00B0F0" },
    { h: "Private Email *", c: "FF00B0F0" },
    { h: "Present Address", c: "FF00B0F0" },
    { h: "Permanent Address", c: "FF00B0F0" },
    { h: "Pin Code", c: "FF00B0F0" },
    { h: "Joining Date (YYYY-MM-DD) *", c: "FF00B0F0" },
    { h: "Emergency Contact Name", c: "FF00B0F0" },
    { h: "Emergency Contact Relation", c: "FF00B0F0" },
    { h: "Emergency Contact Mobile", c: "FF00B0F0" },
    { h: "Emergency Contact Address", c: "FF00B0F0" },
    // 6. BANKING (Dark Red)
    { h: "Bank Name", c: "FFC00000" },
    { h: "Account Number", c: "FFC00000" },
    { h: "Bank IFSC Code", c: "FFC00000" },
    { h: "Bank SWIFT Code", c: "FFC00000" },
    { h: "Currency (Default: INR)", c: "FFC00000" },
    // 7. ORG DETAILS (Dark Grey)
    { h: "Employment Type (permanent/contract/intern/probation)", c: "FF404040" },
    { h: "Employee Password", c: "FF404040" },
    { h: "Status (active/inactive)", c: "FF404040" },
    { h: "Reporting Manager", c: "FF404040" },
    { h: "Head Of Department", c: "FF404040" }
  ];

  const headers = headerGroups.map(hg => hg.h);

  // Set columns and widths dynamically
  worksheet.columns = headers.map(h => ({ header: h, key: h, width: Math.max(h.length + 4, 18) }));

  // Colorize Top Header Cell by Cell
  const headerRow = worksheet.getRow(1);
  headerRow.height = 35;
  
  headerGroups.forEach((group, index) => {
    const cell = headerRow.getCell(index + 1);
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: group.c } };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    // Add border to visually separate
    cell.border = {
      top: {style:'medium', color: {argb:'FFFFFFFF'}},
      left: {style:'medium', color: {argb:'FFFFFFFF'}},
      bottom: {style:'medium', color: {argb:'FFFFFFFF'}},
      right: {style:'medium', color: {argb:'FFFFFFFF'}}
    };
  });

  const getFirst = (list: any[]) => (list && list.length > 0 ? list[0].label : "");
  
  // Extract purely labels
  const depts = (masters.departments || []).map((d: any) => d.label).filter(Boolean);
  const desigs = (masters.designations || []).map((d: any) => d.label).filter(Boolean);
  const branches = (masters.branches || []).map((d: any) => d.label).filter(Boolean);
  const policies = (masters.attendancePolicies || []).map((d: any) => d.label).filter(Boolean);
  const schedules = (masters.workingSchedules || []).map((d: any) => d.label).filter(Boolean);
  const rosters = (masters.shiftRosters || []).map((d: any) => d.label).filter(Boolean);
  const countries = (masters.countries || []).map((d: any) => d.label).filter(Boolean);
  const states = (masters.states || []).map((d: any) => d.label).filter(Boolean);
  const banks = (masters.banks || []).map((d: any) => d.label).filter(Boolean);
  const managers = (masters.managers || []).map((d: any) => d.label).filter(Boolean);

  const yesNoEnum = ["Yes", "No"];
  const genderEnum = ["Male", "Female"];
  const maritalEnum = ["single", "married","cohabitant", "divorced", "widowed"];
  const statusEnum = ["active", "inactive"];
  const empTypeEnum = ["permanent", "contract", "intern", "probation"];
  const categoryEnum = ["general", "obc", "sc","st", "others"];

  // 1. Add sample data FIRST so it sits on Row 2
  const sampleDataRow = worksheet.addRow([
    "John Doe",
    "Richard Doe",
    getFirst(masters.departments) || "IT",
    getFirst(masters.designations) || "Software Engineer",
    getFirst(masters.branches) || "HQ",
    getFirst(masters.attendancePolicies) || "Standard",
    getFirst(masters.workingSchedules) || "Standard 40 Hours",
    getFirst(masters.shiftRosters) || "Morning Shift",
    "Asia/Kolkata",
    "No",
    "123456789012",
    "ABCDE1234F",
    "ABC1234567",
    "Z9876543",
    "6",
    "Yes",
    "No",
    "",
    "",
    "general",
    "Male",
    "single",
    "Jane Doe",
    "",
    "1995-05-15",
    "O+",
    "MCA",
    "BCA",
    "3 Years",
    getFirst(masters.countries) || "India",
    getFirst(masters.states) || "Maharashtra",
    "Mumbai",
    "Hindu",
    "0221234567",
    "9876543210",
    "johndoe@example.com",
    "123 Main St, Tech Park",
    "123 Main St, Tech Park",
    "400001",
    "2024-01-15",
    "Jane Doe",
    "Sister",
    "9876543211",
    "Same as above",
    getFirst(masters.banks) || "HDFC Bank",
    "000111222333",
    "HDFC0001234",
    "",
    "INR",
    "permanent",
    "password123",
    "active",
    getFirst(masters.managers) || "Boss Man",
    getFirst(masters.managers) || "Director Man"
  ]);

  // Make sample row text italic and gray to look like "Sample"
  sampleDataRow.font = { italic: true, color: { argb: 'FF808080' } };
  sampleDataRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF2F2F2' } };

  // 2. NOW apply validations to rows 2 to 1000
  const applyValidation = (colLetter: string, list: string[]) => {
    if (!list || list.length === 0) return;
    
    // Safely combine list into a comma-separated string, stripping any " inside data
    let str = list.map(item => item.replace(/"/g, '')).join(",");
    if (str.length > 250) {
      str = str.substring(0, 250);
      const lastComma = str.lastIndexOf(",");
      if (lastComma > 0) str = str.substring(0, lastComma);
    }
    
    const safeFormula = `"${str}"`;

    for (let row = 2; row <= 1000; row++) {
      worksheet.getCell(`${colLetter}${row}`).dataValidation = {
        type: 'list',
        allowBlank: true,
        showErrorMessage: true,
        formulae: [safeFormula]
      };
    }
  };

  applyValidation("C", depts);
  applyValidation("D", desigs);
  applyValidation("E", branches);
  applyValidation("F", policies);
  applyValidation("G", schedules);
  applyValidation("H", rosters);
  
  applyValidation("AD", countries);
  applyValidation("AE", states);
  applyValidation("AS", banks);
  
  applyValidation("BA", managers);
  applyValidation("BB", managers);

  applyValidation("J", yesNoEnum); 
  applyValidation("P", yesNoEnum); 
  applyValidation("Q", yesNoEnum); 

  applyValidation("U", genderEnum); 
  applyValidation("V", maritalEnum); 
  applyValidation("AZ", statusEnum); 
  applyValidation("AX", empTypeEnum); 
  applyValidation("T", categoryEnum);

  // Apply Date Number Formats to purely date columns
  for (let row = 2; row <= 1000; row++) {
    worksheet.getCell(`X${row}`).numFmt = 'yyyy-mm-dd'; // Marriage
    worksheet.getCell(`Y${row}`).numFmt = 'yyyy-mm-dd'; // Birthday
    worksheet.getCell(`AN${row}`).numFmt = 'yyyy-mm-dd'; // Joining
  }

  // Generate file in-browser and save
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
  saveAs(blob, "Konvert_Employee_Bulk_Upload.xlsx");
};

export const parseExcelFile = (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        // Proceed with SheetJS purely for robust parsing into JSON
        const workbook = XLSX.read(data, { type: "binary", dateNF: 'yyyy-mm-dd' });
        
        // Find "Employee_Data" sheet reliably instead of relying on index 0
        const sheetName = workbook.SheetNames.find(n => n.includes("Employee_Data")) || workbook.SheetNames[0]; 
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: "" });
        
        // Filter out completely blank rows or instruction title rows just in case
        const validRows = jsonData.filter((r: any) => r["Employee Name *"] && r["Department *"]);
        resolve(validRows);
      } catch (error) {
        reject(error);
      }
    };
    reader.onerror = (error) => reject(error);
    reader.readAsBinaryString(file);
  });
};

export const mapExcelRowToPayload = (
  row: any,
  masters: any
) => {
  const findId = (list: any[], value: string) => {
    if (!value || !list) return "";
    const lowerVal = value.toString().toLowerCase().trim();
    const match = list.find((item) => {
      const label = (item.label || item.name || "").toString().toLowerCase().trim();
      return label === lowerVal;
    });
    return match ? String(match.value || match.id) : "";
  };

  const toBool = (val: string) => val && val.toString().toLowerCase() === "yes";

  return {
    name: row["Employee Name *"] || "",
    father_name: row["Father's Name *"] || "",
    department_id: findId(masters.departments, row["Department *"]),
    job_id: findId(masters.designations, row["Designation *"]),
    name_of_client: findId(masters.branches, row["Branch *"]), 
    attendance_policy_id: findId(masters.attendancePolicies, row["Attendance Policy *"]),
    
    resource_calendar_id: findId(masters.workingSchedules, row["Working Schedule (Resource Calendar)"]),
    shift_roster_id: findId(masters.shiftRosters, row["Shift Roster"]),
    timezone: row["Timezone (Default: Asia/Kolkata)"] || "Asia/Kolkata",
    is_geo_tracking: toBool(row["Geo Tracking (Yes/No)"]),
    
    aadhaar_number: row["Aadhaar Number"] ? String(row["Aadhaar Number"]) : "",
    pan_number: row["PAN Number"] ? String(row["PAN Number"]) : "",
    voter_id: row["Voter ID"] ? String(row["Voter ID"]) : "",
    passport_no: row["Passport No"] ? String(row["Passport No"]) : "",
    
    probation_period: isNaN(Number(row["Probation Period (Months)"])) ? 6 : Number(row["Probation Period (Months)"]),
    in_probation: toBool(row["In Probation (Yes/No)"]),
    is_uan_number_applicable: toBool(row["UAN Number Applicable (Yes/No)"]),
    uan_number: row["UAN Number"] ? String(row["UAN Number"]) : "",
    esi_number: row["ESI Number"] ? String(row["ESI Number"]) : "",
    
    category: (row["Category (general/obc/sc/st)"] || "general").toLowerCase(),
    gender: (row["Gender (Male/Female)"] || "male").toLowerCase(),
    marital: (row["Marital Status (single/married/divorced/widowed)"] || "single").toLowerCase(),
    spouse_name: row["Spouse Name"] || "",
    date_of_marriage: row["Date of Marriage (YYYY-MM-DD)"] || null,
    birthday: row["Birthday (YYYY-MM-DD) *"] || null,
    blood_group: row["Blood Group (O+, A+, etc.)"] || "",
    
    name_of_post_graduation: row["Post Graduation Name"] || "",
    name_of_any_other_education: row["Other Education"] || "",
    total_experiance: String(row["Total Experience"] || ""),
    
    country_id: findId(masters.countries, row["Country"]) || "104", // Fallback to India
    state_id: findId(masters.states, row["State"]),
    district_id: findId(masters.districts, row["District"]),
    religion: row["Religion"] || "",
    
    work_phone: row["Work Phone"] ? String(row["Work Phone"]) : "",
    mobile_phone: row["Mobile Phone *"] ? String(row["Mobile Phone *"]) : "",
    private_email: row["Private Email *"] ? String(row["Private Email *"]) : "",
    
    present_address: row["Present Address"] || "",
    permanent_address: row["Permanent Address"] || "",
    pin_code: row["Pin Code"] ? String(row["Pin Code"]) : "",
    joining_date: row["Joining Date (YYYY-MM-DD) *"] || "",
    
    emergency_contact_name: row["Emergency Contact Name"] || "",
    emergency_contact_relation: row["Emergency Contact Relation"] || "",
    emergency_contact_mobile: row["Emergency Contact Mobile"] ? String(row["Emergency Contact Mobile"]) : "",
    emergency_contact_address: row["Emergency Contact Address"] || "",
    
    bank_id: findId(masters.banks, row["Bank Name"]),
    account_number: row["Account Number"] ? String(row["Account Number"]) : "",
    bank_iafc_code: row["Bank IFSC Code"] ? String(row["Bank IFSC Code"]) : "",
    bank_swift_code: row["Bank SWIFT Code"] ? String(row["Bank SWIFT Code"]) : "",
    currency_id: row["Currency (Default: INR)"] || "INR",
    
    employment_type: (row["Employment Type (permanent/contract/intern/probation)"] || "permanent").toLowerCase(),
    employee_password: row["Employee Password"] ? String(row["Employee Password"]) : "",
    status: (row["Status (active/inactive)"] || "active").toLowerCase(),
    
    reporting_manager_id: findId(masters.managers, row["Reporting Manager"]),
    head_of_department_id: findId(masters.managers, row["Head Of Department"]),

    employee_category: "staff",
    attendance_capture_mode: "mobile",
    image_1920: null,
    driving_license: null,
    upload_passbook: null,
    cv_file: null,
    in_notice_period: false,
    notice_period_days: 0,
    hold_status: false
  };
};

export const validateExcelRow = (row: any, payload: any) => {
  const errors: string[] = [];

  if (!payload.name) errors.push("Name is required");
  if (!payload.father_name) errors.push("Father's Name is required");
  if (!payload.department_id) errors.push(`Invalid/Missing Dept: ${row["Department *"]}`);
  if (!payload.job_id) errors.push(`Invalid/Missing Desig: ${row["Designation *"]}`);
  if (!payload.name_of_client) errors.push(`Invalid/Missing Branch: ${row["Branch *"]}`);
  if (!payload.attendance_policy_id) errors.push(`Invalid/Missing Policy: ${row["Attendance Policy *"]}`);
  
  if (!payload.mobile_phone || !/^[0-9]{10}$/.test(payload.mobile_phone)) 
    errors.push("Valid 10-digit Mobile Phone required");
  
  if (!payload.private_email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.private_email))
    errors.push("Valid Email required");

  if (!payload.joining_date || !/^\d{4}-\d{2}-\d{2}$/.test(payload.joining_date))
    errors.push("Joining Date must be YYYY-MM-DD");

  if (!payload.birthday || !/^\d{4}-\d{2}-\d{2}$/.test(payload.birthday))
    errors.push("Birthday must be YYYY-MM-DD");

  return errors;
};
