import { Injectable } from "@nestjs/common";
import { CategorisationService } from "../categorisation/categorisation.service";
import { EventsGateway } from "../events/events.gateway";
import { NotificationService } from "../notification/notification.service";
import { PrismaService } from "../prisma/prisma.service";

@Injectable()
export class ImportService {
    constructor(
        private prisma: PrismaService,
        private eventsGateway: EventsGateway,
        private notificationService: NotificationService,
        private categorizationService: CategorisationService,
    ) {}

      // Vytvori uvodni zaznam v DB
  async createImportJob(userId: string, initialData: any[]) {
    return this.prisma.importJob.create({
      data: {
        userId,
        status: 'PROCESSING',
        data: initialData,
      },
    });
  }

  // Toto bezi odpojene na pozadi
  async processJobInBackground(
    jobId: string,
    userId: string,
    incomingTransactions: any[],
  ) {
    console.log(
      `[Import ${jobId}] 🚀 Starting background processing for user ${userId} with ${incomingTransactions.length} transactions`,
    );
    try {
      const processedData = await this.categorizationService.categorise(
        userId,
        incomingTransactions,
        true, // useAi - TODO: make this come from rq dto
      );

      console.log(
        `[Import ${jobId}] 💾 Saving ${processedData.length} processed transactions to DB (status: READY_FOR_REVIEW)`,
      );
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'READY_FOR_REVIEW',
          data: processedData as any,
        },
      });

      // Persistent DB notification (must be created BEFORE the WS event,
      // because the frontend fetches notifications when it receives the event)
      await this.notificationService.create(
        userId,
        'IMPORT_READY',
        `Import dokončen (${processedData.length} transakcí)`,
        'Transakce byly analyzovány a čekají na vaše schválení.',
        { jobId },
      );

      // WS
      console.log(
        `[Import ${jobId}] 📡 Emitting import_finished (success) via WebSocket`,
      );
      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'success',
        jobId: jobId,
        data: processedData,
      });
      console.log(`[Import ${jobId}] ✅ Import completed successfully`);
    } catch (error) {
      console.error(`[Import ${jobId}] ❌ Error processing job:`, error);
      await this.prisma.importJob.update({
        where: { id: jobId },
        data: {
          status: 'FAILED',
        },
      });

      this.eventsGateway.emitToUser(userId, 'import_finished', {
        status: 'error',
        jobId: jobId,
        message: 'An error occurred during processing. Please try again later.',
      });
    }
  }

  // FE se timto zepta, zda na nej po refreshi nebo během pollingu neco ceka
  async getPendingJobForUser(userId: string, jobId?: string) {
    const whereClause: any = {
      userId,
      status: 'READY_FOR_REVIEW',
    };
    if (jobId) {
      whereClause.id = jobId;
    }

    const job = await this.prisma.importJob.findFirst({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    if (!job) return null;

    return {
      jobId: job.id,
      transactions: job.data,
    };
  }

  async deleteJob(userId: string, jobId: string) {
    await this.prisma.importJob.deleteMany({
      where: { id: jobId, userId },
    });
    return { success: true };
  }
}