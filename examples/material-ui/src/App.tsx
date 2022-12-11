import type { FieldConfig } from '@conform-to/dom';
import { useForm, useFieldset } from '@conform-to/react';
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
import { BaseInput } from 'react-base-input';

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
	const form = useForm<Schema>();
	const fieldset = useFieldset(form.ref, form.config);

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
	const baseRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(config.defaultValue ?? '');

	return (
		<>
			<BaseInput
				ref={baseRef}
				name={config.name}
				value={value}
				required={config.required}
				onFocus={() => inputRef.current?.focus()}
				onReset={() => setValue(config.defaultValue ?? '')}
			/>
			<TextField
				label={label}
				inputRef={inputRef}
				value={value}
				onChange={(event) => setValue(event.target.value)}
				onFocus={() => baseRef.current?.focus()}
				onBlur={() => baseRef.current?.blur()}
				error={Boolean(error)}
				helperText={error}
				inputProps={{
					// To avoid error bubble caused by the constraint
					// attribute set by mui input
					required: false,
				}}
				select
				required={config.required}
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
	const baseRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(config.defaultValue ?? '');
	const options = [
		{ label: 'The Godfather', id: 1 },
		{ label: 'Pulp Fiction', id: 2 },
	];

	return (
		<>
			<BaseInput
				ref={baseRef}
				name={config.name}
				value={value}
				required={config.required}
				onFocus={() => inputRef.current?.focus()}
				onReset={() => setValue(config.defaultValue ?? '')}
			/>
			<Autocomplete
				disablePortal
				options={options}
				value={options.find((option) => value === `${option.id}`) ?? null}
				onChange={(_, option) => setValue(`${option?.id ?? ''}`)}
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						inputRef={inputRef}
						onFocus={() => baseRef.current?.focus()}
						onBlur={() => baseRef.current?.blur()}
						error={Boolean(error)}
						helperText={error}
						required={config.required}
						inputProps={{
							...params.inputProps,
							required: false,
						}}
					/>
				)}
			/>
		</>
	);
}

function ExampleRating({ label, error, ...config }: FieldProps<number>) {
	const baseRef = useRef<HTMLInputElement>(null);
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(config.defaultValue ?? '');

	return (
		<>
			<BaseInput
				ref={baseRef}
				name={config.name}
				value={value}
				required={config.required}
				onFocus={() => inputRef.current?.focus()}
				onReset={() => setValue(config.defaultValue ?? '')}
			/>
			<FormControl variant="standard" error={Boolean(error)} required>
				<FormLabel>{label}</FormLabel>
				<Rating
					ref={inputRef}
					value={value ? Number(value) : null}
					onFocus={() => baseRef.current?.focus()}
					onBlur={() => baseRef.current?.blur()}
					onChange={(_, value) => setValue(`${value ?? ''}`)}
				/>
				<FormHelperText>{error}</FormHelperText>
			</FormControl>
		</>
	);
}

function ExampleSlider({ label, error, ...config }: FieldProps<number>) {
	const inputRef = useRef<HTMLInputElement>(null);
	const [value, setValue] = useState(config.defaultValue ?? '');

	return (
		<>
			<BaseInput
				name={config.name}
				value={value}
				required={config.required}
				onFocus={() => inputRef.current?.focus()}
				onReset={() => setValue(config.defaultValue ?? '')}
			/>
			<FormControl variant="standard" error={Boolean(error)} required>
				<FormLabel>{label}</FormLabel>
				<Slider
					ref={inputRef}
					value={value ? Number(value) : 0}
					onChange={(_, value) => setValue(`${value}`)}
				/>
				<FormHelperText>{error}</FormHelperText>
			</FormControl>
		</>
	);
}
