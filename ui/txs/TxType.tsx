import React from 'react';

import type { TransactionType } from 'types/api/transaction';

import Tag from 'ui/shared/chakra/Tag';

export interface Props {
  types: Array<TransactionType>;
  isLoading?: boolean;
  translateLabel?: string;
}

const TYPES_ORDER = [ 'rootstock_remasc', 'rootstock_bridge', 'token_creation', 'contract_creation', 'token_transfer', 'contract_call', 'coin_transfer' ];

const TxType = ({ types, isLoading, translateLabel }: Props) => {
  const typeToShow = types.sort((t1, t2) => TYPES_ORDER.indexOf(t1) - TYPES_ORDER.indexOf(t2))[0];

  const filteredTypes = [ 'unclassified' ];

  let label;
  let colorScheme;

  switch (typeToShow) {
    case 'contract_call':
      label = 'Contract call';
      colorScheme = 'blue';
      break;
    case 'contract_creation':
      label = 'Contract creation';
      colorScheme = 'blue';
      break;
    case 'token_transfer':
      label = 'Token transfer';
      colorScheme = 'orange';
      break;
    case 'token_creation':
      label = 'Token creation';
      colorScheme = 'orange';
      break;
    case 'coin_transfer':
      label = 'Coin transfer';
      colorScheme = 'orange';
      break;
    case 'rootstock_remasc':
      label = 'REMASC';
      colorScheme = 'blue';
      break;
    case 'rootstock_bridge':
      label = 'Bridge';
      colorScheme = 'blue';
      break;
    default:
      label = 'Transaction';
      colorScheme = 'purple';

  }

  if (translateLabel) {
    if (!filteredTypes.includes(translateLabel)) {
      return (
        <Tag colorScheme={ colorScheme } isLoading={ isLoading }>
          { translateLabel }
        </Tag>
      );
    }
  }

  return (
    <Tag colorScheme={ colorScheme } isLoading={ isLoading }>
      { label }
    </Tag>
  );
};

export default TxType;
