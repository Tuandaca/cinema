import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { ConflictException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

describe('AuthService', () => {
  let service: AuthService;
  let prisma: PrismaService;
  let jwt: JwtService;

  const mockPrisma = {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  };

  const mockJwt = {
    signAsync: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: JwtService, useValue: mockJwt },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    prisma = module.get<PrismaService>(PrismaService);
    jwt = module.get<JwtService>(JwtService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('register', () => {
    const dto = { email: 'test@example.com', password: 'password', name: 'Test' };

    it('should throw ConflictException if user exists', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({ id: '1' });
      await expect(service.register(dto)).rejects.toThrow(ConflictException);
    });

    it('should create user if email is unique', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      mockPrisma.user.create.mockResolvedValue({ id: '1', ...dto });

      const result = await service.register(dto);
      expect(result).toEqual({
        message: 'User registered successfully',
        userId: '1',
      });
      expect(mockPrisma.user.create).toHaveBeenCalled();
    });
  });

  describe('login', () => {
    const dto = { email: 'test@example.com', password: 'password' };
    const user = {
      id: '1',
      email: 'test@example.com',
      password: 'hashedPassword',
      name: 'Test',
      role: 'USER',
    };

    it('should throw UnauthorizedException if user not found', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(null);
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should throw UnauthorizedException if password incorrect', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(false));
      await expect(service.login(dto)).rejects.toThrow(UnauthorizedException);
    });

    it('should return tokens if credentials valid', async () => {
      mockPrisma.user.findUnique.mockResolvedValue(user);
      jest.spyOn(bcrypt, 'compare').mockImplementation(() => Promise.resolve(true));
      mockJwt.signAsync.mockResolvedValue('token');

      const result = await service.login(dto);
      expect(result).toHaveProperty('access_token');
      expect(result.user.email).toBe(user.email);
    });
  });
});
