const StudentManager = require('../../managers/entities/student/Student.manager');
const { mockResponseTransformer } = require('../setup.test');
const HTTP_STATUS = require('../../managers/api/_common/HttpStatus');
const mongoose = require('mongoose');

describe('StudentManager', () => {
    let studentManager;
    let mockMongoModels;
    let mockManagers;
    let mockValidators;

    beforeEach(() => {
        // Mock mongoose models
        mockMongoModels = {
            Student: {
                create: jest.fn(),
                findOne: jest.fn(),
                paginate: jest.fn(),
                deleteOne: jest.fn(),
            },
            User: {
                findOne: jest.fn().mockReturnValue({
                    roles: [],
                    save: jest.fn(),
                }),
            },
            Role: {
                findOne: jest.fn().mockReturnValue({
                    _id: new mongoose.Types.ObjectId(),
                }),
            },
        };

        // Mock managers
        mockManagers = {
            responseTransformer: mockResponseTransformer,
            schools: {
                getSchoolById: jest.fn(),
            },
            'class-rooms': {
                findOneClassRoom: jest.fn(),
            },
            'school-admins': {
                checkIfUserIsSchoolAdmin: jest.fn(),
            },
        };

        // Mock validators
        mockValidators = {
            student: {
                createStudent: jest.fn(),
                updateStudent: jest.fn(),
                getStudents: jest.fn(),
            },
        };

        studentManager = new StudentManager({
            managers: mockManagers,
            mongomodels: mockMongoModels,
            validators: mockValidators,
        });
    });

    describe('createStudent', () => {
        const mockData = {
            classRoomId: new mongoose.Types.ObjectId().toString(),
            schoolId: new mongoose.Types.ObjectId().toString(),
            __authentication: { _id: new mongoose.Types.ObjectId() },
        };

        it('should create a student successfully', async () => {
            // Mock successful validations
            mockValidators.student.createStudent.mockResolvedValue(null);
            mockManagers.schools.getSchoolById.mockResolvedValue({ data: {} });
            mockManagers['class-rooms'].findOneClassRoom.mockResolvedValue({ data: { _id: mockData.classRoomId } });
            mockMongoModels.Student.findOne.mockResolvedValue(null);
            mockMongoModels.Student.create.mockResolvedValue({
                _id: new mongoose.Types.ObjectId(),
                userId: mockData.__authentication._id,
            });

            const result = await studentManager.createStudent(mockData);

            expect(result.code).toBe(HTTP_STATUS.CREATED);
            expect(result.message).toBe('Student created successfully');
            expect(mockMongoModels.Student.create).toHaveBeenCalled();
        });

        it('should return error if student already exists', async () => {
            mockValidators.student.createStudent.mockResolvedValue(null);
            mockManagers.schools.getSchoolById.mockResolvedValue({ data: {} });
            mockManagers['class-rooms'].findOneClassRoom.mockResolvedValue({ data: {} });
            mockMongoModels.Student.findOne.mockResolvedValue({ _id: new mongoose.Types.ObjectId() });

            const result = await studentManager.createStudent(mockData);

            expect(result.code).toBe(HTTP_STATUS.BAD_REQUEST);
            expect(result.message).toBe('You are already a student');
        });
    });

    describe('updateStudent', () => {
        const mockData = {
            classRoomId: new mongoose.Types.ObjectId().toString(),
            schoolId: new mongoose.Types.ObjectId().toString(),
            status: 'active',
            __params: { studentId: new mongoose.Types.ObjectId().toString() },
            __authentication: { _id: new mongoose.Types.ObjectId() },
        };

        it('should update student successfully', async () => {
            mockValidators.student.updateStudent.mockResolvedValue(null);
            const mockStudent = {
                _id: mockData.__params.studentId,
                save: jest.fn(),
            };

            studentManager.findOneStudent = jest.fn().mockResolvedValue(mockStudent);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ data: {} });

            const result = await studentManager.updateStudent(mockData);

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('Student updated successfully');
            expect(mockStudent.save).toHaveBeenCalled();
        });
    });

    describe('getStudents', () => {
        const mockQuery = {
            __query: {
                schoolId: new mongoose.Types.ObjectId().toString(),
                classRoomId: new mongoose.Types.ObjectId().toString(),
            },
            __authentication: { _id: new mongoose.Types.ObjectId() },
        };

        it('should fetch students successfully', async () => {
            mockValidators.student.getStudents.mockResolvedValue(null);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ data: {} });
            mockMongoModels.Student.paginate.mockResolvedValue({
                docs: [],
                total: 0,
                limit: 10,
                page: 1,
            });

            const result = await studentManager.getStudents(mockQuery);

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('Students fetched successfully');
            expect(mockMongoModels.Student.paginate).toHaveBeenCalled();
        });
    });

    describe('deleteStudent', () => {
        const mockData = {
            __params: { studentId: new mongoose.Types.ObjectId().toString() },
            __authentication: { _id: new mongoose.Types.ObjectId() },
        };

        it('should delete student successfully', async () => {
            const mockStudent = {
                _id: mockData.__params.studentId,
                userId: new mongoose.Types.ObjectId(),
                schoolId: new mongoose.Types.ObjectId(),
                deleteOne: jest.fn(),
            };

            studentManager.findOneStudent = jest.fn().mockResolvedValue(mockStudent);
            mockManagers['school-admins'].checkIfUserIsSchoolAdmin.mockResolvedValue({ data: {} });

            const result = await studentManager.deleteStudent(mockData);

            expect(result.code).toBe(HTTP_STATUS.OK);
            expect(result.message).toBe('Student deleted successfully');
            expect(mockStudent.deleteOne).toHaveBeenCalled();
        });
    });

    describe('findOneStudent', () => {
        it('should find student successfully', async () => {
            const mockStudent = {
                _id: new mongoose.Types.ObjectId(),
            };
            mockMongoModels.Student.findOne.mockResolvedValue(mockStudent);

            const result = await studentManager.findOneStudent({ _id: mockStudent._id });

            expect(result).toEqual(mockStudent);
        });

        it('should return error if student not found', async () => {
            mockMongoModels.Student.findOne.mockResolvedValue(null);

            const result = await studentManager.findOneStudent({ _id: new mongoose.Types.ObjectId() });

            expect(result.code).toBe(HTTP_STATUS.NOT_FOUND);
            expect(result.message).toBe('Student not found');
        });
    });
});
