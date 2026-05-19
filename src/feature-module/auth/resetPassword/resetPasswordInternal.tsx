import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Instance from "../../../api/axiosInstance";
import { toast } from "react-toastify";

type PasswordField = "tempPassword" | "newPassword" | "confirmPassword";

const ResetPasswordInternal = () => {
  const routes = all_routes;
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Form State
  const [email, setEmail] = useState(""); // 3. Added email state
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // 4. Load email from URL on mount (Same logic as your standalone version)
  useEffect(() => {
    const emailParam = searchParams.get("email");
    if (emailParam) {
      setEmail(emailParam);
    }
  }, [searchParams]);

  const [passwordVisibility, setPasswordVisibility] = useState({
    tempPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordResponce, setPasswordResponce] = useState({
    passwordResponceText:
      "Use 8 or more characters with a mix of letters, numbers & symbols.",
    passwordResponceKey: "",
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  // 🔥 NEW: Password boundary handler (prevents leading spaces & enforces max length)
  const handlePasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>,
    setter: React.Dispatch<React.SetStateAction<string>>,
    maxLength: number = 50,
  ) => {
    // Aggressively remove leading spaces
    const sanitizedValue = e.target.value.replace(/^\s+/, "");

    // Enforce max length
    if (sanitizedValue.length > maxLength) return;

    setter(sanitizedValue);
  };

  // const onChangeNewPassword = (password: string) => {
  //   setNewPassword(password);
  //   if (password.length === 0) {
  //     setPasswordResponce({
  //       passwordResponceText: "",
  //       passwordResponceKey: "",
  //     });
  //   } else if (password.length < 8) {
  //     setPasswordResponce({
  //       passwordResponceText: "Weak. Minimum 8 characters.",
  //       passwordResponceKey: "0",
  //     });
  //   } else if (password.search(/[A-Z]/) < 0 || password.search(/[0-9]/) < 0) {
  //     setPasswordResponce({
  //       passwordResponceText: "Average. Add uppercase & numbers.",
  //       passwordResponceKey: "1",
  //     });
  //   } else if (password.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
  //     setPasswordResponce({
  //       passwordResponceText: "Almost! Add a special symbol.",
  //       passwordResponceKey: "2",
  //     });
  //   } else {
  //     setPasswordResponce({
  //       passwordResponceText: "Strong password.",
  //       passwordResponceKey: "3",
  //     });
  //   }
  // };

  // 🔥 UPDATED: Added boundary checks to the new password handler
  const onChangeNewPassword = (
    e: React.ChangeEvent<HTMLInputElement>,
    maxLength: number = 50,
  ) => {
    const sanitizedValue = e.target.value.replace(/^\s+/, "");

    if (sanitizedValue.length > maxLength) return;

    setNewPassword(sanitizedValue);
    const password = sanitizedValue;

    if (password.length === 0) {
      setPasswordResponce({
        passwordResponceText: "",
        passwordResponceKey: "",
      });
    } else if (password.length < 8) {
      setPasswordResponce({
        passwordResponceText: "Weak. Minimum 8 characters.",
        passwordResponceKey: "0",
      });
    } else if (password.search(/[A-Z]/) < 0 || password.search(/[0-9]/) < 0) {
      setPasswordResponce({
        passwordResponceText: "Average. Add uppercase & numbers.",
        passwordResponceKey: "1",
      });
    } else if (password.search(/(?=.*?[#?!@$%^&*-])/) < 0) {
      setPasswordResponce({
        passwordResponceText: "Almost! Add a special symbol.",
        passwordResponceKey: "2",
      });
    } else {
      setPasswordResponce({
        passwordResponceText: "Strong password.",
        passwordResponceKey: "3",
      });
    }
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!email || !tempPassword || !newPassword || !confirmPassword) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await Instance.post("/api/forgot-password/confirm", {
        email, // 5. Now sending email to the API
        temp_password: tempPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(res.data.message || "✅ Password updated successfully!");
      setTimeout(() => navigate(routes.login), 2000);
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "❌ Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="page-header">
          <div className="page-title">
            <h4>Reset Password</h4>
            <h6>Settings / Security / Reset Password</h6>
          </div>
        </div>

        <div className="row justify-content-center">
          <div className="col-xl-9 col-lg-12">
            <div className="card border-0 shadow-sm overflow-hidden">
              <div className="row g-0">
                <div className="col-md-5 bg-light border-end d-none d-md-block">
                  <div className="p-4 h-100 d-flex flex-column justify-content-center">
                    <div className="text-center mb-4">
                      <i
                        className="ti ti-shield-lock text-primary"
                        style={{ fontSize: "60px" }}
                      ></i>
                    </div>
                    <h5 className="fw-bold text-dark">Secure Reset</h5>
                    <p className="text-muted small">
                      We are resetting the password for your registered email
                      address.
                    </p>
                  </div>
                </div>

                <div className="col-md-7 bg-white">
                  <div className="card-body p-4 p-lg-5">
                    <form onSubmit={handleSubmit}>
                      {/* 🟢 ADDED EMAIL FIELD HERE */}
                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark fs-13">
                          Email Address
                        </label>
                        <input
                          type="email"
                          className="form-control bg-light"
                          value={email}
                          readOnly
                          disabled
                        />
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark fs-13">
                          Temporary Password
                        </label>
                        <div className="pass-group">
                          <input
                            type={
                              passwordVisibility.tempPassword
                                ? "text"
                                : "password"
                            }
                            className="form-control"
                            value={tempPassword}
                            // onChange={(e) => setTempPassword(e.target.value)}
                            onChange={(e) =>
                              handlePasswordChange(e, setTempPassword, 50)
                            } // 🔥 Boundary handler
                            maxLength={50} // 🔥 HTML Fallback
                            placeholder="Enter current password"
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.tempPassword ? "ti-eye" : "ti-eye-off"}`}
                            onClick={() =>
                              togglePasswordVisibility("tempPassword")
                            }
                          ></span>
                        </div>
                      </div>

                      <div className="mb-3">
                        <label className="form-label fw-semibold text-dark fs-13">
                          New Password
                        </label>
                        <div className="pass-group">
                          <input
                            type={
                              passwordVisibility.newPassword
                                ? "text"
                                : "password"
                            }
                            className="form-control"
                            value={newPassword}
                            // onChange={(e) =>
                            //   onChangeNewPassword(e.target.value)
                            // }
                            onChange={(e) => onChangeNewPassword(e, 50)} // 🔥 Boundary handler
                            maxLength={50} // 🔥 HTML Fallback
                            placeholder="Create new password"
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.newPassword ? "ti-eye" : "ti-eye-off"}`}
                            onClick={() =>
                              togglePasswordVisibility("newPassword")
                            }
                          ></span>
                        </div>
                        <div className="small mt-1">
                          <span
                            className={
                              passwordResponce.passwordResponceKey === "3"
                                ? "text-success"
                                : "text-danger"
                            }
                          >
                            {passwordResponce.passwordResponceText}
                          </span>
                        </div>
                      </div>

                      <div className="mb-4">
                        <label className="form-label fw-semibold text-dark fs-13">
                          Confirm New Password
                        </label>
                        <div className="pass-group">
                          <input
                            type={
                              passwordVisibility.confirmPassword
                                ? "text"
                                : "password"
                            }
                            className="form-control"
                            value={confirmPassword}
                            // onChange={(e) => setConfirmPassword(e.target.value)}
                            onChange={(e) =>
                              handlePasswordChange(e, setConfirmPassword, 50)
                            } // 🔥 Boundary handler
                            maxLength={50} // 🔥 HTML Fallback
                            placeholder="Confirm new password"
                          />
                          <span
                            className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                            onClick={() =>
                              togglePasswordVisibility("confirmPassword")
                            }
                          ></span>
                        </div>
                      </div>

                      <div className="d-flex align-items-center justify-content-between gap-3">
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
                          {isLoading ? "Updating..." : "Update Password"}
                        </button>
                      </div>
                    </form>
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

export default ResetPasswordInternal;
