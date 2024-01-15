import { Grid, GridItem, Text, Link, Skeleton } from '@chakra-ui/react';
import type { UseQueryResult } from '@tanstack/react-query';
import BigNumber from 'bignumber.js';
import React from 'react';
import { scroller, Element } from 'react-scroll';

import type { UserOp } from 'types/api/userOps';

import config from 'configs/app';
import type { ResourceError } from 'lib/api/resources';
import { WEI, WEI_IN_GWEI } from 'lib/consts';
import { space } from 'lib/html-entities';
import CurrencyValue from 'ui/shared/CurrencyValue';
import DataFetchAlert from 'ui/shared/DataFetchAlert';
import DetailsInfoItem from 'ui/shared/DetailsInfoItem';
import DetailsInfoItemDivider from 'ui/shared/DetailsInfoItemDivider';
import DetailsTimestamp from 'ui/shared/DetailsTimestamp';
import BlockEntity from 'ui/shared/entities/block/BlockEntity';
import TxEntity from 'ui/shared/entities/tx/TxEntity';
import UserOpsAddress from 'ui/shared/userOps/UserOpsAddress';
import UserOpSponsorType from 'ui/shared/userOps/UserOpSponsorType';
import UserOpStatus from 'ui/shared/userOps/UserOpStatus';

interface Props {
  query: UseQueryResult<UserOp, ResourceError>;
}

const CUT_LINK_NAME = 'UserOpDetails__cutLink';

