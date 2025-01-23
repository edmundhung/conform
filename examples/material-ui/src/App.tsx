import { getFieldset, isInput, useCustomInput, useForm } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { z } from 'zod';
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
import { useRef } from 'react';

const schema = coerceZodFormData(
	z.object({
		email: z.string(),
		description: z.string(),
		language: z.string(),
		movie: z.string(),
		subscribe: z.boolean(),
		active: z.boolean(),
		enabled: z.boolean(),
		score: z.number(),
		progress: z.number().min(3).max(7),
	}),
);

export default function ExampleForm() {
	const formRef = useRef<HTMLFormElement>(null);
	const { state, handleSubmit, intent } = useForm(formRef, {
		onValidate(value) {
			const result = schema.safeParse(value);
			return resolveZodResult(result);
		},
		onSubmit(e, { value }) {
			e.preventDefault();
			alert(JSON.stringify(value, null, 2));
		},
	});
	const fields = getFieldset(state);

	return (
		<Container maxWidth="sm">
			<form
				ref={formRef}
				onSubmit={handleSubmit}
				onBlur={(event) => {
					if (
						isInput(event.target) &&
						!state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				onInput={(event) => {
					if (
						isInput(event.target) &&
						state.touchedFields.includes(event.target.name)
					) {
						intent.validate(event.target.name);
					}
				}}
				noValidate
			>
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
						helperText={fields.email.error}
					/>

					<TextField
						label="Description (TextField - multline)"
						name={fields.description.name}
						error={!fields.description.valid}
						helperText={fields.description.error}
						inputProps={{
							minLength: 10,
						}}
						multiline
					/>

					<ExampleSelect
						label="Language (Select)"
						name={fields.language.name}
						error={fields.language.error}
					/>

					<ExampleAutocomplete
						label="Movie (Autocomplete)"
						name={fields.movie.name}
						error={fields.movie.error}
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
						<FormHelperText>{fields.subscribe.error}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={!fields.active.valid}>
						<FormLabel>Active (Radio)</FormLabel>
						<RadioGroup name={fields.active.name}>
							<FormControlLabel value="yes" control={<Radio />} label="Yes" />
							<FormControlLabel value="no" control={<Radio />} label="No" />
						</RadioGroup>
						<FormHelperText>{fields.active.error}</FormHelperText>
					</FormControl>

					<FormControl variant="standard" error={Boolean(fields.enabled.error)}>
						<FormLabel>Enabled (Switch)</FormLabel>
						<FormGroup>
							<FormControlLabel
								control={<Switch name={fields.enabled.name} />}
								label="Enabled"
							/>
						</FormGroup>
						<FormHelperText>{fields.enabled.error}</FormHelperText>
					</FormControl>

					<ExampleRating
						label="Score (Rating)"
						name={fields.score.name}
						error={fields.score.error}
					/>

					<ExampleSlider
						label="Progress (Slider)"
						name={fields.progress.name}
						error={fields.progress.error}
					/>

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

type ExampleSelectProps = {
	name: string;
	label: string;
	error: string[] | undefined;
};

function ExampleSelect({ label, name, error }: ExampleSelectProps) {
	const input = useCustomInput('');

	return (
		<>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<TextField
				label={label}
				value={input.value}
				onChange={(event) => input.changed(event.target.value)}
				onBlur={() => input.blurred()}
				error={!!error}
				helperText={error}
				select
			>
				<MenuItem value="">Please select</MenuItem>
				<MenuItem value="english">English</MenuItem>
				<MenuItem value="deutsch">Deutsch</MenuItem>
				<MenuItem value="japanese">Japanese</MenuItem>
			</TextField>
		</>
	);
}

type ExampleAutocompleteProps = {
	name: string;
	label: string;
	error: string[] | undefined;
};

function ExampleAutocomplete({ label, name, error }: ExampleAutocompleteProps) {
	const input = useCustomInput('');
	const options = ['The Godfather', 'Pulp Fiction'];

	return (
		<Autocomplete
			disablePortal
			options={options}
			value={input.value}
			onChange={(_, option) => input.changed(option ?? '')}
			onBlur={() => input.blurred()}
			renderInput={(params) => (
				<TextField
					{...params}
					inputRef={input.register}
					label={label}
					name={name}
					error={!!error}
					helperText={error}
				/>
			)}
		/>
	);
}

type ExampleRatingProps = {
	label: string;
	name: string;
	error: string[] | undefined;
};

function ExampleRating({ name, label, error }: ExampleRatingProps) {
	const input = useCustomInput('');

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<Rating
				value={input.value ? Number(input.value) : null}
				onChange={(_, value) => {
					input.changed(value?.toString() ?? '');
				}}
				onBlur={() => input.blurred()}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}

type ExampleSliderProps = {
	label: string;
	name: string;
	error: string[] | undefined;
};

function ExampleSlider({ name, label, error }: ExampleSliderProps) {
	const input = useCustomInput('');

	return (
		<FormControl variant="standard" error={!!error}>
			<FormLabel>{label}</FormLabel>
			<input {...input.visuallyHiddenProps} name={name} ref={input.register} />
			<Slider
				min={0}
				max={10}
				step={1}
				value={input.value ? Number(input.value) : 0}
				onChange={(_, value) => {
					if (Array.isArray(value)) {
						return;
					}

					input.changed(value.toString());
				}}
				onBlur={() => input.blurred()}
			/>
			<FormHelperText>{error}</FormHelperText>
		</FormControl>
	);
}
