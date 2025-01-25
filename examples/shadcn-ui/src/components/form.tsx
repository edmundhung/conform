import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from '@/components/ui/popover';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
} from '@/components/ui/command';
import {
	SelectTrigger,
	Select,
	SelectValue,
	SelectContent,
	SelectItem,
} from '@/components/ui/select';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
	InputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from '@/components/ui/input-otp';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useCustomInput } from 'conform-react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Check, ChevronsUpDown } from 'lucide-react';

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
};

function ExampleDatePicker({ name }: ExampleDatePickerProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => triggerRef.current?.focus()}
			/>
			<Popover
				onOpenChange={(open) => {
					if (!open) {
						input.blurred();
					}
				}}
			>
				<PopoverTrigger asChild>
					<Button
						ref={triggerRef}
						variant={'outline'}
						className={cn(
							'w-64 justify-start text-left font-normal focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
							!input.value && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{input.value ? (
							format(input.value, 'PPP')
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						mode="single"
						selected={new Date(input.value ?? '')}
						onSelect={(value) => input.changed(value?.toISOString() ?? '')}
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
};

function ExampleCountryPicker({ name }: ExampleCountryPickerProps) {
	const triggerRef = useRef<HTMLButtonElement>(null);
	const input = useCustomInput('');

	return (
		<div>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => triggerRef.current?.focus()}
			/>
			<Popover
				onOpenChange={(open) => {
					if (!open) {
						input.blurred();
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
							!input.value && 'text-muted-foreground',
							'focus:ring-2 focus:ring-stone-950 focus:ring-offset-2',
						)}
					>
						{input.value
							? countries.find((country) => country.value === input.value)
									?.label
							: 'Select country'}
						<ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-[200px] p-0">
					<Command>
						<CommandInput placeholder="Search country..." />
						<CommandEmpty>No country found.</CommandEmpty>
						<CommandGroup>
							{countries.map((country) => (
								<CommandItem
									value={country.label}
									key={country.value}
									onSelect={() => {
										input.changed(country.value);
									}}
								>
									<Check
										className={cn(
											'mr-2 h-4 w-4',
											country.value === input.value
												? 'opacity-100'
												: 'opacity-0',
										)}
									/>
									{country.label}
								</CommandItem>
							))}
						</CommandGroup>
					</Command>
				</PopoverContent>
			</Popover>
		</div>
	);
}

type ExampleRadioGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
};

function ExampleRadioGroup({ name, items }: ExampleRadioGroupProps) {
	const radioGroupRef = useRef<React.ElementRef<typeof RadioGroup>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => radioGroupRef.current?.focus()}
			/>
			<RadioGroup
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={input.value ?? ''}
				onValueChange={(value) => input.changed(value)}
				onBlur={() => input.blurred()}
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
};

function ExampleCheckbox({ name, value = 'on' }: ExampleCheckboxProps) {
	const checkboxRef = useRef<React.ElementRef<typeof Checkbox>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				type="checkbox"
				name={name}
				value={value}
				onFocus={() => input.focused()}
			/>
			<Checkbox
				ref={checkboxRef}
				value={value}
				checked={value === input.value}
				onCheckedChange={(checked) => {
					input.changed(checked ? value : '');
				}}
				onBlur={() => input.blurred()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

type ExampleSelectProps = {
	name: string;
	items: Array<{ name: string; value: string }>;
	placeholder: string;
};

function ExampleSelect({ name, items, placeholder }: ExampleSelectProps) {
	const selectRef = useRef<React.ElementRef<typeof SelectTrigger>>(null);
	const input = useCustomInput('');

	return (
		<>
			<select
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				onFocus={() => selectRef.current?.focus()}
			>
				<option value="" />
				{items.map((option) => (
					<option key={option.value} value={option.value} />
				))}
			</select>
			<Select
				value={input.value}
				onValueChange={(value) => input.changed(value)}
				onOpenChange={(open) => {
					if (!open) {
						input.blurred();
					}
				}}
			>
				<SelectTrigger>
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
};

function ExampleSlider({ name }: ExampleSliderProps) {
	const sliderRef = useRef<React.ElementRef<typeof Slider>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				onFocus={() => {
					const sliderSpan =
						sliderRef.current?.querySelector('[role="slider"]');
					if (sliderSpan instanceof HTMLElement) {
						sliderSpan.focus();
					}
				}}
			/>
			<div className="flex items-center gap-4">
				<Slider
					ref={sliderRef}
					step={1}
					value={[input.value === '' ? 0 : parseFloat(input.value)]}
					onValueChange={(numbers) => {
						input.changed(numbers[0]?.toString());
					}}
					onBlur={() => input.blurred()}
					className="w-[280px]"
				/>
				<div>{input.value}</div>
			</div>
		</>
	);
}

type ExampleSwitchProps = {
	name: string;
};

function ExampleSwitch({ name }: ExampleSwitchProps) {
	const switchRef = useRef<React.ElementRef<typeof Switch>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				onFocus={() => switchRef.current?.focus()}
			/>
			<Switch
				ref={switchRef}
				checked={input.value === 'on'}
				onCheckedChange={(checked) => {
					input.changed(checked ? 'on' : '');
				}}
				onBlur={() => input.blurred()}
				className="focus:ring-stone-950 focus:ring-2 focus:ring-offset-2"
			/>
		</>
	);
}

type ExampleSingleToggleGroupProps = {
	name: string;
	items: Array<{ value: string; label: string }>;
};

function ExampleSingleToggleGroup({
	name,
	items,
}: ExampleSingleToggleGroupProps) {
	const toggleGroupRef = useRef<React.ElementRef<typeof ToggleGroup>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				onFocus={() => toggleGroupRef.current?.focus()}
			/>
			<ToggleGroup
				type="single"
				ref={toggleGroupRef}
				value={input.value}
				onValueChange={(value) => {
					input.changed(value);
				}}
				onBlur={() => input.blurred()}
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
};

function ExampleMultiToggleGroup({
	name,
	items,
}: ExampleMultiToggleGroupProps) {
	const toggleGroupRef = useRef<React.ElementRef<typeof ToggleGroup>>(null);
	const input = useCustomInput([]);

	return (
		<>
			<select
				{...input.visuallyHiddenProps}
				multiple
				name={name}
				ref={input.register}
				onFocus={() => toggleGroupRef.current?.focus()}
			/>
			<ToggleGroup
				type="multiple"
				ref={toggleGroupRef}
				value={input.value}
				onValueChange={(value) => {
					input.changed(value);
				}}
				onBlur={() => input.blurred()}
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
};

function ExampleInputOTP({
	name,
	length = 6,
	pattern = REGEXP_ONLY_DIGITS_AND_CHARS,
}: ExampleInputOTPProps) {
	const inputOTPRef = useRef<React.ElementRef<typeof InputOTP>>(null);
	const input = useCustomInput('');

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				ref={input.register}
				name={name}
				onFocus={() => inputOTPRef.current?.focus()}
			/>
			<InputOTP
				ref={inputOTPRef}
				value={input.value}
				onChange={(value) => input.changed(value)}
				onBlur={() => input.blurred()}
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
