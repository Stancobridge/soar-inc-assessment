const mongoose = require('mongoose');

const SchoolSchema = new mongoose.Schema(
    {
        name: { type: String, required: true },
        address: { type: String, required: true },
        phone: { type: String, required: true },
        email: { type: String, required: true, unique: true },
        website: { type: String, required: true },
        description: { type: String, required: true },
        createdByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    },
    { timestamps: true, collection: 'schools' }
);

module.exports = mongoose.model('School', SchoolSchema);
