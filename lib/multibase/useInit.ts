import { init } from '@multibase/js';
import React from 'react';

import config from 'configs/app';

export default function useMixpanelInit() {
  const [ isInited, setIsInited ] = React.useState(false);

  React.useEffect(() => {
    const feature = config.features.multibase;
    if (!feature.isEnabled) {
      return;
    }

    init(feature.apiKey);
    setIsInited(true);
  }, []);

  return isInited;
}
