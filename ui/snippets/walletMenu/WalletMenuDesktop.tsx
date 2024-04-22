import type { ButtonProps } from '@chakra-ui/react'
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
} from '@chakra-ui/react'
import React, { useState } from 'react'

// eslint-disable-next-line no-restricted-imports
import BitgetLogo from 'icons/wallets/Bitget.svg'
// eslint-disable-next-line no-restricted-imports
import NuvoLogo from 'icons/wallets/Nuvo.svg'
// eslint-disable-next-line no-restricted-imports
import WalletConnectLogo from 'icons/wallets/WalletConnect.svg'
import useIsMobile from 'lib/hooks/useIsMobile'
import * as mixpanel from 'lib/mixpanel/index'
import AddressIdenticon from 'ui/shared/entities/address/AddressIdenticon'
import HashStringShorten from 'ui/shared/HashStringShorten'
import useWallet from 'ui/snippets/walletMenu/useWallet'
import WalletMenuContent from 'ui/snippets/walletMenu/WalletMenuContent'

import useMenuButtonColors from '../useMenuButtonColors'
import WalletTooltip from './WalletTooltip'

type Props = {
  isHomePage?: boolean
}

const WalletMenuDesktop = ({ isHomePage }: Props) => {
  // isModalOpen
  const { isWalletConnected, address, connect, disconnect, isModalOpening } = useWallet({
    source: 'Header',
  })
  const { themedBackground, themedBorderColor, themedColor } = useMenuButtonColors()
  const [isPopoverOpen, setIsPopoverOpen] = useBoolean(false)
  const isMobile = useIsMobile()

  const [showConnect, setShowConnect] = useState(false)

  const variant = React.useMemo(() => {
    if (isWalletConnected) {
      return 'subtle'
    }
    return isHomePage ? 'solid' : 'outline'
  }, [isWalletConnected, isHomePage])

  let buttonStyles: Partial<ButtonProps> = {}
  if (isWalletConnected) {
    buttonStyles = {
      bg: isHomePage ? 'blue.50' : themedBackground,
      color: isHomePage ? 'blackAlpha.800' : themedColor,
      _hover: {
        color: isHomePage ? 'blackAlpha.800' : themedColor,
      },
    }
  } else if (isHomePage) {
    buttonStyles = {
      color: 'white',
    }
  } else {
    buttonStyles = {
      borderColor: themedBorderColor,
      color: themedColor,
    }
  }

  const openPopover = React.useCallback(() => {
    mixpanel.logEvent(mixpanel.EventTypes.WALLET_ACTION, { Action: 'Open' })
    setIsPopoverOpen.on()
  }, [setIsPopoverOpen])

  const connectBitget = React.useCallback(() => {
    const provider = window.bitkeep && window.bitkeep.ethereum

    if (!provider) {
      window.open('https://web3.bitget.com/zh-CN/wallet-download?type=2')
    }
    connect()
  }, [connect])

  const connectNuvo = React.useCallback(() => {
    const VITE_OAUTH_URL = 'https://oauth.staging.nuvosphere.io'
    const VITE_DAPP_ID = '646da224e530a70013d94d8f'

    const returnUrl = encodeURIComponent(location.href)
    const switchAccount = true
    const loginUrl = `${VITE_OAUTH_URL}/#/oauth2-login?switch_account=${switchAccount}&app_id=${VITE_DAPP_ID}&return_url=${returnUrl}`
    location.href = loginUrl
  }, [])

  return (
    <>
      <Popover
        openDelay={300}
        placement="bottom-end"
        gutter={10}
        isLazy
        isOpen={isPopoverOpen}
        onClose={setIsPopoverOpen.off}
      >
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
                  isWalletConnected ? openPopover() : setShowConnect(true)
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
          setShowConnect(false)
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
              <Icon as={BitgetLogo} boxSize={12} />
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
  )
}

export default WalletMenuDesktop
