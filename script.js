// Nav shadow on scroll
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 10);
});

// Scroll-fade-up
const fadeObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) {
      e.target.classList.add('visible');
      fadeObs.unobserve(e.target);
    }
  });
}, { threshold: 0.08 });
document.querySelectorAll('.fade-up').forEach(el => fadeObs.observe(el));

// Multi-figure carousel dots
document.querySelectorAll('.rc-fig-multi').forEach(fig => {
  const imgs = fig.querySelectorAll('.rc-fig-track img');
  const dots = fig.querySelectorAll('.rc-fig-dot');
  dots.forEach((dot, i) => {
    dot.addEventListener('click', (e) => {
      e.stopPropagation();
      imgs.forEach((img, j) => {
        if (i === j) img.setAttribute('data-active', 'true');
        else img.removeAttribute('data-active');
      });
      dots.forEach((d, j) => d.classList.toggle('is-active', i === j));
    });
  });
});

// Lightbox for figures (only pages with figures include the lightbox markup)
const lb = document.getElementById('lightbox');
if (lb) {
  const lbImg = document.getElementById('lb-img');
  const lbDl = document.getElementById('lb-download');
  const lbClose = document.getElementById('lb-close');
  const lbPrev = document.getElementById('lb-prev');
  const lbNext = document.getElementById('lb-next');
  let lbGroup = [];   // [{src, alt}]
  let lbIdx = 0;

  function showLbImg() {
    const f = lbGroup[lbIdx];
    lbImg.src = f.src;
    lbImg.alt = f.alt || '';
    lbDl.href = f.src;
    lbDl.download = f.src.split('/').pop();
    const multi = lbGroup.length > 1;
    lbPrev.style.display = multi ? '' : 'none';
    lbNext.style.display = multi ? '' : 'none';
  }
  function openLb(group, idx) {
    lbGroup = group;
    lbIdx = idx;
    showLbImg();
    lb.classList.add('open');
    document.body.style.overflow = 'hidden';
  }
  function closeLb() {
    lb.classList.remove('open');
    document.body.style.overflow = '';
  }
  function lbStep(delta) {
    if (lbGroup.length < 2) return;
    lbIdx = (lbIdx + delta + lbGroup.length) % lbGroup.length;
    showLbImg();
  }

  // Each rc-fig is a group of its imgs
  document.querySelectorAll('.rc-fig').forEach(fig => {
    const imgs = [...fig.querySelectorAll('img')];
    const group = imgs.map(i => ({ src: i.src, alt: i.alt }));
    imgs.forEach((img, i) => {
      img.addEventListener('click', () => openLb(group, i));
    });
  });
  lbClose.addEventListener('click', closeLb);
  lbPrev.addEventListener('click', (e) => { e.stopPropagation(); lbStep(-1); });
  lbNext.addEventListener('click', (e) => { e.stopPropagation(); lbStep(1); });
  lb.addEventListener('click', (e) => { if (e.target === lb) closeLb(); });
  document.addEventListener('keydown', (e) => {
    if (!lb.classList.contains('open')) return;
    if (e.key === 'Escape') closeLb();
    else if (e.key === 'ArrowLeft') lbStep(-1);
    else if (e.key === 'ArrowRight') lbStep(1);
  });
}

// Keep sticky offsets in sync with the nav height (the nav stacks into two rows on narrow screens)
function setNavHeight() {
  document.documentElement.style.setProperty('--nav-h', nav.offsetHeight + 'px');
}
setNavHeight();
window.addEventListener('resize', setNavHeight);

// News timeline: category filters and current-year highlight (only on pages with a timeline)
const timeline = document.querySelector('.tl');
if (timeline) {
  const filters = document.querySelectorAll('.tl-filter');
  const years = document.querySelectorAll('.tl-year');
  const jumps = document.querySelectorAll('.tl-jump');
  const empty = document.querySelector('.tl-empty');

  filters.forEach(btn => {
    btn.addEventListener('click', () => {
      const cat = btn.dataset.cat;
      filters.forEach(b => b.classList.toggle('is-active', b === btn));
      let shown = 0;
      years.forEach(year => {
        let yearShown = 0;
        year.querySelectorAll('.tl-item').forEach(item => {
          const match = cat === 'all' || item.dataset.cat === cat;
          item.hidden = !match;
          if (match) {
            yearShown++;
            item.querySelector('.tl-card').classList.add('visible');
          }
        });
        year.hidden = yearShown === 0;
        const jump = document.querySelector('.tl-jump[href="#' + year.id + '"]');
        jump.hidden = yearShown === 0;
        shown += yearShown;
      });
      empty.hidden = shown > 0;
    });
  });

  const yearObs = new IntersectionObserver(entries => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        jumps.forEach(j => j.classList.toggle('is-current', j.getAttribute('href') === '#' + e.target.id));
      }
    });
  }, { rootMargin: '-30% 0px -65% 0px' });
  years.forEach(y => yearObs.observe(y));
}

// News timeline: search, permalinks, and upcoming badges (only on pages with a timeline)
if (timeline) {
  const items = [...document.querySelectorAll('.tl-item')];
  const searchBox = document.querySelector('.tl-search');
  const emptyMsg = document.querySelector('.tl-empty');

  // Upcoming: entries with an exact future date get a badge until that day passes
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  items.forEach(item => {
    if (!item.dataset.when) return;
    const when = new Date(item.dataset.when + 'T00:00:00');
    if (when >= today) {
      item.classList.add('is-upcoming');
      const badge = document.createElement('span');
      badge.className = 'tl-upcoming';
      badge.textContent = 'Upcoming';
      item.querySelector('.tl-tag').after(badge);
    }
  });

  // Search: combine with the active category filter; matches every word typed
  function activeCategory() {
    return document.querySelector('.tl-filter.is-active').dataset.cat;
  }
  function applySearch() {
    const words = searchBox.value.toLowerCase().split(/\s+/).filter(Boolean);
    const cat = activeCategory();
    let shown = 0;
    document.querySelectorAll('.tl-year').forEach(year => {
      let yearShown = 0;
      year.querySelectorAll('.tl-item').forEach(item => {
        const text = item.textContent.toLowerCase();
        const match = (cat === 'all' || item.dataset.cat === cat) && words.every(w => text.includes(w));
        item.hidden = !match;
        if (match) {
          yearShown++;
          item.querySelector('.tl-card').classList.add('visible');
        }
      });
      year.hidden = yearShown === 0;
      document.querySelector('.tl-jump[href="#' + year.id + '"]').hidden = yearShown === 0;
      shown += yearShown;
    });
    emptyMsg.hidden = shown > 0;
  }
  searchBox.addEventListener('input', applySearch);
  document.querySelectorAll('.tl-filter').forEach(btn => btn.addEventListener('click', applySearch));

  // Permalinks: clicking "#" copies the entry's URL and updates the address bar
  document.querySelectorAll('.tl-permalink').forEach(a => {
    a.addEventListener('click', e => {
      e.preventDefault();
      const url = location.origin + location.pathname + a.getAttribute('href');
      history.replaceState(null, '', a.getAttribute('href'));
      navigator.clipboard.writeText(url).then(() => {
        a.classList.add('is-copied');
        setTimeout(() => a.classList.remove('is-copied'), 1500);
      });
    });
  });

  // Arriving from a shared link: reveal and highlight that entry
  if (location.hash) {
    const target = document.getElementById(location.hash.slice(1));
    if (target && target.classList.contains('tl-item')) {
      target.classList.add('is-target');
      target.querySelector('.tl-card').classList.add('visible');
      target.scrollIntoView({ block: 'center' });
    }
  }
}
