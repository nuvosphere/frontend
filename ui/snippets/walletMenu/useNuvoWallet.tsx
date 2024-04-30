import { PolisProvider } from '@metis.io/middleware-client';
import axios from 'axios';
import { ethers } from 'ethers';
import React, { useMemo } from 'react';
import { useSignMessage, useAccount } from 'wagmi';

import { getEnvValue } from 'configs/app/utils';
import { nuvoWalletSate } from 'lib/store/nuvoWallet';

export default function useNuvoWallet() {
  const { signMessage } = useSignMessage();
  const NUVO_DAPP_ID = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_ID'); // admin testnet app id
  const NUVO_API = getEnvValue('NEXT_PUBLIC_NUVO_API');
  const NUVO_DAPP_KEY = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_KEY'); // admin testnet app key
  const NUVO_CHAIN_ID = Number(getEnvValue('NEXT_PUBLIC_NUVO_CHAIN_ID'));
  const { address: walletConnectAddress } = useAccount();

  const nuvoWallet = nuvoWalletSate();

  const address = useMemo(() => {
    return nuvoWallet.address || walletConnectAddress || '';
  }, [nuvoWallet, walletConnectAddress]);

  const initProvider = React.useCallback(() => {
    const currentUrl = new URL(window.location.href);
    const code = currentUrl.searchParams.get('code');
    const accessToken = localStorage.getItem('AccessToken');
    if (code && !nuvoWallet.fetching) {
      nuvoWallet.setFetching(true)
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
      }).finally(() => {
        nuvoWallet.setFetching(false)
      });
    } else if (accessToken && !nuvoWallet.fetching) {
      nuvoWallet.setFetching(true)
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
      }).finally(() => {
        nuvoWallet.setFetching(false)
      });
    }
  }, [ NUVO_API, NUVO_CHAIN_ID, NUVO_DAPP_ID, NUVO_DAPP_KEY, nuvoWallet ]);

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

  return {
    nuvoLogin,
    initProvider,
    nuvoWallet,
  };
}
