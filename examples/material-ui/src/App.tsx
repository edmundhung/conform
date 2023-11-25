import type { FieldProps } from '@conform-to/react';
import {
	FormProvider,
	useForm,
	useField,
	useInputControl,
	validateConstraint,
	getFormProps,
} from '@conform-to/react';
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

export default function ExampleForm() {
	const form = useForm<Schema>({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate(context) {
			return validateConstraint(context);
		},
	});

	return (
		<Container maxWidth="sm">
			<FormProvider context={form.context}>
				<form {...getFormProps(form)}>
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
							error={!form.fields.email.valid}
							helperText={form.fields.email.errors?.join(', ')}
							required
						/>

						<TextField
							label="Description (TextField - multline)"
							name={form.fields.description.name}
							error={!form.fields.description.valid}
							helperText={form.fields.description.errors?.join(', ')}
							inputProps={{
								minLength: 10,
							}}
							required
							multiline
						/>

						<ExampleSelect
							label="Language (Select)"
							name={form.fields.language.name}
							formId={form.id}
							required
						/>

						<ExampleAutocomplete
							label="Movie (Autocomplete)"
							name={form.fields.movie.name}
							formId={form.id}
							required
						/>

						<FormControl
							component="fieldset"
							variant="standard"
							error={!form.fields.subscribe.valid}
							required
						>
							<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={
										<Checkbox name={form.fields.subscribe.name} required />
									}
									label="Newsletter"
								/>
							</FormGroup>
							<FormHelperText>
								{form.fields.subscribe.errors?.join(', ')}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={!form.fields.active.valid}
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
							<FormHelperText>
								{form.fields.active.errors?.join(', ')}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={Boolean(form.fields.enabled.errors?.join(', '))}
							required
						>
							<FormLabel>Enabled (Switch)</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={<Switch name="enabled" required />}
									label="Enabled"
								/>
							</FormGroup>
							<FormHelperText>
								{form.fields.enabled.errors?.join(', ')}
							</FormHelperText>
						</FormControl>

						<ExampleRating
							label="Score (Rating)"
							name={form.fields.score.name}
							formId={form.fields.score.formId}
							required
						/>

						<ExampleSlider
							label="Progress (Slider)"
							name={form.fields.progress.name}
							formId={form.fields.progress.formId}
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
			</FormProvider>
		</Container>
	);
}

interface Field<Schema> extends FieldProps<Schema> {
	label: string;
	required?: boolean;
}

function ExampleSelect({ label, required, formId, name }: Field<string>) {
	const field = useField({
		formId,
		name,
	});
	const control = useInputControl(field);

	return (
		<TextField
			label={label}
			name={field.name}
			value={control.value ?? ''}
			onChange={(event) => control.change(event.target.value)}
			onBlur={control.blur}
			error={!field.valid}
			helperText={field.errors?.join(', ')}
			select
			required={required}
		>
			<MenuItem value="">Please select</MenuItem>
			<MenuItem value="english">English</MenuItem>
			<MenuItem value="deutsch">Deutsch</MenuItem>
			<MenuItem value="japanese">Japanese</MenuItem>
		</TextField>
	);
}

function ExampleAutocomplete({ label, name, formId, required }: Field<string>) {
	const field = useField({
		formId,
		name,
	});
	const control = useInputControl(field);
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			value={control.value}
			onChange={(event, option) => control.change(option ?? '')}
			onBlur={control.blur}
			renderInput={(params) => (
				<TextField
					{...params}
					label={label}
					name={field.name}
					error={!field.valid}
					helperText={field.errors?.join(', ')}
					required={required}
				/>
			)}
		/>
	);
}

function ExampleRating({ label, name, formId, required }: Field<number>) {
	const field = useField({
		formId,
		name,
	});
	const control = useInputControl(field, {
		initialize(value) {
			return value !== '' ? Number(value) : null;
		},
	});

	return (
		<FormControl variant="standard" error={!field.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Rating
				value={control.value}
				onChange={(_, value) => {
					control.change(value);
				}}
				onBlur={control.blur}
			/>
			<FormHelperText>{field.errors?.join(', ')}</FormHelperText>
		</FormControl>
	);
}

function ExampleSlider({ label, name, formId, required }: Field<number>) {
	const field = useField({
		formId,
		name,
	});
	const control = useInputControl(field, {
		initialize(value) {
			return Number(value);
		},
	});

	return (
		<FormControl variant="standard" error={!field.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Slider
				name={field.name}
				value={control.value}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.change(value);
				}}
			/>
			<FormHelperText>{field.errors?.join(', ')}</FormHelperText>
		</FormControl>
	);
}
