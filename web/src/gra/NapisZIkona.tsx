/**
 * Napis przycisku z ikonami waluty.
 *
 * Oryginal koduje je w tekscie tyldą i litera, a `SetBtnText` podmienia
 * na obrazek (linia 4868 `MainTimeline.as`):
 *
 *     if (char == "~") {
 *         if (caption.charAt(i) == "P") { btnText += "     "; imgActor = IMG_IF_PILZE; }
 *         else if (caption.charAt(i) == "G") { ... IMG_IF_GOLD }
 *         else if (caption.charAt(i) == "S") { ... IMG_IF_SILBER }
 *     }
 *
 * Bez tego „Napij sie (1~P)" wyswietlalo sie doslownie, z tylda.
 */

const IKONY: Record<string, { plik: string; opis: string }> = {
  P: { plik: '/res/sfgame/if/icon_pilz.png', opis: 'grzyb' },
  G: { plik: '/res/sfgame/if/icon_gold.png', opis: 'złoto' },
  S: { plik: '/res/sfgame/if/icon_silber.png', opis: 'srebro' },
};

export function NapisZIkona({ tekst }: { tekst: string }) {
  const czesci: React.ReactNode[] = [];
  let zebrane = '';

  for (let i = 0; i < tekst.length; i++) {
    const znak = tekst[i]!;
    const ikona = znak === '~' ? IKONY[tekst[i + 1] ?? ''] : undefined;

    if (!ikona) {
      zebrane += znak;
      continue;
    }

    if (zebrane !== '') czesci.push(zebrane);
    zebrane = '';
    czesci.push(<img key={i} className="napis-ikona" src={ikona.plik} alt={ikona.opis} />);
    i += 1;
  }

  if (zebrane !== '') czesci.push(zebrane);
  return <>{czesci}</>;
}
