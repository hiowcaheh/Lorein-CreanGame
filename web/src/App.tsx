/**
 * Rama gry: gorny pasek, menu i obszar tresci.
 *
 * Menu jest zawsze widoczne na szerokim ekranie, a na telefonie chowa sie
 * pod przycisk. Przelaczenie zakladki to zmiana widoku w przegladarce —
 * bez przeladowania strony i bez pytania serwera, bo stan gracza jest juz
 * pobrany.
 */

import { useCallback, useEffect, useState, useSyncExternalStore } from 'react';
import { BladApi, zapomnijToken, zapiszToken, token, zapytaj } from './gra/api';
import { useSkalaSceny } from './gra/useSkalaSceny';
import { czas } from './gra/karczmaUklad';
import { Bohater } from './ekrany/Bohater';
import { Karczma } from './ekrany/Karczma';
import { Diagnostyka } from './ekrany/Diagnostyka';
import { Logowanie } from './ekrany/Logowanie';
import { Miasto } from './ekrany/Miasto';
import { Opcje } from './ekrany/Opcje';
import { GABINET, ZBROJOWNIA } from './gra/sklepUklad';
import { Sklep } from './ekrany/Sklep';
import { Stajnia, type StanStajni } from './ekrany/Stajnia';
import { TworzeniePostaci, type DanePostaci } from './ekrany/TworzeniePostaci';
import { BLAD, KLIK, zagraj } from './gra/dzwieki';
import type { Gracz, OdpowiedzZTokenem, StanKarczmy, StanSklepu } from './gra/typy';

type Zakladka =
  | 'miasto'
  | 'karczma' | 'arena' | 'warta' | 'zbrojownia' | 'magia' | 'stajnia' | 'grzybiarz'
  | 'bohater' | 'poczta' | 'gildia' | 'sala' | 'lochy' | 'opcje';

/*
 * Trzynascie przyciskow, dokladnie tyle i w tej kolejnosci, co w oryginale
 * (`DefiniereInterfaceButton` w kliencie Flash). Miasta NIE ma na liscie —
 * wraca sie do niego krzyzykiem w prawym gornym rogu ekranu, tak jak
 * w grze. Czternasty przycisk nie zmiescilby sie zreszta w panelu: przy
 * kroku 44 px lista siegalaby 722 px, a panel ma 700.
 */
const MENU: { klucz: Zakladka; nazwa: string; grupa: string }[] = [
  { klucz: 'karczma', nazwa: 'Karczma', grupa: 'a' },
  { klucz: 'arena', nazwa: 'Arena', grupa: 'a' },
  { klucz: 'warta', nazwa: 'Warta', grupa: 'a' },
  { klucz: 'zbrojownia', nazwa: 'Zbrojownia', grupa: 'a' },
  { klucz: 'magia', nazwa: 'Gabinet magii', grupa: 'a' },
  { klucz: 'stajnia', nazwa: 'Stajnia', grupa: 'a' },
  { klucz: 'grzybiarz', nazwa: 'Grzybiarz', grupa: 'a' },
  { klucz: 'bohater', nazwa: 'Bohater', grupa: 'b' },
  { klucz: 'poczta', nazwa: 'Poczta', grupa: 'b' },
  { klucz: 'gildia', nazwa: 'Gildia', grupa: 'b' },
  { klucz: 'sala', nazwa: 'Sala Chwały', grupa: 'b' },
  { klucz: 'lochy', nazwa: 'Lochy', grupa: 'b' },
  { klucz: 'opcje', nazwa: 'Opcje', grupa: 'b' },
];

/** Zakladki, ktore juz cos pokazuja. Reszta czeka na swoja kolej. */
const GOTOWE: Zakladka[] = ['miasto', 'bohater', 'karczma', 'zbrojownia', 'magia', 'stajnia', 'opcje'];

/** Zakladki, ktore wypelniaja cala rame wlasnym obrazem. */
const PELNOEKRANOWE: Zakladka[] = ['miasto', 'bohater', 'karczma', 'zbrojownia', 'magia'];

