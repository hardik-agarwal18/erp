// @ts-nocheck
import { z } from "zod";
import { EmployeeStatus, EmploymentType, Gender } from "@prisma/client";

export const createDepartmentSchema = z.object({
  name: z.string().min(1, "Department name is required"),
  code: z.string().optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateDepartmentSchema = createDepartmentSchema.partial();

export const createDesignationSchema = z.object({
  name: z.string().min(1, "Designation name is required"),
  level: z.number().int().min(1).optional(),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

export const updateDesignationSchema = createDesignationSchema.partial();

export const addEmployeeDocumentSchema = z.object({
  documentName: z.string().min(1, "Document name is required"),
  documentType: z.string().min(1, "Document type is required"),
  fileUrl: z.string().url("Valid URL is required"),
  expiryDate: z.coerce.date().optional(),
});


export const createEmployeeSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  officialEmail: z.string().email("Invalid official email").optional().or(z.literal("")),
  personalEmail: z.string().email("Invalid personal email").optional().or(z.literal("")),
  phone: z.string().optional(),
  alternatePhone: z.string().optional(),
  dateOfBirth: z.coerce.date().optional(),
  gender: z.nativeEnum(Gender).optional(),
  joiningDate: z.coerce.date(),
  confirmationDate: z.coerce.date().optional(),
  terminationDate: z.coerce.date().optional(),
  designationId: z.string().uuid().optional(),
  departmentId: z.string().uuid().optional(),
  managerId: z.string().uuid().optional(),
  employmentType: z.nativeEnum(EmploymentType),
  status: z.nativeEnum(EmployeeStatus),
  isActive: z.boolean().optional(),
  isDriver: z.boolean().optional(),
  drivingLicenseNumber: z.string().optional(),
  drivingLicenseExpiry: z.coerce.date().optional(),
  profileImageUrl: z.string().url().optional().or(z.literal("")),
  address: z.string().optional(),
  emergencyContactName: z.string().optional(),
  emergencyContactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const updateEmployeeSchema = createEmployeeSchema.partial().extend({
  employeeCode: z.string().optional(), // In case manual override is allowed on update
});
