import { BaseControl, useControl } from '@conform-to/react/future';
import { coerceStructure } from '@conform-to/zod/v4/future';
import { CalendarDate, parseDate } from '@internationalized/date';
import {
	Button,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DateRangePicker as AriaDateRangePicker,
	DateSegment,
	Dialog,
	FieldError,
	Group,
	Heading,
	Label,
	Popover,
	RangeCalendar,
	Text,
} from 'react-aria-components';
import type {
	DateRangePickerProps as AriaDateRangePickerProps,
	DateValue,
} from 'react-aria-components';
import { useCallback, useRef } from 'react';

import './DateRangePicker.css';
import { z } from 'zod';

const dateRangeSchema = z.object({
	start: z.string(),
	end: z.string(),
});

export interface DateRangePickerProps<T extends DateValue> extends Omit<
	AriaDateRangePickerProps<T>,
	'defaultValue' | 'value' | 'onChange'
> {
	label?: string;
	name: string;
	defaultValue?: unknown;
	description?: string;
	errors?: string[];
}

export function DateRangePicker({
	label,
	description,
	errors,
	firstDayOfWeek,
	name,
	defaultValue,
	onBlur,
	...props
}: DateRangePickerProps<CalendarDate>) {
	const groupRef = useRef<HTMLDivElement>(null);
	const focusFirstSegment = useCallback(() => {
		groupRef.current
			?.querySelector<HTMLElement>('[role="spinbutton"]')
			?.focus();
	}, []);
	const defaultRange = coerceStructure(dateRangeSchema).safeParse(defaultValue);
	const start = useControl({
		defaultValue: defaultRange.success ? defaultRange.data.start : undefined,
		onFocus: focusFirstSegment,
	});
	const end = useControl({
		defaultValue: defaultRange.success ? defaultRange.data.end : undefined,
		onFocus: focusFirstSegment,
	});
	const value =
		start.value && end.value
			? { start: parseDate(start.value), end: parseDate(end.value) }
			: null;

	return (
		<>
			<BaseControl
				name={`${name}.start`}
				ref={start.register}
				defaultValue={start.defaultValue ?? ''}
			/>
			<BaseControl
				name={`${name}.end`}
				ref={end.register}
				defaultValue={end.defaultValue ?? ''}
			/>
			<AriaDateRangePicker
				{...props}
				value={value}
				onChange={(nextValue) => {
					start.change(nextValue?.start.toString() ?? '');
					end.change(nextValue?.end.toString() ?? '');
				}}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						start.blur();
						end.blur();
					}
					onBlur?.(event);
				}}
			>
				<Label>{label}</Label>
				<Group ref={groupRef}>
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
