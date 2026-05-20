/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTickets, Ticket } from "./HelpDeskTickitsKHRServices";
import CommonHeader from "@/CommonComponent/HeaderKHR/HeaderKHR";
import AddHelpDeskTickitsModal from "./AddHelpDeskTickitsModal";
import { all_routes } from "@/router/all_routes";

// Build src from either a URL or base64 string
const buildSrc = (attachment: string): { src: string; mime: string } => {
  if (!attachment) return { src: "", mime: "image/png" };
  // If it's a URL, use directly
  if (attachment.startsWith("http://") || attachment.startsWith("https://")) {
    const ext = attachment.split(".").pop()?.toLowerCase() || "";
    const mime = ext === "pdf" ? "application/pdf" : "image/jpeg";
    return { src: attachment, mime };
  }
  // data URI
  if (attachment.startsWith("data:")) {
    return { src: attachment, mime: attachment.split(";")[0].replace("data:", "") };
  }
  // base64 — detect mime from header bytes
  const clean = attachment.replace(/[^A-Za-z0-9+/=]/g, "");
  try {
    const padded = clean + "==".slice((clean.length % 4) || 4);
    const header = atob(padded.substring(0, 20));
    const bytes = header.split("").map((c) => c.charCodeAt(0));
    let mime = "image/png";
    if (bytes[0] === 0xff && bytes[1] === 0xd8) mime = "image/jpeg";
    if (bytes[0] === 0x47 && bytes[1] === 0x49) mime = "image/gif";
    if (bytes[0] === 0x25 && bytes[1] === 0x50) mime = "application/pdf";
    return { src: `data:${mime};base64,${padded}`, mime };
  } catch (_) {}
  return { src: `data:image/png;base64,${clean}`, mime: "image/png" };
};

