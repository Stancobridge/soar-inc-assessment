const { getPagination } = require("../../../libs/pagination");
const HTTP_STATUS = require("../../api/_common/HttpStatus");

module.exports = class SchoolAdminManager {
    constructor({ managers, mongomodels, validators, cache }) {
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.managers = managers;
        this.cache = cache;
        this.httpExposed = [
            'post=index.createSchoolAdmin',
            'get=getSingleSchoolAdmin:schoolAdminId',
            'get=index.getSchoolAdmins',
            'delete=deleteSchoolAdmin:schoolAdminId',
        ];
    }

    async createSchoolAdmin({
        schoolId,
        userId,
        __authentication,
        __superAdmin,
    }) {
        try {
            const validationResult =
                await this.validators.school_admin.createSchoolAdmin({
                    schoolId,
                    userId,
                });

            if (validationResult) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid school admin data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });
            }

            const school = await this.managers.schools.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            const user = await this.mongomodels.User.findOne({ _id: userId });
            if (!user) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'User not found',
                    error: [],
                    code: HTTP_STATUS.NOT_FOUND,
                });
            }

            // make sure user is not already a school admin
            const isAlreadySchoolAdmin =
                await this.mongomodels.SchoolAdmin.findOne({ userId });
            if (isAlreadySchoolAdmin) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'User is already a school admin',
                    error: [],
                    code: HTTP_STATUS.BAD_REQUEST,
                });
            }

            const schoolAdmin = await this.mongomodels.SchoolAdmin.create({
                schoolId,
                userId,
            });

            const role = await this.mongomodels.Role.findOne({
                slug: 'school-administrator',
            });

            // assign role to user, make sure user is not already a school admin
            const hasSchoolAdminRole = user.roles.some(
                (rl) => rl.toString() === role._id.toString()
            );

            if (!hasSchoolAdminRole) {
                user.roles.push(role._id);
                await user.save();
            }

            // revalidate user roles
            await this.revalidateUserRoles(userId);

            return this.managers.responseTransformer.successTransformer({
                message: 'School admin created successfully',
                data: schoolAdmin,
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

    async getSingleSchoolAdmin({ __params, __authentication, __superAdmin }) {
        try {
            const { schoolAdminId } = __params;

            const schoolAdmin = await this.findOneSchoolAdmin({
                _id: schoolAdminId,
            });
            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            return this.managers.responseTransformer.successTransformer({
                message: 'School admin fetched successfully',
                data: schoolAdmin,
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

    async getSchoolAdmins({
        __params,
        __query,
        __authentication,
        __superAdmin,
    }) {
        try {
            const { schoolId } = __params;
            const fetchData = {};

            if (schoolId) {
                fetchData.schoolId = schoolId;
            }

            const paginationOptions = getPagination(__query);
            const schoolAdmins = await this.mongomodels.SchoolAdmin.paginate(
                fetchData,
                paginationOptions
            );

            return this.managers.responseTransformer.successTransformer({
                message: 'School admins fetched successfully',
                data: schoolAdmins,
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

    async deleteSchoolAdmin({ __params, __authentication, __superAdmin }) {
        try {
            const { schoolAdminId } = __params;

            const schoolAdmin = await this.findOneSchoolAdmin({
                _id: schoolAdminId,
            });
            if (schoolAdmin.errors) {
                return schoolAdmin;
            }

            await this.mongomodels.SchoolAdmin.deleteOne({
                _id: schoolAdminId,
            });

            const role = await this.mongomodels.Role.findOne({
                slug: 'school-administrator',
            });

            const user = await this.mongomodels.User.findOne({
                _id: schoolAdmin.user._id,
            });

            user.roles = user.roles.filter(
                (rl) => rl.toString() !== role._id.toString()
            );
            await user.save();

            // revalidate user roles
            await this.revalidateUserRoles(schoolAdmin.user._id);

            return this.managers.responseTransformer.successTransformer({
                message: 'School admin deleted successfully',
                data: {},
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

    async findOneSchoolAdmin(data = {}) {
        try {
            let schoolAdmin = await this.mongomodels.SchoolAdmin.findOne(
                data
            ).populate('userId');
            if (!schoolAdmin) {
                return this.managers.responseTransformer.errorTransformer({
                    message: 'School admin not found',
                    error: [],
                    code: HTTP_STATUS.NOT_FOUND,
                });
            }

            schoolAdmin = schoolAdmin.toObject();

            schoolAdmin.user = schoolAdmin.userId;

            delete schoolAdmin.userId;
            delete schoolAdmin.user.password;
            return schoolAdmin;
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Internal server error',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async revalidateUserRoles(userId) {
        // expire the cache after 1 hour
        await this.cache.key.delete({ key: `user:${userId}:roles` });
        // expire the cache after 1 hour
        await this.cache.key.delete({ key: `user:${userId}`});
        await this.cache.key.delete({ key: `user:${userId}:rolesId`});
    }
};
