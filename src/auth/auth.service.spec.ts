import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import { SmsService } from './services/sms.service';
import { ConfigService } from '@nestjs/config';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { BadRequestException } from '@nestjs/common';
import { NotFoundException } from '@nestjs/common';


jest.mock('bcrypt', () => ({
    hash: jest.fn(),
    compare: jest.fn(),
}));


describe('AuthService - register', () => {
    let service: AuthService;

    const mockPrisma = {
        user: {
            findUnique: jest.fn(),
            create: jest.fn(),
        },
    };

    const mockJwtService = {};

    const mockSmsService = {
        send: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,

                {
                    provide: PrismaService,
                    useValue: mockPrisma,
                },
                {
                    provide: JwtService,
                    useValue: mockJwtService,
                },
                {
                    provide: SmsService,
                    useValue: mockSmsService,
                },
                {
                    provide: ConfigService,
                    useValue: mockConfigService,
                },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    afterEach(() => {
        jest.clearAllMocks();
    });

    it('should create user successfully', async () => {
        mockPrisma.user.findUnique.mockResolvedValue(null);

        mockPrisma.user.create.mockResolvedValue({
            id: '1',
            firstName: 'John',
            lastName: 'Doe',
            phone: '123',
            dateOfBirth: new Date('2000-01-01'),
        });

        const result = await service.register({
            firstName: 'John',
            lastName: 'Doe',
            phone: '123',
            password: '123456',
            dateOfBirth: '2000-01-01',
        });

        expect(result.message).toBe('User created successfully');
        expect(mockPrisma.user.findUnique).toHaveBeenCalledWith({
            where: { phone: '123' },
        });


        expect(mockPrisma.user.create).toHaveBeenCalled();
    });


    it('should throw ConflictException if phone exists', async () => {
        mockPrisma.user.findUnique.mockResolvedValue({
            id: '1',
            phone: '123456',
        });

        await expect(
            service.register({
                firstName: 'John',
                lastName: 'Doe',
                phone: '123',
                password: '123456',
                dateOfBirth: '2000-01-01',
            }),
        ).rejects.toThrow(ConflictException);

        expect(mockPrisma.user.create).not.toHaveBeenCalled();
    });
});




describe('AuthService - login', () => {

    const mockSmsService = {
        send: jest.fn(),
    };

    let service: AuthService;

    const prismaMock = {
        user: {
            findUnique: jest.fn(),
        },
    };

    const jwtMock = {
        signAsync: jest.fn(),
    };

    const configMock = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: JwtService, useValue: jwtMock },
                { provide: ConfigService, useValue: configMock },
                { provide: SmsService, useValue: mockSmsService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    it('should throw UnauthorizedException when user is not found', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(
            service.login({ phone: 'any', password: 'any' }),
        ).rejects.toThrow(UnauthorizedException);

        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    });

    it('should throw UnauthorizedException when password is invalid', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            phone: '123',
            password: 'hashed-password',
        });


        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('fail'));
        (bcrypt.compare as jest.Mock).mockResolvedValue(false);
        // Act & Assert
        await expect(
            service.login({ phone: '123', password: 'wrong' }),
        ).rejects.toThrow(UnauthorizedException);

        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
    });

    it('should return access token on successful login', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            phone: '123',
            password: 'hashed-password',
            firstName: 'A',
            lastName: 'B',
            dateOfBirth: '2000-01-01',
        });

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashedPassword');
        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        configMock.get.mockImplementation((key: string) => {
            if (key === 'JWT_SECRET') return 'secret';
            if (key === 'JWT_EXPIRATION_TIME') return '1h';
            return null;
        });

        jwtMock.signAsync.mockResolvedValue('mock-token');

        // Act
        const result = await service.login({
            phone: '123',
            password: 'correct',
        });

        // Assert
        expect(result).toEqual({
            access_token: 'mock-token',
        });

        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect(jwtMock.signAsync).toHaveBeenCalledTimes(1);

        expect(jwtMock.signAsync).toHaveBeenCalledWith(
            expect.objectContaining({
                sub: 'user-id',
                phone: '123',
            }),
            expect.any(Object),
        );
    });
});



