/// <reference types="@vitest/browser/matchers" />
import { expect, test } from 'vitest';
import { userEvent } from 'vitest/browser';
import { render } from 'vitest-browser-react';
import { useState } from 'react';
import { FormBoundary, useForm } from '../future';

function TestForm() {
	const [blurred, setBlurred] = useState(false);
	const { form, fields } = useForm<{ title: string }, string[]>({
		id: 'example',
		defaultValue: { title: 'Initial title' },
		shouldValidate: 'onInput',
		onBlur() {
			setBlurred(true);
		},
		onValidate({ payload, error }) {
			if (!payload.title) {
				error.fieldErrors.title = ['Title is required'];
			}

			return error;
		},
	});

	return (
		<>
			<form {...form.props} />
			<label>
				Title
				<input
					form={form.id}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue}
					aria-describedby={fields.title.ariaDescribedBy}
				/>
			</label>
			<div id={fields.title.errorId}>
				{fields.title.errors?.join(', ') ?? 'n/a'}
			</div>
			<output aria-label="Blur status">
				{blurred ? 'blurred' : 'pending'}
			</output>
		</>
	);
}

test('delegates events from controls outside the form element', async () => {
	const screen = render(
		<FormBoundary>
			<TestForm />
		</FormBoundary>,
	);
	const title = screen.getByLabelText('Title');

	await userEvent.clear(title);
	await expect.element(title).toHaveAccessibleDescription('Title is required');

	await userEvent.click(document.body);
	await expect
		.element(screen.getByLabelText('Blur status'))
		.toHaveTextContent('blurred');
});
