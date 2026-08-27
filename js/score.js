/*
 * ============================================================
 * SCORE - ZAPISYWANIE WYNIKÓW
 * ============================================================
 *
 * Funkcje:
 *
 *   score()
 *   sendShot()
 *   showShotFlash()
 *   hideShotFlash()
 *   finishRound()
 *   sleep()
 *
 * MAX_SHOT jest pobierany z PHP.
 *
 * ============================================================
 */


/*
 * ============================================================
 * STAN SCORE
 * ============================================================
 */

let scoreState = {

  shooterIndex: 0,

  shotNumber: 1,

  maxShot: 0,

  locked: false

};


/*
 * ============================================================
 * SCORE
 * ============================================================
 */

async function score() {

  /*
   * Zmieniamy nagłówek tylko podczas score().
   */

  const title =
    document.querySelector('.title');

  if (title) {

    title.textContent =
      'STRZELA';

  }


  try {

    /*
     * Pobieramy aktualny stan rundy.
     */

    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          action: 'get_score'

        })

      });


    const result =
      await response.json();


    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        'Nie udało się odczytać rundy.'
      );

    }


    /*
     * Sprawdzamy zawodników.
     */

    if (
      !Array.isArray(result.shooters) ||
      result.shooters.length === 0
    ) {

      throw new Error(
        'Plik wyniki.json nie zawiera zawodników.'
      );

    }


    /*
     * ========================================================
     * USTAWIENIE STANU
     * ========================================================
     *
     * WAŻNE:
     *
     * maxShot pobieramy z odpowiedzi PHP.
     *
     * JavaScript nie posiada własnej wartości MAX_SHOT.
     */

    scoreState.shooterIndex =
      result.shooterIndex;


    scoreState.shotNumber =
      result.shotNumber;


    scoreState.maxShot =
      Number(result.maxShot);


    scoreState.locked =
      false;


    /*
     * Kontrola poprawności maxShot.
     */

    if (
      !Number.isInteger(scoreState.maxShot) ||
      scoreState.maxShot < 1
    ) {

      throw new Error(
        'Nieprawidłowa wartość maxShot zwrócona przez PHP.'
      );

    }


    /*
     * Pokazujemy przyciski TRAFIONY / PUDŁO.
     */

    const buttons =
      document.getElementById('buttons');

    if (buttons) {

      buttons.style.display =
        'grid';

    }


    /*
     * Wyświetlamy aktualnego zawodnika.
     */

    displayCurrentShooter(

      result.shooters[
        scoreState.shooterIndex
      ]

    );


    /*
     * Usuwamy poprzedni komunikat statusu.
     */

    showStatus('', '');


  } catch (error) {

    console.error(
      'Błąd score():',
      error
    );


    showStatus(

      error.message ||
      'Nie udało się rozpocząć zapisywania wyników.',

      'error'

    );

  }

}


/*
 * ============================================================
 * STRZAŁ
 * ============================================================
 *
 * hit  = 1
 * miss = 0
 *
 * ============================================================
 */

