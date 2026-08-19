import { format, isValid } from 'date-fns';
import {
	Calendar as CalendarIcon,
	Check as CheckIcon,
	ChevronsUpDown as ChevronsUpDownIcon,
	X as XIcon,
} from 'lucide-react';
import { useRef, useState, type ComponentProps } from 'react';
import {
	BaseControl,
	configureForms,
	useControl,
} from '@conform-to/react/future';
import { coerceStructure, getConstraints } from '@conform-to/zod/v4/future';
import { z } from 'zod/v4';
import { Button } from './components/ui/button';
import { Calendar } from './components/ui/calendar';
import {
	Popover,
	PopoverContent,
	PopoverTrigger,
} from './components/ui/popover';
import {
	RadioGroup as ShadcnRadioGroup,
	RadioGroupItem,
} from './components/ui/radio-group';
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from './components/ui/command';
import {
	SelectTrigger,
	Select as ShadcnSelect,
	SelectValue,
	SelectContent,
	SelectItem,
} from './components/ui/select';
import { REGEXP_ONLY_DIGITS_AND_CHARS } from 'input-otp';
import {
	InputOTP as ShadcnInputOTP,
	InputOTPGroup,
	InputOTPSlot,
} from './components/ui/input-otp';
import {
	ToggleGroup as ShadcnToggleGroup,
	ToggleGroupItem,
} from './components/ui/toggle-group';
import { Switch as ShadcnSwitch } from './components/ui/switch';
import { Slider as ShadcnSlider } from './components/ui/slider';
import { Checkbox as ShadcnCheckbox } from './components/ui/checkbox';
import { cn } from './lib/utils';
import {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
} from './components/ui/field';
import { Input } from './components/ui/input';
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
	InputGroupTextarea,
} from './components/ui/input-group';
import {
	NativeSelect,
	NativeSelectOption,
} from './components/ui/native-select';
import { Textarea } from './components/ui/textarea';

export type DatePickerProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
	['aria-invalid']?: boolean;
};

