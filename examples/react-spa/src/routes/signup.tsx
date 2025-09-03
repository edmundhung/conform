import { useForm } from '@conform-to/react/future';
import { coerceFormValue, memoize } from '@conform-to/zod/v3/future';
import { useMemo } from 'react';
import { useNavigate } from 'react-router';
import { z } from 'zod';

const schema = coerceFormValue(
	z
		.object({
			username: z
				.string({ required_error: 'Username is required' })
				.regex(
					/^[a-zA-Z0-9]+$/,
					'Invalid username: only letters or numbers are allowed',
				),
		})
		.and(
			z
				.object({
					password: z.string({ required_error: 'Password is required' }),
					confirmPassword: z.string({
						required_error: 'Confirm password is required',
					}),
				})
				.refine((data) => data.password === data.confirmPassword, {
					message: 'Password does not match',
					path: ['confirmPassword'],
				}),
		),
);

async function handleSignup(value: z.infer<typeof schema>) {
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 1000);
	});

	if (value?.password !== 'secret') {
		return 'Signup failed. The password must be "secret".';
	}

	return null;
}

export default function Signup() {
	const navigate = useNavigate();
	const validateUsername = useMemo(
		() =>
			memoize(async function isUnique(username: string) {
				await new Promise((resolve) => {
					setTimeout(resolve, Math.random() * 500);
				});

				if (username !== 'example') {
					return ['Username is already used. How about "example"?'];
				}

				return null;
			}),
		[],
	);
	const { form, fields } = useForm({
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
		schema,
		async onValidate({ payload, error }) {
			if (typeof payload.username === 'string' && !error.fieldErrors.username) {
				const messages = await validateUsername(payload.username);

				if (messages) {
					error.fieldErrors.username = messages;
				}
			}

			return error;
		},
		async onSubmit(event, { value, update }) {
			event.preventDefault();

			const error = await handleSignup(value);

			if (error) {
				update({
					error: {
						formErrors: [error],
					},
				});
			} else {
				navigate(`/?value=${encodeURIComponent(JSON.stringify(value))}`);
			}
		},
	});

	return (
		<form method="post" {...form.props}>
			<div className="form-error">{form.errors}</div>
			<label>
				<div>Username</div>
				<input
					type="text"
					className={fields.username.invalid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
				/>
				<div>{fields.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					type="password"
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					type="password"
					className={fields.confirmPassword.invalid ? 'error' : ''}
					name={fields.confirmPassword.name}
					defaultValue={fields.confirmPassword.defaultValue}
				/>
				<div>{fields.confirmPassword.errors}</div>
			</label>
			<hr />
			<button>Signup</button>
		</form>
	);
}