async function sendShot(result) {

  /*
   * Jeżeli trwa blokada,
   * ignorujemy kolejne kliknięcie.
   */

  if (scoreState.locked) {

    return;

  }


  /*
   * Dopuszczalne wartości.
   */

  if (
    result !== 'hit' &&
    result !== 'miss'
  ) {

    return;

  }


  /*
   * Natychmiastowa blokada.
   */

  scoreState.locked =
    true;


  /*
   * Zapamiętujemy moment kliknięcia.
   */

  const shotStartTime =
    Date.now();


  /*
   * Przyciski.
   */

  const hitBtn =
    document.getElementById('hitBtn');


  const missBtn =
    document.getElementById('missBtn');


  if (hitBtn) {

    hitBtn.disabled =
      true;

  }


  if (missBtn) {

    missBtn.disabled =
      true;

  }


  /*
   * hit  -> 1
   * miss -> 0
   */

  const shotValue =
    result === 'hit'
      ? 1
      : 0;


  /*
   * Pokazujemy komunikat.
   */

  showShotFlash(result);


  try {

    /*
     * Zapis wyniku.
     */

    const response =
      await fetch(API_URL, {

        method: 'POST',

        headers: {
          'Content-Type': 'application/json'
        },

        body: JSON.stringify({

          action: 'score',

          shooterNumber:
            scoreState.shooterIndex + 1,

          shotNumber:
            scoreState.shotNumber,

          value:
            shotValue

        })

      });


    const apiResult =
      await response.json();


    if (
      !response.ok ||
      !apiResult.success
    ) {

      throw new Error(

        apiResult.message ||
        'Nie udało się zapisać wyniku.'

      );

    }


    /*
     * Obliczamy czas od kliknięcia.
     */

    const elapsed =
      Date.now() - shotStartTime;


    /*
     * Pozostały czas do pełnych 2 sekund.
     */

    const remainingTime =
      Math.max(
        0,
        2000 - elapsed
      );


    /*
     * Czekamy.
     */

    if (remainingTime > 0) {

      await sleep(
        remainingTime
      );

    }


    /*
     * Usuwamy TRAFIONY / PUDŁO.
     */

    hideShotFlash();


    /*
     * ========================================================
     * KONIEC RUNDY
     * ========================================================
     */

    if (
      apiResult.roundFinished
    ) {

      /*
       * Ustawiamy maxShot, jeżeli PHP zwróciło
       * tę wartość również przy zapisie.
       */

      if (
        apiResult.maxShot !== undefined
      ) {

        scoreState.maxShot =
          Number(apiResult.maxShot);

      }


      finishRound();

      return;

    }


    /*
     * ========================================================
     * NASTĘPNY STRZAŁ
     * ========================================================
     */

    scoreState.shooterIndex =
      apiResult.nextShooterIndex;


    scoreState.shotNumber =
      apiResult.nextShotNumber;


    /*
     * Jeżeli PHP zwróciło maxShot,
     * aktualizujemy stan.
     */

    if (
      apiResult.maxShot !== undefined
    ) {

      const returnedMaxShot =
        Number(apiResult.maxShot);


      if (
        Number.isInteger(returnedMaxShot) &&
        returnedMaxShot > 0
      ) {

        scoreState.maxShot =
          returnedMaxShot;

      }

    }


    /*
     * Wyświetlamy następnego zawodnika.
     */

    if (
      apiResult.nextShooter
    ) {

      displayCurrentShooter(
        apiResult.nextShooter
      );

    } else {

      /*
       * Awaryjnie pobieramy stan.
       */

      await score();

    }


  } catch (error) {

    console.error(
      'Błąd sendShot():',
      error
    );


    /*
     * Usuwamy komunikat wyniku.
     */

    hideShotFlash();


    showStatus(

      error.message ||
      'Nie udało się zapisać wyniku.',

      'error'

    );


  } finally {

    /*
     * Odblokowanie przycisków.
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


/*
 * ============================================================
 * KOMUNIKAT TRAFIONY / PUDŁO
 * ============================================================
 */

function showShotFlash(result) {

  const flash =
    document.getElementById('shotFlash');


  const flashText =
    document.getElementById('shotFlashText');


  if (
    !flash ||
    !flashText
  ) {

    return;

  }


  if (result === 'hit') {

    flashText.textContent =
      'TRAFIONY';

  } else {

    flashText.textContent =
      'PUDŁO';

  }


  flash.classList.add(
    'show'
  );

}


/*
 * ============================================================
 * UKRYCIE KOMUNIKATU
 * ============================================================
 */

function hideShotFlash() {

  const flash =
    document.getElementById('shotFlash');


  if (flash) {

    flash.classList.remove(
      'show'
    );

  }

}


/*
 * ============================================================
 * ZAKOŃCZENIE RUNDY
 * ============================================================
 */

function finishRound() {

  /*
   * Usuwamy TRAFIONY / PUDŁO.
   */

  hideShotFlash();


  /*
   * Ukrywamy przyciski.
   */

  const buttons =
    document.getElementById('buttons');


  if (buttons) {

    buttons.style.display =
      'none';

  }


  /*
   * Czyścimy informacje o zawodniku.
   *
   * Dzięki temu po zakończeniu rundy
   * nie zostaje:
   *
   * STRZELA
   * Jan
   * strzał 5/5
   */

  const name =
    document.getElementById('name');


  if (name) {

    name.textContent =
      '';

  }


  const club =
    document.getElementById('club');


  if (club) {

    club.textContent =
      '';

  }


  const shot =
    document.getElementById('shot');


  if (shot) {

    shot.textContent =
      '';

  }


  /*
   * Zmieniamy nagłówek.
   *
   * STRZELA nie powinno pozostać
   * po zakończeniu rundy.
   */

  const title =
    document.querySelector('.title');


  if (title) {

    title.textContent =
      'RUNDA ZAKOŃCZONA';

  }


  /*
   * Usuwamy dodatkowy komunikat.
   */

  const finishMessage =
    document.getElementById(
      'finishMessage'
    );


  if (finishMessage) {

    finishMessage.textContent =
      '';

  }


  /*
   * Aktualizujemy napis TRAP.
   *
   * Dzięki temu nie będzie na sztywno
   * TRAP 25, gdy MAX_SHOT = 5.
   */

  const finishSubtitle =
    document.querySelector(
      '.finishSubtitle'
    );


  if (finishSubtitle) {

    finishSubtitle.textContent =
      `TRAP ${scoreState.maxShot}`;

  }


  /*
   * Pokazujemy ekran zakończenia.
   */

  const roundFinish =
    document.getElementById(
      'roundFinish'
    );


  if (roundFinish) {

    roundFinish.classList.add(
      'show'
    );


    /*
     * Kliknięcie ekranu końcowego
     * otwiera MENU SĘDZIEGO.
     */

    roundFinish.onclick =
      function () {

        roundFinish.classList.remove(
          'show'
        );


        /*
         * MENU SĘDZIEGO.
         */

        openMenu();

      };

  }

}


/*
 * ============================================================
 * OPÓŹNIENIE
 * ============================================================
 */

function sleep(milliseconds) {

  return new Promise(

    resolve =>
      setTimeout(
        resolve,
        milliseconds
      )

  );

}