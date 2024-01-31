import {
	type RenderableTreeNode,
	parse as markdocParse,
	transform as markdocTransform,
	Tag,
} from '@markdoc/markdoc';
import { type Menu } from '~/components';

function generateID(
	children: RenderableTreeNode[],
	attributes: Record<string, any>,
) {
	if (attributes.id && typeof attributes.id === 'string') {
		return attributes.id;
	}

	return children
		.flatMap((child) => {
			if (child instanceof Tag) {
				return child.children;
			}
			return [child];
		})
		.filter((child) => typeof child === 'string')
		.join(' ')
		.replace(/[?]/g, '')
		.replace(/\s+/g, '-')
		.toLowerCase();
}

export function parse(markdown: string) {
	const content = markdown
		.replace(
			/<details>\n?\s*<summary>(.+?)<\/summary>(.*?)<\/details>/gs,
			'{% details summary="$1" %}$2{% /details %}',
		)
		.replace(/<!-- (\/?(aside|sandbox)( \w+=".+")*) -->/g, '{% $1 %}');
	const ast = markdocParse(content);
	const node = markdocTransform(ast, {
		nodes: {
			fence: {
				render: 'Fence',
				attributes: {
					language: { type: String },
				},
			},
			heading: {
				attributes: {
					id: { type: String, required: false },
					level: { type: Number },
				},
				transform(node, config) {
					const attributes = node.transformAttributes(config);
					const children = node.transformChildren(config);

					return new Tag(
						`Heading`,
						{
							...attributes,
							id:
								attributes.level === 2
									? generateID(children, attributes)
									: undefined,
						},
						children,
					);
				},
			},
			link: {
				render: 'Link',
				attributes: {
					href: { type: String },
					title: { type: String },
				},
			},
			paragraph: {
				render: 'Paragraph',
			},
			list: {
				render: 'List',
				attributes: {
					ordered: { type: Boolean },
				},
			},
			item: {
				render: 'Item',
			},
			code: {
				transform(node) {
					const { content, ...attributes } = node.attributes;

					return new Tag('Code', attributes, [content]);
				},
			},
			strong: {
				render: 'Strong',
			},
		},
		tags: {
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

export function collectHeadings(
	node: RenderableTreeNode,
	level = 1,
	menu: Menu = { title: '', links: [] },
): Menu {
	if (node instanceof Tag) {
		if (node.name === 'Heading') {
			const title = Array.isArray(node.children) ? node.children[0] : null;

			if (typeof title === 'string') {
				switch (node.attributes.level) {
					case 1:
						if (menu.title) {
							throw new Error('There are multiple h1 headings in the document');
						}
						menu.title = title;
						break;
					case 2:
						menu.links.push({
							title,
							to: `#${node.attributes.id ?? ''}`,
						});
						break;
				}
			}
		}

		if (level > 0 && node.children) {
			for (const child of node.children) {
				collectHeadings(child, level - 1, menu);
			}
		}
	}

	return menu;
}
