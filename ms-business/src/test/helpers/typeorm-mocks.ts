import { ObjectLiteral, Repository, SelectQueryBuilder } from 'typeorm';

export function createMockQueryBuilder<
  T extends ObjectLiteral = ObjectLiteral,
>(): jest.Mocked<SelectQueryBuilder<T>> {
  const qb = {
    select: jest.fn().mockReturnThis(),
    addSelect: jest.fn().mockReturnThis(),
    where: jest.fn().mockReturnThis(),
    andWhere: jest.fn().mockReturnThis(),
    orWhere: jest.fn().mockReturnThis(),
    leftJoin: jest.fn().mockReturnThis(),
    innerJoin: jest.fn().mockReturnThis(),
    groupBy: jest.fn().mockReturnThis(),
    addGroupBy: jest.fn().mockReturnThis(),
    having: jest.fn().mockReturnThis(),
    orderBy: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    offset: jest.fn().mockReturnThis(),
    setParameters: jest.fn().mockReturnThis(),
    getMany: jest.fn().mockResolvedValue([]),
    getOne: jest.fn().mockResolvedValue(null),
    getRawMany: jest.fn().mockResolvedValue([]),
    getRawOne: jest.fn().mockResolvedValue(null),
    getCount: jest.fn().mockResolvedValue(0),
  } as unknown as jest.Mocked<SelectQueryBuilder<T>>;

  return qb;
}

export function createMockRepository<
  T extends ObjectLiteral = ObjectLiteral,
>(): jest.Mocked<Repository<T>> {
  const queryBuilder = createMockQueryBuilder<T>();

  return {
    find: jest.fn().mockResolvedValue([]),
    findOne: jest.fn().mockResolvedValue(null),
    findOneBy: jest.fn().mockResolvedValue(null),
    findAndCount: jest.fn().mockResolvedValue([[], 0]),
    save: jest.fn().mockImplementation((entity: T) => Promise.resolve(entity)),
    create: jest.fn().mockImplementation((dto: Partial<T>) => dto as T),
    remove: jest.fn().mockResolvedValue(undefined),
    delete: jest.fn().mockResolvedValue({ affected: 1, raw: [] }),
    count: jest.fn().mockResolvedValue(0),
    createQueryBuilder: jest.fn().mockReturnValue(queryBuilder),
  } as unknown as jest.Mocked<Repository<T>>;
}
