const AppError = require("./AppError");

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const pagination = (query) => {
    const parse = (value, name, fallback, max) => {
        if (value === undefined) return fallback;
        if (typeof value !== "string" || !/^\d+$/.test(value)) throw new AppError(`${name} must be a positive integer`, 400, "INVALID_QUERY");
        const number = Number(value);
        if (number < 1 || number > max) throw new AppError(`${name} must be between 1 and ${max}`, 400, "INVALID_QUERY");
        return number;
    };
    return { page: parse(query.page, "page", 1, 1000000), limit: parse(query.limit, "limit", 10, 50) };
};

module.exports = { escapeRegex, pagination };
