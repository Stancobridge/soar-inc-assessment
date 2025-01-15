module.exports = {
    createClassRoom: [
        {
            model: 'name',
            required: true,
        },
        {
            model: 'schoolId',
            required: true,
        },
        {
            model: 'capacity',
            required: true,
            type: 'number',
        },
    ],
    updateClassRoom: [
        {
            model: 'name',
        },
        {
            model: 'schoolId',
            required: true,
        },
        {
            model: 'capacity',
            type: 'number',
        },
    ],
};
