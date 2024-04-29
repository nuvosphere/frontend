import type { Web3Provider } from '@ethersproject/providers';
import { create } from 'zustand';

// 定义状态和方法的接口
interface NuvoWallet {
  address: string;
  setAddress: (v: string) => void;
  provider?: Web3Provider;
  setProvider: (v: Web3Provider) => void;
}

// 创建 store
export const useNuvoWallet = create<NuvoWallet>((set) => ({
  address: '',
  setAddress: (v: string) => set({ address: v }),
  provider: undefined,
  setProvider: (v: Web3Provider) => set({ provider: v }),
}));
