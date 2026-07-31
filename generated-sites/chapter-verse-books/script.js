(function () {
  'use strict';

  // Progressive-enhancement scroll reveal for below-the-fold sections only.
  var revealTargets = document.querySelectorAll(
    '.about, .picks, .events, .testimonial, .signup'
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
    // No IntersectionObserver support: just show everything.
    revealTargets.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  // Minimal client-side handling for the seat-reservation signup form.
  var form = document.getElementById('signup-form');
  var note = document.getElementById('form-note');

  if (form && note) {
    form.addEventListener('submit', function (event) {
      event.preventDefault();

      var emailInput = document.getElementById('email');
      var email = emailInput.value.trim();
      var emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

      if (!emailPattern.test(email)) {
        note.textContent = 'Please enter a valid email address.';
        note.className = 'form-note error';
        emailInput.focus();
        return;
      }

      note.textContent = "You're on the list — see you at Story Night!";
      note.className = 'form-note success';
      form.reset();
    });
  }
})();
