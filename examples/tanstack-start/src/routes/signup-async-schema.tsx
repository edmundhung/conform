import {
	memoize,
	parseSubmission,
	report,
	useForm,
} from '@conform-to/react/future';
import { coerceFormValue } from '@conform-to/zod/v4/future';
import { createFileRoute, redirect } from '@tanstack/react-router';
import { createServerFn, useServerFn } from '@tanstack/react-start';
import { useMemo, useState } from 'react';
import { z } from 'zod';

function createSignupSchema(checks: {
	isUsernameUnique: (username: string) => Promise<boolean>;
}) {
	const isUsernameUnique = memoize(checks.isUsernameUnique);

	return coerceFormValue(
		z
			.object({
				username: z
					.string({ error: 'Username is required' })
					.regex(
						/^[a-zA-Z0-9]+$/,
						'Invalid username: only letters or numbers are allowed',
					)
					.refine((username) => isUsernameUnique(username), {
						message: 'Username is already used. How about "example"?',
					}),
			})
			.and(
				z
					.object({
						password: z.string({ error: 'Password is required' }),
						confirmPassword: z.string({
							error: 'Confirm password is required',
						}),
					})
					.refine((data) => data.password === data.confirmPassword, {
						message: 'Password does not match',
						path: ['confirmPassword'],
					}),
			),
	);
}

const signup = createServerFn({ method: 'POST' })
	.validator((formData: FormData) => parseSubmission(formData))
	.handler(async ({ data: submission }) => {
		const schema = createSignupSchema({
			async isUsernameUnique(username) {
				await new Promise((resolve) => {
					setTimeout(resolve, Math.random() * 1000);
				});

				return username === 'example';
			},
		});
		const result = await schema.safeParseAsync(submission.payload);

		if (!result.success) {
			return report(submission, {
				error: { issues: result.error.issues },
			});
		}

		if (result.data.password !== 'secret') {
			return report(submission, {
				error: {
					formErrors: ['Server error: Please try again later'],
				},
			});
		}

		throw redirect({
			to: '/',
			search: { value: JSON.stringify(result.data) },
		});
	});

export const Route = createFileRoute('/signup-async-schema')({
	component: Signup,
});

function Signup() {
	const submit = useServerFn(signup);
	const [lastResult, setLastResult] =
		useState<Awaited<ReturnType<typeof signup>>>();
	const schema = useMemo(
		() =>
			createSignupSchema({
				async isUsernameUnique(username) {
					await new Promise((resolve) => {
						setTimeout(resolve, Math.random() * 500);
					});

					return username === 'example';
				},
			}),
		[],
	);
	const { form, fields } = useForm(schema, {
		lastResult,
		async onSubmit(event, { formData }) {
			event.preventDefault();
			const result = await submit({ data: formData });

			if (result) {
				setLastResult(result);
			}
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	});

	return (
		<form {...form.props}>
			<div className="form-error">{form.errors}</div>
			<div>
				<label htmlFor={fields.username.id}>Username</label>
				<input
					id={fields.username.id}
					className={!fields.username.valid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
					aria-invalid={!fields.username.valid || undefined}
					aria-describedby={fields.username.ariaDescribedBy}
				/>
				<div id={fields.username.errorId}>{fields.username.errors}</div>
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
				<label htmlFor={fields.confirmPassword.id}>Confirm Password</label>
				<input
					id={fields.confirmPassword.id}
					type="password"
					className={!fields.confirmPassword.valid ? 'error' : ''}
					name={fields.confirmPassword.name}
					defaultValue={fields.confirmPassword.defaultValue}
					aria-invalid={!fields.confirmPassword.valid || undefined}
					aria-describedby={fields.confirmPassword.ariaDescribedBy}
				/>
				<div id={fields.confirmPassword.errorId}>
					{fields.confirmPassword.errors}
				</div>
			</div>
			<hr />
			<button>Signup</button>
		</form>
	);
}
