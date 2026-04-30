import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import AddEditEmployeeModal from "./AddEditEmployeeModal";
import { getEmployees, deleteEmployee, Employee } from "./EmployeeServices";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import EmployeeCard from "./EmployeeCard";
import DatatableKHR from "@/CommonComponent/DataTableKHR/DatatableKHR";
import ArchiveEmployeeModal from "./ArchiveEmployeeModal";
import AddEditEmployeeModal2 from "./AddEditEmployeeModal2";
import dayjs from "dayjs";
import { createPortal } from "react-dom";
import BulkUploadModal from "./BulkUploadModal";

const EmployeeKHR = () => {
  const navigate = useNavigate();
  const routes = all_routes;

  const userRole = localStorage.getItem("user_role");
  const isAdmin = userRole === "REGISTER_ADMIN";

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<Employee[]>([]); // ✅ Added for filtering
  const [loading, setLoading] = useState(true);
  const [editData, setEditData] = useState<any>(null);
  const [selectedDraft, setSelectedDraft] = useState<any>(null);
  const [isViewMode, setIsViewMode] = useState<boolean>(false); // ✅ NEW: State for loading a specific draft

  const [viewType, setViewType] = useState<"grid" | "list">("grid");
  const [archiveId, setArchiveId] = useState<number | null>(null);
  // ✅ Filter States
  const [searchText, setSearchText] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterStatus, setFilterStatus] = useState(""); // ✅ Added Status Filter State

  // ✅ NEW: Draft Management States
  const [savedDrafts, setSavedDrafts] = useState<any[]>([]);

  // Load drafts when the page loads
  const loadDraftsFromStorage = () => {
    const stored = localStorage.getItem("emp_form_drafts");
    if (stored) {
      try {
        setSavedDrafts(JSON.parse(stored));
      } catch (e) {
        setSavedDrafts([]);
      }
    } else {
      setSavedDrafts([]);
    }
  };

  useEffect(() => {
    loadDraftsFromStorage();
  }, []);

  // const fetchEmployees = async () => {
  //   setLoading(true);
  //   try {
  //     const data = await getEmployees();
  //     setEmployees(data);
  //     setFilteredEmployees(data); // ✅ Initialize filtered list
  //   } catch (error) {
  //     console.error("Fetch Error:", error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  // Inside EmployeeKHR.tsx (or your Admin Dashboard component)
  useEffect(() => {
    const checkForIncompleteProfile = () => {
      // ✅ CHANGED: Open only if flag is "true"
      const isProfileIncomplete =
        localStorage.getItem("is_incomplete_admin_profile") === "true";
      const loggedInUserId = localStorage.getItem("user_id");
      const userRole = localStorage.getItem("user_role");

      if (
        userRole === "REGISTER_ADMIN" &&
        isProfileIncomplete &&
        employees.length > 0
      ) {
        const adminRecord = employees.find((emp: any) => {
          const empUserId = Array.isArray(emp.user_id)
            ? String(emp.user_id[0])
            : String(emp.user_id);
          return empUserId === loggedInUserId;
        });

        if (adminRecord) {
          handleEditClick(adminRecord); // Opens Modal in Edit Mode
        }
      }
    };

    if (!loading) {
      checkForIncompleteProfile();
    }
  }, [loading, employees]);

  const fetchEmployees = async () => {
    setLoading(true);
    const loggedInUserId = localStorage.getItem("user_id");
    try {
      const data = await getEmployees();

      // ✅ SORTING LOGIC: Move Logged-in User to the top
      const sortedData = [...data].sort((a: any, b: any) => {
        const aId = Array.isArray(a.user_id)
          ? String(a.user_id[0])
          : String(a.user_id);
        const bId = Array.isArray(b.user_id)
          ? String(b.user_id[0])
          : String(b.user_id);

        if (aId === loggedInUserId) return -1;
        if (bId === loggedInUserId) return 1;
        return 0;
      });

      setEmployees(sortedData);
      setFilteredEmployees(sortedData);
    } catch (error) {
      console.error("Fetch Error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  // ✅ Comprehensive Global Search Logic for EmployeeKHR.tsx
  useEffect(() => {
    const searchLower = searchText.toLowerCase().trim();

    const filtered = employees.filter((emp: any) => {
      // 1. First, apply the specific Department dropdown filter
      const deptValue = Array.isArray(emp.department_id)
        ? String(emp.department_id[1])
        : String(emp.department_id || "");
      const deptMatch = filterDept === "" || deptValue === filterDept;

      const empStatus = String(emp.status || "active").toLowerCase();
      const statusMatch =
        filterStatus === "" || empStatus === filterStatus.toLowerCase();

      // 2. If the search box is empty, just return the department filter result
      if (!searchLower) return deptMatch && statusMatch;

      // 3. Perform a deep scan across all employee card properties
      const matchesSearch = Object.values(emp).some((value) => {
        if (value === null || value === undefined || value === false)
          return false;

        // Handle Odoo-style Arrays found in your card (e.g., [3148, "OMSPACE ROCKET"])
        if (Array.isArray(value)) {
          return value.some((v) =>
            String(v).toLowerCase().includes(searchLower),
          );
        }
        // Handle Nested Objects (like bank_account_details)
        if (typeof value === "object") {
          return Object.values(value).some((v) =>
            String(v).toLowerCase().includes(searchLower),
          );
        }
        // Standard search for strings (Name, Email, Code) and numbers (Phone)
        return String(value).toLowerCase().includes(searchLower);
      });

      return deptMatch && matchesSearch;
    });

    setFilteredEmployees(filtered);
  }, [searchText, filterDept, filterStatus, employees]);

  const totalCount = employees.length;
  const activeCount = employees.filter(
    (e: any) => (e.status || "active").toLowerCase() === "active",
  ).length;
  const inactiveCount = totalCount - activeCount;

  const handleDeleteEmployee = (id: number) => {
    setArchiveId(id);
    const modalElement = document.getElementById("archive_employee_modal");
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleViewClick = (employee: any) => {
    setEditData(employee);
    setIsViewMode(true);
    const modalElement = document.getElementById("add_employee_modal2");
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleEditClick = (employee: any) => {
    setIsViewMode(false);
    setEditData(employee);
    const modalElement = document.getElementById("add_employee_modal2");
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  const handleResumeDraft = (draft: any) => {
    setEditData(null); // Clear normal edit data
    setSelectedDraft(draft); // Set the draft data

    // Close drafts modal and open the Add modal
    const draftsModal = document.getElementById("drafts_list_modal");
    const addModal = document.getElementById("add_employee_modal2");

    if (draftsModal)
      (window as any).bootstrap.Modal.getInstance(draftsModal)?.hide();
    if (addModal) new (window as any).bootstrap.Modal(addModal).show();
  };

  // Handle clicking "Delete" (Trash icon)
  const handleDeleteDraft = (draftId: string) => {
    const updatedDrafts = savedDrafts.filter((d) => d.id !== draftId);
    localStorage.setItem("emp_form_drafts", JSON.stringify(updatedDrafts));
    setSavedDrafts(updatedDrafts);
    toast.success("Draft deleted.");
  };

  const columns = [
    {
      title: "Name",
      dataIndex: "name",
      render: (text: string, record: any) => {
        const loggedInUserId = localStorage.getItem("user_id");
        const userRole = localStorage.getItem("user_role");
        const recordUserId = Array.isArray(record.user_id)
          ? String(record.user_id[0])
          : String(record.user_id);
        const isSelfAdmin =
          recordUserId === loggedInUserId && userRole === "REGISTER_ADMIN";
        const rawImg = record.image_url || record.image_url;
        const getListImg = () => {
          if (!rawImg || rawImg === "false") return null;
          let trimmed = rawImg.trim();
          if (trimmed.startsWith("/"))
            return `https://odooapi.konverthr.com${trimmed}`;
          if (trimmed.startsWith("http"))
            return trimmed.replace("http://", "https://");
          if (trimmed.length > 50)
            return `data:image/png;base64,${trimmed.replace(/\s/g, "")}`;
          return null;
        };
        const finalImg = getListImg();
        const initial = text ? text.charAt(0).toUpperCase() : "?";
        return (
          <div className="d-flex align-items-center">
            <div className="avatar avatar-md me-2">
              {finalImg ? (
                <>
                  <img
                    src={finalImg}
                    className="rounded-circle object-fit-cover w-100 h-100"
                    alt={text}
                    onError={(e) => {
                      e.currentTarget.style.display = "none";
                      e.currentTarget.nextElementSibling?.classList.remove(
                        "d-none",
                      );
                      e.currentTarget.nextElementSibling?.classList.add(
                        "d-flex",
                      );
                    }}
                  />
                  <div className="rounded-circle bg-primary text-white w-100 h-100 justify-content-center align-items-center fw-bold d-none">
                    {initial}
                  </div>
                </>
              ) : (
                <div className="rounded-circle bg-primary text-white w-100 h-100 d-flex justify-content-center align-items-center fw-bold">
                  {initial}
                </div>
              )}
            </div>
            <div>
              <h6 className="fs-14 fw-medium mb-0">
                {text}{" "}
                {recordUserId === loggedInUserId && (
                  <small className="text-primary">(Me)</small>
                )}
              </h6>
              {/* ✅ ATTRACTIVE ADMIN BADGE IN LIST VIEW */}
              {isSelfAdmin && (
                <span
                  className="badge rounded-pill mt-1"
                  style={{
                    background:
                      "linear-gradient(135deg, #E42128 0%, #b21a1f 100%)",
                    color: "#fff",
                    fontSize: "9px",
                    padding: "2px 8px",
                    border: "1px solid #fff",
                  }}
                >
                  <i className="ti ti-shield-check me-1"></i> ADMIN
                </span>
              )}
            </div>
          </div>
        );
      },
    },
    {
      title: "Employee ID",
      dataIndex: "employee_code",
      sorter: (a: any, b: any) =>
        a.employee_code.localeCompare(b.employee_code),
    },
    {
      title: "Department",
      dataIndex: "department_id",
      render: (dept: any) => (Array.isArray(dept) ? dept[1] : dept || "N/A"),
    },
    {
      title: "Designation",
      dataIndex: "job_id",
      render: (job: any) => (Array.isArray(job) ? job[1] : job || "N/A"),
    },
    {
      title: "Email",
      dataIndex: "private_email",
    },
    {
      title: "Status",
      dataIndex: "status",
      render: (status: string) => (
        <span
          className={`badge ${status === "active" ? "badge-soft-success" : "badge-soft-danger"} d-inline-flex align-items-center`}
        >
          <i className="ti ti-circle-filled me-1"></i>
          {status?.toUpperCase() || "ACTIVE"}
        </span>
      ),
    },
    {
      title: "Action",
      render: (_: any, record: any) => (
        <div className="d-flex align-items-center gap-2">
          <button
            className="btn btn-icon btn-sm btn-soft-info"
            onClick={() => handleViewClick(record)}
            title="View Details"
          >
            <i className="ti ti-eye"></i>
          </button>
          {isAdmin && (
            <>
              <button
                className="btn btn-icon btn-sm btn-soft-primary"
                onClick={() => handleEditClick(record)}
                title="Edit Details"
              >
                <i className="ti ti-edit"></i>
              </button>
              <button
                className="btn btn-icon btn-sm btn-soft-danger"
                onClick={() => handleDeleteEmployee(record.id)}
                title="Delete Employee"
              >
                <i className="ti ti-trash"></i>
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  // Get unique departments for filter dropdown
  const uniqueDepts = Array.from(
    new Set(
      employees.map((emp: any) =>
        Array.isArray(emp.department_id)
          ? emp.department_id[1]
          : emp.department_id,
      ),
    ),
  ).filter(Boolean);

  return (
    // <div className="page-wrapper">
    //   <div className="content">
    //     <CommonHeader
    //       title="Employee Directory"
    //       parentMenu="HR"
    //       activeMenu="Employees"
    //       routes={all_routes}
    //       showViewToggle={true}
    //       viewType={viewType}
    //       onViewChange={setViewType}
    //       buttonText="Add New Employee"
    //       modalTarget="#add_employee_modal"
    //     />

    //     <div className="card mb-4 shadow-sm border-0">
    //       <div className="card-body p-3">
    //         <div className="row g-3 align-items-center">
    //           <div className="col-md-4">
    //             <div className="input-group">
    //               <span className="input-group-text bg-light border-end-0">
    //                 <i className="ti ti-search text-muted"></i>
    //               </span>
    //               <input
    //                 type="text"
    //                 className="form-control border-start-0"
    //                 placeholder="Search by name..."
    //                 value={searchText}
    //                 onChange={(e) => setSearchText(e.target.value)}
    //               />
    //             </div>
    //           </div>
    //           <div className="col-md-3">
    //             <select
    //               className="form-select"
    //               value={filterDept}
    //               onChange={(e) => setFilterDept(e.target.value)}
    //             >
    //               <option value="">All Departments</option>
    //               {uniqueDepts.map((dept) => (
    //                 <option key={dept} value={dept}>
    //                   {dept}
    //                 </option>
    //               ))}
    //             </select>
    //           </div>
    //           <div className="col-md-3">
    //             <select
    //               className="form-select"
    //               value={filterStatus}
    //               onChange={(e) => setFilterStatus(e.target.value)}
    //             >
    //               <option value="">All Employees</option>
    //               <option value="active">Active</option>
    //               <option value="inactive">Inactive</option>
    //             </select>
    //           </div>
    //           <div className="col-md-auto ms-auto">
    //             <button
    //               className="btn btn-light"
    //               onClick={() => {
    //                 setSearchText("");
    //                 setFilterDept("");
    //                 setFilterStatus("");
    //               }}
    //             >
    //               <i className="ti ti-refresh me-1"></i> Reset
    //             </button>
    //           </div>
    //         </div>
    //       </div>
    //     </div>

    //     {loading ? (
    //       <div
    //         className="row mt-4 position-relative"
    //         style={{ minHeight: "400px" }}
    //       >
    //         <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
    //           <div className="spinner-border text-primary" role="status">
    //             <span className="visually-hidden">Loading...</span>
    //           </div>
    //         </div>
    //       </div>
    //     ) : (
    //       <>
    //         {viewType === "grid" ? (
    //           <div className="row mt-4">
    //             {filteredEmployees.length > 0 ? (
    //               filteredEmployees.map((emp: any) => (
    //                 <EmployeeCard
    //                   key={emp.id}
    //                   employee={emp}
    //                   onEdit={handleEditClick}
    //                   onDelete={handleDeleteEmployee}
    //                 />
    //               ))
    //             ) : (
    //               <div className="col-12 text-center py-5">
    //                 <h5 className="text-muted">No Matching Employees Found</h5>
    //               </div>
    //             )}
    //           </div>
    //         ) : (
    //           <div className=" shadow-sm border-0">
    //             <div className="">
    //               <DatatableKHR
    //                 data={filteredEmployees} // ✅ Use filtered data
    //                 columns={columns}
    //                 selection={true}
    //               />
    //             </div>
    //           </div>
    //         )}
    //       </>
    //     )}

    //     <ArchiveEmployeeModal
    //       employeeId={archiveId}
    //       onSuccess={() => {
    //         fetchEmployees();
    //         setArchiveId(null);
    //       }}
    //       onClose={() => setArchiveId(null)}
    //     />
    //     <AddEditEmployeeModal
    //       data={editData}
    //       onSuccess={() => {
    //         fetchEmployees();
    //         setEditData(null);
    //       }}
    //       onClose={() => setEditData(null)}
    //     />
    //   </div>
    // </div>
    <div className="page-wrapper">
      <div className="content">
        <CommonHeader
          title="Employee Directory"
          parentMenu="HR"
          activeMenu="Employees"
          routes={all_routes}
          showViewToggle={true}
          viewType={viewType}
          onViewChange={setViewType}
          buttonText={isAdmin ? "Add New Employee" : ""}
          modalTarget={isAdmin ? "#add_employee_modal2" : ""}
          onAddClick={() => setIsViewMode(false)}
        />

        {/* ✅ NEW DRAFTS BUTTON */}
        {savedDrafts.length > 0 && isAdmin && (
          <div className="alert alert-warning d-flex align-items-center justify-content-between mb-4 shadow-sm border-warning border-start border-4 py-3 animate__animated animate__fadeInDown">
            <div className="d-flex align-items-center">
              <div className="bg-warning-subtle p-2 rounded-circle me-3">
                <i className="ti ti-file-pencil fs-24 text-warning"></i>
              </div>
              <div>
                <h6 className="mb-0 fw-bold text-dark">
                  Unsaved Drafts Available
                </h6>
                <p className="mb-0 fs-13 text-muted">
                  You have {savedDrafts.length} incomplete employee forms saved
                  to your browser.
                </p>
              </div>
            </div>
            <button
              className="btn btn-warning fw-bold shadow-sm rounded-pill px-4"
              data-bs-toggle="modal"
              data-bs-target="#drafts_list_modal"
            >
              View Drafts <i className="ti ti-arrow-right ms-2"></i>
            </button>
          </div>
        )}

        {/* --- STATS SUMMARY SECTION --- */}
        <div className="row mb-4">
          <div className="col-md-4">
            <div className="card shadow-sm border-0 border-start border-primary border-4">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small fw-bold text-uppercase">
                      Total Employees
                    </p>
                    <h3 className="mb-0">{totalCount}</h3>
                  </div>
                  <div className="avatar bg-soft-primary rounded">
                    <i className="ti ti-users fs-20 text-primary"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 border-start border-success border-4">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small fw-bold text-uppercase">
                      Active
                    </p>
                    <h3 className="mb-0 text-success">{activeCount}</h3>
                  </div>
                  <div className="avatar bg-soft-success rounded">
                    <i className="ti ti-user-check fs-20 text-success"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="col-md-4">
            <div className="card shadow-sm border-0 border-start border-danger border-4">
              <div className="card-body p-3">
                <div className="d-flex align-items-center justify-content-between">
                  <div>
                    <p className="text-muted mb-1 small fw-bold text-uppercase">
                      Inactive
                    </p>
                    <h3 className="mb-0 text-danger">{inactiveCount}</h3>
                  </div>
                  <div className="avatar bg-soft-danger rounded">
                    <i className="ti ti-user-x fs-20 text-danger"></i>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* --- FILTER INTERFACE --- */}
        <div className="card mb-4 shadow-sm border-0">
          <div className="card-body p-3">
            <div className="row g-3 align-items-center">
              <div className="col-md-4">
                <div className="input-group">
                  <span className="input-group-text bg-light border-end-0">
                    <i className="ti ti-search text-muted"></i>
                  </span>
                  <input
                    type="text"
                    className="form-control border-start-0"
                    placeholder="Search name, ID, or email..."
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                  />
                </div>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterDept}
                  onChange={(e) => setFilterDept(e.target.value)}
                >
                  <option value="">All Departments</option>
                  {uniqueDepts.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
              <div className="col-md-3">
                <select
                  className="form-select"
                  value={filterStatus}
                  onChange={(e) => setFilterStatus(e.target.value)}
                >
                  <option value="">All Statuses</option>
                  <option value="active">Active Only</option>
                  <option value="inactive">Inactive Only</option>
                </select>
              </div>
              <div className="col-md-auto ms-auto d-flex gap-2">
                {isAdmin && (
                  <button
                    className="btn btn-primary"
                    data-bs-toggle="modal"
                    data-bs-target="#bulk_upload_modal"
                  >
                    <i className="ti ti-upload me-1"></i> Bulk Upload
                  </button>
                )}
                <button
                  className="btn btn-white border"
                  onClick={() => {
                    setSearchText("");
                    setFilterDept("");
                    setFilterStatus("");
                  }}
                >
                  <i className="ti ti-refresh me-1"></i> Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* --- EMPLOYEE LIST/GRID --- */}
        {loading ? (
          <div className="text-center py-5">
            <div className="spinner-border text-primary" role="status"></div>
          </div>
        ) : (
          <>
            <div className="mb-3">
              <span className="text-muted small">
                Showing <strong>{filteredEmployees.length}</strong> results
              </span>
            </div>
            {viewType === "grid" ? (
              <div className="row">
                {filteredEmployees.length > 0 ? (
                  filteredEmployees.map((emp: any) => (
                    <EmployeeCard
                      key={emp.id}
                      employee={emp}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteEmployee}
                      onView={handleViewClick}
                    />
                  ))
                ) : (
                  <div className="col-12 text-center py-5">
                    <h5 className="text-muted">No Matching Employees Found</h5>
                  </div>
                )}
              </div>
            ) : (
              <DatatableKHR
                data={filteredEmployees}
                columns={columns}
                selection={true}
              />
            )}
          </>
        )}
        {createPortal(
          <div className="modal fade" id="drafts_list_modal" tabIndex={-1}>
            <div className="modal-dialog modal-dialog-centered">
              <div className="modal-content border-0 shadow-lg rounded-4 overflow-hidden">
                <div className="modal-header bg-white border-bottom px-4 py-3">
                  <h5 className="modal-title fw-bold d-flex align-items-center">
                    <i className="ti ti-file-pencil text-warning me-2 fs-20"></i>{" "}
                    Saved Drafts
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    data-bs-dismiss="modal"
                  ></button>
                </div>
                <div className="modal-body p-0 bg-light-subtle">
                  {savedDrafts.length === 0 ? (
                    <div className="p-5 text-center text-muted">
                      No drafts available.
                    </div>
                  ) : (
                    <ul className="list-group list-group-flush">
                      {savedDrafts.map((draft) => (
                        <li
                          key={draft.id}
                          className="list-group-item d-flex justify-content-between align-items-center p-4 bg-transparent border-bottom"
                        >
                          <div>
                            <h6 className="mb-1 fw-bold text-dark">
                              {draft.title}
                            </h6>
                            <div className="fs-12 text-muted">
                              <i className="ti ti-clock me-1"></i>
                              Saved{" "}
                              {dayjs(draft.lastModified).format(
                                "DD MMM YYYY, hh:mm A",
                              )}
                            </div>
                          </div>
                          <div className="d-flex gap-2">
                            <button
                              className="btn btn-sm btn-primary px-3 fw-bold rounded-pill shadow-sm"
                              onClick={() => handleResumeDraft(draft)}
                            >
                              Resume
                            </button>
                            <button
                              className="btn btn-sm btn-outline-danger btn-icon rounded-circle"
                              onClick={() => handleDeleteDraft(draft.id)}
                            >
                              <i className="ti ti-trash"></i>
                            </button>
                          </div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          </div>,
          document.body,
        )}
        <ArchiveEmployeeModal
          employeeId={archiveId}
          onSuccess={() => {
            fetchEmployees();
            setArchiveId(null);
          }}
          onClose={() => setArchiveId(null)}
        />
        {/* <AddEditEmployeeModal
          data={editData}
          onSuccess={() => {
            fetchEmployees();
            setEditData(null);
          }}
          onClose={() => setEditData(null)}
        /> */}
        <AddEditEmployeeModal2
          data={editData}
          isViewOnly={isViewMode}
          draftData={selectedDraft}
          onSuccess={() => {
            const isLocked =
              localStorage.getItem("is_incomplete_admin_profile") === "true";

            if (isLocked) {
              const adminEmail = localStorage.getItem("user_email");
              toast.success(
                "Profile completed! Logging out to refresh your session...",
                { position: "top-center" },
              );

              localStorage.clear();
              if (adminEmail)
                localStorage.setItem("remembered_email", adminEmail);

              setTimeout(() => {
                navigate(routes.login);
                window.location.reload();
              }, 2000);
            } else {
              getEmployees();
              fetchEmployees();
              setEditData(null);
              setSelectedDraft(null);
              loadDraftsFromStorage(); // Refresh drafts list
            }
          }}
          onClose={() => {
            setEditData(null);
            setSelectedDraft(null);
            loadDraftsFromStorage(); // Refresh drafts list
          }}
        />
        <BulkUploadModal
          onSuccess={() => {
            fetchEmployees();
          }}
          onClose={() => { }}
        />
      </div>
    </div>
  );
};

export default EmployeeKHR;

// =====================================================================================================================================================
// import React, { useEffect, useState } from "react";
// import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
// import AddEditEmployeeModal from "./AddEditEmployeeModal";
// import { getEmployees, deleteEmployee, Employee } from "./EmployeeServices";
// import { toast } from "react-toastify";
// import { all_routes } from "@/router/all_routes";
// import EmployeeCard from "./EmployeeCard";
// import DatatableKHR from "@/CommonComponent/DataTableKHR/DatatableKHR";

// const EmployeeKHR = () => {
//   const routes = all_routes;
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
//   const [editData, setEditData] = useState<any>(null);

//   // ✅ State for view toggle
//   const [viewType, setViewType] = useState<"grid" | "list">("grid");

//   const fetchEmployees = async () => {
//     setLoading(true);
//     try {
//       const data = await getEmployees();
//       setEmployees(data);
//     } catch (error) {
//       console.error("Fetch Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   const handleDeleteEmployee = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this employee?"))
//       return;
//     try {
//       await deleteEmployee(id.toString());
//       toast.success("Employee deleted successfully");
//       fetchEmployees();
//     } catch (error) {
//       toast.error("Failed to delete employee");
//     }
//   };

//   const handleViewClick = (employee: any) => {\n    setEditData(employee);\n    setIsViewMode(true);\n    const modalElement = document.getElementById('add_employee_modal2');\n    if (modalElement) {\n      const modal = new (window as any).bootstrap.Modal(modalElement);\n      modal.show();\n    }\n  };\n\n  const handleEditClick = (employee: any) => {\n    setIsViewMode(false);
//     setEditData(employee);
//     const modalElement = document.getElementById("add_employee_modal");
//     if (modalElement) {
//       const modal = new (window as any).bootstrap.Modal(modalElement);
//       modal.show();
//     }
//   };

//   // ✅ Define Table Columns for DatatableKHR
//   const columns = [
//     {
//       title: "Name",
//       dataIndex: "name",
//       render: (text: string, record: any) => (
//         <div className="d-flex align-items-center">
//           <div className="avatar avatar-md me-2">
//             <img
//               src={record.image_url || "assets/img/profiles/avatar-02.jpg"}
//               className="rounded-circle"
//               alt="User"
//             />
//           </div>
//           <h6 className="fs-14 fw-medium mb-0">{text}</h6>
//         </div>
//       ),
//       sorter: (a: any, b: any) => a.name.localeCompare(b.name),
//     },
//     {
//       title: "Employee ID",
//       dataIndex: "employee_code",
//       sorter: (a: any, b: any) =>
//         a.employee_code.localeCompare(b.employee_code),
//     },
//     {
//       title: "Department",
//       dataIndex: "department_id",
//       render: (dept: any) => (Array.isArray(dept) ? dept[1] : dept || "N/A"),
//     },
//     {
//       title: "Designation",
//       dataIndex: "job_id",
//       render: (job: any) => (Array.isArray(job) ? job[1] : job || "N/A"),
//     },
//     {
//       title: "Email",
//       dataIndex: "private_email",
//     },
//     {
//       title: "Status",
//       dataIndex: "status",
//       render: (status: string) => (
//         <span
//           className={`badge ${status === "active" ? "badge-soft-success" : "badge-soft-danger"} d-inline-flex align-items-center`}
//         >
//           <i className="ti ti-circle-filled me-1"></i>
//           {status?.toUpperCase() || "ACTIVE"}
//         </span>
//       ),
//     },
//     {
//       title: "Action",
//       render: (_: any, record: any) => (
//         <div className="d-flex align-items-center gap-2">
//           <button
//             className="btn btn-icon btn-sm btn-soft-primary"
//             onClick={() => handleEditClick(record)}
//           >
//             <i className="ti ti-edit"></i>
//           </button>
//           <button
//             className="btn btn-icon btn-sm btn-soft-danger"
//             onClick={() => handleDeleteEmployee(record.id)}
//           >
//             <i className="ti ti-trash"></i>
//           </button>
//         </div>
//       ),
//     },
//   ];

//   return (
//     <div className="page-wrapper">
//       <div className="content">
//         {/* HEADER AREA */}
//         <div onClick={() => setSelectedEmp(null)}>
//           <CommonHeader
//             title="Employee Directory"
//             parentMenu="HR"
//             activeMenu="Employees"
//             routes={all_routes}
//             showViewToggle={true}
//             viewType={viewType}
//             onViewChange={setViewType}
//             buttonText="Add New Employee"
//             modalTarget="#add_employee_modal"
//           />
//         </div>

//         {loading ? (
//           <div
//             className="row mt-4 position-relative"
//             style={{ minHeight: "400px" }}
//           >
//             <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
//               <div
//                 className="spinner-border text-primary"
//                 role="status"
//                 style={{ width: "2.5rem", height: "2.5rem" }}
//               >
//                 <span className="visually-hidden">Loading...</span>
//               </div>
//               <p className="mt-2 text-muted fs-13">Loading data...</p>
//             </div>
//           </div>
//         ) : (
//           <>
//             {/* ✅ Conditional View Rendering */}
//             {viewType === "grid" ? (
//               <div className="row mt-4">
//                 {employees.length > 0 ? (
//                   employees.map((emp: any) => (
//                     <EmployeeCard
//                       key={emp.id}
//                       employee={emp}
//                       onEdit={handleEditClick}
//                       onDelete={handleDeleteEmployee}
//                     />
//                   ))
//                 ) : (
//                   <div className="col-12 text-center py-5">
//                     <h5 className="text-muted">No Employees Found</h5>
//                   </div>
//                 )}
//               </div>
//             ) : (
//               // ✅ List View (DataTable)
//               <div className="card mt-4 shadow-sm border-0">
//                 <div className="card-body p-0">
//                   <DatatableKHR
//                     data={employees}
//                     columns={columns}
//                     selection={true}
//                   />
//                 </div>
//               </div>
//             )}
//           </>
//         )}

//         {/* MODAL */}
//         <AddEditEmployeeModal
//           data={editData}
//           onSuccess={() => {
//             fetchEmployees();
//             setEditData(null);
//           }}
//           onClose={() => setEditData(null)}
//         />
//       </div>
//     </div>
//   );
// };

// export default EmployeeKHR;

// ==========================================================================================================================================================

// import React, { useEffect, useState } from "react";
// import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
// import AddEditEmployeeModal from "./AddEditEmployeeModal";
// import { getEmployees, deleteEmployee, Employee } from "./EmployeeServices";
// import { toast } from "react-toastify";
// import { all_routes } from "@/router/all_routes";
// import EmployeeCard from "./EmployeeCard";

// const EmployeeKHR = () => {
//   const routes = all_routes;
//   const [employees, setEmployees] = useState<Employee[]>([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
//   const [editData, setEditData] = useState<any>(null);

//   const fetchEmployees = async () => {
//     setLoading(true);
//     try {
//       const data = await getEmployees();

//       setEmployees(data);
//     } catch (error) {
//       console.error("Fetch Error:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchEmployees();
//   }, []);

//   const handleDeleteEmployee = async (id: number) => {
//     if (!window.confirm("Are you sure you want to delete this employee?"))
//       return;
//     try {
//       await deleteEmployee(id.toString());
//       toast.success("Employee deleted successfully");
//       fetchEmployees();
//     } catch (error) {
//       toast.error("Failed to delete employee");
//     }
//   };

//   const handleViewClick = (employee: any) => {\n    setEditData(employee);\n    setIsViewMode(true);\n    const modalElement = document.getElementById('add_employee_modal2');\n    if (modalElement) {\n      const modal = new (window as any).bootstrap.Modal(modalElement);\n      modal.show();\n    }\n  };\n\n  const handleEditClick = (employee: any) => {\n    setIsViewMode(false);
//     setEditData(employee);
//     // Explicitly open modal
//     const modalElement = document.getElementById("add_employee_modal");
//     if (modalElement) {
//       const modal = new (window as any).bootstrap.Modal(modalElement);
//       modal.show();
//     }
//   };

//   return (
//     <div className="page-wrapper">
//       <div className="content">
//         {/* HEADER AREA */}
//         <div onClick={() => setSelectedEmp(null)}>
//           <CommonHeader
//             title="Employee Directory"
//             parentMenu="HR"
//             activeMenu="Employees"
//             routes={all_routes}
//             showViewToggle={true}
//             viewType={viewType} // Pass current state
//             onViewChange={setViewType} // Pass state setter
//             buttonText="Add New Employee"
//             modalTarget="#add_employee_modal"
//           />
//         </div>

//         {/* LOADING & CONTENT AREA */}
//         <div
//           className="row mt-4 position-relative"
//           style={{ minHeight: "400px" }}
//         >
//           {loading ? (
//             // --- CENTERED SPINNER ---
//             <div className="position-absolute top-50 start-50 translate-middle text-center w-100">
//               <div
//                 className="spinner-border text-primary"
//                 role="status"
//                 style={{ width: "2.5rem", height: "2.5rem" }}
//               >
//                 <span className="visually-hidden">Loading...</span>
//               </div>
//               <p className="mt-2 text-muted fs-13">Loading data...</p>
//             </div>
//           ) : (
//             // --- GRID ---
//             <>
//               {employees.length > 0 ? (
//                 employees.map((emp: any) => (
//                   <EmployeeCard
//                     key={emp.id}
//                     employee={emp}
//                     onEdit={handleEditClick}
//                     onDelete={handleDeleteEmployee}
//                   />
//                 ))
//               ) : (
//                 <div className="col-12 text-center py-5">
//                   <h5 className="text-muted">No Employees Found</h5>
//                   <p className="text-muted fs-13">
//                     Add an employee to see them here.
//                   </p>
//                 </div>
//               )}
//             </>
//           )}
//         </div>

//         {/* MODAL */}
//         <AddEditEmployeeModal
//           data={editData}
//           onSuccess={() => {
//             fetchEmployees();
//             setEditData(null);
//           }}
//           onClose={() => setEditData(null)}
//         />
//       </div>
//     </div>
//   );
// };

// export default EmployeeKHR;
