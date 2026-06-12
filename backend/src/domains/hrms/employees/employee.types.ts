// @ts-nocheck
import { 
  Employee, 
  Department, 
  Designation, 
  EmployeeDocument, 
  EmployeeStatus, 
  EmploymentType, 
  Gender 
} from "@prisma/client";

export interface CreateDepartmentInput {
  name: string;
  code?: string;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDepartmentInput extends Partial<CreateDepartmentInput> {}

export interface CreateDesignationInput {
  name: string;
  level?: number;
  description?: string;
  isActive?: boolean;
}

export interface UpdateDesignationInput extends Partial<CreateDesignationInput> {}

export interface CreateEmployeeInput {
  firstName: string;
  lastName: string;
  officialEmail?: string;
  personalEmail?: string;
  phone?: string;
  alternatePhone?: string;
  dateOfBirth?: Date;
  gender?: Gender;
  joiningDate: Date;
  confirmationDate?: Date;
  terminationDate?: Date;
  designationId?: string;
  departmentId?: string;
  managerId?: string;
  employmentType: EmploymentType;
  status: EmployeeStatus;
  isActive?: boolean;
  isDriver?: boolean;
  drivingLicenseNumber?: string;
  drivingLicenseExpiry?: Date;
  profileImageUrl?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface UpdateEmployeeInput extends Partial<CreateEmployeeInput> {
  employeeCode?: string; // Only allowed for certain updates if needed, though usually fixed
}

export interface EmployeeHierarchyNode {
  id: string;
  employeeCode: string;
  firstName: string;
  lastName: string;
  designation?: { name: string } | null;
  department?: { name: string } | null;
  profileImageUrl?: string | null;
}

export interface EmployeeHierarchyResponse {
  employee: EmployeeHierarchyNode;
  manager: EmployeeHierarchyNode | null;
  subordinates: EmployeeHierarchyNode[];
}

export interface EmployeeFilters {
  page?: number;
  limit?: number;
  search?: string;
  departmentId?: string;
  designationId?: string;
  status?: EmployeeStatus;
  employmentType?: EmploymentType;
  managerId?: string;
  isDriver?: boolean;
}

export interface DepartmentFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}

export interface DesignationFilters {
  page?: number;
  limit?: number;
  search?: string;
  isActive?: boolean;
}
