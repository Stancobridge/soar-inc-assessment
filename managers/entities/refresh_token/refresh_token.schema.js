const { model } = require("mongoose");

module.exports = {
    refreshAuthenticationToken: [
        {
            model: "refreshToken",
            required: true,
        }
    ],
};