/*
 * ============================================================
 * MENU SĘDZIEGO
 * ============================================================
 *
 * Odpowiedzialność tego pliku:
 *
 * STAN 2 — MENU SĘDZIEGO
 *
 * Ten moduł:
 * - otwiera MENU SĘDZIEGO,
 * - zamyka MENU SĘDZIEGO,
 * - ustawia centralny stan aplikacji,
 * - pilnuje, aby NOWA RUNDA nie pozostawała jednocześnie otwarta.
 *
 * Nie obsługuje:
 * - formularza NOWEJ RUNDY,
 * - listy przywracania,
 * - cofania strzału,
 * - zapisywania rundy,
 * - logiki strzelania.
 */

/*
 * ============================================================
 * OTWARCIE MENU SĘDZIEGO
 * ============================================================
 */

function openMenu() {

  const app =
    document.getElementById('app');

  const menuOverlay =
    document.getElementById('menuOverlay');

  const setupOverlay =
    document.getElementById('setupOverlay');

  const roundFinish =
    document.getElementById('roundFinish');

  /*
   * Kontrola wymaganych elementów DOM.
   */

  if (!app || !menuOverlay) {

    console.error(
      'Brak elementu app lub menuOverlay.'
    );

    return;
  }

  /*
   * ------------------------------------------------------------
   * ZAMYKAMY INNE WARSTWY
   * ------------------------------------------------------------
   *
   * MENU SĘDZIEGO jest jedynym aktywnym panelem
   * w STANIE 2.
   *
   * Dzięki temu nie mogą jednocześnie pozostać otwarte:
   *
   * - NOWA RUNDA,
   * - RUNDA ZAKOŃCZONA.
   */

  if (setupOverlay) {

    setupOverlay.classList.remove('show');
  }

  if (roundFinish) {

    roundFinish.classList.remove('show');
  }


  /*
   * ------------------------------------------------------------
   * USTAWIAMY STAN APLIKACJI
   * ------------------------------------------------------------
   *
   * STAN 2 — MENU SĘDZIEGO
   */

  app.dataset.state = 'judge-menu';


  /*
   * Czyścimy poprzedni komunikat statusu.
   *
   * Sprawdzamy istnienie funkcji, ponieważ common.js
   * jest osobnym modułem.
   */

  if (typeof showStatus === 'function') {

    showStatus('', '');
  }


  /*
   * Otwieramy MENU SĘDZIEGO.
   */

  menuOverlay.classList.add('show');
}


/*
 * ============================================================
 * ZAMKNIĘCIE MENU SĘDZIEGO
 * ============================================================
 */

function closeMenu(event) {

  /*
   * Jeżeli funkcja została wywołana przez:
   *
   * onclick="closeMenu(event)"
   *
   * i kliknięto element znajdujący się wewnątrz panelu,
   * niczego nie zamykamy.
   */

  if (
    event &&
    event.target !== event.currentTarget
  ) {

    return;
  }


  const menuOverlay =
    document.getElementById('menuOverlay');

  const app =
    document.getElementById('app');


  /*
   * Zamykamy overlay MENU SĘDZIEGO.
   */

  if (menuOverlay) {

    menuOverlay.classList.remove('show');
  }


  /*
   * Po zamknięciu MENU SĘDZIEGO wracamy do
   * STANU 1 — GOTOWOŚĆ.
   *
   * Ważne:
   * tutaj nie ustawiamy stanu STRZELANIA ani
   * RUNDA ZAKOŃCZONA.
   *
   * Jeżeli w przyszłości zamknięcie menu będzie
   * wykonywane z innego stanu, odpowiedzialny za
   * ten stan moduł będzie musiał jawnie przywrócić
   * właściwy stan.
   */

  if (app) {

    app.dataset.state = 'ready';
  }
}
