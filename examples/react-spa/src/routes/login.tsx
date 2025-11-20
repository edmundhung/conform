import { useForm } from '@conform-to/react/future';
import { useNavigate } from 'react-router';

async function handleLogin(value: Record<string, unknown>) {
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
		onValidate({ payload, error }) {
			if (!payload.email) {
				error.fieldErrors.email = ['Email is required'];
			} else if (
				typeof payload.email !== 'string' ||
				!payload.email.includes('@')
			) {
				error.fieldErrors.email = ['Email is invalid'];
			}

			if (!payload.password) {
				error.fieldErrors.password = ['Password is required'];
			}

			return { error, value: payload };
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
				return;
			}

			navigate(`/?value=${encodeURIComponent(JSON.stringify(value))}`);
		},
	});

	return (
		<form method="post" {...form.props}>
			<div className="form-error">{form.errors}</div>
			<div>
				<label>Email</label>
				<input
					type="email"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					type="password"
					className={!fields.password.valid ? 'error' : ''}
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
