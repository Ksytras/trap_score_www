<?php

/*
 * ============================================================
 * API - WYNIKI TRAP
 * ============================================================
 *
 * Obsługiwane funkcje:
 *
 *   new_game
 *   get_score
 *   score
 *   restore_point
 *   save_game
 *   list_files
 *   restore_score
 *
 * ============================================================
 */


/*
 * ============================================================
 * KONFIGURACJA
 * ============================================================
 */

/*
 * Maksymalna liczba strzałów.
 *
 * ZMIENIAMY TYLKO TĘ WARTOŚĆ.
 */
const MAX_SHOT = 5;


/*
 * Główny plik aktualnej rundy.
 */
const CURRENT_FILE = __DIR__ . '/wyniki.json';


/*
 * Katalog zapisanych rund.
 */
const RESULTS_DIR = __DIR__ . '/wyniki';


/*
 * ============================================================
 * NAGŁÓWKI
 * ============================================================
 */

header('Content-Type: application/json; charset=utf-8');


/*
 * ============================================================
 * ODCZYT DANYCH POST
 * ============================================================
 */

$input = file_get_contents('php://input');

$data = json_decode($input, true);

if (!is_array($data)) {

    echo json_encode([
        'success' => false,
        'message' => 'Nieprawidłowe dane JSON.'
    ], JSON_UNESCAPED_UNICODE);

    exit;
}


$action = $data['action'] ?? '';


/*
 * ============================================================
 * FUNKCJA ODPOWIEDZI
 * ============================================================
 */

function responseJson($data)
{
    echo json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES
    );

    exit;
}


/*
 * ============================================================
 * FUNKCJA ZAPISU WYNIKI.JSON
 * ============================================================
 *
 * Zapisuje JSON w czytelnej formie.
 *
 * Tablica shots jest zawsze zapisywana w jednym wierszu:
 *
 * "shots": [1, 0, null, null, null]
 *
 * ============================================================
 */

function saveResultsJson($file, $data)
{
    $json = json_encode(
        $data,
        JSON_UNESCAPED_UNICODE |
        JSON_UNESCAPED_SLASHES |
        JSON_PRETTY_PRINT
    );

    if ($json === false) {
        return false;
    }


    /*
     * Tablice "shots" zapisujemy w jednym wierszu.
     */

    $json = preg_replace_callback(
        '/"shots"\s*:\s*\[\s*([^\]]*?)\s*\]/s',
        function ($matches) {

            $content = $matches[1];


            /*
             * Usuwamy białe znaki.
             */

            $content = preg_replace(
                '/\s+/',
                ' ',
                trim($content)
            );


            /*
             * Normalizujemy przecinki.
             */

            $content = preg_replace(
                '/\s*,\s*/',
                ', ',
                $content
            );


            return '"shots": [' . $content . ']';
        },
        $json
    );


    /*
     * Zapis pliku.
     */

    return file_put_contents(
        $file,
        $json,
        LOCK_EX
    ) !== false;
}


/*
 * ============================================================
 * ODCZYT AKTUALNEGO WYNIKI.JSON
 * ============================================================
 */

function loadCurrentResults()
{
    if (!file_exists(CURRENT_FILE)) {
        return null;
    }


    $content = file_get_contents(
        CURRENT_FILE
    );

    if ($content === false) {
        return null;
    }


    $results = json_decode(
        $content,
        true
    );


    if (!is_array($results)) {
        return null;
    }


    return $results;
}


/*
 * ============================================================
 * SPRAWDZENIE ZAWODNIKÓW
 * ============================================================
 */

function validateShooters($shooters)
{
    if (!is_array($shooters)) {
        return false;
    }

    if (count($shooters) < 1) {
        return false;
    }

    if (count($shooters) > 200) {
        return false;
    }

    return true;
}


/*
 * ============================================================
 * NEW GAME
 * ============================================================
 */

