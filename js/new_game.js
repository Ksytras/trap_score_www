/*
 * ============================================================
 * NEW_GAME.JS
 * Obsługa funkcji NOWA RUNDA
 * ============================================================
 */


/*
 * ============================================================
 * OTWARCIE NOWEJ RUNDY
 * ============================================================
 */

function newGame() {

  const overlay =
    document.getElementById('setupOverlay');

  const countInput =
    document.getElementById('shooterCount');


  if (!overlay || !countInput) {

    console.error(
      'Brak elementów formularza NOWA RUNDA.'
    );

    return;
  }


  /*
   * Zamykamy MENU SĘDZIEGO.
   */
  const menuOverlay =
    document.getElementById('menuOverlay');

  if (menuOverlay) {

    menuOverlay.classList.remove(
      'show'
    );
  }


  /*
   * Domyślnie jeden zawodnik.
   */
  countInput.value = 1;


  /*
   * Tworzymy formularz zawodnika.
   */
  refreshShooterForm(true);


  /*
   * Otwieramy formularz NOWA RUNDA.
   */
  overlay.classList.add(
    'show'
  );
}


/*
 * ============================================================
 * ZAMKNIĘCIE FORMULARZA NOWEJ RUNDY
 * ============================================================
 */

function closeSetup(event) {

  /*
   * Kliknięcie wewnątrz panelu
   * nie zamyka formularza.
   */
  if (
    event &&
    event.target !== event.currentTarget
  ) {

    return;
  }


  const overlay =
    document.getElementById('setupOverlay');


  if (overlay) {

    overlay.classList.remove(
      'show'
    );
  }
}


/*
 * ============================================================
 * GENEROWANIE LISTY ZAWODNIKÓW
 * ============================================================
 */

function refreshShooterForm(
  forceNormalize
) {

  const countInput =
    document.getElementById('shooterCount');

  const setupList =
    document.getElementById('setupList');


  if (!countInput || !setupList) {

    return;
  }


  let count =
    parseInt(
      countInput.value,
      10
    );


  /*
   * Jeżeli pole jest puste lub
   * zawiera nieprawidłową wartość.
   */
  if (isNaN(count)) {

    count = 1;
  }


  /*
   * Minimum 1 zawodnik.
   */
  if (count < 1) {

    count = 1;
  }


  /*
   * Maksimum 200 zawodników.
   */
  if (count > 200) {

    count = 200;
  }


  /*
   * Przy wymuszeniu normalizacji
   * wpisujemy poprawioną wartość
   * z powrotem do pola.
   */
  if (forceNormalize) {

    countInput.value =
      count;
  }


  /*
   * Zapamiętujemy wcześniej wpisane dane.
   *
   * Dzięki temu zmiana liczby zawodników
   * nie kasuje danych już wpisanych.
   */
  const oldData = [];


  setupList
    .querySelectorAll(
      '.setupShooterRow'
    )
    .forEach(
      row => {

        const number =
          parseInt(
            row.dataset.shooterNumber,
            10
          );


        const nameInput =
          row.querySelector(
            '.shooterNameInput'
          );


        const clubInput =
          row.querySelector(
            '.clubNameInput'
          );


        oldData.push({

          shooterNumber:
            number,

          shooterName:
            nameInput
              ? nameInput.value
              : '',

          clubName:
            clubInput
              ? clubInput.value
              : ''
        });
      }
    );


  /*
   * Czyścimy listę.
   */
  setupList.innerHTML = '';


  /*
   * Tworzymy formularze kolejnych zawodników.
   */
  for (
    let i = 1;
    i <= count;
    i++
  ) {


    /*
     * Szukamy wcześniej wpisanych danych.
     */
    const previous =
      oldData.find(
        item =>
          item.shooterNumber === i
      );


    let shooterName =
      previous
        ? previous.shooterName
        : '';


    let clubName =
      previous
        ? previous.clubName
        : '';


    /*
     * Tworzymy wiersz zawodnika.
     */
    const row =
      document.createElement(
        'div'
      );


    row.className =
      'setupShooterRow';


    row.dataset.shooterNumber =
      i;


    /*
     * Tworzymy HTML formularza.
     *
     * Nazwa zawodnika może być pusta.
     * W takim przypadku przy zapisie
     * zostanie automatycznie użyty numer.
     */
    row.innerHTML = `

      <div class="setupShooterHeader">
        ZAWODNIK ${i}
      </div>

      <div class="field">

        <label for="shooterName_${i}">
          Nazwa zawodnika
        </label>

        <input
          id="shooterName_${i}"
          class="shooterNameInput"
          type="text"
          maxlength="100"
          autocomplete="off"
          placeholder="${i}"
          value="${escapeHtmlAttribute(shooterName)}"
        >

      </div>


      <div class="field">

        <label for="clubName_${i}">
          Klub
        </label>

        <input
          id="clubName_${i}"
          class="clubNameInput"
          type="text"
          maxlength="100"
          autocomplete="off"
          placeholder="Klub"
          value="${escapeHtmlAttribute(clubName)}"
        >

      </div>
    `;


    setupList.appendChild(
      row
    );
  }
}


