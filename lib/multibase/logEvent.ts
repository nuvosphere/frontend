import { track } from '@multibase/js';

import config from 'configs/app';

import type { EventTypes, EventPayload } from './utils';

export default function logEvent<EventType extends EventTypes>(
  event: EventType,
  properties: EventPayload<EventType>,
) {
  if (!config.features.multibase.isEnabled) {
    return;
  }
  track(event, properties);
}
