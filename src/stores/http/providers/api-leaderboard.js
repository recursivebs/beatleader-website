import createLeaderboardService from '../../../services/beatleader/leaderboard';
import queue from '../../../network/queues/queues';

let leaderboardService = null;

export default () => {
	if (!leaderboardService) leaderboardService = createLeaderboardService();

	const getProcessed = async ({
		leaderboardId,
		type = 'global',
		page = 1,
		filters = {},
		priority = queue.PRIORITY.FG_HIGH,
		signal = null,
		force = false,
	} = {}) => {
		switch (type) {
			case 'global':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, filters, priority, signal, force);
			case 'friends':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, {friends: true}, priority, signal, force);
			case 'voters':
				return await leaderboardService.fetchLeaderboardPage(leaderboardId, page, {voters: true}, priority, signal, force);
			case 'accsaber':
				return await leaderboardService.fetchAccSaberPage(leaderboardId, page, priority, signal, force);
		}
	};

	return {
		getProcessed,
		getCached: getProcessed,
	};
};
