const { getPagination }              = require("../../../libs/pagination");
const { generateRegistrationNumber } = require("../../../libs/utils");
const HTTP_STATUS                    = require("../../api/_common/HttpStatus");
const { objectIdValidator }          = require("../../../libs/objectIdValidator");
const { studentStatus }              = require("./Student.mongoModel");
module.exports = class StudentManager {
    constructor({ managers, mongomodels, validators }) {
        this.managers = managers;
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.httpExposed = [
            'post=index.createStudent',
            'get=getSingleStudent:studentId',
            'patch=updateStudent:studentId',
            'get=index.getStudents',
            'delete=deleteStudent:studentId',
        ];
    }

    async createStudent({ classRoomId, schoolId, __authentication }) {
        try {
            const validationResult =
                await this.validators.student.createStudent({
                    classRoomId,
                    schoolId,
                });

            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }


            const objectIdValidationResult = objectIdValidator({
                classRoomId,
                schoolId,
            });

            if (objectIdValidationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student data',
                    error: objectIdValidationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const school = await this.managers.schools.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            const classRoom = await this.managers[
                'class-rooms'
            ].findOneClassRoom({ _id: classRoomId });

            if (classRoom.errors) {
                return classRoom;
            }


            if(classRoom.schoolId.toString() !== schoolId.toString()){
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Class room does not belong to this school',
                    error: [],
                    code: HTTP_STATUS.BAD_REQUEST,
                });
            }

            const user = await this.mongomodels.User.findOne({
                _id: __authentication._id,
            });

            // check if user is already a student
            const isStudent = await this.mongomodels.Student.findOne({
                userId: user._id,
            });

            if (isStudent) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'You are already a student',
                    error: [],
                    code: HTTP_STATUS.BAD_REQUEST,
                });
            }

            const student = await this.mongomodels.Student.create({
                userId: user._id,
                classRoomId,
                schoolId,
                status: 'pending',
                registrationNumber: generateRegistrationNumber(classRoom._id),
            });

            const studentRole = await this.mongomodels.Role.findOne({
                slug: 'student',
            });

            const userRoles = [... new Set([...user.roles, studentRole._id])];

            user.roles = userRoles;
            await user.save();

            return this.managers.responseTransformer.successTransformer({
                message: 'Student created successfully',
                data: { student },
                code: HTTP_STATUS.CREATED,
            });
        } catch (error) {
            console.log(error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error creating student',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async updateStudent({
        classRoomId,
        schoolId,
        status,
        __params,
        __authentication,
        __schoolAdministrator,
    }) {
        try {
            const { studentId } = __params;

            const validationResult = await this.validators.student.updateStudent({
                classRoomId,
                schoolId,
                status,
                studentId,
            });

            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const student = await this.findOneStudent({
                _id: studentId,
            });

            if (student.errors) {
                return student;
            }

            const schoolAdmin = await this.managers[
                'school-admins'
            ].checkIfUserIsSchoolAdmin(__authentication._id, schoolId);

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            if (status && !studentStatus.includes(status)) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student status',
                    error: [],
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            student.classRoomId = classRoomId || student.classRoomId;
            student.schoolId = schoolId || student.schoolId;
            student.status = status || student.status;

            await student.save();

            return this.managers.responseTransformer.successTransformer({
                message: 'Student updated successfully',
                data: student,
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log(error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error updating student',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getStudents({ __query, __authentication, __schoolAdministrator }) {
        try {
            const { classRoomId, schoolId, username } = __query;

            const validationResult = await this.validators.student.getStudents({
                classRoomId,
                schoolId,
                username,
            });


            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const queryData = { schoolId };

            if (classRoomId) {
                queryData.classRoomId = classRoomId;
            }

            const objectIdValidationResult = objectIdValidator(queryData);

            if (objectIdValidationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid student data',
                    error: objectIdValidationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const schoolAdmin = await this.managers[
                'school-admins'
            ].checkIfUserIsSchoolAdmin(__authentication._id, schoolId);

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }


            const paginateOptions = getPagination(__query);
            console.log({ queryData: this.mongomodels.Student });
            const students = await this.mongomodels.Student.paginate(
                queryData,
                paginateOptions
            );

            return this.managers.responseTransformer.successTransformer({
                message: 'Students fetched successfully',
                data: students,
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log(error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching students',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getSingleStudent({ __params, __authentication }) {
        try {
            const { studentId } = __params;

            const schoolAdmin = await this.managers[
                'school-admins'
            ].checkIfUserIsSchoolAdmin(__authentication._id, schoolId);

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            const student = await this.mongomodels.Student.findOne({
                _id: studentId,
            });

            if (
                student._id.toString() !== __authentication._id.toString() &&
                !schoolAdmin
            ) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'You are not authorized to view this student',
                    error: [],
                    code: HTTP_STATUS.FORBIDDEN,
                });
            }

            if (!student) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Student not found',
                    error: [],
                    code: HTTP_STATUS.NOT_FOUND,
                });
            }

            return this.managers.responseTransformer.successTransformer({
                message: 'Student fetched successfully',
                data: student,
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log(error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching student',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async deleteStudent({ __params, __authentication, __schoolAdministrator }) {
        try {
            const { studentId } = __params;

            const student = await this.findOneStudent({
                _id: studentId,
            });

            if (student.errors) {
                return student;
            }

            const schoolAdmin = await this.managers[
                'school-admins'
            ].checkIfUserIsSchoolAdmin(__authentication._id, student.schoolId);

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            await student.deleteOne();

            const user = await this.mongomodels.User.findOne({
                _id: student.userId,
            });

            const studentRole = await this.mongomodels.Role.findOne({
                slug: 'student',
            });

            const userRoles = user.roles.filter(role => role.toString() !== studentRole._id.toString());
            user.roles = userRoles;

            await user.save();

            return this.managers.responseTransformer.successTransformer({
                message: 'Student deleted successfully',
                data: [],
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log(error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error deleting student',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async findOneStudent(data = {}) {
        const student = await this.mongomodels.Student.findOne(data);

        if (!student) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Student not found',
                    error: [],
                code: HTTP_STATUS.NOT_FOUND,
            });
        }

        return student;
    }
};