const HelpDeskTickitsKHR = () => {
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Ticket | null>(null);
  const [preview, setPreview] = useState<{ src: string; mime: string; name: string } | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await getTickets();
      setData(response || []);
    } catch (error) {
      toast.error("Sync failed");
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (stage: string) => {
    const s = stage?.toLowerCase();
    if (s === "on hold") return "#ff4d4f";
    if (s === "in progress") return "#ffa940";
    if (s === "done") return "#52c41a";
    return "#1890ff";
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <CommonHeader
          title="Tickets"
          parentMenu="Tickets"
          activeMenu="Support"
          routes={all_routes}
          buttonText="Create Support Tickets"
          modalTarget="#add_ticket_modal"
        />

        {loading ? (
          <div
            className="d-flex align-items-center justify-content-center mt-5"
            style={{ minHeight: "300px" }}
          >
            <div className="text-center">
              <div
                className="spinner-border text-primary"
                role="status"
                style={{ width: "3rem", height: "3rem" }}
              >
                <span className="visually-hidden">Loading Tickets...</span>
              </div>
              {/* <p className="mt-3 text-muted fw-bold">
                Fetching Support Tickets...
              </p> */}
            </div>
          </div>
        ) : (
          <div className="mt-3">
            <div className="row g-3">
              {data.map((ticket) => {
                const accentColor = getStatusColor(ticket.stage || "");
                return (
                  <div
                    className="col-xxl-2 col-xl-3 col-lg-4 col-md-6"
                    key={ticket.id}
                  >
                    <div
                      className="position-relative overflow-hidden transition-all shadow-sm bg-white h-100 d-flex flex-column"
                      style={{
                        borderRadius: "16px",
                        border: "1px solid rgba(0,0,0,0.05)",
                        transition: "0.2s ease",
                      }}
                      onMouseOver={(e) =>
                        (e.currentTarget.style.transform = "scale(1.02)")
                      }
                      onMouseOut={(e) =>
                        (e.currentTarget.style.transform = "scale(1)")
                      }
                    >
                      <div
                        style={{ height: "4px", background: accentColor }}
                      ></div>

                      <div className="p-3 flex-grow-1">
                        <div className="d-flex justify-content-between align-items-center mb-2">
                          <span
                            className="badge rounded-pill font-black uppercase"
                            style={{
                              backgroundColor: `${accentColor}15`,
                              color: accentColor,
                              fontSize: "9px",
                            }}
                          >
                            {ticket.stage || "NEW"}
                          </span>
                          <span className="text-muted x-small opacity-50">
                            #{ticket.id}
                          </span>
                        </div>

                        <h6
                          className="fw-black text-dark mb-2 text-truncate"
                          title={ticket.name}
                        >
                          {ticket.name}
                        </h6>

                        {/* --- ATTACHMENT PREVIEW --- */}
                        {ticket.attachment && (() => {
                          const { src, mime } = buildSrc(ticket.attachment);
                          const isImage = mime.startsWith("image/");
                          const isPdf = mime === "application/pdf";
                          return (
                            <div
                              className="mb-2 overflow-hidden bg-light d-flex align-items-center justify-content-center"
                              style={{ borderRadius: "8px", height: "80px", cursor: "pointer", border: "1px solid #eee" }}
                              onClick={() => setPreview({ src, mime, name: ticket.name || "attachment" })}
                              title="Click to preview"
                            >
                              {isImage ? (
                                <img
                                  src={src}
                                  alt="Attachment"
                                  className="w-100 h-100"
                                  style={{ objectFit: "cover" }}
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                />
                              ) : isPdf ? (
                                <div className="text-center text-danger">
                                  <i className="ti ti-file-type-pdf" style={{ fontSize: "32px" }} />
                                  <div style={{ fontSize: "10px" }}>PDF</div>
                                </div>
                              ) : (
                                <div className="text-center text-secondary">
                                  <i className="ti ti-file" style={{ fontSize: "32px" }} />
                                  <div style={{ fontSize: "10px" }}>File</div>
                                </div>
                              )}
                            </div>
                          );
                        })()}

                        <p
                          className="text-muted mb-0"
                          style={{
                            fontSize: "11px",
                            lineHeight: "1.4",
                            display: "-webkit-box",
                            WebkitLineClamp: "2",
                            WebkitBoxOrient: "vertical",
                            overflow: "hidden",
                          }}
                        >
                          {ticket.description}
                        </p>
                      </div>

                      <div className="p-3 pt-0 mt-auto">
                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-light">
                          <span className="x-small text-muted font-bold">
                            {new Date(ticket.create_date!).toLocaleDateString()}
                          </span>
                          {/* <button
                            className="btn btn-icon btn-sm btn-soft-primary rounded-circle"
                            onClick={() => setSelectedItem(ticket)}
                            data-bs-toggle="modal"
                            data-bs-target="#add_ticket_modal"
                          >
                            <i
                              className="ti ti-pencil"
                              style={{ fontSize: "12px" }}
                            ></i>
                          </button> */}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      <AddHelpDeskTickitsModal onSuccess={fetchData} data={selectedItem} />

      {/* Attachment Preview Modal */}
      {preview && (
        <>
          <div
            className="modal fade show"
            style={{ display: "block", zIndex: 1060 }}
            role="dialog"
            onClick={() => setPreview(null)}
          >
            <div
              className="modal-dialog modal-dialog-centered"
              style={{ maxWidth: "700px" }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="modal-content shadow-lg border-0" style={{ height: "80vh" }}>
                <div className="modal-header bg-light py-2">
                  <h5 className="modal-title fs-15 fw-bold text-truncate">{preview.name}</h5>
                  <button className="btn-close" onClick={() => setPreview(null)} />
                </div>
                <div
                  className="modal-body p-0 bg-light d-flex align-items-center justify-content-center"
                  style={{ flex: 1, overflow: "hidden" }}
                >
                  {preview.mime.startsWith("image/") ? (
                    <img
                      src={preview.src}
                      alt="Preview"
                      className="img-fluid"
                      style={{ maxHeight: "100%", objectFit: "contain" }}
                    />
                  ) : (
                    <iframe
                      src={preview.src}
                      title="Preview"
                      width="100%"
                      height="100%"
                      style={{ border: "none" }}
                    />
                  )}
                </div>
                <div className="modal-footer py-2 bg-white">
                  <button className="btn btn-secondary btn-sm me-2" onClick={() => setPreview(null)}>Close</button>
                  <a href={preview.src} download={preview.name} className="btn btn-primary btn-sm">
                    <i className="ti ti-download me-1" /> Download
                  </a>
                </div>
              </div>
            </div>
          </div>
          <div className="modal-backdrop fade show" style={{ zIndex: 1050 }} />
        </>
      )}
    </div>
  );
};

export default HelpDeskTickitsKHR;
