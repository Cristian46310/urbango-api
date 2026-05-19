import { getRepositoryToken } from '@nestjs/typeorm';
import { ObjectLiteral } from 'typeorm';
import { createMockRepository } from './typeorm-mocks';

export function provideMockRepo<T extends ObjectLiteral>(entity: new () => T) {
  return {
    provide: getRepositoryToken(entity),
    useValue: createMockRepository<T>(),
  };
}
