/*
 * ============================================================
 * RESTORE SCORE
 * ============================================================
 *
 * Przywracanie rundy z wybranego pliku:
 *
 *   /wyniki/
 *
 * Funkcja:
 *
 *   restoreScore(filename)
 *
 * ============================================================
 */

async function restoreScore(filename) {

  /*
   * Sprawdzamy nazwę pliku.
   */

  if (!filename) {

    showStatus(
      'Brak nazwy pliku.',
      'error'
    );

    return;
  }


  try {

    /*
     * Informacja dla sędziego.
     */

    showStatus(
      'Przywracanie rundy...',
      'warn'
    );


    /*
     * Wysyłamy żądanie do API.
     */

    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          action: 'restore_score',

          filename: filename

        })

      });


    /*
     * Odczytujemy odpowiedź API.
     */

    const result =
      await response.json();


    console.log(
      'restore_score:',
      result
    );


    /*
     * Błąd HTTP lub błąd API.
     */

    if (
      !response.ok ||
      !result.success
    ) {

      showStatus(
        result.message ||
        'Nie udało się przywrócić rundy.',
        'error'
      );

      return;
    }


    /*
     * ========================================================
     * AKTUALIZACJA STANU RUNDY
     * ========================================================
     */

    if (
      typeof scoreState !== 'undefined'
    ) {

      /*
       * Runda częściowa.
       *
       * API zwraca miejsce pierwszego
       * brakującego wyniku.
       */

      if (
        typeof result.shooterIndex === 'number'
      ) {

        scoreState.shooterIndex =
          result.shooterIndex;
      }


      if (
        typeof result.shotNumber === 'number'
      ) {

        scoreState.shotNumber =
          result.shotNumber;
      }


      scoreState.locked = false;
    }


    /*
     * ========================================================
     * RUNDA PEŁNA
     * ========================================================
     */

    if (
      result.roundFinished === true
    ) {

      /*
       * Nie pokazujemy przycisków strzałów,
       * ponieważ nie ma już wolnego miejsca.
       */

      const buttons =
        document.getElementById('buttons');

      if (buttons) {

        buttons.style.display =
          'none';
      }


      /*
       * Czyścimy dane zawodnika.
       */

      const name =
        document.getElementById('name');

      const club =
        document.getElementById('club');

      const shot =
        document.getElementById('shot');

      if (name) {
        name.textContent = '';
      }

      if (club) {
        club.textContent = '';
      }

      if (shot) {
        shot.textContent = '';
      }


      /*
       * Runda jest kompletna.
       */

      showStatus(
        'Runda kompletna.',
        'ok'
      );


      return;
    }


    /*
     * ========================================================
     * RUNDA CZĘŚCIOWA
     * ========================================================
     */

    /*
     * Wyświetlamy zawodnika,
     * którego kolej przypada jako następna.
     */

    if (
      result.shooter &&
      typeof displayCurrentShooter === 'function'
    ) {

      displayCurrentShooter(
        result.shooter
      );
    }


    /*
     * Pokazujemy przyciski
     * TRAFIONY / PUDŁO.
     */

    const buttons =
      document.getElementById('buttons');

    if (buttons) {

      buttons.style.display =
        'grid';
    }


    /*
     * Informacja po przywróceniu.
     *
     * Zostanie wyczyszczona przy oddaniu
     * następnego strzału.
     */

    showStatus(
      'Runda przywrócona.',
      'ok'
    );


  } catch (error) {

    console.error(
      'Błąd restoreScore():',
      error
    );


    showStatus(
      error.message ||
      'Nie udało się przywrócić rundy.',
      'error'
    );
  }
}