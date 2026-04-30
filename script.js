// ── Sticky nav shadow ────────────────────────────────────────
const header = document.getElementById('siteHeader');
window.addEventListener('scroll', () => {
  header.classList.toggle('scrolled', window.scrollY > 10);
}, { passive: true });

// ── Mobile hamburger ─────────────────────────────────────────
const hamburger = document.getElementById('hamburger');
const navLinks  = document.querySelector('.nav-links');

hamburger.addEventListener('click', function() {
  var open = navLinks.classList.toggle('open');
  hamburger.classList.toggle('open', open);
  hamburger.setAttribute('aria-expanded', open);
});

// ── Dropdown toggles ─────────────────────────────────────────
document.querySelectorAll('.has-drop > a').forEach(function(trigger) {
  trigger.addEventListener('click', function(e) {
    e.preventDefault();
    var item    = trigger.parentElement;          // the .has-drop div
    var wasOpen = item.classList.contains('open');
    // Close every dropdown
    document.querySelectorAll('.has-drop').forEach(function(d) {
      d.classList.remove('open');
    });
    // Open this one if it was closed
    if (!wasOpen) {
      item.classList.add('open');
    }
  });
});

// ── Close dropdowns when clicking outside ────────────────────
document.addEventListener('click', function(e) {
  if (!e.target.closest('.has-drop')) {
    document.querySelectorAll('.has-drop').forEach(function(d) {
      d.classList.remove('open');
    });
  }
  if (!e.target.closest('.site-header')) {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
  }
});

// ── Close nav when a real link is tapped ─────────────────────
document.querySelectorAll('.dropdown a').forEach(function(a) {
  a.addEventListener('click', function() {
    navLinks.classList.remove('open');
    hamburger.classList.remove('open');
    document.querySelectorAll('.has-drop').forEach(function(d) {
      d.classList.remove('open');
    });
  });
});

// ── Serviced zip codes ────────────────────────────────────────
const VALID_ZIPS = new Set([
  '30004','30005','30011','30014','30017','30019','30024','30025',
  '30043','30045','30052','30054','30501','30504','30506','30507',
  '30511','30517','30518','30519','30527','30529','30530','30535',
  '30542','30543','30548','30549','30554','30558','30566','30567',
  '30601','30602','30603','30604','30605','30606','30607','30608',
  '30609','30612','30620','30621','30622','30628','30629','30630',
  '30633','30635','30641','30642','30646','30650','30655','30656',
  '30663','30666','30677','30680','30683',
]);

// ── Zip code quote form navigation ───────────────────────────
(function () {
  const inSubdir   = /\/(services|locations)\//.test(window.location.pathname);
  const quoteBase  = inSubdir ? '../quote.html'       : 'quote.html';
  const noAreaBase = inSubdir ? '../not-in-area.html' : 'not-in-area.html';

  document.querySelectorAll('.zip-input-group').forEach(function (group) {
    const input = group.querySelector('.zip-input');
    const btn   = group.querySelector('.btn');
    if (!input || !btn) return;

    function quoteHref() {
      const zip = input.value.trim();
      if (!zip) return quoteBase;
      const page = (zip.length === 5 && VALID_ZIPS.has(zip)) ? quoteBase : noAreaBase;
      return page + '?zip=' + encodeURIComponent(zip);
    }

    btn.setAttribute('href', quoteBase);

    input.addEventListener('input', function () {
      btn.setAttribute('href', quoteHref());
    });

    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') {
        e.preventDefault();
        window.location.href = quoteHref();
      }
    });
  });
}());

// ── Smooth scroll ─────────────────────────────────────────────
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', e => {
    const id = link.getAttribute('href');
    if (id === '#') return;
    const target = document.querySelector(id);
    if (target) {
      e.preventDefault();
      const offset = 76;
      window.scrollTo({ top: target.getBoundingClientRect().top + scrollY - offset, behavior: 'smooth' });
    }
  });
});

// ── FAQ accordion ─────────────────────────────────────────────
document.querySelectorAll('.faq-q').forEach(btn => {
  btn.addEventListener('click', () => {
    const expanded = btn.getAttribute('aria-expanded') === 'true';
    const answer   = btn.nextElementSibling;

    document.querySelectorAll('.faq-q').forEach(b => {
      b.setAttribute('aria-expanded', 'false');
      b.nextElementSibling.classList.remove('open');
    });

    if (!expanded) {
      btn.setAttribute('aria-expanded', 'true');
      answer.classList.add('open');
    }
  });
});

// ── Credential counter animation ──────────────────────────────
function animateCounter(el, target, duration = 1800) {
  const start = performance.now();
  const format = n => n.toLocaleString();

  function step(now) {
    const progress = Math.min((now - start) / duration, 1);
    const eased = 1 - Math.pow(1 - progress, 3); // ease-out cubic
    el.textContent = format(Math.round(target * eased));
    if (progress < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

const statsObserver = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-number').forEach(el => {
        animateCounter(el, parseInt(el.dataset.target, 10));
      });
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.3 });

const statsSection = document.querySelector('.credentials-section');
if (statsSection) statsObserver.observe(statsSection);
