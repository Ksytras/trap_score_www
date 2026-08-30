  * ============================================================
- * MENU SĘDZIEGO
+ * CENTRALNY STAN APLIKACJI I MENU SĘDZIEGO
  * ============================================================
  *
- * Odpowiedzialność tego pliku:
+ * W aplikacji może być aktywny dokładnie jeden z pięciu stanów:
  *
- * STAN 2 — MENU SĘDZIEGO
+ * 1. READY            — gotowość,
+ * 2. JUDGE_MENU       — menu sędziego,
+ * 3. NEW_ROUND        — formularz nowej rundy,
+ * 4. SHOOTING         — strzelanie,
+ * 5. ROUND_OPERATIONS — zakończenie rundy / operacje na rundzie.
  *
- * Ten moduł:
- * - otwiera MENU SĘDZIEGO,
- * - zamyka MENU SĘDZIEGO,
- * - ustawia centralny stan aplikacji,
- * - pilnuje, aby NOWA RUNDA nie pozostawała jednocześnie otwarta.
- *
- * Nie obsługuje:
- * - formularza NOWEJ RUNDY,
- * - listy przywracania,
- * - cofania strzału,
- * - zapisywania rundy,
- * - logiki strzelania.
+ * Tylko setAppState() zarządza widocznością głównych widoków.
  */
 
+const APP_STATES = Object.freeze({
+  READY: 'ready',
+  JUDGE_MENU: 'judge-menu',
+  NEW_ROUND: 'new-round',
+  SHOOTING: 'shooting',
+  ROUND_OPERATIONS: 'round-operations'
+});
+
+const APP_STATE_VALUES = Object.values(APP_STATES);
+
+let appState = APP_STATES.READY;
+let previousState = APP_STATES.READY;
+
+
 /*
- * ============================================================
- * OTWARCIE MENU SĘDZIEGO
- * ============================================================
+ * Zwraca stan zapisany w DOM, jeżeli jest częścią kontraktu.
  */
