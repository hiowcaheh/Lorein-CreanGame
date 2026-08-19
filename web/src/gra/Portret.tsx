/**
 * Portret postaci — warstwy PNG jedna na drugiej.
 *
 * Kilka warstw brakuje w oryginalnym komplecie grafik (np. jedna odmiana
 * brody u czlowieka). Zamiast pokazywac ikone zepsutego obrazka, po prostu
 * chowamy taka warstwe.
 */

import { warstwyPortretu, type Wyglad } from './portret';

export function Portret({ wyglad, opis }: { wyglad: Wyglad; opis?: string }) {
  return (
    <div className="portret" role="img" aria-label={opis ?? 'Portret postaci'}>
      {warstwyPortretu(wyglad).map((adres) => (
        <img
          key={adres}
          src={adres}
          alt=""
          loading="eager"
          onError={(e) => {
            e.currentTarget.style.display = 'none';
          }}
        />
      ))}
    </div>
  );
}
