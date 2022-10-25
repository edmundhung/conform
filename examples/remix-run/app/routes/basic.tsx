import type { Submission } from '@conform-to/react';
import { conform, parse, useFieldset, useForm } from '@conform-to/react';
import type { ActionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { Form, useActionData } from '@remix-run/react';

interface Employee {
	name: string;
	email: string;
	title: string;
}

// Handle writting validation rules...
async function validate(submission: Submission<Employee>) {
	const error = [...submission.error];

	if (!submission.value.name) {
		error.push(['name', 'Name is required']);
	}

	if (!submission.value.email) {
		error.push(['email', 'Email is required']);
	} else if (!submission.value.email.includes('@')) {
		error.push(['email', 'Email is invalid']);
	} else if (!(await isEmailUniquee(submission.value.email))) {
		error.push(['email', 'Email is  is already used']);
	}

	if (!submission.value.title) {
		error.push(['title', 'Title is required']);
	} else if (submission.value.title.length > 20) {
		error.push(['title', 'Title is too long']);
	}

	return error;
}

// Async validation. e.g. checking if an email is registered on a database
async function isEmailUniquee(email: string): Promise<boolean> {
	return new Promise((resolve) => {
		setTimeout(() => {
			resolve(email !== 'me@edmund.dev');
		}, Math.random() * 100);
	});
}

async function createEmployee(data: Employee): Promise<void> {
	throw new Error('Not implemented');
}

export async function action({ request }: ActionArgs) {
	const formData = await request.formData();
	const submission = parse<Employee>(formData);
	const error = await validate(submission);

	if (error.length === 0) {
		try {
			console.log(submission);
			// Check if it is default submission
			if (typeof submission.type === 'undefined') {
				await createEmployee(submission.value as Employee);
				return redirect('/');
			}
		} catch (e) {
			error.push(
				// Empty string key means form level error
				['', e instanceof Error ? e.message : 'Oops! Something went wrong.'],
			);
		}
	}

	return json({ ...submission, error });
}

export default function LoginForm() {
	// Last submission returned by the server
	const state = useActionData<typeof action>();
	const form = useForm<Employee>({
		// Enable server validation mode
		mode: 'server-validation',

		// Begin validating on blur
		initialReport: 'onBlur',

		// Sync the result of last submission
		state,
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
