const mongoose = require('mongoose');

const RoleSchema = new mongoose.Schema({
    name: { type: String, required: true, unique: true },
    slug: { type: String, required: true, unique: true },
}, { timestamps: true, collection: 'roles' });

RoleSchema.index({ name: 1, slug: 1 }, { unique: true });

module.exports = mongoose.model('Role', RoleSchema);
