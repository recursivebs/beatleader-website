import keyValueRepository from './repository/key-value';
import log from '../utils/logger';
import twitchRepository from './repository/twitch';

const FIXES_KEY = 'data-fix';

const getAppliedFixes = async () => keyValueRepository().get(FIXES_KEY, true);
const setAppliedFixes = async fixes => keyValueRepository().set(fixes, FIXES_KEY);
const addAppliedFix = async fixName => {
	let allAppliedFixes = await getAppliedFixes();
	allAppliedFixes = allAppliedFixes && Array.isArray(allAppliedFixes) ? allAppliedFixes : [];
	allAppliedFixes.push(fixName);
	await setAppliedFixes(allAppliedFixes);
};

const allFixes = {
	'twitch-20210808': {
		apply: async fixName => {
			const predefinedProfiles = {
				'76561198059659922': 'patian25',
				1994101560659098: 'xoxobluff',
				'76561198138327464': 'altrowilddog',
				'76561198855288628': 'inbourne',
				'76561198136177445': 'riviengt',
				'76561199004224834': 'nyaanos',
				'76561198023909718': 'danielduel',
				'76561198212019365': 'fnyt',
				'76561197966674102': 'maciekvr',
				'76561198025451538': 'drakonno',
				'76561197994110158': 'sanorek',
				'76561198034203862': 'vr_agent',
				3702342373170767: 'xjedam',
				'76561197995161445': 'mediekore',
				'76561198087710981': 'shreddyfreddy',
				'76561198999385463': 'woltixo',
				'76561198035381239': 'motzel',
				'76561198178407566': 'acetari',
				'76561198045386379': 'duhhello',
				76561198835772160: 'tornadoef6',
				'76561198187936410': 'garsh_',
				'76561198362923485': 'tseska_',
				'76561198154190170': 'tieeli',
				'76561198333869741': 'cerret07',
				'76561197995162898': 'electrostats',
				'76561198166289091': 'rocker1904',
				2538637699496776: 'astrella_',
				'76561198171842815': 'coolpickb',
				'76561198145281261': 'harbgy',
			};

			log.info('Adding predefined Twitch profiles...', 'DBFix');

			const updatePlayerTwitchProfile = async twitchProfile => twitchRepository().set(twitchProfile);

			await Promise.all(
				Object.entries(predefinedProfiles).map(async ([playerId, twitchLogin]) =>
					updatePlayerTwitchProfile({
						lastUpdated: null,
						login: twitchLogin,
						playerId,
					})
				)
			);

			await addAppliedFix(fixName);

			log.info('Twitch profiles added.', 'DBFix');
		},
	},
};

export default async () => {
	let appliedDbFixes = await getAppliedFixes();
	const appliedFixes = appliedDbFixes && Array.isArray(appliedDbFixes) ? appliedDbFixes : [];
	const neededFixes = Object.keys(allFixes).filter(
		f => !appliedFixes.includes(f) && (!allFixes[f].validTo || allFixes[f].validTo > new Date())
	);

	if (!neededFixes.length) return;

	document.body.innerHTML = '<p>BeatLeader is an open Beat Saber leaderboard!</p>';

	for (let key of neededFixes) {
		await allFixes[key].apply(key);
	}

	document.body.innerHTML = '';
};
