import { Transition } from '@headlessui/react';
import { Link, useLocation, useNavigate } from '@remix-run/react';
import clsx from 'clsx';
import {
	AnimatePresence,
	motion,
	useIsPresent,
	useScroll,
	useTransform,
} from 'framer-motion';
import {
	Fragment,
	createContext,
	forwardRef,
	useContext,
	useMemo,
	useRef,
} from 'react';
import { ButtonLink, Tag } from '~/components';
import { ColorSchemeSwitcher } from '~/services/color-scheme/components';
import { remToPx } from '~/util';

interface Navigation {
	title: string;
	menus: Array<{
		title: string;
		to: string;
	}>;
}

const navigation: Navigation[] = [
	{
		title: 'Get Started',
		menus: [
			{ title: 'Overview', to: '/' },
			{ title: 'Tutorial', to: '/tutorial' },
			{ title: 'Examples', to: '/examples' },
		],
	},
	{
		title: 'Guides',
		menus: [
			{ title: 'Validation', to: '/validation' },
			{ title: 'Integrations', to: '/integrations' },
			{ title: 'Nested object and Array', to: '/configuration' },
			{ title: 'Intent button', to: '/intent-button' },
			{ title: 'File Upload', to: '/file-upload' },
			{ title: 'Focus management', to: '/focus-management' },
			{ title: 'Accessibility', to: '/accessibility' },
		],
	},
	{
		title: 'API Reference',
		menus: [
			{ title: '@conform-to/react', to: '/api/react' },
			{ title: '@conform-to/yup', to: '/api/yup' },
			{ title: '@conform-to/zod', to: '/api/zod' },
		],
	},
];

export function useMobileNavigation() {
	const location = useLocation();

	return useMemo(() => {
		const searchParams = new URLSearchParams(location.search);
		const isOpen = searchParams.get('open') === 'navigation';

		if (isOpen) {
			searchParams.delete('open');

			return {
				isOpen,
				openNavigationLink: location.search,
				closeNavigationLink: `?${searchParams}`,
			};
		} else {
			searchParams.set('open', 'navigation');

			return {
				isOpen,
				openNavigationLink: `?${searchParams}`,
				closeNavigationLink: location.search,
			};
		}
	}, [location.search]);
}

export function NavigationList(
	props: React.DetailedHTMLProps<
		React.HTMLAttributes<HTMLElement>,
		HTMLElement
	>,
) {
	return (
		<nav {...props}>
			<ul>
				<li className="md:hidden">
					<TopLevelNavItem href="https://github.com/edmundhung/conform/discussion">
						Discussion
					</TopLevelNavItem>
				</li>
				<li className="md:hidden">
					<TopLevelNavItem href="https://github.com/edmundhung/conform/releases">
						Changelog
					</TopLevelNavItem>
				</li>
				{navigation.map((group, groupIndex) => (
					<NavigationGroup
						key={group.title}
						group={group}
						className={groupIndex === 0 ? 'md:mt-0' : ''}
					/>
				))}
				<li className="sticky bottom-0 z-10 mt-6 min-[416px]:hidden">
					<ButtonLink
						to="https://github.com/edmundhung/conform"
						variant="filled"
						className="w-full"
					>
						GitHub
					</ButtonLink>
				</li>
			</ul>
		</nav>
	);
}

export function MobileNavigation() {
	const mobileNavigation = useMobileNavigation();
	const navigate = useNavigate();

	return (
		<Transition.Root show={mobileNavigation.isOpen} as={Fragment}>
			<div
				className="fixed inset-0 z-50 lg:hidden"
				onClick={() =>
					navigate(mobileNavigation.closeNavigationLink, {
						replace: true,
						preventScrollReset: true,
					})
				}
			>
				<Transition.Child
					as={Fragment}
					enter="duration-300 ease-out"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="duration-200 ease-in"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<div className="fixed inset-0 top-14 bg-zinc-400/20 backdrop-blur-sm dark:bg-black/40" />
				</Transition.Child>

				<Transition.Child
					as={Fragment}
					enter="duration-300 ease-out"
					enterFrom="opacity-0"
					enterTo="opacity-100"
					leave="duration-200 ease-in"
					leaveFrom="opacity-100"
					leaveTo="opacity-0"
				>
					<Header />
				</Transition.Child>

				<Transition.Child
					as={Fragment}
					enter="duration-500 ease-in-out"
					enterFrom="-translate-x-full"
					enterTo="translate-x-0"
					leave="duration-500 ease-in-out"
					leaveFrom="translate-x-0"
					leaveTo="-translate-x-full"
				>
					<motion.div
						layoutScroll
						className="fixed left-0 top-14 bottom-0 w-full overflow-y-auto bg-white px-4 pt-6 pb-4 shadow-lg shadow-zinc-900/10 ring-1 ring-zinc-900/7.5 dark:bg-zinc-900 dark:ring-zinc-800 min-[416px]:max-w-sm sm:px-6 sm:pb-10"
					>
						<NavigationList />
					</motion.div>
				</Transition.Child>
			</div>
		</Transition.Root>
	);
}

