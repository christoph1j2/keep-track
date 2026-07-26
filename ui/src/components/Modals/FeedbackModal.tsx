import { Radio, RadioGroup, TextField } from "@mui/material";
import { blue, red } from "@mui/material/colors";
import axios from "axios";
import { useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

interface FeedbackModalProps {
  onCancel: () => void;
}

export function FeedbackModal({ onCancel }: FeedbackModalProps) {
  const { t } = useTranslation();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[] | null>(null);
  const [message, setMessage] = useState("");

  const maxCharacters = 1000;
  const remainingCharacters = maxCharacters - message.length;

  // Handle the change of the feedback type (bug or feature)
  const handleTypeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    console.log("Selected feedback type:", e.target.value);
  };

  // Handle form submission
  const handleSubmit = async (e: React.SubmitEvent<HTMLFormElement>) => {
    e.preventDefault(); // zabrani refreshi po odeslani formulare

    if (isSubmitting) return; // zabrani dvojitemu odeslani
    setIsSubmitting(true);
    setErrors(null);

    // validace s využitím překladů
    const formData = new FormData(e.currentTarget);

    const contactEmail = formData.get("contactEmail");
    const feedbackType = formData.get("feedbackType");
    const subject = formData.get("subject");
    const message = formData.get("message");

    if (!feedbackType || !subject) {
      setErrors([t("feedback.errors.missingFields")]);
      setIsSubmitting(false);
      return;
    }

    if (contactEmail && typeof contactEmail === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(contactEmail)) {
        setErrors([t("feedback.errors.invalidEmail")]);
        setIsSubmitting(false);
        return;
      }
    }

    if (message && typeof message === "string" && message.length > 1000) {
      setErrors([t("feedback.errors.messageTooLong")]);
      setIsSubmitting(false);
      return;
    }

    try {
      const FeedBackType =
        feedbackType === "bug" ? "Bug Report" : "Feature Request";
      const emailSubject = `[${FeedBackType}] ${subject}`;
      const emailMessage = `Contact Email: ${contactEmail || "Not provided"}\r\n\r\nMessage:\r\n${message}`;

      const API_URL =
        import.meta.env.VITE_API_URL || "http://localhost:3000/api";

      // Axios API call to email service
      await axios.post(
        `${API_URL}/email/send_feedback`,
        {
          subject: emailSubject,
          text: emailMessage,
        },
        { timeout: 10000 }
      );

      toast.success(t("feedback.success"));
      onCancel(); // Close the modal after successful submission
    } catch (error) {
      console.error("Error sending feedback email:", error);
      setErrors([t("feedback.errors.sendFailed")]);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      {errors && (
        <div
          className="mb-4 p-3 bg-red-100 text-red-700 rounded dark:bg-red-900/50 dark:text-red-200"
          role="alert"
          aria-live="assertive"
        >
          {errors.map((error, idx) => (
            <p key={idx}>{error}</p>
          ))}
        </div>
      )}
      <form onSubmit={handleSubmit} className="flex flex-col gap-4 mt-2">
        {/* email */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("feedback.contactEmail")}
          </label>
          <TextField
            fullWidth
            type="email"
            name="contactEmail"
            placeholder={t("feedback.contactEmailPlaceholder")}
          />
        </div>

        {/* radiobuttons BUG/FEATURE */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("feedback.feedbackType")}
            <span className="text-red-500">*</span>
          </label>
          <RadioGroup
            className="gap-4"
            name="feedbackType"
            defaultValue="bug"
            onChange={handleTypeChange} // Handle selection change
            row
          >
            <label className="flex items-center gap-2">
              <Radio
                name="feedbackType"
                value="bug"
                sx={{
                  color: red[800],
                  "&.Mui-checked": {
                    color: red[600],
                  },
                }}
              />
              {t("feedback.bug")}
            </label>
            <label className="flex items-center gap-2">
              <Radio
                name="feedbackType"
                value="feature"
                sx={{
                  color: blue[800],
                  "&.Mui-checked": {
                    color: blue[600],
                  },
                }}
              />
              {t("feedback.feature")}
            </label>
          </RadioGroup>
        </div>

        {/* predmet */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("feedback.subject")}
            <span className="text-red-500">*</span>
          </label>
          <TextField
            fullWidth
            placeholder={t("feedback.subjectPlaceholder")}
            required
            name="subject"
          />
        </div>

        {/* zprava */}
        <div className="flex flex-col gap-1">
          <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
            {t("feedback.message")}
          </label>
          <TextField
            fullWidth
            multiline
            rows={4}
            placeholder={t("feedback.messagePlaceholder")}
            name="message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            helperText={`${remainingCharacters} ${t("feedback.remainingCharacters")}`}
            slotProps={{
              htmlInput: { maxLength: maxCharacters },
              formHelperText: { sx: { textAlign: "right" } },
            }}
          />
        </div>

        {/* tlacitka */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 transition-colors"
          >
            {t("common.cancel")}
          </button>
          <button
            type="submit"
            className="px-4 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 transition-colors"
            disabled={isSubmitting}
          >
            {isSubmitting ? t("common.submitting") : t("common.submit")}
          </button>
        </div>
      </form>
    </>
  );
}
