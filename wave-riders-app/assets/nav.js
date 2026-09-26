const NAV_ITEMS = [
  { href: 'index.html', icon: '🏠', label: '홈' },
  { href: 'learn.html', icon: '🏄', label: '배우기' },
  { href: 'safety.html', icon: '🦺', label: '안전교육' },
  { href: 'schedule.html', icon: '📅', label: '일정' },
  { href: 'more.html', icon: '☰', label: '전체메뉴' },
];

function renderNav(activeHref) {
  const bottomnav = document.createElement('nav');
  bottomnav.className = 'bottomnav';
  bottomnav.innerHTML = NAV_ITEMS.map(item => `
    <a href="${item.href}" class="${item.href === activeHref ? 'active' : ''}">
      <span class="ic">${item.icon}</span>${item.label}
    </a>
  `).join('');
  document.body.appendChild(bottomnav);
}

function renderTopbar(title) {
  const topbar = document.createElement('div');
  topbar.className = 'topbar';
  topbar.innerHTML = `
    <div class="brand">🌊 목포해양대 윈드서핑 동아리<span>${title}</span></div>
  `;
  document.body.insertBefore(topbar, document.body.firstChild);
}

document.addEventListener('DOMContentLoaded', () => {
  const page = document.body.dataset.page || 'index.html';
  const title = document.body.dataset.title || '';
  renderTopbar(title);
  renderNav(page);
});
