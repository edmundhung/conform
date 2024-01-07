import { Link, Outlet, useLocation } from '@remix-run/react';
import {
	type Menu,
	Navigation,
	useRootLoaderData,
	usePageLoaderData,
	MainNavigation,
} from '~/components';
import { logo } from '~/util';

const menus: Menu[] = [
	{
		title: 'Get Started',
		links: [
			{ title: 'Overview', to: '/' },
			{ title: 'Tutorial', to: '/tutorial' },
			{ title: 'Examples', to: '/examples' },
		],
	},
	{
		title: 'Guides',
		links: [
			{ title: 'Validation', to: '/validation' },
			{ title: 'Integrations', to: '/integrations' },
			{ title: 'Nested object and Array', to: '/complex-structures' },
			{ title: 'Intent button', to: '/intent-button' },
			{ title: 'Accessibility', to: '/accessibility' },
			{ title: 'Checkbox and Radio Group', to: '/checkbox-and-radio-group' },
			{ title: 'File Upload', to: '/file-upload' },
		],
	},
	{
		title: 'API Reference',
		links: [
			{ title: '@conform-to/react', to: '/api/react' },
			{ title: '@conform-to/yup', to: '/api/yup' },
			{ title: '@conform-to/zod', to: '/api/zod' },
		],
	},
];

export default function Guide() {
	const { owner, repo, ref } = useRootLoaderData();
	const { file, toc } = usePageLoaderData() ?? {};
	const location = useLocation();

	const sidemenus: Menu[] = [];

	if (toc) {
		sidemenus.push({
			title: 'On this page',
			links: toc.links.map((link) => ({
				title: link.title,
				to: `${location.pathname}${location.search}${link.to}`,
			})),
		});
	}

	if (file) {
		const githubURL = `https://github.com/${owner}/${repo}`;

		sidemenus.push({
			title: 'Useful links',
			links: [
				{
					title: 'GitHub',
					to: githubURL,
				},
				{
					title: `Version (${ref})`,
					to: `${githubURL}/commits/${ref}`,
				},
				{
					title: 'MIT License',
					to: `${githubURL}/blob/${ref}/LICENSE`,
				},
				{
					title: 'Edit this page',
					to: `${githubURL}/edit/${ref}/${file}`,
				},
			],
		});
	}

	return (
		<div className="xl:container mx-auto xl:grid xl:grid-cols-5 gap-10 px-8 relative">
			<header className="bg-zinc-900 xl:bg-transparent sticky top-0 max-h-screen z-10 flex flex-col">
				<div className="py-2 xl:pt-4 xl:pb-8">
					<Link
						className="inline-block py-4 text-[.25rem] leading-[.25rem] xl:text-[.35rem] xl:leading-[.40rem] whitespace-pre"
						title="Conform"
						to="/"
					>
						{logo}
					</Link>
				</div>
				<MainNavigation menus={menus} />
			</header>
			<main className="xl:col-span-3">
				<Outlet />
			</main>
			<footer className="xl:col-span-1 top-0 sticky py-4 xl:flex xl:flex-col xl:h-screen -mx-8 px-8 mt-8 xl:mt-0 border-t xl:border-t-0 border-dotted">
				<div className="pt-2 pb-4 mb-4 hidden xl:block xl:invisible">
					<button className="flex items-center justify-between w-full gap-4 px-2.5 py-2 rounded-sm border border-zinc-500 text-zinc-500 hover:text-zinc-400 hover:border-zinc-400">
						<div className="line-clamp-1 text-left">
							Type{' "'}
							<kbd className="text-white">/</kbd>
							{'" to search'}
						</div>
						<div className="-mt-1 rotate-45 text-2xl" aria-hidden>
							&#9906;
						</div>
					</button>
				</div>

				{/* <div className="py-2 flex items-center gap-4">
					<span>Theme:</span>
					<a className="py-1 text-zinc-400 hover:text-zinc-200">
						Light
					</a>
					<span>/</span>
					<a className="py-1">
						Dark
					</a>
				</div> */}

				<div className="py-4 flex-1 xl:overflow-y-auto">
					<Navigation menus={sidemenus} />
				</div>

				<div className="py-4 text-sm">
					&copy; {new Date().getFullYear()} Edmund Hung
				</div>
			</footer>
		</div>
	);
}
