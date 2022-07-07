import { type Schema, useForm, useFieldset, conform } from '@conform-to/react';
import { resolve } from '@conform-to/zod';
import { Form } from '@remix-run/react';
import React, { type ReactElement, type InputHTMLAttributes } from 'react';
import { z } from 'zod';
import { styles } from '~/helpers';

export default function Playground() {
	const formProps = useForm();
	const schema = createBasicSchema(z.string());

	return (
		<>
			<Form id="playground" {...formProps} />
			<BasicFieldset legend="string" schema={schema} form="playground" />
			<button type="submit" form="playground">
				Submit
			</button>
			<button type="reset" form="playground">
				Reset
			</button>
		</>
	);
}

function createBasicSchema<T>(baseType: z.ZodType<T>): BasicSchema<T> {
	const schema = z.object({
		checkbox: baseType,
		color: baseType,
		date: baseType,
		datetime: baseType,
		email: baseType,
		file: baseType,
		hidden: baseType,
		month: baseType,
		number: baseType,
		password: baseType,
		radio: baseType,
		range: baseType,
		search: baseType,
		tel: baseType,
		text: baseType,
		time: baseType,
		url: baseType,
		week: baseType,
	});

	return resolve(schema) as any;
}

type BasicSchema<T> = Schema<{
	checkbox: T;
	color: T;
	date: T;
	datetime: T;
	email: T;
	file: T;
	hidden: T;
	month: T;
	number: T;
	password: T;
	radio: T;
	range: T;
	search: T;
	tel: T;
	text: T;
	time: T;
	url: T;
	week: T;
}>;

interface FieldsetProps<T> {
	legend: string;
	schema: BasicSchema<T>;
	form: string;
}

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
	label: string;
	error?: string;
	children: ReactElement;
}

function Field({ label, error, children }: FieldProps) {
	return (
		<label className="block">
			<div className={styles.label}>{label}</div>
			{React.cloneElement(children, {
				className: error ? styles.invalidInput : styles.input,
			})}
			<p className={styles.errorMessage}>{error}</p>
		</label>
	);
}

function BasicFieldset<T extends string | number | Date | undefined>({
	legend,
	schema,
	form,
}: FieldsetProps<T>) {
	const [
		fieldsetProps,
		{
			checkbox,
			color,
			date,
			datetime,
			email,
			file,
			hidden,
			month,
			number,
			password,
			radio,
			range,
			search,
			tel,
			text,
			time,
			url,
			week,
		},
	] = useFieldset(schema, {
		form,
	});

	return (
		<fieldset className={styles.fieldset} {...fieldsetProps}>
			<legend>{legend}</legend>
			<Field label="checkbox" error={checkbox.error}>
				<input
					{...conform.input(checkbox, { type: 'checkbox', value: 'checkbox' })}
				/>
			</Field>
			<Field label="color" error={color.error}>
				<input {...conform.input(color, { type: 'color' })} />
			</Field>
			<Field label="date" error={date.error}>
				<input {...conform.input(date, { type: 'date' })} />
			</Field>
			<Field label="datetime" error={datetime.error}>
				<input {...conform.input(datetime, { type: 'datetime-local' })} />
			</Field>
			<Field label="email" error={email.error}>
				<input {...conform.input(email, { type: 'email' })} />
			</Field>
			<Field label="file" error={file.error}>
				<input {...conform.input(file, { type: 'file' })} />
			</Field>
			<Field label="hidden" error={hidden.error}>
				<input {...conform.input(hidden, { type: 'hidden' })} />
			</Field>
			<Field label="month" error={month.error}>
				<input {...conform.input(month, { type: 'month' })} />
			</Field>
			<Field label="number" error={number.error}>
				<input {...conform.input(number, { type: 'number' })} />
			</Field>
			<Field
				label="password"
				error={password.error}
				{...conform.input(password, { type: 'password' })}
			>
				<input {...conform.input(password, { type: 'password' })} />
			</Field>
			<Field label="radio" error={radio.error}>
				<input {...conform.input(radio, { type: 'radio', value: 'radio' })} />
			</Field>
			<Field label="range" error={range.error}>
				<input {...conform.input(range, { type: 'range' })} />
			</Field>
			<Field label="search" error={search.error}>
				<input {...conform.input(search, { type: 'search' })} />
			</Field>
			<Field label="tel" error={tel.error}>
				<input {...conform.input(tel, { type: 'tel' })} />
			</Field>
			<Field label="text" error={text.error}>
				<input {...conform.input(text, { type: 'text' })} />
			</Field>
			<Field label="time" error={time.error}>
				<input {...conform.input(time, { type: 'time' })} />
			</Field>
			<Field label="url" error={url.error}>
				<input {...conform.input(url, { type: 'url' })} />
			</Field>
			<Field label="week" error={week.error}>
				<input {...conform.input(week, { type: 'week' })} />
			</Field>
		</fieldset>
	);
}
