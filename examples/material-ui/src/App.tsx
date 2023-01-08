import type { FieldConfig } from '@conform-to/react';
import { useForm, useControlledInput } from '@conform-to/react';
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
	const [form, fieldset] = useForm<Schema>();

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
	/**
	 * MUI Select is a non-native input and does not dispatch any DOM events (e.g. input / focus / blur).
	 * This hooks works by dispatching DOM events manually on the shadow input and thus validated once
	 * it is hooked up with the controlled component.
	 */
	const [shadowInput, control] = useControlledInput(config);

	return (
		<>
			<input {...shadowInput} />
			<TextField
				label={label}
				inputRef={control.ref}
				value={control.value}
				onChange={control.onChange}
				onBlur={control.onBlur}
				error={Boolean(error)}
				helperText={error}
				inputProps={{
					// To disable error bubble caused by the constraint
					// attribute set by mui input, e.g. `required`
					onInvalid: control.onInvalid,
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
	const [shadowInput, control] = useControlledInput(config);
	const options = [
		{ label: 'The Godfather', id: 1 },
		{ label: 'Pulp Fiction', id: 2 },
	];

	return (
		<>
			<input {...shadowInput} />
			<Autocomplete
				disablePortal
				options={options}
				value={
					options.find((option) => control.value === `${option.id}`) ?? null
				}
				onChange={(_, option) => control.onChange(`${option?.id ?? ''}`)}
				renderInput={(params) => (
					<TextField
						{...params}
						label={label}
						onBlur={control.onBlur}
						error={Boolean(error)}
						helperText={error}
						required={config.required}
						inputProps={{
							...params.inputProps,
							// To disable error bubble caused by the constraint
							// attribute set by mui input, e.g. `required`
							onInvalid: control.onInvalid,
						}}
					/>
				)}
			/>
		</>
	);
}

function ExampleRating({ label, error, ...config }: FieldProps<number>) {
	const [shadowInput, control] = useControlledInput(config);

	return (
		<>
			<input {...shadowInput} />
			<FormControl variant="standard" error={Boolean(error)} required>
				<FormLabel>{label}</FormLabel>
				<Rating
					ref={control.ref}
					value={control.value ? Number(control.value) : null}
					onChange={(_, value) => control.onChange(`${value ?? ''}`)}
				/>
				<FormHelperText>{error}</FormHelperText>
			</FormControl>
		</>
	);
}

function ExampleSlider({ label, error, ...config }: FieldProps<number>) {
	const [shadowInput, control] = useControlledInput(config);

	return (
		<>
			<input {...shadowInput} />
			<FormControl variant="standard" error={Boolean(error)} required>
				<FormLabel>{label}</FormLabel>
				<Slider
					ref={control.ref}
					value={control.value ? Number(control.value) : 0}
					onChange={(_, value) => control.onChange(`${value}`)}
				/>
				<FormHelperText>{error}</FormHelperText>
			</FormControl>
		</>
	);
}
