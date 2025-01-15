const Role = require('../managers/entities/role/Role.mongoModel');


/**
 * Seed roles to database to manage RBAC
 *
 */
module.exports = class RoleSeed {
    data() {
        return [
            { name: 'SuperAdmin', slug: 'super-admin' },
            { name: 'SchoolAdministrator', slug: 'school-administrator' },
            { name: 'Student', slug: 'student' },
            // default role for newly created user, especially students
            { name: 'User', slug: 'user' },
        ];
    }

    async run() {

        try {

            console.log('🌱 Seeding roles to database');

            // check if roles already exist
            const roles = await Role.find({});
            if (roles.length > 0) {
                console.log('🌱🌱 Roles already seeded');
                return;
            }

            // insert roles
            await Role.insertMany(this.data());

            console.log('🌱🌱 Seeding roles to database completed');

        } catch (error) {
            console.error("Error seeding roles", error);
            process.exit(1);
        }
    }

}
