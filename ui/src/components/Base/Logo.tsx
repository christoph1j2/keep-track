import StyleIcon from "@mui/icons-material/Style";
import { Link, useLocation } from "react-router-dom";
import { useAuthStore } from "../../store/authStore";

interface LogoProps {
  isAdmin?: boolean;
}

export function Logo({ isAdmin: propIsAdmin }: LogoProps = {}) {
  const user = useAuthStore((state) => state.user);
  const location = useLocation();

  const isAdmin = propIsAdmin ?? location.pathname.startsWith("/admin");

  return (
    <>
      {/* logo */}
      <Link
        to={isAdmin ? "/admin" : user ? "/dashboard" : "/"}
        className="md:my-0 sm:m-5"
      >
        <h1 className="text-2xl font-bold text-blue-700 flex items-center dark:text-blue-500 transition-colors">
          <StyleIcon className="text-slate-900 mr-1 dark:text-slate-200 transition-colors" />
          Keep
          <span className="text-slate-800 dark:text-slate-200 transition-colors flex">
            Track
            <div className="inline-flex flex-col items-start">
              <sup className="text-xs align-top font-mono text-slate-500 dark:text-slate-400">
                beta
              </sup>
              {isAdmin && (
                <sub className="text-xs tracking-wider font-mono text-rose-500 dark:text-rose-400 uppercase pl-0.5">
                  admin
                </sub>
              )}
            </div>
          </span>
        </h1>
      </Link>
    </>
  );
}
