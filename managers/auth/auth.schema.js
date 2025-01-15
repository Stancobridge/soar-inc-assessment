

module.exports = {
    login: [
        {
            model: 'username',
            required: true,
        },
        {
            model: 'password',
            required: true,
        },
    ],
    register: [
        {
            model: 'username',
            required: true,
        },
        {
            model: 'password',
            required: true,
        },
        {
            model: 'confirm_password',
            required: true,
        },
        {
            model: 'email',
            required: true,
        },
        {
            model: 'first_name',
            required: true,
        },
        {
            model: 'last_name',
            required: true,
        },

    ],
};


