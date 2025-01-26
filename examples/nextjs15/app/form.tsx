'use client';

import { useFormStatus } from 'react-dom';
import { login, signup, createTodos } from '@/app/actions';
import { getMetadata, isInput, isTouched, useForm } from 'conform-react';
import { resolveZodResult } from 'conform-zod';
import { todosSchema, loginSchema, createSignupSchema } from '@/app/schema';
import { useMemo, useRef, useActionState } from 'react';
import type { z } from 'zod';

function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement>) {
	const { pending } = useFormStatus();

	return <button {...props} disabled={pending || props.disabled} />;
}

export function TodoForm({
	defaultValue,
}: {
	defaultValue?: z.infer<typeof todosSchema> | null;
}) {
	const [lastResult, action] = useActionState(createTodos, null);
	const formRef = useRef<HTMLFormElement>(null);
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		lastResult,
		defaultValue,
		onValidate(value) {
			return resolveZodResult(todosSchema.safeParse(value));
		},
	});
	const [, fields] = getMetadata(initialValue, state);
	const tasks = fields.tasks.getFieldList();

	return (
		<form
			ref={formRef}
			action={action}
			onSubmit={handleSubmit}
			onBlur={(event) => {
				if (
					isInput(event.target) &&
					!state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onInput={(event) => {
				if (
					isInput(event.target) &&
					state.touchedFields.includes(event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
		>
			<div>
				<label>Title</label>
				<input
					className={fields.title.invalid ? 'error' : ''}
					name={fields.title.name}
					defaultValue={fields.title.defaultValue ?? ''}
				/>
				<div>{fields.title.error}</div>
			</div>
			<hr />
			<div className="form-error">{fields.tasks.error}</div>
			{tasks.map((task, index) => {
				const taskFields = task.getFieldset();

				return (
					<fieldset key={task.key}>
						<div>
							<label>Task #{index + 1}</label>
							<input
								className={taskFields.content.invalid ? 'error' : ''}
								name={taskFields.content.name}
								defaultValue={taskFields.content.defaultValue}
							/>
							<div>{taskFields.content.error}</div>
						</div>
						<div>
							<label>
								<span>Completed</span>
								<input
									type="checkbox"
									className={taskFields.completed.invalid ? 'error' : ''}
									name={taskFields.completed.name}
									defaultChecked={taskFields.completed.defaultValue === 'on'}
								/>
							</label>
						</div>
						<Button
							type="button"
							onClick={() => {
								intent.remove({ name: fields.tasks.name, index });
							}}
						>
							Delete
						</Button>
						<Button
							type="button"
							onClick={() => {
								intent.reorder({
									name: fields.tasks.name,
									from: index,
									to: 0,
								});
							}}
						>
							Move to top
						</Button>
						<Button
							type="button"
							onClick={() => {
								intent.update({
									name: task.name,
									value: { content: '' },
								});
							}}
						>
							Clear
						</Button>
					</fieldset>
				);
			})}
			<Button
				type="button"
				onClick={() =>
					intent.insert({
						name: fields.tasks.name,
					})
				}
			>
				Add task
			</Button>
			<hr />
			<Button>Save</Button>
		</form>
	);
}

export function LoginForm() {
	const [lastResult, action] = useActionState(login, null);
	const formRef = useRef<HTMLFormElement>(null);
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		// Sync the result of last submission
		lastResult,
		// Reuse the validation logic on the client
		onValidate(value) {
			return resolveZodResult(loginSchema.safeParse(value));
		},
	});
	const [, fields] = getMetadata(initialValue, state);

	return (
		<form
			ref={formRef}
			action={action}
			onSubmit={handleSubmit}
			onInput={(event) => {
				if (
					isInput(event.target) &&
					isTouched(state.touchedFields, event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onBlur={(event) => {
				if (
					isInput(event.target) &&
					!isTouched(state.touchedFields, event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
		>
			<div>
				<label>Email</label>
				<input
					className={fields.email.invalid ? 'error' : ''}
					name={fields.email.name}
					type="text"
				/>
				<div>{fields.email.error}</div>
			</div>
			<div>
				<label>Password</label>
				<input
					className={fields.password.invalid ? 'error' : ''}
					name={fields.password.name}
				/>
				<div>{fields.password.error}</div>
			</div>
			<label>
				<div>
					<span>Remember me</span>
					<input type="checkbox" name={fields.remember.name} />
				</div>
			</label>
			<hr />
			<Button>Login</Button>
		</form>
	);
}

export function SignupForm() {
	const [lastResult, action] = useActionState(signup, null);
	const formRef = useRef<HTMLFormElement>(null);
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
	const { state, initialValue, handleSubmit, intent } = useForm(formRef, {
		lastResult,
		async onValidate(value) {
			return resolveZodResult(await schema.safeParseAsync(value));
		},
	});
	const [form, fields] = getMetadata(initialValue, state);

	return (
		<form
			ref={formRef}
			action={action}
			onSubmit={handleSubmit}
			onInput={(event) => {
				if (
					isInput(event.target) &&
					isTouched(state.touchedFields, event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
			onBlur={(event) => {
				if (
					isInput(event.target) &&
					!isTouched(state.touchedFields, event.target.name)
				) {
					intent.validate(event.target.name);
				}
			}}
		>
			<div className="form-error">{form.error}</div>
			<label>
				<div>Username</div>
				<input
					className={fields.username.invalid ? 'error' : ''}
					name={fields.username.name}
					defaultValue={fields.username.defaultValue}
					type="text"
				/>
				<div>{fields.username.error}</div>
			</label>
			<label>
				<div>Password</div>
				<input
					className={fields.password.invalid ? 'error' : ''}
					type="password"
					name={fields.password.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.password.error}</div>
			</label>
			<label>
				<div>Confirm Password</div>
				<input
					className={fields.confirmPassword.invalid ? 'error' : ''}
					type="password"
					name={fields.confirmPassword.name}
					defaultValue={fields.password.defaultValue}
				/>
				<div>{fields.confirmPassword.error}</div>
			</label>
			<hr />
			<Button>Signup</Button>
		</form>
	);
}
