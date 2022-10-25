import {
	conform,
	parse,
	useFieldset,
	useForm,
	hasError,
	shouldValidate,
	setFormError,
} from '@conform-to/react';
import { formatError } from '@conform-to/zod';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({
	name: z.string().min(1, 'Name is required'),
	email: z.string().min(1, 'Email is required').email('Email is invalid'),
	title: z.string().min(1, 'Title is required').max(20, 'Title is too long'),
});

async function createEmployee(data: z.infer<typeof schema>): Promise<void> {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse(formData);
	const serverSchema = schema.refine(
		async (employee) => {
			if (!shouldValidate(submission, 'email')) {
				return true;
			}

			// Async validation. e.g. checking uniqueness
			return new Promise((resolve) => {
				setTimeout(() => {
					resolve(employee.email !== 'me@edmund.dev');
				}, Math.random() * 100);
			});
		},
		{
			message: 'Email is already used',
			path: ['email'],
		},
	);

	try {
		const data = await serverSchema.parseAsync(submission.value);

		if (typeof submission.type === 'undefined') {
			await createEmployee(data);

			return redirect('/');
		}
	} catch (error) {
		submission.error = submission.error.concat(formatError(error));
	}

	return json(submission);
}

export default function EmployeeForm() {
	// Last submission returned by the server
	const state = useActionData<typeof action>();
	// Setup conform
	const form = useForm<z.infer<typeof schema>>({
		// Enable server validation mode
		mode: 'server-validation',

		// Begin validating on blur
		initialReport: 'onBlur',

		// Sync the state from last submission
		state,

		/**
		 * If both `onValidate` and `onSubmit` are removed,
		 * it will be validated by the server driectly
		 */
		onValidate({ form, submission }) {
			// Similar to server validation without the extra refine()
			const result = schema.safeParse(submission.value);

			if (!result.success) {
				submission.error = submission.error.concat(formatError(result.error));
			}

			if (
				shouldValidate(submission, 'email') &&
				!hasError(submission.error, 'email')
			) {
				// Skip reporting client error
				throw form;
			}

			/**
			 * Set the submission error to the dom
			 */
			setFormError(form, submission);
		},
		onSubmit(event, { submission }) {
			if (!shouldValidate(submission, 'email')) {
				event.preventDefault();
			}
		},
	});
	const { name, email, title } = useFieldset(form.ref, form.config);

	return (
		<Form method="post" {...form.props}>
			<fieldset>
				<legend>{form.error}</legend>
				<label>
					<div>Name</div>
					<input
						className={name.error ? 'error' : ''}
						{...conform.input(name.config)}
					/>
					<div>{name.error}</div>
				</label>
				<label>
					<div>Email</div>
					<input
						className={email.error ? 'error' : ''}
						{...conform.input(email.config)}
					/>
					<div>{email.error}</div>
				</label>
				<label>
					<div>Title</div>
					<input
						className={title.error ? 'error' : ''}
						{...conform.input(title.config)}
					/>
					<div>{title.error}</div>
				</label>
			</fieldset>
			<button type="submit">Save</button>
		</Form>
	);
}
