
export type CreateCustomerInput = {
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
};

export type UpdateCustomerInput = {
  name?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
  creditLimit?: number;
};

export type CustomerFilters = {
  search?: string;
};
