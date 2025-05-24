import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
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

const schema = z.object({
	email: z.string(),
	description: z.string(),
	language: z.string(),
	movie: z.string(),
	subscribe: z.boolean(),
	active: z.string(),
	enabled: z.boolean(),
	score: z.number(),
	progress: z.number().min(3).max(7),
});

export default function App() {
	const [submittedValue, setSubmittedValue] = useState<z.output<
		typeof schema
	> | null>(null);
	const [searchParams, setSearchParams] = useState(
		() => new URLSearchParams(window.location.search),
	);
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
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
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(event, { formData, submission }) {
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

			if (submission?.status === 'success') {
				setSubmittedValue(submission.value);
			}
		},
	});

	return (
		<Container maxWidth="sm">
			<form id={form.id} onSubmit={form.onSubmit} noValidate>
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
						name="email"
						defaultValue={fields.email.defaultValue}
						error={!fields.email.valid}
						helperText={fields.email.errors}
					/>

					<TextField
						label="Description (TextField - multline)"
						name={fields.description.name}
						defaultValue={fields.description.defaultValue}
						error={!fields.description.valid}
						helperText={fields.description.errors}
						inputProps={{
							minLength: 10,
						}}
						multiline
					/>

					<TextField
						label="Language (Select)"
						name={fields.language.name}
						defaultValue={fields.language.defaultValue}
						error={!fields.language.valid}
						helperText={fields.language.errors}
						select
					>
						<MenuItem value="">Please select</MenuItem>
						<MenuItem value="english">English</MenuItem>
						<MenuItem value="german">German</MenuItem>
						<MenuItem value="japanese">Japanese</MenuItem>
					</TextField>

					<Autocomplete
						label="Movie (Autocomplete)"
						name={fields.movie.name}
						options={['The Godfather', 'Pulp Fiction']}
						defaultValue={fields.movie.defaultValue}
						error={fields.movie.errors}
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
										name={fields.subscribe.name}
										defaultChecked={fields.subscribe.defaultChecked}
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
							name={fields.active.name}
							defaultValue={fields.active.defaultValue}
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
										name={fields.enabled.name}
										defaultChecked={fields.enabled.defaultChecked}
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
							name={fields.progress.name}
							defaultValue={fields.progress.defaultValue}
						/>
						<FormHelperText>{fields.progress.errors}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={Boolean(fields.score.errors)}>
						<FormLabel>Score (Rating)</FormLabel>
						<div>
							<Rating
								name={fields.score.name}
								defaultValue={fields.score.defaultValue}
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
							onClick={() => form.reset()}
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
