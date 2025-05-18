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
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
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
	Select,
	SelectValue,
	SelectContent,
	SelectItem,
} from './ui/select';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import { InputOTP, InputOTPGroup, InputOTPSlot } from './ui/input-otp';
import { ToggleGroup, ToggleGroupItem } from './ui/toggle-group';
import { Switch } from './ui/switch';
import { Slider } from './ui/slider';
import { Checkbox } from './ui/checkbox';
import { cn } from '../lib/utils';
import { useControl } from '@conform-to/react';
import { Label } from './ui/label';
import { Input } from './ui/input';
import { Textarea } from './ui/textarea';

type FieldProps = {
	children: React.ReactNode;
};

function Field({ children }: FieldProps) {
	return <div className="flex flex-col gap-2">{children}</div>;
}

type FieldErrorProps = {
	children: React.ReactNode;
};

function FieldError({ children }: FieldErrorProps) {
	return <div className="text-sm text-red-600">{children}</div>;
}

type ExampleDatePickerProps = {
	name: string;
	defaultValue?: string;
};

function ExampleDatePicker({ name, defaultValue }: ExampleDatePickerProps) {
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

type ExampleCountryPickerProps = {
	name: string;
	defaultValue?: string;
};

function ExampleCountryPicker({
	name,
	defaultValue,
}: ExampleCountryPickerProps) {
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

type ExampleRadioGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
};

function ExampleRadioGroup({
	name,
	items,
	defaultValue,
}: ExampleRadioGroupProps) {
	const radioGroupRef = useRef<React.ElementRef<typeof RadioGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			radioGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<RadioGroup
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadioGroupItem value={item.value} id={item.value} />
							<label htmlFor={item.value}>{item.label}</label>
						</div>
					);
				})}
			</RadioGroup>
		</>
	);
}

type ExampleCheckboxProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

function ExampleCheckbox({
	name,
	value,
	defaultChecked,
}: ExampleCheckboxProps) {
	const checkboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);
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
			<Checkbox
				ref={checkboxRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

type ExampleSelectProps = {
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder: string;
	defaultValue?: string[];
};

function ExampleSelect({
	name,
	items,
	placeholder,
	defaultValue,
}: ExampleSelectProps) {
	const selectRef = useRef<React.ElementRef<typeof SelectTrigger>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			selectRef.current?.focus();
		},
	});

	return (
		<>
			<select name={name} ref={control.register} hidden>
				<option value="" />
				{items.map((option) => (
					<option key={option.value} value={option.value} />
				))}
			</select>
			<Select
				value={control.value}
				onValueChange={(value) => control.change(value)}
				onOpenChange={(open) => {
					if (!open) {
						control.blur();
					}
				}}
			>
				<SelectTrigger ref={selectRef}>
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
			</Select>
		</>
	);
}

type ExampleSliderProps = {
	name: string;
	defaultValue?: string;
};

function ExampleSlider({ name, defaultValue }: ExampleSliderProps) {
	const sliderRef = useRef<React.ElementRef<typeof Slider>>(null);
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
				<Slider
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

type ExampleSwitchProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

function ExampleSwitch({ name, value, defaultChecked }: ExampleSwitchProps) {
	const switchRef = useRef<React.ElementRef<typeof Switch>>(null);
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
			<Switch
				ref={switchRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

type ExampleSingleToggleGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
};

function ExampleSingleToggleGroup({
	name,
	items,
	defaultValue,
}: ExampleSingleToggleGroupProps) {
	const toggleGroupRef = useRef<React.ElementRef<typeof ToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			toggleGroupRef.current?.focus();
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<ToggleGroup
				type="single"
				ref={toggleGroupRef}
				value={control.value}
				onValueChange={(value) => {
					control.change(value);
				}}
				onBlur={() => control.blur()}
			>
				{items.map((item) => (
					<ToggleGroupItem key={item.value} value={item.value}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</>
	);
}

type ExampleMultiToggleGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string[];
};

function ExampleMultiToggleGroup({
	name,
	items,
	defaultValue,
}: ExampleMultiToggleGroupProps) {
	const toggleGroupRef = useRef<React.ElementRef<typeof ToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			toggleGroupRef.current?.focus();
		},
	});

	return (
		<>
			<select multiple name={name} ref={control.register} hidden />
			<ToggleGroup
				type="multiple"
				ref={toggleGroupRef}
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
			>
				{items.map((item) => (
					<ToggleGroupItem key={item.value} value={item.value}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ToggleGroup>
		</>
	);
}

type ExampleInputOTPProps = {
	name: string;
	length: number;
	pattern?: string;
	defaultValue?: string;
};

function ExampleInputOTP({
	name,
	length = 6,
	pattern = REGEXP_ONLY_DIGITS_AND_CHARS,
	defaultValue,
}: ExampleInputOTPProps) {
	const inputOTPRef = useRef<React.ElementRef<typeof InputOTP>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputOTPRef.current?.focus();
		},
	});

	return (
		<>
			<input ref={control.register} name={name} hidden />
			<InputOTP
				ref={inputOTPRef}
				value={control.value ?? ''}
				onChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
				maxLength={6}
				pattern={pattern}
			>
				<InputOTPGroup>
					{new Array(length).fill(0).map((_, index) => (
						<InputOTPSlot key={index} index={index} />
					))}
				</InputOTPGroup>
			</InputOTP>
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
	ExampleDatePicker as DatePicker,
	ExampleCountryPicker as CountryPicker,
	ExampleRadioGroup as RadioGroup,
	ExampleCheckbox as Checkbox,
	ExampleSelect as Select,
	ExampleSlider as Slider,
	ExampleSwitch as Switch,
	ExampleSingleToggleGroup as SingleToggleGroup,
	ExampleMultiToggleGroup as MultiToggleGroup,
	ExampleInputOTP as InputOTP,
};
