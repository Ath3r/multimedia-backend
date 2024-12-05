import { SetMetadata } from '@nestjs/common';

export const RESPONSE_MESSAGE = 'response_message';
export type MessageGenerator = (data: any) => string;
export const CustomMessage = (messageOrGenerator: string | MessageGenerator) =>
  SetMetadata(RESPONSE_MESSAGE, messageOrGenerator);
