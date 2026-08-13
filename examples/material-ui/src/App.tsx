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
	MenuItem,
	TextField,
	Checkbox,
	RadioGroup,
	Switch,
} from '@mui/material';
import { useState } from 'react';
import { Autocomplete, NumberField, Rating, Slider } from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		email: z.string(),
		description: z.string(),
		language: z.string(),
		movie: z.string(),
		quantity: z.number().min(10).max(40),
		subscribe: z.boolean(),
		active: z.string(),
		enabled: z.boolean(),
		score: z.number(),
		progress: z.number().min(3).max(7),
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
		defaultValue: searchParams,
		onSubmit(event, { formData, value }) {
			event.preventDefault();

			// Demo only - This emulates a GET request with the form data populated in the URL.
			const url = new URL(document.URL);
			const searchParams = new URLSearchParams(
				Array.from(formData).filter(
					// Skip the file as it is not serializable
					(entry): entry is [string, string] => typeof entry[1] === 'string',
				),
			);
			url.search = searchParams.toString();
			window.history.pushState(null, '', url);

			setSearchParams(searchParams);
			setSubmittedValue(value);
		},
	});

	return (
		<Container maxWidth="sm">
			<form {...form.props}>
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
						// error={!fields.description.valid}
						// helperText={fields.description.errors}
					/>

					<TextField
						label="Language (Select)"
						select
						{...fields.language.textFieldProps}
						// Equivalent to:
						// id={fields.language.id}
						// name={fields.language.name}
						// defaultValue={fields.language.defaultValue}
						// error={!fields.language.valid}
						// helperText={fields.language.errors}
					>
						<MenuItem value="">Please select</MenuItem>
						<MenuItem value="english">English</MenuItem>
						<MenuItem value="german">German</MenuItem>
						<MenuItem value="japanese">Japanese</MenuItem>
					</TextField>

					<Autocomplete
						label="Movie (Autocomplete)"
						options={['The Godfather', 'Pulp Fiction']}
						{...fields.movie.autocompleteProps}
						// Equivalent to:
						// id={fields.movie.id}
						// name={fields.movie.name}
						// defaultValue={fields.movie.defaultValue}
						// error={fields.movie.errors}
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
