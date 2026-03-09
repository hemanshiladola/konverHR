import React, { useEffect, useState } from "react";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import AddEditPayslipModal from "./AddEditPayslipModal";
import {
  getPayslips,
  computePayslip,
  confirmPayslip,
  markPaidPayslip,
} from "./PayslipServices";
import { toast } from "react-toastify";
import { all_routes } from "@/router/all_routes";
import DatatableKHR from "@/CommonComponent/DataTableKHR/DatatableKHR";
import ViewPayslipModal from "./ViewPayslipModal";

const PayslipKHR = () => {
  const [payslips, setPayslips] = useState([]);
  const [selectedPayslip, setSelectedPayslip] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [viewData, setViewData] = useState<any | null>(null);

  const fetchPayslips = async () => {
    setLoading(true);
    try {
      const response: any = await getPayslips();
      // Your API returns data inside a 'data' array
      const rawArray = response?.data || response || [];

      const mappedData = rawArray.map((item: any) => ({
        ...item,
        id: item.payslip_id,
        key: String(item.payslip_id),
        // Use the computed name or fallback to the Reference Number
        display_name: item.number || `Draft Slip #${item.payslip_id}`,
      }));

      setPayslips(mappedData);
    } catch (error) {
      toast.error("Failed to fetch payslips");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayslips();
  }, []);

  const handleProcessAction = async (id: number, actionName: string) => {
    try {
      if (actionName === "compute") await computePayslip(id);
      if (actionName === "confirm") await confirmPayslip(id);
      if (actionName === "paid") await markPaidPayslip(id);
      toast.success(`Payslip ${actionName} successful`);
      fetchPayslips();
    } catch (err) {
      toast.error("Action failed");
    }
  };

  const handleEdit = (record: any) => {
    setSelectedPayslip(record);
    const modalElement = document.getElementById("add_payslip_modal");
    if (modalElement) {
      const modal = new (window as any).bootstrap.Modal(modalElement);
      modal.show();
    }
  };

  // const columns = [
  //   { title: "Reference", dataIndex: "name", sorter: true },
  //   {
  //     title: "Employee",
  //     dataIndex: "employee_id",
  //     render: (emp: any) => (Array.isArray(emp) ? emp[1] : emp),
  //   },
  //   // { title: "ID Card", dataIndex: "employee_code" },
  //   { title: "Date From", dataIndex: "date_from" },
  //   { title: "Date To", dataIndex: "date_to" },
  //   {
  //     title: "Status",
  //     render: (record: any) => (
  //       <span
  //         className={`badge rounded-pill bg-soft-${record.status === "paid" ? "success" : "primary"}`}
  //       >
  //         {record.status?.toUpperCase() || "DRAFT"}
  //       </span>
  //     ),
  //   },
  //   {
  //     title: "Action",
  //     render: (record: any) => (
  //       <div className="d-flex gap-2">
  //         <button
  //           className="btn btn-sm btn-soft-info"
  //           onClick={() => handleProcessAction(record.id, "compute")}
  //           title="Compute"
  //         >
  //           <i className="ti ti-calculator"></i>
  //         </button>
  //         <button
  //           className="btn btn-sm btn-soft-warning"
  //           onClick={() => handleProcessAction(record.id, "confirm")}
  //           title="Confirm"
  //         >
  //           <i className="ti ti-check"></i>
  //         </button>
  //         <button
  //           className="btn btn-sm btn-soft-success"
  //           onClick={() => handleProcessAction(record.id, "paid")}
  //           title="Mark Paid"
  //         >
  //           <i className="ti ti-currency-dollar"></i>
  //         </button>
  //       </div>
  //     ),
  //   },
  // ];

  const handleView = (record: any) => {
    setViewData(record);

    // This is the part that was likely missing:
    // const modalElement = document.getElementById("view_payslip_modal");
    // if (modalElement) {
    //   const modal = new (window as any).bootstrap.Modal(modalElement);
    //   modal.show();
    // }
  };

  const columns = [
    {
      title: "Reference",
      dataIndex: "display_name",
      render: (text: string, record: any) => (
        <div>
          <span className="fw-bold text-dark">{text}</span>
          {record.currency && (
            <small className="text-muted ms-1">({record.currency})</small>
          )}
        </div>
      ),
      sorter: (a: any, b: any) =>
        String(a.number).localeCompare(String(b.number)),
    },
    {
      title: "Employee",
      dataIndex: "employee_name",
      sorter: (a: any, b: any) =>
        a.employee_name.localeCompare(b.employee_name),
    },
    {
      title: "Period",
      render: (record: any) => (
        <span className="fs-12">
          {record.date_from}{" "}
          <i className="ti ti-arrow-right mx-1 text-muted"></i> {record.date_to}
        </span>
      ),
    },
    {
      title: "Net Wage",
      dataIndex: "net_wage",
      render: (wage: number, record: any) => (
        <span className="fw-bold text-primary">
          {record.currency === "INR" ? "₹" : ""}
          {wage?.toLocaleString() || "0.00"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      render: (state: string) => {
        const colors: any = {
          draft: "bg-soft-secondary text-secondary border-secondary",
          verify: "bg-soft-warning text-warning border-warning",
          done: "bg-soft-info text-info border-info",
          paid: "bg-soft-success text-success border-success",
          cancel: "bg-soft-danger text-danger border-danger",
        };
        return (
          <span
            className={`badge border px-2 py-1 fs-11 fw-bold text-uppercase ${colors[state] || "bg-soft-primary"}`}
          >
            {state}
          </span>
        );
      },
    },
    {
      title: "Action",
      render: (record: any) => (
        <div className="d-flex gap-2">
          {/* Only show Compute for Draft/Verify */}
          {(record.state === "draft" || record.state === "verify") && (
            <button
              className="btn btn-sm btn-outline-info"
              onClick={() => handleProcessAction(record.id, "compute")}
              title="Compute Sheet"
            >
              <i className="ti ti-calculator"></i>
            </button>
          )}
          {/* {record.state === "verify" && ( */}
          <button
            className="btn btn-sm btn-soft-secondary"
            onClick={() => handleView(record)}
            title="View Payslip"
          >
            <i className="ti ti-eye"></i>
          </button>
          {/* // )} */}
          {/* Only show Confirm for Draft/Verify */}
          {record.state === "draft" && (
            <button
              className="btn btn-sm btn-outline-warning"
              onClick={() => handleProcessAction(record.id, "confirm")}
              title="Confirm"
            >
              <i className="ti ti-check"></i>
            </button>
          )}
          {/* Only show Pay for Done */}
          {record.state === "done" && (
            <button
              className="btn btn-sm btn-outline-success"
              onClick={() => handleProcessAction(record.id, "paid")}
              title="Mark as Paid"
            >
              <i className="ti ti-currency-dollar"></i>
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="page-wrapper">
      <div className="content">
        <CommonHeader
          title="Payroll Management"
          parentMenu="HR"
          activeMenu="Payslips"
          buttonText="Compute Payslip"
          modalTarget="#add_payslip_modal"
          routes={all_routes}
        />

        {/* <div className="card mt-4 shadow-sm border-0">
          <div className="card-body p-0"> */}
        <DatatableKHR data={payslips} columns={columns} />
        {/* </div>
        </div> */}

        <AddEditPayslipModal
          onSuccess={fetchPayslips}
          data={selectedPayslip}
          onClose={() => setSelectedPayslip(null)}
        />
        <ViewPayslipModal data={viewData} onClose={() => setViewData(null)} />
      </div>
    </div>
  );
};

export default PayslipKHR;
