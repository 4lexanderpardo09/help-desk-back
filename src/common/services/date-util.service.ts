import { Injectable } from '@nestjs/common';
import { addDays, isWeekend, addHours, isSaturday, isSunday } from 'date-fns';

/**
 * Servicio de Utilidades de Fecha (DateHelper).
 * * Provee métodos para manipulación de fechas considerando reglas de negocio
 * básicas, principalmente la exclusión de fines de semana (Sábados y Domingos).
 */
@Injectable()
export class DateUtilService {

    /**
     * Calcula una fecha final sumando una cantidad de horas hábiles.
     * * Lógica simplificada para migración MVP:
     * 1. Suma las horas solicitadas a la fecha actual.
     * 2. Si el resultado cae en fin de semana, lo mueve al siguiente Lunes a la misma hora.
     * * * Nota: No contempla festivos ni horarios de oficina (ej. 8am-6pm) en esta versión.
     * Para cálculo estricto de horas laborales, se requiere una lógica iterativa más compleja.
     * * @param startDate Fecha y hora de inicio.
     * @param hours Cantidad de horas a sumar.
     * @returns Fecha calculada, garantizando que no sea fin de semana.
     */
    addBusinessHours(startDate: Date, hours: number): Date {
        // 1. Suma directa de horas
        let finalDate = addHours(startDate, hours);

        // 2. Ajuste si cae en fin de semana
        if (isWeekend(finalDate)) {
            if (isSaturday(finalDate)) {
                // Si es Sábado, sumar 2 días para llegar al Lunes
                finalDate = addDays(finalDate, 2);
            } else if (isSunday(finalDate)) {
                // Si es Domingo, sumar 1 día para llegar al Lunes
                finalDate = addDays(finalDate, 1);
            }
        }

        return finalDate;
    }

    /**
     * Calcula una fecha final sumando días hábiles (Business Days).
     * * Omite Sábados y Domingos del conteo.
     * * Ejemplo: Si sumas 2 días hábiles a un Viernes, el resultado será el Martes.
     * * @param startDate Fecha de inicio.
     * @param days Cantidad de días hábiles a sumar.
     * @returns Fecha resultante saltando fines de semana.
     */
    addBusinessDays(startDate: Date, days: number): Date {
        let currentDate = new Date(startDate);
        let addedDays = 0;

        // Bucle hasta completar los días requeridos
        while (addedDays < days) {
            // Avanzamos un día natural
            currentDate = addDays(currentDate, 1);

            // Solo incrementamos el contador si NO es fin de semana
            if (!isWeekend(currentDate)) {
                addedDays++;
            }
        }
        return currentDate;
    }
}