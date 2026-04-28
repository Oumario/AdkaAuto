import { useState, useCallback } from 'react';
import {
  CalculationInput,
  PriceBreakdown,
  ClientType,
  calculate,
  getClientTypeDiscount,
} from '../services/calculationService';
import { VehicleModel, getModelById } from '../constants/tariff';
import { SelectedAccessory, PaintOption } from '../services/calculationService';
import { Accessory } from '../constants/accessories';

export type CalculatorStep = 'brand' | 'model' | 'client' | 'options' | 'summary';

export interface CalculatorState {
  step: CalculatorStep;
  brand: 'RENAULT' | 'DACIA' | null;
  model: VehicleModel | null;
  clientType: ClientType | null;
  discountPercent: number;
  flashPercent: number;
  accessories: SelectedAccessory[];
  paint: PaintOption;
  clientName: string;
  clientRef: string;
  conseiller: string;
  naturesDossier: string;
  chassisNumber: string;
  breakdown: PriceBreakdown | null;
}

export function useCalculator() {
  const [state, setState] = useState<CalculatorState>({
    step: 'brand',
    brand: null,
    model: null,
    clientType: null,
    discountPercent: 0,
    flashPercent: 0,
    accessories: [],
    paint: { isMetallic: false, priceHT: 0, priceTTC: 0 },
    clientName: '',
    clientRef: '',
    conseiller: '',
    naturesDossier: 'comptant',
    chassisNumber: '',
    breakdown: null,
  });

  const setBrand = useCallback((brand: 'RENAULT' | 'DACIA') => {
    setState(s => ({
      ...s,
      brand,
      model: null,
      clientType: null,
      discountPercent: 0,
      flashPercent: 0,
      accessories: [],
      paint: { isMetallic: false, priceHT: 0, priceTTC: 0 },
      breakdown: null,
      step: 'model',
    }));
  }, []);

  const setModel = useCallback((model: VehicleModel) => {
    setState(s => ({
      ...s,
      model,
      breakdown: null,
      step: 'client',
    }));
  }, []);

  const setClientType = useCallback((clientType: ClientType) => {
    setState(s => {
      const suggestedDiscount = s.model ? getClientTypeDiscount(s.model, clientType) : null;
      return {
        ...s,
        clientType,
        discountPercent: suggestedDiscount ? suggestedDiscount * 100 : s.discountPercent,
        breakdown: null,
        step: 'options',
      };
    });
  }, []);

  const setDiscountPercent = useCallback((val: number) => {
    setState(s => ({ ...s, discountPercent: val, breakdown: null }));
  }, []);

  const setFlashPercent = useCallback((val: number) => {
    setState(s => ({ ...s, flashPercent: val, breakdown: null }));
  }, []);

  const setPaint = useCallback((paint: PaintOption) => {
    setState(s => ({ ...s, paint, breakdown: null }));
  }, []);

  const addAccessory = useCallback((accessory: Accessory) => {
    setState(s => {
      const existing = s.accessories.find(a => a.accessory.id === accessory.id);
      if (existing) {
        return {
          ...s,
          accessories: s.accessories.map(a =>
            a.accessory.id === accessory.id ? { ...a, quantity: a.quantity + 1 } : a
          ),
          breakdown: null,
        };
      }
      return { ...s, accessories: [...s.accessories, { accessory, quantity: 1 }], breakdown: null };
    });
  }, []);

  const removeAccessory = useCallback((accessoryId: string) => {
    setState(s => ({
      ...s,
      accessories: s.accessories.filter(a => a.accessory.id !== accessoryId),
      breakdown: null,
    }));
  }, []);

  const updateAccessoryQty = useCallback((accessoryId: string, quantity: number) => {
    if (quantity <= 0) {
      setState(s => ({
        ...s,
        accessories: s.accessories.filter(a => a.accessory.id !== accessoryId),
        breakdown: null,
      }));
    } else {
      setState(s => ({
        ...s,
        accessories: s.accessories.map(a =>
          a.accessory.id === accessoryId ? { ...a, quantity } : a
        ),
        breakdown: null,
      }));
    }
  }, []);

  const setClientInfo = useCallback((info: {
    clientName?: string;
    clientRef?: string;
    conseiller?: string;
    naturesDossier?: string;
    chassisNumber?: string;
  }) => {
    setState(s => ({ ...s, ...info }));
  }, []);

  const computePrice = useCallback(() => {
    setState(s => {
      if (!s.model || !s.clientType) return s;
      const input: CalculationInput = {
        model: s.model,
        clientType: s.clientType,
        discountPercent: s.discountPercent,
        flashPercent: s.flashPercent,
        accessories: s.accessories,
        paint: s.paint,
        clientName: s.clientName,
        clientRef: s.clientRef,
        conseiller: s.conseiller,
        naturesDossier: s.naturesDossier,
        chassisNumber: s.chassisNumber,
      };
      const breakdown = calculate(input);
      return { ...s, breakdown, step: 'summary' };
    });
  }, []);

  const goToStep = useCallback((step: CalculatorStep) => {
    setState(s => ({ ...s, step }));
  }, []);

  const reset = useCallback(() => {
    setState({
      step: 'brand',
      brand: null,
      model: null,
      clientType: null,
      discountPercent: 0,
      flashPercent: 0,
      accessories: [],
      paint: { isMetallic: false, priceHT: 0, priceTTC: 0 },
      clientName: '',
      clientRef: '',
      conseiller: '',
      naturesDossier: 'comptant',
      chassisNumber: '',
      breakdown: null,
    });
  }, []);

  return {
    state,
    setBrand,
    setModel,
    setClientType,
    setDiscountPercent,
    setFlashPercent,
    setPaint,
    addAccessory,
    removeAccessory,
    updateAccessoryQty,
    setClientInfo,
    computePrice,
    goToStep,
    reset,
  };
}
