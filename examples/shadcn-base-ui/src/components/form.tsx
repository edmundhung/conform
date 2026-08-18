import { BaseControl, useControl } from '@conform-to/react/future';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { useRef, useState, type ReactNode } from 'react';

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

export function MultiCombobox({
	id,
	name,
	defaultValue = [],
	items,
	...props
}: {
	id: string;
	name: string;
	defaultValue?: string[];
	items: Array<{ label: string; value: string }>;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const anchor = useComboboxAnchor();
	const labels = Object.fromEntries(
		items.map((item) => [item.value, item.label]),
	);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			{/* The multiple BaseControl is the only named form control. */}
			<BaseControl
				type="select"
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? []}
				multiple
			/>
			<Combobox
				multiple
				items={items.map((item) => item.value)}
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				itemToStringLabel={(value) => labels[value] ?? value}
			>
				<ComboboxChips ref={anchor}>
					<ComboboxValue>
						{(value: string[]) =>
							value.map((item) => (
								<ComboboxChip key={item}>{labels[item] ?? item}</ComboboxChip>
							))
						}
					</ComboboxValue>
					<ComboboxChipsInput
						ref={inputRef}
						id={id}
						onBlur={() => control.blur()}
						placeholder="Add interests"
						{...props}
					/>
				</ComboboxChips>
				<ComboboxContent anchor={anchor}>
					<ComboboxEmpty>No interest found.</ComboboxEmpty>
					<ComboboxList>
						<ComboboxCollection>
							{(item: string) => (
								<ComboboxItem key={item} value={item}>
									{labels[item] ?? item}
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	items: Array<{ label: string; value: string }>;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const labels = Object.fromEntries(
		items.map((item) => [item.value, item.label]),
	);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			{/* BaseControl is the only named form control. */}
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Combobox
				items={items.map((item) => item.value)}
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
				itemToStringLabel={(value) => labels[value] ?? value}
			>
				<ComboboxInput
					ref={inputRef}
					id={id}
					onBlur={() => control.blur()}
					placeholder="Search countries"
					showClear
					className="w-full"
					{...props}
				/>
				<ComboboxContent>
					<ComboboxEmpty>No country found.</ComboboxEmpty>
					<ComboboxList>
						<ComboboxCollection>
							{(item: string) => (
								<ComboboxItem key={item} value={item}>
									{labels[item] ?? item}
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	items: Array<{ label: string; value: string }>;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	return (
		<>
			{/* BaseControl is the only named form control. */}
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Select
				items={items}
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
			>
				<SelectTrigger
					ref={triggerRef}
					id={id}
					onBlur={() => control.blur()}
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	children: ReactNode;
	className?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
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
			{/* BaseControl is the only named form control. */}
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<RadioGroup
				ref={groupRef}
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	min?: number;
	max?: number;
	step?: number;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
}) {
	const rootRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			// The generated Slider owns its thumb, so delegate focus to its range input.
			rootRef.current
				?.querySelector<HTMLInputElement>('input[type="range"]')
				?.focus();
		},
	});

	return (
		<>
			{/* BaseControl is the only named form control. */}
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
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
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
}: {
	id: string;
	name: string;
	defaultChecked?: boolean;
	value?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
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
			{/* BaseControl is the only named form control. */}
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
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
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
}: {
	id: string;
	name: string;
	defaultChecked?: boolean;
	value?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
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
			{/* BaseControl is the only named form control. */}
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
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
}) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const [open, setOpen] = useState(false);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});
	const selected = control.value ? new Date(control.value) : undefined;

	return (
		<>
			{/* BaseControl is the only named form control. */}
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Popover open={open} onOpenChange={setOpen}>
				<PopoverTrigger
					ref={triggerRef}
					render={
						<Button
							id={id}
							type="button"
							onBlur={() => control.blur()}
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
							setOpen(false);
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
}: {
	id: string;
	name: string;
	defaultValue?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
	'aria-labelledby'?: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});

	return (
		<>
			{/* BaseControl is the only named form control. */}
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
				onChange={(value) => control.change(value)}
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
