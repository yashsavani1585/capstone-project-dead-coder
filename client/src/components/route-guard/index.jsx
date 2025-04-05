import { Fragment } from "react";
import { Navigate, useLocation } from "react-router-dom";

function RouteGuard({authenticated,user,element}){

    const location = useLocation();

    console.log(authenticated, user,element);

    if (!authenticated && !location.pathname.includes("/auth") ) {
        return <Navigate to="/auth" />;
    }

    if (
        authenticated &&
        user?.role !== "instructor" &&
        (location.pathname.includes("instructor") ||
          location.pathname.includes("/auth"))
      ) {
        return <Navigate to="/" />;
      }

      if (
        authenticated && user.role === "instructor" &&
        !location.pathname.includes("instructor")
      ) {
        return <Navigate to="/instructor" />;
      }

      return <Fragment>{element}</Fragment>;
}

export default RouteGuard;