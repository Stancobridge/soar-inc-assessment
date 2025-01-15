const AuthManager = require('../../managers/auth/Auth.manager');
const bcrypt = require('bcrypt');
const { nanoid } = require('nanoid');
const md5 = require('md5');

// Mock dependencies
jest.mock('bcrypt');
jest.mock('nanoid');
jest.mock('md5');

describe('AuthManager', () => {
    let authManager;
    let mockManagers;
    let mockMongoModels;
    let mockValidators;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock managers
        mockManagers = {
            responseTransformer: {
                errorTransformer: jest.fn(),
                successTransformer: jest.fn()
            },
            token: {
                genShortToken: jest.fn()
            },
            'refresh-tokens': {
                createRefreshToken: jest.fn()
            }
        };

        // Mock MongoDB models
        mockMongoModels = {
            User: {
                findOne: jest.fn(),
                create: jest.fn()
            }
        };

        // Mock validators
        mockValidators = {
            auth: {
                login: jest.fn(),
                register: jest.fn()
            }
        };

        // Initialize AuthManager with mocks
        authManager = new AuthManager({
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators
        });
    });

    describe('login', () => {
        const mockLoginData = {
            username: 'testuser',
            password: 'password123',
            __device: 'device123'
        };

        const mockUser = {
            _id: 'user123',
            username: 'testuser',
            password: 'hashedPassword',
            email: 'test@example.com',
            first_name: 'Test',
            last_name: 'User'
        };

        it('should successfully login a user', async () => {
            // Mock dependencies
            mockValidators.auth.login.mockResolvedValue(null);
            mockMongoModels.User.findOne.mockResolvedValue(mockUser);
            bcrypt.compare.mockResolvedValue(true);
            md5.mockReturnValue('hashedDevice');
            nanoid.mockReturnValue('sessionId123');
            mockManagers.token.genShortToken.mockResolvedValue('authToken123');
            mockManagers['refresh-tokens'].createRefreshToken.mockResolvedValue('refreshToken123');

            await authManager.login(mockLoginData);

            expect(mockValidators.auth.login).toHaveBeenCalledWith({
                username: mockLoginData.username,
                password: mockLoginData.password
            });
            expect(mockMongoModels.User.findOne).toHaveBeenCalledWith({ username: mockLoginData.username });
            expect(bcrypt.compare).toHaveBeenCalledWith(mockLoginData.password, mockUser.password);
            expect(mockManagers.token.genShortToken).toHaveBeenCalled();
            expect(mockManagers['refresh-tokens'].createRefreshToken).toHaveBeenCalled();
            expect(mockManagers.responseTransformer.successTransformer).toHaveBeenCalled();
        });

        it('should return error for invalid credentials', async () => {
            mockValidators.auth.login.mockResolvedValue(null);
            mockMongoModels.User.findOne.mockResolvedValue(null);

            await authManager.login(mockLoginData);

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalled();
        });
    });

    describe('register', () => {
        const mockRegisterData = {
            username: 'newuser',
            password: 'password123',
            confirm_password: 'password123',
            email: 'new@example.com',
            first_name: 'New',
            last_name: 'User'
        };

        it('should successfully register a new user', async () => {
            // Mock dependencies
            mockValidators.auth.register.mockResolvedValue(null);
            mockMongoModels.User.findOne.mockResolvedValue(null);
            bcrypt.hash.mockResolvedValue('hashedPassword');
            mockMongoModels.User.create.mockResolvedValue({
                _id: 'newuser123',
                ...mockRegisterData,
                password: 'hashedPassword'
            });
            mockManagers.token.genShortToken.mockResolvedValue('authToken123');
            mockManagers['refresh-tokens'].createRefreshToken.mockResolvedValue('refreshToken123');

            const result = await authManager.register(mockRegisterData);

            expect(mockValidators.auth.register).toHaveBeenCalledWith(mockRegisterData);
            expect(mockMongoModels.User.findOne).toHaveBeenCalled();
            expect(bcrypt.hash).toHaveBeenCalledWith(mockRegisterData.password, 10);
            expect(mockMongoModels.User.create).toHaveBeenCalled();
            expect(mockManagers.token.genShortToken).toHaveBeenCalled();
            expect(mockManagers['refresh-tokens'].createRefreshToken).toHaveBeenCalled();
            expect(mockManagers.responseTransformer.successTransformer).toHaveBeenCalled();
        });

        it('should return error for mismatched passwords', async () => {
            const invalidData = {
                ...mockRegisterData,
                confirm_password: 'wrongpassword'
            };

            mockValidators.auth.register.mockResolvedValue(null);

            await authManager.register(invalidData);

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalled();
        });

        it('should return error for existing username/email', async () => {
            mockValidators.auth.register.mockResolvedValue(null);
            mockMongoModels.User.findOne.mockResolvedValue({ username: 'newuser' });

            await authManager.register(mockRegisterData);

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalled();
        });
    });
});
