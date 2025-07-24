import { useForm } from '@conform-to/react/future';
import { coerceFormValue, resolveZodResult } from '@conform-to/zod/v3/future';
import { useNavigate } from 'react-router';
import { z } from 'zod';

const schema = coerceFormValue(
	z.object({
		email: z.string().email(),
		password: z.string(),
		remember: z.boolean().default(false),
	}),
);

async function handleLogin(value: z.infer<typeof schema>) {
	await new Promise((resolve) => {
		setTimeout(resolve, Math.random() * 1000);
	});

	if (value?.password !== 'secret') {
		return 'Login failed. The password must be "secret".';
	}

	return null;
}

export default function Login() {
	const navigate = useNavigate();
	const { form, fields } = useForm({
		shouldValidate: 'onBlur',
		onValidate(value) {
			const result = schema.safeParse(value);
			return resolveZodResult(result, { includeValue: true });
		},
		async onSubmit(event, { value, update }) {
			event.preventDefault();

			const error = await handleLogin(value);

			if (error) {
				update({
					error: {
						formErrors: [error],
					},
				});
			} else {
				navigate(
					`/?value=${encodeURIComponent(JSON.stringify(value, null, 2))}`,
				);
			}
		},
	});

	return (
		<form {...form.props} method="post">
			<div className="form-error">{form.errors}</div>
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
		</form>
	);
}