/** Co widzi gracz, zanim wejdzie do gry. */
type Brama = 'sprawdzam' | 'logowanie' | 'tworzenie';

export function App() {
  const [gracz, setGracz] = useState<Gracz | null>(null);
  const [brama, setBrama] = useState<Brama>(() => (token() ? 'sprawdzam' : 'logowanie'));
  const [zakladka, setZakladka] = useState<Zakladka>('miasto');
  const [pracuje, setPracuje] = useState(false);
  const [blad, setBlad] = useState<string | null>(null);
  const [karczma, setKarczma] = useState<StanKarczmy | null>(null);
  const [sklep, setSklep] = useState<StanSklepu | null>(null);
  const [stajnia, setStajnia] = useState<StanStajni | null>(null);
  const odliczanie = useOdliczanieWyprawy(karczma);

  /** Zapisany token moze byc juz niewazny — sprawdzamy go przy starcie. */
  useEffect(() => {
    if (brama !== 'sprawdzam') return;

    let anulowane = false;
    void zapytaj<{ gracz: Gracz }>('/me')
      .then(({ gracz: g }) => {
        if (!anulowane) setGracz(g);
      })
      .catch(() => {
        if (anulowane) return;
        zapomnijToken();
        setBrama('logowanie');
      });

    return () => {
      anulowane = true;
    };
  }, [brama]);

  const wejdz = useCallback((odpowiedz: OdpowiedzZTokenem) => {
    zapiszToken(odpowiedz.token);
    setGracz(odpowiedz.gracz);
    setZakladka('miasto');
  }, []);

  async function sprobuj(dzialanie: () => Promise<OdpowiedzZTokenem>) {
    setPracuje(true);
    setBlad(null);
    try {
      wejdz(await dzialanie());
    } catch (e) {
      setBlad(e instanceof BladApi ? e.message : 'Coś poszło nie tak. Spróbuj jeszcze raz.');
    } finally {
      setPracuje(false);
    }
  }

  /**
   * Zapis opisu postaci.
   *
   * Nowa tresc laduje w stanie od razu, jeszcze przed odpowiedzia serwera —
   * gracz widzi to, co wpisal, a nie migniecie starego tekstu. Gdyby zapis
   * sie nie udal, serwer i tak przyslze prawde przy nastepnym `/me`.
   */
  function zapiszOpis(opis: string) {
    setGracz((g) => (g ? { ...g, opis } : g));
    void zapytaj<{ opis: string }>('/opis', { opis }).catch(() => {
      setBlad('Nie udało się zapisać opisu.');
    });
  }

  /**
   * Przelozenie przedmiotu.
   *
   * Stan przychodzi z SERWERA, a nie jest zgadywany na miejscu: to serwer
   * decyduje, czy przedmiot wolno gdzies polozyc, i to on przelicza cechy,
   * pancerz i obrazenia. Zgadywanie skonczyloby sie tym, ze ekran
   * pokazuje co innego niz baza.
   */
  function przeniesPrzedmiot(zrodlo: number, cel: number | null) {
    setBlad(null);
    void zapytaj<{ gracz: Gracz }>('/ekwipunek', { zrodlo, cel })
      .then(({ gracz: g }) => setGracz(g))
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się przełożyć przedmiotu.'));
  }

  /**
   * Mikstury — wypicie i odwolanie dzialania.
   *
   * Tak samo jak przy ekwipunku: o wszystkim decyduje serwer, klient
   * dostaje gotowy stan postaci. Odmowa (np. „dziala juz mocniejszy
   * eliksir") przychodzi jako blad i laduje w pasku komunikatow.
   */
  function wypijMiksture(slot: number) {
    setBlad(null);
    void zapytaj<{ gracz: Gracz }>('/mikstura/wypij', { slot })
      .then(({ gracz: g }) => setGracz(g))
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się wypić eliksiru.'));
  }

  function usunMiksture(miejsce: number) {
    setBlad(null);
    void zapytaj<{ gracz: Gracz }>('/mikstura/usun', { miejsce })
      .then(({ gracz: g }) => setGracz(g))
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się odwołać eliksiru.'));
  }

  /*
   * Stajnia. Ceny, dlugosc najmu i to, czy wolno wziac wierzchowca,
   * licza sie na serwerze — klient dostaje gotowe cztery boksy.
   */
  const wczytajStajnie = useCallback(() => {
    void zapytaj<StanStajni & { gracz?: Gracz }>('/stajnia')
      .then((s) => {
        setStajnia(s);
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Stajnia jest zamknięta.'));
  }, []);

  function wynajmijWierzchowca(wierzchowiec: number) {
    setBlad(null);
    void zapytaj<StanStajni & { gracz?: Gracz }>('/stajnia/kup', { wierzchowiec })
      .then((s) => {
        setStajnia(s);
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się wynająć.'));
  }

  /*
   * Karczma. Kazda akcja odsyla PELNY stan, wiec klient niczego nie liczy
   * sam — ani tego, czy wyprawa juz sie skonczyla, ani nagrod.
   */
  const wczytajKarczme = useCallback(() => {
    void zapytaj<StanKarczmy>('/karczma')
      .then((s) => {
        setKarczma(s);
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Karczma milczy.'));
  }, []);

  function akcjaKarczmy(sciezka: string, dane?: unknown) {
    setBlad(null);
    void zapytaj<StanKarczmy>(sciezka, dane ?? {})
      .then((s) => {
        // Podjecie wyprawy odsyla sam stan wyprawy, reszte mamy juz u siebie.
        setKarczma((poprzedni) => (poprzedni ? { ...poprzedni, ...s } : s));
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się.'));
  }

  // Wejscie do karczmy rozlicza zakonczona wyprawe — jak w oryginale.
  useEffect(() => {
    if (zakladka === 'karczma' && gracz) wczytajKarczme();
  }, [zakladka, gracz, wczytajKarczme]);

  /*
   * Sklepy. Wejscie odswieza towar, jesli minela polnoc — tak samo jak
   * wejscie do karczmy rozlicza wyprawe.
   */
  const wczytajSklep = useCallback((numer: number) => {
    void zapytaj<StanSklepu>(`/sklep/${numer}`)
      .then((s) => {
        setSklep(s);
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Sklep jest zamknięty.'));
  }, []);

  function akcjaSklepu(sciezka: string, dane?: unknown) {
    setBlad(null);
    void zapytaj<StanSklepu>(sciezka, dane ?? {})
      .then((s) => {
        setSklep(s);
        if (s.gracz) setGracz(s.gracz);
      })
      .catch((e) => setBlad(e instanceof BladApi ? e.message : 'Nie udało się.'));
  }

  useEffect(() => {
    if (zakladka === 'zbrojownia' && gracz) wczytajSklep(0);
    if (zakladka === 'magia' && gracz) wczytajSklep(1);
    if (zakladka === 'stajnia' && gracz) wczytajStajnie();
  }, [zakladka, gracz, wczytajSklep]);

  function wyloguj() {
    zapomnijToken();
    setGracz(null);
    setBlad(null);
    setBrama('logowanie');
  }

  // ------------------------------------------------------- widoki --

  // `?diag=1` — strona sprawdzajaca kazda warstwe po kolei. Dziala takze
  // przed zalogowaniem, bo najczesciej wtedy jest potrzebna.
  if (new URLSearchParams(location.search).has('diag')) {
    return (
      <Rama maMenu={false}>
        <main className="tresc">
          <Diagnostyka />
        </main>
      </Rama>
    );
  }

  if (!gracz) {
    return (
      <Rama maMenu={false}>
        <main className="tresc">
          {brama === 'sprawdzam' && <p className="podpis">Wczytuję…</p>}

          {brama === 'logowanie' && (
            <Logowanie
              pracuje={pracuje}
              blad={blad}
              onNowyBohater={() => {
                setBlad(null);
                setBrama('tworzenie');
              }}
              onZaloguj={(nick, haslo) =>
                void sprobuj(() => zapytaj<OdpowiedzZTokenem>('/login', { nick, haslo }))
              }
            />
          )}

          {brama === 'tworzenie' && (
            <TworzeniePostaci
              pracuje={pracuje}
              blad={blad}
              onWroc={() => {
                setBlad(null);
                setBrama('logowanie');
              }}
              onZapisz={(dane: DanePostaci) =>
                void sprobuj(() =>
                  zapytaj<OdpowiedzZTokenem>('/register', {
                    nick: dane.nick,
                    email: dane.email,
                    haslo: dane.haslo,
                    rasa: dane.wyglad.rasa,
                    plec: dane.wyglad.plec,
                    klasa: dane.wyglad.klasa,
                    wyglad: dane.wyglad.czesci,
                  }),
                )
              }
            />
          )}
        </main>
      </Rama>
    );
  }

  let grupa = '';

  return (
    <Rama maMenu onWyloguj={wyloguj} blad={blad} onZamknijBlad={() => setBlad(null)}>
      <nav className="menu">
        {/*
          Zasoby u gory panelu — w kolejnosci z oryginalu: najpierw LICZBA,
          potem ikona, a calosc wyrownana do prawej krawedzi panelu.
          Zloto i srebro w jednym wierszu, grzyby w nastepnym.
        */}
        <div className="zasoby">
          <div className="linia" title="Złoto i srebro">
            <span>{Math.floor(gracz.srebro / 100).toLocaleString('pl-PL')}</span>
            <img src="/res/sfgame/if/icon_gold.png" alt="złota" />
            <span>{String(gracz.srebro % 100).padStart(2, '0')}</span>
            <img src="/res/sfgame/if/icon_silber.png" alt="srebra" />
          </div>
          <div className="linia" title="Grzyby">
            <span>{gracz.grzyby.toLocaleString('pl-PL')}</span>
            <img className="grzyb" src="/res/sfgame/if/icon_pilz.png" alt="grzybów" />
          </div>
        </div>

        <ul>
          {MENU.map((poz) => {
            // Przerwa (REL_IF_BTN_2 = 20) dzieli grupy — ale nie stoi przed
            // pierwszym przyciskiem, bo ten zaczyna sie dokladnie na y=180.
            const przerwa = grupa !== '' && poz.grupa !== grupa;
            grupa = poz.grupa;
            return (
              <li key={poz.klucz}>
                {przerwa && <div className="przerwa" />}
                <button
                  aria-current={zakladka === poz.klucz}
                  disabled={!GOTOWE.includes(poz.klucz)}
                  title={GOTOWE.includes(poz.klucz) ? undefined : 'Jeszcze nie gotowe'}
                  onClick={() => setZakladka(poz.klucz)}
                >
                  {/*
                    Kiedy bohater jest na wyprawie, przycisk karczmy
                    odlicza czas jej konca zamiast pokazywac nazwe — tak
                    samo robi oryginal, zeby nie trzeba bylo wchodzic do
                    karczmy tylko po to, zeby sprawdzic zegar.
                  */}
                  {poz.klucz === 'karczma' && odliczanie !== null ? odliczanie : poz.nazwa}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <main className={`tresc${PELNOEKRANOWE.includes(zakladka) ? ' pelny' : ''}`}>
        {zakladka === 'miasto' && <Miasto onIdzDo={(cel) => setZakladka(cel as Zakladka)} />}
        {zakladka === 'opcje' && <Opcje />}
        {/*
          Oba sklepy to ten sam ekran — rozni je numer, wyglad
          i asortyment, a nie uklad ani zasady.
        */}
        {(zakladka === 'zbrojownia' || zakladka === 'magia') && sklep && (
          <Sklep
            stan={sklep}
            gracz={gracz}
            wyglad={zakladka === 'magia' ? GABINET : ZBROJOWNIA}
            onKup={(miejsce: number, cel: number | null) =>
              akcjaSklepu(`/sklep/${sklep.numer}/kup`, { miejsce, cel: cel ?? 'zaloz' })
            }
            onSprzedaj={(slot: number) => akcjaSklepu(`/sklep/${sklep.numer}/sprzedaj`, { slot })}
            onWymien={() => akcjaSklepu(`/sklep/${sklep.numer}/wymien`)}
          />
        )}
        {zakladka === 'stajnia' && stajnia && (
          <Stajnia stan={stajnia} gracz={gracz} onWynajmij={wynajmijWierzchowca} />
        )}
        {zakladka === 'bohater' && (
          <Bohater
            gracz={gracz}
            onZapiszOpis={zapiszOpis}
            onPrzenies={przeniesPrzedmiot}
            onWypij={wypijMiksture}
            onUsunMiksture={usunMiksture}
            onDoStajni={() => setZakladka('stajnia')}
          />
        )}
        {zakladka === 'karczma' && karczma && (
          <Karczma
            stan={karczma}
            gracz={gracz}
            onPodejmij={(numer) => akcjaKarczmy('/karczma/podejmij', { numer })}
            onPrzerwij={() => akcjaKarczmy('/karczma/przerwij')}
            onPrzyspiesz={() => akcjaKarczmy('/karczma/przyspiesz')}
            onPiwo={() => akcjaKarczmy('/karczma/piwo')}
            onOdswiez={wczytajKarczme}
          />
        )}

        {/*
          Krzyzyk zamykajacy ekran — POS_IF_EXIT = (1220, 120), czyli
          (940, 20) wzgledem obszaru gry. W oryginale wraca nim sie
          z kazdego ekranu na plac miasta.
        */}
        {zakladka !== 'miasto' && (
          <button
            className="wyjscie"
            title="Wróć do miasta"
            aria-label="Wróć do miasta"
            onClick={() => setZakladka('miasto')}
          />
        )}
      </main>
    </Rama>
  );
}

/**
 * Krotki komunikat na dole ekranu gry.
 *
 * Oryginal przy odmowie po prostu odsylal niezmieniony stan i przedmiot
 * wracal na miejsce — gracz musial sam sie domyslic, dlaczego. Skoro
 * serwer i tak podaje powod, szkoda go chowac.
 */
function Komunikat({ tresc, onZnika }: { tresc: string; onZnika?: (() => void) | undefined }) {
  // `Play(SND_ERROR)` — oryginal odzywa sie tak przy kazdej odmowie.
  useEffect(() => {
    zagraj(BLAD);
  }, [tresc]);

  useEffect(() => {
    const licznik = setTimeout(() => onZnika?.(), 3500);
    return () => clearTimeout(licznik);
  }, [tresc, onZnika]);

  return (
    <div className="komunikat" role="status">
      {tresc}
    </div>
  );
}

/**
 * Ile zostalo do konca wyprawy, w postaci gotowej na przycisk menu.
 *
 * Zwraca `null`, kiedy bohater nie jest na wyprawie. Zegar jest
 * SERWEROWY: bierzemy roznice miedzy czasem serwera a przegladarki
 * w chwili odczytu stanu i odliczamy juz lokalnie, zeby nie pytac
 * serwera co sekunde.
 */
function useOdliczanieWyprawy(stan: StanKarczmy | null): string | null {
  const naWyprawie = stan?.status === 2;
  const koniec = stan?.koniec ?? 0;
  const teraz = stan?.teraz ?? 0;

  const [zostalo, setZostalo] = useState<number | null>(null);

  useEffect(() => {
    if (!naWyprawie) {
      setZostalo(null);
      return;
    }

    const przesuniecie = teraz * 1000 - Date.now();
    const przelicz = () =>
      setZostalo(Math.max(0, koniec - (Date.now() + przesuniecie) / 1000));

    przelicz();
    const licznik = setInterval(przelicz, 1000);
    return () => clearInterval(licznik);
  }, [naWyprawie, koniec, teraz]);

  return zostalo === null ? null : czas(zostalo);
}

/*
 * Telefon trzymany pionowo. Scena gry ma proporcje 1000x700 — polozona na
 * ekranie 390x844 zajmuje pasek na srodku i reszta stoi pusta. Gra jest
 * z zalozenia pozioma, wiec zamiast udawac, ze da sie inaczej, mowimy
 * o tym wprost.
 */
const PIONOWO = '(max-width: 640px) and (orientation: portrait)';

function useZapytanieMedia(zapytanie: string): boolean {
  return useSyncExternalStore(
    (zmiana) => {
      const pytanie = window.matchMedia(zapytanie);
      pytanie.addEventListener('change', zmiana);
      return () => pytanie.removeEventListener('change', zmiana);
    },
    () => window.matchMedia(zapytanie).matches,
    () => false,
  );
}

/**
 * Pas z tytulem u gory. W oryginale po jego lewej stronie stoi ItemShop,
 * po prawej wyjscie z gry — trzymamy sie tego ukladu.
 *
 * Ponizej pasa lezy scena: panel menu i ekran gry. `useSkalaSceny` mierzy
 * to miejsce i ustawia mnoznik `--skala`, z ktorego arkusz stylow wylicza
 * KAZDY rozmiar w grze. Dzieki temu uklad jest zawsze ten sam co
 * w oryginale i zawsze miesci sie w oknie.
 */
function Rama({
  children,
  maMenu,
  onWyloguj,
  blad,
  onZamknijBlad,
}: {
  children: React.ReactNode;
  maMenu: boolean;
  onWyloguj?: () => void;
  blad?: string | null;
  onZamknijBlad?: () => void;
}) {
  const pionowo = useZapytanieMedia(PIONOWO);
  const [mimoTo, setMimoTo] = useState(false);
  const scena = useSkalaSceny<HTMLDivElement>();

  /*
   * Klikniecie gra `click.mp3` — na KAZDYM przycisku i na wcisnieciu,
   * nie na puszczeniu. Oryginal wiesza to raz, w `DefineBtn`:
   *
   *     addEventListener(MouseEvent.MOUSE_DOWN, playClickSound);
   *
   * Jeden nasluch na calej grze robi to samo i nie trzeba pamietac
   * o dokladaniu go do kazdego nowego ekranu.
   */
  useEffect(() => {
    function naWcisniecie(zdarzenie: PointerEvent) {
      const cel = zdarzenie.target as Element | null;
      if (cel?.closest('button:not(:disabled)')) zagraj(KLIK);
    }

    document.addEventListener('pointerdown', naWcisniecie);
    return () => document.removeEventListener('pointerdown', naWcisniecie);
  }, []);

  return (
    <div className="gra">
      <div className={`scena${maMenu ? '' : ' bez-menu'}`} ref={scena}>
        <header className="gora">
          <h1>Lorein</h1>

          {onWyloguj && (
            <>
              <span className="link-gory lewy">ItemShop</span>
              <button className="link-gory prawy" onClick={onWyloguj}>
                Wyloguj
              </button>
            </>
          )}
        </header>

        {children}

        {blad && <Komunikat tresc={blad} onZnika={onZamknijBlad} />}
      </div>

      {pionowo && !mimoTo && (
        <div className="obroc">
          <div className="obroc-ikona" aria-hidden="true">
            ⟳
          </div>
          <p>Obróć telefon poziomo</p>
          <p className="podpis">Gra ma szeroki ekran — poziomo widać ją w całości.</p>
          <button type="button" className="przycisk drugi" onClick={() => setMimoTo(true)}>
            Graj mimo to
          </button>
        </div>
      )}
    </div>
  );
}
