import { Test, TestingModule } from '@nestjs/testing';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { ForbiddenException } from '@nestjs/common';



describe('AuthController - changePassword', () => {
  let controller: AuthController;
  let authService: { changePassword: jest.Mock };

  beforeEach(async () => {
    authService = {
      changePassword: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should call service when userId matches (happy path)', async () => {
    // Arrange
    const req = { user: { userId: '1' } };
    const dto = { currentPassword: 'old', newPassword: 'new', confirmPassword: 'new' };
    authService.changePassword.mockResolvedValue({ message: 'ok' });

    // Act
    const result = await controller.changePassword('1', req, dto);

    // Assert
    expect(authService.changePassword).toHaveBeenCalledTimes(1);
    expect(authService.changePassword).toHaveBeenCalledWith('1', dto);
    expect(result).toEqual({ message: 'ok' });
  });

  it('should throw ForbiddenException when user tries to change another user password', async () => {
    // Arrange
    const req = { user: { userId: '2' } };
    const dto = {} as any;

    // Act & Assert
    await expect(controller.changePassword('1', req, dto)).rejects.toThrow(
      ForbiddenException,
    );

    expect(authService.changePassword).not.toHaveBeenCalled();
  });
});



describe('AuthController - deleteAccount', () => {
  let controller: AuthController;

  const mockAuthService = {
    deleteAccount: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get(AuthController);
  });

  it('should delete the authenticated user account', async () => {
    // Arrange
    const userId = 'user-id';

    const req = {
      user: {
        userId,
      },
    };

    const response = {
      message: 'Account deleted successfully',
    };

    mockAuthService.deleteAccount.mockResolvedValue(response);

    // Act
    const result = await controller.deleteAccount(userId, req);

    // Assert
    expect(mockAuthService.deleteAccount).toHaveBeenCalledTimes(1);
    expect(mockAuthService.deleteAccount).toHaveBeenCalledWith(userId);
    expect(result).toEqual(response);
  });

  it('should throw ForbiddenException when authenticated user does not match requested user', async () => {
    // Arrange
    const req = {
      user: {
        userId: 'authenticated-user',
      },
    };

    // Act & Assert
    await expect(
      controller.deleteAccount('another-user', req),
    ).rejects.toThrow(ForbiddenException);

    expect(mockAuthService.deleteAccount).not.toHaveBeenCalled();
  });
});