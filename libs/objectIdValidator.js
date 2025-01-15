const mongoose = require('mongoose');

const objectIdValidator = (data = {}) => {
    const errorBag = [];
    for (const key in data) {
        if (!mongoose.Types.ObjectId.isValid(data[key])) {
            errorBag.push({
                message: `${key} is not a valid object id`,
                path: key,
                label: key,
            });
        }
    }

    return errorBag.length > 0 ? errorBag : false;
}

module.exports = { objectIdValidator };