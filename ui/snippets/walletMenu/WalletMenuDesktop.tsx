import type { ButtonProps } from '@chakra-ui/react';
import {
  Icon,
  Popover,
  PopoverContent,
  PopoverBody,
  PopoverTrigger,
  Button,
  Box,
  useBoolean,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
} from '@chakra-ui/react';
import axios from 'axios';
import Image from 'next/image';
import React, { useState } from 'react';
import { useSignMessage, useConnect } from 'wagmi';

// eslint-disable-next-line no-restricted-imports
import BitgetLogo from 'icons/wallets/Bitget.png';
// eslint-disable-next-line no-restricted-imports
import NuvoLogo from 'icons/wallets/Nuvo.svg';
// eslint-disable-next-line no-restricted-imports
import WalletConnectLogo from 'icons/wallets/WalletConnect.svg';
import useIsMobile from 'lib/hooks/useIsMobile';
import * as mixpanel from 'lib/mixpanel/index';
import AddressIdenticon from 'ui/shared/entities/address/AddressIdenticon';
import HashStringShorten from 'ui/shared/HashStringShorten';
import useWallet from 'ui/snippets/walletMenu/useWallet';
import WalletMenuContent from 'ui/snippets/walletMenu/WalletMenuContent';

import useMenuButtonColors from '../useMenuButtonColors';
import WalletTooltip from './WalletTooltip';

type Props = {
  isHomePage?: boolean;
};

