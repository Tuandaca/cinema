import { Test, TestingModule } from '@nestjs/testing';
import { ComboService } from './combo.service';
import { PrismaService } from '../prisma/prisma.service';

describe('ComboService', () => {
  let service: ComboService;

  const mockPrismaService = {
    combo: {
      findMany: jest.fn(),
    },
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ComboService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<ComboService>(ComboService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
