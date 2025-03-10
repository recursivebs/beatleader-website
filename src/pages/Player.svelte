<script>
	import {onMount} from 'svelte';
	import {navigate} from 'svelte-routing';
	import {fade} from 'svelte/transition';
	import createPlayerInfoWithScoresStore from '../stores/http/http-player-with-scores-store';
	import createTwitchService from '../services/twitch';
	import createAccSaberService from '../services/accsaber';
	import {capitalize, opt} from '../utils/js';
	import ssrConfig from '../ssr-config';
	import {SsrHttpNotFoundError, SsrHttpUnprocessableEntityError} from '../network/errors';
	import {scrollToTargetAdjusted} from '../utils/browser';
	import createServiceParamsManager from '../components/Player/utils/service-param-manager';
	import eventBus from '../utils/broadcast-channel-pubsub';
	import Profile from '../components/Player/Profile.svelte';
	import Scores from '../components/Player/Scores.svelte';
	import MiniRankings from '../components/Ranking/MiniRankings.svelte';
	import AccSaberMiniRanking from '../components/Ranking/AccSaberMini.svelte';
	import TwitchVideos from '../components/Player/TwitchVideos.svelte';
	import ContentBox from '../components/Common/ContentBox.svelte';

	const STORE_SORTING_KEY = 'PlayerScoreSorting';
	const STORE_ORDER_KEY = 'PlayerScoreOrder';

	import keyValueRepository from '../db/repository/key-value';
	import {configStore} from '../stores/config';
	import PlayerMeta from '../components/Player/PlayerMeta.svelte';

	export let initialPlayerId = null;
	export let initialParams = null;

	document.body.classList.remove('slim');

	let playerEl = null;

	let service = null;
	let serviceParams = null;

	const serviceParamsManager = createServiceParamsManager(initialPlayerId);

	processInitialParams(initialPlayerId, initialParams);

	let playerStore = createPlayerInfoWithScoresStore(initialPlayerId, service, serviceParams);

	async function changeParams(newPlayerId, service, newServiceParams) {
		if (!newPlayerId) return;
		serviceParams = newServiceParams;
		if (!playerStore || newPlayerId !== playerStore.getPlayerId()) {
			playerStore.fetch(newPlayerId, service, newServiceParams);
		} else {
			playerStore.setService(service);
			playerStore.setServiceParams(newServiceParams);
		}
	}

	async function refreshSavedParams() {
		let params = serviceParamsManager.getParams();
		const scoresSortOptions = await configStore.get('preferences').scoresSortOptions;
		if (scoresSortOptions == 'last') {
			const sortingOption = await keyValueRepository().get(STORE_SORTING_KEY);
			if (sortingOption) {
				params.sort = sortingOption;
			}
			const orderOption = await keyValueRepository().get(STORE_ORDER_KEY);
			if (orderOption) {
				params.order = orderOption;
			}
		} else {
			params.sort = scoresSortOptions;
		}

		changeParams(currentPlayerId, serviceParamsManager.getService(), params);
	}

	function processInitialParams(playerId, params) {
		if (playerId !== $playerStore?.playerId) serviceParamsManager.clearServiceParams();

		const serviceInfo = serviceParamsManager.initFromUrl(params);

		if (!params || !params.length) {
			refreshSavedParams();
		}

		service = serviceInfo.service;
		serviceParams = serviceInfo.params;

		return {service, serviceParams};
	}

	const twitchService = createTwitchService();
	let twitchVideos = [];

	const accSaberService = createAccSaberService();

	function onPageChanged(event) {
		let newPage = event?.detail ?? null;
		if (!newPage) return;

		if (!Number.isFinite(newPage)) newPage = 1;

		serviceParamsManager.update({page: newPage});

		navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`);
	}

	function onServiceChanged(event) {
		const newService = event?.detail ?? null;
		if (!newService) return;

		if (newService !== serviceParamsManager.getService()) serviceParamsManager.clearServiceParams();

		serviceParamsManager.update({}, newService);

		navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`);
	}

	function onServiceParamsChanged(event) {
		const newServiceParams = event?.detail ?? null;
		if (!newServiceParams) return;

		const oldServiceUrl = serviceParamsManager.getCurrentServiceUrl();

		serviceParamsManager.update(newServiceParams);

		if (oldServiceUrl !== serviceParamsManager.getCurrentServiceUrl()) {
			navigate(`/u/${currentPlayerId}/${serviceParamsManager.getCurrentServiceUrl()}`);
		} else {
			changeParams(currentPlayerId, serviceParamsManager.getService(), serviceParamsManager.getParams());
		}
	}

	function scrollToTop() {
		if (playerEl) scrollToTargetAdjusted(playerEl, 55);
	}

	async function updateTwitchProfile(playerId) {
		if (!playerId) return;

		const twitchProfile = await twitchService.refresh(playerId);
		twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
	}

	let avatarHash = '';
	async function onPlayerDataUpdated() {
		if (playerStore) {
			await playerStore.refresh();

			// force refresh avatar url
			avatarHash = (Math.random() * 100000).toString();
		}
	}

	onMount(async () => {
		const twitchUnsubscribe = eventBus.on('player-twitch-videos-updated', ({playerId: twitchPlayerId, twitchProfile}) => {
			if (twitchPlayerId !== currentPlayerId) return;

			twitchVideos = twitchProfile && twitchProfile.videos && twitchProfile.videos.length ? twitchProfile.videos : [];
		});

		return () => {
			twitchUnsubscribe();
		};
	});

	let innerWidth = 0;
	let innerHeight = 0;

	$: processInitialParams(initialPlayerId, initialParams);
	$: changeParams(initialPlayerId, service, serviceParams);

	$: paramsStore = playerStore ? playerStore.params : null;

	$: currentPlayerId = $paramsStore.currentPlayerId;

	$: playerIsLoading = playerStore ? playerStore.isLoading : null;
	$: playerError = playerStore ? playerStore.error : null;
	$: skeleton = !$playerStore && $playerIsLoading;
	$: browserTitle = `${$playerStore?.name ?? 'Player'} / ${serviceParamsManager
		.getCurrentServiceUrl()
		?.split('/')
		.map(s => capitalize(s))
		.join(' / ')} - ${ssrConfig.name}`;
	$: updateTwitchProfile(currentPlayerId);

	let scoresPlayerId = null;
	let scoresState = null;
	$: if ($playerStore && !$playerIsLoading) {
		if (scoresPlayerId && scoresPlayerId === currentPlayerId) {
			scoresState = null;
		} else {
			scoresState = opt($playerStore, 'scores', null);
			scrollToTop();
		}

		scoresPlayerId = currentPlayerId;
	}
	$: accSaberAvailable = accSaberService.isDataForPlayerAvailable(scoresPlayerId);

	$: rank = $playerStore?.playerInfo.rank;
	$: country = $playerStore?.playerInfo.countries[0].country;
	$: countryRank = $playerStore?.playerInfo.countries[0].rank;
