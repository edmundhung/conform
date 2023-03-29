import type { FieldConfig } from '@conform-to/react';
import { useForm, conform, useInputEvent } from '@conform-to/react';
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
import { useRef, useState } from 'react';

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

export default function ExampleForm() {
	const [form, fieldset] = useForm<Schema>({ shouldValidate: 'onBlur' });

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
	const [ref, control] = useInputEvent({
		onReset: () => setValue(config.defaultValue ?? ''),
	});
	const inputRef = useRef<HTMLInputElement>(null);

	return (
		<>
			<input
				ref={ref}
				{...conform.input(config, { hidden: true })}
				onChange={(e) => setValue(e.target.value)}
				onFocus={() => inputRef.current?.focus()}
			/>
			<TextField
				label={label}
				inputRef={inputRef}
				value={value}
				onChange={control.change}
				onFocus={control.focus}
				onBlur={control.blur}
				error={Boolean(error)}
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

function ExampleAutocomplete({ label, error, ...config }: FieldProps<string>) {
	const [inputRef, control] = useInputEvent();
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			defaultValue={options.find((option) => option === config.defaultValue)}
			onChange={(_, option) => control.change(`${option ?? ''}`)}
			onFocus={control.focus}
			onBlur={control.blur}
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
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputEvent({
		onReset: () => setValue(config.defaultValue ?? ''),
	});

	return (
		<FormControl variant="standard" error={Boolean(error)} required>
			<FormLabel>{label}</FormLabel>
			<input
				ref={inputRef}
				{...conform.input(config, {
					type: 'number',
					hidden: true,
				})}
				onChange={(e) => setValue(e.target.value)}
			/>
			<Rating
				value={value ? Number(value) : null}
				onChange={(_, value) => {
					control.change(`${value ?? ''}`);
				}}
				onFocus={control.focus}
				onBlur={control.blur}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}

function ExampleSlider({ label, error, ...config }: FieldProps<number>) {
	const [value, setValue] = useState(config.defaultValue ?? '');
	const [inputRef, control] = useInputEvent<HTMLInputElement>({
		onReset: () => setValue(config.defaultValue ?? ''),
	});

	return (
		<FormControl variant="standard" error={Boolean(error)} required>
			<FormLabel>{label}</FormLabel>
			<input
				ref={inputRef}
				{...conform.input(config, { hidden: true })}
				onChange={(e) => setValue(e.target.value)}
			/>
			<Slider
				value={value ? Number(value) : undefined}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.change(`${value}`);
				}}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
