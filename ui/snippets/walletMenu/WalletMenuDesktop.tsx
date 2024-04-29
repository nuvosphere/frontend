import type { ButtonProps } from '@chakra-ui/react';
import { Popover, PopoverContent, PopoverBody, PopoverTrigger, Button, Box, useBoolean } from '@chakra-ui/react';
import axios from 'axios';
import React, { useState } from 'react';
import { useSignMessage } from 'wagmi';

import { getEnvValue } from 'configs/app/utils';
import useIsMobile from 'lib/hooks/useIsMobile';
import * as mixpanel from 'lib/mixpanel/index';
import AddressIdenticon from 'ui/shared/entities/address/AddressIdenticon';
import HashStringShorten from 'ui/shared/HashStringShorten';
import useWallet from 'ui/snippets/walletMenu/useWallet';
import WalletMenuContent from 'ui/snippets/walletMenu/WalletMenuContent';

import useMenuButtonColors from '../useMenuButtonColors';
import WalletDialog from './WalletDialog';
import WalletTooltip from './WalletTooltip';

type Props = {
  isHomePage?: boolean;
};

const WalletMenuDesktop = ({ isHomePage }: Props) => {
  // isModalOpen
  const { isWalletConnected, address, disconnect, isModalOpening } = useWallet({ source: 'Header' });
  const { themedBackground, themedBorderColor, themedColor } = useMenuButtonColors();
  const [isPopoverOpen, setIsPopoverOpen] = useBoolean(false);
  const isMobile = useIsMobile();
  const [showConnect, setShowConnect] = useState(false);
  const { signMessage } = useSignMessage();

  const NUVO_DAPP_ID = getEnvValue('NEXT_PUBLIC_NUVO_DAPP_ID'); // admin testnet app id
  const NUVO_API = getEnvValue('NEXT_PUBLIC_NUVO_API');

  const registerNuvo = React.useCallback(() => {
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

  const openPopover = React.useCallback(() => {
    mixpanel.logEvent(mixpanel.EventTypes.WALLET_ACTION, { Action: 'Open' });
    setIsPopoverOpen.on();
  }, [setIsPopoverOpen]);

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
      <WalletDialog showConnect={showConnect} setShowConnect={setShowConnect} openPopover={openPopover} />
    </>
  );
};

export default WalletMenuDesktop;