if ($action === 'new_game') {

    $shooters =
        $data['shooters'] ?? null;


    if (!validateShooters($shooters)) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowa lista zawodników.'
        ]);
    }


    $results = [];


    foreach ($shooters as $index => $shooter) {

        $shooterNumber =
            intval(
                $shooter['shooterNumber']
                ?? ($index + 1)
            );


        $shooterName =
            trim(
                (string)(
                    $shooter['shooterName']
                    ?? ''
                )
            );


        $clubName =
            trim(
                (string)(
                    $shooter['clubName']
                    ?? ''
                )
            );


        /*
         * Pusta nazwa zawodnika =
         * numer zawodnika.
         */

        if ($shooterName === '') {

            $shooterName =
                (string)$shooterNumber;
        }


        /*
         * Tworzymy pustą tablicę wyników.
         */

        $shots = array_fill(
            0,
            MAX_SHOT,
            null
        );


        $results[] = [

            'shooterNumber' =>
                $shooterNumber,

            'shooterName' =>
                $shooterName,

            'clubName' =>
                $clubName,

            'shots' =>
                $shots
        ];
    }


    /*
     * Zapisujemy nową rundę.
     */

    if (!saveResultsJson(
        CURRENT_FILE,
        $results
    )) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się zapisać wyniki.json.'
        ]);
    }


    responseJson([
        'success' => true,
        'message' =>
            'Nowa runda została utworzona.'
    ]);
}


/*
 * ============================================================
 * GET SCORE
 * ============================================================
 *
 * Znajduje pierwsze wolne miejsce.
 *
 * Kolejność:
 *
 * zawodnik 1 / strzał 1
 * zawodnik 2 / strzał 1
 * zawodnik 3 / strzał 1
 *
 * zawodnik 1 / strzał 2
 * zawodnik 2 / strzał 2
 * itd.
 *
 * ============================================================
 */

if ($action === 'get_score') {

    $results =
        loadCurrentResults();


    if (
        !is_array($results) ||
        count($results) === 0
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Brak prawidłowego wyniki.json.'
        ]);
    }


    $shooterCount =
        count($results);


    for (
        $shotIndex = 0;
        $shotIndex < MAX_SHOT;
        $shotIndex++
    ) {

        for (
            $shooterIndex = 0;
            $shooterIndex < $shooterCount;
            $shooterIndex++
        ) {

            $value =
                $results[$shooterIndex]['shots'][$shotIndex]
                ?? null;


            if ($value === null) {

                responseJson([
                    'success' => true,

                    'shooters' =>
                        $results,

                    'shooterIndex' =>
                        $shooterIndex,

                    'shotNumber' =>
                        $shotIndex + 1,

                    'maxShot' =>
                        MAX_SHOT
                ]);
            }
        }
    }


    /*
     * Wszystkie wyniki są już wpisane.
     */

    responseJson([
        'success' => true,

        'shooters' =>
            $results,

        'shooterIndex' =>
            $shooterCount - 1,

        'shotNumber' =>
            MAX_SHOT,

        'maxShot' =>
            MAX_SHOT,

        'roundFinished' =>
            true
    ]);
}


/*
 * ============================================================
 * SCORE
 * ============================================================
 */

