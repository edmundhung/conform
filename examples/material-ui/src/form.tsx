import { BaseControl, useControl } from '@conform-to/react/future';
import { NumberField as BaseNumberField } from '@base-ui/react/number-field';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import {
	TextField as MuiTextField,
	Autocomplete as MuiAutocomplete,
	Rating as MuiRating,
	Slider as MuiSlider,
	FormControl,
	FormHelperText,
	IconButton,
	InputAdornment,
	InputLabel,
	OutlinedInput,
} from '@mui/material';
import { useId, useRef } from 'react';

function setRef<T>(ref: React.Ref<T> | undefined, value: T | null) {
	if (typeof ref === 'function') {
		ref(value);
	} else if (ref) {
		ref.current = value;
	}
}

function isFocusLeaving(event: React.FocusEvent<HTMLElement>) {
	return !event.currentTarget.contains(event.relatedTarget);
}

function toFiniteNumber(value: string | undefined): number | null {
	if (!value) {
		return null;
	}

	const number = Number(value);

	return Number.isFinite(number) ? number : null;
}

type ControlProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	required?: boolean;
	'aria-invalid'?: React.AriaAttributes['aria-invalid'];
	'aria-describedby'?: string;
	'aria-labelledby'?: string;
};

export type AutocompleteProps = ControlProps & {
	label: string;
	options: string[];
	error?: boolean;
	helperText?: string[];
};

export function Autocomplete({
	label,
	id,
	name,
	defaultValue,
	options,
	error,
	helperText,
	required,
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
}: AutocompleteProps) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<MuiAutocomplete
				id={id}
				disablePortal
				options={options}
				value={control.value ? control.value : null}
				onChange={(_, option) => control.change(option ?? '')}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
				renderInput={(params) => {
					const autocompleteRef = params.slotProps.htmlInput.ref;

					return (
						<MuiTextField
							{...params}
							id={id}
							label={label}
							required={required}
							error={error}
							helperText={helperText}
							slotProps={{
								...params.slotProps,
								formHelperText: { id: ariaDescribedBy },
								htmlInput: {
									...params.slotProps.htmlInput,
									'aria-invalid': ariaInvalid,
									'aria-describedby': ariaDescribedBy,
									ref(element: HTMLInputElement | null) {
										ref.current = element;
										setRef(autocompleteRef, element);
									},
								},
							}}
						/>
					);
				}}
			/>
		</>
	);
}

type MuiNumberFieldProps = BaseNumberField.Root.Props & {
	label?: React.ReactNode;
	size?: 'small' | 'medium';
	error?: boolean;
	helperText?: React.ReactNode;
	'aria-invalid'?: React.AriaAttributes['aria-invalid'];
	'aria-describedby'?: string;
};