function TopLevelNavItemHeader({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={href}
			className="text-sm leading-5 text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
		>
			{children}
		</Link>
	);
}

function TopLevelNavItem({
	href,
	children,
}: {
	href: string;
	children: React.ReactNode;
}) {
	return (
		<Link
			to={href}
			className="block py-1 text-sm text-zinc-600 transition hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
		>
			{children}
		</Link>
	);
}

function ActivePageMarker({
	group,
	pathname,
}: {
	group: Navigation;
	pathname: string;
}) {
	let itemHeight = remToPx(2);
	let offset = remToPx(0.25);
	let activePageIndex = group.menus.findIndex((link) => link.to === pathname);
	let top = offset + activePageIndex * itemHeight;

	return (
		<motion.div
			layout
			className="absolute left-2 h-6 w-px bg-emerald-500"
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 0.2 } }}
			exit={{ opacity: 0 }}
			style={{ top }}
		/>
	);
}

function NavigationGroup({
	group,
	className,
}: {
	group: Navigation;
	className?: string;
}) {
	// If this is the mobile navigation then we always render the initial
	// state, so that the state does not change during the close animation.
	// The state will still update when we re-open (re-render) the navigation.
	let isInsideMobileNavigation = useIsInsideMobileNavigation();

	let [location, sections] = useInitialValue(
		[useLocation(), [] as Array<{ id: string; title: string; tag?: string }>],
		isInsideMobileNavigation,
	);

	let isActiveGroup =
		group.menus.findIndex((link) => link.to === location.pathname) !== -1;

	return (
		<li className={clsx('relative mt-6', className)}>
			<motion.h2
				layout="position"
				className="text-xs font-semibold text-zinc-900 dark:text-white"
			>
				{group.title}
			</motion.h2>
			<div className="relative mt-3 pl-2">
				<motion.div
					layout
					className="absolute inset-y-0 left-2 w-px bg-zinc-900/10 dark:bg-white/5"
				/>
				<AnimatePresence initial={false}>
					{isActiveGroup ? (
						<ActivePageMarker group={group} pathname={location.pathname} />
					) : null}
				</AnimatePresence>
				<ul className="border-l border-transparent">
					{group.menus.map((link) => (
						<motion.li key={link.to} layout="position" className="relative">
							<Link
								to={link.to}
								aria-current={
									link.to === location.pathname ? 'page' : undefined
								}
								className={clsx(
									'flex justify-between gap-2 py-1 pr-3 text-sm transition pl-4',
									link.to === location.pathname
										? 'text-zinc-900 dark:text-white'
										: 'text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white',
								)}
								replace={isInsideMobileNavigation}
							>
								<span className="truncate">{link.title}</span>
							</Link>
							<AnimatePresence mode="popLayout" initial={false}>
								{link.to === location.pathname && sections.length > 0 ? (
									<motion.ul
										role="list"
										initial={{ opacity: 0 }}
										animate={{
											opacity: 1,
											transition: { delay: 0.1 },
										}}
										exit={{
											opacity: 0,
											transition: { duration: 0.15 },
										}}
									>
										{sections.map((section) => (
											<li key={section.id}>
												<Link
													to={`${link.to}#${section.id}`}
													className="flex justify-between gap-2 py-1 pr-3 text-sm transition pl-7 text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white"
													replace={isInsideMobileNavigation}
												>
													<span className="truncate">{section.title}</span>
													{section.tag ? (
														<Tag variant="small" color="zinc">
															{section.tag}
														</Tag>
													) : null}
												</Link>
											</li>
										))}
									</motion.ul>
								) : null}
							</AnimatePresence>
						</motion.li>
					))}
				</ul>
			</div>
		</li>
	);
}

interface PageLinkProps {
	label: string;
	page: Navigation['menus'][0];
	previous?: boolean;
}