if ($action === 'score') {

    $results =
        loadCurrentResults();


    if (
        !is_array($results) ||
        count($results) === 0
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Brak aktywnej rundy.'
        ]);
    }


    $shooterNumber =
        intval(
            $data['shooterNumber']
            ?? 0
        );


    $shotNumber =
        intval(
            $data['shotNumber']
            ?? 0
        );


    $value =
        $data['value']
        ?? null;


    /*
     * Walidacja wyniku.
     */

    if (
        $value !== 0 &&
        $value !== 1
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowa wartość wyniku.'
        ]);
    }


    if (
        $shooterNumber < 1 ||
        $shooterNumber > count($results)
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowy numer zawodnika.'
        ]);
    }


    if (
        $shotNumber < 1 ||
        $shotNumber > MAX_SHOT
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowy numer strzału.'
        ]);
    }


    /*
     * Indeksy tablic PHP zaczynają się od 0.
     */

    $shooterIndex =
        $shooterNumber - 1;


    $shotIndex =
        $shotNumber - 1;


    /*
     * Sprawdzamy czy zawodnik posiada tablicę shots.
     */

    if (
        !isset(
            $results[$shooterIndex]['shots']
        ) ||
        !is_array(
            $results[$shooterIndex]['shots']
        )
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowa struktura wyników.'
        ]);
    }


    /*
     * Zapis wyniku.
     */

    $results[$shooterIndex]['shots'][$shotIndex] =
        $value;


    /*
     * Zapis całego wyniki.json.
     */

    if (!saveResultsJson(
        CURRENT_FILE,
        $results
    )) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się zapisać wyniku.'
        ]);
    }


    /*
     * Szukamy kolejnego wolnego miejsca.
     */

    $shooterCount =
        count($results);


    for (
        $nextShotIndex = 0;
        $nextShotIndex < MAX_SHOT;
        $nextShotIndex++
    ) {

        for (
            $nextShooterIndex = 0;
            $nextShooterIndex < $shooterCount;
            $nextShooterIndex++
        ) {

            $nextValue =
                $results[$nextShooterIndex]['shots'][$nextShotIndex]
                ?? null;


            if ($nextValue === null) {

                responseJson([
                    'success' => true,

                    'roundFinished' =>
                        false,

                    'nextShooterIndex' =>
                        $nextShooterIndex,

                    'nextShotNumber' =>
                        $nextShotIndex + 1,

                    'nextShooter' =>
                        $results[$nextShooterIndex],

                    'maxShot' =>
                        MAX_SHOT
                ]);
            }
        }
    }


    /*
     * Nie znaleziono już pustego miejsca.
     *
     * Runda zakończona.
     */

    responseJson([
        'success' => true,

        'roundFinished' =>
            true,

        'message' =>
            'Runda została zakończona.',

        'maxShot' =>
            MAX_SHOT
    ]);
}


/*
 * ============================================================
 * RESTORE POINT
 * ============================================================
 *
 * Cofnięcie ostatniego wpisanego wyniku.
 *
 * Przeszukujemy wyniki w kolejności:
 *
 * strzał 1:
 *   zawodnik 1
 *   zawodnik 2
 *   ...
 *
 * strzał 2:
 *   zawodnik 1
 *   zawodnik 2
 *   ...
 *
 * Ostatni wpisany wynik zostaje zamieniony na null.
 *
 * ============================================================
 */

if ($action === 'restore_point') {

    $results =
        loadCurrentResults();


    if (
        !is_array($results) ||
        count($results) === 0
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Cofnięcie niemożliwe - brak wyników'
        ]);
    }


    $shooterCount =
        count($results);


    $lastShooterIndex =
        -1;


    $lastShotIndex =
        -1;


    /*
     * Szukamy ostatniego wpisanego wyniku.
     */

    for (
        $shotIndex = 0;
        $shotIndex < MAX_SHOT;
        $shotIndex++
    ) {

        for (
            $shooterIndex = 0;
            $shooterIndex < $shooterCount;
            $shooterIndex++
        ) {

            $value =
                $results[$shooterIndex]['shots'][$shotIndex]
                ?? null;


            if (
                $value === 0 ||
                $value === 1
            ) {

                $lastShooterIndex =
                    $shooterIndex;

                $lastShotIndex =
                    $shotIndex;
            }
        }
    }


    /*
     * Nie znaleziono żadnego wyniku.
     */

    if (
        $lastShooterIndex === -1 ||
        $lastShotIndex === -1
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Cofnięcie niemożliwe - brak wyników'
        ]);
    }


    /*
     * Usuwamy ostatni wynik.
     */

    $results[
        $lastShooterIndex
    ]['shots'][
        $lastShotIndex
    ] = null;


    /*
     * Zapisujemy zmienione wyniki.
     */

    if (!saveResultsJson(
        CURRENT_FILE,
        $results
    )) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się cofnąć ostatniego wyniku.'
        ]);
    }


    responseJson([
        'success' => true,

        'message' =>
            'Ostatni wynik skasowany',

        'shooterIndex' =>
            $lastShooterIndex,

        'shotNumber' =>
            $lastShotIndex + 1,

        'shooter' =>
            $results[$lastShooterIndex],

        'maxShot' =>
            MAX_SHOT
    ]);
}


