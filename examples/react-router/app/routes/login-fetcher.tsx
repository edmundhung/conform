import { useForm, parseSubmission, report } from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v3/future';
import { redirect, useFetcher } from 'react-router';
import { z } from 'zod';
import type { Route } from './+types/login-fetcher';

const schema = coerceFormValue(
	z.object({
		email: z
			.string({ required_error: 'Email is required' })
			.email('Email is invalid'),
		password: z.string({ required_error: 'Password is required' }),
		remember: z.boolean().default(false),
	}),
);

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.payload);

	if (!result.success) {
		return {
			result: report(submission, {
				error: {
					issues: result.error.issues,
				},
			}),
		};
	}

	throw redirect(`/?value=${JSON.stringify(submission.payload)}`);
}

export default function LoginWithFetcher() {
	const fetcher = useFetcher<Route.ComponentProps['actionData']>();
	// Reuse the validation logic on the client
	const { form, fields } = useForm(schema, {
		// Sync the result of last submission
		lastResult: fetcher.data?.result,
		shouldValidate: 'onBlur',
	});

	return (
		<fetcher.Form {...form.props} method="post">
			<div>
				<label htmlFor={fields.email.id}>Email</label>
				<input
					id={fields.email.id}
					type="email"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
					aria-invalid={!fields.email.valid || undefined}
					aria-describedby={fields.email.ariaDescribedBy}
				/>
				<div id={fields.email.errorId}>{fields.email.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.password.id}>Password</label>
				<input
					id={fields.password.id}
					type="password"
					className={!fields.password.valid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
					aria-invalid={!fields.password.valid || undefined}
					aria-describedby={fields.password.ariaDescribedBy}
				/>
				<div id={fields.password.errorId}>{fields.password.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.remember.id}>Remember me</label>
				<input
					id={fields.remember.id}
					type="checkbox"
					name={fields.remember.name}
					defaultChecked={fields.remember.defaultChecked}
					aria-invalid={!fields.remember.valid || undefined}
					aria-describedby={fields.remember.ariaDescribedBy}
				/>
			</div>
			<hr />
			<button>Login</button>
		</fetcher.Form>
	);
}
