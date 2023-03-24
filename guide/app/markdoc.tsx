import * as markdoc from '@markdoc/markdoc';

export function parse(markdown: string) {
	const content = markdown
		.replace(
			/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
			'{% details summary="$1" %}$2{% /details %}',
		)
		.replace(
			/<!-- (\/?(lead|grid|cell|attributes|row|col|codegroup|aside|sandbox)( \w+=.+)*) -->/g,
			'{% $1 %}',
		);

	console.log(content);
	const ast = markdoc.parse(content);
	const node = markdoc.transform(ast, {
		nodes: {
			blockquote: {
				render: 'BlockQuote',
			},
			fence: {
				render: 'Fence',
				attributes: {
					language: {
						type: String,
						description:
							'The programming language of the code block. Place it after the backticks.',
					},
				},
			},
			heading: {
				render: 'Heading',
				attributes: {
					level: { type: Number, required: true, default: 1 },
				},
			},
			link: {
				render: 'Link',
				attributes: {
					href: { type: String, required: true },
					title: { type: String },
				},
			},
		},
		tags: {
			lead: {
				render: 'Lead',
				description: 'Lead paragraph',
			},
			grid: {
				render: 'Grid',
				description: 'Grid',
			},
			cell: {
				render: 'Cell',
				description: 'Cell in a grid',
				attributes: {
					image: {
						type: String,
						description: 'Additional image to be included in a cell',
						default: '',
					},
				},
			},
			attributes: {
				render: 'Attributes',
				description:
					'To list attributes with their names, data types and descriptions',
			},
			row: {
				render: 'Row',
				description: 'A row for two-column display',
			},
			col: {
				render: 'Col',
				description: 'A column in two-column display',
				attributes: {
					sticky: {
						type: Boolean,
						description: 'use sticky for sticky positioning element',
						default: false,
					},
				},
			},
			codegroup: {
				render: 'CodeGroup',
				description: 'A group of code snippets',
				attributes: {
					title: {
						type: String,
						default: '',
						description: 'Title of the code group',
					},
					// tag: {
					// 	type: String,
					// 	default: 'Tag',
					// 	description: '.......',
					// },
					// label: {
					// 	type: String,
					// 	default: 'Label',
					// 	description: '.....',
					// },
				},
			},
			aside: {
				render: 'Aside',
				description: 'Side notes',
			},
			sandbox: {
				render: 'Sandbox',
				description: 'To display an embedded sandbox',
				attributes: {
					title: {
						type: String,
						description: 'Title of the sandbox',
					},
					src: {
						type: String,
						required: true,
						description: 'Path to the source of the sandbox',
					},
				},
			},
			details: {
				render: 'Details',
				description: 'Native Details tag',
				attributes: {
					summary: {
						type: String,
						description: 'Summary of the block',
					},
				},
			},
		},
	});

	return node;
}

export function isTag(node: markdoc.RenderableTreeNode): node is markdoc.Tag {
	return node !== null && typeof node !== 'string';
}

export function getChildren(
	nodes: markdoc.RenderableTreeNodes,
): markdoc.RenderableTreeNode[] {
	if (Array.isArray(nodes) || !isTag(nodes)) {
		return [];
	}

	return nodes.children;
}
