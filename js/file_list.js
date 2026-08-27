/*
 * ============================================================
 * FILE LIST
 * ============================================================
 *
 * Obsługa listy zapisanych rund z katalogu:
 *
 *   /wyniki/
 *
 * Funkcje:
 *
 *   getResultFiles()
 *   openRestoreFiles()
 *
 * Po wybraniu pliku:
 *
 *   - natychmiast blokujemy ekran,
 *   - zamykamy listę plików,
 *   - przez 1 sekundę nie można wprowadzić strzału,
 *   - dopiero potem wykonywane jest restoreScore().
 *
 * ============================================================
 */


/*
 * ============================================================
 * POBIERANIE LISTY PLIKÓW
 * ============================================================
 */

async function getResultFiles() {

  const response =
    await fetch(API_URL, {

      method: 'POST',

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        action: 'list_files'
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
      'Nie udało się pobrać listy plików.'
    );
  }


  if (
    !Array.isArray(result.files)
  ) {

    return [];
  }


  return result.files;
}


/*
 * ============================================================
 * OTWARCIE LISTY PLIKÓW
 * ============================================================
 */

async function openRestoreFiles() {

  try {

    showStatus('', '');


    /*
     * Pobieramy listę zapisanych rund.
     */

    const files =
      await getResultFiles();


    /*
     * Usuwamy poprzednie okno,
     * jeżeli jeszcze istnieje.
     */

    const oldWindow =
      document.getElementById(
        'restoreFileWindow'
      );


    if (oldWindow) {

      oldWindow.remove();
    }


    /*
     * Tworzymy główne okno.
     */

    const overlay =
      document.createElement('div');


    overlay.id =
      'restoreFileWindow';


    overlay.style.position =
      'absolute';

    overlay.style.inset =
      '0';

    overlay.style.zIndex =
      '60';

    overlay.style.background =
      'rgba(0,0,0,.88)';

    overlay.style.display =
      'flex';

    overlay.style.alignItems =
      'center';

    overlay.style.justifyContent =
      'center';

    overlay.style.padding =
      '20px';


    /*
     * Panel.
     */

    const panel =
      document.createElement('div');


    panel.style.width =
      '100%';

    panel.style.maxWidth =
      '600px';

    panel.style.maxHeight =
      '90vh';

    panel.style.overflowY =
      'auto';

    panel.style.background =
      '#1b1b1b';

    panel.style.borderRadius =
      '24px';

    panel.style.padding =
      '20px';


    /*
     * Tytuł.
     */

    const title =
      document.createElement('div');


    title.textContent =
      'WYBIERZ RUNDĘ';


    title.style.fontSize =
      '30px';

    title.style.fontWeight =
      '900';

    title.style.color =
      '#ffd966';

    title.style.marginBottom =
      '18px';


    panel.appendChild(title);


    /*
     * ========================================================
     * BRAK PLIKÓW
     * ========================================================
     */

    if (files.length === 0) {

      const empty =
        document.createElement('div');


      empty.textContent =
        'Brak zapisanych rund.';


      empty.style.fontSize =
        '20px';

      empty.style.color =
        '#ccc';

      empty.style.padding =
        '20px 0';


      panel.appendChild(empty);

    } else {


      /*
       * ======================================================
       * LISTA PLIKÓW
       * ======================================================
       */

      files.forEach(function(filename) {

        const button =
          document.createElement('button');


        button.type =
          'button';


        button.textContent =
          filename;


        button.style.width =
          '100%';

        button.style.minHeight =
          '60px';

        button.style.marginBottom =
          '10px';

        button.style.border =
          'none';

        button.style.borderRadius =
          '16px';

        button.style.background =
          '#3e3e3e';

        button.style.color =
          '#fff';

        button.style.fontSize =
          '20px';

        button.style.fontWeight =
          '800';

        button.style.cursor =
          'pointer';


        /*
         * ====================================================
         * WYBÓR PLIKU
         * ====================================================
         */

        button.onclick =
          function() {


            /*
             * Jeżeli wybór już został wykonany,
             * ignorujemy kolejne kliknięcie.
             */

            if (
              overlay.dataset.locked === '1'
            ) {

              return;
            }


            /*
             * Natychmiast blokujemy całe okno.
             */

            overlay.dataset.locked =
              '1';


            /*
             * Blokujemy wszystkie przyciski.
             */

            const allButtons =
              panel.querySelectorAll(
                'button'
              );


            allButtons.forEach(
              function(item) {

                item.disabled =
                  true;

                item.style.pointerEvents =
                  'none';

                item.style.opacity =
                  '0.5';

              }
            );


            /*
             * Informacja dla sędziego.
             */

            showStatus(
              'Przywracanie rundy...',
              'warn'
            );


            /*
             * Usuwamy okno z ekranu NATYCHMIAST.
             */

            overlay.remove();


            /*
             * =================================================
             * BLOKADA EKRANU NA 1 SEKUNDĘ
             * =================================================
             *
             * Ustawiamy również globalną blokadę
             * dla sendShot().
             */

            if (
              typeof scoreState !== 'undefined'
            ) {

              scoreState.locked =
                true;
            }


            /*
             * Po jednej sekundzie dopiero
             * odczytujemy wybrany plik.
             */

            setTimeout(
              function() {

                restoreScore(
                  filename
                );

              },
              1000
            );

          };


        panel.appendChild(button);

      });

    }


    /*
     * ========================================================
     * PRZYCISK ANULUJ
     * ========================================================
     */

    const closeButton =
      document.createElement('button');


    closeButton.type =
      'button';


    closeButton.textContent =
      'ANULUJ';


    closeButton.style.width =
      '100%';

    closeButton.style.minHeight =
      '60px';

    closeButton.style.marginTop =
      '8px';

    closeButton.style.border =
      'none';

    closeButton.style.borderRadius =
      '16px';

    closeButton.style.background =
      '#2d5a88';

    closeButton.style.color =
      '#fff';

    closeButton.style.fontSize =
      '20px';

    closeButton.style.fontWeight =
      '900';


    closeButton.onclick =
      function() {

        overlay.remove();

      };


    panel.appendChild(
      closeButton
    );


    /*
     * Dodajemy panel do overlay.
     */

    overlay.appendChild(
      panel
    );


    /*
     * Dodajemy overlay do .card.
     */

    const card =
      document.querySelector(
        '.card'
      );


    if (card) {

      card.appendChild(
        overlay
      );

    } else {

      document.body.appendChild(
        overlay
      );

    }


  } catch (error) {

    console.error(
      'Błąd openRestoreFiles():',
      error
    );


    showStatus(
      error.message ||
      'Nie udało się pobrać listy plików.',
      'error'
    );

  }

}