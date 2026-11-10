(() => {
  const raceFilesSeason1 = [
    'supergrid_4fun_2026_05_04_race_brands.html',
    'supergrid_4fun_2026_05_11_race_misano.html',
    'supergrid_4fun_2026_05_18_race_silverstone.html',
    'supergrid_4fun_2026_05_25_race_kyalami.html',
    'supergrid_4fun_2026_06_01_race_laguna_seca.html',
    'supergrid_4fun_2026_06_08_race_barcelona.html',
    'supergrid_4fun_2026_06_15_race_redbullring.html',
    'supergrid_4fun_2026_06_22_race_hungaroring.html',
    'supergrid_4fun_2026_07_06_race_indianapolis.html',
    'supergrid_4fun_2026_07_13_race_oulton.html',
    'supergrid_4fun_2026_07_20_race_suzuka.html',
    'supergrid_4fun_2026_07_27_race_donington.html',
    'supergrid_4fun_2026_08_03_race_snetterton.html',
    'supergrid_4fun_2026_08_10_race_monza.html',
    'supergrid_4fun_2026_08_17_race_watkins.html',
    'supergrid_4fun_2026_08_24_race_nurburgring.html',
    'supergrid_4fun_2026_09_07_race_zolder.html',
    'supergrid_4fun_2026_09_14_race_imola.html',
    'supergrid_4fun_2026_09_21_race_spa.html',
    'supergrid_4fun_2026_09_28_race_mountpanorama.html',
    'supergrid_4fun_2026_10_05_race_zandvoort.html',
    'supergrid_4fun_2026_10_12_race_nords.html'
  ];
  const raceFilesSeason2 = [
    '4Fun_ST/20261019_barcelona_race.html',
      '4Fun_ST/20261102_hungaroring_race.html',
      '4Fun_ST/20261109_suzuka_race.html'

  ];

  const cleanPilotName = name => name
    .replace(/\s*\|.*$|\s*\[[^\]]+\]|\s*\([^\)]+\)$/g, '')
    .replace(/\s+-\s+.*$/, '')
    .trim();

  const pilotKey = name => cleanPilotName(name)
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();

  const parseCount = value => Number(value.replace(/[^\d]/g, '')) || 0;

  async function loadRaceStats() {
    const pages = await Promise.all([
      ...raceFilesSeason1.map(file => ({ file, season: 1 })),
      ...raceFilesSeason2.map(file => ({ file, season: 2 }))
    ].map(async ({ file, season }) => {
      const response = await fetch(file);
      if (!response.ok) throw new Error(`Falha ao carregar ${file}: ${response.status}`);
      return { page: new DOMParser().parseFromString(await response.text(), 'text/html'), season };
    }));
    const pilots = new Set();
    let races = 0;
    let participations = 0;
    let laps = 0;

    pages.forEach(({ page, season }) => {
      let rows = [...page.querySelectorAll(season === 1 ? '.acc-table-row' : '#leaderboard .row.clickable')];
      if (season === 2) {
        const uniquePilots = new Map();
        rows.forEach(row => {
          const name = row.querySelector('.name')?.textContent.trim();
          if (!name) return;
          const key = pilotKey(name);
          const directSpans = [...row.children].filter(child => child.tagName === 'SPAN');
          const rowLaps = parseCount(directSpans[1]?.textContent.trim() || '');
          if (!uniquePilots.has(key) || rowLaps > uniquePilots.get(key).laps) uniquePilots.set(key, {row, laps: rowLaps});
        });
        rows = [...uniquePilots.values()].map(({row}) => row);
      }
      if (!rows.length) return;
      races++;
      rows.forEach(row => {
        const name = row.querySelector(season === 1 ? '.pilot-name' : '.name')?.textContent.trim();
        if (!name) return;
        pilots.add(pilotKey(name));
        participations++;
        const directSpans = [...row.children].filter(child => child.tagName === 'SPAN');
        laps += parseCount(directSpans[1]?.textContent.trim() || '');
      });
    });

    return { races, pilots: pilots.size, participations, laps };
  }

  function renderStats(stats) {
    const values = {
      races: stats.races,
      pilots: stats.pilots,
      participations: stats.participations,
      laps: stats.laps.toLocaleString('pt-BR')
    };
    document.querySelectorAll('[data-season-stat]').forEach(element => {
      const value = String(values[element.dataset.seasonStat] ?? '-');
      if (element.textContent !== value) element.textContent = value;
    });
    const statsSectionValues = {
      seasonRaces: stats.races,
      seasonPilots: stats.pilots,
      seasonEntries: stats.participations,
      seasonLaps: stats.laps.toLocaleString('pt-BR')
    };
    Object.entries(statsSectionValues).forEach(([id, value]) => {
      const element = document.getElementById(id);
      if (element) element.textContent = value;
    });
  }

  const statsPromise = loadRaceStats();
  statsPromise.then(stats => {
    renderStats(stats);
    new MutationObserver(() => renderStats(stats)).observe(document.body, {
      childList: true,
      subtree: true
    });
  }).catch(error => {
    document.querySelectorAll('[data-season-stat]').forEach(element => {
      element.textContent = '-';
    });
    console.error('Não foi possível calcular as estatísticas da temporada.', error);
  });
})();
