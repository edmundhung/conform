import { type Submission, parse } from '@conform-to/dom';
import { type ValidationError, validate, validateSync } from 'class-validator';

class ConformClassValidatorModel<T extends Record<string, any>> {
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	constructor(data: T) {
		// dummy class just for typing purposes
	}
}

type TConformClassValidatorModelConstructor<T extends Record<string, any>> =
	new (data: T, ...args: any[]) => ConformClassValidatorModel<T>;

export function parseWithClassValidator<T extends Record<string, any>>(
	payload: FormData,
	config: {
		schema: TConformClassValidatorModelConstructor<T>;
		async?: false;
	},
): Submission<ConformClassValidatorModel<T>, string[]>;

export function parseWithClassValidator<T extends Record<string, any>>(
	payload: FormData,
	config: {
		schema: TConformClassValidatorModelConstructor<T>;
		async: true;
	},
): Promise<Submission<ConformClassValidatorModel<T>, string[]>>;

export function parseWithClassValidator<T extends Record<string, any>>(
	payload: FormData,
	config: {
		schema: TConformClassValidatorModelConstructor<T>;
		async?: boolean;
	},
):
	| Submission<ConformClassValidatorModel<T>, string[]>
	| Promise<Submission<ConformClassValidatorModel<T>, string[]>> {
	return parse<ConformClassValidatorModel<T>, string[]>(payload, {
		resolve(payload) {
			const { schema: Model } = config;

			const resolveError = (errors: ValidationError[]) =>
				errors.reduce(
					(acc: Record<string, string[]>, current: ValidationError) => {
						acc[current.property] = current.constraints
							? Object.values(current.constraints)
							: [];

						return acc;
					},
					{},
				);

			try {
				const model = new Model(payload as T);

				const resolveSubmission = (errors: ValidationError[]) => {
					if (errors.length > 0) {
						return { value: undefined, error: resolveError(errors) };
					}

					return {
						value: Object.getOwnPropertyNames(model).reduce(
							(acc: Record<string, any>, modelPublicKey: string) => {
								// @ts-ignore
								acc[modelPublicKey] = model[modelPublicKey];

								return acc;
							},
							{},
						),
						error: undefined,
					};
				};

				if (!config.async) {
					return resolveSubmission(validateSync(model));
				}

				return validate(model).then(resolveSubmission);
			} catch {
				throw new Error('Bad validation model passed!');
			}
		},
	});
}
