/* ==========================================================================
   Portfolio interactions – vanilla JavaScript, no dependencies.
   1 Mobile navigation   2 Project filters   3 Copy email   4 Contact form
   ========================================================================== */
(function () {
  'use strict';

  /* 1. Mobile navigation ---------------------------------------------------- */
  var toggle = document.querySelector('.menu-toggle');
  var nav = document.getElementById('site-nav');

  function setMenu(open) {
    if (!toggle || !nav) return;
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close main menu' : 'Open main menu');
    nav.classList.toggle('is-open', open);
  }

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      setMenu(toggle.getAttribute('aria-expanded') !== 'true');
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setMenu(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 901px)').addEventListener('change', function (e) {
      if (e.matches) setMenu(false);
    });
  }

  /* Toast helper (used by copy email) ---------------------------------------- */
  var toast = document.getElementById('toast');
  var toastTimer;
  function showToast(message) {
    if (!toast) return;
    toast.textContent = message;
    toast.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toast.classList.remove('is-visible'); }, 2200);
  }

  /* 2. Project filters ------------------------------------------------------- */
  var filterButtons = document.querySelectorAll('.filter-btn');
  var cards = document.querySelectorAll('.work-card');
  var status = document.getElementById('filter-status');

  filterButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var filter = btn.getAttribute('data-filter');
      var visible = 0;
      filterButtons.forEach(function (b) { b.setAttribute('aria-pressed', String(b === btn)); });
      cards.forEach(function (card) {
        var match = filter === 'all' || card.getAttribute('data-category') === filter;
        card.hidden = !match;
        if (match) visible += 1;
      });
      if (status) {
        status.textContent = 'Showing ' + visible + ' project' + (visible === 1 ? '' : 's') +
          (filter === 'all' ? '' : ' in ' + btn.textContent.trim());
      }
    });
  });

  /* 3. Copy email ------------------------------------------------------------- */
  document.querySelectorAll('[data-copy]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var text = btn.getAttribute('data-copy');
      var done = function () { showToast('Email address copied to clipboard'); };
      var fail = function () { showToast('Copy failed – please copy the address manually'); };
      if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text).then(done, fail);
      } else {
        // Fallback for file:// or non-secure contexts
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.setAttribute('readonly', '');
        ta.style.position = 'fixed';
        ta.style.opacity = '0';
        document.body.appendChild(ta);
        ta.select();
        try { document.execCommand('copy') ? done() : fail(); } catch (err) { fail(); }
        document.body.removeChild(ta);
      }
    });
  });

  /* 4. Contact form ------------------------------------------------------------ */
  var form = document.getElementById('contact-form');
  if (!form) return;

  var MAX = 800;
  var fields = {
    name: { el: form.elements['name'], msg: 'Enter your full name.' },
    email: { el: form.elements['email'], msg: 'Enter a valid email address, for example name@organization.com.' },
    subject: { el: form.elements['subject'], msg: 'Select an inquiry type.' },
    message: { el: form.elements['message'], msg: 'Write a message of at least 10 characters.' }
  };
  var counter = document.getElementById('message-count');
  var summary = document.getElementById('form-status');

  function isValid(key) {
    var v = fields[key].el.value.trim();
    if (key === 'email') return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v);
    if (key === 'message') return v.length >= 10;
    return v.length > 0;
  }

  function showError(key, show) {
    var f = fields[key];
    var err = document.getElementById(key + '-error');
    f.el.setAttribute('aria-invalid', show ? 'true' : 'false');
    if (err) {
      err.classList.toggle('is-visible', show);
      err.querySelector('span').textContent = show ? f.msg : '';
    }
  }

  Object.keys(fields).forEach(function (key) {
    var el = fields[key].el;
    el.addEventListener('blur', function () { showError(key, !isValid(key)); });
    el.addEventListener('input', function () {
      if (el.getAttribute('aria-invalid') === 'true' && isValid(key)) showError(key, false);
      if (key === 'message' && counter) counter.textContent = el.value.length + ' / ' + MAX;
    });
  });

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    summary.classList.remove('is-visible');
    var firstInvalid = null;
    Object.keys(fields).forEach(function (key) {
      var ok = isValid(key);
      showError(key, !ok);
      if (!ok && !firstInvalid) firstInvalid = fields[key].el;
    });
    if (firstInvalid) { firstInvalid.focus(); return; }

    var SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzszqFdniWarAgQMtmao2V6mj1zl1FqSJsm1x94FxXBhX0uxBmTJx7xFOLh2z7sfFdr/exec';

    var submitButton = form.querySelector('button[type="submit"]');

    submitButton.disabled = true;
    submitButton.textContent = 'Sending...';

    var formData = new URLSearchParams();
    Object.keys(fields).forEach(function (key) {
      formData.append(key, fields[key].el.value.trim());
    });

    fetch(SCRIPT_URL, {
      method: 'POST',
      mode: 'no-cors',
      body: formData
    })
      .then(function () {
        summary.textContent =
          'Message submitted! ';
        summary.classList.add('is-visible');
        summary.focus();

        form.reset();
        if (counter) counter.textContent = '0 / ' + MAX;
      })
      .catch(function () {
        summary.textContent =
          'Could not submit the message. Please try again.';
        summary.classList.add('is-visible');
        summary.focus();
      })
      .finally(function () {
        submitButton.disabled = false;
        submitButton.textContent = 'Send Message →';
      });
    if (counter) counter.textContent = '0 / ' + MAX;
  });
})();