</script>

<svelte:head>
	<title>{browserTitle}</title>
</svelte:head>

<svelte:window bind:innerWidth bind:innerHeight />

<section class="align-content player-page">
	<article class="page-content" bind:this={playerEl} transition:fade>
		{#if $playerError && ($playerError instanceof SsrHttpNotFoundError || $playerError instanceof SsrHttpUnprocessableEntityError)}
			<ContentBox>
				<p class="error">Player not found.</p>
			</ContentBox>
		{:else}
			<Profile
				playerData={$playerStore}
				isLoading={$playerIsLoading}
				error={$playerError}
				{skeleton}
				{twitchVideos}
				on:player-data-updated={onPlayerDataUpdated}
				{avatarHash}
				fixedBrowserTitle={browserTitle} />

			{#if scoresPlayerId}
				<ContentBox>
					<Scores
						playerId={scoresPlayerId}
						player={$playerStore}
						initialState={scoresState}
						initialStateType={playerStore && $playerStore ? playerStore.getStateType() : 'initial'}
						initialService={$paramsStore.currentService}
						initialServiceParams={$paramsStore.currentServiceParams}
						numOfScores={$playerStore?.scoreStats?.totalPlayCount ?? null}
						on:service-changed={onServiceChanged}
						on:service-params-changed={onServiceParamsChanged}
						on:page-changed={onPageChanged}
						fixedBrowserTitle={browserTitle} />
				</ContentBox>
			{/if}
		{/if}
	</article>

	{#if innerWidth > 1749}
		<aside>
			<MiniRankings {rank} {country} {countryRank} box={true} />

			{#if twitchVideos && twitchVideos.length}
				<ContentBox>
					<TwitchVideos videos={twitchVideos} />
				</ContentBox>
			{/if}

			{#await accSaberAvailable}
				Loading...
			{:then accSaberAvailable}
				{#if accSaberAvailable}
					<ContentBox>
						<AccSaberMiniRanking playerId={scoresPlayerId} category="overall" numOfPlayers={5} />
					</ContentBox>
				{/if}
			{/await}
		</aside>
	{/if}
</section>
<PlayerMeta {playerStore} />

<style>
	.align-content {
		display: flex;
		justify-content: center;
	}

	.page-content {
		max-width: 65em;
		width: 100%;
		overflow: inherit;
	}

	article {
		width: calc(100% - 25em);
		overflow-x: hidden;
	}

	aside {
		width: 25em;
	}

	aside .box {
		padding: 0;
		margin-bottom: 1em;
	}

	button {
		cursor: pointer;
		min-width: 2rem;
		margin-right: 0.5rem;
	}

	@media screen and (max-width: 1749px) {
		article {
			width: 100%;
		}
	}
</style>
