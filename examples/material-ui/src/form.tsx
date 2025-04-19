import { useControl } from '@conform-to/react';
import {
	TextField,
	MenuItem,
	Autocomplete,
	FormControl,
	FormHelperText,
	FormLabel,
	Rating,
	Slider,
} from '@mui/material';

type ExampleSelectProps = {
	name: string;
	label: string;
	error: string[] | undefined;
	defaultValue?: string;
};

export function ExampleSelect({
	label,
	name,
	error,
	defaultValue,
}: ExampleSelectProps) {
	const control = useControl({ defaultValue, hidden: true });

	return (
		<>
			<input name={name} ref={control.register} defaultValue={defaultValue} />
			<TextField
				label={label}
				value={control.value ?? ''}
				onChange={(event) => control.change(event.target.value)}
				onBlur={() => control.blur()}
				error={!!error}
				helperText={error}
				select
			>
				<MenuItem value="">Please select</MenuItem>
				<MenuItem value="english">English</MenuItem>
				<MenuItem value="german">German</MenuItem>
				<MenuItem value="japanese">Japanese</MenuItem>
			</TextField>
		</>
	);
}

type ExampleAutocompleteProps = {
	name: string;
	label: string;
	error: string[] | undefined;
	defaultValue?: string;
};

export function ExampleAutocomplete({
	label,
	name,
	error,
	defaultValue,
}: ExampleAutocompleteProps) {
	const control = useControl({ defaultValue });
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			value={control.value ? control.value : null}
			onChange={(_, option) => control.change(option ?? '')}
			onBlur={() => control.blur()}
			renderInput={(params) => (
				<TextField
					{...params}
					inputRef={control.register}
					label={label}
					name={name}
					error={!!error}
					helperText={error}
				/>
			)}
		/>
	);
}

type ExampleRatingProps = {
	label: string;
	name: string;
	error: string[] | undefined;
	defaultValue?: string;
};

export function ExampleRating({
	name,
	label,
	error,
	defaultValue,
}: ExampleRatingProps) {
	const control = useControl({ defaultValue, hidden: true });

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input name={name} ref={control.register} defaultValue={defaultValue} />
			<div>
				<Rating
					value={control.value ? Number(control.value) : null}
					onChange={(_, value) => {
						control.change(value?.toString() ?? '');
					}}
					onBlur={() => control.blur()}
				/>
			</div>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}

type ExampleSliderProps = {
	label: string;
	name: string;
	error: string[] | undefined;
	defaultValue?: string;
};

export function ExampleSlider({
	name,
	label,
	error,
	defaultValue,
}: ExampleSliderProps) {
	const control = useControl({ defaultValue, hidden: true });

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input name={name} ref={control.register} defaultValue={defaultValue} />
			<Slider
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
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
