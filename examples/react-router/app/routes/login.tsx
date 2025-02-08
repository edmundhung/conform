import { parseSubmission, report } from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import { Form, redirect } from 'react-router';
import { z } from 'zod';
import { useForm } from '~/template';
import type { Route } from './+types/login';

const schema = coerceZodFormData(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().default(false),
	}),
);

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
		return {
			result: report(submission, {
				error: resolveZodResult(result),
			}),
		};
	}

	throw redirect(`/?value=${JSON.stringify(result.data)}`);
}

export default function Login({ actionData }: Route.ComponentProps) {
	const { form, fields } = useForm({
		// Sync the result of last submission
		lastResult: actionData?.result,
		// Reuse the validation logic on the client
		onValidate(value) {
			return resolveZodResult(schema.safeParse(value));
		},
	});

	return (
		<Form {...form.props} method="post">
			<div>
				<label>Email</label>
				<input
					type="email"
					className={fields.email.invalid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.error}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.error}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input
						type="checkbox"
						name={fields.remember.name}
						defaultChecked={fields.remember.defaultValue === 'on'}
					/>
				</div>
			</label>
			<hr />
			<button>Login</button>
		</Form>
	);
}
