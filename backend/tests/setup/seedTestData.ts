import { createTestUser } from "../helpers/auth.helper.js";
import {
  addMember,
  createOrganization,
  getRoleByName,
} from "../helpers/organization.helper.js";

export const seedOrganizationScenario = async () => {
  const owner = await createTestUser({
    name: "Owner User",
    email: "owner@example.com",
  });
  const admin = await createTestUser({
    name: "Admin User",
    email: "admin@example.com",
  });
  const member = await createTestUser({
    name: "Member User",
    email: "member@example.com",
  });
  const outsider = await createTestUser({
    name: "Outsider User",
    email: "outsider@example.com",
  });

  const organization = await createOrganization(owner.id, {
    name: "Acme Workspace",
  });

  const adminMembership = await addMember(organization.id, admin.id, "admin");
  const memberMembership = await addMember(organization.id, member.id, "member");

  return {
    owner,
    admin,
    member,
    outsider,
    organization,
    adminMembership,
    memberMembership,
    ownerRole: await getRoleByName(organization.id, "owner"),
    adminRole: await getRoleByName(organization.id, "admin"),
    memberRole: await getRoleByName(organization.id, "member"),
  };
};
