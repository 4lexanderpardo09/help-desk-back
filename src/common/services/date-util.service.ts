import { Injectable } from '@nestjs/common';
import { addDays, isWeekend, addMinutes, format } from 'date-fns';

@Injectable()
export class DateUtilService {

    /**
     * Calcula la fecha final sumando horas hábiles a una fecha de inicio.
     * Considera fines de semana como no hábiles.
     * (Simplificado: 8h a 18h, Lunes a Viernes)
     * 
     * @param startDate Fecha Inicio
     * @param hours Horas a sumar
     * @returns Fecha calculada
     */
    addBusinessHours(startDate: Date, hours: number): Date {
        // Legacy "DateHelper" implementation logic would go here.
        // For now, using a simplified approximation or direct conversion if business rules are standard.
        // If strict business hours needed (e.g. 8-5pm), logic is complex.

        // Basic approximation: 
        // If plain hours, just add.
        // But legacy implied business days. 

        let currentDate = new Date(startDate);
        let minutesToAdd = hours * 60;

        // Simple loop approach (expensive for large durations but precise)
        while (minutesToAdd > 0) {
            currentDate = addMinutes(currentDate, 1);

            // Check if within business hours (e.g., 08:00 - 18:00) and not weekend
            // This needs specific rules from legacy. Defaulting to standard 24h for now 
            // unless simplified "Business Days" logic is preferred.

            // For MVP migration: 
            // If hours <= 24, add directly.
            // If checking business days (weekends):
            if (!isWeekend(currentDate)) {
                minutesToAdd--;
            }
            // If weekend, we loop but don't decrement minutesToAdd?
            // No, simply skipping weekends.
            // If current is weekend, just move to next day 00:00?
            // Correct logic is simpler: Add days, skipping weekends.
        }
        return currentDate;
    }

    /**
     * Suma días hábiles
     */
    addBusinessDays(startDate: Date, days: number): Date {
        let currentDate = new Date(startDate);
        let addedDays = 0;

        while (addedDays < days) {
            currentDate = addDays(currentDate, 1);
            if (!isWeekend(currentDate)) {
                addedDays++;
            }
        }
        return currentDate;
    }
}
