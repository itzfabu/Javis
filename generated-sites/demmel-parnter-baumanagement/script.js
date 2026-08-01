(function () {
  'use strict';

  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  var navToggle = document.getElementById('navToggle');
  var mainNav = document.getElementById('mainNav');
  if (navToggle && mainNav) {
    navToggle.addEventListener('click', function () {
      var isOpen = mainNav.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });
    mainNav.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mainNav.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  var form = document.getElementById('contactForm');
  var status = document.getElementById('formStatus');
  if (form && status) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var name = form.name.value.trim();
      var email = form.email.value.trim();
      var message = form.message.value.trim();

      if (!name || !email || !message) {
        status.textContent = 'Bitte füllen Sie alle Felder aus.';
        return;
      }
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailPattern.test(email)) {
        status.textContent = 'Bitte geben Sie eine gültige E-Mail-Adresse ein.';
        return;
      }

      status.textContent = 'Vielen Dank, ' + name + '. Ihre Nachricht wurde übermittelt.';
      form.reset();
    });
  }

  var revealTargets = document.querySelectorAll(
    '.card, .news-item, .job-card, .discipline-list li, .trust-item'
  );
  revealTargets.forEach(function (el) {
    el.classList.add('reveal');
  });

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible');
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15 }
    );
    revealTargets.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    revealTargets.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }
})();
