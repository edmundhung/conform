export type Pretty<T> = { [K in keyof T]: T[K] } & {};

export type FieldConstraint<Schema = any> = {
	required?: boolean;
	minLength?: number;
	maxLength?: number;
	min?: Schema extends number ? number : string | number;
	max?: Schema extends number ? number : string | number;
	step?: Schema extends number ? number : string | number;
	multiple?: boolean;
	pattern?: string;
};

export type KeysOf<T> = T extends any ? keyof T : never;

export type ResolveType<T, K extends KeysOf<T>> = T extends { [k in K]?: any }
	? T[K]
	: undefined;

export type FieldsetConstraint<Schema extends Record<string, any> | undefined> =
	{
		[Key in KeysOf<Schema>]?: FieldConstraint<ResolveType<Schema, Key>>;
	};
