/**
 * Helper to calculate skip and limit for MongoDB queries.
 * @param {string|number} queryPage 
 * @param {string|number} queryLimit 
 * @returns {{page: number, limit: number, skip: number}}
 */
export const getPagination = (queryPage, queryLimit) => {
  const page = Math.max(1, parseInt(queryPage, 10) || 1);
  const limit = Math.max(1, parseInt(queryLimit, 10) || 10);
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Helper to construct pagination metadata objects.
 * @param {number} totalItems 
 * @param {number} page 
 * @param {number} limit 
 * @returns {{page: number, limit: number, totalPages: number, totalItems: number}}
 */
export const getPaginationMeta = (totalItems, page, limit) => {
  const totalPages = Math.ceil(totalItems / limit);
  return { page, limit, totalPages, totalItems };
};
