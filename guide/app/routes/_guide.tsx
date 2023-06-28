import { Link, Outlet } from '@remix-run/react';
import { motion } from 'framer-motion';
import {
	Header,
	Footer,
	NavigationList,
} from '~/services/navigation/components';

export default function Guide() {
	return (
		<div className="lg:ml-72 xl:ml-80">
			<motion.header
				layoutScroll
				className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex"
			>
				<header className="contents lg:pointer-events-none lg:fixed lg:inset-0 lg:z-40 lg:flex">
					<div className="contents lg:pointer-events-auto lg:block lg:w-72 lg:overflow-y-auto lg:border-r lg:border-zinc-900/10 lg:px-6 lg:pt-4 lg:pb-8 lg:dark:border-white/10 xl:w-80">
						<div className="hidden lg:flex">
							<Link className="text-zinc-400" aria-label="Home" to="/">
								Conform
							</Link>
						</div>
						<Header />
						<NavigationList className="hidden lg:mt-10 lg:block" />
					</div>
				</header>
			</motion.header>
			<div className="relative px-4 pt-14 sm:px-6 lg:px-8">
				<main className="py-16">
					<Outlet />
				</main>
				<Footer />
			</div>
		</div>
	);
}
