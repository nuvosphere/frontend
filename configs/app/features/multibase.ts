import type { Feature } from './types';

import { getEnvValue } from '../utils';

const apiKey = getEnvValue('NEXT_PUBLIC_MULTIBASE_API_KEY');

const title = 'Multibase analytics';

const config: Feature<{ apiKey: string }> = (() => {
  if (apiKey) {
    return Object.freeze({
      title,
      isEnabled: true,
      apiKey,
    });
  }

  return Object.freeze({
    title,
    isEnabled: false,
  });
})();

export default config;
