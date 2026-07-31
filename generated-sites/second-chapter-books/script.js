(function () {
  'use strict';

  // Fade in below-the-fold sections as they enter the viewport.
  var fadeEls = document.querySelectorAll('.fade-in');

  if ('IntersectionObserver' in window && fadeEls.length) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, { threshold: 0.15 });

    fadeEls.forEach(function (el) {
      observer.observe(el);
    });
  } else {
    fadeEls.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Minimal signup form: no backend, just confirm locally.
  var form = document.getElementById('signup-form');
  var message = document.getElementById('signup-message');

  if (form) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();
      var email = document.getElementById('email').value.trim();
      var isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

      if (!isValid) {
        message.textContent = 'Please enter a valid email address.';
        message.style.color = '#8c3b3b';
        return;
      }

      message.textContent = 'You\'re on the list! Watch your inbox for weekly picks.';
      message.style.color = '#6b7a4f';
      form.reset();
    });
  }
})();
