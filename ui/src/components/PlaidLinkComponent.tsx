import { useState, useEffect } from 'react';
import { usePlaidLink } from 'react-plaid-link';
import { api } from '../utils/api';
import toast from 'react-hot-toast';
import { CircularProgress } from '@mui/material';
import { useTranslation } from 'react-i18next';

export function PlaidLinkComponent() {
  const { t } = useTranslation();
  const [linkToken, setLinkToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchLinkToken = async () => {
      try {
        const response = await api.post('/plaid/create-link-token');
        setLinkToken(response.data.linkToken);
      } catch (error) {
        console.error('Error fetching link token:', error);
        toast.error(t('settings.plaidTokenError', 'Failed to initialize bank connection.'));
      }
    };
    fetchLinkToken();
  }, [t]);

  const onSuccess = async (publicToken: string, metadata: any) => {
    setIsLoading(true);
    try {
      await api.post('/plaid/exchange-token', {
        publicToken: publicToken,
        institutionName: metadata.institution?.name || 'Unknown Institution',
      });
      toast.success(t('settings.plaidSuccess', 'Bank account connected successfully!'));
    } catch (error) {
      console.error('Error exchanging public token:', error);
      toast.error(t('settings.plaidError', 'Failed to connect bank account.'));
    } finally {
      setIsLoading(false);
    }
  };

  const config = {
    token: linkToken!,
    onSuccess,
  };

  const { open, ready } = usePlaidLink(config);

  return (
    <button
      onClick={() => open()}
      disabled={!ready || !linkToken || isLoading}
      className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors flex items-center justify-center gap-2"
    >
      {isLoading && <CircularProgress size={16} color="inherit" />}
      {t('settings.connectBank', 'Connect Bank Account')}
    </button>
  );
}
