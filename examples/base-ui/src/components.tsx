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

type ControlProps = {
	id: string;
	name: string;
	defaultValue?: string;
	invalid: boolean;
	'aria-describedby'?: string;
	'aria-labelledby'?: string;
};

type CheckedControlProps = Omit<ControlProps, 'defaultValue'> & {
	defaultChecked?: boolean;
};

type Option = {
	label: string;
	value: string;
};

function isFocusLeaving(event: FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

export type CheckboxControlProps = CheckedControlProps;

export function CheckboxControl(props: CheckboxControlProps) {
	const { id, invalid, name, defaultChecked } = props;
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
				id={id}
				className="checkbox"
				ref={checkboxRef}
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				aria-labelledby={props['aria-labelledby']}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				<Checkbox.Indicator className="checkbox-indicator">
					✓
				</Checkbox.Indicator>
			</Checkbox.Root>
		</>
	);
}

export type CheckboxGroupControlProps = Omit<ControlProps, 'defaultValue'> & {
	defaultValue?: string[];
	children: ReactNode;
};

export function CheckboxGroupControl(props: CheckboxGroupControlProps) {
	const { invalid, name, defaultValue, children } = props;
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
				aria-labelledby={props['aria-labelledby']}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				{children}
			</CheckboxGroup>
		</>
	);
}

export type RadioGroupControlProps = ControlProps & {
	children: ReactNode;
};

export function RadioGroupControl(props: RadioGroupControlProps) {
	const { invalid, name, defaultValue, children } = props;
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
				aria-labelledby={props['aria-labelledby']}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				{children}
			</RadioGroup>
		</>
	);
}

export type SelectControlProps = ControlProps & {
	items: Option[];
	placeholder?: string;
};

export function SelectControl(props: SelectControlProps) {
	const { id, invalid, name, defaultValue, items, placeholder } = props;
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
					id={id}
					className="select-trigger"
					ref={triggerRef}
					aria-labelledby={props['aria-labelledby']}
					aria-describedby={props['aria-describedby']}
					aria-invalid={invalid || undefined}
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

export type ComboboxControlProps = ControlProps & {
	items: Option[];
	placeholder?: string;
	triggerLabel: string;
};

export function ComboboxControl(props: ComboboxControlProps) {
	const { id, invalid, name, defaultValue, items, placeholder, triggerLabel } =
		props;
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
						id={id}
						className="combobox-input"
						ref={inputRef}
						placeholder={placeholder}
						aria-labelledby={props['aria-labelledby']}
						aria-describedby={props['aria-describedby']}
						aria-invalid={invalid || undefined}
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

export type NumberFieldControlProps = ControlProps & {
	label: string;
};

export function NumberFieldControl(props: NumberFieldControlProps) {
	const { id, invalid, label, name, defaultValue } = props;
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
				id={id}
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
					<NumberField.Input
						className="number-input"
						ref={inputRef}
						aria-labelledby={props['aria-labelledby']}
						aria-describedby={props['aria-describedby']}
						aria-invalid={invalid || undefined}
					/>
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

export type SliderControlProps = ControlProps;

export function SliderControl(props: SliderControlProps) {
	const { invalid, name, defaultValue } = props;
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
							aria-labelledby={props['aria-labelledby']}
							aria-describedby={props['aria-describedby']}
							aria-invalid={invalid || undefined}
						/>
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
		</>
	);
}

export type SwitchControlProps = CheckedControlProps;

export function SwitchControl(props: SwitchControlProps) {
	const { id, invalid, name, defaultChecked } = props;
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
				id={id}
				className="switch"
				ref={switchRef}
				checked={control.checked ?? false}
				onCheckedChange={(checked) => control.change(checked)}
				onBlur={() => control.blur()}
				aria-labelledby={props['aria-labelledby']}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				<Switch.Thumb className="switch-thumb" />
			</Switch.Root>
		</>
	);
}
