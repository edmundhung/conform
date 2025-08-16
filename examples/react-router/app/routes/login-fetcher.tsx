import { useForm, parseSubmission, report } from '@conform-to/react/future';
import { coerceFormValue, resolveZodResult } from '@conform-to/zod/v3/future';
import { redirect, useFetcher } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/login-fetcher';

const schema = coerceFormValue(
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

export default function LoginWithFetcher() {
	const fetcher = useFetcher<Route.ComponentProps['actionData']>();
	const { form, fields } = useForm({
		// Sync the result of last submission
		lastResult: fetcher.data?.result,
		shouldValidate: 'onBlur',
		// Reuse the validation logic on the client
		schema,
	});

	return (
		<fetcher.Form {...form.props} method="post">
			<div>
				<label>Email</label>
				<input
					type="email"
					className={fields.email.invalid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input
						type="checkbox"
						name={fields.remember.name}
						defaultChecked={fields.remember.defaultChecked}
					/>
				</div>
			</label>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
