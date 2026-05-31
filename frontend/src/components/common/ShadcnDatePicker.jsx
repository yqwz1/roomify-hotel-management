import PropTypes from 'prop-types';
import { CalendarRange } from 'lucide-react';
import { format } from 'date-fns';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn } from '@/lib/utils';

const parseIsoDate = (value) => {
  if (!value) return undefined;
  const [year, month, day] = String(value).split('-').map(Number);
  if (!year || !month || !day) return undefined;
  return new Date(year, month - 1, day);
};

const parseIsoMonth = (value) => {
  if (!value) return undefined;
  const [year, month] = String(value).split('-').map(Number);
  if (!year || !month) return undefined;
  return new Date(year, month - 1, 1);
};

const toIsoDate = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const toIsoMonth = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

function HiddenDateValue({ id, value, onChange }) {
  return (
    <Input
      id={id}
      type="text"
      value={value || ''}
      onChange={(event) => onChange(event.target.value)}
      className="sr-only"
      tabIndex={-1}
    />
  );
}

HiddenDateValue.propTypes = {
  id: PropTypes.string.isRequired,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
};

export function ShadcnDatePicker({
  id,
  label,
  value,
  onChange,
  className,
  labelClassName,
  buttonClassName,
  placeholder = 'Select date',
  disabled,
  required,
}) {
  const selectedDate = parseIsoDate(value);

  return (
    <div className={cn('space-y-2 min-w-0', className)}>
      {label ? (
        <Label htmlFor={id} className={cn('text-xs font-black uppercase tracking-[0.18em] text-brand-ink-hint break-words', labelClassName)}>
          {label}
        </Label>
      ) : null}
      <HiddenDateValue id={id} value={value} onChange={onChange} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            aria-required={required}
            className={cn(
              'h-12 w-full min-w-0 justify-between rounded-full border-brand-surface-border bg-brand-surface-light px-4 text-start text-sm font-medium text-brand-ink transition hover:bg-white hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-black/5',
              !selectedDate && 'text-brand-ink-muted',
              buttonClassName
            )}
          >
            <span dir="ltr" className="min-w-0 truncate tabular-nums [unicode-bidi:isolate]">
              {selectedDate ? format(selectedDate, 'dd/MM/yyyy') : placeholder}
            </span>
            <CalendarRange className="ms-3 h-4 w-4 shrink-0 text-brand-ink-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={(date) => {
              if (date) onChange(toIsoDate(date));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

ShadcnDatePicker.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  required: PropTypes.bool,
};

export function ShadcnMonthPicker({
  id,
  label,
  value,
  onChange,
  className,
  labelClassName,
  buttonClassName,
  placeholder = 'Select month',
}) {
  const selectedMonth = parseIsoMonth(value);

  return (
    <div className={cn('flex min-w-0 flex-col gap-2', className)}>
      {label ? (
        <Label htmlFor={id} className={cn('text-sm font-bold text-brand-ink', labelClassName)}>
          {label}
        </Label>
      ) : null}
      <HiddenDateValue id={id} value={value} onChange={onChange} />
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="outline"
            className={cn(
              'h-11 w-full min-w-0 justify-between rounded-2xl border-brand-surface-border bg-white px-4 py-2.5 text-start text-sm font-medium text-brand-ink shadow-sm transition hover:bg-white hover:text-brand-ink focus-visible:ring-2 focus-visible:ring-brand-primary/20',
              !selectedMonth && 'text-brand-ink-muted',
              buttonClassName
            )}
          >
            <span dir="ltr" className="min-w-0 truncate tabular-nums [unicode-bidi:isolate]">
              {selectedMonth ? format(selectedMonth, 'MMMM yyyy') : placeholder}
            </span>
            <CalendarRange className="ms-3 h-4 w-4 shrink-0 text-brand-ink-muted" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={selectedMonth}
            defaultMonth={selectedMonth}
            onSelect={(date) => {
              if (date) onChange(toIsoMonth(date));
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

ShadcnMonthPicker.propTypes = {
  id: PropTypes.string.isRequired,
  label: PropTypes.node,
  value: PropTypes.string,
  onChange: PropTypes.func.isRequired,
  className: PropTypes.string,
  labelClassName: PropTypes.string,
  buttonClassName: PropTypes.string,
  placeholder: PropTypes.string,
};
