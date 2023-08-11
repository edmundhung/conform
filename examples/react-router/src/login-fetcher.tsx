import { useForm, conform } from '@conform-to/react';
import { parse } from '@conform-to/zod';
import type { ActionFunctionArgs } from 'react-router-dom';
import { useFetcher, json, redirect } from 'react-router-dom';
import { z } from 'zod';

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
	remember: z.boolean().optional(),
});

async function isAuthenticated(email: string, password: string) {
	return new Promise((resolve) => {
		resolve(email === 'conform@example.com' && password === '12345');
	});
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (
		!(await isAuthenticated(
			submission.payload.email,
			submission.payload.password,
		))
	) {
		return json({
			...submission,
			// '' denote the root which is treated as form error
			error: { '': 'Invalid credential' },
		});
	}

	throw redirect('/');
}

export function Component() {
	const fetcher = useFetcher();
	const [form, fields] = useForm({
		lastSubmission: fetcher.data,
		shouldRevalidate: 'onBlur',
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
	});

	return (
		<fetcher.Form method="post" {...form.props}>
			<div className="form-error">{form.error}</div>
			<label>
				<div>Email</div>
				<input
					className={fields.email.error ? 'error' : ''}
					{...conform.input(fields.email, { type: 'email' })}
				/>
				<div>{fields.email.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={fields.password.error ? 'error' : ''}
					{...conform.input(fields.password, { type: 'password' })}
				/>
				<div>{fields.password.error}</div>
			</label>
			<label>
				<div>
					<span>Remember me</span>
					<input {...conform.input(fields.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
