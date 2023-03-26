import { type Schema, validate, getMessages } from '@conform-to/validitystate';
import { json, type ActionArgs } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { useEffect, useState } from 'react';
import { Playground, Field } from '~/components';

const schema: Schema<{
	/* string */
	text?: string;
	email: string;
	password: string;
	url?: string;
	tel?: string;
	search: string;

	/* string */
	// date: string;
	// month: string;
	// week: string;
	// time: string;

	/* string */
	// radio: string;
	// color: string;

	/* number */
	number: number;
	// range: number;

	/* boolean */
	checkbox: boolean;

	/* File */
	file: File;
	files?: File[];
}> = {
	text: {
		type: 'text',
		minLength: 3,
		maxLength: 10,
		pattern: '[a-z]{3}',
	},
	email: {
		type: 'email',
		required: true,
	},
	password: {
		type: 'password',
		required: true,
		minLength: 8,
	},
	url: {
		type: 'url',
	},
	tel: {
		type: 'tel',
	},
	search: {
		type: 'search',
		required: true,
	},
	number: {
		type: 'number',
		required: true,
		min: 0.5,
		max: 5,
		step: 0.5,
	},
	checkbox: {
		type: 'checkbox',
		value: 'yes',
	},
	file: {
		type: 'file',
		required: true,
	},
	files: {
		type: 'file',
		multiple: true,
	},
};

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = validate(formData, schema);

	return json(submission);
}

export default function Example() {
	const submission = useActionData<typeof action>();
	const [error, setError] = useState(submission?.error ?? {});

	useEffect(() => {
		if (submission?.error) {
			setError(submission.error);
		}
	}, [submission]);

	return (
		<Form
			method="post"
			encType="multipart/form-data"
			onSubmit={(event) => {
				// Reset all error
				setError({});

				if (!event.currentTarget.reportValidity()) {
					event.preventDefault();
				}
			}}
			onInvalidCapture={(event) => {
				const input = event.target as
					| HTMLInputElement
					| HTMLSelectElement
					| HTMLTextAreaElement;
				const messages = getMessages(input.validity);

				// Prevent default error bubble
				event.preventDefault();

				// Update the error based on the input name
				setError((error) => ({
					...error,
					[input.name]: messages,
				}));
			}}
			noValidate
		>
			<Playground
				title="Validity State"
				lastSubmission={
					submission
						? {
								payload: submission.payload,
								error: submission.error ?? {},
								intent: 'submit',
						  }
						: undefined
				}
			>
				<Field label="Text" config={{ errors: error.text }}>
					<input name="text" {...schema.text} />
				</Field>
				<Field label="Email" config={{ errors: error.email }}>
					<input name="email" {...schema.email} />
				</Field>
				<Field label="Password" config={{ errors: error.password }}>
					<input name="password" {...schema.password} />
				</Field>
				<Field label="URL" config={{ errors: error.url }}>
					<input name="url" {...schema.url} />
				</Field>
				<Field label="Tel" config={{ errors: error.tel }}>
					<input name="tel" {...schema.tel} />
				</Field>
				<Field label="Search" config={{ errors: error.search }}>
					<input name="search" {...schema.search} />
				</Field>
				<Field label="Number" config={{ errors: error.number }}>
					<input name="number" {...schema.number} />
				</Field>
				<Field label="Checkbox" config={{ errors: error.checkbox }}>
					<input name="checkbox" {...schema.checkbox} />
				</Field>
				<Field label="File" config={{ errors: error.file }}>
					<input name="file" {...schema.file} />
				</Field>
				<Field label="Files" config={{ errors: error.files }}>
					<input name="files" {...schema.files} />
				</Field>
			</Playground>
		</Form>
	);
}
