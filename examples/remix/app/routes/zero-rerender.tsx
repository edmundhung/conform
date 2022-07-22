import { useForm, useFieldset, conform } from '@conform-to/react';
import { resolve, parse } from '@conform-to/zod';
import { z } from 'zod';

const signup = z
	.object({
		email: z
			.string({ required_error: 'Email is required' })
			.email('Your email address is invalid'),
		password: z
			.string({ required_error: 'Password is required' })
			.min(8, 'The minimum password length is 8 characters'),
		confirm: z.string({ required_error: 'Confirm password is required' }),
	})
	.refine((value) => value.password === value.confirm, {
		message: 'The password do not match',
		path: ['confirm'],
	});

export default function SignupForm() {
	const formProps = useForm({
		onSubmit(event) {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = parse(formData, signup);

			console.log({ submission });
		},
	});
	const [fieldsetProps, { email, password, confirm }] = useFieldset(
		resolve(signup),
	);

	return (
		<form {...formProps}>
			<fieldset {...fieldsetProps}>
				<label className="block">
					<div>Email</div>
					<input
						className="border border-slate-300 touched:invalid:border-pink-500"
						{...conform.input(email)}
					/>
					<output className="block text-pink-500" {...conform.output(email)} />
				</label>
				<label className="block">
					<div>Password</div>
					<input
						className="border border-slate-300 touched:invalid:border-pink-500"
						{...conform.input(password, { type: 'password' })}
					/>
					<output
						className="block text-pink-500"
						{...conform.output(password)}
					/>
				</label>
				<label className="block">
					<div>Confirm Password</div>
					<input
						className="border border-slate-300 touched:invalid:border-pink-500"
						{...conform.input(confirm, { type: 'password' })}
					/>
					<output
						className="block text-pink-500"
						{...conform.output(confirm)}
					/>
				</label>
				<button
					type="submit"
					className="bg-indigo-600 hover:bg-indigo-700 p-2 mt-2 text-white"
				>
					Sign up
				</button>
			</fieldset>
		</form>
	);
}
