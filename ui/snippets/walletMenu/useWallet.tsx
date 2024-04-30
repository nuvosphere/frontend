import { useWeb3Modal } from '@web3modal/wagmi/react';
import React, { useMemo, useState } from 'react';
import { useAccount, useDisconnect, useAccountEffect } from 'wagmi';

import * as mixpanel from 'lib/mixpanel/index';
import { nuvoWalletSate } from 'lib/store/nuvoWallet';

interface Params {
  source: mixpanel.EventPayload<mixpanel.EventTypes.WALLET_CONNECT>['Source'];
}

export default function useWallet({ source }: Params) {
  const { open } = useWeb3Modal();
  const [isOpen, setIsOpen] = React.useState(false);
  const { disconnect } = useDisconnect();
  const [isModalOpening, setIsModalOpening] = useState(false);
  const [isClientLoaded, setIsClientLoaded] = useState(false);
  const isConnectionStarted = React.useRef(false);
  const { address: walletConnectAddress, isDisconnected } = useAccount();

  const nuvoWallet = nuvoWalletSate();

  const address = useMemo(() => {
    return nuvoWallet.address || walletConnectAddress || '';
  }, [nuvoWallet, walletConnectAddress]);

  React.useEffect(() => {
    setIsClientLoaded(true);
  }, []);

  const handleConnect = React.useCallback(async () => {
    setIsModalOpening(true);
    setIsOpen(true);
    await open();
    setIsModalOpening(false);
    mixpanel.logEvent(mixpanel.EventTypes.WALLET_CONNECT, { Source: source, Status: 'Started' });
    isConnectionStarted.current = true;
  }, [open, source]);

  const handleAccountConnected = React.useCallback(
    ({ isReconnected }: { isReconnected: boolean }) => {
      !isReconnected && isConnectionStarted.current && mixpanel.logEvent(mixpanel.EventTypes.WALLET_CONNECT, { Source: source, Status: 'Connected' });
      isConnectionStarted.current = false;
    },
    [source],
  );

  const handleDisconnect = React.useCallback(() => {
    if (nuvoWallet.address) {
      localStorage.removeItem('AccessToken')
      localStorage.removeItem('RefreshToken')
      location.reload()
    } else {
      disconnect();
    }
  }, [disconnect, nuvoWallet]);

  useAccountEffect({ onConnect: handleAccountConnected });

  const isWalletConnected = useMemo(() => {
    if (nuvoWallet.address) {
      return true;
    } else {
      return isClientLoaded && !isDisconnected && address !== undefined;
    }
  }, [isClientLoaded, isDisconnected, address, nuvoWallet]);

  return {
    isWalletConnected,
    address,
    connect: handleConnect,
    disconnect: handleDisconnect,
    isModalOpening,
    isModalOpen: isOpen,
    setIsOpen,
    // nuvoLogin,
    // initProvider,
    nuvoWallet,
  };
}
