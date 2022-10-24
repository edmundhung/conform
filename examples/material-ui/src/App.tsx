import { useForm, useFieldset, useControlledInput } from '@conform-to/react';
import { TextField, Button, MenuItem, Stack } from '@mui/material';

interface Article {
	title: string;
	category: string;
	content: string;
}

export default function ArticleForm() {
	const form = useForm<Article>({
		initialReport: 'onBlur',
		onSubmit: (event, { submission }) => {
			event.preventDefault();

			console.log(submission);
		},
	});
	const { title, category, content } = useFieldset(form.ref, form.config);

	/**
	 * MUI Select is a non-native input and does not dispatch any DOM events (e.g. input / focus / blur).
	 * This hooks works by dispatching DOM events manually on the shadow input and thus validated once
	 * it is hooked up with the controlled component.
	 */
	const [categoryInput, control] = useControlledInput(category.config);

	return (
		<form {...form.props}>
			<Stack spacing={3}>
				{/* TextField uses native input by default */}
				<TextField
					label="title"
					name="title"
					error={Boolean(title.error)}
					helperText={title.error}
					required
				/>
				<input {...categoryInput} required />
				<TextField
					label="Category"
					inputRef={control.ref}
					value={control.value}
					onChange={control.onChange}
					onBlur={control.onBlur}
					error={Boolean(category.error)}
					helperText={category.error}
					inputProps={{
						// To disable error bubble caused by the constraint
						// attribute set by mui input, e.g. `required`
						onInvalid: control.onInvalid,
					}}
					select
					required
				>
					<MenuItem value="">Please select</MenuItem>
					<MenuItem value="a">Option A</MenuItem>
					<MenuItem value="b">Option B</MenuItem>
					<MenuItem value="c">Option C</MenuItem>
				</TextField>
				{/* TextField uses native textarea when multiline is enabled also */}
				<TextField
					label="Content"
					name="content"
					error={Boolean(content.error)}
					helperText={content.error}
					inputProps={{
						minLength: 10,
					}}
					required
					multiline
				/>
				<Button type="submit" variant="contained">
					Submit
				</Button>
			</Stack>
		</form>
	);
}
