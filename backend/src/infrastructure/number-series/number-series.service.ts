import { PrismaClient, NumberSeriesResetPolicy } from "@prisma/client";

const prisma = new PrismaClient();

export const numberSeriesService = {
  /**
   * Generates the next sequence number for a given document type.
   */
  generateNextNumber: async (organizationId: string, documentType: string, defaultPrefix: string = "DOC"): Promise<string> => {
    return prisma.$transaction(async (tx) => {
      const now = new Date();
      const currentYear = now.getFullYear().toString();
      const currentMonth = (now.getMonth() + 1).toString().padStart(2, "0");
      
      // Look for the active series configuration for this document type
      let series = await tx.numberSeries.findFirst({
        where: { organizationId, documentType, isActive: true },
        orderBy: { year: "desc" } // Use the most recent year's config if multiple exist
      });

      if (!series) {
        // Auto-initialize if it doesn't exist
        series = await tx.numberSeries.create({
          data: {
            organizationId,
            documentType,
            prefix: defaultPrefix,
            year: currentYear,
            resetPolicy: NumberSeriesResetPolicy.YEARLY,
          }
        });
      }

      // Check if we need to reset the sequence based on policy
      let resetNeeded = false;
      let sequenceYear = series.year;

      if (series.resetPolicy === NumberSeriesResetPolicy.YEARLY) {
        if (series.year !== currentYear) {
          resetNeeded = true;
          sequenceYear = currentYear;
        }
      } else if (series.resetPolicy === NumberSeriesResetPolicy.MONTHLY) {
        const expectedYearMonth = `${currentYear}-${currentMonth}`;
        if (series.year !== expectedYearMonth) {
          resetNeeded = true;
          sequenceYear = expectedYearMonth;
        }
      }

      let targetSeriesId = series.id;
      let nextNum = 1;

      if (resetNeeded) {
        // Create a new series record for the new time period
        const newSeries = await tx.numberSeries.create({
          data: {
            organizationId,
            documentType,
            prefix: series.prefix,
            year: sequenceYear,
            padding: series.padding,
            resetPolicy: series.resetPolicy,
            lastUsedNumber: 1
          }
        });
        targetSeriesId = newSeries.id;
      } else {
        // Increment existing series
        nextNum = series.lastUsedNumber + 1;
        await tx.numberSeries.update({
          where: { id: targetSeriesId },
          data: { lastUsedNumber: nextNum }
        });
      }

      const paddedNum = nextNum.toString().padStart(series.padding, "0");
      
      if (series.resetPolicy === NumberSeriesResetPolicy.NEVER) {
        return `${series.prefix}-${paddedNum}`;
      } else {
        return `${series.prefix}-${sequenceYear}-${paddedNum}`;
      }
    });
  }
};
