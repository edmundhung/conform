import { type Schema } from '@conform-to/dom';
import {
	type FieldsetConfig,
	useFieldset,
	conform,
	useFieldList,
} from '@conform-to/react';
import { Field } from './playground';

interface FieldsetProps<T> extends FieldsetConfig<T> {
	schema: Schema<T>;
}

export interface Student {
	name: string;
	remarks?: string;
	score?: number;
	grade: string;
}

export function StudentFieldset({ schema, ...config }: FieldsetProps<Student>) {
	const [fieldsetProps, { name, remarks, grade, score }] = useFieldset(
		schema,
		config,
	);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Name" error={name.error}>
				<input {...conform.input(name, { type: 'text' })} />
			</Field>
			<Field label="Remarks" error={remarks.error}>
				<input {...conform.input(remarks, { type: 'text' })} />
			</Field>
			<Field label="Score" error={score.error}>
				<input {...conform.input(score, { type: 'number' })} />
			</Field>
			<Field label="Grade" error={grade.error}>
				<input {...conform.input(grade, { type: 'text' })} />
			</Field>
		</fieldset>
	);
}

export interface Movie {
	title: string;
	description?: string;
	genres: string[];
	rating?: number;
}

export function MovieFieldset({ schema, ...config }: FieldsetProps<Movie>) {
	const [fieldsetProps, { title, description, genres, rating }] = useFieldset(
		schema,
		config,
	);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Title" error={title.error}>
				<input {...conform.input(title, { type: 'text' })} />
			</Field>
			<Field label="Description" error={description.error}>
				<textarea {...conform.textarea(description)} />
			</Field>
			<Field
				label="Genres"
				error={
					Array.isArray(genres.error) ? genres.error.join(', ') : genres.error
				}
			>
				<select {...conform.select(genres)}>
					<option value="action">Action</option>
					<option value="adventure">Adventure</option>
					<option value="comedy">Comedy</option>
					<option value="fantasy">Fantasy</option>
					<option value="sci-fi">Science Fiction</option>
					<option value="horror">Horror</option>
					<option value="romance">Romance</option>
				</select>
			</Field>
			<Field label="Rating" error={rating.error}>
				<input {...conform.input(rating, { type: 'number' })} />
			</Field>
		</fieldset>
	);
}

export interface Payment {
	account: string;
	amount: number;
	timestamp: Date;
	verified: boolean;
}

export function PaymentFieldset({ schema, ...config }: FieldsetProps<Payment>) {
	const [fieldsetProps, { account, amount, timestamp, verified }] = useFieldset(
		schema,
		config,
	);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Account" error={account.error}>
				<input {...conform.input(account, { type: 'text' })} />
			</Field>
			<Field label="Amount" error={amount.error}>
				<input {...conform.input(amount, { type: 'number' })} />
			</Field>
			<Field label="Timestamp" error={timestamp.error}>
				<input {...conform.input(timestamp, { type: 'text' })} />
			</Field>
			<Field label="Verified" error={verified.error} inline>
				<input
					{...conform.input(verified, { type: 'checkbox', value: 'Yes' })}
				/>
			</Field>
		</fieldset>
	);
}

export interface LoginForm {
	email: string;
	password: string;
}

export function LoginFieldset({ schema, ...config }: FieldsetProps<LoginForm>) {
	const [fieldsetProps, { email, password }] = useFieldset(schema, config);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Email" error={email.error}>
				<input {...conform.input(email, { type: 'email' })} />
			</Field>
			<Field label="Password" error={password.error}>
				<input {...conform.input(password, { type: 'password' })} />
			</Field>
		</fieldset>
	);
}

export interface Task {
	content: string;
	completed: boolean;
}

export function TaskFieldset({ schema, ...config }: FieldsetProps<Task>) {
	const [fieldsetProps, { content, completed }] = useFieldset(schema, config);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Content" error={content.error}>
				<input {...conform.input(content, { type: 'text' })} />
			</Field>
			<Field label="Completed" error={completed.error} inline>
				<input {...conform.input(completed, { type: 'checkbox' })} />
			</Field>
		</fieldset>
	);
}

export interface Checklist {
	title: string;
	tasks: Task[];
}

export function ChecklistFieldset({
	schema,
	taskSchema,
	...config
}: FieldsetProps<Checklist> & { taskSchema: Schema<Task> }) {
	const [fieldsetProps, { title, tasks }] = useFieldset(schema, config);
	const [taskList, control] = useFieldList(tasks);

	return (
		<fieldset {...fieldsetProps}>
			<Field label="Title" error={title.error}>
				<input {...conform.input(title, { type: 'text' })} />
			</Field>
			<ol>
				{taskList.map((task, index) => (
					<li key={task.key} className="border rounded-md p-4 mb-4">
						<TaskFieldset schema={taskSchema} {...task.props} />
						<div className="flex flex-row gap-2">
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.remove(index)}
							>
								Delete
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.reorder(index, 0)}
							>
								Move to top
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.replace(index, { content: '' })}
							>
								Clear
							</button>
						</div>
					</li>
				))}
			</ol>
			<div className="flex flex-row gap-2">
				<button
					className="rounded-md border p-2 hover:border-black"
					{...control.prepend()}
				>
					Insert top
				</button>
				<button
					className="rounded-md border p-2 hover:border-black"
					{...control.append()}
				>
					Insert bottom
				</button>
			</div>
		</fieldset>
	);
}
