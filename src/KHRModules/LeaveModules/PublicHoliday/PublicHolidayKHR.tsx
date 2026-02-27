import React, { useEffect, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import DatatableKHR from "../../../CommonComponent/DataTableKHR/DatatableKHR";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import AddEditPublicHolidayModal from "./AddEditPublicHolidayModal";
import moment from "moment";
import { Link } from "react-router-dom";

import { getHolidays, deleteHoliday } from "./PublicHolidayServices";
import { toast } from "react-toastify";

const PublicHolidayKHR = () => {
  const routes = all_routes;
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [data, setData] = useState<any[]>([]);

  const columns: any[] = [
    {
      title: "Name",
      dataIndex: "name",
      render: (val: any) => <span>{val ? String(val) : "-"}</span>,
      sorter: (a: any, b: any) =>
        String(a?.name ?? "").localeCompare(String(b?.name ?? "")),
    },
    {
      title: "Date From",
      dataIndex: "date_from",
      render: (val: any) => (
        <span>{val ? moment(val).format("DD/MM/YYYY") : "-"}</span>
      ),
      sorter: (a: any, b: any) =>
        moment(a?.date_from).valueOf() - moment(b?.date_from).valueOf(),
    },
    {
      title: "Date To",
      dataIndex: "date_to",
      render: (val: any) => (
        <span>{val ? moment(val).format("DD/MM/YYYY") : "-"}</span>
      ),
      sorter: (a: any, b: any) =>
        moment(a?.date_to).valueOf() - moment(b?.date_to).valueOf(),
    },
    {
      title: "Work Entry Type",
      dataIndex: "work_entry_name", // UPDATED: Use the string name directly
      render: (val: any) => <span>{val ? String(val) : "-"}</span>,
      sorter: (a: any, b: any) =>
        String(a?.work_entry_name ?? "").localeCompare(
          String(b?.work_entry_name ?? ""),
        ),
    },
    {
      title: "Calendar",
      dataIndex: "calender_name", // UPDATED: Match API spelling 'calender_name'
      render: (val: any) => <span>{val ? String(val) : "-"}</span>,
      sorter: (a: any, b: any) =>
        String(a?.calender_name ?? "").localeCompare(
          String(b?.calender_name ?? ""),
        ),
    },
    {
      title: "Actions",
      dataIndex: "id",
      render: (_: any, record: any) => (
        <div className="action-icon d-inline-flex">
          <Link
            to="#"
            className="me-2"
            data-bs-toggle="modal"
            data-bs-target="#add_attendance_policy"
            onClick={() => setSelectedPolicy({ ...record })}
          >
            <i className="ti ti-edit text-blue" />
          </Link>
          <Link to="#" onClick={() => handleDelete(record.id)}>
            <i className="ti ti-trash text-danger" />
          </Link>
        </div>
      ),
    },
  ];

  const fetchData = async () => {
    try {
      const response = await getHolidays();
      const holidays = response.data.data || response.data || [];
      setData(holidays);
    } catch (error) {
      console.error("Error fetching holidays:", error);
      setData([]);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id: string | number) => {
    if (
      window.confirm("Are you sure you want to delete this public holiday?")
    ) {
      try {
        await deleteHoliday(Number(id));
        fetchData(); // Refresh the list after successful deletion
        // alert("Public holiday deleted successfully!");
        toast.success("Public holiday deleted successfully!");
      } catch (error) {
        console.error("Error deleting public holiday:", error);
        // alert("Failed to delete public holiday.");
        toast.error("Failed to delete public holiday");
      }
    }
  };

  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content">
          <div onClick={() => setSelectedPolicy(null)}>
            <CommonHeader
              title="Public Holiday List"
              parentMenu="HR"
              activeMenu="Public Holiday List"
              routes={routes}
              buttonText="Add Public Holiday"
              modalTarget="#add_attendance_policy"
            />
          </div>

          <div className="card mb-3">
            <div className="card-body">
              <h5 className="card-title">Leave List</h5>
              <div className="mt-3">
                <DatatableKHR columns={columns} data={data} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <AddEditPublicHolidayModal onSuccess={fetchData} data={selectedPolicy} />
    </div>
  );
};

export default PublicHolidayKHR;
