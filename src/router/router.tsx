import React, { Suspense, lazy } from "react";
import { Route, Routes } from "react-router";
import { authRoutes, publicRoutes } from "./router.link";
import { LoadingSpinner } from "../core/common/LoadingSpinner";
import { ProtectedRoute, GuestRoute } from "./RouteGuards";
import { useDispatch, useSelector } from "react-redux";
import {
  ApiAuth,
  getCurrentAttendanceStatus,
  TBSelector,
  updateState,
} from "@/Store/Reducers/TBSlice";
import "react-toastify/dist/ReactToastify.css";
import { toast } from "react-toastify";
import { all_routes as routes } from "./all_routes";

// Lazy load the main feature components
const LazyFeature = lazy(() => import("../feature-module/feature"));
const LazyAuthFeature = lazy(() => import("../feature-module/authFeature"));

// Forgot/reset password paths — accessible regardless of auth state
const forgotResetPaths = [
  routes.forgotPassword,
  routes.forgotPassword2,
  routes.forgotPassword3,
  routes.internalforgotPassword,
  routes.resetPassword,
  routes.resetPassword2,
  routes.resetPassword3,
  routes.internalResetPassword,
  routes.resetPasswordSuccess,
  routes.resetPasswordSuccess2,
  routes.resetPasswordSuccess3,
];
const guestOnlyRoutes = authRoutes.filter((r) => !forgotResetPaths.includes(r.path));
const openAuthRoutes = authRoutes.filter((r) => forgotResetPaths.includes(r.path));

const ALLRoutes: React.FC = () => {
  const {
    isError,
    errorMessage,
    isSuccess,
    successMessage,
    isCheckinCheckout,
  } = useSelector(TBSelector);
  const dispatch = useDispatch();

  // Call ApiAuth once on app initialization to get authToken
  React.useEffect(() => {
    console.log("hemanshiiiii");
    const authToken = localStorage.getItem("authToken");
    if (!authToken || authToken === "undefined") {
      dispatch(ApiAuth() as any);
    }
  }, [dispatch]);

  React.useEffect(() => {
    if (isError) {
      toast.error(errorMessage || "Something went wrong", {
        position: "top-right",
        autoClose: 3000,
      });
      dispatch(updateState({ isError: false, errorMessage: "" }));
    }
  }, [isError]);

  React.useEffect(() => {
    if (isSuccess) {
      toast.success(successMessage || "Success!", {
        position: "top-right",
        autoClose: 3000,
      });
      dispatch(updateState({ isSuccess: false, successMessage: "" }));
    }
  }, [successMessage]);

  React.useEffect(() => {
    if (isCheckinCheckout) {
      const userId = localStorage.getItem("user_id");
      const authToken = localStorage.getItem("authToken");
      if (userId && authToken && authToken !== "undefined" && authToken !== "null") {
        console.log("✅ Calling getCurrentAttendanceStatus after check-in/out");
        dispatch(getCurrentAttendanceStatus() as any);
      } else {
        console.log("⚠️ Skipping getCurrentAttendanceStatus - missing credentials");
      }
      dispatch(updateState({ isCheckinCheckout: false }));
    }
  }, [isCheckinCheckout]);

  React.useEffect(() => {
    const userId = localStorage.getItem("user_id");
    const authToken = localStorage.getItem("authToken");
    if (userId && authToken && authToken !== "undefined" && authToken !== "null") {
      console.log("✅ Calling getCurrentAttendanceStatus on app load");
      dispatch(getCurrentAttendanceStatus() as any);
    } else {
      console.log("⚠️ Skipping getCurrentAttendanceStatus - missing userId or authToken");
    }
  }, [dispatch]);

  React.useEffect(() => {
    const userId = localStorage.getItem("user_id");
    if (userId) {
      dispatch(getCurrentAttendanceStatus() as any);
    }
  }, []);

  // Forgot/reset password routes — accessible regardless of auth state

  return (
    <>
      <Routes>
        <Route
          element={
            <ProtectedRoute>
              <Suspense fallback={<LoadingSpinner text="Loading application..." />}>
                <LazyFeature />
              </Suspense>
            </ProtectedRoute>
          }
        >
          {publicRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>

        <Route
          element={
            <GuestRoute>
              <Suspense fallback={<LoadingSpinner text="Loading authentication..." />}>
                <LazyAuthFeature />
              </Suspense>
            </GuestRoute>
          }
        >
          {guestOnlyRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>

        {/* Forgot/Reset password — accessible regardless of auth state */}
        <Route
          element={
            <Suspense fallback={<LoadingSpinner text="Loading authentication..." />}>
              <LazyAuthFeature />
            </Suspense>
          }
        >
          {openAuthRoutes.map((route, idx) => (
            <Route
              path={route.path}
              element={
                <Suspense fallback={<LoadingSpinner text="Loading page..." />}>
                  {route.element}
                </Suspense>
              }
              key={idx}
            />
          ))}
        </Route>
      </Routes>
    </>
  );
};

export default ALLRoutes;
