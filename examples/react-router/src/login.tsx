import { useForm, parse } from '@conform-to/react-router';
import type { ActionFunctionArgs } from 'react-router-dom';
import { json, redirect } from 'react-router-dom';

interface Login {
	username: string;
	password: string;
	'remember-me': string;
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const submission = parse<Login>(formData);

	if (!submission.value.username) {
		submission.error.push(['username', 'Username is required']);
	}

	if (!submission.value.password) {
		submission.error.push(['password', 'Password is required']);
	}

	if (submission.type === 'submit' && submission.error.length === 0) {
		return redirect('/');
	}

	return json(submission);
}

export default function LoginForm() {
	const login = useForm<Login>();

	return (
		<login.Form method="post">
			<label>
				<div>Username</div>
				<input type="text" name="username" autoComplete="off" />
				<div>{login.error.username}</div>
			</label>
			<label>
				<div>Password</div>
				<input type="password" name="password" />
				<div>{login.error.password}</div>
			</label>
			<label>
				<div>
					<span>Remember me</span>
					<input type="checkbox" name="remember-me" value="yes" />
				</div>
			</label>
			<button type="submit">Login</button>
		</login.Form>
	);
}
