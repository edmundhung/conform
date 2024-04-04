import { useForm, getFormProps, getInputProps } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { json, redirect } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import { z } from 'zod';

const schema = z.object({
	email: z.string().email(),
	password: z.string(),
	remember: z.boolean().optional(),
});

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export default function Login() {
	const fetcher = useFetcher<typeof action>();
	const [form, fields] = useForm({
		// Sync the result of last submission
		lastResult: fetcher.data,

		// Reuse the validation logic on the client
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},

		shouldRevalidate: 'onBlur',
	});

	return (
		<fetcher.Form method="post" {...getFormProps(form)}>
			<div>
				<label htmlFor={fields.email.id}>Email</label>
				<input
					{...getInputProps(fields.email, { type: 'email' })}
					className={!fields.email.valid ? 'error' : ''}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.password.id}>Password</label>
				<input
					{...getInputProps(fields.password, { type: 'password' })}
					className={!fields.password.valid ? 'error' : ''}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...getInputProps(fields.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
