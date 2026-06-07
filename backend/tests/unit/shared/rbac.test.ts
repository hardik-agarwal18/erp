import { SYSTEM_ROLE_PERMISSIONS } from "../../../src/shared/constants/rbac.js";
import { PERMISSIONS } from "../../../src/shared/constants/permissions.js";

describe("Phase 5B RBAC Permission Integrity", () => {
  it("should snapshot the owner permissions and retain all expected granular capabilities", () => {
    const ownerPerms = SYSTEM_ROLE_PERMISSIONS.owner;
    expect(ownerPerms).toContain(PERMISSIONS.ORGANIZATION_UPDATE);
    expect(ownerPerms).toContain(PERMISSIONS.OWNERSHIP_TRANSFER);
    expect(ownerPerms).toContain(PERMISSIONS.ORGANIZATION_DELETE);
    expect(ownerPerms).toMatchSnapshot();
  });

  it("should snapshot the admin permissions", () => {
    const adminPerms = SYSTEM_ROLE_PERMISSIONS.admin;
    expect(adminPerms).toContain(PERMISSIONS.MEMBER_INVITE);
    expect(adminPerms).toContain(PERMISSIONS.MEMBER_REMOVE);
    expect(adminPerms).toContain(PERMISSIONS.AUDIT_READ);
    expect(adminPerms).not.toContain(PERMISSIONS.OWNERSHIP_TRANSFER);
    expect(adminPerms).toMatchSnapshot();
  });

  it("should snapshot the manager permissions", () => {
    const managerPerms = SYSTEM_ROLE_PERMISSIONS.manager;
    expect(managerPerms).toContain(PERMISSIONS.MEMBER_INVITE);
    expect(managerPerms).toContain(PERMISSIONS.INVENTORY_UPDATE);
    expect(managerPerms).not.toContain(PERMISSIONS.AUDIT_READ);
    expect(managerPerms).not.toContain(PERMISSIONS.MEMBER_REMOVE);
    expect(managerPerms).toMatchSnapshot();
  });

  it("should snapshot the member permissions", () => {
    const memberPerms = SYSTEM_ROLE_PERMISSIONS.member;
    expect(memberPerms).toContain(PERMISSIONS.ORGANIZATION_VIEW);
    expect(memberPerms).not.toContain(PERMISSIONS.MEMBER_INVITE);
    expect(memberPerms).not.toContain(PERMISSIONS.INVOICES_UPDATE);
    expect(memberPerms).toMatchSnapshot();
  });
});
