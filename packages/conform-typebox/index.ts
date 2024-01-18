import {
	type FieldConstraint,
	type FieldsetConstraint,
	type Submission,
	parse as baseParse,
} from '@conform-to/dom';
import type { StaticDecode, TObject, TSchema } from '@sinclair/typebox';
import { OptionalKind, TypeGuard } from '@sinclair/typebox';
import { Value, ValueErrorIterator } from '@sinclair/typebox/value';

function transformPath(path: string): string {
	const parts = path.split('/').filter(Boolean); // Split the string and remove empty parts
	return parts
		.map((part, index) => {
			// If the part is a number, format it as an array index, otherwise use a dot or nothing for the first part
			return isNaN(+part) ? (index === 0 ? part : `.${part}`) : `[${part}]`;
		})
		.join('');
}

export function getFieldsetConstraint<
	T extends TObject,
	R extends Record<string, any> = StaticDecode<T>,
>(schema: T): FieldsetConstraint<R> {
	function discardKey(value: Record<PropertyKey, any>, key: PropertyKey) {
		const { [key]: _, ...rest } = value;
		return rest;
	}
	function inferConstraint<T extends TSchema>(schema: T): FieldConstraint<T> {
		let constraint: FieldConstraint = {};
		if (TypeGuard.IsOptional(schema)) {
			const unwrapped = discardKey(schema, OptionalKind) as TSchema;
			constraint = {
				...inferConstraint(unwrapped),
				required: false,
			};
		} else if (TypeGuard.IsArray(schema)) {
			constraint = {
				...inferConstraint(schema.items),
				multiple: true,
			};
		} else if (TypeGuard.IsString(schema)) {
			if (schema.minLength) {
				constraint.minLength = schema.minLength;
			}
			if (schema.maxLength) {
				constraint.maxLength = schema.maxLength;
			}
			if (schema.pattern) {
				constraint.pattern = schema.pattern;
			}
		} else if (TypeGuard.IsNumber(schema) || TypeGuard.IsInteger(schema)) {
			if (schema.minimum) {
				constraint.min = schema.minimum;
			}
			if (schema.maximum) {
				constraint.max = schema.maximum;
			}
			if (schema.multipleOf) {
				constraint.step = schema.multipleOf;
			}
		} else if (TypeGuard.IsUnionLiteral(schema)) {
			constraint.pattern = schema.anyOf
				.map((literal) => {
					const option = literal.const.toString();
					// To escape unsafe characters on regex
					return option
						.replace(/[|\\{}()[\]^$+*?.]/g, '\\$&')
						.replace(/-/g, '\\x2d');
				})
				.join('|');
		}

		if (typeof constraint.required === 'undefined') {
			constraint.required = true;
		}

		return constraint;
	}
	function resolveFieldsetConstraint<
		T extends TObject,
		R extends Record<string, any> = StaticDecode<T>,
	>(schema: T): FieldsetConstraint<R> {
		return Object.getOwnPropertyNames(schema.properties).reduce((acc, key) => {
			return {
				...acc,
				[key]: inferConstraint(
					schema.properties[key as keyof FieldsetConstraint<R>],
				),
			};
		}, {} as FieldsetConstraint<R>);
	}

	return resolveFieldsetConstraint(schema);
}

export function parse<Schema extends TObject, R = StaticDecode<Schema>>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
	},
): Submission<R>;

export function parse<Schema extends TObject, R = StaticDecode<Schema>>(
	payload: FormData | URLSearchParams,
	config: {
		schema: Schema | ((intent: string) => Schema);
	},
): Submission<R> {
	return baseParse<R>(payload, {
		resolve(input, intent) {
			const schema =
				typeof config.schema === 'function'
					? config.schema(intent)
					: config.schema;
			const resolveData = (value: R) => ({ value });
			const resolveError = (error: unknown) => {
				if (error instanceof ValueErrorIterator) {
					return {
						error: Array.from(error).reduce((error, valueError) => {
							const path = transformPath(valueError.path);
							const innerError = (error[path] ??= []);
							innerError.push(valueError.message);
							return error;
						}, {} as Record<string, string[]>),
					};
				}

				throw error;
			};

			// coerce the input to the schema
			const payload = Value.Convert(schema, input);
			try {
				return resolveData(Value.Decode(schema, payload));
			} catch (error) {
				return resolveError(Value.Errors(schema, payload));
			}
		},
	});
}
