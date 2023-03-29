import * as markdoc from '@markdoc/markdoc';

export function parse(markdown: string) {
	const content = markdown
		.replace(
			/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
			'{% details summary="$1" %}$2{% /details %}',
		)
		.replace(
			/<!-- (\/?(lead|grid|cell|resources|attributes|row|col|codegroup|aside|sandbox)( \w+=.+)*) -->/g,
			'{% $1 %}',
		);

	// console.log(content);
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
			resources: {
				render: 'Resources',
				description: 'Cards for linking to resources',
				transform(node, config) {
					const resources = [];
					let resource = {};
					let count = 0;
					const patterns = [
						{
							y: 16,
							squares: [
								[0, 1],
								[1, 3],
							],
						},
						{
							y: -6,
							squares: [
								[-1, 2],
								[1, 3],
							],
						},
						{
							y: 32,
							squares: [
								[0, 2],
								[1, 4],
							],
						},
						{
							y: 22,
							squares: [[0, 1]],
						},
					];

					for (const child of node.children) {
						if (child.type == 'heading') {
							resource.to = child.children[0].children[0].attributes.href;
							resource.name =
								child.children[0].children[0].children[0].attributes.content;
						} else if (child.type == 'paragraph') {
							resource.description =
								child.children[0].children[0].attributes.content;
							resource.pattern = patterns[count % 4];
							count = count + 1;
							resources.push(resource);
							resource = {};
						}
					}

					return new markdoc.Tag('Resources', {
						resources,
					});
				},
			},
			attributes: {
				render: 'Attributes',
				description:
					'To list attributes with their names, data types and descriptions',
				transform(node, config) {
					const attributes = [];
					let attr = {};
					for (const child of node.children) {
						if (child.type == 'heading' && child.children[0].type == 'inline') {
							for (const grandchild of child.children[0].children) {
								if (grandchild.type == 'code') {
									attr.name = grandchild.attributes.content;
								} else if (grandchild.type == 'em') {
									attr.type = grandchild.children[0].attributes.content;
								}
							}
						}

						if (child.type == 'paragraph') {
							attr.description =
								child.children[0].children[0].attributes.content;
							attributes.push(attr);
							attr = {};
						}
					}

					return new markdoc.Tag('Attributes', {
						attributes,
					});
				},
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
