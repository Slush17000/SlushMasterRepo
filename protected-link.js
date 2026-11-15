// Password-gated links: the target URL is AES-GCM encrypted (key derived from the password via PBKDF2),
// so it never appears in the page source and can only be recovered with the correct password.
(function () {
  if (window.__protectedLinksReady) return;
  window.__protectedLinksReady = true;

  var PROMPT_TEXT = 'This project is on a need-to-know basis, please enter the password.';

  function fromBase64(s) {
    return Uint8Array.from(atob(s), function (ch) { return ch.charCodeAt(0); });
  }

  async function decryptUrl(link, password) {
    var subtle = window.crypto.subtle;
    var base = await subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
    var key = await subtle.deriveKey(
      { name: 'PBKDF2', salt: fromBase64(link.dataset.salt), iterations: 250000, hash: 'SHA-256' },
      base,
      { name: 'AES-GCM', length: 256 },
      false,
      ['decrypt']
    );
    var plain = await subtle.decrypt({ name: 'AES-GCM', iv: fromBase64(link.dataset.iv) }, key, fromBase64(link.dataset.ct));
    return new TextDecoder().decode(plain);
  }

  var dialog = document.createElement('dialog');
  dialog.className = 'password-dialog';
  dialog.innerHTML =
    '<form method="dialog" class="password-form" autocomplete="off">' +
    '<p class="password-text"></p>' +
    '<div class="password-field">' +
    '<input class="password-input" type="password" autocomplete="off" aria-label="Password" required>' +
    '<button type="button" class="password-toggle" aria-label="Show password" aria-pressed="false">' +
    '<svg class="eye-open" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>' +
    '<svg class="eye-closed" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" hidden><path d="M17.94 17.94A10.9 10.9 0 0 1 12 19C5 19 1 12 1 12a18.4 18.4 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.1 9.1 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><path d="M14.12 14.12a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>' +
    '</button></div>' +
    '<p class="password-error" role="alert" hidden>Incorrect password.</p>' +
    '<div class="password-actions">' +
    '<button type="button" class="password-cancel">Cancel</button>' +
    '<button type="submit" class="password-submit">Open</button>' +
    '</div></form>';
  dialog.querySelector('.password-text').textContent = PROMPT_TEXT;
  document.body.appendChild(dialog);

  var form = dialog.querySelector('form');
  var input = dialog.querySelector('.password-input');
  var error = dialog.querySelector('.password-error');
  var activeLink = null;

  var toggle = dialog.querySelector('.password-toggle');
  function setVisible(show) {
    input.type = show ? 'text' : 'password';
    toggle.setAttribute('aria-pressed', String(show));
    toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    toggle.querySelector('.eye-open').hidden = show;
    toggle.querySelector('.eye-closed').hidden = !show;
  }
  toggle.addEventListener('click', function () {
    setVisible(input.type === 'password');
    input.focus();
  });

  dialog.querySelector('.password-cancel').addEventListener('click', function () { dialog.close(); });
  input.addEventListener('input', function () { error.hidden = true; });

  form.addEventListener('submit', async function (event) {
    event.preventDefault();
    var link = activeLink;
    var password = input.value;

    // Open the tab synchronously so popup blockers treat it as part of the submit gesture.
    var tab = window.open('', '_blank');
    if (tab) tab.opener = null;
    try {
      var url = await decryptUrl(link, password);
      dialog.close();
      if (tab) tab.location.href = url;
      else window.location.href = url;
    } catch (err) {
      if (tab) tab.close();
      error.hidden = false;
      input.select();
    }
  });

  // Delegated so it keeps working after the site's soft page navigation swaps <main> without reloading scripts.
  document.addEventListener('click', function (event) {
    var link = event.target.closest && event.target.closest('a[data-protected]');
    if (!link) return;
    event.preventDefault();
    activeLink = link;
    input.value = '';
    setVisible(false);
    error.hidden = true;
    dialog.showModal();
    input.focus();
  });

  window.addEventListener('slush:pageleave', function () { if (dialog.open) dialog.close(); });
})();