/*
 * ============================================================
 * SAVE GAME
 * ============================================================
 *
 * Tworzy kopię aktualnego wyniki.json
 * w katalogu /wyniki/
 *
 * ============================================================
 */

if ($action === 'save_game') {

    $filename =
        trim(
            (string)(
                $data['filename']
                ?? ''
            )
        );


    if ($filename === '') {

        responseJson([
            'success' => false,
            'message' =>
                'Brak nazwy pliku'
        ]);
    }


    /*
     * Usuwamy rozszerzenie .json,
     * jeżeli użytkownik podał je sam.
     */

    if (
        substr(
            strtolower($filename),
            -5
        ) === '.json'
    ) {

        $filename =
            substr(
                $filename,
                0,
                -5
            );
    }


    /*
     * Dozwolone znaki.
     */

    if (
        !preg_match(
            '/^[a-zA-Z0-9_\- ]+$/u',
            $filename
        )
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nazwa pliku zawiera niedozwolone znaki.'
        ]);
    }


    /*
     * Zabezpieczenie długości.
     */

    if (
        strlen($filename) < 1 ||
        strlen($filename) > 100
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowa długość nazwy pliku.'
        ]);
    }


    /*
     * Sprawdzamy aktualny plik.
     */

    if (!file_exists(CURRENT_FILE)) {

        responseJson([
            'success' => false,
            'message' =>
                'Brak pliku wyniki.json.'
        ]);
    }


    /*
     * Tworzymy katalog /wyniki/,
     * jeżeli jeszcze nie istnieje.
     */

    if (!is_dir(RESULTS_DIR)) {

        if (
            !mkdir(
                RESULTS_DIR,
                0777,
                true
            )
        ) {

            responseJson([
                'success' => false,
                'message' =>
                    'Nie udało się utworzyć katalogu wyniki.'
            ]);
        }
    }


    /*
     * Nazwa docelowa.
     */

    $targetFile =
        RESULTS_DIR .
        '/' .
        $filename .
        '.json';


    /*
     * Odczytujemy aktualny wyniki.json
     * i zapisujemy go ponownie przez
     * naszą funkcję formatowania.
     */

    $currentResults =
        loadCurrentResults();


    if (
        !is_array($currentResults)
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie można odczytać aktualnej rundy.'
        ]);
    }


    if (!saveResultsJson(
        $targetFile,
        $currentResults
    )) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się zapisać kopii rundy.'
        ]);
    }


    responseJson([
        'success' => true,

        'message' =>
            'Runda została zapisana jako ' .
            $filename .
            '.json',

        'filename' =>
            $filename . '.json'
    ]);
}


/*
 * ============================================================
 * LIST FILES
 * ============================================================
 *
 * Zwraca listę plików JSON znajdujących się
 * w katalogu /wyniki/
 *
 * ============================================================
 */

