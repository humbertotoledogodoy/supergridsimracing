// Minimal interactions for static pre-rendered leaderboard
// Keep minimal static interactions for pre-rendered pages
(() => {
  // Delegate row clicks to toggle corresponding detail panel
  const toggleDetailForRow = row => {
    if (!row) return;
    const id = row.dataset.id;
    const detail = document.querySelector(`.detail[data-detail="${id}"]`);
    if (!detail) return;
    const open = detail.classList.toggle('open');
    detail.style.display = open ? '' : 'none';
  };

  // robust click handling: capture pointerdown early and also handle click bubble
  const delegatedHandler = e => {
    let node = e.target;
    // climb out of text nodes
    while (node && node.nodeType !== 1) node = node.parentNode;
    if (!node) return;
    const row = node.closest && node.closest('.row[data-id]');
    if (!row) return;
    toggleDetailForRow(row);
  };
  document.addEventListener('pointerdown', delegatedHandler, true);
  document.addEventListener('click', delegatedHandler);

  // attach direct handlers to existing rows (useful if some children stop propagation)
  document.querySelectorAll('.row[data-id]').forEach(r => {
    if (r.__acc_bound) return; r.__acc_bound = true; r.addEventListener('click', () => toggleDetailForRow(r));
  });

  // Search/filter for pre-rendered rows
  const search = document.getElementById('search');
  if (search) {
    // remove any existing inline assignment that may call render() and depend on missing state
    try { search.oninput = null } catch (e) {}
    const apply = () => {
      const q = search.value.trim().toLowerCase();
      document.querySelectorAll('.row[data-id]').forEach(row => {
        const nameEl = row.querySelector('.name');
        const txt = nameEl ? nameEl.textContent.toLowerCase() : '';
        const show = !q || txt.includes(q);
        row.style.display = show ? '' : 'none';
        const d = document.querySelector(`.detail[data-detail="${row.dataset.id}"]`);
        if (d) d.style.display = show ? (d.classList.contains('open') ? '' : 'none') : 'none';
      });
    };
    search.addEventListener('input', apply);
    // apply initial filter state
    apply();
  }

  // Reset button: clear search and close details
  const reset = document.getElementById('resetBtn');
  if (reset) {
    reset.addEventListener('click', () => {
      if (search) { search.value = ''; search.dispatchEvent(new Event('input')); }
      document.querySelectorAll('.detail.open').forEach(d => d.classList.remove('open'));
    });
  }
})();
