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
import Image from 'next/image';
import React, { useState } from 'react';
import { useSignMessage } from 'wagmi';

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
  const { isWalletConnected, address, connect, disconnect, isModalOpening } = useWallet({ source: 'Header' });
  const { themedBackground, themedBorderColor, themedColor } = useMenuButtonColors();
  const [ isPopoverOpen, setIsPopoverOpen ] = useBoolean(false);
  const isMobile = useIsMobile();
  const [showConnect, setShowConnect] = useState(false);
  const { signMessage } = useSignMessage();
  // const { address } = useAccount()

  const DAPP_ID = '646da224e530a70013d94d8f';
  const NUVO_API = 'https://api.staging.nuvosphere.io';
  const RETURN_URL = 'http://127.0.0.1:3000';

  const sign = React.useCallback(
    (message: string) => {
      signMessage(
        { message },
        {
          onSuccess: (sig) => {
            fetch(NUVO_API + '/api/v1/oauth2/wallet/get_code', {
              method: 'POST',
              headers: { 'content-type': 'application/json' },
              body: JSON.stringify({
                address: address,
                signature: sig,
                wallet_type: 'BITGET',
                return_url: RETURN_URL,
                app_id: DAPP_ID,
              }),
            })
              .then((response) => response.json())
              .then((res) => {
                console.log('wallet_get_code', res);
              })
              .catch((err) => console.error(err));
          },
          onError: (error) => {
            console.error({
              type: 'SIGNING_FAIL',
              message: (error as Error)?.message || 'Oops! Something went wrong',
            });
          },
        },
      );
    },
    [signMessage, address],
  );

  const putNuvo = React.useCallback(() => {
    const walletId = localStorage['wagmi.recentConnectorId'];
    if (walletId !== `"com.bitget.web3"`) {
      return;
    }

    fetch(NUVO_API + '/api/v1/oauth2/wallet/nonce', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        address: address,
        type: 'BITGET',
        app_id: DAPP_ID,
      }),
    })
      .then(
        (response) =>
          response.json() as unknown as {
            data: {
              msg: string;
            };
          },
      )
      .then((res) => {
        if (res?.data?.msg) {
          const message = res.data.msg;
          sign(message);
        }
      })
      .catch((err) => console.error(err));
  }, [sign, address]);

  const variant = React.useMemo(() => {
    if (isWalletConnected) {
      if (showConnect) {
        putNuvo();
        setShowConnect(false);
      }
      return 'subtle';
    }
    return isHomePage ? 'solid' : 'outline';
  }, [isWalletConnected, isHomePage, showConnect, putNuvo]);

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
  // const loginWC = async ()=> {
  //   if(this.loginParam.isOauth2){
  //     await this.loginWalletConnectOAuth2();
  //     return;
  //   }
  //
  //   WallectConnector.loginWalletConnect(this.loginParam.isOauth2).then(async (result) => {
  //     if (result.code == 200) {
  //       this.loginSuccess(result.data);
  //
  //       SystemModule.updateloadingDialog(false);
  //     } else {
  //       SystemModule.updatePromptData({
  //         status: true,
  //         content: result.msg
  //       });
  //     }
  //   })
  //     .catch((err)=>{
  //       SystemModule.updateloadingDialog(false);
  //       let showMSg = true;
  //       if(err.message && err.message == "User closed modal"){
  //         showMSg = false;
  //       }
  //       SystemModule.updatePromptData({
  //         status: showMSg,
  //         content: err.message?err.message:err
  //       });
  //     });
  // }

  const connectBitget = React.useCallback(() => {
    const provider = window.bitkeep && window.bitkeep.ethereum;
    if (!provider) {
      window.open('https://web3.bitget.com/zh-CN/wallet-download?type=2');
      return;
    }
    connect();
    //
    // const walletType = "BITGET";
    // if (isMobile) {
    //   loginWC()
    //   return ;
    // }
    // console.log('--2--', 2)
    // if(this.loginParam.isOauth2){
    //   await this.loginMMOauth2(walletType);
    //   return;
    // }
    //
    // console.log('--3--', 3)
    // SystemModule.updateloadingDialog(true);
    // const address: any = await biggetWallet.getMetaAccounts();
    // if (!address || address.length <= 0) {
    //   SystemModule.updateloadingDialog(false);
    //   return;
    // }
    //
    // console.log('--4--', 4)
    // if(this.mm_sign[address]){
    //   console.log('--5--',5)
    //   this.loginMMMethod(address,this.mm_sign[address]);
    // }else{
    //   console.log('--6--',6)
    //   const nonceRes = await requestMMNonce(address,walletType, false);
    //   console.log('--nonceRes--',nonceRes)
    //   if (nonceRes.code == 200) {
    //     console.log('--7--',7 )
    //     this.mm_sign[address] = nonceRes.data.msg;
    //     this.loginMMMethod(address,this.mm_sign[address],walletType);
    //   }else{
    //     console.log('--8--',8)
    //     SystemModule.updatePromptData({
    //       status: true,
    //       content: nonceRes.msg
    //     });
    //   }
    //   console.log('--9--',9)
    // }
  }, [ connect ]);

  const connectNuvo = React.useCallback(() => {
    const VITE_OAUTH_URL = 'https://oauth.staging.nuvosphere.io';
    const VITE_DAPP_ID = '646da224e530a70013d94d8f';

    const returnUrl = encodeURIComponent(location.href);
    const switchAccount = true;
    const loginUrl = `${VITE_OAUTH_URL}/#/oauth2-login?switch_account=${switchAccount}&app_id=${VITE_DAPP_ID}&return_url=${returnUrl}`;
    location.href = loginUrl;
  }, []);

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
      {/* eslint-disable-next-line react/jsx-no-bind */}
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
            {/* eslint-disable-next-line react/jsx-no-bind */}
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
              onClick={isWalletConnected ? openPopover : connect}
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
