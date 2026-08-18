import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Combobox } from '@base-ui/react/combobox';
import { NumberField } from '@base-ui/react/number-field';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';
import { Switch } from '@base-ui/react/switch';
import { BaseControl, useControl } from '@conform-to/react/future';
import { useRef, type FocusEvent, type ReactNode } from 'react';

function isFocusLeaving(event: FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

export function CheckboxControl({
	name,
	defaultChecked,
}: {
	name: string;
	defaultChecked?: boolean;
}) {
	const checkboxRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value: 'on',
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="checkbox"
				name={name}
				value="on"
				defaultChecked={defaultChecked ?? false}
				ref={control.register}
			/>
			<Checkbox.Root
				className="checkbox"
				ref={checkboxRef}
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
			>
				<Checkbox.Indicator className="checkbox-indicator">
					✓
				</Checkbox.Indicator>
			</Checkbox.Root>
		</>
	);
}

export function CheckboxGroupControl({
	name,
	defaultValue,
	children,
}: {
	name: string;
	defaultValue?: string[];
	children: ReactNode;
}) {
	const groupRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			groupRef.current
				?.querySelector<HTMLElement>('[role="checkbox"]')
				?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="select"
				name={name}
				defaultValue={control.defaultValue ?? []}
				ref={control.register}
			/>
			<CheckboxGroup
				className="choice-group"
				ref={groupRef}
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) {
						control.blur();
					}
				}}
			>
				{children}
			</CheckboxGroup>
		</>
	);
}

export function RadioGroupControl({
	name,
	defaultValue,
	children,
}: {
	name: string;
	defaultValue?: string;
	children: ReactNode;
}) {
	const groupRef = useRef<HTMLDivElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			groupRef.current?.querySelector<HTMLElement>('[role="radio"]')?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<RadioGroup
				className="choice-group"
				ref={groupRef}
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) {
						control.blur();
					}
				}}
			>
				{children}
			</RadioGroup>
		</>
	);
}

export function SelectControl({
	name,
	defaultValue,
	items,
	placeholder,
}: {
	name: string;
	defaultValue?: string;
	items: Array<{ label: string; value: string }>;
	placeholder?: string;
}) {
	const labels = Object.fromEntries(
		items.map((item) => [item.value, item.label]),
	);
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
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Select.Root
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
			>
				<Select.Trigger
					className="select-trigger"
					ref={triggerRef}
					onBlur={() => control.blur()}
				>
					<Select.Value placeholder={placeholder}>
						{(value: string | null) =>
							value ? labels[value] : (placeholder ?? 'Choose an option')
						}
					</Select.Value>
					<Select.Icon aria-hidden>⌄</Select.Icon>
				</Select.Trigger>
				<Select.Portal>
					<Select.Positioner className="popup-positioner" sideOffset={6}>
						<Select.Popup className="popup">
							<Select.List>
								{items.map((item) => (
									<Select.Item
										className="popup-item"
										key={item.value}
										value={item.value}
									>
										<Select.ItemIndicator className="item-indicator">
											✓
										</Select.ItemIndicator>
										<Select.ItemText>{item.label}</Select.ItemText>
									</Select.Item>
								))}
							</Select.List>
						</Select.Popup>
					</Select.Positioner>
				</Select.Portal>
			</Select.Root>
		</>
	);
}

export function ComboboxControl({
	name,
	defaultValue,
	items,
	placeholder,
	triggerLabel,
}: {
	name: string;
	defaultValue?: string;
	items: Array<{ label: string; value: string }>;
	placeholder?: string;
	triggerLabel: string;
}) {
	const labels = Object.fromEntries(
		items.map((item) => [item.value, item.label]),
	);
	const values = items.map((item) => item.value);
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
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Combobox.Root
				items={values}
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
				itemToStringLabel={(value) => labels[value] ?? value}
			>
				<Combobox.InputGroup className="combobox-group">
					<Combobox.Input
						className="combobox-input"
						ref={inputRef}
						placeholder={placeholder}
						onBlur={() => control.blur()}
					/>
					<Combobox.Trigger
						className="combobox-trigger"
						aria-label={triggerLabel}
					>
						⌄
					</Combobox.Trigger>
				</Combobox.InputGroup>
				<Combobox.Portal>
					<Combobox.Positioner className="popup-positioner" sideOffset={6}>
						<Combobox.Popup className="popup">
							<Combobox.Empty className="popup-empty">
								No matches
							</Combobox.Empty>
							<Combobox.List>
								{(value: string) => (
									<Combobox.Item className="popup-item" value={value}>
										<Combobox.ItemIndicator className="item-indicator">
											✓
										</Combobox.ItemIndicator>
										{labels[value]}
									</Combobox.Item>
								)}
							</Combobox.List>
						</Combobox.Popup>
					</Combobox.Positioner>
				</Combobox.Portal>
			</Combobox.Root>
		</>
	);
}

export function NumberFieldControl({
	name,
	defaultValue,
	label,
}: {
	name: string;
	defaultValue?: string;
	label: string;
}) {
	const inputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			inputRef.current?.focus();
		},
	});
	const numericValue = Number(control.value);
	const value =
		control.value === '' || Number.isNaN(numericValue) ? null : numericValue;

	return (
		<>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<NumberField.Root
				value={value}
				onValueChange={(nextValue) =>
					control.change(nextValue == null ? '' : String(nextValue))
				}
				onBlur={(event) => {
					if (isFocusLeaving(event)) {
						control.blur();
					}
				}}
				min={1}
				max={10}
			>
				<NumberField.Group className="number-group">
					<NumberField.Decrement
						className="stepper"
						aria-label={`Decrease ${label}`}
					>
						−
					</NumberField.Decrement>
					<NumberField.Input className="number-input" ref={inputRef} />
					<NumberField.Increment
						className="stepper"
						aria-label={`Increase ${label}`}
					>
						+
					</NumberField.Increment>
				</NumberField.Group>
			</NumberField.Root>
		</>
	);
}

export function SliderControl({
	name,
	defaultValue,
}: {
	name: string;
	defaultValue?: string;
}) {
	const thumbInputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue: defaultValue || '50',
		onFocus() {
			thumbInputRef.current?.focus();
		},
	});
	const numericValue = Number(control.value);
	const value = Number.isFinite(numericValue) ? numericValue : 50;

	return (
		<>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? '50'}
				ref={control.register}
			/>
			<Slider.Root
				className="slider-root"
				value={value}
				min={0}
				max={100}
				step={5}
				onValueChange={(nextValue) => control.change(String(nextValue))}
			>
				<Slider.Value className="slider-value" />
				<Slider.Control className="slider-control">
					<Slider.Track className="slider-track">
						<Slider.Indicator className="slider-indicator" />
						<Slider.Thumb
							className="slider-thumb"
							inputRef={thumbInputRef}
							onBlur={() => control.blur()}
						/>
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		</>
	);
}

export function SwitchControl({
	name,
	defaultChecked,
}: {
	name: string;
	defaultChecked?: boolean;
}) {
	const switchRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value: 'on',
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				type="checkbox"
				name={name}
				value="on"
				defaultChecked={defaultChecked ?? false}
				ref={control.register}
			/>
			<Switch.Root
				className="switch"
				ref={switchRef}
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
			>
				<Switch.Thumb className="switch-thumb" />
			</Switch.Root>
		</>
	);
}