function PageLink({ label, page, previous = false }: PageLinkProps) {
	return (
		<>
			<ButtonLink
				to={page.to}
				aria-label={`${label}: ${page.title}`}
				variant="secondary"
				arrow={previous ? 'left' : 'right'}
			>
				{label}
			</ButtonLink>
			<Link
				to={page.to}
				tabIndex={-1}
				aria-hidden="true"
				className="text-base font-semibold text-zinc-900 transition hover:text-zinc-600 dark:text-white dark:hover:text-zinc-300"
			>
				{page.title}
			</Link>
		</>
	);
}

export function Footer() {
	const location = useLocation();
	const allPages = navigation.flatMap((group) => group.menus);
	const currentPageIndex = allPages.findIndex(
		(page) => page.to === location.pathname,
	);
	const previousPage =
		currentPageIndex > -1 ? allPages[currentPageIndex - 1] : undefined;
	const nextPage =
		currentPageIndex > -1 ? allPages[currentPageIndex + 1] : undefined;

	return (
		<footer className="mx-auto max-w-2xl space-y-10 pb-16 lg:max-w-5xl">
			{previousPage || nextPage ? (
				<div className="flex">
					{previousPage && (
						<div className="flex flex-col items-start gap-3">
							<PageLink label="Previous" page={previousPage} previous />
						</div>
					)}
					{nextPage && (
						<div className="ml-auto flex flex-col items-end gap-3">
							<PageLink label="Next" page={nextPage} />
						</div>
					)}
				</div>
			) : null}
			<div className="flex flex-col items-center justify-between gap-5 border-t border-zinc-900/5 pt-8 dark:border-white/5 sm:flex-row">
				<p className="text-xs text-zinc-600 dark:text-zinc-400">
					&copy; Copyright {new Date().getFullYear()}. All rights reserved.
				</p>
				<div className="flex gap-4">
					<Link to="https://github.com/edmundhung/conform" className="group">
						<span className="sr-only">Follow us on GitHub</span>
						<svg
							className="h-5 w-5 fill-zinc-700 transition group-hover:fill-zinc-900 dark:group-hover:fill-zinc-500"
							viewBox="0 0 20 20"
							aria-hidden="true"
						>
							<path
								fillRule="evenodd"
								clipRule="evenodd"
								d="M10 1.667c-4.605 0-8.334 3.823-8.334 8.544 0 3.78 2.385 6.974 5.698 8.106.417.075.573-.182.573-.406 0-.203-.011-.875-.011-1.592-2.093.397-2.635-.522-2.802-1.002-.094-.246-.5-1.005-.854-1.207-.291-.16-.708-.556-.01-.567.656-.01 1.124.62 1.281.876.75 1.292 1.948.93 2.427.705.073-.555.291-.93.531-1.143-1.854-.213-3.791-.95-3.791-4.218 0-.929.322-1.698.854-2.296-.083-.214-.375-1.09.083-2.265 0 0 .698-.224 2.292.876a7.576 7.576 0 0 1 2.083-.288c.709 0 1.417.096 2.084.288 1.593-1.11 2.291-.875 2.291-.875.459 1.174.167 2.05.084 2.263.53.599.854 1.357.854 2.297 0 3.278-1.948 4.005-3.802 4.219.302.266.563.78.563 1.58 0 1.143-.011 2.061-.011 2.35 0 .224.156.491.573.405a8.365 8.365 0 0 0 4.11-3.116 8.707 8.707 0 0 0 1.567-4.99c0-4.721-3.73-8.545-8.334-8.545Z"
							/>
						</svg>
					</Link>
				</div>
			</div>
		</footer>
	);
}

function useInitialValue<Value>(value: Value, condition = true): Value {
	let initialValue = useRef(value).current;
	return condition ? initialValue : value;
}

function VisibleSectionHighlight({
	list,
	visibleSectionIds,
	index,
}: {
	list: Array<{ id: string }>;
	visibleSectionIds: string[];
	index: number;
}) {
	let [sections, visibleSections] = useInitialValue(
		[list, visibleSectionIds],
		useIsInsideMobileNavigation(),
	);

	let isPresent = useIsPresent();
	let firstVisibleSectionIndex = Math.max(
		0,
		[{ id: '_top' }, ...sections].findIndex(
			(section) => section.id === visibleSections[0],
		),
	);
	let itemHeight = remToPx(2);
	let height = isPresent
		? Math.max(1, visibleSections.length) * itemHeight
		: itemHeight;
	let top = index * itemHeight + firstVisibleSectionIndex * itemHeight;

	return (
		<motion.div
			layout
			initial={{ opacity: 0 }}
			animate={{ opacity: 1, transition: { delay: 0.2 } }}
			exit={{ opacity: 0 }}
			className="absolute inset-x-0 top-0 bg-zinc-800/2.5 will-change-transform dark:bg-white/2.5"
			style={{ borderRadius: 8, height, top }}
		/>
	);
}

