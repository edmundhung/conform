import { Checkbox } from '@base-ui/react/checkbox';
import { CheckboxGroup } from '@base-ui/react/checkbox-group';
import { Combobox } from '@base-ui/react/combobox';
import { Field } from '@base-ui/react/field';
import { Input } from '@base-ui/react/input';
import { NumberField } from '@base-ui/react/number-field';
import { Radio } from '@base-ui/react/radio';
import { RadioGroup } from '@base-ui/react/radio-group';
import { Select } from '@base-ui/react/select';
import { Slider } from '@base-ui/react/slider';
import { Switch } from '@base-ui/react/switch';
import { BaseControl, useControl } from '@conform-to/react/future';
import { useRef, type FocusEvent } from 'react';

type FieldStatusProps = {
	id: string;
	label: string;
	description: string;
	errors?: string[];
	invalid: boolean;
	'aria-describedby'?: string;
};

type StringFieldProps = FieldStatusProps & {
	name: string;
	defaultValue?: string;
};

type BooleanFieldProps = FieldStatusProps & {
	name: string;
	defaultChecked?: boolean;
};

type Option = {
	label: string;
	value: string;
};

function isFocusLeaving(event: FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

function FieldMessages({ id, description, errors }: FieldStatusProps) {
	return (
		<>
			<Field.Description id={`${id}-description`} className="description">
				{description}
			</Field.Description>
			<div
				id={`${id}-error`}
				className="error"
				role={errors?.length ? 'alert' : undefined}
			>
				{errors?.join(', ')}
			</div>
		</>
	);
}

export function TextInputField(props: StringFieldProps) {
	const { id, label, invalid, name, defaultValue } = props;

	return (
		<Field.Root className="field" invalid={invalid}>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
			<Input
				id={id}
				className="text-control"
				name={name}
				defaultValue={defaultValue}
				aria-labelledby={`${id}-label`}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			/>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export function TextareaField(props: StringFieldProps) {
	const { id, label, invalid, name, defaultValue } = props;

	return (
		<Field.Root className="field" invalid={invalid}>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
			<Field.Control
				render={<textarea rows={4} />}
				id={id}
				className="text-control"
				name={name}
				defaultValue={defaultValue}
				aria-labelledby={`${id}-label`}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			/>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export function CheckboxField(props: BooleanFieldProps) {
	const { id, label, invalid, name, defaultChecked } = props;
	const checkboxRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value: 'on',
		onFocus() {
			checkboxRef.current?.focus();
		},
	});

	return (
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				type="checkbox"
				name={name}
				value="on"
				defaultChecked={defaultChecked ?? false}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="choice-label">
				<Checkbox.Root
					id={id}
					className="checkbox"
					ref={checkboxRef}
					checked={control.checked ?? false}
					onCheckedChange={(checked) => control.change(checked)}
					onBlur={() => control.blur()}
					aria-labelledby={`${id}-label`}
					aria-describedby={props['aria-describedby']}
					aria-invalid={invalid || undefined}
				>
					<Checkbox.Indicator className="checkbox-indicator">
						✓
					</Checkbox.Indicator>
				</Checkbox.Root>
				{label}
			</Field.Label>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export type CheckboxGroupFieldProps = FieldStatusProps & {
	name: string;
	defaultValue?: string[];
	items: Option[];
};

export function CheckboxGroupField(props: CheckboxGroupFieldProps) {
	const { id, label, invalid, name, defaultValue, items } = props;
	const firstCheckboxRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			firstCheckboxRef.current?.focus();
		},
	});

	return (
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				type="select"
				name={name}
				defaultValue={control.defaultValue ?? []}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
			<CheckboxGroup
				className="choice-group"
				value={control.options ?? []}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) {
						control.blur();
					}
				}}
				aria-labelledby={`${id}-label`}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				{items.map((item, index) => (
					<label className="choice-label" key={item.value}>
						<Checkbox.Root
							className="checkbox"
							value={item.value}
							ref={index === 0 ? firstCheckboxRef : undefined}
							aria-labelledby={`${id}-${item.value}-label`}
							aria-describedby={props['aria-describedby']}
							aria-invalid={invalid || undefined}
						>
							<Checkbox.Indicator className="checkbox-indicator">
								✓
							</Checkbox.Indicator>
						</Checkbox.Root>
						<span id={`${id}-${item.value}-label`}>{item.label}</span>
					</label>
				))}
			</CheckboxGroup>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export type RadioGroupFieldProps = StringFieldProps & {
	items: Option[];
};

export function RadioGroupField(props: RadioGroupFieldProps) {
	const { id, label, invalid, name, defaultValue, items } = props;
	const firstRadioRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			firstRadioRef.current?.focus();
		},
	});

	return (
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
			<RadioGroup
				className="choice-group"
				value={control.value ?? ''}
				onValueChange={(value) => control.change(value)}
				onBlur={(event) => {
					if (isFocusLeaving(event)) {
						control.blur();
					}
				}}
				aria-labelledby={`${id}-label`}
				aria-describedby={props['aria-describedby']}
				aria-invalid={invalid || undefined}
			>
				{items.map((item, index) => (
					<label className="choice-label" key={item.value}>
						<Radio.Root
							className="radio"
							ref={index === 0 ? firstRadioRef : undefined}
							value={item.value}
							aria-labelledby={`${id}-${item.value}-label`}
							aria-describedby={props['aria-describedby']}
							aria-invalid={invalid || undefined}
						>
							<Radio.Indicator className="radio-indicator" />
						</Radio.Root>
						<span id={`${id}-${item.value}-label`}>{item.label}</span>
					</label>
				))}
			</RadioGroup>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export type SelectFieldProps = StringFieldProps & {
	items: Option[];
	placeholder?: string;
};

export function SelectField(props: SelectFieldProps) {
	const { id, label, invalid, name, defaultValue, items, placeholder } = props;
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
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
			<Select.Root
				value={control.value || null}
				onValueChange={(value) => control.change(value ?? '')}
			>
				<Select.Trigger
					id={id}
					className="select-trigger"
					ref={triggerRef}
					aria-labelledby={`${id}-label`}
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
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export type ComboboxFieldProps = SelectFieldProps;

export function ComboboxField(props: ComboboxFieldProps) {
	const { id, label, invalid, name, defaultValue, items, placeholder } = props;
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
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
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
						aria-labelledby={`${id}-label`}
						aria-describedby={props['aria-describedby']}
						aria-invalid={invalid || undefined}
						onBlur={() => control.blur()}
					/>
					<Combobox.Trigger
						className="combobox-trigger"
						aria-label={`Open ${label}`}
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
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export function NumberFieldControl(props: StringFieldProps) {
	const { id, label, invalid, name, defaultValue } = props;
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
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? ''}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
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
						aria-labelledby={`${id}-label`}
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
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export function SliderField(props: StringFieldProps) {
	const { id, label, invalid, name, defaultValue } = props;
	const thumbInputRef = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue: defaultValue || '50',
		onFocus() {
			thumbInputRef.current?.focus();
		},
	});
	const numericValue = Number(control.value || 50);
	const value = Number.isFinite(numericValue) ? numericValue : 50;

	return (
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				name={name}
				defaultValue={control.defaultValue ?? '50'}
				ref={control.register}
			/>
			<Field.Label id={`${id}-label`} className="label">
				{label}
			</Field.Label>
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
							aria-labelledby={`${id}-label`}
							aria-describedby={props['aria-describedby']}
							aria-invalid={invalid || undefined}
						/>
					</Slider.Track>
				</Slider.Control>
			</Slider.Root>
			<FieldMessages {...props} />
		</Field.Root>
	);
}

export function SwitchField(props: BooleanFieldProps) {
	const { id, label, invalid, name, defaultChecked } = props;
	const switchRef = useRef<HTMLElement>(null);
	const control = useControl({
		defaultChecked,
		value: 'on',
		onFocus() {
			switchRef.current?.focus();
		},
	});

	return (
		<Field.Root className="field" invalid={invalid}>
			<BaseControl
				type="checkbox"
				name={name}
				value="on"
				defaultChecked={defaultChecked ?? false}
				ref={control.register}
			/>
			<div className="switch-row">
				<Field.Label id={`${id}-label`} className="label">
					{label}
				</Field.Label>
				<Switch.Root
					id={id}
					className="switch"
					ref={switchRef}
					checked={control.checked ?? false}
					onCheckedChange={(checked) => control.change(checked)}
					onBlur={() => control.blur()}
					aria-labelledby={`${id}-label`}
					aria-describedby={props['aria-describedby']}
					aria-invalid={invalid || undefined}
				>
					<Switch.Thumb className="switch-thumb" />
				</Switch.Root>
			</div>
			<FieldMessages {...props} />
		</Field.Root>
	);
}
