const ClassRoomManager = require('../../managers/entities/class_room/ClassRoom.manager');
const HTTP_STATUS = require('../../managers/api/_common/HttpStatus');

describe('ClassRoomManager', () => {
    let classRoomManager;
    let mockMongoModels;
    let mockManagers;
    let mockValidators;

    beforeEach(() => {
        // Mock MongoDB models
        mockMongoModels = {
            ClassRoom: {
                create: jest.fn(),
                findOne: jest.fn(),
                paginate: jest.fn(),
            }
        };

        // Mock managers
        mockManagers = {
            responseTransformer: {
                successTransformer: jest.fn(response => response),
                errorTransformer: jest.fn(response => response)
            },
            'school-admins': {
                checkIfUserIsSchoolAdmin: jest.fn()
            },
            schools: {
                getSchoolById: jest.fn()
            }
        };

        // Mock validators
        mockValidators = {
            class_room: {
                createClassRoom: jest.fn(),
                updateClassRoom: jest.fn()
            }
        };

        classRoomManager = new ClassRoomManager({
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators
        });
    });

    describe('createClassRoom', () => {
        const mockRequest = {
            name: 'Class A',
            schoolId: 'school123',
            capacity: 30,
            __authentication: { _id: 'user123' },
            __schoolAdministrator: {}
        };

        it('should create a class room successfully', async () => {
            // Mock successful validations
            mockValidators.class_room.createClassRoom.mockResolvedValue(null);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ success: true });
            mockManagers.schools.getSchoolById.mockResolvedValue({ success: true });
            mockMongoModels.ClassRoom.findOne.mockResolvedValue(null);

            const mockCreatedClassRoom = {
                name: mockRequest.name,
                schoolId: mockRequest.schoolId,
                capacity: mockRequest.capacity,
                _id: 'classroom123'
            };
            mockMongoModels.ClassRoom.create.mockResolvedValue(mockCreatedClassRoom);

            const result = await classRoomManager.createClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.CREATED);
            expect(result.data).toEqual(mockCreatedClassRoom);
            expect(mockMongoModels.ClassRoom.create).toHaveBeenCalledWith({
                name: mockRequest.name,
                schoolId: mockRequest.schoolId,
                capacity: mockRequest.capacity,
                createdByUserId: mockRequest.__authentication._id
            });
        });

        it('should return error if validation fails', async () => {
            const validationError = ['Invalid name'];
            mockValidators.class_room.createClassRoom.mockResolvedValue(validationError);

            const result = await classRoomManager.createClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.UNPROCESSABLE_ENTITY);
            expect(result.error).toEqual(validationError);
        });

        it('should return error if class room name already exists', async () => {
            mockValidators.class_room.createClassRoom.mockResolvedValue(null);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ success: true });
            mockManagers.schools.getSchoolById.mockResolvedValue({ success: true });
            mockMongoModels.ClassRoom.findOne.mockResolvedValue({ name: mockRequest.name });

            const result = await classRoomManager.createClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.CONFLICT);
            expect(result.message).toContain('already exists');
        });
    });

    describe('updateClassRoom', () => {
        const mockRequest = {
            name: 'Updated Class A',
            capacity: 35,
            schoolId: 'school123',
            __params: { classRoomId: 'classroom123' },
            __authentication: { _id: 'user123' },
            __schoolAdministrator: {}
        };

        it('should update a class room successfully', async () => {
            const mockExistingClassRoom = {
                _id: mockRequest.__params.classRoomId,
                name: 'Class A',
                schoolId: mockRequest.schoolId,
                capacity: 30,
                save: jest.fn()
            };

            mockValidators.class_room.updateClassRoom.mockResolvedValue(null);
            mockMongoModels.ClassRoom.findOne
                .mockResolvedValueOnce(mockExistingClassRoom)  // First call for finding existing classroom
                .mockResolvedValueOnce(null);  // Second call for checking duplicate name
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ success: true });

            const result = await classRoomManager.updateClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(mockExistingClassRoom.save).toHaveBeenCalled();
            expect(result.data.name).toBe(mockRequest.name);
            expect(result.data.capacity).toBe(mockRequest.capacity);
        });
    });

    describe('getAllClassRooms', () => {
        it('should fetch all class rooms with pagination', async () => {
            const mockClassRooms = {
                docs: [{ name: 'Class A' }, { name: 'Class B' }],
                total: 2,
                limit: 10,
                page: 1
            };

            mockMongoModels.ClassRoom.paginate.mockResolvedValue(mockClassRooms);

            const result = await classRoomManager.getAllClassRooms({
                __query: { page: 1, limit: 10 },
                __authentication: { _id: 'user123' }
            });

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.data).toEqual(mockClassRooms);
        });
    });

    describe('deleteClassRoom', () => {
        const mockRequest = {
            __params: { classRoomId: 'classroom123' },
            __authentication: { _id: 'user123' },
            __schoolAdministrator: {}
        };

        it('should delete a class room successfully', async () => {
            const mockClassRoom = {
                _id: mockRequest.__params.classRoomId,
                schoolId: 'school123',
                deleteOne: jest.fn()
            };

            mockMongoModels.ClassRoom.findOne.mockResolvedValue(mockClassRoom);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ _id: 'schoolADmin123' });

            const result = await classRoomManager.deleteClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(mockClassRoom.deleteOne).toHaveBeenCalled();
        });

        it('should return error if class room not found', async () => {
            // Mock the error response that would come from findOneClassRoom
            const notFoundError = {
                message: 'Class room not found',
                error: [],
                code: HTTP_STATUS.NOT_FOUND
            };

            // Mock findOne to return null, which triggers the not found error
            mockMongoModels.ClassRoom.findOne.mockResolvedValue(null);

            // Mock the error transformer to return our error response
            mockManagers.responseTransformer.errorTransformer.mockReturnValue(notFoundError);

            const result = await classRoomManager.deleteClassRoom(mockRequest);

            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('Class room not found');
            expect(result.error).toEqual([]);
            expect(mockManagers.responseTransformer.errorTransformer).toHaveBeenCalledWith({
                message: 'Class room not found',
                error: [],
                code: HTTP_STATUS.NOT_FOUND
            });
        });
    });
});
