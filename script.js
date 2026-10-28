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
