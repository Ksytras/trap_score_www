/*
 * ============================================================
 * DISPLAY CURRENT SHOOTER
 * ============================================================
 *
 * Wyświetla:
 *
 *   nazwę aktualnego zawodnika
 *   numer aktualnego strzału / MAX_SHOT
 *
 * Podczas strzelania NIE wyświetlamy clubName.
 *
 * MAX_SHOT pochodzi z PHP i znajduje się
 * w scoreState.maxShot.
 *
 * ============================================================
 */


function displayCurrentShooter(shooter) {

  /*
   * Brak danych zawodnika.
   */

  if (!shooter) {

    return;

  }


  /*
   * Elementy GUI.
   */

  const name =
    document.getElementById('name');


  const club =
    document.getElementById('club');


  const shot =
    document.getElementById('shot');


  /*
   * ============================================================
   * NAZWA ZAWODNIKA
   * ============================================================
   */

  if (name) {

    name.textContent =
      shooter.shooterName;

  }


  /*
   * ============================================================
   * KLUB
   * ============================================================
   *
   * Podczas score() klub nie jest wyświetlany.
   *
   * clubName nadal pozostaje w wyniki.json.
   */

  if (club) {

    club.textContent =
      '';

  }


  /*
   * ============================================================
   * NUMER STRZAŁU
   * ============================================================
   *
   * Przykład:
   *
   *   strzał 1/5
   *   strzał 2/5
   *
   * albo:
   *
   *   strzał 1/25
   *
   * MAX_SHOT pochodzi z PHP.
   */

  if (shot) {

    const maxShot =
      Number(scoreState.maxShot);


    /*
     * Prawidłowy MAX_SHOT.
     */

    if (
      Number.isInteger(maxShot) &&
      maxShot > 0
    ) {

      shot.textContent =
        `strzał ${scoreState.shotNumber}/${maxShot}`;

    } else {

      /*
       * Awaryjnie nie pokazujemy undefined.
       */

      shot.textContent =
        `strzał ${scoreState.shotNumber}`;

    }

  }

}