function DatePicker({ name, defaultValue, ...props }: DatePickerProps) {
	const [open, setOpen] = useState(false);
	const triggerRef = useRef<HTMLButtonElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			triggerRef.current?.focus();
		},
	});
	const parsedDate = control.value ? new Date(control.value) : undefined;
	const selectedDate =
		parsedDate && isValid(parsedDate) ? parsedDate : undefined;

	return (
		<>
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<Popover
				open={open}
				onOpenChange={(open) => {
					setOpen(open);
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
						className={cn(
							'w-64 justify-start text-left font-normal',
							!control.value && 'text-muted-foreground',
						)}
					>
						<CalendarIcon className="mr-2 h-4 w-4" />
						{selectedDate ? (
							format(selectedDate, 'PPP')
						) : (
							<span>Pick a date</span>
						)}
					</Button>
				</PopoverTrigger>
				<PopoverContent className="w-auto p-0">
					<Calendar
						mode="single"
						selected={selectedDate}
						onSelect={(value) => {
							control.change(value?.toISOString() ?? '');
							setOpen(false);
							control.blur();
						}}
						autoFocus
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
	['aria-invalid']?: boolean;
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
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
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
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
	['aria-invalid']?: boolean;
};

function RadioGroup({
	id,
	name,
	items,
	defaultValue,
	['aria-labelledby']: ariaLabelledBy,
	['aria-describedby']: ariaDescribedBy,
	['aria-invalid']: ariaInvalid,
}: RadioGroupProps) {
	const radioGroupRef =
		useRef<React.ComponentRef<typeof ShadcnRadioGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				radioGroupRef.current?.querySelector<HTMLElement>(
					'[data-state="checked"]',
				) ??
				radioGroupRef.current?.querySelector<HTMLElement>('[role="radio"]');
			item?.focus();
		},
	});

	return (
		<>
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<ShadcnRadioGroup
				id={id}
				aria-labelledby={ariaLabelledBy}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				ref={radioGroupRef}
				className="flex items-center gap-4"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				{items.map((item) => {
					return (
						<div className="flex items-center gap-2" key={item.value}>
							<RadioGroupItem id={`${id}-${item.value}`} value={item.value} />
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
	['aria-invalid']?: boolean;
};

function Checkbox({ name, value, defaultChecked, ...props }: CheckboxProps) {
	const checkboxRef = useRef<React.ComponentRef<typeof ShadcnCheckbox>>(null);
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
				ref={control.register}
				name={name}
				value={value ?? 'on'}
				defaultChecked={defaultChecked ?? false}
			/>
			<ShadcnCheckbox
				{...props}
				ref={checkboxRef}
				checked={control.checked}
				onCheckedChange={(checked) =>
					control.change(checked === 'indeterminate' ? false : checked)
				}
				onBlur={() => control.blur()}
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
	['aria-invalid']?: boolean;
};

function Select({
	name,
	items,
	placeholder,
	defaultValue,
	...props
}: SelectProps) {
	const selectRef = useRef<React.ComponentRef<typeof SelectTrigger>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			selectRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<ShadcnSelect
				value={control.value ?? ''}
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
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
	['aria-invalid']?: boolean;
};

function Slider({
	id,
	name,
	defaultValue,
	['aria-labelledby']: ariaLabelledBy,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
	...props
}: SliderProps) {
	const sliderRef = useRef<React.ComponentRef<typeof ShadcnSlider>>(null);
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
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<div className="flex items-center gap-4">
				<ShadcnSlider
					{...props}
					ref={sliderRef}
					thumbProps={{
						id,
						'aria-labelledby': ariaLabelledBy,
						'aria-describedby': ariaDescribedBy,
						'aria-invalid': ariaInvalid,
					}}
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
	['aria-invalid']?: boolean;
};

function Switch({ name, value, defaultChecked, ...props }: SwitchProps) {
	const switchRef = useRef<React.ComponentRef<typeof ShadcnSwitch>>(null);
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
				ref={control.register}
				name={name}
				value={value ?? 'on'}
				defaultChecked={defaultChecked ?? false}
			/>
			<ShadcnSwitch
				{...props}
				ref={switchRef}
				checked={control.checked}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
			/>
		</>
	);
}

export type SingleToggleGroupProps = {
	id?: string;
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string;
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
	['aria-invalid']?: boolean;
};

function SingleToggleGroup({
	id,
	name,
	items,
	defaultValue,
	['aria-labelledby']: ariaLabelledby,
	['aria-describedby']: ariaDescribedBy,
	['aria-invalid']: ariaInvalid,
}: SingleToggleGroupProps) {
	const toggleGroupRef =
		useRef<React.ComponentRef<typeof ShadcnToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				toggleGroupRef.current?.querySelector<HTMLElement>(
					'[data-state="on"]',
				) ?? toggleGroupRef.current?.querySelector<HTMLElement>('button');
			item?.focus();
		},
	});

	return (
		<>
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<ShadcnToggleGroup
				id={id}
				aria-labelledby={ariaLabelledby}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				type="single"
				ref={toggleGroupRef}
				value={control.value ?? ''}
				onValueChange={(value) => {
					control.change(value);
				}}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				{items.map((item) => (
					<ToggleGroupItem key={item.value} value={item.value}>
						{item.label}
					</ToggleGroupItem>
				))}
			</ShadcnToggleGroup>
		</>
	);
}

export type MultiToggleGroupProps = {
	id?: string;
	name: string;
	items: Array<{ value: string; label: string }>;
	defaultValue?: string[];
	['aria-labelledby']?: string;
	['aria-describedby']?: string;
	['aria-invalid']?: boolean;
};

