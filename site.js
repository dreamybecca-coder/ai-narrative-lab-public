(() => {
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const systems = [...document.querySelectorAll('[data-tabs]')].map(root => {
    const buttons = [...root.querySelectorAll(':scope > [role="tablist"] > [role="tab"]')];
    const panels = buttons.map(button => document.getElementById(button.getAttribute('aria-controls')));
    const activate = index => buttons.forEach((button, i) => {
      button.setAttribute('aria-selected', String(i === index));
      button.tabIndex = i === index ? 0 : -1;
      panels[i].hidden = i !== index;
    });
    buttons.forEach((button, index) => {
      button.addEventListener('click', () => activate(index));
      button.addEventListener('keydown', event => {
        let next;
        if (event.key === 'ArrowRight') next = (index + 1) % buttons.length;
        if (event.key === 'ArrowLeft') next = (index + buttons.length - 1) % buttons.length;
        if (event.key === 'Home') next = 0;
        if (event.key === 'End') next = buttons.length - 1;
        if (next !== undefined) { event.preventDefault(); activate(next); buttons[next].focus(); }
      });
    });
    activate(0);
    return {panels, activate};
  });
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('site-nav');
  function setMenu(open) {
    menu.setAttribute('aria-expanded', String(open));
    menu.setAttribute('aria-label', open ? '关闭导航' : '打开导航');
    nav.classList.toggle('is-open', open);
  }
  menu?.addEventListener('click', () => setMenu(menu.getAttribute('aria-expanded') !== 'true'));
  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { setMenu(false); menu.focus(); }
  });
  document.addEventListener('click', event => {
    if (menu && !menu.contains(event.target) && !nav.contains(event.target)) setMenu(false);
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', () => setMenu(false)));
  matchMedia('(min-width: 801px)').addEventListener('change', event => { if(event.matches && menu) setMenu(false); });
  function revealHash() {
    let id; try { id = decodeURIComponent(location.hash.slice(1)); } catch { return; }
    const target = document.getElementById(id);
    if (!target) return;
    systems.forEach(system => {
      const index = system.panels.findIndex(panel => panel === target || panel.contains(target));
      if (index >= 0) system.activate(index);
    });
    for (let node = target; node; node = node.parentElement) if (node instanceof HTMLDetailsElement) node.open = true;
    requestAnimationFrame(() => target.scrollIntoView({behavior: reduced.matches ? 'instant' : 'smooth', block:'start'}));
  }
  addEventListener('hashchange', revealHash);
  document.querySelectorAll('a[href*="#"]').forEach(a => a.addEventListener('click', () => {
    const destination = new URL(a.href);
    if(destination.pathname === location.pathname && destination.hash === location.hash) revealHash();
  }));
  if (location.hash) revealHash();
  const header = document.querySelector('.site-header');
  const top = document.querySelector('.to-top');
  let scheduled = false;
  function updateScroll() { header?.classList.toggle('scrolled', scrollY > 12); if(top)top.hidden = scrollY < 700; scheduled = false; }
  addEventListener('scroll', () => { if(!scheduled){scheduled = true; requestAnimationFrame(updateScroll);} }, {passive:true});
  updateScroll();
  top?.addEventListener('click', () => { scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'}); document.querySelector('.brand')?.focus({preventScroll:true}); });
  document.querySelector('[data-copy-brief]')?.addEventListener('click', async event => {
    const text = '交流提纲\n称呼：\n公司与行业：\n企业规模：\n职位：\n联系方式：\n当前遇到的问题和具体例子：\n希望改善的结果：\n时间、资料或系统方面的限制（如有）：';
    const container = event.currentTarget.parentElement;
    const status = container.querySelector('.copy-status');
    try {
      if(!navigator.clipboard?.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(text);
      status.textContent = '已复制，请粘贴到邮件正文中填写。';
    } catch {
      let area = container.querySelector('textarea');
      if(!area) { area = document.createElement('textarea'); area.className = 'copy-fallback'; area.readOnly = true; area.setAttribute('aria-label','交流提纲，可手动复制'); container.append(area); }
      area.value = text; area.focus(); area.select();
      status.textContent = '浏览器未开放剪贴板权限，请手动复制下面的提纲。';
    }
  });
})();
