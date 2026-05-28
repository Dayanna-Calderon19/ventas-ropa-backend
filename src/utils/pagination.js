export const getPaginationParams = (query) => {
    const page = Math.max(1, parseInt(query.page, 10) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(query.limit, 10) || 20));
    const skip = (page - 1) * limit;
    return { page, limit, skip };
};

export const buildPaginationMeta = (total, page, limit) => {
    const totalPages = Math.ceil(total / limit);
    return {
        total,
        page,
        limit,
        totalPages,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1,
    };
};

export const paginate = async (
    model,
    { where = {}, orderBy = {}, page, limit, include } = {},
) => {
    const { skip } = getPaginationParams({ page, limit });

    const [total, data] = await Promise.all([
        model.count({ where }),
        model.findMany({
            where,
            orderBy,
            skip,
            take: limit,
            ...(include && { include }),
        }),
    ]);

    return {
        data,
        meta: buildPaginationMeta(total, page, limit),
    };
};
