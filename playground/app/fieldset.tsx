import { type Schema } from '@conform-to/dom';
import { type FieldsetConfig, useFieldset, conform } from '@conform-to/react';
import { Field } from './playground';

interface FieldsetProps<T> extends FieldsetConfig<T> {
	schema: Schema<T>;
}

export interface StudentSchema {
	name: string;
	remarks?: string;
	score?: number;
	grade: string;
}

export function StudentFieldset({
	schema,
	...config
}: FieldsetProps<StudentSchema>) {
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

export interface MovieSchema {
	title: string;
	description?: string;
	genres: string[];
	rating?: number;
}

export function MovieFieldset({
	schema,
	...config
}: FieldsetProps<MovieSchema>) {
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

export interface PaymentSchema {
	account: string;
	amount: number;
	timestamp: Date;
	verified: boolean;
}

export function PaymentFieldset({
	schema,
	...config
}: FieldsetProps<PaymentSchema>) {
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

export interface LoginSchema {
	email: string;
	password: string;
}

export function LoginFieldset({
	schema,
	...config
}: FieldsetProps<LoginSchema>) {
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
