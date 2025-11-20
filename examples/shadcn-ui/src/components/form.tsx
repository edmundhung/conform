import { format } from 'date-fns';
import {
	Calendar as CalendarIcon,
	Check as CheckIcon,
	ChevronsUpDown as ChevronsUpDownIcon,
} from 'lucide-react';
import { useRef } from 'react';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import {
	RadioGroup as ShadcnRadioGroup,
	RadioGroupItem,
} from './ui/radio-group';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './ui/command';
import {
	SelectTrigger,
	Select as ShadcnSelect,
	SelectValue,
	SelectContent,
	SelectItem,
} from './ui/select';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
	InputOTP as ShadcnInputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from './ui/input-otp';
import {
	ToggleGroup as ShadcnToggleGroup,
	ToggleGroupItem,
} from './ui/toggle-group';
import { Switch as ShadcnSwitch } from './ui/switch';
import { Slider as ShadcnSlider } from './ui/slider';
import { Checkbox as ShadcnCheckbox } from './ui/checkbox';
import { cn } from '../lib/utils';
import { useControl } from '@conform-to/react/future';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

type FieldProps = {
	children: React.ReactNode;
	role?: string;
	['aria-labelledby']?: string;
};

function Field({
	role,
	children,
	'aria-labelledby': ariaLabelledby,
}: FieldProps) {
	return (
		<div
			className="flex flex-col gap-2"
			role={role}
			aria-labelledby={ariaLabelledby}
		>
			{children}
		</div>
	);
}

export type FieldErrorProps = {
	id?: string;
	children: React.ReactNode;
};

function FieldError({ id, children }: FieldErrorProps) {
	return (
		<div id={id} className="text-sm text-red-600">
			{children}
		</div>
	);
}

export type DatePickerProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function DatePicker({ name, defaultValue, ...props }: DatePickerProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<Popover
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<PopoverTrigger asChild>
					<Button
						{...props}
						ref={triggerRef}
						variant={'outline'}
						className={cn(
							'w-64 justify-start text-left font-normal focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
							!control.value && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{control.value ? (
							format(control.value, 'PPP')
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						mode="single"
						selected={new Date(control.value ?? '')}
						onSelect={(value) => control.change(value?.toISOString() ?? '')}
						initialFocus
					/>
				</PopoverContent>
			</Popover>
		</>
	);
}

const countries = [
	{ label: 'Afghanistan', value: 'AF' },
	{ label: 'Åland Islands', value: 'AX' },
	{ label: 'Albania', value: 'AL' },
	{ label: 'Algeria', value: 'DZ' },
	{ label: 'Italy', value: 'IT' },
	{ label: 'Jamaica', value: 'JM' },
	{ label: 'Japan', value: 'JP' },
	{ label: 'United States', value: 'US' },
	{ label: 'Uruguay', value: 'UY' },
];

export type ComboboxProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function ComboBox({ name, defaultValue, ...props }: ComboboxProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<Popover
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<PopoverTrigger asChild>
					<Button
						{...props}
						ref={triggerRef}
						variant="outline"
						role="combobox"
						className={cn(
							'w-[200px] justify-between',
							!control.value && 'text-muted-foreground',
							'focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
						)}
					>
						{control.value
							? countries.find((country) => country.value === control.value)
									?.label
							: 'Select country'}
						<ChevronsUpDownIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder="Search country..." />
						<CommandList>
							<CommandEmpty>No country found.</CommandEmpty>
							<CommandGroup>
								{countries.map((country) => (
									<CommandItem
										value={country.label}
										key={country.value}
										onSelect={() => {
											control.change(country.value);
										}}
									>
										<CheckIcon
											className={cn(
												'mr-2 h-4 w-4',
												country.value === control.value
													? 'opacity-100'
													: 'opacity-0',
											)}
										/>
										{country.label}
									</CommandItem>
								))}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
}

export type RadioGroupProps = {
	id?: string;
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function RadioGroup({
	id,
	name,
	items,
	defaultValue,
	['aria-describedby']: ariaDescribedBy,
}: RadioGroupProps) {
	const radioGroupRef = useRef<React.ElementRef<typeof ShadcnRadioGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			radioGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<ShadcnRadioGroup
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
				aria-labelledby={id}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadioGroupItem
								id={`${id}-${item.value}`}
								value={item.value}
								aria-describedby={ariaDescribedBy}
							/>
							<label htmlFor={`${id}-${item.value}`}>{item.label}</label>
						</div>
					);
				})}
			</ShadcnRadioGroup>
		</>
	);
}

export type CheckboxProps = {
	id?: string;
	name: string;
	value?: string;
	defaultChecked?: boolean;
	['aria-describedby']?: string;
};

