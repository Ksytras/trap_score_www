/*
 * ============================================================
 * LISTA ZAPISANYCH RUND
 * ============================================================
 *
 * Kontrakt przejść:
 *
 * JUDGE_MENU -> ROUND_OPERATIONS / RESTORE_ROUND — pokazanie listy,
 * RESTORE_ROUND -> JUDGE_MENU — anulowanie lub błąd,
 * RESTORE_ROUND -> SHOOTING — przywrócenie rundy częściowej,
 * RESTORE_ROUND -> ROUND_OPERATIONS — przywrócenie rundy pełnej.
 *
 * restoreFileWindow jest dynamicznym podwidokiem stanu
 * ROUND_OPERATIONS. Widocznością głównych widoków nadal zarządza
 * wyłącznie setAppState().
 */

let restoreFileListPending = false;


async function getResultFiles() {

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      action: 'list_files'
    })
  });

  const result = await response.json();

  if (!response.ok || !result.success) {

    throw new Error(
      result.message ||
        'Nie udało się pobrać listy plików.'
    );
  }

  return Array.isArray(result.files)
    ? result.files
    : [];
}


async function openRestoreFiles() {

  if (
    typeof getAppState !== 'function' ||
    typeof setAppState !== 'function' ||
    typeof APP_STATES === 'undefined'
  ) {

    console.error(
      'Brak centralnej obsługi stanu aplikacji.'
    );

    showStatus(
      'Nie można otworzyć listy zapisanych rund.',
      'error'
    );

    return false;
  }

  if (getAppState() !== APP_STATES.JUDGE_MENU) {

    showStatus(
      'Listę rund można otworzyć wyłącznie z MENU SĘDZIEGO.',
      'warn'
    );

    return false;
  }

  if (restoreFileListPending) {

    showStatus(
      'Pobieranie listy rund już trwa.',
      'warn'
    );

    return false;
  }

  restoreFileListPending = true;
  showStatus('Pobieranie listy rund...', 'warn');

  try {

    const files = await getResultFiles();

    const oldWindow =
      document.getElementById('restoreFileWindow');

    if (oldWindow) {

      oldWindow.remove();
    }

    const overlay = document.createElement('div');
    overlay.id = 'restoreFileWindow';
    overlay.dataset.locked = '0';

    Object.assign(overlay.style, {
      position: 'absolute',
      inset: '0',
      zIndex: '60',
      background: 'rgba(0, 0, 0, .88)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px'
    });

    const panel = document.createElement('div');

    Object.assign(panel.style, {
      width: '100%',
      maxWidth: '600px',
      maxHeight: '90vh',
      overflowY: 'auto',
      background: '#1b1b1b',
      borderRadius: '24px',
      padding: '20px'
    });

    const title = document.createElement('div');
    title.textContent = 'WYBIERZ RUNDĘ';

    Object.assign(title.style, {
      fontSize: '30px',
      fontWeight: '900',
      color: '#ffd966',
      marginBottom: '18px'
    });

    panel.appendChild(title);

    if (files.length === 0) {

      const empty = document.createElement('div');
      empty.textContent = 'Brak zapisanych rund.';

      Object.assign(empty.style, {
        fontSize: '20px',
        color: '#ccc',
        padding: '20px 0'
      });

      panel.appendChild(empty);

    } else {

      files.forEach(function(filename) {

        const button = document.createElement('button');
        button.type = 'button';
        button.textContent = String(filename);

        Object.assign(button.style, {
          width: '100%',
          minHeight: '60px',
          marginBottom: '10px',
          border: 'none',
          borderRadius: '16px',
          background: '#3e3e3e',
          color: '#fff',
          fontSize: '20px',
          fontWeight: '800',
          cursor: 'pointer'
        });

        button.onclick = async function() {

          /* Pierwszy wybór natychmiast blokuje całe okno. */
          if (overlay.dataset.locked === '1') {

            return;
          }

          overlay.dataset.locked = '1';

          panel
            .querySelectorAll('button')
            .forEach(function(item) {

              item.disabled = true;
              item.style.pointerEvents = 'none';
              item.style.opacity = '0.5';
            });

          if (typeof restoreScore !== 'function') {

            overlay.remove();
            setAppState(APP_STATES.JUDGE_MENU);

            showStatus(
              'Brak funkcji przywracania rundy.',
              'error'
            );

            return;
          }

          /*
           * restoreScore() sam ustawia blokadę scoreState. Nie stosujemy
           * już sztucznego opóźnienia ani osobnego setTimeout().
           */
          let restored;

          try {

            restored = await restoreScore(
              String(filename)
            );

          } catch (error) {

            console.error(
              'Błąd wyboru rundy:',
              error
            );

            overlay.remove();
            setAppState(APP_STATES.JUDGE_MENU);

            showStatus(
              error.message ||
                'Nie udało się przywrócić rundy.',
              'error'
            );

            return;
          }

          overlay.remove();

          if (restored !== true) {

            setAppState(APP_STATES.JUDGE_MENU);
            return;
          }

          /*
           * Runda pełna pozostaje w ROUND_OPERATIONS. Ponowne ustawienie
           * stanu po usunięciu podwidoku pokazuje właściwy ekran końcowy.
           */
          if (
            getAppState() ===
              APP_STATES.ROUND_OPERATIONS
          ) {

            setAppState(
              APP_STATES.ROUND_OPERATIONS
            );
          }
        };

        panel.appendChild(button);
      });
    }

    const closeButton = document.createElement('button');
    closeButton.type = 'button';
    closeButton.textContent = 'ANULUJ';

    Object.assign(closeButton.style, {
      width: '100%',
      minHeight: '60px',
      marginTop: '8px',
      border: 'none',
      borderRadius: '16px',
      background: '#2d5a88',
      color: '#fff',
      fontSize: '20px',
      fontWeight: '900'
    });

    closeButton.onclick = function() {

      if (overlay.dataset.locked === '1') {

        return;
      }

      overlay.remove();
      setAppState(APP_STATES.JUDGE_MENU);
    };

    panel.appendChild(closeButton);
    overlay.appendChild(panel);

    const app = document.getElementById('app');

    if (!app) {

      throw new Error('Brak elementu app.');
    }

    /*
     * Najpierw dodajemy dynamiczny podwidok do DOM. Dzięki temu
     * setAppState() nie pokaże pod nim ekranu zakończonej rundy.
     */
    app.appendChild(overlay);

    if (!setAppState(APP_STATES.ROUND_OPERATIONS)) {

      overlay.remove();

      throw new Error(
        'Nie udało się otworzyć listy zapisanych rund.'
      );
    }

    showStatus('', '');
    return true;

  } catch (error) {

    console.error(
      'Błąd openRestoreFiles():',
      error
    );

    setAppState(APP_STATES.JUDGE_MENU);

    showStatus(
      error.message ||
        'Nie udało się pobrać listy plików.',
      'error'
    );

    return false;

  } finally {

    restoreFileListPending = false;
  }
}
