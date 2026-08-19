/**
 * Ekran postaci.
 */

import { Portret } from '../gra/Portret';
import { NAZWY_KLAS, NAZWY_RAS } from '../gra/portret';
import type { Gracz } from '../gra/typy';

export function Bohater({ gracz }: { gracz: Gracz }) {
  return (
    <>
      <h2>{gracz.nick}</h2>

      <div className="kolumny">
        <div className="lewa">
          <div className="karta">
            <Portret
              wyglad={{ rasa: gracz.rasa, plec: gracz.plec, klasa: gracz.klasa, czesci: gracz.wyglad }}
              opis={`${gracz.nick} — ${NAZWY_RAS[gracz.rasa]}, ${NAZWY_KLAS[gracz.klasa]}`}
            />
            <p className="podpis">
              {NAZWY_RAS[gracz.rasa]} · {NAZWY_KLAS[gracz.klasa]}
            </p>

            <div className="pasek" title={`${gracz.doswiadczenie} / ${gracz.doNastepnegoPoziomu}`}>
              <div className="pasek-wypelnienie" style={{ width: `${Math.round(gracz.postepPoziomu * 100)}%` }} />
              <span className="pasek-opis">
                Poziom {gracz.poziom} · {gracz.doswiadczenie} / {gracz.doNastepnegoPoziomu} dośw.
              </span>
            </div>
          </div>
        </div>

        <div className="prawa">
          <div className="karta" style={{ marginBottom: '1rem' }}>
            <p className="podpis">Cechy</p>
            <dl className="cechy">
              <Cecha nazwa="Siła" wartosc={gracz.cechy.sila} wyrozniona={gracz.klasa === 1} />
              <Cecha nazwa="Zręczność" wartosc={gracz.cechy.zrecznosc} wyrozniona={gracz.klasa === 3} />
              <Cecha nazwa="Intelekt" wartosc={gracz.cechy.intelekt} wyrozniona={gracz.klasa === 2} />
              <Cecha nazwa="Wytrzymałość" wartosc={gracz.cechy.wytrzymalosc} />
              <Cecha nazwa="Szczęście" wartosc={gracz.cechy.szczescie} />
            </dl>
          </div>

          <div className="karta">
            <p className="podpis">Stan</p>
            <dl className="cechy">
              <Cecha nazwa="Życie" wartosc={gracz.zycie} />
              <Cecha nazwa="Honor" wartosc={gracz.honor} />
              <Cecha nazwa="Srebro" wartosc={gracz.srebro} />
              <Cecha nazwa="Grzyby" wartosc={gracz.grzyby} />
            </dl>
          </div>
        </div>
      </div>
    </>
  );
}

function Cecha({ nazwa, wartosc, wyrozniona }: { nazwa: string; wartosc: number; wyrozniona?: boolean }) {
  return (
    <>
      <dt className={wyrozniona ? 'glowna' : undefined}>{nazwa}</dt>
      <dd className={wyrozniona ? 'glowna' : undefined}>{wartosc.toLocaleString('pl-PL')}</dd>
    </>
  );
}
