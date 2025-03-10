<script>
	import {createEventDispatcher} from 'svelte';
	import createScoresStore from '../../stores/http/http-scores-store.js';
	import createAccountStore from '../../stores/beatleader/account';
	import createFailedScoresStore from '../../stores/beatleader/failed-scores';
	import {opt} from '../../utils/js';
	import {scrollToTargetAdjusted} from '../../utils/browser';
	import SongScore from './SongScore.svelte';
	import FailedScore from './FailedScore.svelte';
	import Error from '../Common/Error.svelte';
	import ScoreServiceSwitcher from './ScoreServiceSwitcher.svelte';
	import ScoresPager from './ScoresPager.svelte';
	import stringify from 'json-stable-stringify';
	import Pager from '../Common/Pager.svelte';

	const dispatch = createEventDispatcher();

	export let playerId = null;
	export let player = null;
	export let initialState = null;
	export let initialStateType = null;
	export let initialService = 'beatleader';
	export let initialServiceParams = {};
	export let numOfScores = null;
	export let fixedBrowserTitle = null;
	export let withPlayers = false;
	export let noIcons = false;

	let scoresStore = createScoresStore(playerId, initialService, initialServiceParams, initialState, initialStateType);

	const account = createAccountStore();

	let scoresBoxEl = null;

	function changeParams(newPlayerId, newService, newServiceParams) {
		if (!newPlayerId) return null;

		scoresStore.fetch(newServiceParams, newService, newPlayerId);

		return {playerId: newPlayerId, service: newService, serviceParams: newServiceParams};
	}

	function onPageChanged(event) {
		if (!(event?.detail?.initial ?? false)) scrollToTop();

		const page = (event?.detail?.page ?? 0) + 1;
		if (!(event?.detail?.initial ?? false)) {
			dispatch('page-changed', page);
		}
	}

	function onServiceParamsChanged(event) {
		if (!event?.detail) return;

		dispatch('service-params-changed', event.detail);
	}

	function onServiceChanged(event) {
		if (!event?.detail) return;

		scrollToTop();

		dispatch('service-changed', event.detail);
	}

	function scrollToTop() {
		if (scoresBoxEl) scrollToTargetAdjusted(scoresBoxEl, 44);
	}

	let currentService = null;
	let lastService = '';
	function updateService(scoresStore) {
		if (!scoresStore) return;

		const newService = scoresStore.getService();
		if (lastService !== newService) currentService = newService;

		lastService = newService;
	}

	let currentServiceParams = null;
	let lastServiceParams = '';
	function updateServiceParams(scoresStore) {
		if (!scoresStore) return;

		const newServiceParams = stringify(scoresStore.getServiceParams());
		if (lastServiceParams !== newServiceParams) currentServiceParams = scoresStore.getServiceParams();

		lastServiceParams = newServiceParams;
	}

	function onFailedScoresPageChange(event) {
		const page = (event?.detail?.page ?? 0) + 1;

		failedScores.fetchScores(page);
	}

	const failedScores = createFailedScoresStore();

	$: changeParams(playerId, initialService, initialServiceParams, initialState, initialStateType);
	$: $scoresStore, updateService(scoresStore);
	$: $scoresStore, updateServiceParams(scoresStore);
	$: page = currentServiceParams?.page ?? null;
	$: totalScores = (scoresStore => (scoresStore && scoresStore.getTotalScores ? scoresStore.getTotalScores() : null))(
		scoresStore,
		$scoresStore
	);
	$: pending = scoresStore ? scoresStore.pending : null;
	$: error = scoresStore ? scoresStore.error : null;
	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: isAdmin ? failedScores.refresh() : null;

	$: failedScoresPage = opt($failedScores, 'metadata.page');
	$: totalFailedScores = opt($failedScores, 'metadata.total');
	$: failedScoresArray = opt($failedScores, 'scores');

	$: scoresStore && scoresStore.fetch(currentServiceParams, currentService);
	$: pagerTotalScores = totalScores !== null && totalScores !== undefined ? totalScores : numOfScores;

	$: itemsPerPage = (itemsPerPage => (itemsPerPage && itemsPerPage.getItemsPerPage ? scoresStore.getItemsPerPage() : null))(
		scoresStore,
		$scoresStore
	);
</script>

<div bind:this={scoresBoxEl}>
	{#if $error}
		<div><Error error={$error} /></div>
	{/if}

	<ScoreServiceSwitcher
		{playerId}
		{player}
		service={currentService}
		serviceParams={currentServiceParams}
		loadingService={$pending?.service}
		loadingServiceParams={$pending?.serviceParams}
		on:service-change={onServiceChanged}
		on:service-params-change={onServiceParamsChanged} />

	{#if $scoresStore && $scoresStore.length}
		<div class="song-scores grid-transition-helper">
			{#each $scoresStore as songScore, idx ((songScore?.id ?? '') + (songScore?.score?.id ?? ''))}
				<SongScore {playerId} {songScore} {fixedBrowserTitle} {idx} service={currentService} {withPlayers} {noIcons} />
			{/each}
		</div>
	{:else}
		<p>No scores.</p>
	{/if}

	{#if Number.isFinite(page) && (!Number.isFinite(pagerTotalScores) || pagerTotalScores > 0)}
		<ScoresPager
			{playerId}
			service={currentService}
			serviceParams={currentServiceParams}
			totalItems={pagerTotalScores}
			currentPage={page - 1}
			fixedItemsPerPage={itemsPerPage}
			loadingPage={$pending?.serviceParams?.page ? $pending.serviceParams.page - 1 : null}
			on:page-changed={onPageChanged} />
	{/if}

	{#if isAdmin && failedScoresArray && failedScoresArray.length}
		<div class="song-scores failed-scores grid-transition-helper">
			{#each failedScoresArray as songScore, idx (opt(songScore, 'score.id'))}
				<FailedScore store={failedScores} {playerId} {songScore} {fixedBrowserTitle} {idx} service={currentService} />
			{/each}
		</div>
		{#if Number.isFinite(failedScoresPage) && (!Number.isFinite(totalFailedScores) || totalFailedScores > 0)}
			<Pager
					totalItems={totalFailedScores}
					itemsPerPage={3}
					itemsPerPageValues={null}
					currentPage={failedScoresPage - 1}
					on:page-changed={onFailedScoresPageChange} />
		{/if}
	{/if}
</div>

<style>
	.song-scores :global(> *:last-child) {
		border-bottom: none !important;
	}
</style>
