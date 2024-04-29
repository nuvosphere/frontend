import { PolisProvider } from '@metis.io/middleware-client';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import axios from 'axios';
// import { useWeb3Modal, useWeb3ModalState } from '@web3modal/wagmi/react';
import { ethers } from 'ethers';
import React, { useMemo, useState } from 'react';
import { useSignMessage, useAccount, useDisconnect, useAccountEffect } from 'wagmi';

import { getEnvValue } from 'configs/app/utils';
import * as mixpanel from 'lib/mixpanel/index';
import { useNuvoWallet } from 'lib/store/nuvoWallet';

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

  const nuvoWallet = useNuvoWallet();

  const address = useMemo(() => {
    return nuvoWallet.address || walletConnectAddress || '';
  }, [nuvoWallet, walletConnectAddress]);

  const { signMessage } = useSignMessage();

  const NUVO_DAPP_ID = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_ID'); // admin testnet app id
  const NUVO_API = getEnvValue('NEXT_PUBLIC_NUVO_API');
  const NUVO_DAPP_KEY = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_KEY'); // admin testnet app key
  const NUVO_CHAIN_ID = Number(getEnvValue('NEXT_PUBLIC_NUVO_CHAIN_ID'));

  const initProvider = () => {
    if (window.nuvoAddress) {
      return;
    } else {
      window.nuvoAddress = '0x';
    }
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const accessToken = localStorage.getItem('AccessToken');
    if (code) {
      axios({
        url: NUVO_API + '/api/v1/oauth2/access_token',
        params: {
          appid: NUVO_DAPP_ID,
          appkey: NUVO_DAPP_KEY,
          code,
        },
      }).then(({ data: res }) => {
        currentUrl.searchParams.delete('code');
        window.history.replaceState({}, '', currentUrl.toString());
        if (res.code === 200 && res.data.accessToken) {
          localStorage.setItem('AccessToken', res.data.accessToken);
          localStorage.setItem('RefreshToken', res.data.refreshToken);
          // reload
          initProvider();
        } else {
          console.error('login error:', res.msg);
        }
      });
    } else if (accessToken) {
      // get address
      axios({
        url: NUVO_API + '/api/v1/oauth2/userinfo',
        params: { access_token: accessToken },
      }).then(({ data: res }) => {
        if (res.code === 200) {
          const ethAddress = res.data.eth_address;
          // get provider
          const polisProvider = new PolisProvider({
            apiHost: NUVO_API,
            token: accessToken,
            chainId: NUVO_CHAIN_ID,
          });
          const provider = new ethers.providers.Web3Provider(polisProvider);
          window.nuvoAddress = ethAddress;
          nuvoWallet.setAddress(ethAddress);
          nuvoWallet.setProvider(provider);
        } else {
          localStorage.removeItem('AccessToken');
          // Access token not existed
          const refreshToken = localStorage.getItem('RefreshToken');
          if (refreshToken) {
            axios({
              url: NUVO_API + '/api/v1/oauth2/refresh_token',
              params: {
                app_id: NUVO_DAPP_ID,
                refresh_token: refreshToken,
              },
            }).then(({ data: res }) => {
              if (res.code === 200 && res.data.accessToken) {
                localStorage.setItem('AccessToken', res.data.accessToken);
                localStorage.setItem('RefreshToken', res.data.refreshToken);
              } else {
                localStorage.removeItem('RefreshToken');
              }
              // reload
              initProvider();
            });
          }
        }
      });
    }
  };

  const nuvoLogin = React.useCallback(() => {
    // const walletId = localStorage.getItem('wagmi.recentConnectorId');
    if (localStorage.getItem('nuvo.register')) {
      return;
    } else {
      localStorage.setItem('nuvo.register', 'registered');
    }
    axios({
      url: NUVO_API + '/api/v1/oauth2/wallet/nonce',
      method: 'POST',
      data: {
        address: address,
        type: 'BITGET',
        app_id: NUVO_DAPP_ID,
      },
    }).then(({ data: res }) => {
      if (res?.data?.msg) {
        const message = res.data.msg;
        signMessage(
          { message },
          {
            onSuccess: (sig) => {
              const returnUrl = encodeURIComponent(location.href);
              axios({
                url: NUVO_API + '/api/v1/oauth2/wallet/get_code',
                data: {
                  address: address,
                  signature: sig,
                  wallet_type: 'BITGET',
                  return_url: returnUrl,
                  app_id: NUVO_DAPP_ID,
                },
              }).then(({ data: res }) => {
                console.log('wallet_get_code', res);
              });
            },
            onError: (error) => {
              console.error({
                type: 'SIGNING_FAIL',
                message: (error as Error)?.message || 'Oops! Something went wrong',
              });
            },
          },
        );
      }
    });
  }, [address, signMessage, NUVO_DAPP_ID, NUVO_API]);

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
    disconnect();
  }, [disconnect]);

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
    nuvoLogin,
    initProvider,
    nuvoWallet,
  };
}
