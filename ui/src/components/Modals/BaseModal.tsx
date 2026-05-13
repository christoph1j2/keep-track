import type { ReactNode } from 'react';

import { Dialog, DialogContent, DialogTitle, IconButton, useMediaQuery, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

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
    const theme = useTheme();
    const isMobile = useMediaQuery(theme.breakpoints.down('sm'));


    return (

        <Dialog
            open={isOpen}
            onClose={onClose}
            maxWidth="sm"
            fullScreen={isMobile}
            fullWidth
            // paper props pro tailwind styling
            slotProps={{
                paper: {
                    className: "rounded-2xl p-2 shadow-2xl"
                }
            }}
        >
            <DialogTitle className="flex items-center justify-between">
                <span className='font-semibold'>{title}</span>

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