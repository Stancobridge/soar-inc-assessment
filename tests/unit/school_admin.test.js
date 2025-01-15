const SchoolAdminManager = require('../../managers/entities/shool_admin/SchoolAdmin.manager');
const HTTP_STATUS = require('../../managers/api/_common/HttpStatus');

describe('SchoolAdminManager', () => {
    let schoolAdminManager;
    let mockMongoModels;
    let mockManagers;
    let mockValidators;
    let mockCache;

    beforeEach(() => {
        // Mock mongoose models
        mockMongoModels = {
            SchoolAdmin: {
                create: jest.fn(),
                findOne: jest.fn(),
                deleteOne: jest.fn(),
                paginate: jest.fn(),
            },
            User: {
                findOne: jest.fn(),
            },
            Role: {
                findOne: jest.fn(),
            },
        };

        // Mock managers
        mockManagers = {
            responseTransformer: {
                successTransformer: jest.fn(response => response),
                errorTransformer: jest.fn(response => ({ ...response, errors: true })),
            },
            schools: {
                getSchoolById: jest.fn(),
            },
        };

        // Mock validators
        mockValidators = {
            school_admin: {
                createSchoolAdmin: jest.fn(),
            },
        };

        // Enhanced cache mock with Redis-like functionality
        mockCache = {
            key: {
                delete: jest.fn().mockResolvedValue(true),
                get: jest.fn().mockResolvedValue(null),
                set: jest.fn().mockResolvedValue('OK'),
            },
        };

        schoolAdminManager = new SchoolAdminManager({
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators,
            cache: mockCache,
        });
    });

    // Add new test for revalidateUserRoles
    describe('revalidateUserRoles', () => {
        const mockUserId = 'user123';

        it('should clear all user-related cache entries', async () => {
            await schoolAdminManager.revalidateUserRoles(mockUserId);

            // Verify that all relevant cache keys were deleted
            expect(mockCache.key.delete).toHaveBeenCalledTimes(3);
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:rolesId` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:roles` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}` });
        });
    });

    describe('createSchoolAdmin', () => {
        const mockSchoolId = 'school123';
        const mockUserId = 'user123';
        const mockRoleId = 'role123';

        it('should successfully create a school admin and clear cache', async () => {
            // Mock validation success
            mockValidators.school_admin.createSchoolAdmin.mockResolvedValue(null);

            // Mock school exists
            mockManagers.schools.getSchoolById.mockResolvedValue({ _id: mockSchoolId });

            // Mock user exists
            mockMongoModels.User.findOne.mockResolvedValue({
                _id: mockUserId,
                roles: [],
                save: jest.fn(),
            });

            // Mock user is not already school admin
            mockMongoModels.SchoolAdmin.findOne.mockResolvedValue(null);

            // Mock role exists
            mockMongoModels.Role.findOne.mockResolvedValue({ _id: mockRoleId });

            // Mock school admin creation
            const mockSchoolAdmin = { _id: 'schoolAdmin123', schoolId: mockSchoolId, userId: mockUserId };
            mockMongoModels.SchoolAdmin.create.mockResolvedValue(mockSchoolAdmin);

            const result = await schoolAdminManager.createSchoolAdmin({
                schoolId: mockSchoolId,
                userId: mockUserId,
            });

            // Verify cache invalidation
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:rolesId` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:roles` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}` });

            expect(result.code).toBe(HTTP_STATUS.CREATED);
            expect(result.data).toEqual(mockSchoolAdmin);
            expect(result.message).toBe('School admin created successfully');
        });

        it('should return error if user is already a school admin', async () => {
            mockValidators.school_admin.createSchoolAdmin.mockResolvedValue(null);
            mockManagers.schools.getSchoolById.mockResolvedValue({ _id: mockSchoolId });
            mockMongoModels.User.findOne.mockResolvedValue({ _id: mockUserId });
            mockMongoModels.SchoolAdmin.findOne.mockResolvedValue({ _id: 'existing' });

            const result = await schoolAdminManager.createSchoolAdmin({
                schoolId: mockSchoolId,
                userId: mockUserId,
            });

            expect(result.code).toBe(HTTP_STATUS.BAD_REQUEST);
            expect(result.message).toBe('User is already a school admin');
        });
    });

    describe('findOneSchoolAdmin', () => {
        const mockSchoolAdminId = 'schoolAdmin123';
        const mockUserId = 'user123';

        it('should successfully find and transform school admin data', async () => {
            const mockSchoolAdminData = {
                _id: mockSchoolAdminId,
                userId: {
                    _id: mockUserId,
                    name: 'Test User',
                    email: 'test@example.com',
                    password: 'hashedpassword',
                },
                schoolId: 'school123',
            };

            // Mock the populate chain
            mockMongoModels.SchoolAdmin.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue({
                    ...mockSchoolAdminData,
                    toObject: () => mockSchoolAdminData
                })
            });

            const result = await schoolAdminManager.findOneSchoolAdmin({ _id: mockSchoolAdminId });

            // Verify the transformed data
            expect(result).toEqual({
                _id: mockSchoolAdminId,
                schoolId: 'school123',
                user: {
                    _id: mockUserId,
                    name: 'Test User',
                    email: 'test@example.com'
                }
            });

            // Verify proper method calls
            expect(mockMongoModels.SchoolAdmin.findOne).toHaveBeenCalledWith({ _id: mockSchoolAdminId });
        });

        it('should return error when school admin not found', async () => {
            // Mock the populate chain returning null
            mockMongoModels.SchoolAdmin.findOne.mockReturnValue({
                populate: jest.fn().mockResolvedValue(null)
            });

            const result = await schoolAdminManager.findOneSchoolAdmin({ _id: mockSchoolAdminId });

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('School admin not found');
        });

        it('should handle internal server error', async () => {
            // Mock an error being thrown
            mockMongoModels.SchoolAdmin.findOne.mockImplementation(() => {
                throw new Error('Database error');
            });

            const result = await schoolAdminManager.findOneSchoolAdmin({ _id: mockSchoolAdminId });

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.INTERNAL_SERVER_ERROR);
            expect(result.message).toBe('Internal server error');
        });
    });

    describe('deleteSchoolAdmin', () => {
        const mockSchoolAdminId = 'schoolAdmin123';
        const mockUserId = 'user123';
        const mockRoleId = 'role123';

        it('should successfully delete a school admin and clear cache', async () => {
            // Mock findOneSchoolAdmin result
            const mockSchoolAdmin = {
                _id: mockSchoolAdminId,
                user: {
                    _id: mockUserId,
                    name: 'Test User'
                }
            };

            // Create a spy on findOneSchoolAdmin
            jest.spyOn(schoolAdminManager, 'findOneSchoolAdmin')
                .mockResolvedValue(mockSchoolAdmin);

            // Mock finding role
            mockMongoModels.Role.findOne.mockResolvedValue({ _id: mockRoleId });

            // Mock finding user
            mockMongoModels.User.findOne.mockResolvedValue({
                _id: mockUserId,
                roles: [mockRoleId],
                save: jest.fn(),
            });

            const result = await schoolAdminManager.deleteSchoolAdmin({
                __params: { schoolAdminId: mockSchoolAdminId },
            });

            // Verify findOneSchoolAdmin was called with correct params
            expect(schoolAdminManager.findOneSchoolAdmin)
                .toHaveBeenCalledWith({ _id: mockSchoolAdminId });

            // Verify cache invalidation
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:rolesId` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}:roles` });
            expect(mockCache.key.delete).toHaveBeenCalledWith({ key: `user:${mockUserId}` });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('School admin deleted successfully');
            expect(mockMongoModels.SchoolAdmin.deleteOne)
                .toHaveBeenCalledWith({ _id: mockSchoolAdminId });
        });

        it('should handle school admin not found', async () => {
            // Mock findOneSchoolAdmin returning not found error
            jest.spyOn(schoolAdminManager, 'findOneSchoolAdmin')
                .mockResolvedValue({
                    errors: true,
                    code: HTTP_STATUS.NOT_FOUND,
                    message: 'School admin not found'
                });

            const result = await schoolAdminManager.deleteSchoolAdmin({
                __params: { schoolAdminId: mockSchoolAdminId },
            });

            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('School admin not found');
            expect(mockCache.key.delete).not.toHaveBeenCalled();
            expect(mockMongoModels.SchoolAdmin.deleteOne).not.toHaveBeenCalled();
        });
    });

    describe('getSchoolAdmins', () => {
        it('should successfully fetch school admins with pagination', async () => {

            const mockSchoolAdmins = [
                {
                    _id: 'schoolAdmin1',
                    schoolId: 'school123',
                    userId: {
                        _id: 'user1',
                        name: 'Test User 1',
                        email: 'user1@test.com',
                    },
                },
                {
                    _id: 'schoolAdmin2',
                    schoolId: 'school123',
                    userId: {
                        _id: 'user2',
                        name: 'Test User 2',
                        email: 'user2@test.com',
                    },
                },
            ];

            const mockPaginatedResult = {
                docs: mockSchoolAdmins,
                totalDocs: 2,
                limit: 10,
                totalPages: 1,
                page: 1,
                pagingCounter: 1,
                hasPrevPage: false,
                hasNextPage: false,
                prevPage: null,
                nextPage: null,
            };

            mockMongoModels.SchoolAdmin.paginate.mockResolvedValue(
                mockPaginatedResult
            );


            const result = await schoolAdminManager.getSchoolAdmins({
                __query: { page: 1, limit: 10 },
                __params: { schoolId: 'school123' },
            });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.data).toEqual(mockPaginatedResult);
            expect(result.message).toBe('School admins fetched successfully');
        });
    });

    // describe('getSingleSchoolAdmin', () => {
    //     const mockSchoolAdminId = 'schoolAdmin123';

    //     it('should successfully fetch a single school admin', async () => {
    //         const mockSchoolAdmin = {
    //             _id: mockSchoolAdminId,
    //             userId: { _id: 'user123', name: 'Test User' },
    //             toObject: () => ({
    //                 _id: mockSchoolAdminId,
    //                 userId: { _id: 'user123', name: 'Test User' },
    //             }),
    //         };

    //         mockMongoModels.SchoolAdmin.findOne.mockReturnValue({
    //             populate: jest.fn().mockResolvedValue(mockSchoolAdmin),
    //         });

    //         const result = await schoolAdminManager.getSingleSchoolAdmin({
    //             __params: { schoolAdminId: mockSchoolAdminId },
    //         });

    //         expect(result.code).toBe(HTTP_STATUS.OK);
    //         expect(result.message).toBe('School admin fetched successfully');
    //     });
    // });

    // describe('checkIfUserIsSchoolAdmin', () => {
    //     const mockUserId = 'user123';
    //     const mockSchoolId = 'school123';

    //     it('should return success when user is school admin', async () => {
    //         const mockSchoolAdmin = {
    //             _id: 'schoolAdmin123',
    //             userId: mockUserId,
    //             schoolId: mockSchoolId,
    //         };

    //         mockMongoModels.SchoolAdmin.findOne.mockResolvedValue({
    //             toObject: () => mockSchoolAdmin,
    //         });

    //         const result = await schoolAdminManager.checkIfUserIsSchoolAdmin(mockUserId, mockSchoolId);

    //         expect(result).toEqual(mockSchoolAdmin);
    //     });

    //     it('should return unauthorized when user is not school admin', async () => {
    //         mockMongoModels.SchoolAdmin.findOne.mockResolvedValue(null);

    //         const result = await schoolAdminManager.checkIfUserIsSchoolAdmin(mockUserId, mockSchoolId);

    //         expect(result.code).toBe(HTTP_STATUS.UNAUTHORIZED);
    //         expect(result.message).toBe('You are not authorized to manage class rooms for this school');
    //     });
    // });
});
