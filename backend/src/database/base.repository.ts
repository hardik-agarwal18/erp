type QueryWhere = Record<string, unknown>;
type QueryOptions = {
  orderBy?: Record<string, unknown>;
  skip?: number;
  take?: number;
};

type ScopedDelegate<TRecord, TCreate, TUpdate> = {
  count: (args: { where?: QueryWhere }) => Promise<number>;
  create: (args: { data: TCreate }) => Promise<TRecord>;
  findFirst: (args: { where: QueryWhere }) => Promise<TRecord | null>;
  findMany: (args: { where?: QueryWhere } & QueryOptions) => Promise<TRecord[]>;
  update: (args: { where: { id: string }; data: TUpdate }) => Promise<TRecord>;
  updateMany: (args: {
    data: Record<string, unknown>;
    where: QueryWhere;
  }) => Promise<{ count: number }>;
};

type BaseRepositoryOptions = {
  idField?: string;
  softDelete?: boolean;
  tenantScoped?: boolean;
};

export type ListQueryOptions = QueryOptions;

/**
 * Reusable repository primitive for tenant-aware CRUD on `id`-based models.
 */
export class BaseRepository<
  TRecord extends { id: string },
  TCreate,
  TUpdate,
> {
  private readonly idField: string;
  private readonly softDelete: boolean;
  private readonly tenantScoped: boolean;

  constructor(
    private readonly delegate: ScopedDelegate<TRecord, TCreate, TUpdate>,
    options: BaseRepositoryOptions = {},
  ) {
    this.idField = options.idField ?? "id";
    this.softDelete = options.softDelete ?? false;
    this.tenantScoped = options.tenantScoped ?? false;
  }

  protected buildScopedWhere(
    id: string,
    organizationId?: string,
    includeDeleted = false,
  ): QueryWhere {
    const where: QueryWhere = {
      [this.idField]: id,
    };

    if (this.tenantScoped && organizationId) {
      where.organizationId = organizationId;
    }

    if (this.softDelete && !includeDeleted) {
      where.deletedAt = null;
    }

    return where;
  }

  protected mergeWhere(
    where: QueryWhere = {},
    organizationId?: string,
    includeDeleted = false,
  ): QueryWhere {
    const merged: QueryWhere = { ...where };

    if (this.tenantScoped && organizationId) {
      merged.organizationId = organizationId;
    }

    if (this.softDelete && !includeDeleted && merged.deletedAt === undefined) {
      merged.deletedAt = null;
    }

    return merged;
  }

  create(data: TCreate): Promise<TRecord> {
    return this.delegate.create({ data });
  }

  findById(
    id: string,
    organizationId?: string,
    includeDeleted = false,
  ): Promise<TRecord | null> {
    return this.delegate.findFirst({
      where: this.buildScopedWhere(id, organizationId, includeDeleted),
    });
  }

  list(
    where: QueryWhere = {},
    options: ListQueryOptions = {},
    organizationId?: string,
    includeDeleted = false,
  ): Promise<TRecord[]> {
    return this.delegate.findMany({
      where: this.mergeWhere(where, organizationId, includeDeleted),
      orderBy: options.orderBy,
      skip: options.skip,
      take: options.take,
    });
  }

  count(
    where: QueryWhere = {},
    organizationId?: string,
    includeDeleted = false,
  ): Promise<number> {
    return this.delegate.count({
      where: this.mergeWhere(where, organizationId, includeDeleted),
    });
  }

  async updateById(
    id: string,
    data: TUpdate,
    organizationId?: string,
  ): Promise<TRecord | null> {
    const existing = await this.findById(id, organizationId);

    if (!existing) {
      return null;
    }

    return this.delegate.update({
      where: { id: existing.id },
      data,
    });
  }

  archiveById(
    id: string,
    organizationId?: string,
  ): Promise<{ count: number }> {
    if (!this.softDelete) {
      throw new Error("archiveById is only available for soft-delete models.");
    }

    return this.delegate.updateMany({
      where: this.buildScopedWhere(id, organizationId),
      data: { deletedAt: new Date() },
    });
  }

  restoreById(
    id: string,
    organizationId?: string,
  ): Promise<{ count: number }> {
    if (!this.softDelete) {
      throw new Error("restoreById is only available for soft-delete models.");
    }

    return this.delegate.updateMany({
      where: this.buildScopedWhere(id, organizationId, true),
      data: { deletedAt: null },
    });
  }
}
