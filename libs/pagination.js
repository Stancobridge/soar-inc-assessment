const getPagination = (query = {}) => {
    let { page = 1, limit = 10 } = query;
    page = page <= 0 ? 1 : page;
    limit = limit > 100 ? 100 : limit;

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
    };
    return options;
}

module.exports = { getPagination };