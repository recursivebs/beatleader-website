<script>
	import {setContext} from 'svelte';
	import {Router, Route, navigate} from 'svelte-routing';
	import Notifications from 'svelte-notifications';
	import buildInfo from '../build-info';
	import {configStore} from './stores/config';
	import createContainerStore from './stores/container';
	import SearchPage from './pages/Search.svelte';
	import RankingPage from './pages/Ranking.svelte';
	import EventPage from './pages/Event.svelte';
	import LeaderboardPage from './pages/Leaderboard.svelte';
	import LeaderboardsPage from './pages/Leaderboards.svelte';
	import ClanPage from './pages/Clan.svelte';
	import ClansPage from './pages/Clans.svelte';
	import FriendsPage from './pages/Friends.svelte';
	import PlayerPage from './pages/Player.svelte';
	import TwitchPage from './pages/Twitch.svelte';
	import NotFoundPage from './pages/NotFound.svelte';
	import PrivacyPage from './pages/Privacy.svelte';
	import AboutPage from './pages/About.svelte';
	import DashboardPage from './pages/Dashboard.svelte';
	import PlaylistsPage from './pages/Playlists.svelte';
	import PlaylistPage from './pages/Playlist.svelte';
	import SigninPage from './pages/SignIn.svelte';
	import SupportPage from './pages/Support.svelte';
	import Nav from './components/Nav.svelte';
	import Modal from 'svelte-simple-modal';
	import RtDashboard from './pages/RtDashboard.svelte';
	import EventsPage from './pages/Events.svelte';
	import Socket from './pages/Socket.svelte';
	import {setGlobalCSSValue} from './utils/color';
	import ContentBox from './components/Common/ContentBox.svelte';

	export let url = '';

	let mainEl = null;

	const containerStore = createContainerStore();

	setContext('pageContainer', containerStore);

	$: if (mainEl) containerStore.observe(mainEl);

	if ($configStore.preferences.theme != 'default' && $configStore.preferences.theme != 'mirror-low') {
		let dom = document.createElement('style');
		dom.innerHTML = `html,body{background:url(${$configStore.preferences.bgimage}) var(--background) !important;background-size:cover !important;background-attachment: fixed !important;}`;
		setGlobalCSSValue('customizable-color-1', $configStore.preferences.bgColor);
		setGlobalCSSValue('customizable-color-2', $configStore.preferences.headerColor);
		document.head.appendChild(dom);
	}
</script>

<Router {url}>
	<Nav />
	<Notifications zIndex={10000}>
		<Modal closeButton={false} styleWindow={{width: '90vw', height: '65vh'}} styleContent={{padding: 0}}>
			<main bind:this={mainEl} class={$configStore?.preferences?.theme}>
				<div class="ssr-page-container">
					<Route path="/" component={DashboardPage} />
					<Route path="/u/:initialPlayerId/*initialParams" let:params>
						<PlayerPage initialPlayerId={params.initialPlayerId} initialParams={params.initialParams} />
					</Route>
					<Route path="/rt" let:location>
						<RtDashboard {location} />
					</Route>
					<Route path="/privacy" component={PrivacyPage} />
					<Route path="/about" component={AboutPage} />
					<Route path="/socket" component={Socket} />
					<Route path="/friends" component={FriendsPage} />
					<Route path="/ranking/*page" let:params let:location>
						<RankingPage page={params.page} {location} />
					</Route>
					<Route path="/leaderboard/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							dontChangeType={false}
							showCurve={true}
							separatePage={true} />
					</Route>
					<Route path="/leaderboard/approval/:type/:leaderboardId/*page" let:params let:location>
						<LeaderboardPage
							leaderboardId={params.leaderboardId}
							type={params.type}
							page={params.page}
							{location}
							dontChangeType={false}
							showCurve={true}
							separatePage={true}
							showApproveRequest={true} />
					</Route>
					<Route path="/leaderboards/*page" let:params let:location>
						<LeaderboardsPage page={params.page} {location} />
					</Route>
					<Route path="/clan/:clanId/*page" let:params>
						<ClanPage clanId={params.clanId} page={params.page} />
					</Route>
					<Route path="/event/:eventId/*page" let:params let:location>
						<EventPage eventId={params.eventId} page={params.page} {location} />
					</Route>
					<Route path="/events/*page" let:params let:location>
						<EventsPage page={params.page} {location} />
					</Route>
					<Route path="/clans/*page" let:params let:location>
						<ClansPage page={params.page} {location} />
					</Route>
					<Route path="/playlists" component={PlaylistsPage} />
					<Route path="/playlist/:id" let:params>
						<PlaylistPage id={params.id} />
					</Route>
					<Route path="/search">
						<SearchPage changeTitle={true} />
					</Route>
					<Route path="/twitch" component={TwitchPage} />
					<Route path="/support" component={SupportPage} />
					<Route path="/dashboard" component={DashboardPage} />
					<Route path="/signin/*action" let:params>
						<SigninPage action={params.action} />
					</Route>
					<Route path="/*" component={NotFoundPage} />
				</div>
			</main>
		</Modal>
	</Notifications>
</Router>

<link rel="stylesheet" href="/themes/{$configStore.preferences.theme}.css" />

<footer>
	<p class="build">Build: {buildInfo.buildVersion} ({buildInfo.buildDate})</p>
	<ContentBox cls="footer-box">
		<p>
			<a href="/privacy" on:click|preventDefault={() => navigate('/privacy')}>Privacy policy</a>
			|
			<a href="/support" on:click|preventDefault={() => navigate('/support')}>Support</a>
			|
			<a href="/about" on:click|preventDefault={() => navigate('/about')}>About</a>
			|
			<a href="https://twitter.com/beatleader_">Twitter</a>
			|
			<a href="https://github.com/BeatLeader/beatleader-website">Source</a> |
			<a href="https://discord.gg/2RG5YVqtG6">Discord</a> |
			<a href="https://patreon.com/BeatLeader">Patreon</a>
		</p>
	</ContentBox>
</footer>

<style>
	:global(.notifications) {
		position: fixed;
		z-index: 10000;
	}

	:global(.notifications .position-top-left, .notifications .position-top-center, .notifications .position-top-right) {
		top: 3.5rem !important;
	}

	:global(.notification) {
		padding: 0;
		width: 20rem;
	}

	:global(.notification .notification-content) {
		width: auto !important;
	}

	:global(.footer-box) {
		margin: 1em 0 0 0 !important;
		border-radius: 0 !important;
	}

	main {
		margin-top: 1em;
	}

	.ssr-page-container {
		display: grid;
		grid-template-columns: 1fr;
		grid-template-rows: 1fr;
		min-height: calc(100vh - 9rem);
	}

	.ssr-page-container :global(> *) {
		grid-area: 1 / 1 / 1 / 1;
	}

	.build {
		font-size: 0.875em;
		color: var(--faded);
	}

	footer {
		font-size: 0.75em;
		text-align: center;
	}
</style>
