import { Button, Grid } from "@mui/material";
import { toast } from "react-hot-toast";
import { api } from "../../utils/api";
import { useConfirmStore } from "../../store/confirmStore";
import { useAdmin } from "../../layouts/AdminLayout";
import {
  CleaningServices as CleaningServicesIcon,
  CloudUpload as CloudUploadIcon,
  CheckCircle as CheckCircleIcon,
  Error as ErrorIcon,
  HourglassEmpty as HourglassEmptyIcon,
  RateReview as RateReviewIcon,
} from "@mui/icons-material";

export const AdminMaintenancePage = () => {
  const showConfirm = useConfirmStore((state) => state.showConfirm);
  const { stats, fetchStats } = useAdmin();

  const handleCleanupImportJobs = () => {
    showConfirm(
      "Purge Stale Import Jobs",
      "Are you sure you want to delete all CSV import jobs older than 30 days?",
      async () => {
        try {
          const res = await api.post("/admin/maintenance/cleanup-jobs");
          toast.success(`Cleanup complete: Purged ${res.data.count} stale import job(s)`);
          fetchStats();
        } catch (error) {
          toast.error("Failed to execute cleanup");
          console.error(error);
        }
      }
    );
  };

  return (
    <div className="p-6 space-y-6 text-slate-900 dark:text-slate-100 transition-colors">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-6">
        <div>
          <h2 className="text-3xl font-bold flex items-center gap-2 text-slate-900 dark:text-slate-100">
            <CleaningServicesIcon className="text-emerald-600 dark:text-emerald-400" />
            System Maintenance & Jobs
          </h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            Monitor background CSV import job statuses and execute database maintenance routines.
          </p>
        </div>

        <Button
          variant="contained"
          color="error"
          startIcon={<CleaningServicesIcon />}
          onClick={handleCleanupImportJobs}
          className="bg-red-600 hover:bg-red-700 text-white font-semibold"
        >
          Purge Stale Jobs (&gt;30d)
        </Button>
      </div>

      {/* Import Job Status Overview */}
      <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-sm border border-slate-100 dark:border-slate-800 transition-colors space-y-6">
        <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-800 pb-4">
          <h3 className="font-bold flex items-center gap-2 text-slate-800 dark:text-slate-100">
            <CloudUploadIcon className="text-blue-500" />
            Background Import Job Monitor
          </h3>
          <span className="px-3 py-1 text-xs font-bold rounded-full bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            {stats?.importJobStats?.total || 0} Total Jobs
          </span>
        </div>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-emerald-700 dark:text-emerald-300 flex items-center gap-1">
                  <CheckCircleIcon fontSize="small" />
                  Completed
                </span>
              </div>
              <div className="text-3xl font-bold text-emerald-800 dark:text-emerald-200">
                {stats?.importJobStats?.COMPLETED || 0}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-blue-700 dark:text-blue-300 flex items-center gap-1">
                  <RateReviewIcon fontSize="small" />
                  Ready for Review
                </span>
              </div>
              <div className="text-3xl font-bold text-blue-800 dark:text-blue-200">
                {stats?.importJobStats?.READY_FOR_REVIEW || 0}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-amber-700 dark:text-amber-300 flex items-center gap-1">
                  <HourglassEmptyIcon fontSize="small" />
                  Processing
                </span>
              </div>
              <div className="text-3xl font-bold text-amber-800 dark:text-amber-200">
                {stats?.importJobStats?.PROCESSING || 0}
              </div>
            </div>
          </Grid>

          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <div className="p-4 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-xl">
              <div className="flex justify-between items-center mb-2">
                <span className="text-xs font-semibold text-rose-700 dark:text-rose-300 flex items-center gap-1">
                  <ErrorIcon fontSize="small" />
                  Failed
                </span>
              </div>
              <div className="text-3xl font-bold text-rose-800 dark:text-rose-200">
                {stats?.importJobStats?.FAILED || 0}
              </div>
            </div>
          </Grid>
        </Grid>
      </div>
    </div>
  );
};
