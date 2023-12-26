'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { login, signup, createTodos } from '@/app/actions';
import {
	useForm,
	control,
	getFormProps,
	getInputProps,
	getFieldsetProps,
} from '@conform-to/react';
import { parseWithZod } from '@conform-to/zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { pending } = useFormStatus();

	return <button {...props} disabled={pending || props.disabled} />;
}

export function TodoForm() {
	const [lastResult, action] = useFormState(createTodos, undefined);
	const { form, fieldset } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: todosSchema });
		},
		shouldValidate: 'onBlur',
	});
	const tasks = fieldset.tasks.getFieldList();

	return (
		<form action={action} {...getFormProps(form)}>
			<div>
				<label>Title</label>
				<input
					className={!fieldset.title.valid ? 'error' : ''}
					{...getInputProps(fieldset.title)}
					key={fieldset.title.key}
				/>
				<div>{fieldset.title.errors}</div>
			</div>
			<hr />
			<div className="form-error">{fieldset.tasks.errors}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key} {...getFieldsetProps(task)}>
						<div>
							<label>Task #${index + 1}</label>
							<input
								className={!taskFields.content.valid ? 'error' : ''}
								{...getInputProps(taskFields.content)}
								key={taskFields.content.key}
							/>
							<div>{taskFields.content.errors}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									className={!taskFields.completed.valid ? 'error' : ''}
									{...getInputProps(taskFields.completed, {
										type: 'checkbox',
									})}
									key={taskFields.completed.key}
								/>
							</label>
						</div>
						<Button
							{...form.getControlButtonProps(
								control.remove({ name: fieldset.tasks.name, index }),
							)}
						>
							Delete
						</Button>
						<Button
							{...form.getControlButtonProps(
								control.reorder({
									name: fieldset.tasks.name,
									from: index,
									to: 0,
								}),
							)}
						>
							Move to top
						</Button>
						<Button
							{...form.getControlButtonProps(
								control.replace({ name: task.name, value: { content: '' } }),
							)}
						>
							Clear
						</Button>
					</fieldset>
				);
			})}
			<Button
				{...form.getControlButtonProps(
					control.insert({ name: fieldset.tasks.name }),
				)}
			>
				Add task
			</Button>
			<hr />
			<Button>Save</Button>
		</form>
	);
}

export function LoginForm() {
	const [lastResult, action] = useFormState(login, undefined);
	const { form, fieldset } = useForm({
		// Sync the result of last submission
		lastResult,

		// Reuse the validation logic on the client
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: loginSchema });
		},

		// Validate the form on blur event triggered
		shouldValidate: 'onBlur',
	});

	return (
		<form action={action} {...getFormProps(form)}>
			<div>
				<label>Email</label>
				<input
					className={!fieldset.email.valid ? 'error' : ''}
					{...getInputProps(fieldset.email)}
					key={fieldset.email.key}
				/>
				<div>{fieldset.email.errors}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={!fieldset.password.valid ? 'error' : ''}
					{...getInputProps(fieldset.password, { type: 'password' })}
					key={fieldset.password.key}
				/>
				<div>{fieldset.password.errors}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input {...getInputProps(fieldset.remember, { type: 'checkbox' })} />
				</div>
			</label>
			<hr />
			<Button>Login</Button>
		</form>
	);
}

export function SignupForm() {
	const [lastResult, action] = useFormState(signup, undefined);
	const { form, fieldset } = useForm({
		lastResult,
		onValidate({ formData }) {
			return parseWithZod(formData, {
				// Create the schema without any constraint defined
				schema: (control) => createSignupSchema(control),
			});
		},
		shouldValidate: 'onBlur',
		shouldRevalidate: 'onInput',
	});

	return (
		<form action={action} {...getFormProps(form)}>
			<label>
				<div>Username</div>
				<input
					className={!fieldset.username.valid ? 'error' : ''}
					{...getInputProps(fieldset.username)}
					key={fieldset.username.key}
				/>
				<div>{fieldset.username.errors}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={!fieldset.password.valid ? 'error' : ''}
					{...getInputProps(fieldset.password, { type: 'password' })}
					key={fieldset.password.key}
				/>
				<div>{fieldset.password.errors}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={!fieldset.confirmPassword.valid ? 'error' : ''}
					{...getInputProps(fieldset.confirmPassword, { type: 'password' })}
					key={fieldset.confirmPassword.key}
				/>
				<div>{fieldset.confirmPassword.errors}</div>
			</label>
			<hr />
			<Button>Signup</Button>
		</form>
	);
}
