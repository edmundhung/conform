import {
	getMetadata,
	isInput,
	parseSubmission,
	report,
	useForm,
} from 'conform-react';
import { coerceZodFormData, resolveZodResult } from 'conform-zod';
import type { ActionFunctionArgs } from '@remix-run/node';
import { redirect } from '@remix-run/node';
import { useFetcher } from '@remix-run/react';
import { z } from 'zod';
import { useRef } from 'react';

const schema = coerceZodFormData(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().default(false),
	}),
);

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parseSubmission(formData);
	const result = schema.safeParse(submission.value);

	if (!result.success) {
		return {
			result: report(submission, resolveZodResult(result)),
		};
	}

	throw redirect(`/?value=${JSON.stringify(result.data)}`);
}

export default function Login() {
	const formRef = useRef<HTMLFormElement>(null);
	const fetcher = useFetcher<typeof action>();
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		// Sync the result of last submission
		lastResult: fetcher.data?.result,
		// Reuse the validation logic on the client
		onValidate(value) {
			return resolveZodResult(schema.safeParse(value));
		},
	});
	const [, fields] = getMetadata(initialValue, state);

	return (
		<fetcher.Form
			method="post"
			ref={formRef}
			onSubmit={handleSubmit}
			onInput={(event) => {
				if (
					isInput(event.target) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onBlur={(event) => {
				if (
					isInput(event.target) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			noValidate
		>
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
		</fetcher.Form>
	);
}
