import { coerceFormValue } from '@conform-to/zod/v4/future';
import { z } from 'zod';
import {
	Button,
	Stack,
	Container,
	Typography,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	Radio,
	TextField,
	Checkbox,
	RadioGroup,
	Switch,
} from '@mui/material';
import { useState } from 'react';
import { Autocomplete, NumberField, Rating, Slider } from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.strictObject({
		email: z.email({
			error: (issue) =>
				issue.input === undefined
					? 'Email is required'
					: 'Enter a valid email address',
		}),
		description: z
			.string({ error: 'Description is required' })
			.min(10, 'Description must contain at least 10 characters'),
		language: z.enum(['english', 'german', 'japanese'], {
			error: 'Choose a language',
		}),
		movie: z.enum(['The Godfather', 'Pulp Fiction'], {
			error: 'Choose a movie',
		}),
		quantity: z
			.number({ error: 'Quantity is required' })
			.min(10, 'Quantity must be at least 10')
			.max(40, 'Quantity must be at most 40'),
		subscribe: z.boolean().default(false),
		active: z.enum(['yes', 'no'], { error: 'Choose an active state' }),
		enabled: z.boolean().default(false),
		score: z
			.number({ error: 'Choose a score' })
			.int('Score must be an integer from 1 to 5')
			.min(1, 'Score must be an integer from 1 to 5')
			.max(5, 'Score must be an integer from 1 to 5'),
		progress: z
			.number({ error: 'Progress is required' })
			.min(3, 'Progress must be at least 3')
			.max(7, 'Progress must be at most 7'),
	}),
);

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const { form, fields, intent } = useForm(schema, {
		// The URL is the source of the form's defaults in this client-only example.
		defaultValue: searchParams,
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const nextSearchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip files because they cannot be represented in URL search params.
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = nextSearchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(nextSearchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<Container maxWidth="sm">
			<form {...form.props} onChange={() => setSubmittedValue(null)}>
				<Stack spacing={4} sx={{ my: 4 }}>
					<header>
						<Typography variant="h6" component="h1">
							Material UI Example
						</Typography>
						<Typography variant="subtitle1">
							This example shows you how to integrate Conform with Material UI.
							When the form is submitted, the search params will be updated with
							the form data and is set as the default value of the form.
						</Typography>
					</header>

					<TextField
						label="Email (TextField)"
						type="email"
						{...fields.email.textFieldProps}
						// Equivalent to:
						// id={fields.email.id}
						// name={fields.email.name}
						// defaultValue={fields.email.defaultValue}
						// required={fields.email.required}
						// error={!fields.email.valid}
						// helperText={fields.email.errors}
					/>

					<TextField
						label="Description (TextField - multiline)"
						slotProps={{ htmlInput: { minLength: 10 } }}
						multiline
						{...fields.description.textFieldProps}
						// Equivalent to:
						// id={fields.description.id}
						// name={fields.description.name}
						// defaultValue={fields.description.defaultValue}
						// required={fields.description.required}
						// error={!fields.description.valid}
						// helperText={fields.description.errors}
					/>

					<TextField
						label="Language (Select)"
						select
						slotProps={{ select: { native: true } }}
						{...fields.language.textFieldProps}
						// Equivalent to:
						// id={fields.language.id}
						// name={fields.language.name}
						// defaultValue={fields.language.defaultValue}
						// required={fields.language.required}
						// error={!fields.language.valid}
						// helperText={fields.language.errors}
					>
						<option value="">Please select</option>
						<option value="english">English</option>
						<option value="german">German</option>
						<option value="japanese">Japanese</option>
					</TextField>

					<Autocomplete
						label="Movie (Autocomplete)"
						options={['The Godfather', 'Pulp Fiction']}
						{...fields.movie.autocompleteProps}
						// Equivalent to:
						// id={fields.movie.id}
						// name={fields.movie.name}
						// defaultValue={fields.movie.defaultValue}
						// required={fields.movie.required}
						// error={!fields.movie.valid}
						// helperText={fields.movie.errors}
						// aria-invalid={fields.movie.ariaInvalid}
						// aria-describedby={fields.movie.ariaDescribedBy}
					/>

					<NumberField
						label="Quantity (NumberField)"
						min={10}
						max={40}
						{...fields.quantity.numberFieldProps}
						// Equivalent to:
						// id={fields.quantity.id}
						// name={fields.quantity.name}
						// defaultValue={fields.quantity.defaultValue}
						// required={fields.quantity.required}
						// error={!fields.quantity.valid}
						// helperText={fields.quantity.errors}
						// aria-invalid={fields.quantity.ariaInvalid}
						// aria-describedby={fields.quantity.ariaDescribedBy}
					/>

					<FormControl
						component="fieldset"
						variant="standard"
						error={!fields.subscribe.valid}
					>
						<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={
									<Checkbox
										{...fields.subscribe.checkboxProps}
										// Equivalent to:
										// name={fields.subscribe.name}
										// value="on"
										// defaultChecked={fields.subscribe.defaultChecked}
										// required={fields.subscribe.required}
										// slotProps={{ input: {
										//   id: fields.subscribe.id,
										//   'aria-invalid': fields.subscribe.ariaInvalid,
										//   'aria-describedby': fields.subscribe.ariaDescribedBy,
										// } }}
									/>
								}
								label="Newsletter"
							/>
						</FormGroup>
						<FormHelperText id={fields.subscribe.errorId}>
							{fields.subscribe.errors}
						</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={!fields.active.valid}>
						<FormLabel id={`${fields.active.id}-label`}>
							Active (Radio)
						</FormLabel>
						<RadioGroup
							{...fields.active.radioGroupProps}
							// Equivalent to:
							// id={fields.active.id}
							// name={fields.active.name}
							// defaultValue={fields.active.defaultValue}
							// aria-required={fields.active.required}
							// aria-invalid={fields.active.ariaInvalid}
							// aria-describedby={fields.active.ariaDescribedBy}
							// aria-labelledby={`${fields.active.id}-label`}
						>
							<FormControlLabel value="yes" control={<Radio />} label="Yes" />
							<FormControlLabel value="no" control={<Radio />} label="No" />
						</RadioGroup>
						<FormHelperText id={fields.active.errorId}>
							{fields.active.errors}
						</FormHelperText>
					</FormControl>

					<FormControl
						variant="standard"
						error={Boolean(fields.enabled.errors)}
					>
						<FormLabel>Enabled (Switch)</FormLabel>
						<FormGroup>
							<FormControlLabel
								label="Enabled"
								control={
									<Switch
										{...fields.enabled.switchProps}
										// Equivalent to:
										// name={fields.enabled.name}
										// value="on"
										// defaultChecked={fields.enabled.defaultChecked}
										// required={fields.enabled.required}
										// slotProps={{ input: {
										//   id: fields.enabled.id,
										//   'aria-invalid': fields.enabled.ariaInvalid,
										//   'aria-describedby': fields.enabled.ariaDescribedBy,
										// } }}
									/>
								}
							/>
						</FormGroup>
						<FormHelperText id={fields.enabled.errorId}>
							{fields.enabled.errors}
						</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={Boolean(fields.score.errors)}>
						<FormLabel id={`${fields.score.id}-label`}>
							Score (Rating)
						</FormLabel>
						<div>
							<Rating
								{...fields.score.ratingProps}
								// Equivalent to:
								// id={fields.score.id}
								// name={fields.score.name}
								// defaultValue={fields.score.defaultValue}
								// required={fields.score.required}
								// aria-invalid={fields.score.ariaInvalid}
								// aria-describedby={fields.score.ariaDescribedBy}
								// aria-labelledby={`${fields.score.id}-label`}
							/>
						</div>
						<FormHelperText id={fields.score.errorId}>
							{fields.score.errors}
						</FormHelperText>
					</FormControl>

					<FormControl
						variant="standard"
						error={Boolean(fields.progress.errors)}
					>
						<FormLabel id={`${fields.progress.id}-label`}>
							Progress (Slider)
						</FormLabel>
						<Slider
							{...fields.progress.sliderProps}
							// Equivalent to:
							// id={fields.progress.id}
							// name={fields.progress.name}
							// defaultValue={fields.progress.defaultValue}
							// required={fields.progress.required}
							// aria-invalid={fields.progress.ariaInvalid}
							// aria-describedby={fields.progress.ariaDescribedBy}
							// aria-labelledby={`${fields.progress.id}-label`}
						/>
						<FormHelperText id={fields.progress.errorId}>
							{fields.progress.errors}
						</FormHelperText>
					</FormControl>

					{submittedValue ? (
						<div>
							<Typography variant="body1" sx={{ mb: 2 }}>
								Value submitted
							</Typography>
							<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
						</div>
					) : null}

					<Stack
						direction="row"
						spacing={2}
						sx={{ justifyContent: 'flex-end' }}
					>
						<Button
							type="button"
							variant="outlined"
							onClick={() => intent.reset()}
						>
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
