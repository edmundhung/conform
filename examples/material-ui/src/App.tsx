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
	const { form, fieldset } = useForm({
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
							error={!fieldset.email.valid}
							helperText={fieldset.email.errors?.validationMessage}
							required
						/>

						<TextField
							label="Description (TextField - multline)"
							name={fieldset.description.name}
							error={!fieldset.description.valid}
							helperText={fieldset.description.errors?.validationMessage}
							inputProps={{
								minLength: 10,
							}}
							required
							multiline
						/>

						<ExampleSelect
							label="Language (Select)"
							name={fieldset.language.name}
							formId={form.id}
							required
						/>

						<ExampleAutocomplete
							label="Movie (Autocomplete)"
							name={fieldset.movie.name}
							formId={form.id}
							required
						/>

						<FormControl
							component="fieldset"
							variant="standard"
							error={!fieldset.subscribe.valid}
							required
						>
							<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
							<FormGroup>
								<FormControlLabel
									control={<Checkbox name={fieldset.subscribe.name} required />}
									label="Newsletter"
								/>
							</FormGroup>
							<FormHelperText>
								{fieldset.subscribe.errors?.validationMessage}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={!fieldset.active.valid}
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
								{fieldset.active.errors?.validationMessage}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={Boolean(fieldset.enabled.errors?.validationMessage)}
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
								{fieldset.enabled.errors?.validationMessage}
							</FormHelperText>
						</FormControl>

						<ExampleRating
							label="Score (Rating)"
							name={fieldset.score.name}
							formId={fieldset.score.formId}
							required
						/>

						<ExampleSlider
							label="Progress (Slider)"
							name={fieldset.progress.name}
							formId={fieldset.progress.formId}
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

type Field<Schema> = FieldProps<
	Schema,
	{ validity: ValidityState; validationMessage: string }
> & {
	label: string;
	required?: boolean;
};

function ExampleSelect({ label, required, formId, name }: Field<string>) {
	const { field } = useField({
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
			helperText={field.errors?.validationMessage}
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
	const { field } = useField({
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
					helperText={field.errors?.validationMessage}
					required={required}
				/>
			)}
		/>
	);
}

function ExampleRating({ label, name, formId, required }: Field<number>) {
	const { field } = useField({
		formId,
		name,
	});
	const control = useInputControl(field);

	return (
		<FormControl variant="standard" error={!field.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Rating
				value={control.value ? Number(control.value) : null}
				onChange={(_, value) => {
					control.change(value?.toString() ?? '');
				}}
				onBlur={control.blur}
			/>
			<FormHelperText>{field.errors?.validationMessage}</FormHelperText>
		</FormControl>
	);
}

function ExampleSlider({ label, name, formId, required }: Field<number>) {
	const { field } = useField({
		formId,
		name,
	});
	const control = useInputControl(field);

	return (
		<FormControl variant="standard" error={!field.valid} required={required}>
			<FormLabel>{label}</FormLabel>
			<Slider
				name={field.name}
				value={control.value ? Number(control.value) : 0}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					control.change(value.toString());
				}}
			/>
			<FormHelperText>{field.errors?.validationMessage}</FormHelperText>
		</FormControl>
	);
}
