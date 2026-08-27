/*
 * ============================================================
 * RESTORE POINT - COFNIĘCIE OSTATNIEGO STRZAŁU
 * ============================================================
 *
 * Funkcja:
 *
 *   restorePoint()
 *
 * Działanie:
 *
 *   1. Sędzia naciska "COFNIJ OSTATNI STRZAŁ"
 *   2. JavaScript pyta PHP o cofnięcie ostatniego wyniku
 *   3. PHP ustawia odpowiedni element shots[] na null
 *   4. PHP zwraca poprzedni stan strzelania
 *   5. Wracamy do właściwego zawodnika i numeru strzału
 *
 * Jeżeli nie ma jeszcze żadnych wyników:
 *
 *   "Cofnięcie niemożliwe - brak wyników"
 *
 * ============================================================
 */


async function restorePoint() {

  /*
   * Najpierw zamykamy MENU SĘDZIEGO.
   */

  const menuOverlay =
    document.getElementById('menuOverlay');

  if (menuOverlay) {

    menuOverlay.classList.remove('show');

  }


  /*
   * Zabezpieczenie:
   * jeżeli trwa blokada po oddanym strzale,
   * nie pozwalamy cofać wyniku.
   */

  if (
    typeof scoreState !== 'undefined' &&
    scoreState.locked
  ) {

    showStatus(
      'Poczekaj na zakończenie zapisu strzału.',
      'warn'
    );

    return;

  }


  /*
   * Wysyłamy żądanie do PHP.
   */

  try {

    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          action: 'restore_point'

        })

      });


    /*
     * Odczytujemy odpowiedź.
     */

    const result =
      await response.json();


    /*
     * Sprawdzamy poprawność odpowiedzi.
     */

    if (
      !response.ok ||
      !result.success
    ) {

      /*
       * Brak wyników nie jest błędem technicznym.
       * Wyświetlamy komunikat zwrócony przez PHP.
       */

      showStatus(

        result.message ||
        'Nie można cofnąć ostatniego strzału.',

        'warn'

      );

      return;

    }


    /*
     * ========================================================
     * COFNIĘCIE POWIODŁO SIĘ
     * ========================================================
     */

    /*
     * Ustawiamy stan score na cofnięty strzał.
     */

    if (
      typeof scoreState !== 'undefined'
    ) {

      scoreState.shooterIndex =
        result.shooterIndex;

      scoreState.shotNumber =
        result.shotNumber;

      scoreState.locked =
        false;

    }


    /*
     * Pokazujemy ponownie przyciski TRAFIONY / PUDŁO.
     */

    const buttons =
      document.getElementById('buttons');

    if (buttons) {

      buttons.style.display =
        'grid';

    }


    /*
     * Wyświetlamy zawodnika,
     * którego strzał został cofnięty.
     */

    if (
      result.shooter
    ) {

      displayCurrentShooter(
        result.shooter
      );

    }


    /*
     * Komunikat zielony.
     */

    showStatus(
      'Ostatni wynik został skasowany.',
      'ok'
    );


  } catch (error) {

    console.error(
      'Błąd restorePoint():',
      error
    );


    showStatus(

      error.message ||
      'Nie udało się cofnąć ostatniego strzału.',

      'error'

    );

  }

}