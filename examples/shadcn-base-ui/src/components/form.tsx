import { BaseControl, useControl } from '@conform-to/react/future';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { cn } from '../lib/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Checkbox } from './ui/checkbox';
import {
	Combobox,
	ComboboxChip,
	ComboboxChips,
	ComboboxChipsInput,
	ComboboxCollection,
	ComboboxContent,
	ComboboxEmpty,
	ComboboxInput,
	ComboboxItem,
	ComboboxList,
	ComboboxValue,
	useComboboxAnchor,
} from './ui/combobox';
import {
	InputOTP as ShadcnInputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from './ui/input-otp';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { RadioGroup } from './ui/radio-group';
import { Slider } from './ui/slider';
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from './ui/select';
import { Switch } from './ui/switch';

type SharedControlProps = {
	id: string;
	name: string;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
};

type Choice = {
	label: string;
	value: string;
};

function isFocusLeaving(event: React.FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

export function MultiCombobox({
	id,
	name,
	defaultValue = [],
	items,
	...props
}: Omit<SharedControlProps, 'defaultValue'> & {
	defaultValue?: string[];
	items: Choice[];
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const openRef = useRef(false);
	const anchor = useComboboxAnchor();
	const normalizedDefaultValue = defaultValue.filter((value) =>
		items.some((item) => item.value === value),
	);
	const control = useControl({
		defaultValue: normalizedDefaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});
	const selectedItems = items.filter((item) =>
		control.options?.includes(item.value),
	);

	return (
		<>
			<BaseControl
				type="select"
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? []}
				multiple
			/>
			<Combobox
				multiple
				items={items}
				value={selectedItems}
				onValueChange={(nextItems) =>
					control.change(nextItems.map((item) => item.value))
				}
				onOpenChange={(open) => {
					openRef.current = open;
					if (!open) {
						control.blur();
					}
				}}
			>
				<ComboboxChips ref={anchor}>
					<ComboboxValue>
						{(value: Choice[]) =>
							value.map((item) => (
								<ComboboxChip key={item.value}>{item.label}</ComboboxChip>
							))
						}
					</ComboboxValue>
					<ComboboxChipsInput
						ref={inputRef}
						id={id}
						onFocus={control.focus}
						onBlur={() => {
							queueMicrotask(() => {
								if (!openRef.current) {
									control.blur();
								}
							});
						}}
						placeholder="Add interests"
						{...props}
					/>
				</ComboboxChips>
				<ComboboxContent anchor={anchor}>
					<ComboboxEmpty>No interest found.</ComboboxEmpty>
					<ComboboxList>
						<ComboboxCollection>
							{(item: Choice) => (
								<ComboboxItem key={item.value} value={item}>
									{item.label}
								</ComboboxItem>
							)}
						</ComboboxCollection>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</>
	);
}

export function FormCombobox({
	id,
	name,
	defaultValue,
	items,
	...props
}: SharedControlProps & {
	items: Choice[];
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const openRef = useRef(false);
	const normalizedDefaultValue = items.some(
		(item) => item.value === defaultValue,
	)
		? defaultValue
		: '';
	const control = useControl({
		defaultValue: normalizedDefaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});
	const selectedItem =
		items.find((item) => item.value === control.value) ?? null;

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Combobox
				items={items}
				value={selectedItem}
				onValueChange={(item) => control.change(item?.value ?? '')}
				onOpenChange={(open) => {
					openRef.current = open;
					if (!open) {
						control.blur();
					}
				}}
			>
				<ComboboxInput
					ref={inputRef}
					id={id}
					onFocus={control.focus}
					onBlur={() => {
						queueMicrotask(() => {
							if (!openRef.current) {
								control.blur();
							}
						});
					}}
					placeholder="Search countries"
					showClear
					className="w-full"
					{...props}
				/>
				<ComboboxContent>
					<ComboboxEmpty>No country found.</ComboboxEmpty>
					<ComboboxList>
						<ComboboxCollection>
							{(item: Choice) => (
								<ComboboxItem key={item.value} value={item}>
									{item.label}
								</ComboboxItem>
							)}
						</ComboboxCollection>
					</ComboboxList>
				</ComboboxContent>
			</Combobox>
		</>
	);
}

export function FormSelect({
	id,
	name,
	defaultValue,
	items,
	...props
}: SharedControlProps & {
	items: Choice[];
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const openRef = useRef(false);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Select
				items={items}
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
				onOpenChange={(open) => {
					openRef.current = open;
					if (!open) {
						control.blur();
					}
				}}
			>
				<SelectTrigger
					ref={triggerRef}
					id={id}
					onFocus={control.focus}
					onBlur={() => {
						queueMicrotask(() => {
							if (!openRef.current) {
								control.blur();
							}
						});
					}}
					className="w-full"
					{...props}
				>
					<SelectValue placeholder="Select a job" />
				</SelectTrigger>
				<SelectContent align="start">
					{items.map((item) => (
						<SelectItem key={item.value} value={item.value}>
							{item.label}
						</SelectItem>
					))}
				</SelectContent>
			</Select>
		</>
	);
}

export function FormRadioGroup({
	name,
	defaultValue,
	children,
	className,
	...props
}: SharedControlProps & {
	children: ReactNode;
	className?: string;
}) {
	const groupRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const radio =
				groupRef.current?.querySelector<HTMLElement>('[data-checked]') ??
				groupRef.current?.querySelector<HTMLElement>('[role="radio"]');
			radio?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<RadioGroup
				ref={groupRef}
				value={control.value ?? ''}
				onValueChange={control.change}
				onFocus={control.focus}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				className={className}
				{...props}
			>
				{children}
			</RadioGroup>
		</>
	);
}

export function FormSlider({
	id,
	name,
	defaultValue,
	min = 0,
	max = 100,
	step = 1,
	...props
}: SharedControlProps & {
	min?: number;
	max?: number;
	step?: number;
}) {
	const rootRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			rootRef.current
				?.querySelector<HTMLInputElement>('input[type="range"]')
				?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Slider
				ref={rootRef}
				id={id}
				min={min}
				max={max}
				step={step}
				value={[Number(control.value || min)]}
				onValueChange={(value) =>
					control.change(
						(Array.isArray(value) ? value[0] : value)?.toString() ?? '',
					)
				}
				onFocus={control.focus}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				{...props}
			/>
		</>
	);
}

