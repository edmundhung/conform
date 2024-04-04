import type { RenderableTreeNodes } from '@markdoc/markdoc';
import * as Markdoc from '@markdoc/markdoc';
import {
	Link as RouterLink,
	useLocation,
	useRouteLoaderData,
} from '@remix-run/react';
import * as React from 'react';
import { PrismLight as ReactSyntaxHighlighter } from 'react-syntax-highlighter';
import tsx from 'react-syntax-highlighter/dist/esm/languages/prism/tsx';
import css from 'react-syntax-highlighter/dist/esm/languages/prism/css';
import darcula from 'react-syntax-highlighter/dist/esm/styles/prism/darcula';
import type { loader as rootLoader } from '~/root';
import type { loader as indexLoader } from '~/routes/_index';
import type { loader as pageLoader } from '~/routes/$';
import { useEffect, useLayoutEffect, useRef } from 'react';

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
	},
};

export const useSafeLayoutEffect =
	typeof document === 'undefined' ? useEffect : useLayoutEffect;

ReactSyntaxHighlighter.registerLanguage('tsx', tsx);
ReactSyntaxHighlighter.registerLanguage('css', css);

export function useRootLoaderData() {
	return useRouteLoaderData<typeof rootLoader>('root')!;
}

export function usePageLoaderData() {
	const indexData = useRouteLoaderData<typeof indexLoader>('routes/_index');
	const pageData = useRouteLoaderData<typeof pageLoader>('routes/$');

	return pageData ?? indexData;
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
}): React.ReactNode {
	return (
		<div className="pb-4">
			<ReactSyntaxHighlighter
				language={language}
				style={style}
				showLineNumbers={language === 'tsx' || language === 'css'}
			>
				{children.trim()}
			</ReactSyntaxHighlighter>
		</div>
	);
}

export function Details({
	summary,
	children,
}: {
	summary: string;
	children: React.ReactNode;
}) {
	return (
		<details className="border border-zinc-700 rounded p-4 my-6">
			<summary>{summary}</summary>
			{children}
		</details>
	);
}

export function List({
	ordered,
	children,
}: {
	ordered?: boolean;
	children: React.ReactNode;
}): React.ReactNode {
	const ListTag = ordered ? 'ol' : 'ul';

	return <ListTag className="py-2">{children}</ListTag>;
}

export function Item({ children }: { children: React.ReactNode }) {
	return (
		<li className="relative before:content-['-_'] before:absolute before:left-0 before:text-zinc-400 py-1 px-4 text-zinc-200">
			{children}
		</li>
	);
}

export function Heading({
	id,
	level,
	children,
}: {
	id?: string;
	level: number;
	children: React.ReactNode;
}) {
	const HeadingTag = `h${level}` as 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';

	let className: string;

	switch (level) {
		case 1:
			className =
				'text-xl xl:text-3xl pt-4 pb-4 xl:pt-4 xl:pb-0 xl:mb-8 tracking-wide';
			break;
		case 2:
			className =
				'text-md xl:text-xl pt-40 -mt-32 pb-2 mb-4 xl:mt-auto xl:pt-8 xl:pb-4 xl:mb-6 border-b border-dotted border-zinc-200';
			break;
		default:
			className = `pt-4 pb-4 px-1 before:content-['[_'] after:content-['_]'] before:text-zinc-400 after:text-zinc-400`;
			break;
	}

	return (
		<HeadingTag id={id} className={className}>
			{id ? (
				<RouterLink
					className="text-zinc-400 hover:text-zinc-200 mr-4"
					to={`#${id}`}
				>
					#
				</RouterLink>
			) : null}
			{children}
		</HeadingTag>
	);
}

export function Paragraph({ children }: { children: React.ReactNode }) {
	return <p className="py-4 text-zinc-400">{children}</p>;
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

	useSafeLayoutEffect(() => {
		if (detailsRef.current) {
			detailsRef.current.open = false;
		}
	}, [location]);

	return (
		<>
			<details
				ref={detailsRef}
				className="xl:hidden peer block py-4 bg-zinc-950 open:bg-zinc-700 -mx-8 px-8"
			>
				<summary className="cursor-pointer">{currentPage}</summary>
			</details>
			<div className="hidden peer-open:block xl:block overflow-y-auto bg-zinc-950 xl:bg-inherit -mx-8 px-8 xl:mx-0 xl:px-0">
				<Navigation
					menus={menus}
					backgroundClassName="bg-zinc-950 xl:bg-zinc-900"
					isActiveLink={(link) => link === location.pathname}
				/>
			</div>
		</>
	);
}

export function Navigation({
	menus,
	backgroundClassName = 'bg-zinc-900',
	isActiveLink,
}: {
	menus: Menu[];
	backgroundClassName?: string;
	isActiveLink?: (link: string) => boolean;
}) {
	return (
		<nav>
			{menus.map((nav) => (
				<div key={nav.title} className="relative">
					<div
						className={`sticky top-0 ${backgroundClassName} z-10 pt-8 xl:pt-4 pb-1`}
					>
						{nav.title}
					</div>
					<ul className="pt-4 xl:pt-4">
						{nav.links.map((link) => (
							<Item key={link.title}>
								<Link
									className={`block py-1 -my-1 ${
										isActiveLink?.(link.to)
											? `text-white`
											: `text-zinc-400 hover:text-zinc-200`
									}`}
									href={link.to}
								>
									{link.title}
								</Link>
							</Item>
						))}
					</ul>
				</div>
			))}
		</nav>
	);
}

export function Strong({ children }: { children: React.ReactNode }) {
	return <span className="text-zinc-200">{children}</span>;
}

export function Link({
	href,
	className = 'underline',
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

	const to = url
		// Remove markdown file extension
		.replace(/\.md$/, '')
		// Remove leading './' to make relative path compatible with Remix
		.replace(/^\.\//, '../');

	return (
		<RouterLink
			className={className}
			to={to}
			title={title}
			prefetch="intent"
			relative="path"
		>
			{children}
		</RouterLink>
	);
}

export function Code({ children }: { children: React.ReactNode }) {
	return (
		<code className="text-white before:content-['`'] after:content-['`'] before:text-zinc-400 after:text-zinc-400">
			{children}
		</code>
	);
}

export function Markdown({ content }: { content: RenderableTreeNodes }) {
	return (
		<section className="py-4">
			{Markdoc.renderers.react(content, React, {
				components: {
					Aside,
					Sandbox,
					Details,
					Fence,
					List,
					Item,
					Heading,
					Paragraph,
					Link,
					Code,
					Strong,
				},
			})}
		</section>
	);
}
