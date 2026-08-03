(function () {
  'use strict';

  // Custom cursor — only on fine-pointer (mouse) devices.
  var isFinePointer = window.matchMedia && window.matchMedia('(pointer: fine)').matches;

  if (isFinePointer) {
    document.body.classList.add('has-fine-cursor');

    var dot = document.querySelector('.cursor-dot');
    var lastX = 0;
    var lastY = 0;

    document.addEventListener('mousemove', function (e) {
      lastX = e.clientX;
      lastY = e.clientY;
      dot.style.left = lastX + 'px';
      dot.style.top = lastY + 'px';
    });

    var interactiveSelector = 'a, button, input, textarea, label';

    document.addEventListener('mouseover', function (e) {
      if (e.target.closest(interactiveSelector)) {
        dot.classList.add('is-active');
      }
    });

    document.addEventListener('mouseout', function (e) {
      if (e.target.closest(interactiveSelector)) {
        dot.classList.remove('is-active');
      }
    });
  }

  // Contact form — no backend available; acknowledge the request locally.
  var form = document.getElementById('contact-form');
  var status = document.getElementById('form-status');

  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();

      var name = form.elements['name'].value.trim();

      if (status) {
        status.textContent = name
          ? 'Thanks, ' + name + ' — we\'ll be in touch shortly.'
          : 'Thanks — we\'ll be in touch shortly.';
      }

      form.reset();
    });
  }
})();
