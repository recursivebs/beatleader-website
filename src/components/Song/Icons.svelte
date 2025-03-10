<script>
	import {getContext} from 'svelte';
	import createBeatSaverService from '../../services/beatmaps';
	import createPlaylistStore from '../../stores/playlists';
	import createAccountStore from '../../stores/beatleader/account';
	import {configStore} from '../../stores/config';
	import {copyToClipboard} from '../../utils/clipboard';
	import beatSaverSvg from '../../resources/beatsaver.svg';
	import Button from '../Common/Button.svelte';
	import Preview from '../Common/Preview.svelte';
	import {capitalize, opt} from '../../utils/js';
	import {BL_API_URL} from '../../network/queues/beatleader/api-queue';
	import PinIcon from '../Player/PinIcon.svelte';
	import ScoreActionButtonsLayout from "./ScoreActionButtonsLayout.svelte";

	export let layoutType = "flat";
	export let hash;
	export let diffInfo = null;
	export let twitchUrl = null;
	export let icons = false;
	export let scoreId = null;
	export let replayLink = null;
	export let mapCheck = false;
	export let serviceIcon = null;
	export let noPin = false;

	const {open} = getContext('simple-modal');
	const showPreview = previewLink => {
		if (document.body.clientWidth < 800) {
			window.open(previewLink, '_blank');
		} else {
			open(Preview, {previewLink: previewLink});
		}
	};

	let songKey;
	let songInfo;
	let shownIcons = icons ? icons : ['playlist', 'bsr', 'bs', 'preview', 'replay', 'oneclick', 'twitch', 'delete', 'pin'];
	if (mapCheck) {
		shownIcons.push('mapcheck');
	}

	let beatSaverService = createBeatSaverService();
	const account = createAccountStore();
	const playlists = createPlaylistStore();

	function decapitalizeFirstLetter(string) {
		return string.charAt(0).toLowerCase() + string.slice(1);
	}

	async function updateSongKey(hash) {
		if (!hash) {
			songKey = null;
			return;
		}

		const songInfoValue = await beatSaverService.byHash(hash);
		if (songInfoValue && songInfoValue.key) {
			songKey = songInfoValue.key;
			songInfo = {
				hash,
				songName: songInfoValue.name,
				difficulties: [{name: decapitalizeFirstLetter(diffInfo.diff), characteristic: diffInfo.type}],
				levelAuthorName: songInfoValue.uploader.name,
			};
		}
	}

	$: updateSongKey(hash);
	$: diffName = diffInfo && diffInfo.diff ? capitalize(diffInfo.diff) : null;
	$: charName = diffInfo && diffInfo.type ? diffInfo.type : null;

	$: selectedPlaylistIndex = opt($configStore, 'selectedPlaylist');
	$: selectedPlaylist = $playlists[selectedPlaylistIndex];
	$: playlistSongs = selectedPlaylist?.songs?.filter(el => el.hash == hash);
	$: playlistSong = playlistSongs?.length ? playlistSongs[0] : null;
	$: difficulties = playlistSong?.difficulties?.map(el => capitalize(el.name));

	$: oneclickToPlaylist = opt($configStore, 'preferences')?.oneclick == 'playlist';
	$: ocPlaylistIndex = oneclickToPlaylist ? $playlists.findIndex(p => p.oneclick) : null;
	$: ocPlaylist = ocPlaylistIndex != null ? $playlists[ocPlaylistIndex] : null;
	$: ocplaylistSongs = ocPlaylist?.songs?.filter(el => el.hash == hash);
	$: ocplaylistSong = ocplaylistSongs?.length ? ocplaylistSongs[0] : null;
	$: ocdifficulties = ocplaylistSong?.difficulties?.map(el => capitalize(el.name));
	$: isAdmin = $account.player && $account.player.playerInfo.role && $account.player.playerInfo.role.includes('admin');
	$: replayUrl = replayLink?.length
		? `https://replay.beatleader.xyz/?link=${replayLink}`
		: scoreId
		? `https://replay.beatleader.xyz/?scoreId=${scoreId}`
		: null;
	$: previewUrl = `https://skystudioapps.com/bs-viewer/?id=${songKey}${diffName ? `&diffName=${diffName}` : ''}${
		charName ? `&charName=${charName}` : ''
	}`;
</script>

