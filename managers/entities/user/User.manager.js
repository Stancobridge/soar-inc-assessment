module.exports = class User {

    constructor({utils, cache, config, cortex, managers, validators, mongomodels }={}){
        this.config              = config;
        this.cortex              = cortex;
        this.validators          = validators;
        this.mongomodels         = mongomodels;
        this.tokenManager        = managers.token;
        this.usersCollection     = "users";
        this.expireCache         = 3600; // 1 hour in seconds
        this.cache               = cache;
    }

    async getUser({ userId }){
        // Check if user is in cache
        const cachedUser = await this.cache.hash.get({ key: `user:${userId}` });
        const cachedRoles = await this.cache.hash.get({ key: `user:${userId}:rolesId` });

        if (cachedUser && Object.keys(cachedUser).length > 0) {
            cachedUser.roles = Object.values(cachedRoles);
            console.log('User found in cache');
            return cachedUser;
        }

        // If user is not in cache, fetch from database
        let user = await this.mongomodels.User.findOne({ _id: userId });


        if(!user) return null;

        user = user.toObject();
        const userRoles = user.roles;

        delete user.roles;
        delete user.password;

        // Cache the user data
        await this.cache.hash.set({ key: `user:${userId}`, data: user });
        await this.cache.hash.set({ key: `user:${userId}:rolesId`, data: userRoles });

        // expire the cache after 1 hour
        await this.cache.key.expire({ key: `user:${userId}`, expire: this.expireCache });
        await this.cache.key.expire({ key: `user:${userId}:rolesId`, expire: this.expireCache });

        user.roles = userRoles;

        return user;
    }

    async getUserRoles({ userId }){
        // Confirm user exists in the database
        const user = await this.getUser({ userId });

        if (!user) return null;

        const cachedRoles = await this.cache.hash.get({ key: `user:${userId}:roles` });

        if(!cachedRoles || Object.keys(cachedRoles).length === 0){
            let roles = await this.mongomodels.Role.find({ _id: { $in: user.roles } }).select('slug');

            roles = roles.map(role => role.slug);

            await this.cache.hash.set({ key: `user:${userId}:roles`, data: roles });
            await this.cache.key.expire({ key: `user:${userId}:roles`, expire: this.expireCache });

            return roles;
        }


        return Object.values(cachedRoles);

    }

}
