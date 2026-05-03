import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

interface BaseModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: ReactNode;
}

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