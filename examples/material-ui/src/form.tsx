import { useControl } from '@conform-to/react/future';
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

export type AutocompleteProps = {
	id?: string;
	name: string;
	label: string;
	defaultValue?: string;
	options: string[];
	error: string[] | undefined;
	'aria-invalid'?: React.AriaAttributes['aria-invalid'];
	'aria-describedby'?: string;
};

export function Autocomplete({
	label,
	id,
	name,
	defaultValue,
	options,
	error,
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
			<input name={name} ref={control.register} hidden />
			<MuiAutocomplete
				id={id}
				disablePortal
				options={options}
				value={control.value ? control.value : null}
				onChange={(_, option) => control.change(option ?? '')}
				onBlur={() => control.blur()}
				renderInput={(params) => {
					const autocompleteRef = params.slotProps.htmlInput.ref;

					return (
						<MuiTextField
							{...params}
							id={id}
							label={label}
							error={!!error}
							helperText={error}
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

// MUI FormControl detects an Input child to derive its initial filled state.
// The Base UI input renders through a callback, so this marker supplies the
// NumberField value props without rendering an extra control.
function NumberFieldFilledStateInput(props: BaseNumberField.Root.Props) {
	void props;
	return null;
}
NumberFieldFilledStateInput.muiName = 'Input';

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
	'aria-invalid': ariaInvalid,
	'aria-describedby': ariaDescribedBy,
	size = 'medium',
	...props
}: MuiNumberFieldProps) {
	const generatedId = useId();
	const id = idProp ?? generatedId;

	return (
		<BaseNumberField.Root
			{...props}
			render={(rootProps, state) => (
				<FormControl
					size={size}
					ref={rootProps.ref}
					onBlur={props.onBlur}
					disabled={state.disabled}
					required={state.required}
					error={error}
					variant="outlined"
				>
					{rootProps.children}
				</FormControl>
			)}
		>
			<NumberFieldFilledStateInput {...props} />
			<InputLabel htmlFor={id}>{label}</InputLabel>
			<BaseNumberField.Input
				id={id}
				render={(inputProps, state) => (
					<OutlinedInput
						label={label}
						inputRef={inputProps.ref}
						value={state.inputValue}
						onBlur={inputProps.onBlur}
						onChange={inputProps.onChange}
						onKeyUp={inputProps.onKeyUp}
						onKeyDown={inputProps.onKeyDown}
						onFocus={inputProps.onFocus}
						slotProps={{
							input: {
								...inputProps,
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
				)}
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
			<input name={name} ref={control.register} hidden />
			<MuiNumberField
				{...props}
				inputRef={ref}
				value={control.value ? Number(control.value) : null}
				onValueChange={(value) => control.change(value?.toString() ?? '')}
				onBlur={() => control.blur()}
			/>
		</>
	);
}

export type RatingProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	'aria-invalid'?: React.AriaAttributes['aria-invalid'];
	'aria-describedby'?: string;
	'aria-labelledby'?: string;
};

export function Rating({
	id,
	name,
	defaultValue,
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
			aria-describedby={ariaDescribedBy}
			aria-labelledby={ariaLabelledBy}
		>
			<input name={name} ref={control.register} hidden />
			<MuiRating
				ref={(element) => {
					ref.current = element;
					element
						?.querySelectorAll('input')
						.forEach((input) => input.setAttribute('form', ''));
				}}
				value={control.value ? Number(control.value) : null}
				onChange={(_, value) => {
					control.change(value?.toString() ?? '');
				}}
				onBlur={() => control.blur()}
			/>
		</div>
	);
}

export type SliderProps = {
	id?: string;
	name: string;
	defaultValue?: string;
	'aria-invalid'?: React.AriaAttributes['aria-invalid'];
	'aria-describedby'?: string;
	'aria-labelledby'?: string;
};

export function Slider({
	id,
	name,
	defaultValue,
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
			<input name={name} ref={control.register} hidden />
			<MuiSlider
				min={0}
				max={10}
				step={1}
				value={control.value ? Number(control.value) : 0}
				aria-labelledby={ariaLabelledBy}
				slotProps={{
					input: {
						id,
						ref,
						'aria-invalid': ariaInvalid,
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
