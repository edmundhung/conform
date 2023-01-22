import type { FieldConfig } from '@conform-to/react';
import { useForm, conform, useInputControl } from '@conform-to/react';
import {
	TextField,
	Button,
	MenuItem,
	Stack,
	Container,
	Typography,
	Autocomplete,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	RadioGroup,
	Radio,
	Rating,
	Slider,
	Switch,
} from '@mui/material';
import { useState } from 'react';

interface Schema {
	email: string;
	description: string;
	language: string;
	movie: string;
	subscribe: boolean;
	enabled: boolean;
	active: boolean;
	score: number;
	progress: number;
}

export default function ArticleForm() {
	const [form, fieldset] = useForm<Schema>({ initialReport: 'onBlur' });

	return (
		<Container maxWidth="sm">
			<form {...form.props}>
				<Stack spacing={4} marginY={4}>
					<header>
						<Typography variant="h6" component="h1">
							Material UI Example
						</Typography>
						<Typography variant="subtitle1">
							This example shows you how to integrate Inputs components with
							Conform.
						</Typography>
					</header>

					<TextField
						label="Email (TextField)"
						type="email"
						name="email"
						error={Boolean(fieldset.email.error)}
						helperText={fieldset.email.error}
						required
					/>

					<TextField
						label="Description (TextField - multline)"
						name="description"
						error={Boolean(fieldset.description.error)}
						helperText={fieldset.description.error}
						inputProps={{
							minLength: 10,
						}}
						required
						multiline
					/>

					<ExampleSelect
						label="Language (Select)"
						name="language"
						error={fieldset.language.error}
						required
					/>

					<ExampleAutocomplete
						label="Movie (Autocomplete)"
						name="movie"
						error={fieldset.movie.error}
						required
					/>

					<FormControl
						component="fieldset"
						variant="standard"
						error={Boolean(fieldset.subscribe.error)}
						required
					>
						<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Checkbox name="subscribe" required />}
								label="Newsletter"
							/>
						</FormGroup>
						<FormHelperText>{fieldset.subscribe.error}</FormHelperText>
					</FormControl>

					<FormControl
						variant="standard"
						error={Boolean(fieldset.active.error)}
						required
					>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup name="active">
							<FormControlLabel
								value="yes"
								control={<Radio required />}
								label="Yes"
							/>
							<FormControlLabel
								value="no"
								control={<Radio required />}
								label="No"
							/>
						</RadioGroup>
						<FormHelperText>{fieldset.active.error}</FormHelperText>
					</FormControl>

					<FormControl
						variant="standard"
						error={Boolean(fieldset.enabled.error)}
						required
					>
						<FormLabel>Enabled (Switch)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Switch name="enabled" required />}
								label="Enabled"
							/>
						</FormGroup>
						<FormHelperText>{fieldset.enabled.error}</FormHelperText>
					</FormControl>

					<ExampleRating
						label="Score (Rating)"
						name="score"
						error={fieldset.score.error}
						required
					/>

					<ExampleSlider
						label="Progress (Slider)"
						name="progress"
						error={fieldset.progress.error}
						required
					/>

					<Stack direction="row" justifyContent="flex-end" spacing={2}>
						<Button type="reset" variant="outlined">
							Reset
						</Button>
						<Button type="submit" variant="contained">
							Submit
						</Button>
					</Stack>
				</Stack>
			</form>
		</Container>
	);
}

interface FieldProps<Schema> extends FieldConfig<Schema> {
	label: string;
	error?: string;
}

function ExampleSelect({ label, error, ...config }: FieldProps<string>) {
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputControl<{
		node: HTMLInputElement;
		focus: () => void;
	}>({
		getElement: (ref) => ref?.node,
		onReset: () => setValue(config.defaultValue ?? ''),
	});

	return (
		<TextField
			label={label}
			inputRef={inputRef}
			name={config.name}
			value={value}
			onChange={(event) => {
				control.onChange(event);
				setValue(event.target.value);
			}}
			onFocus={control.onFocus}
			onBlur={control.onBlur}
			error={Boolean(error)}
			helperText={error}
			select
			required={config.required}
		>
			<MenuItem value="">Please select</MenuItem>
			<MenuItem value="english">English</MenuItem>
			<MenuItem value="deutsch">Deutsch</MenuItem>
			<MenuItem value="japanese">Japanese</MenuItem>
		</TextField>
	);
}

function ExampleAutocomplete({ label, error, ...config }: FieldProps<string>) {
	const [inputRef, control] = useInputControl();
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			defaultValue={options.find((option) => option === config.defaultValue)}
			onChange={(_, option) => control.onChange(`${option ?? ''}`)}
			onFocus={control.onFocus}
			onBlur={control.onBlur}
			renderInput={(params) => (
				<TextField
					{...params}
					inputRef={inputRef}
					label={label}
					name={config.name}
					error={Boolean(error)}
					helperText={error}
					required={config.required}
				/>
			)}
		/>
	);
}

function ExampleRating({ label, error, ...config }: FieldProps<number>) {
	const [value, setValue] = useState(
		config.defaultValue ? Number(config.defaultValue) : null,
	);
	const [inputRef, control] = useInputControl({
		onReset: () =>
			setValue(config.defaultValue ? Number(config.defaultValue) : null),
	});

	return (
		<FormControl variant="standard" error={Boolean(error)} required>
			<FormLabel>{label}</FormLabel>
			<input
				ref={inputRef}
				{...conform.input(config as FieldConfig<number>, {
					type: 'number',
					hidden: true,
				})}
			/>
			<Rating
				value={value}
				onFocus={control.onFocus}
				onChange={(_, value) => {
					control.onChange(`${value ?? ''}`);
					console.log('rating', value);
					setValue(value);
				}}
				onBlur={control.onBlur}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}

function ExampleSlider({ label, error, ...config }: FieldProps<number>) {
	const [value, setValue] = useState(
		config.defaultValue ? Number(config.defaultValue) : undefined,
	);
	const [inputRef, control] = useInputControl<HTMLInputElement>({
		onReset: () =>
			setValue(config.defaultValue ? Number(config.defaultValue) : undefined),
	});

	return (
		<FormControl variant="standard" error={Boolean(error)} required>
			<FormLabel>{label}</FormLabel>
			<input
				ref={inputRef}
				{...conform.input(config as FieldConfig<number>, { hidden: true })}
			/>
			<Slider
				value={value}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.onChange(`${value}`);
					setValue(value);
				}}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
