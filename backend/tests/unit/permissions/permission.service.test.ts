import { jest } from "@jest/globals";

jest.mock("../../../src/config/database.js", () => ({
  __esModule: true,
  default: {
    permission: {
      findMany: jest.fn(),
    }
  }
}));

import { permissionService } from "../../../src/modules/permissions/permission.service.js";
import prisma from "../../../src/config/database.js";

describe("permissionService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("should list permissions ordered by name", async () => {
    (prisma.permission.findMany as jest.Mock).mockResolvedValue([{ id: "p1", name: "admin.full" }]);

    const result = await permissionService.listPermissions();

    expect(prisma.permission.findMany).toHaveBeenCalledWith({
      where: {
        NOT: { name: { contains: "_legacy" } },
      },
      orderBy: { name: "asc" }
    });
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("admin.full");
  });
});
