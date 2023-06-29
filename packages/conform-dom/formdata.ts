/**
 * A ponyfill-like helper to get the form data with the submitter value.
 * It does not respect the tree order nor handles the image input.
 *
 * @see https://developer.mozilla.org/en-US/docs/Web/API/FormData/FormData#parameters
 */

export function getFormData(
	form: HTMLFormElement,
	submitter?: HTMLInputElement | HTMLButtonElement | null,
): FormData {
	const payload = new FormData(form);

	if (submitter && submitter.type === 'submit' && submitter.name !== '') {
		payload.append(submitter.name, submitter.value);
	}

	return payload;
}

/**
 * Returns the paths from a name based on the JS syntax convention
 * @example
 * ```js
 * const paths = getPaths('todos[0].content'); // ['todos', 0, 'content']
 * ```
 */
export function getPaths(input: string): (string | number)[] {
	const regex = /(\w+|\[\d+\]|\[\])/g;
	let matches = input.match(regex);

	if (matches) {
		return matches.map((el) => {
			if (el.includes('[')) {
				let replaced = el.replace(/[[\]]/g, '');
				return replaced === ''
					? Infinity
					: isNaN(Number(replaced))
					? el
					: Number(replaced);
			}
			return el;
		});
	}

	return [];
}

/**
 * Returns a formatted name from the paths based on the JS syntax convention
 * @example
 * ```js
 * const name = formatPaths(['todos', 0, 'content']); // "todos[0].content"
 * ```
 */
export function formatPaths(paths: Array<string | number>): string {
	return paths.reduce<string>((name, path) => {
		if (typeof path === 'number') {
			return `${name}[${path}]`;
		}

		if (name === '' || path === '') {
			return [name, path].join('');
		}

		return [name, path].join('.');
	}, '');
}

/**
 * Assign a value to a target object by following the paths on the name
 */
export function setValue(
	target: any,
	name: string,
	valueFn: (prev?: unknown) => any,
): void {
	let paths = getPaths(name);
	let length = paths.length;
	let lastIndex = length - 1;
	let index = -1;
	let pointer = target;

	while (pointer != null && ++index < length) {
		let key = paths[index];
		const isDynamic = key === Infinity;
		let prev = paths[index - 1];
		let next = paths[index + 1];
		let newValue =
			index != lastIndex
				? pointer[key] ?? (typeof next === 'number' ? [] : {})
				: valueFn(pointer[key]);

		if (isDynamic) {
			if (Array.isArray(pointer)) {
				pointer.push(newValue);
				pointer = pointer[pointer.length - 1];
			} else {
				pointer[prev] = newValue;
				pointer = pointer[prev];
			}
		} else {
			pointer[key] = newValue;
			pointer = pointer[key];
		}
	}
}

/**
 * Resolves the payload into a plain object based on the JS syntax convention
 */
export function resolve(
	payload: FormData | URLSearchParams,
	ignoreKeys?: string[],
) {
	const data = {};

	for (let [key, value] of payload.entries()) {
		if (ignoreKeys?.includes(key)) {
			continue;
		}

		setValue(data, key, (prev) => {
			if (!prev) {
				return value;
			} else if (Array.isArray(prev)) {
				return prev.concat(value);
			} else {
				return [prev, value];
			}
		});
	}

	return data;
}

/**
 * Format the error messages into a validation message
 */
export function getValidationMessage(errors?: string | string[]): string {
	return ([] as string[]).concat(errors ?? []).join(String.fromCharCode(31));
}

/**
 * Retrieve the error messages from the validation message
 */
export function getErrors(validationMessage: string | undefined): string[] {
	if (!validationMessage) {
		return [];
	}

	return validationMessage.split(String.fromCharCode(31));
}
