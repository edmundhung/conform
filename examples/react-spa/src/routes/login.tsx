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
			const { email, password, remember } = payload;

			if (!email) {
				error.fieldErrors.email = ['Email is required'];
			} else if (typeof email !== 'string' || !email.includes('@')) {
				error.fieldErrors.email = ['Email is invalid'];
			}

			if (!password) {
				error.fieldErrors.password = ['Password is required'];
			}

			return { error, value: { email, password, remember } };
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
				<label htmlFor={fields.email.id}>Email</label>
				<input
					id={fields.email.id}
					type="email"
					className={!fields.email.valid ? 'error' : ''}
					name={fields.email.name}
					defaultValue={fields.email.defaultValue}
				/>
				<div>{fields.email.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.password.id}>Password</label>
				<input
					id={fields.password.id}
					type="password"
					className={!fields.password.valid ? 'error' : ''}
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.errors}</div>
			</div>
			<div>
				<label htmlFor={fields.remember.id}>Remember me</label>
				<input
					id={fields.remember.id}
					type="checkbox"
					name={fields.remember.name}
					defaultChecked={fields.remember.defaultChecked}
				/>
			</div>
			<hr />
			<button>Login</button>
		</form>
	);
}
