import {
	type FieldsetConfig,
	useForm,
	useFieldset,
	useFieldList,
	createSubmission,
} from '@conform-to/react';
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
	const formProps = useForm({
		initialReport: 'onBlur',
		onSubmit: async (event) => {
			event.preventDefault();

			const formData = new FormData(event.currentTarget);
			const submission = createSubmission(formData);

			console.log(submission);
		},
	});
	const { title, tasks } = useFieldset<Todo>(formProps.ref);
	const [taskList, control] = useFieldList(formProps.ref, tasks.config);

	return (
		<form {...formProps}>
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
							<button {...control.remove({ index })}>Delete</button>
							<button {...control.reorder({ from: index, to: 0 })}>
								Move to top
							</button>
							<button
								{...control.replace({ index, defaultValue: { content: '' } })}
							>
								Clear
							</button>
						</li>
					))}
				</ul>
				<div>
					<button {...control.append()}>Add task</button>
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
