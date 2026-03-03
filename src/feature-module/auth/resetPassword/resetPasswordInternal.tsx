import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { all_routes } from "../../../router/all_routes";
import Instance from "../../../api/axiosInstance"; //
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

type PasswordField = "tempPassword" | "newPassword" | "confirmPassword";

const ResetPasswordInternal = () => {
  const routes = all_routes;
  const [tempPassword, setTempPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [passwordVisibility, setPasswordVisibility] = useState({
    tempPassword: false,
    newPassword: false,
    confirmPassword: false,
  });

  const [passwordResponce, setPasswordResponce] = useState({
    passwordResponceText:
      "Use 8 or more characters with a mix of letters, numbers, and symbols.",
    passwordResponceKey: "",
  });

  const togglePasswordVisibility = (field: PasswordField) => {
    setPasswordVisibility((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  const onChangeNewPassword = (password: string) => {
    setNewPassword(password);
    // Reuse the strength check logic from original component
    if (password.length === 0)
      setPasswordResponce({
        passwordResponceText: "",
        passwordResponceKey: "",
      });
    else if (password.length < 8)
      setPasswordResponce({
        passwordResponceText: "Weak.",
        passwordResponceKey: "0",
      });
    else if (password.search(/[A-Z]/) < 0 || password.search(/[0-9]/) < 0)
      setPasswordResponce({
        passwordResponceText: "Average.",
        passwordResponceKey: "1",
      });
    else
      setPasswordResponce({
        passwordResponceText: "Awesome!",
        passwordResponceKey: "3",
      });
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!tempPassword || !newPassword || !confirmPassword) {
      toast.error("⚠️ Please fill in all fields.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error("New Passwords do not match.");
      return;
    }

    setIsLoading(true);
    try {
      // Use logic from original file
      const res = await Instance.post("/api/forgot-password/confirm", {
        temp_password: tempPassword,
        new_password: newPassword,
        confirm_password: confirmPassword,
      });
      toast.success(res.data.message || "✅ Password updated successfully!");
      setTempPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err?.response?.data?.message || "❌ Update failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="page-wrapper">
      <div className="content">
        <div className="row justify-content-center">
          <div className="col-md-8 col-lg-6">
            <div className="card shadow-sm border-0">
              <div className="card-header bg-white border-bottom p-3">
                <h5 className="card-title mb-0 text-dark fw-bold">
                  Account Security
                </h5>
                <p className="text-muted small mb-0">
                  Update your password to keep your account secure.
                </p>
              </div>
              <div className="card-body p-4">
                <form onSubmit={handleSubmit}>
                  {/* 1. Temporary/Old Password */}
                  <div className="mb-3">
                    <label className="form-label fs-13">
                      Temporary Password
                    </label>
                    <div className="pass-group">
                      <input
                        type={
                          passwordVisibility.tempPassword ? "text" : "password"
                        }
                        className="form-control"
                        value={tempPassword}
                        onChange={(e) => setTempPassword(e.target.value)}
                        placeholder="Enter current/temp password"
                      />
                      <span
                        className={`ti toggle-passwords ${passwordVisibility.tempPassword ? "ti-eye" : "ti-eye-off"}`}
                        onClick={() => togglePasswordVisibility("tempPassword")}
                      ></span>
                    </div>
                  </div>

                  {/* 2. New Password */}
                  <div className="mb-3">
                    <label className="form-label fs-13">New Password</label>
                    <div className="pass-group">
                      <input
                        type={
                          passwordVisibility.newPassword ? "text" : "password"
                        }
                        className="form-control"
                        value={newPassword}
                        onChange={(e) => onChangeNewPassword(e.target.value)}
                        placeholder="Enter new password"
                      />
                      <span
                        className={`ti toggle-passwords ${passwordVisibility.newPassword ? "ti-eye" : "ti-eye-off"}`}
                        onClick={() => togglePasswordVisibility("newPassword")}
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

                  {/* 3. Confirm Password */}
                  <div className="mb-4">
                    <label className="form-label fs-13">
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
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="Repeat new password"
                      />
                      <span
                        className={`ti toggle-passwords ${passwordVisibility.confirmPassword ? "ti-eye" : "ti-eye-off"}`}
                        onClick={() =>
                          togglePasswordVisibility("confirmPassword")
                        }
                      ></span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="btn btn-primary w-100"
                    disabled={isLoading}
                  >
                    {isLoading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResetPasswordInternal;
