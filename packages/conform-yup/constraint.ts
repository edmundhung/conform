import { type Constraint } from '@conform-to/dom';
import type * as yup from 'yup';
import {
	type SchemaObjectDescription,
	type SchemaDescription,
	type SchemaFieldDescription,
	type SchemaInnerTypeDescription,
} from 'yup/lib/schema';

function _parseStringFieldTests(def: SchemaDescription): Constraint {
	const constraint: Constraint = {};
	for (const test of def.tests) {
		switch (test.name) {
			case 'required': {
				constraint.required = true;
				break;
			}
			case 'min': {
				if (!constraint.minLength && test.params?.min) {
					constraint.minLength = Number(test.params?.min);
				}
				break;
			}
			case 'max': {
				if (!constraint.maxLength && test.params?.max) {
					constraint.maxLength = Number(test.params.max);
				}
				break;
			}
			case 'matches': {
				if (!constraint.pattern && test.params?.regex instanceof RegExp) {
					constraint.pattern = test.params.regex.source;
				}
				break;
			}
			default:
				break;
		}
	}
	if (!constraint.pattern && def.oneOf.length > 0) {
		constraint.pattern = def.oneOf.join('|');
	}
	return constraint;
}

function _parseDateFieldTests(def: SchemaDescription): Constraint {
	const constraint: Constraint = {};
	for (const test of def.tests) {
		switch (test.name) {
			case 'required':
				constraint.required = true;
				break;
			case 'min':
				if (!constraint.min && test.params) {
					constraint.min = test.params.min as string;
				}
				break;
			case 'max':
				if (!constraint.max && test.params) {
					constraint.max = test.params.max as string;
				}
				break;
		}
	}
	return constraint;
}

function _parseNumberFieldTests(def: SchemaDescription): Constraint {
	const constraint: Constraint = {};
	for (const test of def.tests) {
		switch (test.name) {
			case 'required':
				constraint.required = true;
				break;
			case 'min':
				if (typeof constraint.min === 'string') {
					throw new Error('min should not be a string');
				}
				if (typeof constraint.min === 'object') {
					throw new Error('min should be a number');
				}

				if (!constraint.min || constraint.min < Number(test.params?.min)) {
					constraint.min = Number(test.params?.min);
				}
				break;
			case 'max':
				if (typeof constraint.max === 'string') {
					throw new Error('max should not be a number');
				}
				if (typeof constraint.max === 'object') {
					throw new Error('min should be a number');
				}

				if (!constraint.max || constraint.max > Number(test.params?.max)) {
					constraint.max = Number(test.params?.max);
				}
				break;
			default:
				break;
		}
	}
	return constraint;
}

function _parseObjectFieldTests(def: SchemaDescription): Constraint {
	const constraint: Constraint = {};
	for (const test of def.tests) {
		switch (test.name) {
			case 'required':
				constraint.required = true;
				break;
		}
	}

	return constraint;
}

function _parseYupField([key, def]: [string, SchemaFieldDescription]): [
	string,
	Constraint,
][] {
	let constraints: [string, Constraint][] = [];
	switch (def.type) {
		case 'object': {
			const { fields } = def as SchemaObjectDescription;
			Object.entries(fields).forEach(([fieldKey, field]) => {
				constraints = [
					...constraints,
					..._parseYupField([`${key}.${fieldKey}`, field]),
				];
			});
			constraints.push([key, _parseObjectFieldTests(def)]);
			break;
		}
		case 'array': {
			const constraint: Constraint = {};
			constraint.multiple = true;
			for (const test of def.tests) {
				switch (test.name) {
					case 'required':
						constraint.required = true;
						break;
					case 'min':
						if (Number(test.params?.min) > 1) {
							constraint.multiple = true;
						}
						break;
					case 'max':
						if (Number(test.params?.max) > 1) {
							constraint.multiple = true;
						}
						break;
				}
			}

			const { innerType } = def as SchemaInnerTypeDescription;
			if (innerType) {
				switch (innerType.type) {
					case 'string': {
						constraints.push([`${key}[]`, _parseStringFieldTests(innerType)]);
						break;
					}
					case 'object': {
						constraints = constraints.concat(
							_parseYupField([`${key}[]`, innerType]),
						);
						break;
					}
				}
			}

			constraints.push([key, constraint]);
			break;
		}
		case 'date': {
			constraints.push([key, _parseDateFieldTests(def)]);
			break;
		}
		case 'string': {
			constraints = [[key, _parseStringFieldTests(def)]];
			break;
		}
		case 'number': {
			constraints = [[key, _parseNumberFieldTests(def)]];
			break;
		}
		default:
			break;
	}

	return constraints;
}

export function getYupConstraint<Source extends yup.AnyObjectSchema>(
	source: Source,
): Record<string, Constraint> {
	const description = source.describe();

	return Object.fromEntries(
		Object.entries(description.fields).reduce<[string, Constraint][]>(
			(acc, fieldEntry) => {
				return [...acc, ..._parseYupField(fieldEntry)];
			},
			[],
		),
	);
}
