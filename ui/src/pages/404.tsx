import { useTranslation } from "react-i18next";

/**
 * Fallback page shown when no route matches the requested URL path.
 */
export function NotFound() {
  const { t } = useTranslation();

  return (
    <div className="p-4">
      <h2 className="text-3xl font-bold text-slate-800 mb-4 dark:text-slate-200">
        {t("common.notFoundTitle", "404 - Not Found")}
      </h2>
      <p className="text-slate-600 dark:text-slate-400">
        {t(
          "common.notFoundMessage",
          "Sorry, the page you are looking for could not be found.",
        )}
      </p>
    </div>
  );
}