<ScoreActionButtonsLayout type={layoutType}>
    <span slot="special_buttons">
		{#if shownIcons.includes('delete') && isAdmin && scoreId}
			<Button
					iconFa="fas fa-trash-alt"
					title="Delete score"
					noMargin={true}
					type="danger"
					on:click={fetch(BL_API_URL + `score/${scoreId}`, {
					method: 'DELETE',
					credentials: 'include',
				})} />
		{/if}
		{#if !noPin && shownIcons.includes('pin')}
            <PinIcon {scoreId} on:score-pinned/>
        {/if}
    </span>

	<span slot="default_buttons">
		{#if shownIcons.includes('pin-service') && serviceIcon?.link?.length && serviceIcon?.linkServiceIcon?.length}
			<a href={serviceIcon.link} target="_blank" rel="noreferrer">
				<Button icon={`<i class="service-icon"><img src="${serviceIcon.linkServiceIcon}" /></i>`} noMargin={true}/>
			</a>
		{/if}

		{#if shownIcons.includes('twitch') && twitchUrl && twitchUrl.length}
			<a class="video" href={twitchUrl} target="_blank" rel="noreferrer">
				<Button iconFa="fab fa-twitch" type="twitch" title="Twitch VOD preview" noMargin={true}/>
			</a>
		{/if}

		{#if songKey && songKey.length}
			{#if shownIcons.includes('playlist')}
				{#if selectedPlaylist != null}
					{#if playlistSong}
						{#if difficulties.length == 1 && difficulties[0] == diffName}
							<Button
									iconFa="fas fa-list-ul"
									title="Remove from the {selectedPlaylist.playlistTitle}"
									noMargin={true}
									type="danger"
									on:click={playlists.remove(hash)}/>
						{:else if difficulties.length == 1 || !difficulties.includes(diffName)}
							<Button
									iconFa="fas fa-list-ul"
									title="Add this diff to the {selectedPlaylist.playlistTitle}"
									noMargin={true}
									on:click={playlists.addDiff(hash, diffInfo)}/>
						{:else}
							<Button
									iconFa="fas fa-list-ul"
									title="Remove this diff from the {selectedPlaylist.playlistTitle}"
									noMargin={true}
									type="lessdanger"
									on:click={playlists.removeDiff(hash, diffInfo)}/>
						{/if}
					{:else}
						<Button
								iconFa="fas fa-list-ul"
								title="Add to the {selectedPlaylist.playlistTitle}"
								noMargin={true}
								on:click={playlists.add(songInfo)}/>
					{/if}
				{:else}
					<Button iconFa="fas fa-list-ul" title="Create new playlist with this song" noMargin={true}
							on:click={playlists.create(songInfo)}/>
				{/if}
			{/if}

			{#if shownIcons.includes('bsr')}
				<Button iconFa="fas fa-exclamation" title="Copy !bsr" noMargin={true}
						on:click={copyToClipboard('!bsr ' + songKey)}/>
			{/if}

			{#if shownIcons.includes('bs')}
				<a href="https://beatsaver.com/maps/{songKey}" target="_blank" rel="noreferrer">
					<Button icon={beatSaverSvg} title="Go to Beat Saver" noMargin={true}/>
				</a>
			{/if}

			{#if shownIcons.includes('mapcheck')}
				<a href="https://kivalevan.me/BeatSaber-MapCheck/?id={songKey}" target="_blank" rel="noreferrer">
					<Button iconFa="fas fa-magnifying-glass-location" title="Check the map" noMargin={true}/>
				</a>
			{/if}

			{#if shownIcons.includes('oneclick')}
				{#if oneclickToPlaylist && ocPlaylist != null}
					{#if ocplaylistSong}
						{#if ocdifficulties.length == 1 && ocdifficulties[0] == diffName}
							<Button
									iconFa="fas fa-hand-pointer"
									title="Remove from the One-Click playlist"
									noMargin={true}
									type="danger"
									on:click={playlists.remove(hash, ocPlaylistIndex)}/>
						{:else if ocdifficulties.length == 1 || !ocdifficulties.includes(diffName)}
							<Button
									iconFa="fas fa-hand-pointer"
									title="Add this diff to the One-Click playlist"
									noMargin={true}
									on:click={playlists.addDiff(hash, diffInfo, ocPlaylistIndex)}/>
						{:else}
							<Button
									iconFa="fas fa-hand-pointer"
									title="Remove this diff from the One-Click playlist"
									noMargin={true}
									type="lessdanger"
									on:click={playlists.removeDiff(hash, diffInfo, ocPlaylistIndex)}/>
						{/if}
					{:else}
						<Button
								iconFa="fas fa-hand-pointer"
								title="Add to the One-Click playlist"
								type="purple"
								noMargin={true}
								on:click={playlists.add(songInfo, ocPlaylistIndex)}/>
					{/if}
				{:else}
					<a href="beatsaver://{songKey}">
						<Button iconFa="far fa-hand-pointer" title="One click install" noMargin={true}/>
					</a>
				{/if}
			{/if}

			{#if shownIcons.includes('preview')}
				<Button url={previewUrl} on:click={showPreview(previewUrl)} iconFa="fa fa-play-circle"
						title="Map preview" noMargin={true}/>
			{/if}

			{#if shownIcons.includes('replay') && replayUrl?.length}
				<Button
						url={replayUrl}
						on:click={showPreview(replayUrl)}
						cls={shownIcons.length == 1 ? 'replay-button-alt' : 'replay-button'}
						icon="<img src='/assets/{shownIcons.length == 1 ? `replays.svg` : `bs-pepe.gif`}'>"
						title="Replay"
						noMargin={true}/>
			{/if}
		{/if}
	</span>
</ScoreActionButtonsLayout>

<style>
	:global(i.rotate) {
		transform: rotateZ(45deg);
	}

	:global(.replay-button-alt) {
		--bg-color: transparent !important;
	}
</style>
