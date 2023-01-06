import {
	type CommandButtonProps,
	type Submission,
	getPaths,
	setValue,
} from '.';

export type Command = {
	name: string;
	value: string;
};

export type ListCommand<Schema = unknown> =
	| { type: 'prepend'; scope: string; payload: { defaultValue: Schema } }
	| { type: 'append'; scope: string; payload: { defaultValue: Schema } }
	| {
			type: 'replace';
			scope: string;
			payload: { defaultValue: Schema; index: number };
	  }
	| { type: 'remove'; scope: string; payload: { index: number } }
	| { type: 'reorder'; scope: string; payload: { from: number; to: number } }
	| { type: 'combine'; payload: string[] };

export function parseListCommand<Schema = unknown>(
	data: string,
): ListCommand<Schema> {
	try {
		const command = JSON.parse(data);

		if (
			typeof command.type !== 'string' ||
			![
				'prepend',
				'append',
				'replace',
				'remove',
				'reorder',
				'combine',
			].includes(command.type)
		) {
			throw new Error(`Unknown list command received: ${command.type}`);
		}

		return command;
	} catch (error) {
		throw new Error(`Invalid list command: "${data}"; ${error}`);
	}
}

export function updateList<Schema>(
	list: Array<Schema>,
	command: ListCommand<Schema>,
): Array<Schema> {
	switch (command.type) {
		case 'prepend': {
			list.unshift(command.payload.defaultValue);
			break;
		}
		case 'append': {
			list.push(command.payload.defaultValue);
			break;
		}
		case 'replace': {
			list.splice(command.payload.index, 1, command.payload.defaultValue);
			break;
		}
		case 'remove':
			list.splice(command.payload.index, 1);
			break;
		case 'reorder':
			list.splice(
				command.payload.to,
				0,
				...list.splice(command.payload.from, 1),
			);
			break;
		default:
			throw new Error('Unknown list command received');
	}

	return list;
}

export function handleList<Schema>(
	submission: Submission<Schema>,
): Submission<Schema> {
	if (submission.type !== 'list') {
		return submission;
	}

	const command = parseListCommand(submission.intent ?? '');

	if (command.type === 'combine') {
		let result = submission;

		for (const intent of command.payload) {
			result = handleList({ ...result, intent });
		}

		return result;
	}

	const paths = getPaths(command.scope);

	setValue(submission.value, paths, (list) => {
		if (!Array.isArray(list)) {
			throw new Error('The list command can only be applied to a list');
		}

		return updateList(list, command);
	});

	return submission;
}

export interface ListCommandButtonBuilder {
	append<Schema>(
		name: string,
		payload: { defaultValue: Schema },
	): CommandButtonProps<'list'>;
	prepend<Schema>(
		name: string,
		payload: { defaultValue: Schema },
	): CommandButtonProps<'list'>;
	replace<Schema>(
		name: string,
		payload: { defaultValue: Schema; index: number },
	): CommandButtonProps<'list'>;
	remove(name: string, payload: { index: number }): CommandButtonProps<'list'>;
	reorder(
		name: string,
		payload: { from: number; to: number },
	): CommandButtonProps<'list'>;
	combine(
		commands: Array<CommandButtonProps<'list'>>,
	): CommandButtonProps<'list'>;
}

export const list = new Proxy({} as ListCommandButtonBuilder, {
	get(_target, type: any) {
		switch (type) {
			case 'append':
			case 'prepend':
			case 'replace':
			case 'remove':
			case 'reorder':
				return (scope: string, payload: any) => {
					return {
						name: 'conform/list',
						value: JSON.stringify({ type, scope, payload }),
						formNoValidate: true,
					};
				};
			case 'combine':
				return (commands: Array<CommandButtonProps<'list'>>) => {
					return {
						name: 'conform/list',
						value: JSON.stringify({
							type,
							payload: commands.map((command) => command.value),
						}),
						formNoValidate: true,
					};
				};
		}
	},
});
