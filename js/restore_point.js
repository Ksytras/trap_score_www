/*
 * ============================================================
 * COFNIĘCIE OSTATNIEGO STRZAŁU
 * ============================================================
 *
 * Kontrakt przejścia:
 *
 * - JUDGE_MENU / ROUND_OPERATIONS -> cofnięcie ostatniego strzału,
 * - zapis strzału w toku          -> bez zmiany stanu + ostrzeżenie,
 * - odrzucenie przez API          -> powrót do stanu wywołania,
 * - poprawne cofnięcie            -> aktualizacja scoreState + SHOOTING,
 * - błąd sieciowy                 -> powrót do stanu wywołania.
 *
 * Komunikaty tej operacji są wyświetlane na środku aplikacji:
 * ostrzeżenie — żółte, błąd — czerwony, potwierdzenie — zielone.
 */

let restorePointPending = false;


async function restorePoint() {

  if (
    typeof getAppState !== 'function' ||
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    showOperationMessage(
      'Nie można ustalić stanu aplikacji.',
      'error'
    );

    return;
  }

  const currentState = getAppState();

  if (
    currentState !== APP_STATES.JUDGE_MENU &&
    currentState !== APP_STATES.ROUND_OPERATIONS
  ) {

    showOperationMessage(
      'Cofnięcie strzału jest dostępne z MENU SĘDZIEGO lub po zakończeniu rundy.',
      'warn'
    );

    return;
  }

  /* Zapis bieżącego strzału musi zakończyć się przed cofnięciem. */
  if (
    typeof scoreState !== 'undefined' &&
    scoreState.locked
  ) {

    showOperationMessage(
      'Poczekaj na zakończenie zapisu strzału.',
      'warn'
    );

    return;
  }

  if (restorePointPending) {

    showOperationMessage(
      'Cofanie ostatniego strzału już trwa.',
      'warn'
    );

    return;
  }

  if (typeof scoreState === 'undefined') {

    showOperationMessage(
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

      /* Odrzucenie operacji zachowuje stan, z którego ją wywołano. */
      setAppState(currentState);

      showOperationMessage(
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

    /*
     * Wymuszamy aktywność także po zakończeniu przejścia stanu. Usuwa to
     * disabled oraz ewentualne pointer-events odziedziczone po blokadzie.
     */
    const hitButton = document.getElementById('hitBtn');
    const missButton = document.getElementById('missBtn');

    [hitButton, missButton].forEach(function(button) {

      if (!button) {

        return;
      }

      button.disabled = false;
      button.style.pointerEvents = 'auto';
      button.setAttribute('aria-disabled', 'false');
    });

    showOperationMessage(
      'Ostatni wynik został skasowany.',
      'ok'
    );

  } catch (error) {

    console.error(
      'Błąd restorePoint():',
      error
    );

    /* Błąd techniczny przywraca stan, z którego wywołano operację. */
    setAppState(currentState);

    showOperationMessage(
      error.message ||
        'Nie udało się cofnąć ostatniego strzału.',
      'error'
    );

  } finally {

    restorePointPending = false;
  }
}
