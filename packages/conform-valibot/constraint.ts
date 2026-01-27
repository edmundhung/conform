import type { Constraint } from '@conform-to/dom';
import type { GenericSchema, GenericSchemaAsync } from 'valibot';

const keys: Array<keyof Constraint> = [
	'required',
	'minLength',
	'maxLength',
	'min',
	'max',
	'step',
	'multiple',
	'pattern',
	'accept',
];

export function getValibotConstraint<
	T extends GenericSchema | GenericSchemaAsync,
>(schema: T): Record<string, Constraint> {
	function updateConstraint(
		schema: T,

		data: Record<string, Constraint>,
		name = '',
	): void {
		if (name !== '' && !data[name]) {
			data[name] = { required: true };
		}
		const constraint = name !== '' ? (data[name] as Constraint) : {};

		if (
			schema.type === 'object' ||
			schema.type === 'object_with_rest' ||
			schema.type === 'strict_object' ||
			schema.type === 'loose_object'
		) {
			// @ts-expect-error
			for (const key in schema.entries) {
				updateConstraint(
					// @ts-expect-error
					schema.entries[key],
					data,
					name !== '' ? `${name}.${key}` : key,
				);
			}
		} else if (schema.type === 'intersect') {
			// @ts-expect-error
			for (const option of schema.options) {
				const result: Record<string, Constraint> = {};
				updateConstraint(option, result, name);

				Object.assign(data, result);
			}
		} else if (schema.type === 'union' || schema.type === 'variant') {
			Object.assign(
				data,
				// @ts-expect-error
				schema.options
					// @ts-expect-error
					.map((option) => {
						const result: Record<string, Constraint> = {};

						updateConstraint(option, result, name);

						return result;
					})
					// @ts-expect-error
					.reduce((prev, next) => {
						const list = new Set([...Object.keys(prev), ...Object.keys(next)]);
						const result: Record<string, Constraint> = {};

						for (const name of list) {
							const prevConstraint = prev[name];
							const nextConstraint = next[name];

							if (prevConstraint && nextConstraint) {
								const constraint: Constraint = {};

								result[name] = constraint;

								for (const key of keys) {
									if (
										typeof prevConstraint[key] !== 'undefined' &&
										typeof nextConstraint[key] !== 'undefined' &&
										prevConstraint[key] === nextConstraint[key]
									) {
										constraint[key] = prevConstraint[key];
									}
								}
							} else {
								result[name] = {
									...prevConstraint,
									...nextConstraint,
									required: false,
								};
							}
						}

						return result;
					}),
			);
		} else if (name === '') {
			// All the cases below are not allowed on root
			throw new Error('Unsupported schema');
		} else if (schema.type === 'array') {
			constraint.multiple = true;
			// @ts-expect-error
			updateConstraint(schema.item, data, `${name}[]`);
		} else if (schema.type === 'string') {
			// @ts-expect-error
			const minLength = schema.pipe?.find(
				// @ts-expect-error
				(v) => 'type' in v && v.type === 'min_length',
			);
			if (minLength && 'requirement' in minLength) {
				constraint.minLength = minLength.requirement as number;
			}
			// @ts-expect-error
			const maxLength = schema.pipe?.find(
				// @ts-expect-error
				(v) => 'type' in v && v.type === 'max_length',
			);
			if (maxLength && 'requirement' in maxLength) {
				constraint.maxLength = maxLength.requirement as number;
			}
		} else if (
			schema.type === 'optional' ||
			schema.type === 'nullish' ||
			schema.type === 'exact_optional'
		) {
			constraint.required = false;
			// @ts-expect-error
			updateConstraint(schema.wrapped, data, name);
		} else if (schema.type === 'number' || schema.type === 'bigint') {
			// @ts-expect-error
			const minValue = schema.pipe?.find(
				// @ts-expect-error
				(v) => 'type' in v && v.type === 'min_value',
			);
			if (minValue && 'requirement' in minValue) {
				constraint.min = minValue.requirement as number;
			}
			// @ts-expect-error
			const maxValue = schema.pipe?.find(
				// @ts-expect-error
				(v) => 'type' in v && v.type === 'max_value',
			);
			if (maxValue && 'requirement' in maxValue) {
				constraint.max = maxValue.requirement as number;
			}
		} else if (schema.type === 'enum') {
			// @ts-expect-error
			constraint.pattern = Object.entries(schema.enum)
				.map(([, option]) =>
					// To escape unsafe characters on regex
					typeof option === 'string'
						? option
								.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
								.replace(/-/g, '\\x2d')
						: option,
				)
				.join('|');
		} else if (schema.type === 'tuple' || schema.type === 'tuple_with_rest') {
			// @ts-expect-error
			for (let i = 0; i < schema.items.length; i++) {
				// @ts-expect-error
				updateConstraint(schema.items[i], data, `${name}[${i}]`);
			}
		} else if (schema.type === 'file' || schema.type === 'blob') {
			// @ts-expect-error
			const mimeTypeValidation = schema.pipe?.find(
				// @ts-expect-error
				(v) => 'type' in v && v.type === 'mime_type',
			);
			if (mimeTypeValidation && 'requirement' in mimeTypeValidation) {
				const requirement = mimeTypeValidation.requirement as string[];
				constraint.accept = requirement.join();
			}
		} else {
			// FIXME: If you are interested in this, feel free to create a PR
		}
	}

	const result: Record<string, Constraint> = {};

	updateConstraint(schema, result);

	return result;
}
