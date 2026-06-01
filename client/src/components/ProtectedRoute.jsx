import { Navigate, Outlet } from "react-router-dom";
import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { isTokenExpired, logout } from "../store/feature/authSlice";

export default function ProtectedRoute() {
  const dispatch = useDispatch();
  const { token, user } = useSelector((state) => state.auth);
  const tokenExpired = token ? isTokenExpired(token) : false;

  useEffect(() => {
    const handleUnauthorized = () => {
      dispatch(logout());
    };

    window.addEventListener("workhub:unauthorized", handleUnauthorized);
    return () => {
      window.removeEventListener("workhub:unauthorized", handleUnauthorized);
    };
  }, [dispatch]);

  useEffect(() => {
    if (tokenExpired) {
      dispatch(logout());
    }
  }, [dispatch, tokenExpired]);

  // Redirect to login if not authenticated
  if (!token || !user || tokenExpired) {
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
}
