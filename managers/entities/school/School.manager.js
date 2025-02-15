const { getPagination } = require("../../../libs/pagination");
const HTTP_STATUS       = require("../../api/_common/HttpStatus");

module.exports = class SchoolManager {
    constructor({ managers, mongomodels, validators }) {
        this.mongomodels = mongomodels;
        this.validators = validators;
        this.managers = managers;
        this.httpExposed = [
            'post=index.createSchool',
            'patch=updateSchool:schoolId',
            'get=getOneSchool:schoolId',
            'get=index.getAllSchools',
            'delete=deleteSchool:schoolId',
        ];
    }

    async createSchool({
        name,
        address,
        website,
        description,
        phone,
        email,
        __authentication,
        __superAdmin,
    }) {
        let school;
        let schoolExistsBefore;

        try {
            let validationResult = await this.validators.school.createSchool({
                name,
                address,
                website,
                description,
                phone,
                email,
            });

            if (validationResult)
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid school data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });

            // confirm that the school name is unique
            school = await this.mongomodels.School.findOne({ email });

            if (school) {
                schoolExistsBefore = true;
                return this.managers.responseTransformer.errorTransformer({
                    message: 'School with this email already exists',
                    error: [],
                    code: HTTP_STATUS.CONFLICT,
                });
            }

            school = await this.mongomodels.School.create({
                name,
                address,
                website,
                description,
                phone,
                email,
                createdByUserId: __authentication._id,
            });

            return this.managers.responseTransformer.successTransformer({
                message: 'School created successfully',
                data: { school },
                code: HTTP_STATUS.CREATED,
            });
        } catch (error) {
            console.log('error occurred', error);

            if (!schoolExistsBefore && school) {
                await this.mongomodels.School.deleteOne({ _id: school._id });
            }

            return this.managers.responseTransformer.errorTransformer({
                message: 'Error creating school',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async updateSchool({
        name,
        address,
        website,
        description,
        phone,
        email,
        __params,
        __authentication,
        __superAdmin,
    }) {
        try {
            const schoolId = __params.schoolId;

            let validationResult = await this.validators.school.updateSchool({
                name,
                address,
                website,
                description,
                phone,
                email,
            });

            if (validationResult)
                return this.managers.responseTransformer.errorTransformer({
                    message: 'Invalid school data',
                    error: validationResult,
                    code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                });

            let school = await this.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            if (email) {
                // make sure the email is unique and not the current school
                let schoolWithSameEmail = await this.mongomodels.School.findOne(
                    {
                        email,
                        _id: { $ne: schoolId },
                    }
                );

                if (schoolWithSameEmail) {
                    return this.managers.responseTransformer.errorTransformer({
                        message: 'School with this email already exists',
                        error: [],
                        code: HTTP_STATUS.UNPROCESSABLE_ENTITY,
                    });
                }

                school.email = email;
            }

            school.address = address || school.address;
            school.website = website || school.website;
            school.description = description || school.description;
            school.phone = phone || school.phone;
            school.name = name || school.name;

            await school.save();

            return this.managers.responseTransformer.successTransformer({
                message: 'School updated successfully',
                data: { school },
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error updating school',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getOneSchool({ __params, __authentication }) {
        try {
            const school = await this.getSchoolById(__params.schoolId);

            if (school.errors) {
                return school;
            }

            return this.managers.responseTransformer.successTransformer({
                message: 'School fetched successfully',
                data: { school },
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching school',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getAllSchools({ __query, __authentication }) {
        try {
            const options = getPagination(__query);
            const schools = await this.mongomodels.School.paginate({}, options);

            return this.managers.responseTransformer.successTransformer({
                message: 'Schools fetched successfully',
                data: {
                    schools: schools.docs,
                    totalPages: schools.totalPages,
                    currentPage: schools.page,
                    totalSchools: schools.totalDocs,
                    hasNextPage: schools.hasNextPage,
                    hasPrevPage: schools.hasPrevPage,
                },
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error fetching schools',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async deleteSchool({ __params, __authentication, __superAdmin }) {
        try {
            const { schoolId } = __params;
            let school = await this.getSchoolById(schoolId);

            if (school.errors) {
                return school;
            }

            await school.deleteOne();

            return this.managers.responseTransformer.successTransformer({
                message: 'School deleted successfully',
                data: {},
                code: HTTP_STATUS.OK,
            });
        } catch (error) {
            console.log('error occurred', error);
            return this.managers.responseTransformer.errorTransformer({
                message: 'Error deleting school',
                error: [],
                code: HTTP_STATUS.INTERNAL_SERVER_ERROR,
            });
        }
    }

    async getSchoolById(schoolId) {
        const school = await this.mongomodels.School.findOne({ _id: schoolId });
        if (!school) {
            return this.managers.responseTransformer.errorTransformer({
                message: 'School not found',
                error: [],
                code: HTTP_STATUS.NOT_FOUND,
            });
        }
        return school;
    }
};