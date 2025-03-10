<script>
	import Chart from 'chart.js/auto';
	Chart.defaults.color = '#fff';
	import 'chartjs-adapter-luxon';
	import {createEventDispatcher, getContext} from 'svelte';
	import {formatNumber} from '../../../utils/format';
	import createStatsHistoryStore from '../../../stores/beatleader/stats-history';
	import {formatDate, formatDateWithOptions, toBlMidnight, dateFromUnix} from '../../../utils/date';
	import {debounce} from '../../../utils/debounce';
	import {onLegendClick} from './utils/legend-click-handler';
	import stringify from 'json-stable-stringify';

	export let playerId = null;
	export let height = '350px';

	const CHART_DEBOUNCE = 300;
	const MAGIC_INACTIVITY_RANK = 999999;

	const pageContainer = getContext('pageContainer');
	const statsHistoryStore = createStatsHistoryStore();
	const dispatch = createEventDispatcher();

	let canvas = null;
	let chart = null;

	let lastHistoryHash = null;
	let activityHistory = null;

	const calcHistoryHash = statsHistory => stringify(statsHistory);

	async function setupChart(hash, canvas, statsHistory) {
		if (!hash || !canvas || !statsHistory?.rank?.length || chartHash === lastHistoryHash) return;

		let rankHistory = statsHistory.rank;
		const CHART_DAYS = rankHistory.length;

		lastHistoryHash = chartHash;

		const gridColor = '#2a2a2a';
		const rankColor = '#3e95cd';
		const countryRankColor = '#8992e8';
		const ppColor = '#007100';
		const rankedPlayCountColor = '#3e3e3e';
		const totalPlayCountColor = '#fff';
		const activityColor = '#333';
		const rankedActivityColor = '#eb008c';

		const dayTimestamps = statsHistory.timestamp.map(unix => dateFromUnix(unix).getTime());

		const nomTimestamp = dayTimestamps[dayTimestamps.length - 1];
		const data = rankHistory.map((h, idx) => ({
			x: dayTimestamps[idx],
			y: h === MAGIC_INACTIVITY_RANK ? null : h,
		}));

		const datasets = [
			{
				yAxisID: 'y',
				label: 'Rank',
				data,
				fill: false,
				borderColor: rankColor,
				borderWidth: 3,
				pointRadius: 0,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				round: 0,
				type: 'line',
			},
		];

		const xAxis = {
			type: 'time',
			display: true,
			offset: true,
			time: {
				unit: 'day',
			},
			scaleLabel: {
				display: false,
			},
			ticks: {
				autoSkip: false,
				major: {
					enabled: true,
				},
				font: function (context) {
					if (context.tick && context.tick.major) {
						return {
							weight: 'bold',
						};
					}
				},
				callback: (val, idx, ticks) => {
					if (!ticks?.[idx]) return '';

					return formatDateWithOptions(new Date(ticks[idx]?.value), {
						localeMatcher: 'best fit',
						day: '2-digit',
						month: 'short',
					});
				},
			},
			grid: {
				color: gridColor,
			},
		};

		const yAxes = {
			y: {
				display: true,
				position: 'left',
				reverse: true,
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Rank',
				},
				ticks: {
					callback: val => (val === Math.floor(val) ? val : null),
					precision: 0,
				},
				grid: {
					color: gridColor,
				},
			},
		};

		let lastYIdx = 0;

		const skipped = (ctx, value) => (ctx.p0.skip || ctx.p1.skip ? value : undefined);

		[
			{key: 'pp', name: 'PP', borderColor: ppColor, round: 2, axisDisplay: true, precision: 0},
			{
				key: 'countryRank',
				name: 'Country rank',
				borderColor: countryRankColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
				reverse: true,
			},
			{
				key: 'rankedPlayCount',
				name: 'Ranked play count',
				borderColor: rankedPlayCountColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
				hidden: true,
			},
			{
				key: 'totalPlayCount',
				name: 'Total play count',
				borderColor: totalPlayCountColor,
				round: 0,
				axisDisplay: false,
				precision: 0,
				hidden: true,
			},
		].forEach(obj => {
			const {key, name, axisDisplay, usePrevAxis, precision, reverse, ...options} = obj;

			if (!statsHistory?.[key]) return;

			const fieldData = dayTimestamps.map((x, idx) => ({x, y: statsHistory?.[key]?.[idx] ?? null}));

			if (!usePrevAxis) lastYIdx++;
			const axisKey = `y${lastYIdx}`;
			yAxes[axisKey] = {
				display: axisDisplay,
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: name,
				},
				ticks: {
					callback: val => (val === Math.floor(val) ? val : null),
					precision,
				},
				grid: {
					drawOnChartArea: false,
				},
				reverse: reverse === true,
			};

			datasets.push({
				...options,
				yAxisID: axisKey,
				label: name,
				data: fieldData,
				fill: false,
				borderWidth: 2,
				pointRadius: 1,
				cubicInterpolationMode: 'monotone',
				tension: 0.4,
				type: 'line',
				spanGaps: true,
				segment: {
					borderWidth: ctx => skipped(ctx, 1),
					borderDash: ctx => skipped(ctx, [6, 6]),
				},
			});
		});

		if (statsHistory?.rankedPlayCountDaily?.length || statsHistory?.unrankedPlayCountDaily?.length) {
			lastYIdx++;
			const scoresAxisKey = `y${lastYIdx}`;

			yAxes[scoresAxisKey] = {
				display: false,
				position: 'right',
				title: {
					display: $pageContainer.name !== 'phone',
					text: 'Daily scores',
				},
				ticks: {
					callback: val => val,
					precision: 0,
				},
				grid: {
					drawOnChartArea: false,
				},
			};

			if (statsHistory?.rankedPlayCountDaily?.length)
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Ranked scores',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.rankedPlayCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: rankedActivityColor,
					backgroundColor: rankedActivityColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 0,
				});

			if (statsHistory?.unrankedPlayCountDaily?.length)
				datasets.push({
					yAxisID: scoresAxisKey,
					label: 'Unranked scores',
					data: dayTimestamps.map((x, idx) => ({x, y: statsHistory.unrankedPlayCountDaily?.[idx] ?? null})),
					fill: false,
					borderColor: activityColor,
					backgroundColor: activityColor,
					round: 0,
					type: 'bar',
					maxBarThickness: 25,
					stack: 'daily-scores',
					order: 1,
				});
		}

		if (!chart) {
			chart = new Chart(canvas, {
				type: 'line',
				data: {datasets},
				options: {
					responsive: true,
					maintainAspectRatio: false,
					layout: {
						padding: {
							right: 0,
						},
					},
					interaction: {
						mode: 'index',
						intersect: false,
					},
					plugins: {
						legend: {
							display: true,
							onClick: onLegendClick,
						},
						tooltip: {
							position: 'nearest',
							callbacks: {
								title(ctx) {
									if (!ctx?.[0]?.raw) return '';

									return ctx[0].raw?.x == nomTimestamp ? 'Now' : formatDate(new Date(ctx[0].raw?.x), 'short', 'short');
								},
								label(ctx) {
									switch (ctx.dataset.label) {
										case 'Rank':
											return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
										case 'Country rank':
											return ` ${ctx.dataset.label}: #${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
										case 'PP':
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}pp`;
										default:
											return ` ${ctx.dataset.label}: ${formatNumber(ctx.parsed.y, ctx.dataset.round)}`;
									}
								},
							},
						},
					},
					scales: {
						x: xAxis,
						...yAxes,
					},
				},
			});
		} else {
			chart.data = {datasets};
			chart.options.scales = {x: xAxis, ...yAxes};
			chart.update();
		}

		dispatch('height-changed');
	}

	let debouncedChartHash = null;
	const debounceChartHash = debounce(chartHash => (debouncedChartHash = chartHash), CHART_DEBOUNCE);

	$: statsHistory = $statsHistoryStore[playerId];
	$: chartHash = calcHistoryHash(statsHistory);
	$: debounceChartHash(chartHash);
	$: if (debouncedChartHash) setupChart(debouncedChartHash, canvas, statsHistory);
</script>

{#if statsHistory?.rank?.length}
	<section class="chart" style="--height: {height}">
		<canvas class="chartjs" bind:this={canvas} height={parseInt(height, 10)} />
	</section>
{/if}

<style>
	section {
		position: relative;
		margin: 1rem auto 0 auto;
		height: var(--height, 300px);
	}

	canvas {
		width: 100% !important;
	}
</style>
