import prisma from "../../../config/database.js";
import { BalanceSheetService, PnLService } from "./financial-statements.service.js";
import { TrialBalanceEngine, TrialBalanceParams } from "./trial-balance.engine.js";
import { createHash } from "crypto";

export class FinancialStatementSnapshotService {
  static async createSnapshot(
    organizationId: string,
    statementType: 'BALANCE_SHEET' | 'TRIAL_BALANCE' | 'PROFIT_AND_LOSS',
    params: Omit<TrialBalanceParams, 'organizationId'>
  ) {
    let payload: any;
    
    switch (statementType) {
      case 'TRIAL_BALANCE':
        payload = await TrialBalanceEngine.generate({ organizationId, ...params });
        break;
      case 'BALANCE_SHEET':
        payload = await BalanceSheetService.generate({ organizationId, ...params });
        break;
      case 'PROFIT_AND_LOSS':
        payload = await PnLService.generate({ organizationId, ...params });
        break;
    }

    const payloadStr = JSON.stringify(payload);
    const statementHash = createHash("sha256").update(payloadStr).digest("hex");

    // Persist as immutable JSON payload
    return prisma.financialStatementSnapshot.create({
      data: {
        organizationId,
        statementType,
        fiscalYearId: params.fiscalYearId,
        payload: payload as any,
        generatedBy: "System",
        statementHash,
      }
    });
  }

  static async getSnapshots(organizationId: string, statementType?: string) {
    return prisma.financialStatementSnapshot.findMany({
      where: {
        organizationId,
        ...(statementType && { statementType })
      },
      orderBy: { generatedAt: 'desc' }
    });
  }
}
