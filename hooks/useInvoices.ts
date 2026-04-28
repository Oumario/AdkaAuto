import { useState, useEffect, useCallback } from 'react';
import { StoredInvoice, loadInvoices, saveInvoice, deleteInvoice, clearAllInvoices } from '../services/storageService';

export function useInvoices() {
  const [invoices, setInvoices] = useState<StoredInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const data = await loadInvoices();
    setInvoices(data);
    setLoading(false);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const addInvoice = useCallback(async (invoice: StoredInvoice) => {
    await saveInvoice(invoice);
    await refresh();
  }, [refresh]);

  const removeInvoice = useCallback(async (id: string) => {
    await deleteInvoice(id);
    await refresh();
  }, [refresh]);

  const clearAll = useCallback(async () => {
    await clearAllInvoices();
    await refresh();
  }, [refresh]);

  return { invoices, loading, refresh, addInvoice, removeInvoice, clearAll };
}
