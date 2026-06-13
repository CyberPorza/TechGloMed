import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from './prisma.service';

/**
 * PrismaService unit tests.
 * The actual $connect/$disconnect are mocked so no real DB is required.
 */
describe('PrismaService', () => {
  let service: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PrismaService],
    }).compile();

    service = module.get<PrismaService>(PrismaService);

    // Mock the PrismaClient lifecycle methods
    jest.spyOn(service, '$connect').mockResolvedValue();
    jest.spyOn(service, '$disconnect').mockResolvedValue();
    jest.spyOn(service, '$queryRaw').mockResolvedValue([{ '?column?': 1 }]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('onModuleInit — should call $connect', async () => {
    await service.onModuleInit();
    expect(service.$connect).toHaveBeenCalledTimes(1);
  });

  it('onModuleDestroy — should call $disconnect', async () => {
    await service.onModuleDestroy();
    expect(service.$disconnect).toHaveBeenCalledTimes(1);
  });

  it('isHealthy — returns true when $queryRaw succeeds', async () => {
    const result = await service.isHealthy();
    expect(result).toBe(true);
  });

  it('isHealthy — returns false when $queryRaw throws', async () => {
    jest.spyOn(service, '$queryRaw').mockRejectedValue(new Error('DB down'));
    const result = await service.isHealthy();
    expect(result).toBe(false);
  });
});
