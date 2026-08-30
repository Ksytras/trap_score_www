/*
 * ============================================================
 * MENU SĘDZIEGO
 * ============================================================
 */


/*
 * ============================================================
 * OTWARCIE MENU SĘDZIEGO
 * ============================================================
 */

function openMenu() {

  const menuOverlay =
    document.getElementById('menuOverlay');

  if (!menuOverlay) {

    console.error(
      'Brak elementu menuOverlay.'
    );

    return;
  }

  /*
   * Każda nowa czynność użytkownika
   * usuwa poprzedni komunikat statusu.
   */
  showStatus('', '');

  menuOverlay.classList.add('show');
}


/*
 * ============================================================
 * ZAMKNIĘCIE MENU SĘDZIEGO
 * ============================================================
 */

function closeMenu(event) {

  /*
   * Jeżeli kliknięto element wewnątrz panelu,
   * nie zamykamy menu.
   *
   * Wywołanie closeMenu() bez argumentu
   * również działa.
   */

  if (
    event &&
    event.target !== event.currentTarget
  ) {

    return;
  }

  const menuOverlay =
    document.getElementById('menuOverlay');

  if (menuOverlay) {

    menuOverlay.classList.remove('show');
  }
}
}
