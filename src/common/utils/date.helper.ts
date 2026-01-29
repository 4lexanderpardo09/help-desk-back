import { addDays, isWeekend, format, parseISO } from 'date-fns';

export class DateHelper {
    // Colombian Holidays 2025 (Migrated from Legacy)
    // TODO: Ideally this should be a configuration or database table
    private static readonly HOLIDAYS_2025 = [
        '2025-01-01',
        '2025-01-06',
        '2025-03-24',
        '2025-04-17',
        '2025-04-18',
        '2025-05-01',
        '2025-06-02',
        '2025-06-23',
        '2025-06-30',
        '2025-07-20',
        '2025-08-07',
        '2025-08-18',
        '2025-10-13',
        '2025-11-03',
        '2025-11-17',
        '2025-12-08',
        '2025-12-25'
    ];

    /**
     * Calculates the deadline by adding business days to a start date.
     * Skips weekends (Saturday/Sunday) and defined holidays.
     * 
     * @param startDate The starting date
     * @param businessDays The number of business days to add
     * @returns The resulting deadline date
     */
    static addBusinessDays(startDate: Date, businessDays: number): Date {
        let currentDate = new Date(startDate);
        let addedDays = 0;

        // 1. Normalize Start Date: If starting on a non-business day, move to next business day
        // This matches the legacy logic: "Si el ticket se abre en fin de semana o festivo, la cuenta empieza desde el siguiente día hábil"
        while (!this.isBusinessDay(currentDate)) {
            currentDate = addDays(currentDate, 1);
        }

        // 2. Add Business Days
        while (addedDays < businessDays) {
            currentDate = addDays(currentDate, 1);
            if (this.isBusinessDay(currentDate)) {
                addedDays++;
            }
        }

        return currentDate;
    }

    /**
     * Checks if a specific date is a business day (not weekend, not holiday).
     */
    private static isBusinessDay(date: Date): boolean {
        // Check Weekend (date-fns isWeekend: Sat/Sun)
        if (isWeekend(date)) return false;

        // Check Holidays
        const dateString = format(date, 'yyyy-MM-dd');
        if (this.HOLIDAYS_2025.includes(dateString)) return false;

        return true;
    }
}
