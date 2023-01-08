import type { FieldsetConfig } from '@conform-to/react';
import { useForm, useFieldset, useFieldList, list } from '@conform-to/react';
import { useRef } from 'react';

interface Task {
	content: string;
	completed: boolean;
}

interface Todo {
	title: string;
	tasks: Task[];
}

export default function TodoForm() {
	const [form, { title, tasks }] = useForm<Todo>({
		initialReport: 'onBlur',
		onSubmit(event, { submission }) {
			event.preventDefault();

			console.log(submission);
		},
	});
	const taskList = useFieldList(form.ref, tasks.config);

	return (
		<form {...form.props}>
			<fieldset>
				<label>
					<div>Title</div>
					<input type="text" name="title" required />
					<div>{title.error}</div>
				</label>
				<ul>
					{taskList.map((task, index) => (
						<li key={task.key}>
							<TaskFieldset title={`Task #${index + 1}`} {...task.config} />
							<button {...list.remove(tasks.config.name, { index })}>
								Delete
							</button>
							<button
								{...list.reorder(tasks.config.name, { from: index, to: 0 })}
							>
								Move to top
							</button>
							<button
								{...list.replace(tasks.config.name, {
									index,
									defaultValue: { content: '' },
								})}
							>
								Clear
							</button>
						</li>
					))}
				</ul>
				<div>
					<button {...list.append(tasks.config.name)}>Add task</button>
				</div>
			</fieldset>
			<button type="submit">Save</button>
		</form>
	);
}

interface TaskFieldsetProps extends FieldsetConfig<Task> {
	title: string;
}

export function TaskFieldset({ title, ...config }: TaskFieldsetProps) {
	const ref = useRef<HTMLFieldSetElement>(null);
	const { content, completed } = useFieldset(ref, config);

	return (
		<fieldset ref={ref}>
			<label>
				<span>{title}</span>
				<input type="text" name={content.config.name} required />
				<div>{content.error}</div>
			</label>
			<div>
				<label>
					<span>Completed</span>
					<input type="checkbox" name={completed.config.name} value="yes" />
				</label>
			</div>
		</fieldset>
	);
}
