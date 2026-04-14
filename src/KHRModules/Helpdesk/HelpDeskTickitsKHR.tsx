/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { getTickets, Ticket } from "./HelpDeskTickitsKHRServices";
import CommonHeader from "@/CommonComponent/HeaderKHR/HeaderKHR";
import AddHelpDeskTickitsModal from "./AddHelpDeskTickitsModal";
import { all_routes } from "@/router/all_routes";

const HelpDeskTickitsKHR = () => {
  const [data, setData] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedItem, setSelectedItem] = useState<Ticket | null>(null);

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

                        {/* --- COMPACT IMAGE PREVIEW --- */}
                        {ticket.attachment && (
                          <div
                            className="mb-2 overflow-hidden bg-light"
                            style={{ borderRadius: "8px", height: "100px" }}
                          >
                            <img
                              src={`data:image/png;base64,${ticket.attachment.replace(/\s/g, "")}`}
                              alt="Proof"
                              className="w-100 h-100"
                              style={{ objectFit: "cover" }}
                            />
                          </div>
                        )}

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
    </div>
  );
};

export default HelpDeskTickitsKHR;
