import {
	type FormMetadata,
	type FieldMetadata,
	getFormProps,
	useForm,
} from '@conform-to/react';
import { Form } from '@remix-run/react';
import { Playground } from '~/components';

interface Task {
	content: string;
	completed: boolean;
}

interface Rule {
	type: 'rule';
	key: string;
	operator: string;
	value: string;
}

interface Group {
	type: 'group';
	conditions: Array<Group | Rule>;
}

type Schema =
	| {
			intent: 'foo';
			tasks: Array<Task>;
	  }
	| {
			intent: 'bar';
			filter: Group;
	  };

function isFormMetadataType0(meta: FormMetadata | undefined): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFormMetadataType1<Schema extends Record<string, unknown>>(
	meta: FormMetadata<Schema> | undefined,
): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFormMetadataType2<Schema extends Record<string, unknown>, FormError>(
	meta: FormMetadata<Schema, FormError> | undefined,
): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFieldMetadataType0(meta: FieldMetadata | undefined): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFieldMetadataType1<Schema>(
	meta: FieldMetadata<Schema> | undefined,
): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFieldMetadataType2<Schema, FormSchema extends Record<string, any>>(
	meta: FieldMetadata<Schema, FormSchema> | undefined,
): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

function isFieldMetadataType3<
	Schema,
	FormSchema extends Record<string, any>,
	FormError,
>(meta: FieldMetadata<Schema, FormSchema, FormError> | undefined): void {
	// eslint-disable-next-line no-console
	console.log(meta);
}

export default function Example() {
	const [form, fields] = useForm<Schema>({});

	// @ts-expect-error https://github.com/edmundhung/conform/issues/406
	isFormMetadataType0(form);
	isFormMetadataType1<Schema>(form);
	isFormMetadataType2<Schema, string[]>(form);

	const intent = fields.intent;

	isFieldMetadataType0(intent);
	isFieldMetadataType1<string>(intent);
	isFieldMetadataType1<string | undefined>(intent);
	isFieldMetadataType2<'foo' | 'bar', { intent: string | undefined }>(intent);
	isFieldMetadataType3<
		string,
		{ intent: string | undefined; tasks?: Task[]; filter?: Group },
		string[]
	>(intent);
	isFieldMetadataType2<string, Schema>(intent);

	// @ts-expect-error
	isFieldMetadataType1<number>(intent);
	// @ts-expect-error
	isFieldMetadataType2<string, { filter: Group }>(intent);
	// @ts-expect-error
	isFieldMetadataType3<string, {}, string>(intent);

	const tasks = fields.tasks;

	isFieldMetadataType0(tasks);
	isFieldMetadataType1<Task[]>(tasks);
	isFieldMetadataType1<Task[] | undefined>(tasks);
	isFieldMetadataType1<Array<Task | undefined>>(tasks);

	// @ts-expect-error
	isFieldMetadataType1<Task>(tasks);
	// @ts-expect-error
	isFieldMetadataType1<Array<string>>(tasks);

	const tasksList = tasks.getFieldList();

	isFieldMetadataType0(tasksList[0]);
	isFieldMetadataType1<Task>(tasksList[0]);
	isFieldMetadataType1<Task | undefined>(tasksList[0]);

	// @ts-expect-error
	isFieldMetadataType1<undefined>(tasksList[0]);
	// @ts-expect-error
	isFieldMetadataType1<Task[]>(tasksList[0]);

	const taskFieldset = tasksList[0]?.getFieldset();

	isFieldMetadataType0(taskFieldset?.content);
	isFieldMetadataType1<string>(taskFieldset?.content);
	isFieldMetadataType1<string | number | undefined>(taskFieldset?.content);
	isFieldMetadataType0(taskFieldset?.completed);
	isFieldMetadataType1<boolean>(taskFieldset?.completed);
	isFieldMetadataType1<boolean | '' | undefined>(taskFieldset?.completed);

	// @ts-expect-error
	isFieldMetadataType1<string>(taskFieldset?.completed);
	// @ts-expect-error
	isFieldMetadataType1<boolean>(taskFieldset?.content);

	const filter = fields.filter;

	isFieldMetadataType0(filter);
	isFieldMetadataType1<Group | undefined>(filter);
	// @ts-expect-error Would be nice to have this supported
	isFieldMetadataType1<Group>(filter);

	const filterFieldset = filter.getFieldset();

	isFieldMetadataType0(filterFieldset.type);
	isFieldMetadataType1<string>(filterFieldset.type);
	isFieldMetadataType1<string | undefined>(filterFieldset.type);
	isFieldMetadataType0(filterFieldset.conditions);
	isFieldMetadataType1<Array<Rule | Group>>(filterFieldset.conditions);
	isFieldMetadataType1<Array<Rule | Group> | undefined>(
		filterFieldset.conditions,
	);

	// @ts-expect-error
	isFieldMetadataType1<Rule | Group>(filterFieldset.conditions);
	// @ts-expect-error
	isFieldMetadataType1<Array<Rule>>(filterFieldset.conditions);
	// @ts-expect-error
	isFieldMetadataType1<Array<Group>>(filterFieldset.conditions);

	const conditionsList = filterFieldset.conditions.getFieldList();

	isFieldMetadataType0(conditionsList[0]);
	isFieldMetadataType1<Rule | Group | undefined>(conditionsList[0]);

	// @ts-expect-error
	isFieldMetadataType1<Rule>(conditionsList[0]);

	// @ts-expect-error
	isFieldMetadataType1<Group>(conditionsList[0]);

	const ruleFieldset = conditionsList[0]?.getFieldset();

	isFieldMetadataType0(ruleFieldset?.type);
	isFieldMetadataType1<string>(ruleFieldset?.type);
	isFieldMetadataType1<string | undefined>(ruleFieldset?.type);
	isFieldMetadataType0(ruleFieldset?.operator);
	isFieldMetadataType1<string>(ruleFieldset?.operator);
	isFieldMetadataType1<string | undefined>(ruleFieldset?.operator);
	isFieldMetadataType0(ruleFieldset?.conditions);
	isFieldMetadataType1<Array<Group | Rule>>(ruleFieldset?.conditions);
	isFieldMetadataType1<Array<Group | Rule | undefined>>(
		ruleFieldset?.conditions,
	);

	const innerConditionsList = ruleFieldset?.conditions.getFieldList();

	isFieldMetadataType0(innerConditionsList?.[0]);
	isFieldMetadataType1<Rule | Group | undefined>(innerConditionsList?.[0]);

	// @ts-expect-error
	isFieldMetadataType1<Rule>(innerConditionsList?.[0]);
	// @ts-expect-error
	isFieldMetadataType1<Group>(innerConditionsList?.[0]);

	return (
		<Form method="post" {...getFormProps(form)}>
			<Playground title="Typings" description="Type checking with TSC" />
		</Form>
	);
}