function MultiToggleGroup({
	id,
	name,
	items,
	defaultValue,
	['aria-labelledby']: ariaLabelledby,
	['aria-describedby']: ariaDescribedBy,
	['aria-invalid']: ariaInvalid,
}: MultiToggleGroupProps) {
	const toggleGroupRef =
		useRef<React.ComponentRef<typeof ShadcnToggleGroup>>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const item =
				toggleGroupRef.current?.querySelector<HTMLElement>(
					'[data-state="on"]',
				) ?? toggleGroupRef.current?.querySelector<HTMLElement>('button');
			item?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="select"
				multiple
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? []}
			/>
			<ShadcnToggleGroup
				id={id}
				aria-labelledby={ariaLabelledby}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
				type="multiple"
				ref={toggleGroupRef}
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (!event.currentTarget.contains(event.relatedTarget)) {
						control.blur();
					}
				}}
			>
				{items.map((item) => (
					<ToggleGroupItem key={item.value} value={item.value}>
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
	['aria-invalid']?: boolean;
};

function InputOTP({
	id,
	name,
	length = 6,
	pattern = REGEXP_ONLY_DIGITS_AND_CHARS,
	defaultValue,
	'aria-describedby': ariaDescribedBy,
	'aria-invalid': ariaInvalid,
}: InputOTPProps) {
	const inputOTPRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputOTPRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				ref={control.register}
				name={name}
				defaultValue={control.defaultValue ?? ''}
			/>
			<ShadcnInputOTP
				id={id}
				ref={inputOTPRef}
				value={control.value ?? ''}
				onChange={(value) => control.change(value)}
				onBlur={() => control.blur()}
				maxLength={length}
				pattern={pattern}
				aria-describedby={ariaDescribedBy}
				aria-invalid={ariaInvalid}
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

// oxlint-disable-next-line react/only-export-components
export const memberSchema = z.object({
	id: z.string(),
	name: z.string(),
	email: z.string(),
	role: z.enum(['developer', 'designer', 'manager']),
});

export type Member = z.infer<typeof memberSchema>;

export type TeamMemberSelectProps = {
	name: string;
	defaultValue?: unknown;
	members: Member[];
	'aria-labelledby'?: string;
	'aria-describedby'?: string;
	'aria-invalid'?: boolean;
};

const membersSchema = z.array(memberSchema);
const structuredMembersSchema = coerceStructure(membersSchema);

function TeamMemberSelect({
	name,
	members,
	defaultValue,
	...props
}: TeamMemberSelectProps) {
	const [open, setOpen] = useState(false);
	const [roleFilter, setRoleFilter] = useState<Member['role'] | 'all'>('all');
	const triggerRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		parse(payload) {
			const result = structuredMembersSchema.safeParse(payload);

			return result.success ? result.data : [];
		},
		onFocus() {
			triggerRef.current?.focus();
		},
	});

	const selected: Member[] = control.payload ?? [];
	const filteredMembers =
		roleFilter === 'all'
			? members
			: members.filter((member) => member.role === roleFilter);

	function toggle(member: Member) {
		const exists = selected.some((m) => m.id === member.id);
		const next = exists
			? selected.filter((m) => m.id !== member.id)
			: [...selected, member];
		control.change(next);
	}

	function remove(memberId: string) {
		control.change(selected.filter((m) => m.id !== memberId));
	}

	return (
		<>
			<BaseControl
				type="fieldset"
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue}
			/>
			<Popover
				open={open}
				onOpenChange={(isOpen) => {
					setOpen(isOpen);
					if (isOpen) {
						control.focus();
					} else {
						control.blur();
					}
				}}
			>
				<PopoverTrigger asChild>
					<InputGroup
						{...props}
						ref={triggerRef}
						role="combobox"
						tabIndex={0}
						aria-expanded={open}
						onKeyDown={(event) => {
							if (
								event.target === event.currentTarget &&
								(event.key === 'Enter' || event.key === ' ')
							) {
								event.preventDefault();
								event.currentTarget.click();
							}
						}}
						className={cn(
							'h-auto min-h-8 cursor-pointer py-1.5',
							selected.length === 0 && 'text-muted-foreground',
						)}
					>
						<InputGroupText className="flex-1 flex-wrap px-2.5">
							{selected.length === 0 ? (
								<span>Select team members</span>
							) : (
								selected.map((member) => (
									<span
										key={member.id}
										className="inline-flex items-center gap-1 rounded-sm bg-muted px-2 py-0.5 text-xs text-foreground"
									>
										{member.name}
										<button
											type="button"
											className="rounded-sm hover:bg-accent"
											onClick={(e) => {
												e.stopPropagation();
												remove(member.id);
											}}
											aria-label={`Remove ${member.name}`}
										>
											<XIcon className="h-3 w-3" />
										</button>
									</span>
								))
							)}
						</InputGroupText>
						<InputGroupAddon align="inline-end">
							<ChevronsUpDownIcon />
						</InputGroupAddon>
					</InputGroup>
				</PopoverTrigger>
				<PopoverContent className="w-[320px] p-0">
					<Command>
						<div className="border-b p-2">
							<NativeSelect
								aria-label="Filter members by role"
								className="w-full"
								value={roleFilter}
								onChange={(event) =>
									setRoleFilter(
										event.currentTarget.value as Member['role'] | 'all',
									)
								}
							>
								<NativeSelectOption value="all">All roles</NativeSelectOption>
								<NativeSelectOption value="developer">
									Developers
								</NativeSelectOption>
								<NativeSelectOption value="designer">
									Designers
								</NativeSelectOption>
								<NativeSelectOption value="manager">
									Managers
								</NativeSelectOption>
							</NativeSelect>
						</div>
						<CommandInput placeholder="Search members..." />
						<CommandList>
							<CommandEmpty>No members found.</CommandEmpty>
							<CommandGroup>
								{filteredMembers.map((member) => {
									const isSelected = selected.some((m) => m.id === member.id);
									return (
										<CommandItem
											key={member.id}
											value={member.name}
											onSelect={() => toggle(member)}
										>
											<CheckIcon
												className={cn(
													'mr-2 h-4 w-4',
													isSelected ? 'opacity-100' : 'opacity-0',
												)}
											/>
											<div className="flex flex-col">
												<span>{member.name}</span>
												<span className="text-xs text-muted-foreground">
													{member.email} &middot; {member.role}
												</span>
											</div>
										</CommandItem>
									);
								})}
							</CommandGroup>
						</CommandList>
					</Command>
				</PopoverContent>
			</Popover>
		</>
	);
}

