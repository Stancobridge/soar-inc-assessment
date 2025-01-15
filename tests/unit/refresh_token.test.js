const bcrypt = require('bcrypt');
const md5 = require('md5');
const { nanoid } = require('nanoid');

jest.mock('bcrypt');
jest.mock('md5');
jest.mock('nanoid');

describe('RefreshTokenManager', () => {
    let refreshTokenManager;
    let mockConfig;
    let mockCache;
    let mockManagers;
    let mockMongoModels;
    let mockValidators;

    beforeEach(() => {
        // Reset all mocks
        jest.clearAllMocks();

        // Mock dependencies
        mockConfig = {};
        mockCache = {};
        mockManagers = {
            token: {
                genLongToken: jest.fn(),
                genShortToken: jest.fn(),
                verifyLongToken: jest.fn(),
            },
            responseTransformer: {
                errorTransformer: jest.fn(),
                successTransformer: jest.fn(),
            },
        };
        mockMongoModels = {
            RefreshToken: {
                findOne: jest.fn(),
                create: jest.fn(),
            },
        };
        mockValidators = {
            refresh_token: {
                refreshAuthenticationToken: jest.fn(),
            },
        };

        // Mock bcrypt functions
        bcrypt.genSalt.mockResolvedValue('mockedSalt');
        bcrypt.hash.mockResolvedValue('hashedToken');
        bcrypt.compare.mockResolvedValue(true);

        // Mock md5 and nanoid
        md5.mockReturnValue('mockedMd5Hash');
        nanoid.mockReturnValue('mockedNanoId');

        const RefreshTokenManager = require('../../managers/entities/refresh_token/RefreshToken.manager');
        refreshTokenManager = new RefreshTokenManager({
            config: mockConfig,
            cache: mockCache,
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators,
        });
    });

    describe('createRefreshToken', () => {
        it('should create a new refresh token when user does not have one', async () => {
            const userId = 'testUserId';
            const username = 'testUsername';
            const mockRefreshToken = 'mockRefreshToken';

            mockManagers.token.genLongToken.mockReturnValue(mockRefreshToken);
            mockMongoModels.RefreshToken.findOne.mockResolvedValue(null);
            mockMongoModels.RefreshToken.create.mockResolvedValue({});

            const result = await refreshTokenManager.createRefreshToken({ userId, username });

            expect(result).toBe(mockRefreshToken);
            expect(mockManagers.token.genLongToken).toHaveBeenCalledWith({
                userId,
                userKey: username,
            });
            expect(mockMongoModels.RefreshToken.create).toHaveBeenCalledWith({
                userId,
                validation_key: 'hashedToken',
                is_used: false,
            });
        });

        it('should update existing refresh token when user already has one', async () => {
            const userId = 'testUserId';
            const username = 'testUsername';
            const mockRefreshToken = 'mockRefreshToken';
            const mockExistingToken = {
                save: jest.fn(),
            };

            mockManagers.token.genLongToken.mockReturnValue(mockRefreshToken);
            mockMongoModels.RefreshToken.findOne.mockResolvedValue(mockExistingToken);

            const result = await refreshTokenManager.createRefreshToken({ userId, username });

            expect(result).toBe(mockRefreshToken);
            expect(mockExistingToken.validation_key).toBe('hashedToken');
            expect(mockExistingToken.is_used).toBe(false);
            expect(mockExistingToken.save).toHaveBeenCalled();
        });
    });

    describe('refreshAuthenticationToken', () => {
        it('should refresh authentication token successfully', async () => {
            const refreshToken = 'validRefreshToken';
            const device = 'testDevice';
            const authentication = { _id: 'userId' };
            const mockUserRefreshToken = {
                is_used: false,
                validation_key: 'hashedToken',
                save: jest.fn(),
            };
            const decodedToken = {
                userId: 'userId',
                userKey: 'username',
            };

            mockValidators.refresh_token.refreshAuthenticationToken.mockResolvedValue(null);
            mockMongoModels.RefreshToken.findOne.mockResolvedValue(mockUserRefreshToken);
            mockManagers.token.verifyLongToken.mockReturnValue(decodedToken);
            mockManagers.token.genShortToken.mockResolvedValue('newAuthToken');

            await refreshTokenManager.refreshAuthenticationToken({
                refreshToken,
                __device: device,
                __authentication: authentication,
            });

            expect(mockManagers.responseTransformer.successTransformer).toHaveBeenCalled();
            expect(mockUserRefreshToken.is_used).toBe(false);
            expect(mockUserRefreshToken.save).toHaveBeenCalled();
        });

        it('should return error when validation fails', async () => {
            const validationError = ['Validation error'];
            mockValidators.refresh_token.refreshAuthenticationToken.mockResolvedValue(validationError);

            await refreshTokenManager.refreshAuthenticationToken({
                refreshToken: 'invalid',
                __device: 'device',
                __authentication: { _id: 'userId' },
            });

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalledWith({
                message: 'Refresh token is required',
                error: validationError,
                code: 422,
            });
        });

        it('should return error when refresh token is not found', async () => {
            mockValidators.refresh_token.refreshAuthenticationToken.mockResolvedValue(null);
            mockMongoModels.RefreshToken.findOne.mockResolvedValue(null);

            await refreshTokenManager.refreshAuthenticationToken({
                refreshToken: 'invalid',
                __device: 'device',
                __authentication: { _id: 'userId' },
            });

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalledWith({
                message: 'Invalid refresh token',
                error: [],
                code: 403,
            });
        });

        it('should return error when refresh token is already used', async () => {
            const mockUserRefreshToken = {
                is_used: true,
            };
            mockValidators.refresh_token.refreshAuthenticationToken.mockResolvedValue(null);
            mockMongoModels.RefreshToken.findOne.mockResolvedValue(mockUserRefreshToken);

            await refreshTokenManager.refreshAuthenticationToken({
                refreshToken: 'used',
                __device: 'device',
                __authentication: { _id: 'userId' },
            });

            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalledWith({
                message: 'Refresh token already used',
                error: [],
                code: 400,
            });
        });
    });
});
