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

export default function ExampleForm() {
	const { meta, fields } = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate(context) {
			return validateConstraint(context);
		},
	});

	return (
		<Container maxWidth="sm">
			<FormProvider context={meta.context}>
				<form {...getFormProps(meta)}>
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
							error={!fields.email.valid}
							helperText={fields.email.error?.validationMessage}
							required
						/>

						<TextField
							label="Description (TextField - multline)"
							name={fields.description.name}
							error={!fields.description.valid}
							helperText={fields.description.error?.validationMessage}
							inputProps={{
								minLength: 10,
							}}
							required
							multiline
						/>

						<ExampleSelect
							label="Language (Select)"
							name={fields.language.name}
							formId={meta.id}
							required
						/>

						<ExampleAutocomplete
							label="Movie (Autocomplete)"
							name={fields.movie.name}
							formId={meta.id}
							required
						/>

						<FormControl
							component="fieldset"
							variant="standard"
							error={!fields.subscribe.valid}
							required
						>
							<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={<Checkbox name={fields.subscribe.name} required />}
									label="Newsletter"
								/>
							</FormGroup>
							<FormHelperText>
								{fields.subscribe.error?.validationMessage}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={!fields.active.valid}
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
								{fields.active.error?.validationMessage}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={Boolean(fields.enabled.error?.validationMessage)}
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
								{fields.enabled.error?.validationMessage}
							</FormHelperText>
						</FormControl>

						<ExampleRating
							label="Score (Rating)"
							name={fields.score.name}
							formId={fields.score.formId}
							required
						/>

						<ExampleSlider
							label="Progress (Slider)"
							name={fields.progress.name}
							formId={fields.progress.formId}
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

interface Field<Schema>
	extends FieldProps<
		Schema,
		{ validity: ValidityState; validationMessage: string }
	> {
	label: string;
	required?: boolean;
}

function ExampleSelect({ label, required, formId, name }: Field<string>) {
	const { meta } = useField({
		formId,
		name,
	});
	const control = useInputControl(meta);

	return (
		<TextField
			label={label}
			name={meta.name}
			value={control.value ?? ''}
			onChange={(event) => control.change(event.target.value)}
			onBlur={control.blur}
			error={!meta.valid}
			helperText={meta.error?.validationMessage}
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
	const { meta } = useField({
		formId,
		name,
	});
	const control = useInputControl(meta);
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
					name={meta.name}
					error={!meta.valid}
					helperText={meta.error?.validationMessage}
					required={required}
				/>
			)}
		/>
	);
}

function ExampleRating({ label, name, formId, required }: Field<number>) {
	const { meta } = useField({
		formId,
		name,
	});
	const control = useInputControl(meta, {
		initialize(value) {
			return value !== '' ? Number(value) : null;
		},
	});

	return (
		<FormControl variant="standard" error={!meta.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Rating
				value={control.value}
				onChange={(_, value) => {
					control.change(value);
				}}
				onBlur={control.blur}
			/>
			<FormHelperText>{meta.error?.validationMessage}</FormHelperText>
		</FormControl>
	);
}

function ExampleSlider({ label, name, formId, required }: Field<number>) {
	const { meta } = useField({
		formId,
		name,
	});
	const control = useInputControl(meta, {
		initialize(value) {
			return Number(value);
		},
	});

	return (
		<FormControl variant="standard" error={!meta.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Slider
				name={meta.name}
				value={control.value}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.change(value);
				}}
			/>
			<FormHelperText>{meta.error?.validationMessage}</FormHelperText>
		</FormControl>
	);
}
