import PropTypes from 'prop-types';
import { useTranslation } from 'react-i18next';
import { format, parseISO } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

/**
 * DateRangePicker
 * Controlled component for selecting a check-in and check-out date.
 * Shows an inline error when check-out is before check-in.
 *
 * Props:
 *   checkIn           {string}    – ISO date string (YYYY-MM-DD) for check-in.
 *   checkOut          {string}    – ISO date string (YYYY-MM-DD) for check-out.
 *   onCheckInChange   {Function}  – (value: string) => void
 *   onCheckOutChange  {Function}  – (value: string) => void
 */
export default function DateRangePicker({ checkIn, checkOut, onCheckInChange, onCheckOutChange }) {
    const { t } = useTranslation();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const isInvalid = checkIn && checkOut && checkOut < checkIn;

    const parsedCheckIn = checkIn ? parseISO(checkIn) : undefined;
    const parsedCheckOut = checkOut ? parseISO(checkOut) : undefined;

    const handleCheckInSelect = (date) => {
        if (date) {
            // Adjust for local timezone before converting to string
            const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
            onCheckInChange(localDate.toISOString().split('T')[0]);
        } else {
             onCheckInChange('');
        }
    };

    const handleCheckOutSelect = (date) => {
        if (date) {
             const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
             onCheckOutChange(localDate.toISOString().split('T')[0]);
        } else {
             onCheckOutChange('');
        }
    };


    return (
        <div className="flex min-w-0 flex-col gap-3 sm:flex-row sm:items-end sm:gap-4">
            {/* Check-In */}
            <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="check-in-date" className="text-xs font-bold uppercase tracking-wide text-brand-ink-muted">
                    {t('checkInLabel')}
                </label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="check-in-date"
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[200px] justify-start text-start font-normal rounded-full border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm text-brand-ink hover:bg-white hover:border-black focus:ring-2 focus:ring-black/5",
                                !checkIn && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="me-2 h-4 w-4 shrink-0" />
                            {parsedCheckIn ? format(parsedCheckIn, "PPP") : <span>{t('checkInLabel')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={parsedCheckIn}
                            onSelect={handleCheckInSelect}
                            disabled={(date) => date < today}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Arrow separator */}
            <span className="hidden self-center text-brand-ink-hint sm:block mb-3 break-words" aria-hidden="true">→</span>

            {/* Check-Out */}
            <div className="flex min-w-0 flex-col gap-1">
                <label htmlFor="check-out-date" className="text-xs font-bold uppercase tracking-wide text-brand-ink-muted">
                    {t('checkOutLabel')}
                </label>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            id="check-out-date"
                            variant={"outline"}
                            className={cn(
                                "w-full sm:w-[200px] justify-start text-start font-normal rounded-full border-brand-surface-border bg-brand-surface-light px-4 py-3 text-sm text-brand-ink hover:bg-white hover:border-black focus:ring-2 focus:ring-black/5",
                                isInvalid && "border-brand-danger focus:border-brand-danger focus:ring-brand-danger/20",
                                !checkOut && "text-muted-foreground"
                            )}
                        >
                            <CalendarIcon className="me-2 h-4 w-4 shrink-0" />
                            {parsedCheckOut ? format(parsedCheckOut, "PPP") : <span>{t('checkOutLabel')}</span>}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                            mode="single"
                            selected={parsedCheckOut}
                            onSelect={handleCheckOutSelect}
                            disabled={(date) => date < (parsedCheckIn || today)}
                            initialFocus
                        />
                    </PopoverContent>
                </Popover>
            </div>

            {/* Validation message */}
            {isInvalid && (
                <p className="text-xs font-medium text-brand-danger sm:self-end sm:pb-2 break-words" role="alert">
                    {t('checkoutAfterCheckin')}
                </p>
            )}
        </div>
    );
}

DateRangePicker.propTypes = {
    checkIn: PropTypes.string,
    checkOut: PropTypes.string,
    onCheckInChange: PropTypes.func.isRequired,
    onCheckOutChange: PropTypes.func.isRequired,
};
