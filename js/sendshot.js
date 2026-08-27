/*
 * ============================================================
 * SEND SHOT
 * ============================================================
 *
 * Zapisywanie wyniku pojedynczego strzału.
 *
 * Funkcja:
 *
 *   sendShot(result)
 *
 * result:
 *
 *   hit
 *   miss
 *
 * Mechanizm:
 *
 *   - blokada natychmiast po kliknięciu,
 *   - przyciski są wyłączane,
 *   - wynik jest wysyłany do API,
 *   - po zapisaniu przechodzimy do następnego strzału,
 *   - chroni przed podwójnym kliknięciem.
 *
 * Dodatkowo:
 *
 *   scoreState.locked
 *
 * może być ustawione przez file_list.js podczas
 * przywracania rundy.
 *
 * ============================================================
 */


/*
 * ============================================================
 * WYSŁANIE STRZAŁU
 * ============================================================
 */

async function sendShot(result) {


  /*
   * ==========================================================
   * BLOKADA
   * ==========================================================
   *
   * To musi być pierwszy warunek.
   *
   * Dzięki temu kliknięcie ekranu w czasie przywracania
   * rundy NIE zapisze wyniku.
   */

  if (
    typeof scoreState !== 'undefined' &&
    scoreState.locked === true
  ) {

    return;
  }


  /*
   * Sprawdzamy poprawność wyniku.
   */

  if (
    result !== 'hit' &&
    result !== 'miss'
  ) {

    console.error(
      'Nieprawidłowy wynik strzału:',
      result
    );

    return;
  }


  /*
   * Sprawdzamy stan rundy.
   */

  if (
    typeof scoreState === 'undefined'
  ) {

    console.error(
      'Brak scoreState.'
    );

    return;
  }


  /*
   * ==========================================================
   * NATYCHMIASTOWA BLOKADA
   * ==========================================================
   *
   * Ustawiamy ją PRZED fetch().
   *
   * Dzięki temu dwa szybkie kliknięcia nie spowodują
   * dwóch zapisów.
   */

  scoreState.locked =
    true;


  /*
   * Pobieramy przyciski.
   */

  const hitBtn =
    document.getElementById(
      'hitBtn'
    );

  const missBtn =
    document.getElementById(
      'missBtn'
    );


  /*
   * Wyłączamy oba przyciski.
   */

  if (hitBtn) {

    hitBtn.disabled =
      true;
  }


  if (missBtn) {

    missBtn.disabled =
      true;
  }


  /*
   * ==========================================================
   * POKAZANIE WYNIKU
   * ==========================================================
   */

  const resultText =
    result === 'hit'
      ? 'TRAFIONY'
      : 'PUDŁO';


  showStatus(
    resultText,
    'warn'
  );


  /*
   * Wartość zapisywana w API:
   *
   * TRAFIONY = 1
   * PUDŁO    = 0
   */

  const value =
    result === 'hit'
      ? 1
      : 0;


  /*
   * Zapamiętujemy aktualną pozycję.
   *
   * Jest to ważne, ponieważ po odpowiedzi API
   * scoreState może zostać zmieniony.
   */

  const shooterNumber =
    scoreState.shooterIndex + 1;


  const shotNumber =
    scoreState.shotNumber;


  /*
   * ==========================================================
   * WYSŁANIE DO API
   * ==========================================================
   */

  try {

    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          action: 'score',

          shooterNumber:
            shooterNumber,

          shotNumber:
            shotNumber,

          value:
            value

        })

      });


    /*
     * Odczyt odpowiedzi.
     */

    const apiResult =
      await response.json();


    console.log(
      'score:',
      apiResult
    );


    /*
     * ========================================================
     * BŁĄD API
     * ========================================================
     */

    if (
      !response.ok ||
      !apiResult.success
    ) {

      showStatus(
        apiResult.message ||
        'Nie udało się zapisać wyniku.',
        'error'
      );


      /*
       * Odblokowujemy możliwość ponowienia
       * tylko w przypadku błędu.
       */

      scoreState.locked =
        false;


      if (hitBtn) {

        hitBtn.disabled =
          false;
      }


      if (missBtn) {

        missBtn.disabled =
          false;
      }


      return;
    }


    /*
     * ========================================================
     * RUNDA ZAKOŃCZONA
     * ========================================================
     */

    if (
      apiResult.roundFinished === true
    ) {


      /*
       * Przyciski pozostają zablokowane.
       */

      if (hitBtn) {

        hitBtn.disabled =
          true;
      }


      if (missBtn) {

        missBtn.disabled =
          true;
      }


      /*
       * Komunikat końcowy.
       */

      showStatus(
        'Runda kompletna.',
        'ok'
      );


      /*
       * Pokazujemy ekran zakończenia,
       * jeżeli istnieje.
       */

      const roundFinish =
        document.getElementById(
          'roundFinish'
        );


      const finishMessage =
        document.getElementById(
          'finishMessage'
        );


      if (finishMessage) {

        finishMessage.textContent =
          'Wszystkie wyniki zostały zapisane.';
      }


      if (roundFinish) {

        roundFinish.classList.add(
          'show'
        );
      }


      return;
    }


    /*
     * ========================================================
     * NASTĘPNY STRZAŁ
     * ========================================================
     */

    if (
      typeof apiResult.nextShooterIndex === 'number'
    ) {

      scoreState.shooterIndex =
        apiResult.nextShooterIndex;
    }


    if (
      typeof apiResult.nextShotNumber === 'number'
    ) {

      scoreState.shotNumber =
        apiResult.nextShotNumber;
    }


    /*
     * ========================================================
     * WYŚWIETLENIE NASTĘPNEGO ZAWODNIKA
     * ========================================================
     */

    if (
      apiResult.nextShooter &&
      typeof displayCurrentShooter === 'function'
    ) {

      displayCurrentShooter(
        apiResult.nextShooter
      );
    }


    /*
     * ========================================================
     * KRÓTKA BLOKADA PO STRZALE
     * ========================================================
     *
     * 2 sekundy.
     *
     * W tym czasie nie można kliknąć ponownie.
     */

    await sleep(2000);


    /*
     * Usuwamy komunikat TRAFIONY/PUDŁO.
     */

    showStatus(
      '',
      ''
    );


    /*
     * Odblokowujemy przyciski.
     */

    scoreState.locked =
      false;


    if (hitBtn) {

      hitBtn.disabled =
        false;
    }


    if (missBtn) {

      missBtn.disabled =
        false;
    }


  } catch (error) {

    console.error(
      'Błąd sendShot():',
      error
    );


    /*
     * Pokazujemy błąd.
     */

    showStatus(
      error.message ||
      'Błąd połączenia z API.',
      'error'
    );


    /*
     * Odblokowujemy możliwość ponowienia.
     */

    scoreState.locked =
      false;


    if (hitBtn) {

      hitBtn.disabled =
        false;
    }


    if (missBtn) {

      missBtn.disabled =
        false;
    }

  }

}