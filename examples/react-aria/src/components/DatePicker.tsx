import { useControl } from '@conform-to/react/future';
import { parseDateTime, CalendarDateTime } from '@internationalized/date';
import {
	Button,
	Calendar,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DatePicker as AriaDatePicker,
	DatePickerProps as AriaDatePickerProps,
	DateSegment,
	DateValue,
	Dialog,
	FieldError,
	Group,
	Heading,
	Label,
	Popover,
	Text,
} from 'react-aria-components';

import './DatePicker.css';
import { useRef } from 'react';

export interface DatePickerProps<T extends DateValue> extends Omit<
	AriaDatePickerProps<T>,
	'defaultValue' | 'value' | 'onChange'
> {
	label?: string;
	description?: string;
	defaultValue?: string | undefined;
	errors?: string[];
}

// Conform serializes a `Date` default via `toISOString()`, which produces a
// Z-suffixed string (e.g. `2025-04-01T00:00:00.000Z`) that `parseDateTime`
// rejects. Drop the suffix so the value conform produced can be parsed back.
function parseDate(value: string): CalendarDateTime {
	return parseDateTime(value.replace(/Z$/, ''));
}

export function DatePicker({
	label,
	name,
	description,
	defaultValue,
	errors,
	firstDayOfWeek,
	...props
}: DatePickerProps<CalendarDateTime>) {
	const labelRef = useRef<HTMLLabelElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			labelRef.current?.click();
		},
	});

	return (
		<AriaDatePicker
			{...props}
			value={control.value ? parseDate(control.value) : null}
			onChange={(value) => control.change(value?.toString() ?? '')}
			onBlur={() => control.blur()}
		>
			<Label ref={labelRef}>{label}</Label>
			<Group>
				<DateInput>{(segment) => <DateSegment segment={segment} />}</DateInput>
				<Button>▼</Button>
			</Group>
			{description && <Text slot="description">{description}</Text>}
			<FieldError>{errors}</FieldError>
			<Popover>
				<Dialog>
					<Calendar firstDayOfWeek={firstDayOfWeek}>
						<header>
							<Button slot="previous">◀</Button>
							<Heading />
							<Button slot="next">▶</Button>
						</header>
						<CalendarGrid>
							{(date) => <CalendarCell date={date} />}
						</CalendarGrid>
					</Calendar>
				</Dialog>
			</Popover>
			<input ref={control.register} name={name} hidden />
		</AriaDatePicker>
	);
}
