/*
 * ============================================================
 * CENTRALNY STAN APLIKACJI I MENU SĘDZIEGO
 * ============================================================
 *
 * W aplikacji może być aktywny dokładnie jeden z pięciu stanów:
 *
 * 1. READY            — gotowość,
 * 2. JUDGE_MENU       — menu sędziego,
 * 3. NEW_ROUND        — formularz nowej rundy,
 * 4. SHOOTING         — strzelanie,
 * 5. ROUND_OPERATIONS — zakończenie rundy / operacje na rundzie.
 *
 * Tylko setAppState() zarządza widocznością głównych widoków.
 */

const APP_STATES = Object.freeze({
  READY: 'ready',
  JUDGE_MENU: 'judge-menu',
  NEW_ROUND: 'new-round',
  SHOOTING: 'shooting',
  ROUND_OPERATIONS: 'round-operations'
});

const APP_STATE_VALUES = Object.values(APP_STATES);

let appState = APP_STATES.READY;
let previousState = APP_STATES.READY;


/*
 * Zwraca stan zapisany w DOM, jeżeli jest częścią kontraktu.
 */
function getAppState() {

  const app = document.getElementById('app');
  const domState = app && app.dataset.state;

  if (APP_STATE_VALUES.includes(domState)) {

    appState = domState;
  }

  return appState;
}


/*
 * Ustawia jedyny aktywny stan aplikacji.
 *
 * Najpierw ukrywa wszystkie główne widoki, a następnie pokazuje
 * wyłącznie widok należący do wskazanego stanu.
 */
function setAppState(state) {

  if (!APP_STATE_VALUES.includes(state)) {

    console.error(
      `Nieznany stan aplikacji: ${state}`
    );

    return false;
  }

  const app = document.getElementById('app');

  if (!app) {

    console.error('Brak elementu app.');

    return false;
  }

  const menuOverlay =
    document.getElementById('menuOverlay');

  const setupOverlay =
    document.getElementById('setupOverlay');

  const roundFinish =
    document.getElementById('roundFinish');

  const buttons =
    document.getElementById('buttons');

  const restoreFileWindow =
    document.getElementById('restoreFileWindow');

  /* Ukrywamy wszystkie główne widoki. */
  if (menuOverlay) {

    menuOverlay.classList.remove('show');
  }

  if (setupOverlay) {

    setupOverlay.classList.remove('show');
  }

  if (roundFinish) {

    roundFinish.classList.remove('show');
  }

  if (
    restoreFileWindow &&
    state !== APP_STATES.ROUND_OPERATIONS
  ) {

    restoreFileWindow.remove();
  }

  if (buttons) {

    buttons.classList.remove('show-buttons');
  }

  /* Pokazujemy wyłącznie widok należący do nowego stanu. */
  switch (state) {

    case APP_STATES.JUDGE_MENU:

      if (!menuOverlay) {

        console.error('Brak elementu menuOverlay.');

        return false;
      }

      menuOverlay.classList.add('show');
      break;

    case APP_STATES.NEW_ROUND:

      if (!setupOverlay) {

        console.error('Brak elementu setupOverlay.');

        return false;
      }

      setupOverlay.classList.add('show');
      break;

    case APP_STATES.SHOOTING:

      if (buttons) {

        buttons.classList.add('show-buttons');
      }

      break;

    case APP_STATES.ROUND_OPERATIONS:

      /*
       * Dynamiczna lista przywracania również należy do tego stanu.
       * Ekran zakończenia pokazujemy tylko wtedy, gdy lista nie jest
       * aktualnie aktywna.
       */
      if (roundFinish && !restoreFileWindow) {

        roundFinish.classList.add('show');
      }

      break;

    case APP_STATES.READY:
    default:
      break;
  }

  app.dataset.state = state;
  appState = state;

  return true;
}


/*
 * ============================================================
 * OTWARCIE MENU SĘDZIEGO
 * ============================================================
 */
function openMenu() {

  const currentState = getAppState();

  /*
   * Zapamiętujemy stan, z którego otwarto menu. Ponowne wywołanie
   * openMenu() w menu nie może nadpisać prawidłowego powrotu.
   */
  if (currentState !== APP_STATES.JUDGE_MENU) {

    previousState = currentState;
  }

  if (!setAppState(APP_STATES.JUDGE_MENU)) {

    return;
  }

  if (typeof showStatus === 'function') {

    showStatus('', '');
  }
}


/*
 * ============================================================
 * ZAMKNIĘCIE MENU SĘDZIEGO
 * ============================================================
 */
function closeMenu(event) {

  /* Kliknięcie wewnątrz panelu nie zamyka menu. */
  if (
    event &&
    event.target !== event.currentTarget
  ) {

    return;
  }

  const returnState =
    APP_STATE_VALUES.includes(previousState) &&
    previousState !== APP_STATES.JUDGE_MENU
      ? previousState
      : APP_STATES.READY;

  setAppState(returnState);
}


/*
 * Synchronizujemy zmienne modułu z początkowym data-state.
 * Skrypt jest ładowany po znacznikach aplikacji, ale obsługujemy też
 * jego przyszłe przeniesienie do sekcji <head>.
 */
function initializeAppState() {

  const initialState = getAppState();

  previousState = initialState === APP_STATES.JUDGE_MENU
    ? APP_STATES.READY
    : initialState;

  setAppState(initialState);
}

if (document.readyState === 'loading') {

  document.addEventListener(
    'DOMContentLoaded',
    initializeAppState,
    { once: true }
  );

} else {

  initializeAppState();
}
