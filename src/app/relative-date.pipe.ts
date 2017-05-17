import { Pipe, PipeTransform } from '@angular/core';
/*
 * Convert Date object to string relativeDate representation.
 * Takes a today date as a base for relativeDate.
 * Works only with past dates for now. 
 * Does not work with different timezones. I don't modify timezone for input "today" value in order to set the same timezone!
 * Usage:
 *   value | relativeDate: today
 * Example:
 *   {{ "Fri Dec 09 2016 12:33:44 GMT+0300 (+03)" | relativeDate}}
 *   formats to: 6 months ago
*/
@Pipe({ name: 'relativeDate' })
export class RelativeDatePipe implements PipeTransform {
    transform(value: Date, today: Date): string {
        if (!today) {
            today = new Date;
            today.setTime(today.getTime() - (today.getTimezoneOffset() - value.getTimezoneOffset()) * 60 * 1000);
        }
        const diff = today.getTime() - value.getTime();
        if (diff < 0) {
            return 'Future';
        }

        const years = today.getFullYear() - value.getFullYear();
        if (years) {
            if (years === 1) {
                return 'Previous Year';
            }
            return `${years} Years ago`;
        }

        const months = today.getMonth() - value.getMonth();
        if (months) {
            if (months === 1) {
                return 'Previous Month';
            }
            return `${months} Months ago`;
        }

        const days = today.getDay() - value.getDay();
        if (days) {
            if (days === 1) {
                return 'Yesterday';
            }
            return `${days} Days ago`;
        }

        return 'Today';
    }
}