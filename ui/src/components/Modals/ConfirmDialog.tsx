import { Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { useTranslation } from "react-i18next"; // <-- Přidáno

interface ConfirmDialogProps {
    open: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    onCancel: () => void;
}

export function ConfirmDialog({ open, title, message, onConfirm, onCancel }: ConfirmDialogProps) {
    const { t } = useTranslation(); // <-- Inicializace překladů

    return (
        <Dialog 
            open={open} 
            onClose={onCancel}
            maxWidth="xs"
            fullWidth
            classes={{
                paper: "bg-white dark:!bg-slate-900 dark:!text-slate-100 transition-colors"
            }}
        >
            <DialogTitle sx={{ fontWeight: 'bold' }}>{title}</DialogTitle>
            <DialogContent>
                {/* whitespace-pre-line zajistí, že budou fungovat znaky pro nový řádek \n */}
                <p className="text-slate-700 dark:text-slate-300 whitespace-pre-line mt-2">
                    {message}
                </p>
            </DialogContent>
            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button onClick={onCancel} className="text-slate-600 dark:text-slate-400!">
                    {t('common.cancel')}
                </Button>
                <Button 
                    onClick={onConfirm} 
                    variant="contained" 
                    color="error"
                >
                    {t('common.confirm')}
                </Button>
            </DialogActions>
        </Dialog>
    );
}