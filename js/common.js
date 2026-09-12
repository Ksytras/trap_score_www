/*
 * ============================================================
 * FUNKCJE WSPÓLNE
 * ============================================================
 */

const STATUS_TYPES = Object.freeze({
  OK: 'ok',
  WARN: 'warn',
  ERROR: 'error'
});

const STATUS_TYPE_VALUES = Object.values(STATUS_TYPES);

let operationMessageTimer = null;


/*
 * Zwraca prawidłowy typ komunikatu. Pusty typ oznacza zwykły tekst.
 */
function normalizeStatusType(type) {

  if (type === '' || type === undefined || type === null) {

    return '';
  }

  if (STATUS_TYPE_VALUES.includes(type)) {

    return type;
  }

  console.warn(
    `Nieznany typ komunikatu: ${type}`
  );

  return '';
}


/*
 * Wyświetla komunikat w stałym polu statusu aplikacji.
 */
function showStatus(message, type) {

  const status = document.getElementById('status');

  if (!status) {

    console.error('Brak elementu status.');
    return false;
  }

  const normalizedType = normalizeStatusType(type);

  status.className = 'status';

  if (normalizedType !== '') {

    status.classList.add(
      `status-${normalizedType}`
    );
  }

  status.textContent = String(message ?? '');

  return true;
}


function clearStatus() {

  return showStatus('', '');
}


/*
 * Usuwa centralny, nieblokujący komunikat operacji.
 */
function clearOperationMessage() {

  if (operationMessageTimer !== null) {

    clearTimeout(operationMessageTimer);
    operationMessageTimer = null;
  }

  const messageElement =
    document.getElementById('operationMessage');

  if (messageElement) {

    messageElement.remove();
  }
}


/*
 * Wyświetla komunikat operacji na środku aplikacji.
 *
 * ok    — zielony,
 * warn  — żółty,
 * error — czerwony.
 */
function showOperationMessage(
  message,
  type,
  duration = 3500
) {

  const app = document.getElementById('app');

  if (!app) {

    console.error('Brak elementu app.');
    return false;
  }

  const normalizedType = normalizeStatusType(type);

  if (normalizedType === '') {

    console.error(
      'Komunikat operacji wymaga typu ok, warn lub error.'
    );

    return false;
  }

  clearOperationMessage();

  const messageElement = document.createElement('div');
  messageElement.id = 'operationMessage';
  messageElement.setAttribute(
    'role',
    normalizedType === STATUS_TYPES.ERROR
      ? 'alert'
      : 'status'
  );
  messageElement.setAttribute('aria-live', 'polite');
  messageElement.dataset.type = normalizedType;
  messageElement.textContent = String(message ?? '');

  const colors = {
    [STATUS_TYPES.OK]: '#7CFC00',
    [STATUS_TYPES.WARN]: '#ffd966',
    [STATUS_TYPES.ERROR]: '#ff5c5c'
  };

  Object.assign(messageElement.style, {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    zIndex: '70',
    width: 'min(90%, 560px)',
    padding: '22px 26px',
    borderRadius: '18px',
    background: 'rgba(18, 18, 18, .96)',
    boxShadow: '0 12px 36px rgba(0, 0, 0, .55)',
    color: colors[normalizedType],
    fontSize: 'clamp(20px, 5vw, 30px)',
    fontWeight: '900',
    lineHeight: '1.35',
    textAlign: 'center',
    pointerEvents: 'none'
  });

  app.appendChild(messageElement);

  const timeout = Number(duration);

  if (Number.isFinite(timeout) && timeout > 0) {

    operationMessageTimer = setTimeout(
      clearOperationMessage,
      timeout
    );
  }

  return true;
}


/*
 * Jedyna wspólna implementacja opóźnienia używana przez moduły aplikacji.
 */
function sleep(milliseconds) {

  const timeout = Number(milliseconds);

  return new Promise(
    resolve => setTimeout(
      resolve,
      Number.isFinite(timeout) && timeout > 0
        ? timeout
        : 0
    )
  );
}


/*
 * Bezpieczne kodowanie wartości umieszczanych w atrybutach HTML.
 */
function escapeHtmlAttribute(value) {

  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
