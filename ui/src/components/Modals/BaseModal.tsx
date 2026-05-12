import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

/**
 * Reusable modal dialog wrapper for forms and focused content.
 * MUI Dialog with close button, rounded corners, and shadow styling.
 *
 * @param props.isOpen Controls dialog visibility.
 * @param props.onClose Callback fired when user clicks close button or clicks outside.
 * @param props.title Header text displayed in dialog title bar.
 * @param props.children Modal body content (usually a form).
 */
export function BaseModal({ isOpen, onClose, title, children }: BaseModalProps) {
    return (

        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            // paper props pro tailwind styling
            slotProps={{
                paper: {
                    className: "rounded-2xl p-2 shadow-2xl"
                }
            }}
        >
            <DialogTitle className="flex items-center justify-between">
                {title}

                <IconButton onClick={onClose} size="small" className="text-slate-500 hover:text-slate-900">
                    <CloseIcon />
                </IconButton>
            </DialogTitle>
            <DialogContent>
                {children}
            </DialogContent>
        </Dialog>

    );
}