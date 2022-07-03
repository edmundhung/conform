import { type FieldConfig, useFieldset, useForm } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { TextField, Button, MenuItem, Stack, Box } from '@mui/material';
import { useEffect, useRef, useState } from 'react';
import { z } from 'zod';

const muiFields = z.object({
	text: z.string(),
	select: z.enum(['a', 'b', 'c']),
	textarea: z.string().min(10),
});

export default function Integration() {
	const [query, setQuery] = useState<any>(null);
	const formProps = useForm({
		initialReport: 'onBlur',
		onSubmit(e) {
			e.preventDefault();

			const formData = new FormData(e.currentTarget);

			setQuery(Object.fromEntries(formData));
		},
	});
	const [fieldsetProps, { text, select, textarea }] = useFieldset(
		resolve(muiFields),
	);
	// Temporary solution for MUI Select (reason stated at the bottom)
	const [selectInput, selectProps] = useControlledInput(select);

	return (
		<form {...formProps}>
			{query !== null ? (
				<Box paddingY={3}>
					<pre>{JSON.stringify(query, null, 2)}</pre>
				</Box>
			) : null}
			<fieldset {...fieldsetProps}>
				{selectInput}
				<Stack spacing={3}>
					<TextField
						label="TextField"
						name={text.name}
						defaultValue={text.initialValue}
						required={text.constraint?.required}
						error={Boolean(text.error)}
						helperText={text.error}
						fullWidth
					/>
					<TextField
						label="Select"
						name={select.name}
						required={select.constraint?.required}
						value={selectProps.value ?? ''}
						onChange={(e) => selectProps.onChange(e.target.value)}
						onBlur={selectProps.onBlur}
						error={Boolean(select.error)}
						helperText={select.error}
						select
						fullWidth
					>
						<MenuItem value="">Please select</MenuItem>
						<MenuItem value="a">Option A</MenuItem>
						<MenuItem value="b">Option B</MenuItem>
						<MenuItem value="c">Option C</MenuItem>
					</TextField>
					<TextField
						label="Textarea"
						name={textarea.name}
						defaultValue={textarea.initialValue}
						required={textarea.constraint?.required}
						error={Boolean(textarea.error)}
						helperText={textarea.error}
						multiline
						fullWidth
					/>
					<Button type="submit" variant="contained" fullWidth>
						Submit
					</Button>
				</Stack>
			</fieldset>
		</form>
	);
}

/**
 * A temporay solution for handling controlled component
 *
 * MUI Select is a controlled component and behaves very different from native input/select.
 * For example, the onChange handler is called before the value is updated, result in early
 * revalidation. The event provided is also a click event from the li element instead of a
 * change event from the input element, making it less straight-forward to check the validity
 * of the field element.
 *
 * Having said that, it feels impossible to trigger the change event handler registered with
 * React manually as it does not rely on native change event. Because of this, the current
 * solution makes use of the input event instead.
 */
function useControlledInput<T extends string | number | Date | undefined>(
	field: FieldConfig<T>,
): [JSX.Element, any] {
	const [value, setValue] = useState<string>(`${field.initialValue ?? ''}`);
	const [shouldBlur, setShouldBlur] = useState(false);
	const ref = useRef<HTMLInputElement>(null);
	const input = (
		<input
			ref={ref}
			name={field.name}
			value={value}
			onChange={() => {}}
			{...field.constraint}
			style={{ display: 'none' }}
			aria-hidden={true}
		/>
	);

	useEffect(() => {
		if (!ref.current) {
			return;
		}

		ref.current.dispatchEvent(new InputEvent('input', { bubbles: true }));
	}, [value]);

	useEffect(() => {
		if (!shouldBlur) {
			return;
		}

		ref.current?.dispatchEvent(new FocusEvent('focusout', { bubbles: true }));
		setShouldBlur(false);
	}, [shouldBlur]);

	return [
		input,
		{
			value,
			onChange: (value: string) => {
				setValue(value);
			},
			onBlur: () => {
				setShouldBlur(true);
			},
		},
	];
}
