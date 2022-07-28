import { useFieldset, useControlledInput } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { TextField, Button, MenuItem, Stack } from '@mui/material';
import { useState } from 'react';
import { z } from 'zod';
import { styles } from '~/helpers';

const muiFields = z.object({
	text: z.string(),
	select: z.enum(['a', 'b', 'c']),
	textarea: z.string().min(10),
});

export default function Integration() {
	const [query, setQuery] = useState<any>(null);
	const [fieldsetProps, { text, select, textarea }] = useFieldset(
		resolve(muiFields),
		{
			initialReport: 'onBlur',
		},
	);

	/**
	 * MUI Select is a controlled component and behaves very different from native input/select.
	 * For example, the onChange handler is called before the value is updated, result in early
	 * revalidation. The event provided is also a click event from the li element instead of a
	 * change event from the input element, making it less straight-forward to check the validity
	 * of the field.
	 *
	 * This creates a shadow input that would be used to validate against the schema instead and
	 * let you hook it up with the controlled component life cycle
	 */
	const [selectInput, selectControl] = useControlledInput(select);

	return (
		<form
			onSubmit={(e) => {
				e.preventDefault();
				setQuery(Object.fromEntries(new FormData(e.currentTarget)));
			}}
		>
			<header className={styles.header}>
				<h1>Material-ui fields</h1>
				{query !== null ? (
					<pre className={styles.result}>{JSON.stringify(query, null, 2)}</pre>
				) : null}
			</header>
			<fieldset className={styles.card} {...fieldsetProps}>
				{selectInput}
				<Stack spacing={3}>
					<TextField
						label="Text"
						name={text.name}
						defaultValue={text.defaultValue}
						required={text.required}
						error={Boolean(text.error)}
						helperText={text.error}
						fullWidth
					/>
					<TextField
						label="Select"
						value={selectControl.value ?? ''}
						onChange={(e) => selectControl.onChange(e.target.value)}
						onBlur={selectControl.onBlur}
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
						defaultValue={textarea.defaultValue}
						required={textarea.required}
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
