import type { FieldName } from '@conform-to/react';
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
	const [form, fields] = useForm({
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
							error={!fields.email.valid}
							helperText={fields.email.errors?.validationMessage}
							required
						/>

						<TextField
							label="Description (TextField - multline)"
							name={fields.description.name}
							error={!fields.description.valid}
							helperText={fields.description.errors?.validationMessage}
							inputProps={{
								minLength: 10,
							}}
							required
							multiline
						/>

						<ExampleSelect
							label="Language (Select)"
							name={fields.language.name}
							required
						/>

						<ExampleAutocomplete
							label="Movie (Autocomplete)"
							name={fields.movie.name}
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
								{fields.subscribe.errors?.validationMessage}
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
								{fields.active.errors?.validationMessage}
							</FormHelperText>
						</FormControl>

						<FormControl
							variant="standard"
							error={Boolean(fields.enabled.errors?.validationMessage)}
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
								{fields.enabled.errors?.validationMessage}
							</FormHelperText>
						</FormControl>

						<ExampleRating
							label="Score (Rating)"
							name={fields.score.name}
							required
						/>

						<ExampleSlider
							label="Progress (Slider)"
							name={fields.progress.name}
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

type Field<Schema> = {
	name: FieldName<
		Schema,
		{
			validity: ValidityState;
			validationMessage: string;
		}
	>;
	label: string;
	required?: boolean;
};

function ExampleSelect({ label, required, name }: Field<string>) {
	const [field] = useField(name);
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

function ExampleAutocomplete({ label, name, required }: Field<string>) {
	const [field] = useField(name);
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

function ExampleRating({ label, name, required }: Field<number>) {
	const [field] = useField(name);
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

function ExampleSlider({ label, name, required }: Field<number>) {
	const [field] = useField(name);
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
