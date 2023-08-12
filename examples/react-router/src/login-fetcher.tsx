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

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse(formData, { schema });

	if (submission.intent !== 'submit' || !submission.value) {
		return json(submission);
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const fetcher = useFetcher();
	const [form, { email, password, remember }] = useForm({
		lastSubmission: fetcher.data,
		onValidate({ formData }) {
			return parse(formData, { schema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<fetcher.Form method="post" {...form.props}>
			<div>
				<label>Email</label>
				<input
					className={email.error ? 'error' : ''}
					{...conform.input(email)}
				/>
				<div>{email.error}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={password.error ? 'error' : ''}
					{...conform.input(password, { type: 'password' })}
				/>
				<div>{password.error}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...conform.input(remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
