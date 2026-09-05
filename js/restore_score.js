/*
 * ============================================================
 * PRZYWRACANIE ZAPISANEJ RUNDY
 * ============================================================
 *
 * Kontrakt przejść:
 *
 * - runda częściowa   -> SHOOTING,
 * - runda zakończona  -> ROUND_OPERATIONS przez finishRound(),
 * - odrzucenie API    -> JUDGE_MENU,
 * - błąd techniczny   -> JUDGE_MENU.
 *
 * Widocznością głównych widoków zarządza wyłącznie setAppState().
 */

let restoreScorePending = false;


async function restoreScore(filename) {

  if (
    typeof getAppState !== 'function' ||
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    showStatus(
      'Nie można ustalić stanu aplikacji.',
      'error'
    );

    return false;
  }

  const currentState = getAppState();

  if (
    currentState !== APP_STATES.JUDGE_MENU &&
    currentState !== APP_STATES.ROUND_OPERATIONS
  ) {

    showStatus(
      'Przywracanie rundy jest dostępne wyłącznie z MENU SĘDZIEGO.',
      'warn'
    );

    return false;
  }

  if (
    typeof filename !== 'string' ||
    filename.trim() === ''
  ) {

    setAppState(APP_STATES.JUDGE_MENU);

    showStatus(
      'Brak nazwy pliku.',
      'error'
    );

    return false;
  }

  if (restoreScorePending) {

    showStatus(
      'Przywracanie rundy już trwa.',
      'warn'
    );

    return false;
  }

  if (typeof scoreState === 'undefined') {

    setAppState(APP_STATES.JUDGE_MENU);

    showStatus(
      'Brak aktywnego stanu wyników.',
      'error'
    );

    return false;
  }

  restoreScorePending = true;
  scoreState.locked = true;

  showStatus(
    'Przywracanie rundy...',
    'warn'
  );

  try {

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'restore_score',
        filename: filename.trim()
      })
    });

    const result = await response.json();

    if (!response.ok || !result.success) {

      scoreState.locked = false;
      setAppState(APP_STATES.JUDGE_MENU);

      showStatus(
        result.message ||
          'Nie udało się przywrócić rundy.',
        'warn'
      );

      return false;
    }

    if (result.maxShot !== undefined) {

      const returnedMaxShot = Number(result.maxShot);

      if (
        !Number.isInteger(returnedMaxShot) ||
        returnedMaxShot < 1
      ) {

        throw new Error(
          'Serwer zwrócił nieprawidłową liczbę strzałów.'
        );
      }

      scoreState.maxShot = returnedMaxShot;
    }

    if (result.roundFinished === true) {

      if (typeof finishRound !== 'function') {

        throw new Error(
          'Brak funkcji finishRound().'
        );
      }

      /* Zakończona runda nie może przyjmować kolejnych strzałów. */
      scoreState.locked = true;

      if (!finishRound()) {

        throw new Error(
          'Nie udało się otworzyć widoku zakończonej rundy.'
        );
      }

      const finishMessage =
        document.getElementById('finishMessage');

      if (finishMessage) {

        finishMessage.textContent =
          'Przywrócona runda jest kompletna.';
      }

      showStatus(
        'Przywrócono zakończoną rundę.',
        'ok'
      );

      return true;
    }

    if (
      typeof result.shooterIndex !== 'number' ||
      typeof result.shotNumber !== 'number' ||
      !result.shooter
    ) {

      throw new Error(
        'Serwer zwrócił niepełny stan przywracanej rundy.'
      );
    }

    if (typeof displayCurrentShooter !== 'function') {

      throw new Error(
        'Brak funkcji wyświetlającej zawodnika.'
      );
    }

    scoreState.shooterIndex = result.shooterIndex;
    scoreState.shotNumber = result.shotNumber;
    scoreState.locked = false;

    displayCurrentShooter(result.shooter);

    if (!setAppState(APP_STATES.SHOOTING)) {

      throw new Error(
        'Nie udało się wrócić do widoku strzelania.'
      );
    }

    showStatus(
      'Runda przywrócona.',
      'ok'
    );

    return true;

  } catch (error) {

    console.error(
      'Błąd restoreScore():',
      error
    );

    scoreState.locked = false;
    setAppState(APP_STATES.JUDGE_MENU);

    showStatus(
      error.message ||
        'Nie udało się przywrócić rundy.',
      'error'
    );

    return false;

  } finally {

    restoreScorePending = false;
  }
}
