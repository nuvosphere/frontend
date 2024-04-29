import type { Web3Provider } from '@ethersproject/providers';

import type { WalletProvider } from 'types/web3';

type CPreferences = {
  zone: string;
  width: string;
  height: string;
}

declare global {
  export interface Window {
    Nuvo?: {
      address: string;
      provider: Web3Provider;
    };
    ethereum?: WalletProvider | undefined;
    bitkeep?: {
      ethereum: WalletProvider | undefined;
    };
    coinzilla_display: Array<CPreferences>;
    ga?: {
      getAll: () => Array<{ get: (prop: string) => string }>;
    };
    AdButler: {
      ads: Array<unknown>;
      register: (...args: unknown) => void;
    };
    abkw: string;
    __envs: Record<string, string>;
  }

  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV: 'development' | 'production';
    }
  }
}

export {};
