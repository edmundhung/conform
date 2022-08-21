import {
	type FieldsetConfig,
	type FieldsetConstraint,
	useFieldset,
	conform,
	useFieldList,
} from '@conform-to/react';
import { useRef } from 'react';
import { Field } from './playground';

export interface Student {
	name: string;
	remarks?: string;
	score?: number;
	grade: string;
}

export function StudentFieldset(config: FieldsetConfig<Student>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { name, remarks, grade, score } = useFieldset(ref, config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Name" error={name.error}>
				<input {...conform.input(name.config, { type: 'text' })} />
			</Field>
			<Field label="Remarks" error={remarks.error}>
				<input {...conform.input(remarks.config, { type: 'text' })} />
			</Field>
			<Field label="Score" error={score.error}>
				<input {...conform.input(score.config, { type: 'number' })} />
			</Field>
			<Field label="Grade" error={grade.error}>
				<input {...conform.input(grade.config, { type: 'text' })} />
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

export function MovieFieldset(config: FieldsetConfig<Movie>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { title, description, genres, rating } = useFieldset(ref, config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Title" error={title.error}>
				<input {...conform.input(title.config, { type: 'text' })} />
			</Field>
			<Field label="Description" error={description.error}>
				<textarea {...conform.textarea(description.config)} />
			</Field>
			<Field
				label="Genres"
				error={
					Array.isArray(genres.error) ? genres.error.join(', ') : genres.error
				}
			>
				<select {...conform.select(genres.config)}>
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
				<input {...conform.input(rating.config, { type: 'number' })} />
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

export function PaymentFieldset(config: FieldsetConfig<Payment>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { account, amount, timestamp, verified } = useFieldset(ref, config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Account" error={account.error}>
				<input {...conform.input(account.config, { type: 'text' })} />
			</Field>
			<Field label="Amount" error={amount.error}>
				<input {...conform.input(amount.config, { type: 'number' })} />
			</Field>
			<Field label="Timestamp" error={timestamp.error}>
				<input {...conform.input(timestamp.config, { type: 'text' })} />
			</Field>
			<Field label="Verified" error={verified.error} inline>
				<input
					{...conform.input(verified.config, {
						type: 'checkbox',
						value: 'Yes',
					})}
				/>
			</Field>
		</fieldset>
	);
}

export interface LoginForm {
	email: string;
	password: string;
}

export function LoginFieldset(config: FieldsetConfig<LoginForm>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { email, password } = useFieldset(ref, config);
	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Email" error={email.error}>
				<input {...conform.input(email.config, { type: 'email' })} />
			</Field>
			<Field label="Password" error={password.error}>
				<input {...conform.input(password.config, { type: 'password' })} />
			</Field>
		</fieldset>
	);
}

export interface Task {
	content: string;
	completed: boolean;
}

export function TaskFieldset(config: FieldsetConfig<Task>) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { content, completed } = useFieldset(ref, config);
	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Content" error={content.error}>
				<input {...conform.input(content.config, { type: 'text' })} />
			</Field>
			<Field label="Completed" error={completed.error} inline>
				<input {...conform.input(completed.config, { type: 'checkbox' })} />
			</Field>
		</fieldset>
	);
}

export interface Checklist {
	title: string;
	tasks: Task[];
}

export function ChecklistFieldset({
	taskConstraint,
	...config
}: FieldsetConfig<Checklist> & { taskConstraint: FieldsetConstraint<Task> }) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { title, tasks } = useFieldset(ref, config);
	const [taskList, control] = useFieldList(ref, tasks.config);

	return (
		<fieldset ref={ref} form={config.form}>
			<Field label="Title" error={title.error}>
				<input {...conform.input(title.config, { type: 'text' })} />
			</Field>
			<ol>
				{taskList.map((task, index) => (
					<li key={task.key} className="border rounded-md p-4 mb-4">
						<TaskFieldset constraint={taskConstraint} {...task.config} />
						<div className="flex flex-row gap-2">
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.remove({ index })}
							>
								Delete
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.reorder({ from: index, to: 0 })}
							>
								Move to top
							</button>
							<button
								className="rounded-md border p-2 hover:border-black"
								{...control.replace({ index, defaultValue: { content: '' } })}
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
