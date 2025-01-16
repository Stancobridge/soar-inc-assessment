const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const studentStatus = ['active', 'inactive', 'pending'];

const StudentSchema = new mongoose.Schema(
    {
        userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        classRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'ClassRoom', required: true },
        registrationNumber: { type: String, required: true, unique: true },
        status: { type: String, required: true, enum: studentStatus, default: 'pending' },
        schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    },
    { timestamps: true, collection: 'students' }
);

StudentSchema.plugin(mongoosePaginate);

module.exports = mongoose.model('Student', StudentSchema);
module.exports.studentStatus = studentStatus;
