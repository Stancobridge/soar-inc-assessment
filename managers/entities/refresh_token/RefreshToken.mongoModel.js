const mongoose = require("mongoose");

const refreshTokenSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    validation_key: { type: String, required: true },
    is_used: { type: Boolean, default: false },
}, { timestamps: true, collection: 'refresh_tokens' });

module.exports = mongoose.model('RefreshToken', refreshTokenSchema);