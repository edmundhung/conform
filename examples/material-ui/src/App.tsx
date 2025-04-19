import { useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { z } from 'zod';
import {
	TextField,
	Button,
	Stack,
	Container,
	Typography,
	Checkbox,
	FormControl,
	FormControlLabel,
	FormGroup,
	FormHelperText,
	FormLabel,
	RadioGroup,
	Radio,
	Switch,
} from '@mui/material';
import {
	ExampleSelect,
	ExampleAutocomplete,
	ExampleRating,
	ExampleSlider,
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
	const [form, fields] = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		onSubmit(event, { submission }) {
			event.preventDefault();

			if (submission?.status === 'success') {
				alert(JSON.stringify(submission.value, null, 2));
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
							This example shows you how to integrate Inputs components with
							Conform.
						</Typography>
					</header>

					<TextField
						label="Email (TextField)"
						type="email"
						name="email"
						error={!fields.email.valid}
						helperText={fields.email.errors}
					/>

					<TextField
						label="Description (TextField - multline)"
						name={fields.description.name}
						error={!fields.description.valid}
						helperText={fields.description.errors}
						inputProps={{
							minLength: 10,
						}}
						multiline
					/>

					<ExampleSelect
						label="Language (Select)"
						name={fields.language.name}
						error={fields.language.errors}
						defaultValue={fields.language.defaultValue}
					/>

					<ExampleAutocomplete
						label="Movie (Autocomplete)"
						name={fields.movie.name}
						error={fields.movie.errors}
						defaultValue={fields.movie.defaultValue}
					/>

					<FormControl
						component="fieldset"
						variant="standard"
						error={!fields.subscribe.valid}
					>
						<FormLabel component="legend">Subscribe (Checkbox)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Checkbox name={fields.subscribe.name} />}
								label="Newsletter"
							/>
						</FormGroup>
						<FormHelperText>{fields.subscribe.errors}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup name={fields.active.name}>
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
								control={<Switch name={fields.enabled.name} />}
								label="Enabled"
							/>
						</FormGroup>
						<FormHelperText>{fields.enabled.errors}</FormHelperText>
					</FormControl>

					<ExampleRating
						label="Score (Rating)"
						name={fields.score.name}
						error={fields.score.errors}
						defaultValue={fields.score.defaultValue}
					/>

					<ExampleSlider
						label="Progress (Slider)"
						name={fields.progress.name}
						error={fields.progress.errors}
						defaultValue={fields.progress.defaultValue}
					/>

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
