const Role    = require('../managers/entities/role/Role.mongoModel');
const User    = require('../managers/entities/user/User.mongoModel');
const bcrypt  = require('bcrypt');

module.exports = class SuperAdmin {
    async data() {
        const salt = await bcrypt.genSalt(10);
        const hash = await bcrypt.hash('superadmin01', salt);

        // get superadmin role
        const role = await Role.findOne({ name: 'SuperAdmin' });

        if(!role) throw new Error('SuperAdmin role not found');

        return {
            first_name:  'Super',
            last_name:   'Admin',
            username:    'superadmin',
            email:       'superadmin@soar.inc',
            password:    hash,
            roles:       [role._id]
        }
    }

    async run() {

        try {
            console.log('🌱 Seeding superadmin to database');

            // check if superadmin already exist
            const user = await User.findOne({
                username: 'superadmin',
            });

            if (user) {
                console.log('🌱🌱 Superadmin already seeded');
                return;
            }

            // insert superadmin
            const userData = await this.data();

            await User.create(userData);

            console.log('🌱🌱 Seeding superadmin to database completed');

        } catch (error) {
            console.error("Error seeding superadmin", error);
            process.exit(1);
        }
    }
}