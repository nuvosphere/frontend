export enum EventTypes {
  PAGE_VIEW = 'Page view',
}

/* eslint-disable @typescript-eslint/indent */
export type EventPayload<Type extends EventTypes> =
Type extends EventTypes.PAGE_VIEW ?
{
  'Page type': string;
  'Tab': string;
  'Page'?: string;
  'Color mode': 'light' | 'dark';
} :
undefined;
/* eslint-enable @typescript-eslint/indent */
