const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
    first_name: { type: String, required: true },
    last_name:  { type: String, required: true },
    username:   { type: String, required: true, unique: true },
    email:      { type: String, required: true, unique: true },
    password:   { type: String, required: true },
    roles:      [ { type: mongoose.Schema.Types.ObjectId, ref: 'Role' } ],
}, { timestamps: true, collection: 'users' });

UserSchema.index({ username: 1, email: 1 }, { unique: true });

module.exports = mongoose.model('User', UserSchema);
