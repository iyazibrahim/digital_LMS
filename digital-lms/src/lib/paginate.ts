export type PageResult<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export function parsePageParams(
  searchParams: URLSearchParams | { get(name: string): string | null },
  defaultSize = 20
) {
  const page = Math.max(1, Number(searchParams.get("page") || 1) || 1);
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") || defaultSize) || defaultSize)
  );
  return { page, pageSize, skip: (page - 1) * pageSize };
}

type QueryLike = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  countDocuments: (f?: any) => Promise<number> | any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  find: (f?: any) => any;
};

export async function paginateQuery<T = Record<string, unknown>>(
  model: QueryLike,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter: Record<string, any> = {},
  opts: {
    page?: number;
    pageSize?: number;
    sort?: Record<string, 1 | -1>;
    select?: string;
    populate?: string | { path: string; select?: string };
  } = {}
): Promise<PageResult<T>> {
  const page = Math.max(1, opts.page || 1);
  const pageSize = Math.min(100, Math.max(1, opts.pageSize || 20));
  const skip = (page - 1) * pageSize;
  const total = await model.countDocuments(filter);
  let q = model.find(filter);
  if (opts.select) q = q.select(opts.select);
  if (opts.sort) q = q.sort(opts.sort);
  if (opts.populate) q = q.populate(opts.populate);
  const items = (await q.skip(skip).limit(pageSize).lean()) as T[];
  return {
    items,
    total,
    page,
    pageSize,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  };
}
