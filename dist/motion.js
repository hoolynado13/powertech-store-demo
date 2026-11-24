(() => {
  const preference = matchMedia('(prefers-reduced-motion: reduce)');
  if (!('IntersectionObserver' in window)) return;
  const observer = new IntersectionObserver(entries => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      observer.unobserve(entry.target);
      if (preference.matches) continue;
      entry.target.animate([
        { opacity: .55, translate: '0 18px' },
        { opacity: 1, translate: '0 0' }
      ], { duration: 480, easing: 'cubic-bezier(.16,.72,.28,1)' });
    }
  }, { threshold: .06 });
  document.querySelectorAll('.showroom-grid > section,.workshop-heading,.footer-columns').forEach(section => observer.observe(section));
})();
