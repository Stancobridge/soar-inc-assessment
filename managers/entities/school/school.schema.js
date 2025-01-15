module.exports = {
    createSchool: [
        {
            model: 'name',
            required: true,
        },
        {
            model: 'address',
            required: true,
        },
        {
            model: 'phone',
            required: true,
        },
        {
            model: 'email',
        },
        {
            model: 'website',
            required: true,
        },
        {
            model: 'description',
            required: true,
        },
    ],
    updateSchool: [
        {
            model: 'name',
        },
        {
            model: 'address',
        },
        {
            model: 'phone',
        },
        {
            model: 'email',
        },
        {
            model: 'website',
        },
        {
            model: 'description',
        },
    ],
};