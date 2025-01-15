const mongoose = require('mongoose');

const SchoolAdminSchema = new mongoose.Schema({
    schoolId: { type: mongoose.Schema.Types.ObjectId, ref: 'School', required: true },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true, collection: 'school_admins' });

module.exports = mongoose.model('SchoolAdmin', SchoolAdminSchema);
