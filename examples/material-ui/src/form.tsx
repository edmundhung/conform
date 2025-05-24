import { useControl } from '@conform-to/react';
import {
	TextField as MuiTextField,
	Autocomplete as MuiAutocomplete,
	Rating as MuiRating,
	Slider as MuiSlider,
	Switch as MuiSwitch,
	RadioGroup as MuiRadioGroup,
	Checkbox as MuiCheckbox,
} from '@mui/material';
import { useRef } from 'react';

type TextFieldProps = React.ComponentProps<typeof MuiTextField> & {
	defaultValue?: string | string[];
};

export function TextField({ name, defaultValue, ...props }: TextFieldProps) {
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
			<MuiTextField
				inputRef={ref}
				value={control.value ?? ''}
				onChange={(event) => control.change(event.target.value)}
				onBlur={() => control.blur()}
				{...props}
			/>
		</>
	);
}

type AutocompleteProps = {
	name: string;
	label: string;
	defaultValue?: string;
	options: string[];
	error: string[] | undefined;
};

export function Autocomplete({
	label,
	name,
	defaultValue,
	options,
	error,
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
				disablePortal
				options={options}
				value={control.value ? control.value : null}
				onChange={(_, option) => control.change(option ?? '')}
				onBlur={() => control.blur()}
				renderInput={(params) => (
					<MuiTextField
						{...params}
						inputRef={ref}
						label={label}
						error={!!error}
						helperText={error}
					/>
				)}
			/>
		</>
	);
}

type CheckboxProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function Checkbox({ name, value, defaultChecked }: CheckboxProps) {
	const ref = useRef<HTMLInputElement>(null);
	const control = useControl({
		value,
		defaultChecked,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" name={name} ref={control.register} hidden />
			<MuiCheckbox
				inputRef={ref}
				checked={control.checked}
				onChange={(event) => control.change(event.target.checked)}
				onBlur={() => control.blur()}
			/>
		</>
	);
}

type RadioGroupProps = {
	name?: string;
	defaultValue?: string;
	children: React.ReactNode;
};

export function RadioGroup({ name, defaultValue, children }: RadioGroupProps) {
	const firstLabelRef = useRef<HTMLLabelElement | null>(null);
	const control = useControl({
		defaultValue,
		onFocus() {
			firstLabelRef.current?.focus();
		},
	});

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<MuiRadioGroup
				ref={(element) =>
					(firstLabelRef.current =
						element instanceof HTMLElement
							? element.querySelector('label')
							: null)
				}
				value={control.value ? control.value : null}
				onChange={(event) => control.change(event.target.value)}
				onBlur={() => control.blur()}
			>
				{children}
			</MuiRadioGroup>
		</>
	);
}

type SwitchProps = {
	name: string;
	value?: string;
	defaultChecked?: boolean;
};

export function Switch({ name, value, defaultChecked }: SwitchProps) {
	const ref = useRef<HTMLElement>(null);
	const control = useControl({
		value,
		defaultChecked,
		onFocus() {
			ref.current?.focus();
		},
	});

	return (
		<>
			<input type="checkbox" name={name} ref={control.register} hidden />
			<MuiSwitch
				inputRef={ref}
				checked={control.checked}
				onChange={(event) => control.change(event.target.checked)}
				onBlur={() => control.blur()}
			/>
		</>
	);
}

type RatingProps = {
	name: string;
	defaultValue?: string;
};

export function Rating({ name, defaultValue }: RatingProps) {
	const control = useControl({ defaultValue });

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<MuiRating
				value={control.value ? Number(control.value) : null}
				onChange={(_, value) => {
					control.change(value?.toString() ?? '');
				}}
				onBlur={() => control.blur()}
			/>
		</>
	);
}

type SliderProps = {
	name: string;
	defaultValue?: string;
};

export function Slider({ name, defaultValue }: SliderProps) {
	const control = useControl({ defaultValue });

	return (
		<>
			<input name={name} ref={control.register} hidden />
			<MuiSlider
				min={0}
				max={10}
				step={1}
				value={control.value ? Number(control.value) : 0}
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
