import { Alert, Button, Flex } from '@chakra-ui/react';
import React, { useState } from 'react';

import useIsMobile from 'lib/hooks/useIsMobile';
import AddressEntity from 'ui/shared/entities/address/AddressEntity';
import useWallet from 'ui/snippets/walletMenu/useWallet';
import WalletDialog from 'ui/snippets/walletMenu/WalletDialog';

const ContractConnectWallet = () => {
  const { isModalOpening, disconnect, address, isWalletConnected } = useWallet({ source: 'Smart contracts' });
  const isMobile = useIsMobile();
  const [showConnect, setShowConnect] = useState(false);
  const openPopover = () => {}

  const content = (() => {
    if (!isWalletConnected) {
      return (
        <>
          <span>Disconnected</span>
          <Button
            ml={ 3 }
            onClick={ () => setShowConnect(true) }
            size="sm"
            variant="outline"
            isLoading={ isModalOpening }
            loadingText="Connect wallet"
          >
              Connect wallet
          </Button>
        </>
      );
    }

    return (
      <Flex columnGap={ 3 } rowGap={ 3 } alignItems={{ base: 'flex-start', lg: 'center' }} flexDir={{ base: 'column', lg: 'row' }}>
        <Flex alignItems="center">
          <span>Connected to</span>
          <AddressEntity
            address={{ hash: address }}
            truncation={ isMobile ? 'constant' : 'dynamic' }
            fontWeight={ 600 }
            ml={ 2 }
          />
        </Flex>
        <Button onClick={ disconnect } size="sm" variant="outline">Disconnect</Button>
      </Flex>
    );
  })();

  return (
    <>
      <Alert mb={6} status={address ? 'success' : 'warning'}>
        {content}
      </Alert>
      <WalletDialog showConnect={showConnect} setShowConnect={setShowConnect} openPopover={openPopover} />
    </>
  );
};

export default ContractConnectWallet;
