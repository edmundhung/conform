import { useCustomInput } from 'conform-react';
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
};

export function ExampleSelect({ label, name, error }: ExampleSelectProps) {
	const input = useCustomInput('');

	return (
		<>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<TextField
				label={label}
				value={input.value}
				onChange={(event) => input.changed(event.target.value)}
				onBlur={() => input.blurred()}
				error={!!error}
				helperText={error}
				select
			>
				<MenuItem value="">Please select</MenuItem>
				<MenuItem value="english">English</MenuItem>
				<MenuItem value="deutsch">Deutsch</MenuItem>
				<MenuItem value="japanese">Japanese</MenuItem>
			</TextField>
		</>
	);
}

type ExampleAutocompleteProps = {
	name: string;
	label: string;
	error: string[] | undefined;
};

export function ExampleAutocomplete({
	label,
	name,
	error,
}: ExampleAutocompleteProps) {
	const input = useCustomInput('');
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			value={input.value !== '' ? input.value : null}
			onChange={(_, option) => input.changed(option ?? '')}
			onBlur={() => input.blurred()}
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
};

export function ExampleRating({ name, label, error }: ExampleRatingProps) {
	const input = useCustomInput('');

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<div>
				<Rating
					value={input.value ? Number(input.value) : null}
					onChange={(_, value) => {
						input.changed(value?.toString() ?? '');
					}}
					onBlur={() => input.blurred()}
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
};

export function ExampleSlider({ name, label, error }: ExampleSliderProps) {
	const input = useCustomInput('');

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<Slider
				min={0}
				max={10}
				step={1}
				value={input.value ? Number(input.value) : 0}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					input.changed(value.toString());
				}}
				onBlur={() => input.blurred()}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
