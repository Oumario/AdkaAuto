import { useState, useEffect, useCallback } from 'react';
import { VehicleModel, VEHICLE_MODELS as EMBEDDED_MODELS } from '../constants/tariff';
import { ScheduledTariff } from '../services/tariffImportService';
import {
  loadScheduledTariffs,
  saveScheduledTariff,
  deleteScheduledTariff,
  activateTariff,
  getActiveTariff,
  clearActiveTariff,
  checkAndApplyScheduledTariff,
} from '../services/storageService';

export interface TariffState {
  activeModels: VehicleModel[];
  activeTariff: ScheduledTariff | null;
  scheduledTariffs: ScheduledTariff[];
  isUsingCustomTariff: boolean;
  loading: boolean;
}

export function useTariff() {
  const [state, setState] = useState<TariffState>({
    activeModels: EMBEDDED_MODELS,
    activeTariff: null,
    scheduledTariffs: [],
    isUsingCustomTariff: false,
    loading: true,
  });

  const refresh = useCallback(async () => {
    setState(s => ({ ...s, loading: true }));
    try {
      // Check if any scheduled tariff should now be applied
      const applied = await checkAndApplyScheduledTariff();
      const all = await loadScheduledTariffs();
      const active = applied || (await getActiveTariff());

      if (active) {
        const combined = [...active.renaultModels, ...active.daciaModels];
        setState({
          activeModels: combined,
          activeTariff: active,
          scheduledTariffs: all,
          isUsingCustomTariff: true,
          loading: false,
        });
      } else {
        setState({
          activeModels: EMBEDDED_MODELS,
          activeTariff: null,
          scheduledTariffs: all,
          isUsingCustomTariff: false,
          loading: false,
        });
      }
    } catch {
      setState(s => ({ ...s, loading: false }));
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const scheduleNewTariff = useCallback(async (tariff: ScheduledTariff) => {
    await saveScheduledTariff(tariff);
    await refresh();
  }, [refresh]);

  const removeTariff = useCallback(async (id: string) => {
    await deleteScheduledTariff(id);
    await refresh();
  }, [refresh]);

  const activateNow = useCallback(async (id: string) => {
    await activateTariff(id);
    await refresh();
  }, [refresh]);

  const revertToEmbedded = useCallback(async () => {
    await clearActiveTariff();
    await refresh();
  }, [refresh]);

  const getModelsByBrand = useCallback((brand: 'RENAULT' | 'DACIA') => {
    return state.activeModels.filter(m => m.brand === brand);
  }, [state.activeModels]);

  const getCategoriesByBrand = useCallback((brand: 'RENAULT' | 'DACIA') => {
    const models = state.activeModels.filter(m => m.brand === brand);
    return [...new Set(models.map(m => m.category))];
  }, [state.activeModels]);

  const getModelsByCategory = useCallback((brand: 'RENAULT' | 'DACIA', category: string) => {
    return state.activeModels.filter(m => m.brand === brand && m.category === category);
  }, [state.activeModels]);

  return {
    ...state,
    refresh,
    scheduleNewTariff,
    removeTariff,
    activateNow,
    revertToEmbedded,
    getModelsByBrand,
    getCategoriesByBrand,
    getModelsByCategory,
  };
}