function Checkbox({ name, value, defaultChecked, ...props }: CheckboxProps) {
	const checkboxRef = useRef<React.ElementRef<typeof ShadcnCheckbox>>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" ref={control.register} name={name} hidden />
			<ShadcnCheckbox
				{...props}
				ref={checkboxRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

export type SelectProps = {
	id?: string;
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder: string;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function Select({
	name,
	items,
	placeholder,
	defaultValue,
	...props
}: SelectProps) {
	const selectRef = useRef<React.ElementRef<typeof SelectTrigger>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			selectRef.current?.focus();
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<ShadcnSelect
				value={control.value}
				onValueChange={(value) => control.change(value)}
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<SelectTrigger {...props} ref={selectRef}>
					<SelectValue placeholder={placeholder} />
				</SelectTrigger>
				<SelectContent>
					{items.map((item) => {
						return (
							<SelectItem key={item.value} value={item.value}>
								{item.name}
							</SelectItem>
						);
					})}
				</SelectContent>
			</ShadcnSelect>
		</>
	);
}

export type SliderProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function Slider({ name, defaultValue, ...props }: SliderProps) {
	const sliderRef = useRef<React.ElementRef<typeof ShadcnSlider>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const sliderSpan = sliderRef.current?.querySelector('[role="slider"]');
			if (sliderSpan instanceof HTMLElement) {
				sliderSpan.focus();
			}
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<div className="flex items-center gap-4">
				<ShadcnSlider
					{...props}
					ref={sliderRef}
					step={1}
					value={[control.value ? parseFloat(control.value) : 0]}
					onValueChange={(numbers) => {
						control.change(numbers[0]?.toString());
					}}
					onBlur={() => control.blur()}
					className="w-[280px]"
				/>
				<div>{control.value}</div>
			</div>
		</>
	);
}

export type SwitchProps = {
	id?: string;
	name: string;
	value?: string;
	defaultChecked?: boolean;
	['aria-describedby']?: string;
};

function Switch({ name, value, defaultChecked, ...props }: SwitchProps) {
	const switchRef = useRef<React.ElementRef<typeof ShadcnSwitch>>(null);
	const control = useControl({
		defaultChecked,
		value,
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" name={name} ref={control.register} hidden />
			<ShadcnSwitch
				{...props}
				ref={switchRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

export type SingleToggleGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
};

function SingleToggleGroup({
	name,
	items,
	defaultValue,
	['aria-labelledby']: ariaLabelledby,
	['aria-describedby']: ariaDescribedBy,
}: SingleToggleGroupProps) {
	const toggleGroupRef =
		useRef<React.ElementRef<typeof ShadcnToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			toggleGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<ShadcnToggleGroup
				type="single"
				ref={toggleGroupRef}
				value={control.value}
				onValueChange={(value) => {
					control.change(value);
				}}
				onBlur={() => control.blur()}
				aria-labelledby={ariaLabelledby}
			>
				{items.map((item) => (
					<ToggleGroupItem
						key={item.value}
						value={item.value}
						aria-describedby={ariaDescribedBy}
					>
						{item.label}
					</ToggleGroupItem>
				))}
			</ShadcnToggleGroup>
		</>
	);
}

export type MultiToggleGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string[];
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
};

function MultiToggleGroup({
	name,
	items,
	defaultValue,
	['aria-labelledby']: ariaLabelledby,
	['aria-describedby']: ariaDescribedBy,
}: MultiToggleGroupProps) {
	const toggleGroupRef =
		useRef<React.ElementRef<typeof ShadcnToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			toggleGroupRef.current?.focus();
		},
	});

	return (
		<>
			<select multiple name={name} ref={control.register} hidden />
			<ShadcnToggleGroup
				type="multiple"
				ref={toggleGroupRef}
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
				aria-labelledby={ariaLabelledby}
			>
				{items.map((item) => (
					<ToggleGroupItem
						key={item.value}
						value={item.value}
						aria-describedby={ariaDescribedBy}
					>
						{item.label}
					</ToggleGroupItem>
				))}
			</ShadcnToggleGroup>
		</>
	);
}

export type InputOTPProps = {
	id?: string;
	name: string;
	length: number;
	pattern?: string;
	defaultValue?: string;
	['aria-describedby']?: string;
};

function InputOTP({
	id,
	name,
	length = 6,
	pattern = REGEXP_ONLY_DIGITS_AND_CHARS,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
}: InputOTPProps) {
	const inputOTPRef = useRef<React.ElementRef<typeof ShadcnInputOTP>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputOTPRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<ShadcnInputOTP
				id={id}
				ref={inputOTPRef}
				value={control.value}
				onChange={(value) => control.change(value)}
				onBlur={() => {
					// InputOTP calls the onBlur handler when the input is focused
					// Which should not happen, so we comment this out for now
					// control.blur();
				}}
				maxLength={6}
				pattern={pattern}
				aria-describedby={ariaDescribedBy}
			>
				<InputOTPGroup>
					{new Array(length).fill(0).map((_, index) => (
						<InputOTPSlot key={index} index={index} />
					))}
				</InputOTPGroup>
			</ShadcnInputOTP>
		</>
	);
}

export {
	Field,
	FieldError,
	Label,
	Button,
	Input,
	Textarea,
	DatePicker,
	ComboBox,
	RadioGroup,
	Checkbox,
	Select,
	Slider,
	Switch,
	SingleToggleGroup,
	MultiToggleGroup,
	InputOTP,
};