const WalletMenuDesktop = ({ isHomePage }: Props) => {
  // isModalOpen
  const { isWalletConnected, address, disconnect, isModalOpening, connect: walletConnect } = useWallet({ source: 'Header' });
  const { connect, connectors } = useConnect();
  const { themedBackground, themedBorderColor, themedColor } = useMenuButtonColors();
  const [isPopoverOpen, setIsPopoverOpen] = useBoolean(false);
  const isMobile = useIsMobile();
  const [showConnect, setShowConnect] = useState(false);
  const { signMessage } = useSignMessage();

  const NUVO_DAPP_ID = '64bf8264ccdabc001392582f'; // admin testnet app id
  // const NUVO_DAPP_KEY = 'd90da492d517476d8d47f49e6a6c46b6'; // admin testnet app key
  const NUVO_OAUTH = 'https://oauth.staging.nuvosphere.io';
  const NUVO_API = 'https://api.staging.nuvosphere.io';
  // const NUVO_CHAIN_ID = 59902;

  const registerNuvo = React.useCallback(() => {
    const walletId = localStorage.getItem('wagmi.recentConnectorId');
    if (localStorage.getItem('nuvo.register') || walletId !== `"com.bitget.web3"`) {
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
  }, [address, signMessage]);

  const variant = React.useMemo(() => {
    if (isWalletConnected) {
      if (showConnect) {
        registerNuvo();
        setShowConnect(false);
      }
      return 'subtle';
    }
    return isHomePage ? 'solid' : 'outline';
  }, [isWalletConnected, isHomePage, showConnect, registerNuvo]);

  let buttonStyles: Partial<ButtonProps> = {};
  if (isWalletConnected) {
    buttonStyles = {
      bg: isHomePage ? 'blue.50' : themedBackground,
      color: isHomePage ? 'blackAlpha.800' : themedColor,
      _hover: {
        color: isHomePage ? 'blackAlpha.800' : themedColor,
      },
    };
  } else if (isHomePage) {
    buttonStyles = {
      color: 'white',
    };
  } else {
    buttonStyles = {
      borderColor: themedBorderColor,
      color: themedColor,
    };
  }

  const openPopover = React.useCallback(() => {
    mixpanel.logEvent(mixpanel.EventTypes.WALLET_ACTION, { Action: 'Open' });
    setIsPopoverOpen.on();
  }, [setIsPopoverOpen]);

  const connectBitget = React.useCallback(async () => {
    localStorage.removeItem('nuvo.register');
    const bitgetConnector = connectors.find((connector) => connector.id === 'com.bitget.web3');
    if (bitgetConnector) {
      connect({ connector: bitgetConnector });
    } else {
      window.open('https://web3.bitget.com/zh-CN/wallet-download?type=2');
    }
  }, [connectors, connect]);

  const connectNuvo = React.useCallback(() => {
    const returnUrl = encodeURIComponent(location.href);
    const switchAccount = true;
    const loginUrl = NUVO_OAUTH + `/#/oauth2-login?switch_account=${switchAccount}&app_id=${NUVO_DAPP_ID}&return_url=${returnUrl}`;
    location.href = loginUrl;
  }, []);

  const connectWalletConnect = React.useCallback(() => {
    localStorage.removeItem('nuvo.register');
    if (isWalletConnected) {
      openPopover();
    } else {
      walletConnect();
    }
  }, [isWalletConnected, openPopover, walletConnect]);

  return (
    <>
      <Popover openDelay={300} placement="bottom-end" gutter={10} isLazy isOpen={isPopoverOpen} onClose={setIsPopoverOpen.off}>
        <WalletTooltip isDisabled={isWalletConnected || isMobile === undefined || isMobile}>
          <Box ml={2}>
            <PopoverTrigger>
              <Button
                variant={variant}
                colorScheme="blue"
                flexShrink={0}
                isLoading={isModalOpening}
                loadingText="Connect wallet"
                onClick={() => {
                  isWalletConnected ? openPopover() : setShowConnect(true);
                }}
                fontSize="sm"
                {...buttonStyles}
              >
                {isWalletConnected ? (
                  <>
                    <Box mr={2}>
                      <AddressIdenticon size={20} hash={address} />
                    </Box>
                    <HashStringShorten hash={address} isTooltipDisabled />
                  </>
                ) : (
                  'Connect wallet'
                )}
              </Button>
            </PopoverTrigger>
          </Box>
        </WalletTooltip>
        {isWalletConnected && (
          <PopoverContent w="235px">
            <PopoverBody padding="24px 16px 16px 16px">
              <WalletMenuContent address={address} disconnect={disconnect} />
            </PopoverBody>
          </PopoverContent>
        )}
      </Popover>
      <Modal
        isOpen={showConnect}
        onClose={() => {
          setShowConnect(false);
        }}
        size={{ base: 'full', lg: 'sm' }}
      >
        <ModalOverlay zIndex="100" />
        <ModalContent
          containerProps={{
            zIndex: '101',
          }}
        >
          <ModalHeader>Connect Wallet</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <Box
              onClick={connectNuvo}
              cursor="pointer"
              borderRadius="12px"
              border="1px"
              borderColor="#E9E9E9"
              background="#FCFCFC"
              display="flex"
              alignItems="center"
              gap="30px"
              paddingX="30px"
              paddingY="10px"
              marginBottom="30px"
            >
              <Icon as={NuvoLogo} boxSize={12} />
              <Box fontSize="18px" fontWeight="700">
                Nuvo Wallet
              </Box>
            </Box>
            <Box
              onClick={connectBitget}
              cursor="pointer"
              borderRadius="12px"
              border="1px"
              borderColor="#E9E9E9"
              background="#FCFCFC"
              display="flex"
              alignItems="center"
              gap="30px"
              paddingX="30px"
              paddingY="10px"
              marginBottom="30px"
            >
              <Image src={BitgetLogo} width={48} height={48} alt="" />
              <Box fontSize="18px" fontWeight="700">
                Bitget Wallet
              </Box>
            </Box>
            <Box
              onClick={connectWalletConnect}
              cursor="pointer"
              borderRadius="12px"
              border="1px"
              borderColor="#E9E9E9"
              background="#FCFCFC"
              display="flex"
              alignItems="center"
              gap="30px"
              paddingX="30px"
              paddingY="10px"
            >
              <Icon as={WalletConnectLogo} boxSize={12} />
              <Box fontSize="18px" fontWeight="700">
                WalletConnect
              </Box>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </>
  );
};

export default WalletMenuDesktop;
