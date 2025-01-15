const HTTP_STATUS = require("../../api/_common/HttpStatus");

module.exports = class ClassRoomManager {
    constructor({ managers, mongomodels, validators }) {
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.managers = managers;
        this.httpExposed = ['post=index.createClassRoom'];
    }

    async createClassRoom({
        name,
        schoolId,
        __authentication,
        __schoolAdministrator,
    }) {
        try {
            const validationResult = this.validators.class_room.createClassRoom(
                { name, schoolId }
            );
            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid class room data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const school = await this.managers.schools.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            const classRoom = await this.mongomodels.ClassRoom.create({
                name,
                schoolId,
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
                message: 'Internal server error',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async updateClassRoom({
        name,
        schoolId,
        __params,
        __authentication,
        __schoolAdministrator,
    }) {
        try {
            const classRoom = await this.mongomodels.ClassRoom.findOne({
                _id: __params.id,
            });

            if (!classRoom) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Class room not found',
                    error: [],
                    code: HTTP_STATUS.NOT_FOUND,
                });
            }

            return this.managers.responseTransformer.successTransformer({
                message: 'Class room updated successfully',
                data: classRoom,
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Internal server error',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getOneClassRoom({ __params, __authentication, __schoolAdministrator }) {
        try {
            const classRoom = await this.mongomodels.ClassRoom.findOne({ _id: __params.id });
            if (!classRoom) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Class room not found',
                    error: [],
                    code: HTTP_STATUS.NOT_FOUND,
                });
            }
            return classRoom;
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Internal server error',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getAllClassRooms(schoolId) {
        const classRooms = await this.mongomodels.ClassRoom.find({ schoolId });
        return classRooms;
    }

    async deleteClassRoom(id) {
        const classRoom = await this.mongomodels.ClassRoom.findByIdAndDelete(
            id
        );
        return classRoom;
    }
};
