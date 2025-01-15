const mongoose = require('mongoose');

const ClassRoomSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, collection: 'class_rooms' }
);

module.exports = mongoose.model('ClassRoom', ClassRoomSchema);