/*
 * ============================================================
 * BEZPIECZNE KODOWANIE WARTOŚCI HTML
 * ============================================================
 */

function escapeHtmlAttribute(value) {

  return String(
    value ?? ''
  )
  .replace(
    /&/g,
    '&amp;'
  )
  .replace(
    /"/g,
    '&quot;'
  )
  .replace(
    /</g,
    '&lt;'
  )
  .replace(
    />/g,
    '&gt;'
  );
}


/*
 * ============================================================
 * ZMIANA LICZBY ZAWODNIKÓW
 * ============================================================
 *
 * delta:
 *
 * +1 = dodaj zawodnika
 * -1 = usuń zawodnika
 */

function changeShooterCount(
  delta
) {

  const input =
    document.getElementById(
      'shooterCount'
    );


  if (!input) {

    return;
  }


  let value =
    parseInt(
      input.value,
      10
    );


  if (isNaN(value)) {

    value = 1;
  }


  value += delta;


  /*
   * Ograniczenia.
   */
  if (value < 1) {

    value = 1;
  }


  if (value > 200) {

    value = 200;
  }


  input.value =
    value;


  /*
   * Natychmiast przebudowujemy formularz.
   */
  refreshShooterForm(
    true
  );
}


/*
 * ============================================================
 * ZAPIS NOWEJ RUNDY
 * ============================================================
 */

