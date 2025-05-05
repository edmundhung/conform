import { useControl } from '@conform-to/react';
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

export interface DatePickerProps<T extends DateValue>
	extends Omit<AriaDatePickerProps<T>, 'defaultValue' | 'value' | 'onChange'> {
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
	const control = useControl({ defaultValue });

	return (
		<AriaDatePicker
			{...props}
			value={control.value ? parseDateTime(control.value) : null}
			onChange={(value) => control.change(value?.toString() ?? '')}
		>
			<Label>{label}</Label>
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
			<input
				ref={control.register}
				name={name}
				defaultValue={defaultValue}
				hidden
			/>
		</AriaDatePicker>
	);
}
