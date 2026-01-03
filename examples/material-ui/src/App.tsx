import { coerceFormValue } from '@conform-to/zod/v3/future';
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
} from '@mui/material';
import { useState } from 'react';
import {
	TextField,
	Autocomplete,
	Checkbox,
	RadioGroup,
	Switch,
	Rating,
	Slider,
} from './form';
import { useForm } from './forms';

const schema = coerceFormValue(
	z.object({
		email: z.string(),
		description: z.string(),
		language: z.string(),
		movie: z.string(),
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
		defaultValue: {
			email: searchParams.get('email'),
			description: searchParams.get('description'),
			language: searchParams.get('language'),
			movie: searchParams.get('movie'),
			subscribe: searchParams.get('subscribe'),
			active: searchParams.get('active'),
			enabled: searchParams.get('enabled'),
			score: searchParams.get('score'),
			progress: searchParams.get('progress'),
		},
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
				<Stack spacing={4} marginY={4}>
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
						// name={fields.email.name}
						// defaultValue={fields.email.defaultValue}
						// error={!fields.email.valid}
						// helperText={fields.email.errors}
					/>

					<TextField
						label="Description (TextField - multline)"
						inputProps={{
							minLength: 10,
						}}
						multiline
						{...fields.description.textFieldProps}
						// Equivalent to:
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
						// name={fields.movie.name}
						// defaultValue={fields.movie.defaultValue}
						// error={fields.movie.errors}
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
									/>
								}
								label="Newsletter"
							/>
						</FormGroup>
						<FormHelperText>{fields.subscribe.errors}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup
							{...fields.active.radioGroupProps}
							// Equivalent to:
							// name={fields.active.name}
							// defaultValue={fields.active.defaultValue}
						>
							<FormControlLabel value="yes" control={<Radio />} label="Yes" />
							<FormControlLabel value="no" control={<Radio />} label="No" />
						</RadioGroup>
						<FormHelperText>{fields.active.errors}</FormHelperText>
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
									/>
								}
							/>
						</FormGroup>
						<FormHelperText>{fields.enabled.errors}</FormHelperText>
					</FormControl>

					<FormControl
						variant="standard"
						error={Boolean(fields.progress.errors)}
					>
						<FormLabel>Progress (Slider)</FormLabel>
						<Slider
							{...fields.progress.sliderProps}
							// Equivalent to:
							// name={fields.progress.name}
							// defaultValue={fields.progress.defaultValue}
						/>
						<FormHelperText>{fields.progress.errors}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={Boolean(fields.score.errors)}>
						<FormLabel>Score (Rating)</FormLabel>
						<div>
							<Rating
								{...fields.score.ratingProps}
								// Equivalent to:
								// name={fields.score.name}
								// defaultValue={fields.score.defaultValue}
							/>
						</div>
						<FormHelperText>{fields.score.errors}</FormHelperText>
					</FormControl>

					{submittedValue ? (
						<div>
							<Typography variant="body1" marginBottom={2}>
								Value submitted
							</Typography>
							<pre>{JSON.stringify(submittedValue, null, 2)}</pre>
						</div>
					) : null}

					<Stack direction="row" justifyContent="flex-end" spacing={2}>
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