if ($action === 'list_files') {

    /*
     * Jeżeli katalog jeszcze nie istnieje,
     * zwracamy pustą listę.
     */

    if (!is_dir(RESULTS_DIR)) {

        responseJson([
            'success' => true,
            'files' => []
        ]);
    }


    /*
     * Odczytujemy zawartość katalogu.
     */

    $items =
        scandir(RESULTS_DIR);


    if ($items === false) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się odczytać katalogu wyniki.'
        ]);
    }


    $files = [];


    foreach ($items as $item) {

        /*
         * Pomijamy . oraz ..
         */

        if (
            $item === '.' ||
            $item === '..'
        ) {

            continue;
        }


        $fullPath =
            RESULTS_DIR .
            '/' .
            $item;


        /*
         * Interesują nas wyłącznie pliki.
         */

        if (!is_file($fullPath)) {

            continue;
        }


        /*
         * Interesują nas wyłącznie pliki JSON.
         */

        if (
            strtolower(
                pathinfo(
                    $item,
                    PATHINFO_EXTENSION
                )
            ) !== 'json'
        ) {

            continue;
        }


        /*
         * Dodajemy nazwę pliku do listy.
         */

        $files[] =
            $item;
    }


    /*
     * Sortujemy naturalnie:
     *
     * runda2.json
     * runda10.json
     *
     * zamiast:
     *
     * runda10.json
     * runda2.json
     */

    sort(
        $files,
        SORT_NATURAL | SORT_FLAG_CASE
    );


    responseJson([
        'success' => true,
        'files' => $files
    ]);
}


/*
 * ============================================================
 * RESTORE SCORE
 * ============================================================
 *
 * Odczytuje wskazany plik z /wyniki/
 *
 * Sprawdza:
 *
 * 1. poprawność struktury
 * 2. poprawną kolejność wyników
 * 3. pierwsze brakujące miejsce
 * 4. czy runda jest pełna
 *
 * Jeżeli wszystko jest prawidłowe,
 * plik zostaje zapisany jako aktualny
 * wyniki.json.
 *
 * ============================================================
 */

