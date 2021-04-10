import {SS_HOST} from '../../../network/scoresaber/page'
import tweened from '../../../svelte-utils/tweened';

const TWEEN_DURATION = 300;

const basicStatsTweened = {};
function updateBasicStats(playerData) {
  if (!playerData) return null;

  const playerInfo = playerData?.playerInfo;
  const scoreStats = playerData?.scoreStats;

  const statsDef = scoreStats
    ? [
      {key: "totalPlayCount", label: 'Total play count', bgColor: 'var(--selected)'},
      {key: "totalScore", label: 'Total score', bgColor: 'var(--selected)'},
      {key: "rankedPlayCount", label: 'Ranked play count', bgColor: 'var(--ppColour)'},
      {key: "totalRankedScore", label: 'Total ranked score', bgColor: 'var(--ppColour)'},
      {key: "averageRankedAccuracy", label: 'Average accuracy', digits: 2, suffix: '%', bgColor: 'var(--selected)'},
    ]
    : [];

  return statsDef
    .map(s => {
      const value = scoreStats?.[s.key]
      if (!value && !Number.isFinite(value)) return null;

      if (!basicStatsTweened.hasOwnProperty(s.key)) basicStatsTweened[s.key] = tweened(value, TWEEN_DURATION);
      else basicStatsTweened[s.key].set(value);

      return {
        label: s.label,
        value: basicStatsTweened[s.key],
        digits: s.digits ?? 0,
        suffix: s.suffix ?? '',
        fluid: true,
        bgColor: s.bgColor ?? 'var(--dimmed)',
      }
    })
    .concat(
      playerInfo['role'] && playerInfo['role'].length
        ? [{
          label: 'Role',
          value: playerInfo['role'],
          fluid: true,
          type: 'text',
          bgColor: 'var(--dimmed)',
        }]
        : [],
    )
    .filter(s => s);
}

function updateSsBadges(playerData) {
  if (!playerData?.playerInfo?.badges?.length) return null;

  return playerData.playerInfo.badges.map(b => ({src: `${SS_HOST}/imports/images/badges/${b.image}`, title: b.description}));
}

const playerInfoTweened = {};
export default playerData => {
  const playerInfo = playerData?.playerInfo ?? null;

  ['pp', 'rank'].forEach(key => {
    const value = playerInfo?.[key];
    if (!playerInfoTweened.hasOwnProperty(key)) playerInfoTweened[key] = tweened(value, TWEEN_DURATION);
    else playerInfoTweened[key].set(value);

    if (playerInfo) playerInfo[key] = playerInfoTweened[key];
  });

  if (Number.isFinite(playerInfo?.countries?.[0]?.rank)) {
    const key = 'countryRank'
    const value = playerInfo.countries[0].rank;

    if (!playerInfoTweened.hasOwnProperty(key)) playerInfoTweened[key] = tweened(value, TWEEN_DURATION);
    else playerInfoTweened[key].set(value);

    playerInfo.countries[0].rank = playerInfoTweened[key];
  }

  return {
    playerInfo,
    prevInfo: playerData?.prevInfo ?? null,
    basicStats: updateBasicStats(playerData),
    ssBadges: updateSsBadges(playerData),
  }
}