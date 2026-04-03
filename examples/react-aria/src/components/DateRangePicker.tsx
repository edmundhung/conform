import { BaseControl, useControl } from '@conform-to/react/future';
import { coerceStructure } from '@conform-to/zod/v3/future';
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
import { z } from 'zod';

export const dateRangeSchema = z.object({
	start: z.string(),
	end: z.string(),
});

export interface DateRangePickerProps<T extends DateValue>
	extends Omit<
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
	...props
}: DateRangePickerProps<CalendarDate>) {
	const labelRef = useRef<HTMLLabelElement>(null);
	const control = useControl({
		defaultValue,
		parse(payload) {
			try {
				const range = coerceStructure(dateRangeSchema).parse(payload);

				return {
					start: parseDate(range.start),
					end: parseDate(range.end),
				};
			} catch {
				return;
			}
		},
		serialize(value) {
			return {
				start: value.start.toString(),
				end: value.end.toString(),
			};
		},
		onFocus() {
			labelRef.current?.click();
		},
	});

	return (
		<>
			<BaseControl
				type="fieldset"
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue}
			/>
			<AriaDateRangePicker
				{...props}
				value={control.payload ?? null}
				onChange={(value) => control.change(value)}
				onBlur={() => {
					control.blur();
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