+function getAppState() {
 
-function openMenu() {
+  const app = document.getElementById('app');
+  const domState = app && app.dataset.state;
+
+  if (APP_STATE_VALUES.includes(domState)) {
+
+    appState = domState;
+  }
+
+  return appState;
+}
+
+
+/*
+ * Ustawia jedyny aktywny stan aplikacji.
+ *
+ * Najpierw ukrywa wszystkie główne widoki, a następnie pokazuje
+ * wyłącznie widok należący do wskazanego stanu.
+ */
+function setAppState(state) {
+
+  if (!APP_STATE_VALUES.includes(state)) {
+
+    console.error(
+      `Nieznany stan aplikacji: ${state}`
+    );
+
+    return false;
+  }
+
+  const app = document.getElementById('app');
+
+  if (!app) {
 
-  const app =
-    document.getElementById('app');
+    console.error('Brak elementu app.');
+
+    return false;
+  }
 
   const menuOverlay =
     document.getElementById('menuOverlay');
 
   const setupOverlay =
     document.getElementById('setupOverlay');
 
   const roundFinish =
     document.getElementById('roundFinish');
 
-  /*
-   * Kontrola wymaganych elementów DOM.
-   */
+  const buttons =
+    document.getElementById('buttons');
 
-  if (!app || !menuOverlay) {
+  const restoreFileWindow =
+    document.getElementById('restoreFileWindow');
 
-    console.error(
-      'Brak elementu app lub menuOverlay.'
-    );
+  /* Ukrywamy wszystkie główne widoki. */
+  if (menuOverlay) {
 
-    return;
+    menuOverlay.classList.remove('show');
   }
 
-  /*
-   * ------------------------------------------------------------
-   * ZAMYKAMY INNE WARSTWY
-   * ------------------------------------------------------------
-   *
-   * MENU SĘDZIEGO jest jedynym aktywnym panelem
-   * w STANIE 2.
-   *
-   * Dzięki temu nie mogą jednocześnie pozostać otwarte:
-   *
-   * - NOWA RUNDA,
-   * - RUNDA ZAKOŃCZONA.
-   */
-
   if (setupOverlay) {
 
     setupOverlay.classList.remove('show');
   }
 
   if (roundFinish) {
 
     roundFinish.classList.remove('show');
   }
 
+  if (
+    restoreFileWindow &&
+    state !== APP_STATES.ROUND_OPERATIONS
+  ) {
+
+    restoreFileWindow.remove();
+  }
+
+  if (buttons) {
 
-  /*
-   * ------------------------------------------------------------
-   * USTAWIAMY STAN APLIKACJI
-   * ------------------------------------------------------------
-   *
-   * STAN 2 — MENU SĘDZIEGO
-   */
+    buttons.style.display = 'none';
+  }
 
-  app.dataset.state = 'judge-menu';
+  /* Pokazujemy wyłącznie widok należący do nowego stanu. */
+  switch (state) {
 
+    case APP_STATES.JUDGE_MENU:
 
-  /*
-   * Czyścimy poprzedni komunikat statusu.
-   *
-   * Sprawdzamy istnienie funkcji, ponieważ common.js
-   * jest osobnym modułem.
-   */
+      if (!menuOverlay) {
 
-  if (typeof showStatus === 'function') {
+        console.error('Brak elementu menuOverlay.');
 
-    showStatus('', '');
+        return false;
+      }
+
+      menuOverlay.classList.add('show');
+      break;
+
+    case APP_STATES.NEW_ROUND:
+
+      if (!setupOverlay) {
+
+        console.error('Brak elementu setupOverlay.');
+
+        return false;
+      }
+
+      setupOverlay.classList.add('show');
+      break;
+
+    case APP_STATES.SHOOTING:
+
+      if (buttons) {
+
+        buttons.style.display = 'grid';
+      }
+
+      break;
+
+    case APP_STATES.ROUND_OPERATIONS:
+
+      /*
+       * Dynamiczna lista przywracania również należy do tego stanu.
+       * Ekran zakończenia pokazujemy tylko wtedy, gdy lista nie jest
+       * aktualnie aktywna.
+       */
+      if (roundFinish && !restoreFileWindow) {
+
+        roundFinish.classList.add('show');
+      }
+
+      break;
+
+    case APP_STATES.READY:
+    default:
+      break;
   }
 
+  app.dataset.state = state;
+  appState = state;
+
+  return true;
+}
+
+
+/*
+ * ============================================================
+ * OTWARCIE MENU SĘDZIEGO
+ * ============================================================
+ */
+function openMenu() {
+
+  const currentState = getAppState();
 
   /*
-   * Otwieramy MENU SĘDZIEGO.
+   * Zapamiętujemy stan, z którego otwarto menu. Ponowne wywołanie
+   * openMenu() w menu nie może nadpisać prawidłowego powrotu.
    */
+  if (currentState !== APP_STATES.JUDGE_MENU) {
+
+    previousState = currentState;
+  }
 
-  menuOverlay.classList.add('show');
+  if (!setAppState(APP_STATES.JUDGE_MENU)) {
+
+    return;
+  }
+
+  if (typeof showStatus === 'function') {
+
+    showStatus('', '');
+  }
 }
 
 
 /*
  * ============================================================
  * ZAMKNIĘCIE MENU SĘDZIEGO
  * ============================================================
  */
-
 function closeMenu(event) {
 
-  /*
-   * Jeżeli funkcja została wywołana przez:
-   *
-   * onclick="closeMenu(event)"
-   *
-   * i kliknięto element znajdujący się wewnątrz panelu,
-   * niczego nie zamykamy.
-   */
-
+  /* Kliknięcie wewnątrz panelu nie zamyka menu. */
   if (
     event &&
     event.target !== event.currentTarget
   ) {
 
     return;
   }
 
+  const returnState =
+    APP_STATE_VALUES.includes(previousState) &&
+    previousState !== APP_STATES.JUDGE_MENU
+      ? previousState
+      : APP_STATES.READY;
 
-  const menuOverlay =
-    document.getElementById('menuOverlay');
+  setAppState(returnState);
+}
 
-  const app =
-    document.getElementById('app');
 
+/*
+ * Synchronizujemy zmienne modułu z początkowym data-state.
+ * Skrypt jest ładowany po znacznikach aplikacji, ale obsługujemy też
+ * jego przyszłe przeniesienie do sekcji <head>.
+ */
+function initializeAppState() {
 
-  /*
-   * Zamykamy overlay MENU SĘDZIEGO.
-   */
+  const initialState = getAppState();
 
-  if (menuOverlay) {
+  previousState = initialState === APP_STATES.JUDGE_MENU
+    ? APP_STATES.READY
+    : initialState;
 
-    menuOverlay.classList.remove('show');
-  }
+  setAppState(initialState);
+}
 
+if (document.readyState === 'loading') {
 
-  /*
-   * Po zamknięciu MENU SĘDZIEGO wracamy do
-   * STANU 1 — GOTOWOŚĆ.
-   *
-   * Ważne:
-   * tutaj nie ustawiamy stanu STRZELANIA ani
-   * RUNDA ZAKOŃCZONA.
-   *
-   * Jeżeli w przyszłości zamknięcie menu będzie
-   * wykonywane z innego stanu, odpowiedzialny za
-   * ten stan moduł będzie musiał jawnie przywrócić
-   * właściwy stan.
-   */
+  document.addEventListener(
+    'DOMContentLoaded',
+    initializeAppState,
+    { once: true }
+  );
 
-  if (app) {
+} else {
 
-    app.dataset.state = 'ready';
-  }
+  initializeAppState();
 }
