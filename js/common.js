/*
 * ============================================================
 * FUNKCJE WSPÓLNE
 * ============================================================
 */


/*
 * ============================================================
 * WYŚWIETLANIE STATUSU
 * ============================================================
 */

function showStatus(message, type) {

  const status = document.getElementById('status');

  if (!status) {
    return;
  }

  status.className = 'status';

  if (type === 'ok') {
    status.classList.add('status-ok');
  }

  if (type === 'warn') {
    status.classList.add('status-warn');
  }

  if (type === 'error') {
    status.classList.add('status-error');
  }

  status.textContent = message;
}


/*
 * ============================================================
 * OPÓŹNIENIE
 * ============================================================
 */

function sleep(milliseconds) {

  return new Promise(
    resolve => setTimeout(
      resolve,
      milliseconds
    )
  );
}


/*
 * ============================================================
 * BEZPIECZNE KODOWANIE WARTOŚCI HTML
 * ============================================================
 */

function escapeHtmlAttribute(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
