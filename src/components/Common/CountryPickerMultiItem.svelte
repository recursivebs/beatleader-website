<script>
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let value = [];
	export let activeValue = undefined;
	export let isDisabled = false;
	export let multiFullItemClearable = false;
	export let getSelectionLabel = undefined;

	function handleClear(i, event) {
		event.stopPropagation();
		dispatch('multiItemClear', {i});
	}
</script>

{#each value as item, i}
	<div
		class="multiSelectItem {activeValue === i ? 'active' : ''} {isDisabled ? 'disabled' : ''}"
		on:click={event => (multiFullItemClearable ? handleClear(i, event) : {})}>
		<div class="multiSelectItem_label">
			<img class="flag" src={`https://cdn.beatleader.xyz/flags/${item?.value}.png`} alt={item?.label} />

			{@html getSelectionLabel(item)}
		</div>
		{#if !isDisabled && !multiFullItemClearable}
			<div class="multiSelectItem_clear" on:click={event => handleClear(i, event)}>
				<svg width="100%" height="100%" viewBox="-2 -2 50 50" focusable="false" aria-hidden="true" role="presentation">
					<path
						d="M34.923,37.251L24,26.328L13.077,37.251L9.436,33.61l10.923-10.923L9.436,11.765l3.641-3.641L24,19.047L34.923,8.124 l3.641,3.641L27.641,22.688L38.564,33.61L34.923,37.251z" />
				</svg>
			</div>
		{/if}
	</div>
{/each}

<style>
	.multiSelectItem {
		background: var(--multiItemBG, #ebedef);
		margin: var(--multiItemMargin, 5px 5px 0 0);
		border-radius: var(--multiItemBorderRadius, 16px);
		height: var(--multiItemHeight, 32px);
		line-height: var(--multiItemHeight, 32px);
		display: flex;
		cursor: default;
		padding: var(--multiItemPadding, 0 10px 0 15px);
		max-width: 100%;
	}

	.multiSelectItem_label {
		display: inline-flex;
		align-items: center;
		margin: var(--multiLabelMargin, 0 5px 0 0);
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}

	.multiSelectItem:hover,
	.multiSelectItem.active {
		background-color: var(--multiItemActiveBG, #006fff);
		color: var(--multiItemActiveColor, #fff);
	}

	.multiSelectItem.disabled:hover {
		background: var(--multiItemDisabledHoverBg, #ebedef);
		color: var(--multiItemDisabledHoverColor, #c1c6cc);
	}

	.multiSelectItem_clear {
		border-radius: var(--multiClearRadius, 50%);
		background: var(--multiClearBG, #52616f);
		min-width: var(--multiClearWidth, 16px);
		max-width: var(--multiClearWidth, 16px);
		height: var(--multiClearHeight, 16px);
		position: relative;
		top: var(--multiClearTop, 8px);
		text-align: var(--multiClearTextAlign, center);
		padding: var(--multiClearPadding, 1px);
	}

	.multiSelectItem_clear:hover,
	.active .multiSelectItem_clear {
		background: var(--multiClearHoverBG, #fff);
	}

	.multiSelectItem_clear:hover svg,
	.active .multiSelectItem_clear svg {
		fill: var(--multiClearHoverFill, #006fff);
	}

	.multiSelectItem_clear svg {
		fill: var(--multiClearFill, #ebedef);
		vertical-align: top;
	}

	.flag {
		width: 1.5rem;
		padding: 0.25rem 0;
		margin: 0 0.5rem;
	}
</style>
