<script>
	import {createEventDispatcher} from 'svelte';

	const dispatch = createEventDispatcher();

	export let items = [];
	export let shown = false;
	export let noItems = null;
</script>

<div class="dropdown-menu" role="menu" class:shown>
	<div class="dropdown-content">
		{#if items && items.length}
			{#each items as item}
				<div class="dropdown-item" on:click={() => dispatch('select', item)}>
					<slot name="row" {item}>
						{item}
					</slot>
				</div>
			{/each}
		{:else if noItems}
			<div class="menu-label">{noItems}</div>
		{/if}
	</div>
</div>

<style>
</style>