export const Header = forwardRef<HTMLDivElement>(function Header(_, ref) {
	const { isOpen: mobileNavIsOpen } = useMobileNavigation();
	const isInsideMobileNavigation = useIsInsideMobileNavigation();
	const { scrollY } = useScroll();
	const bgOpacityLight = useTransform(scrollY, [0, 72], [0.5, 0.9]);
	const bgOpacityDark = useTransform(scrollY, [0, 72], [0.2, 0.8]);

	return (
		<motion.div
			ref={ref}
			className={clsx(
				'fixed inset-x-0 top-0 z-50 flex h-14 items-center justify-between gap-12 px-4 transition sm:px-6 lg:left-72 lg:z-30 lg:px-8 xl:left-80',
				!isInsideMobileNavigation &&
					'backdrop-blur-sm dark:backdrop-blur lg:left-72 xl:left-80',
				isInsideMobileNavigation
					? 'bg-white dark:bg-zinc-900'
					: 'bg-white/[var(--bg-opacity-light)] dark:bg-zinc-900/[var(--bg-opacity-dark)]',
			)}
			style={{
				// @ts-expect-error css variables
				'--bg-opacity-light': bgOpacityLight,
				'--bg-opacity-dark': bgOpacityDark,
			}}
		>
			<div
				className={clsx(
					'absolute inset-x-0 top-full h-px transition',
					(isInsideMobileNavigation || !mobileNavIsOpen) &&
						'bg-zinc-900/7.5 dark:bg-white/7.5',
					``,
				)}
			/>
			<div className="hidden lg:block lg:max-w-md lg:flex-auto" />
			<div className="flex items-center gap-5 lg:hidden">
				<MobileNavigationToggle />
				<Link className="text-zinc-400" to="/" aria-label="Home">
					Conform
				</Link>
			</div>
			<div className="flex items-center gap-5">
				<nav className="hidden md:block">
					<ul className="flex items-center gap-8">
						<li>
							<TopLevelNavItemHeader href="https://github.com/edmundhung/conform/discussion">
								Discussion
							</TopLevelNavItemHeader>
						</li>
						<li>
							<TopLevelNavItemHeader href="https://github.com/edmundhung/conform/releases">
								Changelog
							</TopLevelNavItemHeader>
						</li>
					</ul>
				</nav>
				<div className="hidden md:block md:h-5 md:w-px md:bg-zinc-900/10 md:dark:bg-white/15" />
				<div className="flex gap-4">
					<ColorSchemeSwitcher />
				</div>
				<div className="hidden min-[416px]:contents">
					<ButtonLink to="https://github.com/edmundhung/conform">
						GitHub
					</ButtonLink>
				</div>
			</div>
		</motion.div>
	);
});

function MenuIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 10 9"
			fill="none"
			strokeLinecap="round"
			aria-hidden="true"
			{...props}
		>
			<path d="M.5 1h9M.5 8h9M.5 4.5h9" />
		</svg>
	);
}

function XIcon(props: React.SVGProps<SVGSVGElement>) {
	return (
		<svg
			viewBox="0 0 10 9"
			fill="none"
			strokeLinecap="round"
			aria-hidden="true"
			{...props}
		>
			<path d="m1.5 1 7 7M8.5 1l-7 7" />
		</svg>
	);
}

const IsInsideMobileNavigationContext = createContext(false);

function useIsInsideMobileNavigation() {
	return useContext(IsInsideMobileNavigationContext);
}

function MobileNavigationToggle() {
	const { isOpen, openNavigationLink, closeNavigationLink } =
		useMobileNavigation();
	const ToggleIcon = isOpen ? XIcon : MenuIcon;

	return (
		<IsInsideMobileNavigationContext.Provider value={true}>
			<Link
				to={isOpen ? closeNavigationLink : openNavigationLink}
				className="flex h-6 w-6 items-center justify-center rounded-md transition hover:bg-zinc-900/5 dark:hover:bg-white/5"
				aria-label="Toggle navigation"
				preventScrollReset
			>
				<ToggleIcon className="w-2.5 stroke-zinc-900 dark:stroke-white" />
			</Link>
		</IsInsideMobileNavigationContext.Provider>
	);
}