async function saveNewRoundWithShooters() {

  const countInput =
    document.getElementById(
      'shooterCount'
    );

  const setupList =
    document.getElementById(
      'setupList'
    );


  if (
    !countInput ||
    !setupList
  ) {

    console.error(
      'Brak formularza NOWA RUNDA.'
    );

    return;
  }


  let count =
    parseInt(
      countInput.value,
      10
    );


  /*
   * Walidacja liczby zawodników.
   */
  if (
    isNaN(count) ||
    count < 1 ||
    count > 200
  ) {

    showStatus(
      'Liczba zawodników musi być od 1 do 200.',
      'error'
    );

    countInput.focus();

    return;
  }


  /*
   * ==========================================================
   * ZABEZPIECZENIE
   * ==========================================================
   *
   * Przed utworzeniem nowego wyniki.json
   * pytamy użytkownika o potwierdzenie.
   */

  const confirmed =
    window.confirm(
      'Czy na pewno rozpocząć NOWĄ RUNDĘ i nadpisać obecną listę zawodników?'
    );


  if (!confirmed) {

    return;
  }


  /*
   * Zbieramy zawodników.
   */
  const shooters = [];


  for (
    let i = 1;
    i <= count;
    i++
  ) {


    const row =
      setupList.querySelector(
        `.setupShooterRow[data-shooter-number="${i}"]`
      );


    if (!row) {

      showStatus(
        `Brak danych zawodnika ${i}.`,
        'error'
      );

      return;
    }


    const nameInput =
      row.querySelector(
        '.shooterNameInput'
      );


    const clubInput =
      row.querySelector(
        '.clubNameInput'
      );


    if (
      !nameInput ||
      !clubInput
    ) {

      showStatus(
        `Nieprawidłowy formularz zawodnika ${i}.`,
        'error'
      );

      return;
    }


    /*
     * Pobieramy nazwę zawodnika.
     */
    let shooterName =
      nameInput.value.trim();


    /*
     * Jeżeli nazwa jest pusta,
     * używamy numeru zawodnika.
     *
     * Zawodnik 1 -> "1"
     * Zawodnik 2 -> "2"
     * itd.
     */
    if (
      shooterName === ''
    ) {

      shooterName =
        String(i);
    }


    /*
     * Klub może być pusty.
     */
    const clubName =
      clubInput.value.trim();


    shooters.push({

      shooterNumber:
        i,

      shooterName:
        shooterName,

      clubName:
        clubName
    });
  }


  /*
   * ==========================================================
   * ZABEZPIECZENIE PRZED PODWÓJNYM KLIKNIĘCIEM
   * ==========================================================
   */

  const saveButton =
    document.querySelector(
      '.setupAction.save'
    );


  if (saveButton) {

    saveButton.disabled =
      true;
  }


  /*
   * Czyścimy poprzedni komunikat.
   */
  if (
    typeof clearStatus ===
    'function'
  ) {

    clearStatus();
  }


  showStatus(
    'Tworzenie nowej rundy...',
    'warn'
  );


  try {


    /*
     * ========================================================
     * WYWOŁANIE API
     * ========================================================
     */

    const response =
      await fetch(
        API_URL,
        {

          method: 'POST',

          headers: {
            'Content-Type':
              'application/json'
          },

          body:
            JSON.stringify({

              action:
                'new_game',

              shooters:
                shooters
            })
        }
      );


    /*
     * Pobieramy odpowiedź jako tekst,
     * żeby móc obsłużyć również błędną odpowiedź PHP.
     */
    const responseText =
      await response.text();


    let result;


    try {

      result =
        JSON.parse(
          responseText
        );

    } catch (jsonError) {

      console.error(
        'Nieprawidłowa odpowiedź API:',
        responseText
      );


      throw new Error(
        'Serwer zwrócił nieprawidłową odpowiedź.'
      );
    }


    /*
     * Sprawdzamy odpowiedź serwera.
     */
    if (
      !response.ok ||
      !result.success
    ) {

      throw new Error(
        result.message ||
        'Nie udało się utworzyć nowej rundy.'
      );
    }


    /*
     * ========================================================
     * SUKCES
     * ========================================================
     */

    showStatus(
      'Nowa runda została utworzona.',
      'ok'
    );


    /*
     * Zamykamy formularz.
     */
    const overlay =
      document.getElementById(
        'setupOverlay'
      );


    if (overlay) {

      overlay.classList.remove(
        'show'
      );
    }


    /*
     * Uruchamiamy SCORE.
     */
    if (
      typeof score ===
      'function'
    ) {

      await score();

    } else {

      console.error(
        'Brak funkcji score().'
      );
    }


  } catch (error) {


    console.error(
      'Błąd podczas tworzenia nowej rundy:',
      error
    );


    showStatus(
      error.message ||
      'Wystąpił błąd podczas tworzenia rundy.',
      'error'
    );


  } finally {


    /*
     * Ponownie włączamy przycisk.
     */
    if (saveButton) {

      saveButton.disabled =
        false;
    }
  }
}


/*
 * ============================================================
 * ODŚWIEŻ LISTĘ
 * ============================================================
 *
 * Nazwa funkcji pozostaje taka sama,
 * ponieważ jest już używana przez GUI.
 *
 * Nie korzystamy z Google Sheets.
 */

function reloadShooterFormFromSheet() {

  refreshShooterForm(
    true
  );
}