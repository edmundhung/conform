import { useControl } from '@conform-to/react/future';
import { parseDateTime, CalendarDateTime } from '@internationalized/date';
import {
	Button,
	Calendar,
	CalendarCell,
	CalendarGrid,
	DateInput,
	DatePicker as AriaDatePicker,
	DateSegment,
	Dialog,
	FieldError,
	Group,
	Heading,
	Label,
	Popover,
	Text,
} from 'react-aria-components';
import type {
	DatePickerProps as AriaDatePickerProps,
	DateValue,
} from 'react-aria-components';

import './DatePicker.css';
import { useCallback, useRef } from 'react';

export interface DatePickerProps<T extends DateValue> extends Omit<
	AriaDatePickerProps<T>,
	'defaultValue' | 'value' | 'onChange'
> {
	label?: string;
	description?: string;
	defaultValue?: string | undefined;
	errors?: string[];
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
	const groupRef = useRef<HTMLDivElement>(null);
	const focusFirstSegment = useCallback(() => {
		groupRef.current
			?.querySelector<HTMLElement>('[role="spinbutton"]')
			?.focus();
	}, []);
	const control = useControl({
		defaultValue,
		onFocus: focusFirstSegment,
	});

	return (
		<AriaDatePicker
			{...props}
			value={control.value ? parseDateTime(control.value) : null}
			onChange={(value) => control.change(value?.toString() ?? '')}
			onBlur={() => control.blur()}
		>
			<Label>{label}</Label>
			<Group ref={groupRef}>
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