if ($action === 'restore_score') {

    $filename =
        trim(
            (string)(
                $data['filename']
                ?? ''
            )
        );


    if ($filename === '') {

        responseJson([
            'success' => false,
            'message' =>
                'Brak nazwy pliku.'
        ]);
    }


    /*
     * Usuwamy .json, jeżeli zostało podane.
     */

    if (
        substr(
            strtolower($filename),
            -5
        ) === '.json'
    ) {

        $filename =
            substr(
                $filename,
                0,
                -5
            );
    }


    /*
     * Zabezpieczenie przed path traversal.
     */

    if (
        !preg_match(
            '/^[a-zA-Z0-9_\- ]+$/u',
            $filename
        )
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Nieprawidłowa nazwa pliku.'
        ]);
    }


    $restoreFile =
        RESULTS_DIR .
        '/' .
        $filename .
        '.json';


    /*
     * Sprawdzamy istnienie pliku.
     */

    if (!file_exists($restoreFile)) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie znaleziono wybranego pliku.'
        ]);
    }


    /*
     * Odczytujemy plik.
     */

    $content =
        file_get_contents(
            $restoreFile
        );


    if ($content === false) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się odczytać pliku.'
        ]);
    }


    $restoredResults =
        json_decode(
            $content,
            true
        );


    if (
        !is_array($restoredResults) ||
        count($restoredResults) === 0
    ) {

        responseJson([
            'success' => false,
            'message' =>
                'Plik zawiera błąd. Zweryfikuj ręcznie.'
        ]);
    }


    $shooterCount =
        count($restoredResults);


    /*
     * ========================================================
     * WERYFIKACJA STRUKTURY
     * ========================================================
     */

    for (
        $i = 0;
        $i < $shooterCount;
        $i++
    ) {

        if (
            !isset(
                $restoredResults[$i]['shots']
            ) ||
            !is_array(
                $restoredResults[$i]['shots']
            )
        ) {

            responseJson([
                'success' => false,
                'message' =>
                    'Plik zawiera błąd. Zweryfikuj ręcznie.'
            ]);
        }


        /*
         * Musi być dokładnie MAX_SHOT wyników.
         */

        if (
            count(
                $restoredResults[$i]['shots']
            ) !== MAX_SHOT
        ) {

            responseJson([
                'success' => false,
                'message' =>
                    'Plik zawiera błąd. Zweryfikuj ręcznie.'
            ]);
        }
    }


    /*
     * ========================================================
     * WERYFIKACJA KOLEJNOŚCI
     * ========================================================
     *
     * Po pierwszym null nie może pojawić się
     * żaden kolejny wpisany wynik.
     *
     * Przykład poprawny:
     *
     * Zawodnik 1: [1,0,null,null,null]
     * Zawodnik 2: [1,1,null,null,null]
     * Zawodnik 3: [0,null,null,null,null]
     *
     * Pierwszy null:
     *
     * Zawodnik 3 / strzał 2
     *
     * ========================================================
     */

    $foundNull =
        false;

    $restoreShooterIndex =
        -1;

    $restoreShotIndex =
        -1;


    for (
        $shotIndex = 0;
        $shotIndex < MAX_SHOT;
        $shotIndex++
    ) {

        for (
            $shooterIndex = 0;
            $shooterIndex < $shooterCount;
            $shooterIndex++
        ) {

            $value =
                $restoredResults[$shooterIndex]['shots'][$shotIndex];


            /*
             * Wynik musi być:
             *
             * 0
             * 1
             * null
             */

            if (
                $value !== null &&
                $value !== 0 &&
                $value !== 1
            ) {

                responseJson([
                    'success' => false,
                    'message' =>
                        'Plik zawiera błąd. Zweryfikuj ręcznie.'
                ]);
            }


            /*
             * Pierwszy brakujący wynik.
             */

            if ($value === null) {

                if (!$foundNull) {

                    $foundNull =
                        true;

                    $restoreShooterIndex =
                        $shooterIndex;

                    $restoreShotIndex =
                        $shotIndex;
                }

                continue;
            }


            /*
             * Jeżeli wcześniej znaleźliśmy null,
             * a teraz pojawił się wynik,
             * kolejność jest błędna.
             */

            if ($foundNull) {

                responseJson([
                    'success' => false,
                    'message' =>
                        'Plik zawiera błąd. Zweryfikuj ręcznie.'
                ]);
            }
        }
    }


    /*
     * ========================================================
     * PRZYWRÓCENIE AKTUALNEGO WYNIKI.JSON
     * ========================================================
     */

    if (!saveResultsJson(
        CURRENT_FILE,
        $restoredResults
    )) {

        responseJson([
            'success' => false,
            'message' =>
                'Nie udało się przywrócić rundy.'
        ]);
    }


    /*
     * ========================================================
     * RUNDA PEŁNA
     * ========================================================
     */

    if (!$foundNull) {

        responseJson([
            'success' => true,

            'message' =>
                'Runda przywrócona.',

            'roundFinished' =>
                true,

            'fullRound' =>
                true,

            'shooters' =>
                $restoredResults,

            'maxShot' =>
                MAX_SHOT
        ]);
    }


    /*
     * ========================================================
     * RUNDA CZĘŚCIOWA
     * ========================================================
 */

    responseJson([
        'success' => true,

        'message' =>
            'Runda przywrócona.',

        'roundFinished' =>
            false,

        'fullRound' =>
            false,

        'shooters' =>
            $restoredResults,

        'shooterIndex' =>
            $restoreShooterIndex,

        'shotNumber' =>
            $restoreShotIndex + 1,

        'maxShot' =>
            MAX_SHOT,

        'shooter' =>
            $restoredResults[
                $restoreShooterIndex
            ]
    ]);
}


/*
 * ============================================================
 * NIEZNANA FUNKCJA
 * ============================================================
 */

responseJson([
    'success' => false,
    'message' =>
        'Nieznana akcja API.'
]);

?>
