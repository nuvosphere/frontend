import React, { createContext, useContext, useState } from 'react';

type Props = {
  children: React.ReactNode;
}

const NuvoWalletContext = createContext();
export const useNuvoWalletContext = () => {
  return useContext((NuvoWalletContext))
}

export function NuvoWalletContextProvider({ children }: Props) {
  const [test, setTest] = useState<number | null>(null)
  // 在此处书写所需要的逻辑

  return (
    <NuvoWalletContext.Provider value={{
      test,
      setTest,
    }}>
      { children }
    </NuvoWalletContext.Provider>
  );
}
//
// export function useAppContext() {
//   return useContext(NuvoWalletContext);
// }
