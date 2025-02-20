import { useInput } from 'conform-react';
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
	const input = useInput(defaultValue);

	return (
		<>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
			<TextField
				label={label}
				value={input.value ?? ''}
				onChange={(event) => input.change(event.target.value)}
				onBlur={() => input.blur()}
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
	const input = useInput(defaultValue);
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			value={input.value ? input.value : null}
			onChange={(_, option) => input.change(option ?? '')}
			onBlur={() => input.blur()}
			renderInput={(params) => (
				<TextField
					{...params}
					inputRef={input.register}
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
	const input = useInput(defaultValue);

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
			<div>
				<Rating
					value={input.value ? Number(input.value) : null}
					onChange={(_, value) => {
						input.change(value?.toString() ?? '');
					}}
					onBlur={() => input.blur()}
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
	const input = useInput(defaultValue);

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input
				{...input.visuallyHiddenProps}
				name={name}
				ref={input.register}
				defaultValue={defaultValue}
			/>
			<Slider
				min={0}
				max={10}
				step={1}
				value={input.value ? Number(input.value) : 0}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					input.change(value.toString());
				}}
				onBlur={() => input.blur()}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
