import type { RenderableTreeNodes } from '@markdoc/markdoc';
import { renderers } from '@markdoc/markdoc';
import {
	Link as RouterLink,
	useLocation,
	useRouteLoaderData,
} from '@remix-run/react';
import * as React from 'react';
import ReactSyntaxHighlighter from 'react-syntax-highlighter/dist/esm/prism-light';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import darcula from 'react-syntax-highlighter/dist/esm/styles/prism/darcula';
import type { loader as rootLoader } from '~/root';
import type { loader as pageLoader } from '~/routes/_guide.$page';
import { getIdFromHeading } from './markdoc';
import { useLayoutEffect, useRef } from 'react';

export interface Menu {
	title: string;
	links: Array<{
		title: string;
		to: string;
	}>;
}

const style = {
	...darcula,
	'pre[class*="language-"]': {
		...darcula['pre[class*="language-"]'],
		background: '#111',
		margin: 'revert',
	},
};

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function useRootLoaderData() {
	return useRouteLoaderData<typeof rootLoader>('root')!;
}

export function usePageLoaderData() {
	return useRouteLoaderData<typeof pageLoader>('routes/_guide.$page');
}

export function Sandbox({
	title,
	src,
	children,
}: {
	title: string;
	src: string;
	children: React.ReactNode;
}) {
	const { owner, repo, ref } = useRootLoaderData();
	const [hydated, setHydrated] = React.useState(false);

	React.useEffect(() => {
		setHydrated(true);
	}, []);

	if (!hydated) {
		return children;
	}

	const url = new URL(
		`https://codesandbox.io/embed/github/${owner}/${repo}/tree/${ref}${src}`,
	);

	url.searchParams.set('editorsize', '60');

	return (
		<iframe
			title={title}
			src={url.toString()}
			className="min-h-[70vh] my-6 w-full aspect-[16/9] outline outline-1 outline-zinc-800 outline-offset-4 rounded"
			sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
		/>
	);
}

export function Aside({ children }: { children: React.ReactNode }) {
	return <aside className="hidden">{children}</aside>;
}

export function Fence({
	language,
	children,
}: {
	language: string;
	children: string;
}): React.ReactElement {
	return (
		<ReactSyntaxHighlighter
			className="my-8 py-4"
			language={language}
			style={style}
			showLineNumbers={language === 'tsx' || language === 'css'}
		>
			{children}
		</ReactSyntaxHighlighter>
	);
}

export function Details({
	summary,
	children,
}: {
	summary: string;
	children: React.ReactElement;
}) {
	return (
		<details className="border border-zinc-700 rounded p-4 my-6">
			<summary>{summary}</summary>
			{children}
		</details>
	);
}

export function Heading({
	level,
	children,
}: {
	level: number;
	children: React.ReactNode;
}) {
	const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
	const id = typeof children === 'string' ? getIdFromHeading(children) : '';

	return (
		<HeadingTag
			id={id}
			className={
				level === 1
					? 'text-xl xl:text-3xl pt-4 pb-6 xl:pt-4 xl:pb-4 xl:mb-8 uppercase tracking-wider'
					: 'text-md xl:text-xl pt-40 -mt-32 pb-2 mb-6 xl:mt-auto xl:pt-8 xl:pb-4 xl:mb-8 border-b border-dotted border-zinc-200 '
			}
		>
			{level > 1 ? (
				<RouterLink className="mr-4" to={`#${id}`}>
					#
				</RouterLink>
			) : null}
			{children}
		</HeadingTag>
	);
}

export function MainNavigation({ menus }: { menus: Menu[] }) {
	const location = useLocation();
	const detailsRef = useRef<HTMLDetailsElement>(null);
	const currentPage = menus.reduce((result, menu) => {
		if (!result) {
			const link = menu.links.find((link) => link.to === location.pathname);

			if (link) {
				return `${menu.title} / ${link.title}`;
			}
		}

		return result;
	}, '');

	useLayoutEffect(() => {
		if (detailsRef.current) {
			detailsRef.current.open = false;
		}
	}, [location]);

	return (
		<>
			<details
				ref={detailsRef}
				className="xl:hidden peer block py-4 bg-zinc-950 open:bg-zinc-700 -mx-8 px-8 pointer"
			>
				<summary className="list-none">{currentPage}</summary>
			</details>
			<div className="hidden peer-open:block xl:block overflow-y-auto bg-zinc-950 xl:bg-inherit -mx-8 px-8 xl:m-0 xl:p-0 py-8">
				<Navigation
					menus={menus}
					isActiveLink={(link) => link === location.pathname}
				/>
			</div>
		</>
	);
}

export function Navigation({
	menus,
	isActiveLink,
}: {
	menus: Menu[];
	isActiveLink?: (link: string) => boolean;
}) {
	return (
		<nav className="flex flex-col gap-4">
			{menus.map((nav) => (
				<div key={nav.title}>
					{nav.title}
					<ul className="py-4">
						{nav.links.map((link) => (
							<li key={link.title}>
								<Link
									className={`block py-1 ${
										isActiveLink?.(link.to)
											? `text-white`
											: `text-zinc-400 hover:text-zinc-200`
									}`}
									href={link.to}
								>
									- {link.title}
								</Link>
							</li>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

export function Link({
	href,
	className,
	title,
	children,
}: {
	href: string;
	className?: string;
	title?: string;
	children: React.ReactNode;
}) {
	const origin = 'https://conform.guide';
	const url = href.startsWith(origin) ? href.replace(origin, '') : href;

	if (
		url.startsWith('https://') ||
		url.startsWith('http://') ||
		url.startsWith('//')
	) {
		return (
			<a className={className} href={url} title={title}>
				{children}
			</a>
		);
	}

	let to = url;

	if (to.startsWith('/packages/')) {
		to = to.replace('/packages/conform-', '/api/').replace('/README.md', '');
	} else if (to.startsWith('/docs/')) {
		to = to.replace('/docs', '').replace('.md', '');
	} else {
		to = to.replace('.md', '');
	}

	return (
		<RouterLink className={className} to={to} title={title} prefetch="intent">
			{children}
		</RouterLink>
	);
}

export function Markdown({ content }: { content: RenderableTreeNodes }) {
	return (
		<section className="py-4">
			{renderers.react(content, React, {
				components: {
					Aside,
					Sandbox,
					Details,
					Fence,
					Heading,
					Link,
				},
			})}
		</section>
	);
}
