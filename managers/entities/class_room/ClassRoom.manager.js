const { getPagination } = require("../../../libs/pagination");
const HTTP_STATUS = require("../../api/_common/HttpStatus");

module.exports = class ClassRoomManager {
    constructor({ managers, mongomodels, validators }) {
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.managers = managers;
        this.httpExposed = [
            'post=index.createClassRoom',
            'patch=updateClassRoom:classRoomId',
            'get=getOneClassRoom:classRoomId',
            'get=index.getAllClassRooms',
            'delete=deleteClassRoom:classRoomId'
        ];
    }

    async createClassRoom({
        name,
        schoolId,
        capacity,
        __authentication,
        __schoolAdministrator,
    }) {
        try {
            const validationResult = await this.validators.class_room.createClassRoom({ name, schoolId, capacity });

            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid class room data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const schoolAdmin = await this.managers['school-admins'].checkIfUserIsSchoolAdmin(
                __authentication._id,
                schoolId
            );

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            const school = await this.managers.schools.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            // check if the class room name is already taken in the school
            let classRoom = await this.findOneClassRoom({ name, schoolId });

            if (classRoom.name) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Class room with this name already exists in this school',
                    error: [],
                    code: HTTP_STATUS.CONFLICT,
                });
            }

            classRoom = await this.mongomodels.ClassRoom.create({
                name,
                schoolId,
                capacity,
                createdByUserId: __authentication._id,
            });

            return this.managers.responseTransformer.successTransformer({
                message: 'Class room created successfully',
                data: classRoom,
                code: HTTP_STATUS.CREATED,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error creating class room',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async updateClassRoom({
        name,
        schoolId,
        capacity,
        __params,
        __authentication,
        __schoolAdministrator,
    }) {
        try {

            const classRoomId = __params.classRoomId;

            const validationResult = await this.validators.class_room.updateClassRoom({ name, schoolId, capacity })

            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid class room data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            let classRoom = await this.findOneClassRoom({ _id: classRoomId });

            if (classRoom.errors) {
                return classRoom;
            }

            if (name) {
                // make sure the name is unique
                let classRoomWithSameName = await this.mongomodels.ClassRoom.findOne(
                    {
                        name,
                        _id: { $ne: classRoomId },
                    }
                );

                if (classRoomWithSameName) {
                    return this.managers.responseTransformer.errorTransformer({
                        message: 'Class room with this name already exists in this school',
                        error: [],
                        code: HTTP_STATUS.CONFLICT,
                    });
                }

                classRoom.name = name;
            }

            const schoolAdmin = await this.managers['school-admins'].checkIfUserIsSchoolAdmin(
                __authentication._id,
                schoolId || classRoom.schoolId
            );

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            classRoom.name = name || classRoom.name;
            classRoom.capacity = capacity || classRoom.capacity;
            classRoom.schoolId = schoolId || classRoom.schoolId;

            await classRoom.save();

            return this.managers.responseTransformer.successTransformer({
                message: 'Class room updated successfully',
                data: classRoom,
                code: HTTP_STATUS.OK,
            });

        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error updating class room',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getOneClassRoom({ __params, __authentication, __schoolAdministrator }) {
        try {
            const classRoom = await this.findOneClassRoom({
                _id: __params.classRoomId,
            });

            if (classRoom.errors) {
                return classRoom;
            }

            return this.managers.responseTransformer.successTransformer({
                message: 'Class room fetched successfully',
                data: classRoom,
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching class room',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getAllClassRooms({ __query, __authentication, __schoolAdministrator }) {
        try {
            const paginationOptions = getPagination(__query);

            const classRooms = await this.mongomodels.ClassRoom.paginate({}, paginationOptions);

            return this.managers.responseTransformer.successTransformer({
                message: 'Class rooms fetched successfully',
            data: classRooms,
            code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching class rooms',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }



    async deleteClassRoom({ __params, __authentication, __schoolAdministrator }) {
        try {
            const classRoomId = __params.classRoomId;

            let classRoom = await this.findOneClassRoom({ _id: classRoomId });

            if (classRoom.errors) {
                return classRoom;
            }

            const schoolAdmin = await this.managers['school-admins'].checkIfUserIsSchoolAdmin(
                __authentication._id,
                classRoom.schoolId
            );

            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            await classRoom.deleteOne();

            return this.managers.responseTransformer.successTransformer({
                message: 'Class room deleted successfully',
                data: {},
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error deleting class room',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async findOneClassRoom(data = {}) {
        const classRoom = await this.mongomodels.ClassRoom.findOne(data);

        if (!classRoom) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'Class room not found',
                error: [],
                code: HTTP_STATUS.NOT_FOUND,
            });
        }

        return classRoom;
    }

};