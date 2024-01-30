import _ from 'lodash';

import type { NovesResponseData } from 'types/api/noves';

import type { TokensData } from './getTokensData';
import { getTokensData } from './getTokensData';

interface TokenWithIndices {
  name: string;
  hasId: boolean;
  indices: Array<number>;
  token: {
    name: string | undefined;
    symbol: string | undefined;
    address: string | undefined;
    id?: string | undefined;
  };
}

export interface DescriptionItems {
  token: {
    name: string | undefined;
    symbol: string | undefined;
    address: string | undefined;
    id?: string | undefined;
  } | undefined;
  text: string;
  hasId: boolean | undefined;
}

export const getDescriptionItems = (translateData: NovesResponseData): Array<DescriptionItems> => {

  // Remove final dot and add space at the start to avoid matching issues
  const description = translateData.classificationData.description;
  const removedFinalDot = description.endsWith('.') ? description.slice(0, description.length - 1) : description;
  let parsedDescription = ' ' + removedFinalDot;
  const tokenData = getTokensData(translateData);

  const idsMatched = tokenData.idList.filter(id => parsedDescription.includes(`#${ id }`));
  const tokensMatchedByName = tokenData.nameList.filter(name => parsedDescription.toUpperCase().includes(` ${ name.toUpperCase() }`));
  let tokensMatchedBySymbol = tokenData.symbolList.filter(symbol => parsedDescription.toUpperCase().includes(` ${ symbol.toUpperCase() }`));

  // Filter symbols if they're already matched by name
  tokensMatchedBySymbol = tokensMatchedBySymbol.filter(symbol => !tokensMatchedByName.includes(tokenData.bySymbol[symbol]?.name || ''));

  const indices: Array<number> = [];
  let tokensByName;
  let tokensBySymbol;

  if (idsMatched.length) {
    parsedDescription = removeIds(tokensMatchedByName, tokensMatchedBySymbol, idsMatched, tokenData, parsedDescription);
  }

  if (tokensMatchedByName.length) {
    tokensByName = parseTokensByName(tokensMatchedByName, idsMatched, tokenData, parsedDescription);

    tokensByName.forEach(i => indices.push(...i.indices));
  }

  if (tokensMatchedBySymbol.length) {
    tokensBySymbol = parseTokensBySymbol(tokensMatchedBySymbol, idsMatched, tokenData, parsedDescription);

    tokensBySymbol.forEach(i => indices.push(...i.indices));
  }

  const indicesSorted = _.uniq(indices.sort((a, b) => a - b));

  const tokensWithIndices = _.uniqBy(_.concat(tokensByName, tokensBySymbol), 'name');

  return createDescriptionItems(indicesSorted, tokensWithIndices, parsedDescription);
};

const removeIds = (
  tokensMatchedByName: Array<string>,
  tokensMatchedBySymbol: Array<string>,
  idsMatched: Array<string>,
  tokenData: TokensData,
  parsedDescription: string,
) => {
  // Remove ids from the description since we already have that info in the token object
  let description = parsedDescription;

  tokensMatchedByName.forEach(name => {
    const hasId = idsMatched.includes(tokenData.byName[name].id || '');
    if (hasId) {
      description = description.replaceAll(`#${ tokenData.byName[name].id }`, '');
    }
  });

  tokensMatchedBySymbol.forEach(name => {
    const hasId = idsMatched.includes(tokenData.bySymbol[name].id || '');
    if (hasId) {
      description = description.replaceAll(`#${ tokenData.bySymbol[name].id }`, '');
    }
  });

  return description;
};

const parseTokensByName = (tokensMatchedByName: Array<string>, idsMatched: Array<string>, tokenData: TokensData, parsedDescription: string) => {
  // Find indices and create tokens object

  const tokensByName: Array<TokenWithIndices> = tokensMatchedByName.map(name => {
    const searchString = ` ${ name.toUpperCase() }`;
    let hasId = false;

    if (idsMatched.length) {
      hasId = idsMatched.includes(tokenData.byName[name].id || '');
    }

    return {
      name,
      hasId,
      indices: [ ...parsedDescription.toUpperCase().matchAll(new RegExp(searchString, 'gi')) ].map(a => a.index) as unknown as Array<number>,
      token: tokenData.byName[name],
    };
  });

  return tokensByName;
};

const parseTokensBySymbol = (tokensMatchedBySymbol: Array<string>, idsMatched: Array<string>, tokenData: TokensData, parsedDescription: string) => {
  // Find indices and create tokens object

  const tokensBySymbol: Array<TokenWithIndices> = tokensMatchedBySymbol.map(name => {
    const searchString = ` ${ name.toUpperCase() }`;
    let hasId = false;

    if (idsMatched.length) {
      hasId = idsMatched.includes(tokenData.bySymbol[name].id || '');
    }

    return {
      name,
      hasId,
      indices: [ ...parsedDescription.toUpperCase().matchAll(new RegExp(searchString, 'gi')) ].map(a => a.index) as unknown as Array<number>,
      token: tokenData.bySymbol[name],
    };
  });

  return tokensBySymbol;
};

const createDescriptionItems = (indicesSorted: Array<number>, tokensWithIndices: Array<TokenWithIndices | undefined>, parsedDescription: string) => {
  // Split the description and create array of objects to render
  const descriptionItems = indicesSorted.map((endIndex, i) => {
    const item = tokensWithIndices.find(t => t?.indices.includes(endIndex));

    if (i === 0) {
      return {
        token: item?.token,
        text: parsedDescription.substring(0, endIndex),
        hasId: item?.hasId,
      };
    } else {
      const previousItem = tokensWithIndices.find(t => t?.indices.includes(indicesSorted[i - 1]));
      // Add the length of the text of the previous token to remove it from the start
      const startIndex = indicesSorted[i - 1] + (previousItem?.name.length || 0) + 1;
      return {
        token: item?.token,
        text: parsedDescription.substring(startIndex, endIndex),
        hasId: item?.hasId,
      };
    }
  });

  const lastIndex = indicesSorted[indicesSorted.length - 1];
  const startIndex = lastIndex + (tokensWithIndices.find(t => t?.indices.includes(lastIndex))?.name.length || 0);
  const restString = parsedDescription.substring(startIndex + 1);

  // Check if there is text left after the last token and push it to the array
  if (restString) {
    descriptionItems.push({ text: restString, token: undefined, hasId: false });
  }

  return descriptionItems;
};
