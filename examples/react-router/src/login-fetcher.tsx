import { getFormProps, getInputProps, useForm } from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
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
	const submission = parseWithZod(formData, { schema });

	if (submission.status !== 'success') {
		return json(submission.reply());
	}

	return redirect(`/?value=${JSON.stringify(submission.value)}`);
}

export function Component() {
	const fetcher = useFetcher();
	const { form, fieldset } = useForm({
		lastResult: fetcher.data,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema });
		},
		shouldRevalidate: 'onBlur',
	});

	return (
		<fetcher.Form method="post" {...getFormProps(form)}>
			<div>
				<label>Email</label>
				<input
					className={!fieldset.email.valid ? 'error' : ''}
					{...getInputProps(fieldset.email)}
				/>
				<div>{fieldset.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={!fieldset.password.valid ? 'error' : ''}
					{...getInputProps(fieldset.password, { type: 'password' })}
				/>
				<div>{fieldset.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...getInputProps(fieldset.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