function MuiNumberField({
	id: idProp,
	label,
	error,
	helperText,
	inputRef,
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
	size = 'medium',
	...props
}: MuiNumberFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;
	const hasValue = props.value != null;

	return (
		<BaseNumberField.Root
			{...props}
			render={(rootProps, state) => {
				// Native div props accept any color string, while MUI restricts this
				// prop to theme colors. All other Base UI root props are compatible.
				const { color: _color, ...formControlProps } = rootProps;

				return (
					<FormControl
						{...formControlProps}
						size={size}
						disabled={state.disabled}
						required={state.required}
						error={error}
						variant="outlined"
					/>
				);
			}}
		>
			<InputLabel htmlFor={id} shrink={hasValue ? true : undefined}>
				{label}
			</InputLabel>
			<BaseNumberField.Input
				id={id}
				render={(inputProps, state) => {
					const { ref: baseInputRef, ...htmlInputProps } = inputProps;

					return (
						<OutlinedInput
							label={label}
							notched={hasValue ? true : undefined}
							inputRef={(element) => {
								setRef(baseInputRef, element);
								setRef(inputRef, element);
							}}
							value={state.inputValue}
							onBlur={inputProps.onBlur}
							onChange={inputProps.onChange}
							onKeyUp={inputProps.onKeyUp}
							onKeyDown={inputProps.onKeyDown}
							onFocus={inputProps.onFocus}
							slotProps={{
								input: {
									...htmlInputProps,
									'aria-invalid': ariaInvalid,
									'aria-describedby': ariaDescribedBy,
								},
							}}
							endAdornment={
								<InputAdornment
									position="end"
									sx={{
										flexDirection: 'column',
										maxHeight: 'unset',
										alignSelf: 'stretch',
										borderLeft: '1px solid',
										borderColor: 'divider',
										ml: 0,
										'& button': {
											py: 0,
											flex: 1,
											borderRadius: 0.5,
										},
									}}
								>
									<BaseNumberField.Increment
										render={<IconButton size={size} aria-label="Increase" />}
									>
										<KeyboardArrowUpIcon
											fontSize={size}
											sx={{ transform: 'translateY(2px)' }}
										/>
									</BaseNumberField.Increment>
									<BaseNumberField.Decrement
										render={<IconButton size={size} aria-label="Decrease" />}
									>
										<KeyboardArrowDownIcon
											fontSize={size}
											sx={{ transform: 'translateY(-2px)' }}
										/>
									</BaseNumberField.Decrement>
								</InputAdornment>
							}
							sx={{ pr: 0 }}
						/>
					);
				}}
			/>
			<FormHelperText id={ariaDescribedBy} sx={{ ml: 0, '&:empty': { mt: 0 } }}>
				{helperText}
			</FormHelperText>
		</BaseNumberField.Root>
	);
}

export type NumberFieldProps = Omit<
	MuiNumberFieldProps,
	'defaultValue' | 'value' | 'onValueChange' | 'name' | 'inputRef'
> & {
	name: string;
	defaultValue?: string;
};

export function NumberField({
	name,
	defaultValue,
	...props
}: NumberFieldProps) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<MuiNumberField
				{...props}
				inputRef={ref}
				value={toFiniteNumber(control.value)}
				onValueChange={(value) => control.change(value?.toString() ?? '')}
				onBlur={(event) => {
					if (isFocusLeaving(event)) control.blur();
				}}
			/>
		</>
	);
}

export type RatingProps = ControlProps;

export function Rating({
	id,
	name,
	defaultValue,
	required,
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
	'aria-labelledby': ariaLabelledBy,
}: RatingProps) {
	const ref = useRef<HTMLSpanElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			const input =
				ref.current?.querySelector<HTMLInputElement>('input:checked') ??
				ref.current?.querySelector<HTMLInputElement>('input');

			input?.focus();
		},
	});

	return (
		<div
			id={id}
			role="radiogroup"
			aria-invalid={ariaInvalid}
			aria-required={required}
			aria-describedby={ariaDescribedBy}
			aria-labelledby={ariaLabelledBy}
			onBlur={(event) => {
				if (isFocusLeaving(event)) control.blur();
			}}
		>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<MuiRating
				ref={(element) => {
					ref.current = element;
					element
						?.querySelectorAll('input')
						.forEach((input) => input.setAttribute('form', ''));
				}}
				value={toFiniteNumber(control.value)}
				onChange={(_, value) => {
					control.change(value?.toString() ?? '');
				}}
			/>
		</div>
	);
}

export type SliderProps = ControlProps;

export function Slider({
	id,
	name,
	defaultValue,
	required,
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
	'aria-labelledby': ariaLabelledBy,
}: SliderProps) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<BaseControl
				name={name}
				ref={control.register}
				defaultValue={control.defaultValue ?? ''}
			/>
			<MuiSlider
				min={0}
				max={10}
				step={1}
				value={toFiniteNumber(control.value) ?? 0}
				aria-labelledby={ariaLabelledBy}
				slotProps={{
					input: {
						id,
						ref,
						'aria-invalid': ariaInvalid,
						'aria-required': required,
						'aria-describedby': ariaDescribedBy,
					},
				}}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.change(value.toString());
				}}
				onBlur={() => control.blur()}
			/>
		</>
	);
}
