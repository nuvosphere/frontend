import type CspDev from 'csp-dev';

import config from 'configs/app';

export function multibase(): CspDev.DirectiveDescriptor {
  if (!config.features.multibase.isEnabled) {
    return {};
  }

  return {
    'connect-src': [
      '*.multibase.co',
    ],
  };
}
