(function () {
  'use strict';

  var prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isFinePointer = window.matchMedia('(pointer: fine)').matches;

  /* Custom cursor — non-touch devices only, respects reduced motion */
  var dot = document.querySelector('.cursor-dot');
  var ring = document.querySelector('.cursor-ring');

  if (isFinePointer && !prefersReducedMotion && dot && ring) {
    document.body.classList.add('has-custom-cursor');

    window.addEventListener('mousemove', function (e) {
      var x = e.clientX + 'px';
      var y = e.clientY + 'px';
      dot.style.transform = 'translate(' + x + ', ' + y + ') translate(-50%, -50%)';
      ring.style.transform = 'translate(' + x + ', ' + y + ') translate(-50%, -50%)';
    });

    var interactiveEls = document.querySelectorAll('a, button, input, textarea, label');
    interactiveEls.forEach(function (el) {
      el.addEventListener('mouseenter', function () {
        ring.classList.add('cursor-active');
      });
      el.addEventListener('mouseleave', function () {
        ring.classList.remove('cursor-active');
      });
    });
  } else if (dot && ring) {
    dot.remove();
    ring.remove();
  }

  /* Contact form — static site, no backend: acknowledge locally */
  var form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var note = form.querySelector('.form-note');
      var nameField = form.querySelector('#name');
      var name = nameField ? nameField.value.trim() : '';

      if (!name) {
        if (note) note.textContent = 'Please add your name so we know who to confirm with.';
        return;
      }

      var firstName = name.split(' ')[0];
      if (note) {
        note.textContent = 'Thank you, ' + firstName + ' — we\'ll be in touch shortly to confirm your table.';
      }
      form.reset();
    });
  }
})();
