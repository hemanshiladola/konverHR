import { useCallback, useEffect, useRef, useState } from "react";
import ReactApexChart from "react-apexcharts";
import { Link, useNavigate } from "react-router-dom";
import ImageWithBasePath from "../../../core/common/imageWithBasePath";
import { all_routes } from "../../../router/all_routes";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { Chart } from "primereact/chart";
import { Calendar } from "primereact/calendar";
import ProjectModals from "../../../core/modals/projectModal";
import RequestModals from "../../../core/modals/requestModal";
import TodoModal from "../../../core/modals/todoModal";
import CollapseHeader from "../../../core/common/collapse-header/collapse-header";
import { useSelector } from "react-redux";
import {
  ApiAuth,
  getDashboadrdCount,
  TBSelector,
  updateState,
} from "@/Store/Reducers/TBSlice";
import { useAppDispatch } from "@/Store/hooks";
import {
  getAttendancePercentage,
  getCheckInData,
  getDepartmentRangeCount,
  getEmployeeTypePercentage,
} from "./AdminDashboardService";
import { toast } from "react-toastify";
import dayjs from "dayjs";
import { getEmployees } from "@/KHRModules/EmployeModules/Employee/EmployeeServices";
import AddEditEmployeeModal from "@/KHRModules/EmployeModules/Employee/AddEditEmployeeModal";
import AddEditEmployeeModal2 from "@/KHRModules/EmployeModules/Employee/AddEditEmployeeModal2";

