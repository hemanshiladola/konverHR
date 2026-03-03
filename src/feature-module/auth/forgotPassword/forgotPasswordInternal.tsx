import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Instance from "../../../api/axiosInstance";
import { toast } from "react-toastify";

const ForgotPasswordInternal = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string }>({});

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

  const handleSendMail = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (!email) {
      setErrors({ email: "⚠️ Email is required." });
      return;
    }
    if (!validateEmail(email)) {
      setErrors({ email: "Invalid email format." });
      return;
    }

    setIsLoading(true);
    try {
      const res = await Instance.post("/api/forgot-password", { email });
      if (res.data.status === "error") {
        toast.error(res.data.message || "Request failed.");
        return;
      }
      toast.success("📨 Reset instructions sent to your email!");
      setTimeout(() => {
        navigate(`/settings/reset-password?email=${encodeURIComponent(email)}`);
      }, 1500);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        {/* -- BREADCRUMB HEADER -- */}
        <div className="page-header">
          <div className="add-item d-flex align-items-center justify-content-between">
            <div className="page-title">
              <h4>Forgot Password</h4>
              <h6>Settings / Security / Forgot Password</h6>
            </div>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-12">
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="row g-0">
                {/* -- LEFT SIDE: INFO & TIPS (Fills the 'Empty' space) -- */}
                <div className="col-md-5 bg-light border-end d-none d-md-block">
                  <div className="p-4 h-100 d-flex flex-column justify-content-center">
                    <div className="text-center mb-4">
                      <i
                        className="ti ti-lock-question text-primary"
                        style={{ fontSize: "60px" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold text-dark">Security Verification</h5>
                    <p className="text-muted small">
                      For your protection, we need to verify your identity
                      before you can change your password.
                    </p>
                    <ul className="list-unstyled mt-3">
                      <li className="d-flex align-items-start mb-2 small text-muted">
                        <i className="ti ti-check text-success me-2 mt-1"></i>
                        Check your spam folder if you don't see the email.
                      </li>
                      <li className="d-flex align-items-start mb-2 small text-muted">
                        <i className="ti ti-check text-success me-2 mt-1"></i>
                        The reset link will be valid for 24 hours.
                      </li>
                      <li className="d-flex align-items-start small text-muted">
                        <i className="ti ti-check text-success me-2 mt-1"></i>
                        Contact support if you no longer have access to this
                        email.
                      </li>
                    </ul>
                  </div>
                </div>

                {/* -- RIGHT SIDE: THE FORM -- */}
                <div className="col-md-7 bg-white">
                  <div className="card-body p-4 p-lg-5">
                    <div className="mb-4">
                      <h3 className="fw-bold">Request Reset</h3>
                      <p className="text-muted">
                        Enter the email associated with your account.
                      </p>
                    </div>

                    <form onSubmit={handleSendMail}>
                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark fs-13">
                          Email Address
                        </label>
                        <div
                          className={`input-group ${errors.email ? "is-invalid" : ""}`}
                        >
                          <span className="input-group-text bg-transparent border-end-0">
                            <i className="ti ti-mail text-muted"></i>
                          </span>
                          <input
                            type="email"
                            className={`form-control border-start-0 ps-0 ${errors.email ? "is-invalid" : ""}`}
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="e.g. adrian@konverthr.com"
                          />
                        </div>
                        {errors.email && (
                          <div className="text-danger small mt-1">
                            {errors.email}
                          </div>
                        )}
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-3 mt-5">
                        <Link
                          to={routes.adminDashboard}
                          className="btn btn-light w-100"
                        >
                          Cancel
                        </Link>
                        <button
                          type="submit"
                          className="btn btn-primary w-100"
                          disabled={isLoading}
                        >
                          {isLoading ? "Processing..." : "Send Reset Link"}
                        </button>
                      </div>
                    </form>

                    <div className="mt-5 pt-4 border-top text-center">
                      <p className="mb-0 small text-muted">
                        Need help?{" "}
                        <Link to="#" className="text-primary fw-bold">
                          Visit Help Center
                        </Link>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPasswordInternal;