const UserOpDetails = ({ query }: Props) => {
  const [ isExpanded, setIsExpanded ] = React.useState(false);

  const { data, isPlaceholderData, isError, error } = query;

  const handleCutClick = React.useCallback(() => {
    setIsExpanded((flag) => !flag);
    scroller.scrollTo(CUT_LINK_NAME, {
      duration: 500,
      smooth: true,
    });
  }, []);

  if (isError) {
    if (error?.status === 404) {
      throw Error('User operation not found', { cause: error as unknown as Error });
    }

    // not implemented on the back-end
    if (error?.status === 422) {
      throw Error('Invalid user operation hash', { cause: error as unknown as Error });
    }

    return <DataFetchAlert/>;
  }

  if (!data) {
    return null;
  }

  return (
    <Grid
      columnGap={ 8 }
      rowGap={{ base: 3, lg: 3 }}
      templateColumns={{ base: 'minmax(0, 1fr)', lg: 'minmax(min-content, 220px) minmax(0, 1fr)' }}
      overflow="hidden"
    >
      <DetailsInfoItem
        title="User operation hash"
        hint="Unique character string assigned to every User operation"
        isLoading={ isPlaceholderData }
      >
        <Skeleton isLoaded={ !isPlaceholderData }>
          { data.hash }
        </Skeleton>
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Sender"
        hint="The address of the smart contract account"
        isLoading={ isPlaceholderData }
      >
        <UserOpsAddress address={ data.sender } isLoading={ isPlaceholderData }/>
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Status"
        hint="Current User operation state"
        isLoading={ isPlaceholderData }
      >
        <UserOpStatus status={ data.status } isLoading={ isPlaceholderData }/>
      </DetailsInfoItem>
      { data.revert_reason && (
        <DetailsInfoItem
          title="Revert reason"
          hint="The revert reason of the User operation"
          isLoading={ isPlaceholderData }
        >
          <Skeleton isLoaded={ !isPlaceholderData }>
            { data.revert_reason }
          </Skeleton>
        </DetailsInfoItem>
      ) }
      { data.timestamp && (
        <DetailsInfoItem
          title="Timestamp"
          hint="Date and time of User operation"
          isLoading={ isPlaceholderData }
        >
          { /* timestamp format will be fixed  */ }
          <DetailsTimestamp timestamp={ Number(data.timestamp) * 1000 } isLoading={ isPlaceholderData }/>
        </DetailsInfoItem>
      ) }
      { /* condition? */ }
      <DetailsInfoItem
        title="Fee"
        hint="Total User operation fee"
        isLoading={ isPlaceholderData }
      >
        <CurrencyValue
          value={ data.fee }
          currency={ config.chain.currency.symbol }
          isLoading={ isPlaceholderData }
        />
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Gas limit"
        hint="Gas limit for the User operation"
        isLoading={ isPlaceholderData }
      >
        <Skeleton isLoaded={ !isPlaceholderData }>
          { BigNumber(data.gas).toFormat() }
        </Skeleton>
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Transaction hash"
        hint="Hash of the transaction this User operation belongs to"
      >
        <TxEntity hash={ data.transaction_hash } isLoading={ isPlaceholderData }/>
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Block"
        hint="Block number containing this User operation"
      >
        <BlockEntity number={ data.block_number } isLoading={ isPlaceholderData }/>
      </DetailsInfoItem>
      <DetailsInfoItem
        title="Entry point"
        hint="Contract that executes bundles of User operations"
      >
        <UserOpsAddress address={ data.entry_point } isLoading={ isPlaceholderData }/>
      </DetailsInfoItem>

      { /* CUT */ }
      <GridItem colSpan={{ base: undefined, lg: 2 }}>
        <Element name={ CUT_LINK_NAME }>
          <Skeleton isLoaded={ !isPlaceholderData } mt={ 6 } display="inline-block">
            <Link
              fontSize="sm"
              textDecorationLine="underline"
              textDecorationStyle="dashed"
              onClick={ handleCutClick }
            >
              { isExpanded ? 'Hide details' : 'View details' }
            </Link>
          </Skeleton>
        </Element>
      </GridItem>

      { /* ADDITIONAL INFO */ }
      { isExpanded && !isPlaceholderData && (
        <>
          <GridItem colSpan={{ base: undefined, lg: 2 }} mt={{ base: 1, lg: 4 }}/>

          <DetailsInfoItem
            title="Call gas limit"
            hint="Gas limit for execution phase"
          >
            { BigNumber(data.call_gas_limit).toFormat() }
          </DetailsInfoItem>
          <DetailsInfoItem
            title="Verification gas limit"
            hint="Gas limit for verification phase"
          >
            { BigNumber(data.verification_gas_limit).toFormat() }
          </DetailsInfoItem>
          <DetailsInfoItem
            title="Pre-verification gas"
            hint="Gas to compensate the bundler"
          >
            { BigNumber(data.pre_verification_gas).toFormat() }
          </DetailsInfoItem>
          <DetailsInfoItem
            title="Max fee per gas"
            hint="Maximum fee per gas "
          >
            <Text>{ BigNumber(data.max_fee_per_gas).dividedBy(WEI).toFixed() } { config.chain.currency.symbol } </Text>
            <Text variant="secondary" whiteSpace="pre">
              { space }({ BigNumber(data.max_fee_per_gas).dividedBy(WEI_IN_GWEI).toFixed() } Gwei)
            </Text>
          </DetailsInfoItem>
          <DetailsInfoItem
            title="Max priority fee per gas"
            hint="Maximum priority fee per gas"
          >
            <Text>{ BigNumber(data.max_priority_fee_per_gas).dividedBy(WEI).toFixed() } { config.chain.currency.symbol } </Text>
            <Text variant="secondary" whiteSpace="pre">
              { space }({ BigNumber(data.max_priority_fee_per_gas).dividedBy(WEI_IN_GWEI).toFixed() } Gwei)
            </Text>
          </DetailsInfoItem>

          <DetailsInfoItemDivider/>

          { data.aggregator && (
            <DetailsInfoItem
              title="Aggregator"
              hint="Helper contract to validate an aggregated signature"
            >
              <UserOpsAddress address={ data.aggregator }/>
            </DetailsInfoItem>
          ) }
          { data.aggregator_signature && (
            <DetailsInfoItem
              title="Aggregator signature"
              hint="Aggregator signature"
            >
              { data.aggregator_signature }
            </DetailsInfoItem>
          ) }
          <DetailsInfoItem
            title="Bundler"
            hint="A node (block builder) that handles User operations"
          >
            <UserOpsAddress address={ data.bundler }/>
          </DetailsInfoItem>
          { data.factory && (
            <DetailsInfoItem
              title="Factory"
              hint="Smart contract that deploys new smart contract wallets for users"
            >
              <UserOpsAddress address={ data.factory }/>
            </DetailsInfoItem>
          ) }
          { data.paymaster && (
            <DetailsInfoItem
              title="Paymaster"
              hint="Contract to sponsor the gas fees for User operations"
            >
              <UserOpsAddress address={ data.paymaster }/>
            </DetailsInfoItem>
          ) }
          <DetailsInfoItem
            title="Sponsor type"
            hint="Type of the gas fees sponsor"
          >
            <UserOpSponsorType sponsorType={ data.sponsor_type }/>
          </DetailsInfoItem>

          <DetailsInfoItemDivider/>

          { data.init_code && (
            <DetailsInfoItem
              title="Init code"
              hint="Code used to deploy the account if not yet on-chain"
            >
              { data.init_code }
            </DetailsInfoItem>
          ) }
          <DetailsInfoItem
            title="Signature"
            hint="Used to validate a User operation along with the nonce during verification"

            wordBreak="break-all"
            whiteSpace="normal"

          >
            { data.signature }
          </DetailsInfoItem>
          <DetailsInfoItem
            title="Nonce"
            hint="Anti-replay protection; also used as the salt for first-time account creation"
          >
            { data.nonce }
          </DetailsInfoItem>
        </>
      ) }
    </Grid>
  );
};

export default UserOpDetails;