const AdminDashboard = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const modalInstanceRef = useRef<any>(null);

  const [isTodo, setIsTodo] = useState([false, false, false]);
  const [deptApiData, setDeptApiData] = useState<any[]>([]);
  const [selectedRange, setSelectedRange] = useState<
    "this_month" | "this_week" | "last_week" | "today"
  >("this_week");
  const [attendanceStats, setAttendanceStats] = useState<any>(null);
  const [isDeptLoading, setIsDeptLoading] = useState(true);
  const [statusApiData, setStatusApiData] = useState<any>(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const userName = localStorage.getItem("full_name") || "John Doe";

  const [clockLogs, setClockLogs] = useState<any>(null);
  const [selectedDept, setSelectedDept] = useState<string>("All Departments");
  const [clockRange, setClockRange] = useState<
    "today" | "this_week" | "this_month"
  >("today");

  const [editData, setEditData] = useState<any>(null);
  const [isProfileLocked, setIsProfileLocked] = useState(false);

  const dispatch = useAppDispatch();
  const {
    // getDashboadrdCount
    isgetDashboadrdCount,
    isgetDashboadrdCountFetching,
    getDashboadrdCountData,
    isApiAuth,
  } = useSelector(TBSelector);

  const [date, setDate] = useState(new Date());

  //New Chart
  interface ChartSeries {
    name: string;
    data: number[];
  }

  interface EmpDepartmentOptions {
    chart: object;
    fill: object;
    colors: string[];
    grid: object;
    plotOptions: object;
    dataLabels: object;
    series: ChartSeries[];
    xaxis: object;
  }

  interface SalesIncomeOptions {
    chart: object;
    colors: string[];
    responsive: object[];
    plotOptions: object;
    series: ChartSeries[];
    xaxis: object;
    yaxis: object;
    grid: object;
    legend: object;
    dataLabels: object;
    fill: object;
  }

  // 1. Refined Data Fetching
  useEffect(() => {
    const handleForcedProfileUpdate = async () => {
      // ✅ CHANGED: Open only if the flag is "true"
      const isProfileIncomplete =
        String(localStorage.getItem("is_incomplete_admin_profile")) === "true";
      const userRole = localStorage.getItem("user_role");
      const loggedInUserId = String(localStorage.getItem("user_id"));

      console.log("Checking Profile Enforcement:", {
        isProfileIncomplete,
        userRole,
        loggedInUserId,
      });

      if (userRole === "REGISTER_ADMIN" && isProfileIncomplete) {
        try {
          const employees = await getEmployees();
          const adminRecord = employees.find((emp: any) => {
            const empUserId = Array.isArray(emp.user_id)
              ? String(emp.user_id[0])
              : String(emp.user_id);
            return empUserId === loggedInUserId;
          });

          if (adminRecord) {
            setIsProfileLocked(true);
            setEditData(adminRecord);
          } else {
            setIsProfileLocked(true); // Still lock if match fails to prevent bypass
          }
        } catch (error) {
          console.error("Forced update fetch failed", error);
        }
      }
    };
    handleForcedProfileUpdate();
  }, []);

  const handleModalSuccess = useCallback(() => {
    if (isProfileLocked) {
      const adminEmail = localStorage.getItem("user_email");
      toast.success("Profile updated! Logging out to refresh session...");
      localStorage.clear();
      if (adminEmail) localStorage.setItem("remembered_email", adminEmail);
      setTimeout(() => {
        navigate(all_routes.login);
        window.location.reload();
      }, 2000);
    } else {
      setEditData(null);
    }
  }, [isProfileLocked, navigate]);

  const handleModalClose = useCallback(() => {
    setEditData(null);
  }, []);

  // 2. BULLETPROOF TRIGGER: Show the modal
  // useEffect(() => {
  //   if (isProfileLocked && editData) {
  //     const triggerModal = () => {
  //       const modalElement = document.getElementById("add_employee_modal");

  //       if (modalElement) {
  //         console.log("Modal Element found, initializing Bootstrap...");
  //         try {
  //           // Dispose of any old instances to prevent conflicts
  //           const existing = (window as any).bootstrap.Modal.getInstance(
  //             modalElement,
  //           );
  //           if (existing) existing.dispose();

  //           const modalInstance = new (window as any).bootstrap.Modal(
  //             modalElement,
  //             {
  //               backdrop: "static",
  //               keyboard: false,
  //             },
  //           );
  //           modalInstance.show();
  //           console.log("✅ Modal .show() called successfully");
  //         } catch (err) {
  //           console.error("Bootstrap JS Error:", err);
  //         }
  //       } else {
  //         console.warn(
  //           "Modal element not found in DOM yet, retrying in 500ms...",
  //         );
  //         setTimeout(triggerModal, 500); // Retry if React hasn't painted yet
  //       }
  //     };

  //     triggerModal();
  //   }
  // }, [isProfileLocked, editData]); // Trigger when lock state OR data changes

  // 2. Use this stabilized "Strong Lock" logic
  // useEffect(() => {
  //   // We only run this if the profile is locked and we have the data
  //   if (isProfileLocked && editData) {
  //     const triggerModal = () => {
  //       const modalElement = document.getElementById("add_employee_modal");

  //       if (modalElement) {
  //         // ✅ FIX: Only initialize IF we don't already have an active instance
  //         if (!modalInstanceRef.current) {
  //           console.log("Initializing Admin Profile Lock Modal...");
  //           try {
  //             // Check if Bootstrap already has an instance (e.g., from a previous partial render)
  //             const existing = (window as any).bootstrap.Modal.getInstance(
  //               modalElement,
  //             );
  //             if (existing) existing.dispose();

  //             const modalInstance = new (window as any).bootstrap.Modal(
  //               modalElement,
  //               {
  //                 backdrop: "static",
  //                 keyboard: false,
  //               },
  //             );

  //             modalInstanceRef.current = modalInstance;
  //             modalInstance.show();
  //             console.log("✅ Admin Profile Modal Locked Successfully");
  //           } catch (err) {
  //             console.error("Bootstrap Modal Error:", err);
  //           }
  //         }
  //       } else {
  //         // Retry if the modal isn't in the DOM yet (happens on slow initial loads)
  //         console.warn("Modal not found in DOM, retrying...");
  //         setTimeout(triggerModal, 500);
  //       }
  //     };

  //     triggerModal();
  //   }

  //   // Cleanup: When the dashboard unmounts or the lock is removed, reset the ref
  //   return () => {
  //     modalInstanceRef.current = null;
  //   };
  // }, [isProfileLocked]); // ❌ CRITICAL: Remove 'editData' from here to stop the infinite loop

  useEffect(() => {
    if (isProfileLocked && editData) {
      const modalElement = document.getElementById("add_employee_modal2");
      if (modalElement && !modalInstanceRef.current) {
        const modal = new (window as any).bootstrap.Modal(modalElement, {
          backdrop: "static",
          keyboard: false,
        });
        modalInstanceRef.current = modal;
        modal.show();
      }
    }
    return () => {
      modalInstanceRef.current = null;
    };
  }, [isProfileLocked]); // Only re-run if the lock status changes, NOT on every editData change

  useEffect(() => {
    const fetchDeptRangeData = async () => {
      setIsDeptLoading(true);
      try {
        const res = await getDepartmentRangeCount();
        if (res && res.status === "success") {
          setDeptApiData(res.departments || []);
        }
      } catch (error) {
        console.error("Error fetching department data:", error);
      } finally {
        setIsDeptLoading(false);
      }
    };
    fetchDeptRangeData();
  }, []);

  // Inside AdminDashboard component

  useEffect(() => {
    const fetchClockData = async () => {
      try {
        const userId = localStorage.getItem("user_id") || "3199";

        // Call the service function created above
        const result = await getCheckInData(userId);

        if (result && result.status === "success") {
          // Based on your JSON, result.data contains the "today", "this_week", etc. keys
          setClockLogs(result.data);
        } else {
          toast.error("Failed to load attendance logs");
        }
      } catch (error) {
        console.error("Error fetching clock logs:", error);
      }
    };

    fetchClockData();
  }, []);

  const getFilteredLogs = () => {
    // 1. Check if data exists for the selected range (today, this_week, etc.)
    if (!clockLogs || !clockLogs[clockRange]) return [];

    const rangeData = clockLogs[clockRange];

    // 2. If "All Departments" is selected, flatten all department arrays into one
    if (selectedDept === "All Departments") {
      return Object.values(rangeData).flat();
    }

    // 3. Otherwise, return only the selected department's array
    return rangeData[selectedDept] || [];
  };

  const displayLogs = getFilteredLogs();

  useEffect(() => {
    const fetchStatusData = async () => {
      setLoadingStatus(true);
      const res = await getEmployeeTypePercentage();
      if (res && res.status === "success") {
        // res.data now contains { permanent, fixed_term, temporary, other }
        setStatusApiData(res.data);
      }
      setLoadingStatus(false);
    };
    fetchStatusData();
  }, []);

  const userId = localStorage.getItem("user_id") || "3145";

  const getTypePercent = (typeKey: string) => {
    if (!statusApiData) return 0;
    // Use the exact keys from your JSON response
    return statusApiData[typeKey] || 0;
  };

  const chartValues = deptApiData.map((d: any) => d[selectedRange] || 0);
  const maxValue = Math.max(...chartValues, 5); // Default to at least 5 for a good look

  const empDepartmentConfig: any = {
    series: deptApiData.map((d: any) => d.total_employees),
    chart: {
      type: "pie",
      toolbar: { show: false },
      fontFamily: "inherit",
    },
    labels: deptApiData.map((d: any) => d.department),
    colors: [
      "#F26522", "#03C95A", "#0C4B5E", "#FFC107", "#E70D0D", "#ab7efd",
      "#1B84FF", "#00BCD4", "#9C27B0", "#FF5722", "#607D8B", "#8BC34A",
      "#E91E63", "#795548", "#009688", "#3F51B5", "#CDDC39", "#FF9800",
    ],
    dataLabels: {
      enabled: false,
    },
    legend: {
      show: false,
    },
    tooltip: {
      y: { formatter: (val: number) => `${val} Employees` },
    },
    stroke: { width: 2, colors: ["#fff"] },
  };

  const [empDepartment] = useState<EmpDepartmentOptions>({
    chart: {
      height: 235,
      type: "bar",
      padding: {
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
      },
      toolbar: {
        show: false,
      },
    },
    fill: {
      colors: ["#F26522"], // Fill color for the bars
      opacity: 1, // Adjust opacity (1 is fully opaque)
    },
    colors: ["#F26522"],
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        top: -20,
        left: 0,
        right: 0,
        bottom: 0,
      },
    },
    plotOptions: {
      bar: {
        borderRadius: 5,
        horizontal: true,
        barHeight: "35%",
        endingShape: "rounded",
      },
    },
    dataLabels: {
      enabled: false,
    },
    series: [
      {
        data: [80, 110, 80, 20, 60, 100],
        name: "Employee",
      },
    ],
    xaxis: {
      categories: [
        "UI/UX",
        "Development",
        "Management",
        "HR",
        "Testing",
        "Marketing",
      ],
      labels: {
        style: {
          colors: "#111827",
          fontSize: "13px",
        },
      },
    },
  });

  const [salesIncome] = useState<SalesIncomeOptions>({
    chart: {
      height: 290,
      type: "bar",
      stacked: true,
      toolbar: {
        show: false,
      },
    },
    colors: ["#FF6F28", "#F8F9FA"],
    responsive: [
      {
        breakpoint: 480,
        options: {
          legend: {
            position: "bottom",
            offsetX: -10,
            offsetY: 0,
          },
        },
      },
    ],
    plotOptions: {
      bar: {
        borderRadius: 5,
        borderRadiusWhenStacked: "all",
        horizontal: false,
        endingShape: "rounded",
      },
    },
    series: [
      {
        name: "Income",
        data: [40, 30, 45, 80, 85, 90, 80, 80, 80, 85, 20, 80],
      },
      {
        name: "Expenses",
        data: [60, 70, 55, 20, 15, 10, 20, 20, 20, 15, 80, 20],
      },
    ],
    xaxis: {
      categories: [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ],
      labels: {
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    yaxis: {
      labels: {
        offsetX: -15,
        style: {
          colors: "#6B7280",
          fontSize: "13px",
        },
      },
    },
    grid: {
      borderColor: "#E5E7EB",
      strokeDashArray: 5,
      padding: {
        left: -8,
      },
    },
    legend: {
      show: false,
    },
    dataLabels: {
      enabled: false, // Disable data labels
    },
    fill: {
      opacity: 1,
    },
  });

  //Attendance ChartJs
  const [chartData, setChartData] = useState<any>({
    labels: ["Present", "Late", "Leave", "Absent"],
    datasets: [{ data: [0, 0, 0, 0], backgroundColor: [] }],
  });
  const [chartOptions, setChartOptions] = useState<any>({});

  useEffect(() => {
    const fetchAttendanceData = async () => {
      const res = await getAttendancePercentage(userId);
      if (res && res.status === "success") {
        setAttendanceStats(res.data);

        const current = res.data[selectedRange];

        if (current) {
          // 1. Update Data: Ensure the order of 'data' matches the 'labels'
          setChartData({
            labels: ["Present", "Late", "Leave", "Absent"],
            datasets: [
              {
                label: "Attendance %",
                // Data order must match Labels order above
                data: [
                  current.present || 0,
                  current.late || 0,
                  current.approved_leave || 0,
                  current.absent || 0,
                ],
                backgroundColor: ["#03C95A", "#0C4B5E", "#FFC107", "#E70D0D"],
                borderWidth: 5,
                borderRadius: 10,
                borderColor: "#fff",
                hoverBorderWidth: 0,
                cutout: "60%",
              },
            ],
          });

          // 2. Update Options: Specific settings for the Semi-Donut look
          setChartOptions({
            rotation: -100,
            circumference: 200,
            cutout: "60%",
            maintainAspectRatio: false,
            responsive: true,
            plugins: {
              legend: {
                display: false, // Hidden as you have a custom breakdown list below
              },
              tooltip: {
                callbacks: {
                  label: (context: any) => ` ${context.label}: ${context.raw}%`,
                },
              },
            },
          });
        }
      }
    };
    fetchAttendanceData();
  }, [userId, selectedRange]); // Re-runs on user or dropdown change
  //Semi Donut ChartJs
  const [semidonutData, setSemidonutData] = useState({});
  const [semidonutOptions, setSemidonutOptions] = useState({});

  const toggleTodo = (index: number) => {
    setIsTodo((prevIsTodo) => {
      const newIsTodo = [...prevIsTodo];
      newIsTodo[index] = !newIsTodo[index];
      return newIsTodo;
    });
  };

  useEffect(() => {
    const data = {
      labels: ["Ongoing", "Onhold", "Completed", "Overdue"],
      datasets: [
        {
          label: "Semi Donut",
          data: [20, 40, 20, 10],
          backgroundColor: ["#FFC107", "#1B84FF", "#03C95A", "#E70D0D"],
          borderWidth: -10,
          borderColor: "transparent", // Border between segments
          hoverBorderWidth: 0, // Border radius for curved edges
          cutout: "75%",
          spacing: -30,
        },
      ],
    };

    const options = {
      rotation: -100,
      circumference: 185,
      layout: {
        padding: {
          top: -20, // Set to 0 to remove top padding
          bottom: 20, // Set to 0 to remove bottom padding
        },
      },
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        legend: {
          display: false, // Hide the legend
        },
      },
      elements: {
        arc: {
          borderWidth: -30, // Ensure consistent overlap
          borderRadius: 30, // Add some rounding
        },
      },
    };

    setSemidonutData(data);
    setSemidonutOptions(options);
  }, []);

  // useEffect(() => {
  // if (isApiAuth) {
  // dispatch(getDashboadrdCount() as any);
  // dispatch(updateState({ isApiAuth: false }))
  // }
  // }, [dispatch]);

  useEffect(() => {
    // fetchData();
    dispatch(ApiAuth() as any);
  }, [dispatch]);
  console.log(getDashboadrdCountData, "getDashboadrdCountData");

  return (
    <>
      {/* Page Wrapper */}
      <div className="page-wrapper">
        <div className="content">
          {/* Breadcrumb */}
          <div className="d-md-flex d-block align-items-center justify-content-between page-breadcrumb mb-3">
            <div className="my-auto mb-2">
              <h2 className="mb-1">Admin Dashboard</h2>
              <nav>
                <ol className="breadcrumb mb-0">
                  <li className="breadcrumb-item">
                    <Link to={routes.adminDashboard}>
                      <i className="ti ti-smart-home" />
                    </Link>
                  </li>
                  <li className="breadcrumb-item">Dashboard</li>
                  <li className="breadcrumb-item active" aria-current="page">
                    Admin Dashboard
                  </li>
                </ol>
              </nav>
            </div>
            <div className="d-flex my-xl-auto right-content align-items-center flex-wrap ">
              {/* <div className="me-2 mb-2">
                <div className="dropdown">
                  <Link
                    to="#"
                    className="dropdown-toggle btn btn-white d-inline-flex align-items-center"
                    data-bs-toggle="dropdown"
                  >
                    <i className="ti ti-file-export me-1" />
                    Export
                  </Link>
                  <ul className="dropdown-menu  dropdown-menu-end p-3">
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-pdf me-1" />
                        Export as PDF
                      </Link>
                    </li>
                    <li>
                      <Link to="#" className="dropdown-item rounded-1">
                        <i className="ti ti-file-type-xls me-1" />
                        Export as Excel{" "}
                      </Link>
                    </li>
                  </ul>
                </div>
              </div> */}
              {/* <div className="mb-2">
                <div className="input-icon w-120 position-relative">
                  <span className="input-icon-addon">
                    <i className="ti ti-calendar text-gray-9" />
                  </span>
                  <Calendar
                    value={date}
                    onChange={(e: any) => setDate(e.value)}
                    view="year"
                    dateFormat="yy"
                    className="Calendar-form"
                  />
                </div>
              </div> */}
              <div className="ms-2 head-icons">
                <CollapseHeader />
              </div>
            </div>
          </div>
          {/* /Breadcrumb */}
          {/* Welcome Wrap */}
          <div className="card border-0">
            <div className="card-body d-flex align-items-center justify-content-between flex-wrap pb-1">
              <div className="d-flex align-items-center mb-3">
                <span className="avatar avatar-xl flex-shrink-0">
                  <ImageWithBasePath
                    src="assets/img/profiles/avatar-31.jpg"
                    className="rounded-circle"
                    alt="avatar"
                  />
                </span>
                <div className="ms-3">
                  <h3 className="mb-2">
                    Welcome Back, {userName}{" "}
                    {/* <Link to="#" className="edit-icon">
                      <i className="ti ti-edit fs-14" />
                    </Link> */}
                  </h3>
                  {/* <p>
                    You have{" "}
                    <span className="text-primary text-decoration-underline">
                      {getDashboadrdCountData?.data?.pending_approvals ?? 0}
                    </span>{" "}
                    Pending Approvals &amp;{" "}
                    <span className="text-primary text-decoration-underline">
                      {getDashboadrdCountData?.data?.leave_requests ?? 0}
                    </span>{" "}
                    Leave Requests
                  </p> */}
                </div>
              </div>
              {/* <div className="d-flex align-items-center flex-wrap mb-1">
                <Link
                  to="#"
                  className="btn btn-secondary btn-md me-2 mb-2"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_project"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  Add Project
                </Link>
                <Link
                  to="#"
                  className="btn btn-primary btn-md mb-2"
                  data-bs-toggle="modal"
                  data-inert={true}
                  data-bs-target="#add_leaves"
                >
                  <i className="ti ti-square-rounded-plus me-1" />
                  Add Requests
                </Link>
              </div> */}
            </div>
          </div>
          {/* /Welcome Wrap */}
          <div className="row">
            <div className="col-xxl-4 col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Employees By Department</h5>
                  <div className="mb-2">
                    <span className="badge bg-soft-primary text-primary border border-primary">
                      Total:{" "}
                      {deptApiData.reduce(
                        (acc, curr) => acc + curr.total_employees,
                        0,
                      )}
                    </span>
                  </div>
                </div>
                <div className="card-body">
                  {isDeptLoading ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="d-flex justify-content-center">
                        <ReactApexChart
                          options={empDepartmentConfig}
                          series={empDepartmentConfig.series}
                          type="pie"
                          height={220}
                          width={220}
                        />
                      </div>
                      <div
                        style={{
                          maxHeight: "180px",
                          overflowY: "auto",
                          fontSize: "12px",
                          marginTop: "12px",
                        }}
                      >
                        {deptApiData.map((d: any, i: number) => {
                          const colors = [
                            "#F26522","#03C95A","#0C4B5E","#FFC107","#E70D0D","#ab7efd",
                            "#1B84FF","#00BCD4","#9C27B0","#FF5722","#607D8B","#8BC34A",
                            "#E91E63","#795548","#009688","#3F51B5","#CDDC39","#FF9800",
                          ];
                          const total = deptApiData.reduce((s: number, x: any) => s + x.total_employees, 0);
                          const pct = total > 0 ? ((d.total_employees / total) * 100).toFixed(1) : "0";
                          return (
                            <div
                              key={i}
                              className="d-flex align-items-center justify-content-between py-1"
                              style={{ borderBottom: "1px solid #f1f1f1" }}
                            >
                              <div className="d-flex align-items-center gap-2" style={{ minWidth: 0 }}>
                                <span
                                  style={{
                                    width: 10, height: 10, borderRadius: "50%",
                                    background: colors[i % colors.length],
                                    flexShrink: 0,
                                  }}
                                />
                                <span className="text-truncate" title={d.department}>
                                  {d.department}
                                </span>
                              </div>
                              <span className="fw-semibold ms-2 text-nowrap">
                                {d.total_employees} 
                              </span>
                            </div>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
            {/* /Employees By Department */}
            {/* Attendance Overview */}
            <div className="col-xxl-4 col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Attendance Overview</h5>
                  <div className="dropdown mb-2">
                    <Link
                      to="#"
                      className="btn btn-white border btn-sm d-inline-flex align-items-center"
                      data-bs-toggle="dropdown"
                    >
                      <i className="ti ti-calendar me-1" />
                      {selectedRange.replace("_", " ")}
                    </Link>
                    <ul className="dropdown-menu  dropdown-menu-end p-3">
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => setSelectedRange("this_month")}
                        >
                          This Month
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => setSelectedRange("this_week")}
                        >
                          This Week
                        </Link>
                      </li>
                      <li>
                        <Link
                          to="#"
                          className="dropdown-item rounded-1"
                          onClick={() => setSelectedRange("today")}
                        >
                          Today
                        </Link>
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="card-body">
                  <div className="chartjs-wrapper-demo position-relative mb-4">
                    <Chart
                      type="doughnut"
                      data={chartData}
                      options={chartOptions}
                      className="w-full attendence-chart md:w-30rem"
                    />
                    <div className="position-absolute text-center attendance-canvas">
                      <p className="fs-13 mb-1">Attendance</p>
                      {/* <h3>120</h3> */}
                    </div>
                  </div>
                  <h6 className="mb-3">Status</h6>
                  <h4 className="fw-bold">
                    {selectedRange === "today" ? "Today" : "Range"}
                  </h4>

                  <h6 className="mb-3">Breakdown (%)</h6>

                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-success me-1" />
                      Present
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">
                      {attendanceStats?.[selectedRange]?.present || 0}%
                    </p>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-secondary me-1" />
                      Late
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">
                      {attendanceStats?.[selectedRange]?.late || 0}%
                    </p>
                  </div>

                  <div className="d-flex align-items-center justify-content-between">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-warning me-1" />
                      Leave
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">
                      {attendanceStats?.[selectedRange]?.approved_leave || 0}%
                    </p>
                  </div>

                  <div className="d-flex align-items-center justify-content-between mb-2">
                    <p className="f-13 mb-2">
                      <i className="ti ti-circle-filled text-danger me-1" />
                      Absent
                    </p>
                    <p className="f-13 fw-medium text-gray-9 mb-2">
                      {attendanceStats?.[selectedRange]?.absent || 0}%
                    </p>
                  </div>

                  <div className="bg-light br-5 box-shadow-xs p-2 pb-0 d-flex align-items-center justify-content-between flex-wrap mt-3">
                    <p className="mb-2 me-2 small text-muted">
                      Data for: {selectedRange.replace("_", " ")}
                    </p>
                    <Link
                      to={all_routes.attendanceAdminKHR}
                      className="fs-13 link-primary text-decoration-underline mb-2"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              </div>
            </div>
            {/* /Attendance Overview */}
            <div className="col-xxl-4 col-xl-4 d-flex">
              <div className="card flex-fill">
                <div className="card-header pb-2 d-flex align-items-center justify-content-between flex-wrap">
                  <h5 className="mb-2">Employee Status</h5>
                </div>
                <div className="card-body">
                  {loadingStatus ? (
                    <div className="text-center py-5">
                      <div
                        className="spinner-border text-primary"
                        role="status"
                      />
                    </div>
                  ) : (
                    <>
                      <div className="d-flex align-items-center justify-content-between mb-1">
                        <p className="fs-13 mb-3">Employee Distribution</p>
                        {/* Using total_employees from your new API response */}
                        <h3 className="mb-3">
                          {statusApiData?.total_employees || "N/A"}
                        </h3>
                      </div>

                      {/* 🟢 DYNAMIC STACKED PROGRESS BAR */}
                      <div className="progress-stacked emp-stack mb-3">
                        <div
                          className="progress"
                          role="progressbar"
                          style={{ width: `${getTypePercent("permanent")}%` }}
                        >
                          <div className="progress-bar bg-primary" />
                        </div>
                        <div
                          className="progress"
                          role="progressbar"
                          style={{ width: `${getTypePercent("fixed_term")}%` }}
                        >
                          <div className="progress-bar bg-secondary" />
                        </div>
                        <div
                          className="progress"
                          role="progressbar"
                          style={{ width: `${getTypePercent("temporary")}%` }}
                        >
                          <div className="progress-bar bg-danger" />
                        </div>
                        <div
                          className="progress"
                          role="progressbar"
                          style={{ width: `${getTypePercent("other")}%` }}
                        >
                          <div className="progress-bar bg-pink" />
                        </div>
                      </div>

                      {/* 🟢 DYNAMIC STATUS BOXES */}
                      <div className="border mb-3 rounded shadow-sm overflow-hidden">
                        <div className="row gx-0">
                          <div className="col-6">
                            <div className="p-3 flex-fill border-end border-bottom bg-light-subtle">
                              <p className="fs-13 mb-2">
                                <i className="ti ti-square-filled text-primary fs-10 me-2" />
                                Permanent{" "}
                                <span className="text-gray-9">
                                  ({getTypePercent("permanent")}%)
                                </span>
                              </p>
                              <h3 className="display-1">
                                {getTypePercent("permanent")}%
                              </h3>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-3 flex-fill border-bottom bg-light-subtle text-end">
                              <p className="fs-13 mb-2">
                                <i className="ti ti-square-filled me-2 text-secondary fs-12" />
                                Fixed Term{" "}
                                <span className="text-gray-9">
                                  ({getTypePercent("fixed_term")}%)
                                </span>
                              </p>
                              <h3 className="display-1">
                                {getTypePercent("fixed_term")}%
                              </h3>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-3 flex-fill border-end">
                              <p className="fs-13 mb-2">
                                <i className="ti ti-square-filled me-2 text-danger fs-12" />
                                Temporary{" "}
                                <span className="text-gray-9">
                                  ({getTypePercent("temporary")}%)
                                </span>
                              </p>
                              <h3 className="display-1">
                                {getTypePercent("temporary")}%
                              </h3>
                            </div>
                          </div>
                          <div className="col-6">
                            <div className="p-3 flex-fill text-end">
                              <p className="fs-13 mb-2">
                                <i className="ti ti-square-filled text-pink me-2 fs-12" />
                                Others{" "}
                                <span className="text-gray-9">
                                  ({getTypePercent("other")}%)
                                </span>
                              </p>
                              <h2 className="display-1">
                                {getTypePercent("other")}%
                              </h2>
                            </div>
                          </div>
                        </div>
                      </div>

                      <Link
                        to={all_routes.employeeKHR}
                        className="btn btn-light btn-md w-100 mt-2"
                      >
                        View All Employees
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="row">
            <div className="col-12">
              <div className="card shadow-sm border-0">
                <div
                  className="card-header bg-transparent border-0 d-flex justify-content-between align-items-center"
                  style={{ position: "relative", zIndex: 1021 }}
                >
                  <h5 className="card-title mb-0 ">Live Check-In/Out Status</h5>
                  <div className="d-flex flax-col gap-2 justify-content-md-end">
                    <div className="dropdown">
                      <button
                        className="btn btn-white btn-sm border dropdown-toggle w-100"
                        data-bs-toggle="dropdown"
                        // aria-expanded="false"
                      >
                        {selectedDept}
                      </button>
                      <ul className="dropdown-menu dropdown-menu-end shadow-sm">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => setSelectedDept("All Departments")}
                          >
                            All Departments
                          </button>
                        </li>
                        {clockLogs &&
                          Object.keys(clockLogs[clockRange] || {}).map(
                            (dept) => (
                              <li key={dept}>
                                <button
                                  className="dropdown-item"
                                  onClick={() => setSelectedDept(dept)}
                                >
                                  {dept}
                                </button>
                              </li>
                            ),
                          )}
                      </ul>
                    </div>
                    <div className="dropdown">
                      <button
                        className="btn btn-white btn-sm border dropdown-toggle"
                        data-bs-toggle="dropdown"
                      >
                        {clockRange === "this_week" ? "This Week" : clockRange === "today" ? "Today" : clockRange.replace(/_/g, " ").replace(/\b\w/g, c => c.toUpperCase())}
                      </button>
                      <ul className="dropdown-menu">
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => setClockRange("today")}
                          >
                            Today
                          </button>
                        </li>
                        <li>
                          <button
                            className="dropdown-item"
                            onClick={() => setClockRange("this_week")}
                          >
                            This Week
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
                <div className="card-body p-0">
                  <div
                    className="table-responsive slim-scroll"
                    style={{ maxHeight: "400px" }}
                  >
                    <table className="table table-nowrap align-middle mb-0">
                      <thead className="sticky-top bg-light">
                        <tr>
                          <th className="ps-4">Employee</th>
                          <th>Check-In</th>
                          <th>Check-Out</th>
                          <th>Status</th>
                          <th className="text-end pe-4">Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {displayLogs.length > 0 ? (
                          displayLogs.map((log: any, index: number) => (
                            <tr key={index}>
                              <td className="ps-4">
                                <div className="d-flex align-items-center">
                                  <div className="avatar avatar-sm bg-soft-primary rounded-circle text-primary fw-bold d-flex align-items-center justify-content-center">
                                    {log.employee_name.charAt(0)}
                                  </div>
                                  <div className="ms-2">
                                    <h6 className="fs-13 mb-0">
                                      {log.employee_name}
                                    </h6>
                                    <span className="text-muted fs-11">
                                      ID: {log.employee_id}
                                    </span>
                                  </div>
                                </div>
                              </td>
                              <td className="fs-13 fw-medium">
                                {dayjs(log.check_in).format("hh:mm A")}
                              </td>
                              <td className="fs-13 fw-medium">
                                {log.check_out
                                  ? dayjs(log.check_out).format("hh:mm A")
                                  : "--:--"}
                              </td>
                              <td>
                                {log.check_out ? (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    borderRadius: "20px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: "#fff1f0",
                                    color: "#cf1322",
                                    border: "1px solid #ffa39e",
                                    lineHeight: "14px",
                                  }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#cf1322", flexShrink: 0 }} />
                                    Checked Out
                                  </span>
                                ) : (
                                  <span style={{
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "5px",
                                    padding: "4px 10px",
                                    borderRadius: "20px",
                                    fontSize: "11px",
                                    fontWeight: 600,
                                    background: "#f6ffed",
                                    color: "#389e0d",
                                    border: "1px solid #b7eb8f",
                                    lineHeight: "14px",
                                  }}>
                                    <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#52c41a", flexShrink: 0 }} />
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="text-end pe-4 fs-12 text-muted">
                                {dayjs(log.check_in).format("DD MMM, YYYY")}
                              </td>
                            </tr>
                          ))
                        ) : (
                          <tr>
                            <td
                              colSpan={5}
                              className="text-center py-5 text-muted"
                            >
                              No activity found for this period.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AddEditEmployeeModal2
        data={editData}
        preventClose={isProfileLocked}
        onSuccess={handleModalSuccess} // Use the stable function
        onClose={handleModalClose} // Use the stable function
      />
    </>
  );
};

export default AdminDashboard;
