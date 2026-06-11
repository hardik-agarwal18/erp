// @ts-nocheck
type PaginationInput = {
  page?: string | number;
  limit?: string | number;
};

const parseNumber = (value: string | number | undefined) => {
  if (value === undefined) {
    return undefined;
  }
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : undefined;
};

export const parsePagination = (input: PaginationInput) => {
  const pageRaw = parseNumber(input.page);
  const limitRaw = parseNumber(input.limit);

  const page = pageRaw && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const limit =
    limitRaw && limitRaw > 0 ? Math.min(Math.floor(limitRaw), 100) : 20;

  return {
    page,
    limit,
    skip: (page - 1) * limit,
    take: limit,
  };
};
