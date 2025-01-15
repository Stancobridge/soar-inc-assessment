module.exports = {
    createStudent: [
        {
            model: 'classRoomId',
            type: 'string',
            required: true,
        },
        {
            model: 'schoolId',
            type: 'string',
            required: true,
        },
    ],
    getStudents: [
        {
            model: 'schoolId',
            type: 'string',
            required: true,
        },
        {
            model: 'classRoomId',
            type: 'string',
            required: false,
        },
    ],
    updateStudent: [
        {
            model: "schoolId",
            type: "string",
            required: false,
        },
        {
            model: 'classRoomId',
            type: 'string',
            required: false,
        },
        {
            model: 'status',
            type: 'string',
            required: false,
        },
    ],
};
