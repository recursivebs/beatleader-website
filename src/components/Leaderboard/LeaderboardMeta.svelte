<script>
	import {MetaTags} from 'svelte-meta-tags';
	import ssrConfig from '../../ssr-config';
	import {formatDiffStatus, getHumanDiffInfo, mapTypeFromMask} from '../../utils/beatleader/format';

	export let leaderboard;
	export let song;

	$: diffInfo = leaderboard?.diffInfo ? getHumanDiffInfo(leaderboard.diffInfo) : null;
	$: image = song?.imageUrl ?? '';

	$: title = song?.name + ' | ' + (diffInfo?.type !== 'Standard' ? diffInfo?.name : diffInfo?.fullName) + ' | Beat Saber leaderboard';
	$: description =
		`
    Author: ${song?.authorName}
  	Mapped by: ${song?.levelAuthorName}
    Status: ${formatDiffStatus(leaderboard?.stats?.status ?? '')}
	` +
		(leaderboard?.stats?.stars ? `Stars: ${leaderboard?.stats?.stars}\n` : '') +
		(leaderboard?.stats.type ? `Type: ${mapTypeFromMask(leaderboard?.stats.type)}\n` : '');
</script>

<MetaTags
	{title}
	{description}
	openGraph={{
		title,
		description,
		images: [{url: image}],
		site_name: ssrConfig.name,
	}}
	twitter={{
		handle: '@handle',
		site: '@beatleader_',
		cardType: 'summary',
		title,
		description,
		image,
		imageAlt: song?.name + ' cover',
	}} />
