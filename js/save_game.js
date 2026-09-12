/*
 * ============================================================
 * ZAPIS RUNDY
 * ============================================================
 *
 * Kontrakt przejścia:
 *
 * - funkcję można uruchomić wyłącznie w JUDGE_MENU,
 * - anulowanie, błędna nazwa lub błąd pozostawiają JUDGE_MENU,
 * - poprawny zapis zamyka menu i wraca do stanu zapamiętanego
 *   przez menu.js: READY, SHOOTING albo ROUND_OPERATIONS.
 *
 * Informacje o operacji są wyświetlane przez wspólną funkcję
 * showOperationMessage() z common.js.
 */

let saveGamePending = false;


function createDefaultRoundName() {

  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');

  return `Runda_${year}${month}${day}_${hours}${minutes}${seconds}`;
}


async function saveGame() {

  if (
    typeof getAppState !== 'function' ||
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined' ||
    typeof closeMenu !== 'function' ||
    typeof showOperationMessage !== 'function'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    showOperationMessage(
      'Nie można ustalić stanu aplikacji.',
      'error'
    );

    return false;
  }

  if (getAppState() !== APP_STATES.JUDGE_MENU) {

    showOperationMessage(
      'Zapis rundy jest dostępny wyłącznie w MENU SĘDZIEGO.',
      'warn'
    );

    return false;
  }

  if (
    typeof scoreState !== 'undefined' &&
    scoreState.locked
  ) {

    showOperationMessage(
      'Poczekaj na zakończenie zapisu strzału.',
      'warn'
    );

    return false;
  }

  if (saveGamePending) {

    showOperationMessage(
      'Zapisywanie rundy już trwa.',
      'warn'
    );

    return false;
  }

  const filename = window.prompt(
    'POD JAKĄ NAZWĄ ZAPISAĆ RUNDĘ?',
    createDefaultRoundName()
  );

  /* Anulowanie pozostawia użytkownika w MENU SĘDZIEGO. */
  if (filename === null) {

    return false;
  }

  const cleanName = filename.trim();

  if (cleanName === '') {

    showOperationMessage(
      'Brak nazwy pliku.',
      'error'
    );

    return false;
  }

  saveGamePending = true;

  const saveButton =
    document.querySelector('.menuAction.saveRound');

  if (saveButton) {

    saveButton.disabled = true;
  }

  showOperationMessage(
    'Zapisywanie rundy...',
    'warn',
    0
  );

  try {

    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        action: 'save_game',
        filename: cleanName
      })
    });

    const responseText = await response.text();
    let result;

    try {

      result = JSON.parse(responseText);

    } catch (error) {

      console.error(
        'Nieprawidłowa odpowiedź API:',
        responseText
      );

      throw new Error(
        'Serwer zwrócił nieprawidłową odpowiedź.'
      );
    }

    if (!response.ok || !result.success) {

      throw new Error(
        result.message ||
          'Nie udało się zapisać rundy.'
      );
    }

    const savedFilename =
      result.filename || `${cleanName}.json`;

    /*
     * closeMenu() wykorzystuje previousState z menu.js, dlatego po
     * sukcesie wracamy dokładnie do stanu, z którego otwarto menu.
     */
    closeMenu();

    showOperationMessage(
      `Runda została zapisana jako ${savedFilename}`,
      'ok'
    );

    console.log(
      'Runda została zapisana:',
      savedFilename
    );

    return true;

  } catch (error) {

    console.error(
      'Błąd saveGame():',
      error
    );

    /* Błąd zapisu nie zamyka MENU SĘDZIEGO. */
    setAppState(APP_STATES.JUDGE_MENU);

    showOperationMessage(
      error.message ||
        'Nie udało się zapisać rundy.',
      'error'
    );

    return false;

  } finally {

    saveGamePending = false;

    if (saveButton) {

      saveButton.disabled = false;
    }
  }
}
