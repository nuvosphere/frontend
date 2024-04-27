import { useColorMode } from '@chakra-ui/react';
import { PolisProvider } from '@metis.io/middleware-client';
import { createWeb3Modal, useWeb3ModalTheme } from '@web3modal/wagmi/react';
import axios from 'axios';
import { ethers } from 'ethers';
import React from 'react';
import { WagmiProvider } from 'wagmi';

import config from 'configs/app';
import wagmiConfig from 'lib/web3/wagmiConfig';
import colors from 'theme/foundations/colors';
import { BODY_TYPEFACE } from 'theme/foundations/typography';
import zIndices from 'theme/foundations/zIndices';
const feature = config.features.blockchainInteraction;

const NUVO_DAPP_ID = '64bf8264ccdabc001392582f'; // admin testnet app id
const NUVO_DAPP_KEY = 'd90da492d517476d8d47f49e6a6c46b6'; // admin testnet app key
// const NUVO_OAUTH = 'https://oauth.staging.nuvosphere.io';
const NUVO_API = 'https://api.staging.nuvosphere.io';
const NUVO_CHAIN_ID = 59902;

const initProvider = () => {
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
        const address = res.data.eth_address;
        console.log('🌊', address);
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
    // get provider
    const polisProvider = new PolisProvider({
      apiHost: NUVO_API,
      token: accessToken,
      chainId: NUVO_CHAIN_ID,
    });
    const provider = new ethers.providers.Web3Provider(polisProvider);
    console.log('🌊', provider);
  }
};

const init = () => {
  try {
    if (!wagmiConfig || !feature.isEnabled) {
      return;
    }
    createWeb3Modal({
      wagmiConfig,
      projectId: feature.walletConnect.projectId,
      themeVariables: {
        '--w3m-font-family': `${BODY_TYPEFACE}, sans-serif`,
        '--w3m-accent': colors.blue[600],
        '--w3m-border-radius-master': '2px',
        '--w3m-z-index': zIndices.modal,
      },
      featuredWalletIds: [],
      allowUnsupportedChain: true,
    });
    initProvider();
  } catch (error) {}
};

init();

interface Props {
  children: React.ReactNode;
  fallback?: JSX.Element | (() => JSX.Element);
}

const Fallback = ({ children, fallback }: Props) => {
  return typeof fallback === 'function' ? fallback() : fallback || <>{children}</>; // eslint-disable-line react/jsx-no-useless-fragment
};

const Provider = ({ children, fallback }: Props) => {
  const { colorMode } = useColorMode();
  const { setThemeMode } = useWeb3ModalTheme();

  React.useEffect(() => {
    setThemeMode(colorMode);
  }, [colorMode, setThemeMode]);

  // not really necessary, but we have to make typescript happy
  if (!wagmiConfig || !feature.isEnabled) {
    return <Fallback fallback={fallback}>{children}</Fallback>;
  }

  return <WagmiProvider config={wagmiConfig}>{children}</WagmiProvider>;
};

const Web3ModalProvider = wagmiConfig && feature.isEnabled ? Provider : Fallback;

export default Web3ModalProvider;
