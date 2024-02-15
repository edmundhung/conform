import { getFormProps, useForm } from '@conform-to/react';
import { Form } from '@remix-run/react';
import { Playground } from '~/components';

export default function Example() {
	const [form, fields] = useForm<
		| {
				type: 'foo';
				tasks: Array<{ content: string; completed: boolean }>;
		  }
		| {
				type: 'bar';
				rule:
					| { name: 'abc'; value: string; range: { date: Date } }
					| { name: 'def'; value: string; count: number };
		  }
	>({});

	const type = fields.type;
	const tasks = fields.tasks.getFieldList();
	const task = tasks[0]?.getFieldset();
	const content = task?.content;
	const completed = task?.completed;
	const rule = fields.rule.getFieldset();
	const ruleName = rule.name;
	const ruleValue = rule.value;
	const ruleCount = rule.count;
	const ruleRange = rule.range.getFieldset();

	// eslint-disable-next-line no-console
	console.log({
		type,
		tasks,
		task,
		content,
		completed,
		ruleName,
		ruleValue,
		ruleCount,
		ruleRange,
	});

	// @ts-expect-error
	content?.getFieldset();
	// @ts-expect-error
	ruleRange.date.getFieldset();
	// @ts-expect-error
	ruleRange.date.getFieldList();

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground
				title="Typings"
				description="TSC will warn if there is an error"
			/>
		</Form>
	);
}
