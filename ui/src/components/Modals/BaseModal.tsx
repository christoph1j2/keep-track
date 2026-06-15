import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, GlobalStyles, IconButton, useMediaQuery, useTheme as useMuiTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme as useAppTheme } from "../../contexts/ThemeContext";

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/**
 * Reusable modal shell for forms and focused actions.
 * Wraps MUI Dialog with shared title, close button, and responsive full-screen behavior.
 *
 * @param props.isOpen Controls dialog visibility.
 * @param props.onClose Called when the modal should be closed.
 * @param props.title Title shown in the header.
 * @param props.children Modal body content.
 */
export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
    const muiTheme = useMuiTheme();
    const isMobile = useMediaQuery(muiTheme.breakpoints.down('sm'));

    const { theme: appTheme } = useAppTheme();
    const isDark = appTheme === "dark";
    const lineColor = isDark ? "rgba(148, 163, 184, 0.18)" : "#e2e8f0";

    return (
        <>
        <GlobalStyles
            styles={{
                // MUI Select renders its dropdown in a portal outside the Dialog, so these global
                // selectors keep the floating menu in sync with the app theme.
                ".MuiPaper-root.MuiMenu-paper, .MuiPopover-paper.MuiMenu-paper, .MuiPopover-paper .MuiList-root": {
                    backgroundColor: `${isDark ? "#0f172a" : "#ffffff"} !important`,
                    color: `${isDark ? "#e2e8f0" : "#0f172a"} !important`,
                },
                // Border around the Select dropdown surface.
                ".MuiPaper-root.MuiMenu-paper, .MuiPopover-paper.MuiMenu-paper": {
                    border: `1px solid ${lineColor} !important`,
                },
                // Text color for each option inside a Select dropdown.
                ".MuiMenuItem-root": {
                    color: `${isDark ? "#e2e8f0" : "#0f172a"} !important`,
                },
                // Hover state for dropdown options.
                ".MuiMenuItem-root:hover": {
                    backgroundColor: `${isDark ? "#1e293b" : "#f1f5f9"} !important`,
                },
                // Currently selected dropdown option.
                ".MuiMenuItem-root.Mui-selected": {
                    backgroundColor: `${isDark ? "rgba(99, 102, 241, 0.22)" : "rgba(99, 102, 241, 0.12)"} !important`,
                },
                // Hover state when the option is already selected.
                ".MuiMenuItem-root.Mui-selected:hover": {
                    backgroundColor: `${isDark ? "rgba(99, 102, 241, 0.3)" : "rgba(99, 102, 241, 0.18)"} !important`,
                },
                // Hide native number spinners; Chromium paints them as a bright box in dark inputs.
                "input[type='number']": {
                    MozAppearance: "textfield",
                },
                "input[type='number']::-webkit-outer-spin-button, input[type='number']::-webkit-inner-spin-button": {
                    WebkitAppearance: "none",
                    margin: 0,
                },
            }}
        />
        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullScreen={isMobile}
            fullWidth
            // paper props pro tailwind styling
            slotProps={{
                paper: {
                    sx: {
                        backgroundColor: isDark ? "#0f172a" : "#ffffff",
                        color: isDark ? "#e2e8f0" : "#0f172a",
                        border: `1px solid ${lineColor}`,
                    },
                },
            }}
        >
            <DialogTitle
                className="flex items-center justify-between"
                sx={{
                    borderBottom: `1px solid ${lineColor}`,
                    color: isDark ? "#e2e8f0" : "#0f172a",
                }}
            >
                <span className='font-semibold'>{title}</span>

                <IconButton
                    onClick={onClose}
                    size="small"
                    sx={{
                        color: isDark ? "#94a3b8" : "#64748b",
                        "&:hover": {
                            backgroundColor: isDark ? "#1e293b" : "#f1f5f9",
                            color: isDark ? "#e2e8f0" : "#0f172a",
                        },
                    }}
                >
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent
                sx={{
                    pt: 3,
                    color: isDark ? "#e2e8f0" : "#0f172a",
                    // Covers plain labels used by our modal forms.
                    "& label": {
                        color: isDark ? "#cbd5e1" : "#334155",
                    },
                    // MUI TextField/Select with variant="outlined" uses this root around the input.
                    "& .MuiOutlinedInput-root": {
                        color: isDark ? "#e2e8f0" : "#0f172a",
                        backgroundColor: isDark ? "#111827" : "#ffffff",
                        // The visible border of an outlined MUI input is a fieldset element.
                        "& fieldset": {
                            borderColor: isDark ? "#334155" : "#cbd5e1",
                        },
                        "&:hover fieldset": {
                            borderColor: isDark ? "#475569" : "#94a3b8",
                        },
                        "&.Mui-focused fieldset": {
                            borderColor: "#6366f1",
                        },
                    },
                    // Placeholder text inside MUI TextField inputs.
                    "& .MuiInputBase-input::placeholder": {
                        color: isDark ? "#94a3b8" : "#64748b",
                        opacity: 1,
                    },
                    // MUI floating labels, used if a TextField has label= instead of our plain label.
                    "& .MuiInputLabel-root": {
                        color: isDark ? "#94a3b8" : "#475569",
                    },
                    // The small arrow icon on MUI Select.
                    "& .MuiSelect-icon": {
                        color: isDark ? "#94a3b8" : "#64748b",
                    },
                    // Plain HTML inputs/selects used in a few modals, e.g. ImportModal.
                    "& input:not([type='file']), & select": {
                        backgroundColor: isDark ? "#111827" : "#ffffff",
                        borderColor: isDark ? "#334155" : "#cbd5e1",
                        color: isDark ? "#e2e8f0" : "#0f172a",
                    },
                    // Shared divider color for hr tags and optional modal-divider class.
                    "& hr, & .modal-divider": {
                        borderColor: lineColor,
                    },
                }}
            >
                {children}
            </DialogContent>
        </Dialog>
        </>
    );
}
