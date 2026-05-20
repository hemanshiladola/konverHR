import React, { useEffect, useState } from "react";
import { all_routes } from "../../../router/all_routes";
import DatatableKHR from "../../../CommonComponent/DataTableKHR/DatatableKHR";
import CommonHeader from "../../../CommonComponent/HeaderKHR/HeaderKHR";
import AddEditExpenseKHRModal from "./AddEditExpenseKHRModal";
import moment from "moment";
import { getExpenses, deleteExpense } from "./ExpenseKHRService";

const ExpenseKHR = () => {
  const routes = all_routes;
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [selectedExpense, setSelectedExpense] = useState<any | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    src: string;
    type: string;
    name: string;
  } | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const result: any = await getExpenses();
      const list = Array.isArray(result.data?.data)
        ? result.data.data
        : Array.isArray(result.data)
          ? result.data
          : [];
      const mappedData = list.map((item: any, index: number) => ({
        ...item,
        key: String(item.id || index),
      }));
      setData(mappedData);
    } catch (error) {
      console.error("Failed to load expenses", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const base64ToBlob = (base64: string, mimeType: string) => {
    try {
      const byteCharacters = atob(base64.split(",")[1] || base64);
      const byteArrays = [];
      for (let offset = 0; offset < byteCharacters.length; offset += 512) {
        const slice = byteCharacters.slice(offset, offset + 512);
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        byteArrays.push(new Uint8Array(byteNumbers));
      }
      return new Blob(byteArrays, { type: mimeType });
    } catch (e) {
      return null;
    }
  };

  const getMimeType = (name: string): string => {
    const ext = (name || "").split(".").pop()?.toLowerCase() || "";
    const map: Record<string, string> = {
      png: "image/png",
      jpg: "image/jpeg",
      jpeg: "image/jpeg",
      gif: "image/gif",
      webp: "image/webp",
      pdf: "application/pdf",
    };
    return map[ext] || "application/octet-stream";
  };

  const handlePreview = (file: any) => {
    let rawBase64 = file.base64 || "";
    if (!rawBase64 || rawBase64.length < 50) {
      alert("No valid file data found.");
      return;
    }
    const mimeType = file.mimetype || getMimeType(file.name || "");
    const isPdf = mimeType === "application/pdf";
    let finalSrc = "";

    if (isPdf) {
      const blob = base64ToBlob(rawBase64, "application/pdf");
      if (blob) finalSrc = URL.createObjectURL(blob);
      else return;
    } else {
      finalSrc = rawBase64.startsWith("data:")
        ? rawBase64
        : `data:${mimeType};base64,${rawBase64}`;
    }

    setPreviewFile({ src: finalSrc, type: mimeType, name: file.name });
    setIsPreviewOpen(true);
  };

  const closePreview = () => {
    if (
      previewFile?.type === "application/pdf" &&
      previewFile.src.startsWith("blob:")
    ) {
      URL.revokeObjectURL(previewFile.src);
    }
    setPreviewFile(null);
    setIsPreviewOpen(false);
  };

  const columns: any[] = [
    {
      title: "Id",
      dataIndex: "id",
      render: (_: any, __: any, index: number) => (
        <span className="text-muted">{index + 1}</span>
      ),
    },
    {
      title: "Employee",
      dataIndex: "employee_name",
      render: (val: any) => (
        <span className="fw-medium text-dark">{val || "-"}</span>
      ),
    },
    {
      title: "Description",
      dataIndex: "name",
      render: (val: any) => <span>{val || "-"}</span>,
    },
    {
      title: "Date",
      dataIndex: "date",
      render: (val: any) => (
        <span>{val ? moment(val).format("DD MMM YYYY") : "-"}</span>
      ),
      sorter: (a: any, b: any) =>
        moment(a.date).valueOf() - moment(b.date).valueOf(),
    },
    {
      title: "Total Amount",
      dataIndex: "total_amount",
      render: (val: any) => <span className="fw-bold text-dark">₹ {val}</span>,
      sorter: (a: any, b: any) =>
        Number(a.total_amount) - Number(b.total_amount),
    },
    {
      title: "Paid By",
      dataIndex: "payment_mode",
      render: (val: string) => (
        <span
          className={`badge ${val === "own_account" ? "bg-soft-info text-info" : "bg-soft-primary text-primary"}`}
        >
          {val === "own_account" ? "Employee" : "Company"}
        </span>
      ),
    },
    {
      title: "Status",
      dataIndex: "state",
      render: (val: any) => {
        const status = val
          ? val.charAt(0).toUpperCase() + val.slice(1)
          : "Draft";
        let badgeClass = "bg-light text-dark border";
        if (val === "submitted") badgeClass = "bg-soft-warning text-warning";
        if (val === "approved") badgeClass = "bg-soft-success text-success";
        if (val === "refused") badgeClass = "bg-soft-danger text-danger";
        if (val === "reported") badgeClass = "bg-soft-info text-info";
        return <span className={`badge ${badgeClass}`}>{status}</span>;
      },
    },
    {
      title: "Receipts",
      dataIndex: "attachments",
      render: (_: any, record: any) => {
        const attachments: any[] =
          record.attachments || record.attachment_ids || [];
        if (!attachments || attachments.length === 0)
          return <span className="text-muted">-</span>;
        return (
          <div className="d-flex align-items-center gap-2 flex-wrap">
            {attachments.map((file: any, index: number) => {
              const mimeType = file.mimetype || getMimeType(file.name || "");
              const isImage = mimeType.startsWith("image/");
              const isPdf = mimeType === "application/pdf";
              let iconClass = "ti-file text-secondary";
              if (isImage) iconClass = "ti-photo text-primary";
              if (isPdf) iconClass = "ti-file-type-pdf text-danger";
              return (
                <div
                  key={file.id ?? index}
                  className="d-flex align-items-center justify-content-center border rounded bg-white shadow-sm"
                  onClick={() => handlePreview(file)}
                  title={`View ${file.name}`}
                  style={{
                    cursor: "pointer",
                    width: "32px",
                    height: "32px",
                    transition: "all 0.2s",
                  }}
                >
                  <i className={`ti ${iconClass} fs-18`} />
                </div>
              );
            })}
          </div>
        );
      },
    },
  ];

  return (
    <div className="main-wrapper">
      <div className="page-wrapper">
        <div className="content">
          <div onClick={() => setSelectedExpense(null)}>
            <CommonHeader
              title="My Expenses"
              parentMenu="Expenses"
              activeMenu="My Expenses"
              routes={routes}
              buttonText="Create Expense"
              modalTarget="#add_expense_modal"
            />
          </div>

          {loading ? (
            <div className="d-flex flex-column align-items-center justify-content-center p-5">
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading...</span>
              </div>
              <p className="mt-3 text-muted fw-medium">Loading Expenses...</p>
            </div>
          ) : (
            <DatatableKHR columns={columns} data={data} />
          )}
        </div>
      </div>

      <AddEditExpenseKHRModal
        onSuccess={fetchData}
        data={selectedExpense}
        onClose={() => setSelectedExpense(null)}
      />

      {isPreviewOpen && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            role="dialog"
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "700px" }}
            >
              <div
                className="modal-content shadow-lg border-0"
                style={{ height: "80vh" }}
              >
                <div className="modal-header border-bottom bg-light py-2">
                  <h5 className="modal-title fs-15 fw-bold text-dark text-truncate">
                    {previewFile?.name || "Preview"}
                  </h5>
                  <button
                    type="button"
                    className="btn-close"
                    onClick={closePreview}
                  ></button>
                </div>
                <div
                  className="modal-body p-0 bg-light d-flex align-items-center justify-content-center"
                  style={{ flex: 1, overflow: "hidden" }}
                >
                  {previewFile?.type.startsWith("image/") ? (
                    <img
                      src={previewFile.src}
                      alt="Preview"
                      className="img-fluid"
                      style={{ maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <iframe
                      src={previewFile?.src}
                      title="PDF Preview"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  )}
                </div>
                <div className="modal-footer py-2 px-3 border-top bg-white">
                  <button
                    onClick={closePreview}
                    className="btn btn-secondary btn-sm me-2"
                  >
                    Close
                  </button>
                  <a
                    href={previewFile?.src}
                    download={previewFile?.name}
                    className="btn btn-primary btn-sm"
                  >
                    <i className="ti ti-download"></i> Download
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }}></div>
        </>
      )}
    </div>
  );
};

export default ExpenseKHR;
