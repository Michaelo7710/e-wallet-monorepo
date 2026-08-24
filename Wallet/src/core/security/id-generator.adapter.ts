import * as Crypto from 'expo-crypto';
import { IIdGenerator } from '@domain/adapters/id-generator.interface';

export class ExpoIdGenerator implements IIdGenerator {
  generate(): string {
    return Crypto.randomUUID();
  }
}