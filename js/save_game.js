/*
 * ============================================================
 * ZAPIS RUNDY
 * ============================================================
 *
 * Funkcja:
 *   saveGame()
 *
 * Pobiera aktualny plik wyniki.json z serwera
 * i zapisuje jego kopię w katalogu /wyniki/
 * pod wybraną nazwą.
 *
 * Domyślna nazwa:
 *
 *   Runda_RRRRMMDD_HHMMSS
 *
 * ============================================================
 */


function saveGame() {

  /*
   * Tworzymy domyślną nazwę pliku.
   *
   * Format:
   *
   * Runda_20260825_193015
   *
   * Bez rozszerzenia .json.
   */

  const now = new Date();

  const year =
    now.getFullYear();

  const month =
    String(now.getMonth() + 1).padStart(2, '0');

  const day =
    String(now.getDate()).padStart(2, '0');

  const hours =
    String(now.getHours()).padStart(2, '0');

  const minutes =
    String(now.getMinutes()).padStart(2, '0');

  const seconds =
    String(now.getSeconds()).padStart(2, '0');


  const defaultName =
    `Runda_${year}${month}${day}_${hours}${minutes}${seconds}`;


  /*
   * Pytamy użytkownika o nazwę zapisu.
   */

  const filename =
    window.prompt(
      'POD JAKĄ NAZWĄ ZAPISAĆ RUNDĘ?',
      defaultName
    );


  /*
   * Anulowanie okna.
   */

  if (filename === null) {
    return;
  }


  /*
   * Usuwamy białe znaki z początku i końca.
   */

  const cleanName =
    filename.trim();


  /*
   * Nie można zapisać pustej nazwy.
   */

  if (cleanName === '') {

    showStatus(
      'Brak nazwy pliku.',
      'error'
    );

    return;
  }


  /*
   * Przed wykonaniem nowej czynności
   * usuwamy poprzedni komunikat.
   */

  showStatus('', '');


  /*
   * Zabezpieczenie przed wielokrotnym
   * kliknięciem ZAPISZ RUNDĘ.
   */

  const saveButton =
    document.querySelector(
      '.menuAction.saveRound'
    );


  if (saveButton) {
    saveButton.disabled = true;
  }


  /*
   * Wysyłamy żądanie do PHP.
   */

  fetch(API_URL, {

    method: 'POST',

    headers: {
      'Content-Type': 'application/json'
    },

    body: JSON.stringify({

      action: 'save_game',

      filename: cleanName

    })

  })

  .then(async response => {

    /*
     * Odczytujemy odpowiedź jako tekst,
     * aby uniknąć błędu JSON przy ewentualnym
     * komunikacie PHP.
     */

    const text =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(text);

    } catch (error) {

      console.error(
        'Nieprawidłowa odpowiedź API:',
        text
      );

      throw new Error(
        'Serwer zwrócił nieprawidłową odpowiedź.'
      );
    }


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        'Nie udało się zapisać rundy.'
      );
    }


    return result;

  })


  .then(result => {

    /*
     * Udany zapis.
     *
     * PHP powinno zwrócić rzeczywistą nazwę
     * utworzonego pliku.
     */

    const savedFilename =
      result.filename ||
      `${cleanName}.json`;


    showStatus(
      `Runda została zapisana jako ${savedFilename}`,
      'ok'
    );


    console.log(
      'Runda została zapisana:',
      savedFilename
    );

  })


  .catch(error => {

    console.error(
      'Błąd saveGame():',
      error
    );


    showStatus(
      error.message ||
      'Nie udało się zapisać rundy.',
      'error'
    );

  })


  .finally(() => {

    /*
     * Ponownie włączamy przycisk.
     */

    if (saveButton) {
      saveButton.disabled = false;
    }

  });

}