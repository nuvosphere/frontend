import { Icon, Box, Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from '@chakra-ui/react';
import Image from 'next/image'
import React from 'react';
import { useConnect } from 'wagmi';

// import { getEnvValue } from 'configs/app/utils';
// eslint-disable-next-line no-restricted-imports
import BitgetLogo from 'icons/wallets/Bitget.png';
// eslint-disable-next-line no-restricted-imports
import MetaMaskLogo from 'icons/wallets/metamask.svg';
// eslint-disable-next-line no-restricted-imports
// import NuvoLogo from 'icons/wallets/Nuvo.svg';
// eslint-disable-next-line no-restricted-imports
import WalletConnectLogo from 'icons/wallets/WalletConnect.svg';
import useWallet from 'ui/snippets/walletMenu/useWallet';

type Props = {
  showConnect: boolean;
  setShowConnect: (bool: boolean) => void;
  openPopover: () => void;
};

const WalletDialog = ({ showConnect, setShowConnect, openPopover }: Props) => {
  // isModalOpen
  const { isWalletConnected, connect: walletConnect } = useWallet({ source: 'Header' });
  const { connect, connectors } = useConnect();

  // const NUVO_DAPP_ID = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_ID'); // admin testnet app id
  // const NUVO_OAUTH = getEnvValue('NEXT_PUBLIC_NUVO_OAUTH');

  const connectBitget = React.useCallback(async () => {
    localStorage.removeItem('nuvo.register');
    const connector = connectors.find((connector) => connector.id === 'com.bitget.web3');
    if (connector) {
      connect({ connector });
    } else {
      window.open('https://web3.bitget.com/zh-CN/wallet-download');
    }
  }, [connectors, connect]);

  const connectMetaMask = React.useCallback(async () => {
    localStorage.removeItem('nuvo.register');
    const connector = connectors.find((connector) => connector.id === 'io.metamask');
    if (connector) {
      connect({ connector });
    } else {
      window.open('https://metamask.io/download/');
    }
  }, [connectors, connect]);

  // const connectNuvo = React.useCallback(() => {
  //   const returnUrl = encodeURIComponent(location.href);
  //   const switchAccount = true;
  //   const loginUrl = NUVO_OAUTH + `/#/oauth2-login?switch_account=${switchAccount}&app_id=${NUVO_DAPP_ID}&return_url=${returnUrl}`;
  //   location.href = loginUrl;
  // }, [NUVO_DAPP_ID, NUVO_OAUTH]);

  const connectWalletConnect = React.useCallback(() => {
    localStorage.removeItem('nuvo.register');
    if (isWalletConnected) {
      openPopover();
    } else {
      walletConnect();
    }
  }, [isWalletConnected, walletConnect, openPopover]);

  return (
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
          {/*<Box*/}
          {/*  onClick={connectNuvo}*/}
          {/*  cursor="pointer"*/}
          {/*  borderRadius="12px"*/}
          {/*  border="1px"*/}
          {/*  borderColor="#E9E9E9"*/}
          {/*  background="#FCFCFC"*/}
          {/*  display="flex"*/}
          {/*  alignItems="center"*/}
          {/*  gap="30px"*/}
          {/*  paddingX="30px"*/}
          {/*  paddingY="10px"*/}
          {/*  marginBottom="30px"*/}
          {/*>*/}
          {/*  <Icon as={NuvoLogo} boxSize={12} />*/}
          {/*  <Box fontSize="18px" fontWeight="700">*/}
          {/*    Nuvo Wallet*/}
          {/*  </Box>*/}
          {/*</Box>*/}
          <Box
            onClick={connectBitget}
            cursor="pointer"
            borderRadius="12px"
            border="1px"
            borderColor="var(--chakra-colors-gray-200)"
            background="var(--chakra-colors-transparent)"
            display="flex"
            alignItems="center"
            gap="30px"
            paddingX="30px"
            paddingY="10px"
            marginBottom="30px"
          >
            <Box width={12} height={12}>
              {/*<BitgetLogo />*/}
              <Image src={BitgetLogo} alt="bitget" />
            </Box>
            <Box fontSize="18px" fontWeight="700">
              Bitget Wallet
            </Box>
          </Box>
          <Box
            onClick={connectMetaMask}
            cursor="pointer"
            borderRadius="12px"
            border="1px"
            borderColor="var(--chakra-colors-gray-200)"
            background="var(--chakra-colors-transparent)"
            display="flex"
            alignItems="center"
            gap="30px"
            paddingX="30px"
            paddingY="10px"
            marginBottom="30px"
          >
            <Box width={12} height={12}>
              <MetaMaskLogo />
            </Box>
            <Box fontSize="18px" fontWeight="700">
              MetaMask Wallet
            </Box>
          </Box>
          <Box
            onClick={connectWalletConnect}
            cursor="pointer"
            borderRadius="12px"
            border="1px"
            borderColor="var(--chakra-colors-gray-200)"
            background="var(--chakra-colors-transparent)"
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
  );
};

export default WalletDialog;