export function FormCheckbox({
	id,
	name,
	defaultChecked,
	value = 'on',
	...props
}: Omit<SharedControlProps, 'defaultValue'> & {
	defaultChecked?: boolean;
	value?: string;
}) {
	const checkboxRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="checkbox"
				name={name}
				value={value}
				ref={control.register}
				defaultChecked={defaultChecked ?? false}
			/>
			<Checkbox
				ref={checkboxRef}
				id={id}
				checked={control.checked}
				onCheckedChange={control.change}
				onFocus={control.focus}
				onBlur={control.blur}
				{...props}
			/>
		</>
	);
}

export function FormSwitch({
	id,
	name,
	defaultChecked,
	value = 'on',
	...props
}: Omit<SharedControlProps, 'defaultValue'> & {
	defaultChecked?: boolean;
	value?: string;
}) {
	const switchRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="checkbox"
				name={name}
				value={value}
				ref={control.register}
				defaultChecked={defaultChecked ?? false}
			/>
			<Switch
				ref={switchRef}
				id={id}
				checked={control.checked}
				onCheckedChange={control.change}
				onFocus={control.focus}
				onBlur={control.blur}
				{...props}
			/>
		</>
	);
}

export function DatePicker({
	id,
	name,
	defaultValue,
	...props
}: SharedControlProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const openRef = useRef(false);
	const [open, setOpen] = useState(false);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});
	const selected = control.value ? new Date(control.value) : undefined;
	function handleOpenChange(nextOpen: boolean) {
		openRef.current = nextOpen;
		setOpen(nextOpen);
		if (nextOpen) {
			control.focus();
		} else {
			control.blur();
		}
	}

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Popover open={open} onOpenChange={handleOpenChange}>
				<PopoverTrigger
					ref={triggerRef}
					render={
						<Button
							id={id}
							type="button"
							onBlur={() => {
								queueMicrotask(() => {
									if (!openRef.current) {
										control.blur();
									}
								});
							}}
							variant="outline"
							className={cn(
								'w-full justify-start font-normal',
								!selected && 'text-muted-foreground',
							)}
						/>
					}
					{...props}
				>
					<CalendarIcon data-icon="inline-start" />
					{selected && !Number.isNaN(selected.getTime())
						? format(selected, 'PPP')
						: 'Pick a date'}
				</PopoverTrigger>
				<PopoverContent align="start" className="w-auto p-0">
					<Calendar
						mode="single"
						selected={selected}
						onSelect={(date) => {
							control.change(date?.toISOString() ?? '');
							handleOpenChange(false);
							triggerRef.current?.focus();
						}}
					/>
				</PopoverContent>
			</Popover>
		</>
	);
}

export function InputOTP({
	id,
	name,
	defaultValue,
	...props
}: SharedControlProps) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<ShadcnInputOTP
				ref={inputRef}
				id={id}
				maxLength={6}
				pattern="^[0-9]+$"
				value={control.value ?? ''}
				onChange={control.change}
				onFocus={control.focus}
				onBlur={control.blur}
				{...props}
			>
				<InputOTPGroup>
					{Array.from({ length: 6 }, (_, index) => (
						<InputOTPSlot key={index} index={index} />
					))}
				</InputOTPGroup>
			</ShadcnInputOTP>
		</>
	);
}
