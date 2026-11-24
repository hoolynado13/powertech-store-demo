(() => {
  const rows = document.getElementById('pair-table');
  if (!rows) return;
  const label = document.createElement('label');
  label.className = 'catalog-differences';
  const checkbox = document.createElement('input');
  checkbox.type = 'checkbox';
  label.append(checkbox, 'Показать только различия');
  rows.closest('table').before(label);

  function refresh() {
    for (const row of rows.rows) {
      const same = row.cells[1].textContent === row.cells[2].textContent;
      row.dataset.match = String(same);
      row.hidden = checkbox.checked && same;
    }
  }
  checkbox.addEventListener('change', refresh);
  new MutationObserver(refresh).observe(rows, { childList:true });
  refresh();
})();
