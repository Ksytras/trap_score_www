/*
 * ============================================================
 * COFNIĘCIE OSTATNIEGO STRZAŁU
 * ============================================================
 *
 * Kontrakt przejścia:
 *
 * - zapis strzału w toku -> bez zmiany stanu + ostrzeżenie,
 * - odrzucenie przez API -> JUDGE_MENU + ostrzeżenie,
 * - poprawne cofnięcie   -> aktualizacja scoreState + SHOOTING,
 * - błąd sieciowy        -> JUDGE_MENU + błąd.
 *
 * Komunikaty tej operacji są wyświetlane na środku aplikacji:
 * ostrzeżenie — żółte, błąd — czerwony, potwierdzenie — zielone.
 */

let restorePointPending = false;
let restorePointMessageTimer = null;


/*
 * Wyświetla nieblokujący komunikat operacji na środku aplikacji.
 */
function showRestorePointMessage(message, type) {

  const app = document.getElementById('app');

  if (!app) {

    console.error('Brak elementu app.');
    return;
  }

  let messageElement =
    document.getElementById('restorePointMessage');

  if (!messageElement) {

    messageElement = document.createElement('div');
    messageElement.id = 'restorePointMessage';
    messageElement.setAttribute('role', 'status');
    messageElement.setAttribute('aria-live', 'polite');

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
      fontSize: 'clamp(20px, 5vw, 30px)',
      fontWeight: '900',
      lineHeight: '1.35',
      textAlign: 'center',
      pointerEvents: 'none'
    });

    app.appendChild(messageElement);
  }

  const colors = {
    ok: '#7CFC00',
    warn: '#ffd966',
    error: '#ff5c5c'
  };

  messageElement.style.color =
    colors[type] || colors.ok;

  messageElement.setAttribute(
    'role',
    type === 'error' ? 'alert' : 'status'
  );

  messageElement.textContent = message;

  if (restorePointMessageTimer !== null) {

    clearTimeout(restorePointMessageTimer);
  }

  restorePointMessageTimer = setTimeout(
    function() {

      messageElement.remove();
      restorePointMessageTimer = null;
    },
    3500
  );
}


async function restorePoint() {

    return;
  }

  /* Zapis bieżącego strzału musi zakończyć się przed cofnięciem. */
  if (
    typeof getAppState !== 'function' ||
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    showRestorePointMessage(
      'Nie można ustalić stanu aplikacji.',
      'error'
    );

    return;
  }

  const currentState = getAppState();

  if (currentState !== APP_STATES.JUDGE_MENU) {

    showRestorePointMessage(
      'Cofnięcie strzału jest dostępne wyłącznie w MENU SĘDZIEGO.',
      'warn'
    );

    return;
  }

  /* Zapis bieżącego strzału musi zakończyć się przed cofnięciem. */
  if (
    typeof scoreState !== 'undefined' &&
    scoreState.locked
  ) {

    showRestorePointMessage(
      'Poczekaj na zakończenie zapisu strzału.',
      'warn'
    );

    return;
  }

  if (restorePointPending) {

    showRestorePointMessage(
      'Cofanie ostatniego strzału już trwa.',
      'warn'
    );

    return;
  }

  if (typeof scoreState === 'undefined') {

    showRestorePointMessage(
      'Brak aktywnego stanu rundy.',
      'error'
    );

    return;
  }

  restorePointPending = true;

  try {

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'restore_point'
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {

      /* Odrzucenie operacji nie zamyka MENU SĘDZIEGO. */
      setAppState(APP_STATES.JUDGE_MENU);

      showRestorePointMessage(
        result.message ||
          'Nie można cofnąć ostatniego strzału.',
        'warn'
      );

      return;
    }

    if (
      typeof result.shooterIndex !== 'number' ||
      typeof result.shotNumber !== 'number' ||
      !result.shooter
    ) {

      throw new Error(
        'Serwer zwrócił niepełny stan cofniętego strzału.'
      );
    }

    scoreState.shooterIndex = result.shooterIndex;
    scoreState.shotNumber = result.shotNumber;
    scoreState.locked = false;

    if (typeof displayCurrentShooter !== 'function') {

      throw new Error(
        'Brak funkcji wyświetlającej zawodnika.'
      );
    }

    displayCurrentShooter(result.shooter);

    if (!setAppState(APP_STATES.SHOOTING)) {

      throw new Error(
        'Nie udało się wrócić do widoku strzelania.'
      );
    }

    showRestorePointMessage(
      'Ostatni wynik został skasowany.',
      'ok'
    );

  } catch (error) {

    console.error(
      'Błąd restorePoint():',
      error
    );

    /* Błąd techniczny pozostawia użytkownika w MENU SĘDZIEGO. */
    setAppState(APP_STATES.JUDGE_MENU);

    showRestorePointMessage(
      error.message ||
        'Nie udało się cofnąć ostatniego strzału.',
      'error'
    );

  } finally {

    restorePointPending = false;
  }
}
