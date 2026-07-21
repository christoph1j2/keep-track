import StyleIcon from "@mui/icons-material/Style";

export function Logo() {
  return (
    <>
      {/* logo */}
      <div className="md:mb-10 md:my-0 sm:m-5">
        <h1 className="text-2xl font-bold text-blue-700 flex items-center dark:text-blue-500 transition-colors">
          <StyleIcon className="text-slate-900 mr-1 dark:text-slate-200" />
          Keep
          <span className="text-slate-800 dark:text-slate-200">
            Track
            <sup className="text-xs align-top font-mono text-slate-500 dark:text-slate-400">
              beta
            </sup>
          </span>
        </h1>
      </div>
    </>
  );
}
