import { identify } from '@multibase/js';
import React from 'react';
import { useAccount } from 'wagmi';

import config from 'configs/app';
import useFetchProfileInfo from 'lib/hooks/useFetchProfileInfo';
import wagmiConfig from 'lib/web3/wagmiConfig';

const feature = config.features.blockchainInteraction;

const FallbackIdentifier = () => null;

const Web3Identifier = () => {
  const { address } = useAccount();
  const userInfoQuery = useFetchProfileInfo();
  const userEmail = userInfoQuery.data?.email;

  React.useEffect(() => {
    if (address) {
      identify({ address, properties: userEmail ? { email: userEmail } : undefined });
    }
  }, [ address, userEmail ]);

  return null;
};

const UserIdentifier = wagmiConfig && feature.isEnabled ? Web3Identifier : FallbackIdentifier;
export default UserIdentifier;
