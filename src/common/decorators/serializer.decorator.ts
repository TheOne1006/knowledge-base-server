import { SetMetadata } from '@nestjs/common';
import { SERIALIZER_CLASS } from '../constants';

export const SerializerClass = (plainClass: any) =>
  SetMetadata(SERIALIZER_CLASS, plainClass);
