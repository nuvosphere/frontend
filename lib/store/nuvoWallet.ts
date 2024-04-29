import { create } from 'zustand';

// 定义状态和方法的接口
interface State {
  address: string;
}

// 创建 store
export const useStore = create<State>((set) => ({
  address: '',
  setAddress: (value: string) => set({ address: value }),
}));
