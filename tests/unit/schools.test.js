const SchoolManager = require('../../managers/entities/school/School.manager');
const HTTP_STATUS = require('../../managers/api/_common/HttpStatus');

describe('SchoolManager', () => {
    let schoolManager;
    let mockMongoModels;
    let mockManagers;
    let mockValidators;

    beforeEach(() => {
        // Mock mongoose models
        mockMongoModels = {
            School: {
                findOne: jest.fn(),
                create: jest.fn(),
                paginate: jest.fn(),
                deleteOne: jest.fn(),
            },
        };

        // Mock managers
        mockManagers = {
            responseTransformer: {
                successTransformer: jest.fn(response => response),
                errorTransformer: jest.fn(response => ({ errors: true, ...response })),
            },
        };

        // Mock validators
        mockValidators = {
            school: {
                createSchool: jest.fn(),
                updateSchool: jest.fn(),
            },
        };

        schoolManager = new SchoolManager({
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators,
        });
    });

    describe('createSchool', () => {
        const mockSchoolData = {
            name: 'Test School',
            address: '123 Test St',
            website: 'test.com',
            description: 'Test Description',
            phone: '1234567890',
            email: 'test@school.com',
            __authentication: { _id: 'user123' },
        };

        it('should create a school successfully', async () => {
            mockValidators.school.createSchool.mockResolvedValue(null);
            mockMongoModels.School.findOne.mockResolvedValue(null);
            mockMongoModels.School.create.mockResolvedValue({ ...mockSchoolData, _id: 'school123' });

            const result = await schoolManager.createSchool(mockSchoolData);

            expect(result.code).toBe(HTTP_STATUS.CREATED);
            expect(result.message).toBe('School created successfully');
            expect(result.data.school).toBeDefined();
        });

        it('should return error if school email already exists', async () => {
            mockValidators.school.createSchool.mockResolvedValue(null);
            mockMongoModels.School.findOne.mockResolvedValue({ email: mockSchoolData.email });

            const result = await schoolManager.createSchool(mockSchoolData);

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.CONFLICT);
            expect(result.message).toBe('School with this email already exists');
        });

        it('should return error if validation fails', async () => {
            mockValidators.school.createSchool.mockResolvedValue(['validation error']);

            const result = await schoolManager.createSchool(mockSchoolData);

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
            expect(result.message).toBe('Invalid school data');
        });
    });

    describe('updateSchool', () => {
        const mockUpdateData = {
            name: 'Updated School',
            email: 'updated@school.com',
            __params: { schoolId: 'school123' },
            __authentication: { _id: 'user123' },
        };

        const mockExistingSchool = {
            _id: 'school123',
            name: 'Old School',
            email: 'old@school.com',
            save: jest.fn(),
        };

        it('should update a school successfully', async () => {
            mockValidators.school.updateSchool.mockResolvedValue(null);
            mockMongoModels.School.findOne
                .mockResolvedValueOnce(mockExistingSchool) // for getSchoolById
                .mockResolvedValueOnce(null); // for email check

            const result = await schoolManager.updateSchool(mockUpdateData);
            console.log('result', result);
            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('School updated successfully');
            expect(mockExistingSchool.save).toHaveBeenCalled();
        });
    });

    describe('getAllSchools', () => {
        it('should fetch schools with pagination', async () => {
            const mockPaginatedResult = {
                docs: [{ name: 'School 1' }, { name: 'School 2' }],
                totalPages: 1,
                page: 1,
                totalDocs: 2,
                hasNextPage: false,
                hasPrevPage: false,
            };

            mockMongoModels.School.paginate.mockResolvedValue(mockPaginatedResult);

            const result = await schoolManager.getAllSchools({ __query: { page: 1, limit: 10 } });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.data.schools).toHaveLength(2);
            expect(result.data.totalPages).toBe(1);
        });
    });

    describe('deleteSchool', () => {
        const mockSchool = {
            _id: 'school123',
            deleteOne: jest.fn(),
        };

        it('should delete a school successfully', async () => {
            mockMongoModels.School.findOne.mockResolvedValue(mockSchool);

            const result = await schoolManager.deleteSchool({
                __params: { schoolId: 'school123' },
                __authentication: { _id: 'user123' },
            });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('School deleted successfully');
            expect(mockSchool.deleteOne).toHaveBeenCalled();
        });

        it('should return error if school not found', async () => {
            mockMongoModels.School.findOne.mockResolvedValue(null);

            const result = await schoolManager.deleteSchool({
                __params: { schoolId: 'nonexistent' },
                __authentication: { _id: 'user123' },
            });

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('School not found');
        });
    });

    describe('getOneSchool', () => {
        it('should fetch a single school successfully', async () => {
            const mockSchool = {
                _id: 'school123',
                name: 'Test School',
            };

            mockMongoModels.School.findOne.mockResolvedValue(mockSchool);

            const result = await schoolManager.getOneSchool({
                __params: { schoolId: 'school123' },
                __authentication: { _id: 'user123' },
            });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('School fetched successfully');
            expect(result.data.school).toEqual(mockSchool);
        });

        it('should return error if school not found', async () => {
            mockMongoModels.School.findOne.mockResolvedValue(null);

            const result = await schoolManager.getOneSchool({
                __params: { schoolId: 'nonexistent' },
                __authentication: { _id: 'user123' },
            });

            expect(result.errors).toBeTruthy();
            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('School not found');
        });
    });
});