describe('AuthService - forgotPassword', () => {
    let service: AuthService;

    const prismaMock = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const smsMock = {
        sendOtp: jest.fn(),
    };

    const jwtMock = {
        sign: jest.fn(),
        verify: jest.fn(),
    };

    const configMock = {
        get: jest.fn(),
    };

    beforeEach(async () => {
        jest.clearAllMocks();

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: SmsService, useValue: smsMock },
                { provide: JwtService, useValue: jwtMock },
                { provide: ConfigService, useValue: configMock },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        // mock internal method
        service['generateOtp'] = jest.fn().mockReturnValue('123456');
    });

    it('should return success message and NOT send OTP when user does not exist', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue(null);

        // Act
        const result = await service.forgotPassword({ phone: 'any-phone' });

        // Assert
        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(smsMock.sendOtp).not.toHaveBeenCalled();
        expect(bcrypt.hash).not.toHaveBeenCalled();
        expect(result).toEqual({
            message: 'If the account exists, an OTP has been sent.',
        });
    });

    it('should generate OTP, hash it, update user and send SMS when user exists', async () => {
        // Arrange
        const mockUser = { id: 'user-id', phone: '123456789' };

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        prismaMock.user.update.mockResolvedValue({});

        (bcrypt.hash as jest.Mock).mockResolvedValue('hashed-otp');

        // Act
        const result = await service.forgotPassword({ phone: mockUser.phone });

        // Assert - flow verification only
        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);

        expect(service['generateOtp']).toHaveBeenCalledTimes(1);

        expect(bcrypt.hash).toHaveBeenCalledTimes(1);

        expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
        expect(prismaMock.user.update).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { id: mockUser.id },
                data: expect.objectContaining({
                    otpCode: 'hashed-otp',
                }),
            }),
        );

        expect(smsMock.sendOtp).toHaveBeenCalledTimes(1);

        expect(result).toEqual({
            message: 'If the account exists, an OTP has been sent.',
        });
    });

    it('should not send SMS if hashing fails (throws error)', async () => {
        // Arrange
        const mockUser = { id: 'user-id', phone: '123456789' };

        prismaMock.user.findUnique.mockResolvedValue(mockUser);
        (bcrypt.hash as jest.Mock).mockRejectedValue(new Error('hash failed'));

        // Act & Assert
        await expect(
            service.forgotPassword({ phone: mockUser.phone }),
        ).rejects.toThrow('hash failed');

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(smsMock.sendOtp).not.toHaveBeenCalled();
    });
});






