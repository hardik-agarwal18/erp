export type CreateCustomerInput = {
  name: string;
  type: string; // INDIVIDUAL, CORPORATE
  group?: string; // WHOLESALE, RETAIL
  gstNumber?: string;
  parentCustomerId?: string;
  addresses?: Array<{
    type: string;
    street: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    isDefault?: boolean;
  }>;
  contacts?: Array<{
    name: string;
    email?: string;
    phone?: string;
    role?: string;
    isPrimary?: boolean;
  }>;
  taxProfile?: {
    panNumber?: string;
    taxExempt?: boolean;
    exemptionReason?: string;
  };
  creditProfile?: {
    creditLimit: number;
    creditDays: number;
    riskRating?: string;
  };
};

export type UpdateCustomerInput = Partial<Omit<CreateCustomerInput, 'code'>>;

export type CustomerFilters = {
  search?: string;
  status?: string;
  type?: string;
};
