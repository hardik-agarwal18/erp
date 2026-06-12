
export type CreateGodownInput = {
  name: string;
  code?: string;
  address?: string;
  managerId?: string;
  isActive?: boolean;
};

export type UpdateGodownInput = Partial<CreateGodownInput>;

export type GodownFilters = {
  search?: string;
  isActive?: boolean;
};
