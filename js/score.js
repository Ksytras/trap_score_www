/*
 * ============================================================
 * SCORE — STAN STRZELANIA I ZAKOŃCZENIE RUNDY
 * ============================================================
 *
 * Funkcje:
 *
 *   score()
 *   showShotFlash()
 *   hideShotFlash()
 *   finishRound()
 *   sleep()
 *
 * Kontrakt przejść obsługiwanych przez ten moduł:
 *
 * NEW_ROUND / ROUND_OPERATIONS -> SHOOTING — poprawny odczyt rundy,
 * SHOOTING -> ROUND_OPERATIONS — zakończenie wszystkich strzałów.
 *
 * MAX_SHOT jest pobierany z PHP. Widocznością głównych widoków
 * zarządza wyłącznie setAppState() z menu.js.
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

  if (
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    throw new Error(
      'Brak centralnej obsługi stanu aplikacji.'
    );
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


    const title =
      document.querySelector('.title');

    if (title) {

      title.textContent =
        'STRZELA';
    }


    /* Wyświetlamy aktualnego zawodnika. */

    displayCurrentShooter(

      result.shooters[
        scoreState.shooterIndex
      ]

    );


    /*
     * Usuwamy poprzedni komunikat statusu.
     */

    showStatus('', '');


    if (!setAppState(APP_STATES.SHOOTING)) {

      throw new Error(
        'Nie udało się uruchomić widoku strzelania.'
      );
    }


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


    throw error;

  }

}


/*
 * Funkcja sendShot() znajduje się wyłącznie w sendshot.js.
 * Rozdzielenie odpowiedzialności zapobiega nadpisywaniu globalnej funkcji
 * zależnie od kolejności ładowania skryptów.
 */


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


  const roundFinish =
    document.getElementById(
      'roundFinish'
    );


  if (roundFinish) {
    /*
     * Kliknięcie ekranu końcowego
     * otwiera MENU SĘDZIEGO.
     */

    roundFinish.onclick =
      function () {
        openMenu();
      };
  }


  if (
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    return false;
  }


  return setAppState(
    APP_STATES.ROUND_OPERATIONS
  );

}
