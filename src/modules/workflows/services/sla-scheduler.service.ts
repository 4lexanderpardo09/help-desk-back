import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { SlaService } from './sla.service';

@Injectable()
export class SlaSchedulerService {
    private readonly logger = new Logger(SlaSchedulerService.name);

    constructor(private readonly slaService: SlaService) { }

    @Cron(process.env.SLA_CHECK_CRON || CronExpression.EVERY_5_MINUTES)
    async handleCron() {
        this.logger.debug('Checking for overdue tickets (SLA check)...');

        try {
            const overdueTickets = await this.slaService.findOverdueTickets();

            if (overdueTickets.length > 0) {
                this.logger.log(`Found ${overdueTickets.length} overdue tickets. Processing...`);

                for (const ticket of overdueTickets) {
                    await this.slaService.processOverdueTicket(ticket);
                }
            }
        } catch (error) {
            this.logger.error('Error in SLA Scheduler', error.stack);
        }
    }
}
