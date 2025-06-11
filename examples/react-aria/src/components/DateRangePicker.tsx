import { useControl } from '@conform-to/react/future';
import { CalendarDate, parseDate } from '@internationalized/date';
import {
	Button,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DateRangePicker as AriaDateRangePicker,
	DateRangePickerProps as AriaDateRangePickerProps,
	DateSegment,
	DateValue,
	Dialog,
	FieldError,
	Group,
	Heading,
	Label,
	Popover,
	RangeCalendar,
	Text,
} from 'react-aria-components';
import { useRef } from 'react';

import './DateRangePicker.css';

export interface DateRangePickerProps<T extends DateValue>
	extends Omit<
		AriaDateRangePickerProps<T>,
		'defaultValue' | 'value' | 'onChange'
	> {
	label?: string;
	defaultValue?: {
		start?: string | undefined;
		end?: string | undefined;
	};
	description?: string;
	errors?: string[];
}

export function DateRangePicker({
	label,
	description,
	errors,
	firstDayOfWeek,
	startName,
	endName,
	defaultValue,
	...props
}: DateRangePickerProps<CalendarDate>) {
	const labelRef = useRef<HTMLLabelElement>(null);
	const startControl = useControl({
		defaultValue: defaultValue?.start ?? defaultValue?.end,
		onFocus() {
			labelRef.current?.click();
		},
	});
	const endControl = useControl({
		defaultValue: defaultValue?.end ?? defaultValue?.start,
		onFocus() {
			labelRef.current?.click();
		},
	});

	return (
		<>
			<input ref={startControl.register} name={startName} hidden />
			<input ref={endControl.register} name={endName} hidden />
			<AriaDateRangePicker
				{...props}
				value={
					startControl.value && endControl.value
						? {
								start: parseDate(startControl.value),
								end: parseDate(endControl.value),
							}
						: null
				}
				onChange={(value) => {
					startControl.change(value?.start.toString() ?? '');
					endControl.change(value?.end.toString() ?? '');
				}}
				onBlur={() => {
					startControl.blur();
					endControl.blur();
				}}
			>
				<Label ref={labelRef}>{label}</Label>
				<Group>
					<DateInput slot="start">
						{(segment) => <DateSegment segment={segment} />}
					</DateInput>
					<span aria-hidden="true">–</span>
					<DateInput slot="end">
						{(segment) => <DateSegment segment={segment} />}
					</DateInput>
					<Button>▼</Button>
				</Group>
				{description && <Text slot="description">{description}</Text>}
				<FieldError>{errors}</FieldError>
				<Popover>
					<Dialog>
						<RangeCalendar firstDayOfWeek={firstDayOfWeek}>
							<header>
								<Button slot="previous">◀</Button>
								<Heading />
								<Button slot="next">▶</Button>
							</header>
							<CalendarGrid>
								{(date) => <CalendarCell date={date} />}
							</CalendarGrid>
						</RangeCalendar>
					</Dialog>
				</Popover>
			</AriaDateRangePicker>
		</>
	);
}