const forms = configureForms({
	getConstraints,
	shouldValidate: 'onBlur',
	shouldRevalidate: 'onInput',
	extendFieldMetadata(metadata) {
		const getAriaDescribedBy = () =>
			[metadata.descriptionId, metadata.ariaDescribedBy]
				.filter(Boolean)
				.join(' ') || undefined;

		return {
			get inputProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<'input'>>;
			},
			get textareaProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<'textarea'>>;
			},
			get datePickerProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof DatePicker>>;
			},
			get comboBoxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof ComboBox>>;
			},
			get radioGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<ComponentProps<typeof RadioGroup>>;
			},
			get checkboxProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof Checkbox>>;
			},
			get selectProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof Select>>;
			},
			get sliderProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
					'aria-labelledby': `${metadata.id}-label`,
				} satisfies Partial<ComponentProps<typeof Slider>>;
			},
			get switchProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					value: 'on',
					defaultChecked: metadata.defaultChecked,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof Switch>>;
			},
			get singleToggleGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof SingleToggleGroup>>;
			},
			get multiToggleGroupProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultOptions,
					'aria-labelledby': `${metadata.id}-label`,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof MultiToggleGroup>>;
			},
			get inputOTPProps() {
				return {
					id: metadata.id,
					name: metadata.name,
					defaultValue: metadata.defaultValue,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof InputOTP>>;
			},
			get teamMemberSelectProps() {
				return {
					name: metadata.name,
					defaultValue: metadata.defaultPayload,
					'aria-labelledby': metadata.id,
					'aria-describedby': getAriaDescribedBy(),
					'aria-invalid': metadata.ariaInvalid,
				} satisfies Partial<ComponentProps<typeof TeamMemberSelect>>;
			},
		};
	},
});

export {
	Field,
	FieldDescription,
	FieldError,
	FieldGroup,
	FieldLabel,
	FieldLegend,
	FieldSet,
	Button,
	Input,
	InputGroup,
	InputGroupInput,
	InputGroupTextarea,
	NativeSelect,
	NativeSelectOption,
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
	TeamMemberSelect,
};

// This module intentionally keeps the form configuration with its controls.
// oxlint-disable-next-line react/only-export-components
export const useForm = forms.useForm;
