export type CreateVendorInput = {
  name: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
};

export type UpdateVendorInput = {
  name?: string;
  email?: string;
  phone?: string;
  gstNumber?: string;
  address?: string;
};

export type VendorFilters = {
  search?: string;
};