describe('AuthService - verifyOtp', () => {

    let service: AuthService;

    const prismaMock = {
        user: {
            findUnique: jest.fn(),
            update: jest.fn(),
        },
    };

    const jwtMock = {
        signAsync: jest.fn(),
    };

    const configMock = {
        get: jest.fn(),
    };

    const mockSmsService = {
        send: jest.fn(),
    };

    beforeEach(async () => {
        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: PrismaService, useValue: prismaMock },
                { provide: JwtService, useValue: jwtMock },
                { provide: ConfigService, useValue: configMock },
                { provide: SmsService, useValue: mockSmsService },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);

        jest.clearAllMocks();
    });

    
    it('should return resetToken and clear OTP data when OTP is valid', async () => {
        // Arrange
        const dto = { phone: 'any-phone', otp: '123456' };

        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            otpCode: 'hashed-otp',
            otpExpiresAt: new Date(Date.now() + 10000),
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(true);

        configMock.get.mockReturnValue('secret-key');

        jwtMock.signAsync.mockResolvedValue('reset-token');

        prismaMock.user.update.mockResolvedValue({});

        // Act
        const result = await service.verifyOtp(dto as any);

        // Assert
        expect(result).toEqual({
            resetToken: 'reset-token',
        });

        expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
        expect(bcrypt.compare).toHaveBeenCalledTimes(1);
        expect(jwtMock.signAsync).toHaveBeenCalledTimes(1);
        expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    });

   

    it('should throw BadRequestException when user is not found', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue(null);

        // Act & Assert
        await expect(service.verifyOtp({} as any)).rejects.toThrow(
            BadRequestException,
        );

        expect(prismaMock.user.update).not.toHaveBeenCalled();
        expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when OTP data is missing', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            otpCode: null,
            otpExpiresAt: null,
        });

        // Act & Assert
        await expect(
            service.verifyOtp({} as any),
        ).rejects.toThrow(BadRequestException);

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when OTP is expired', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            otpCode: 'hashed-otp',
            otpExpiresAt: new Date(Date.now() - 10000),
        });

        // Act & Assert
        await expect(
            service.verifyOtp({} as any),
        ).rejects.toThrow('OTP expired');

        expect(bcrypt.compare).not.toHaveBeenCalled();
        expect(jwtMock.signAsync).not.toHaveBeenCalled();
    });

    it('should throw BadRequestException when OTP is invalid', async () => {
        // Arrange
        prismaMock.user.findUnique.mockResolvedValue({
            id: 'user-id',
            otpCode: 'hashed-otp',
            otpExpiresAt: new Date(Date.now() + 10000),
        });

        (bcrypt.compare as jest.Mock).mockResolvedValue(false);

        // Act & Assert
        await expect(
            service.verifyOtp({} as any),
        ).rejects.toThrow('Invalid OTP');

        expect(jwtMock.signAsync).not.toHaveBeenCalled();
        expect(prismaMock.user.update).not.toHaveBeenCalled();
    });
});




describe('AuthService - resetPassword', () => {
  let service: AuthService;

  const prismaMock = {
    user: {
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  };
  
   const mockJwtService = {};

    const mockSmsService = {
        send: jest.fn(),
    };

    const mockConfigService = {
        get: jest.fn(),
    };


  const bcryptMock = bcrypt as jest.Mocked<typeof bcrypt>;

  const validDto = {
    newPassword: 'new-pass',
    confirmPassword: 'new-pass',
  };

  const jwtPayload = {
    sub: 'user-id',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        {
          provide: PrismaService,
          useValue: prismaMock,
        },
        {
          provide: JwtService,
          useValue: mockJwtService,
        },
        {
          provide: SmsService,
          useValue: mockSmsService,
        },
        {
          provide: ConfigService,
          useValue: mockConfigService,
        },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
  });


  it('should reset password successfully', async () => {
    // Arrange
    prismaMock.user.findUnique.mockResolvedValue({ id: 'any-user' });
    bcryptMock.hash.mockResolvedValue('hashed-password' as never);

    prismaMock.user.update.mockResolvedValue({} as any);

    // Act
    const result = await service.resetPassword(validDto, jwtPayload as any);

    // Assert
    expect(prismaMock.user.findUnique).toHaveBeenCalledTimes(1);
    expect(prismaMock.user.update).toHaveBeenCalledTimes(1);
    expect(bcryptMock.hash).toHaveBeenCalledTimes(1);
    expect(result).toEqual({
      message: 'Password updated successfully',
    });
  });


  it('should throw NotFoundException if user does not exist', async () => {
    // Arrange
    prismaMock.user.findUnique.mockResolvedValue(null);

    // Act + Assert
    await expect(
      service.resetPassword(validDto, jwtPayload as any),
    ).rejects.toThrow(NotFoundException);

    expect(prismaMock.user.update).toHaveBeenCalledTimes(0);
    expect(bcryptMock.hash).toHaveBeenCalledTimes(0);
  });

  
  it('should throw BadRequestException when passwords do not match', async () => {
    // Arrange
    const invalidDto = {
      newPassword: 'pass1',
      confirmPassword: 'pass2',
    };

    prismaMock.user.findUnique.mockResolvedValue({ id: 'any-user' });

    // Act + Assert
    await expect(
      service.resetPassword(invalidDto, jwtPayload as any),
    ).rejects.toThrow(BadRequestException);

    expect(prismaMock.user.update).toHaveBeenCalledTimes(0);
    expect(bcryptMock.hash).toHaveBeenCalledTimes(0);
  });
});