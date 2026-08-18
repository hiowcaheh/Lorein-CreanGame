
//#######################
//## P A P A Y A
//## Playa Payment
//## 

/////////////////////////////////
// Look & Feel

// Im Folgenden wird das Aussehen der Oberfläche und der Bedienelemente festgelegt.

// Sprachcode
language code							en

// Ländercode
country code							de
// Währungssymbol
//currency symbol					
// Root für alle Bilder, kann absolut oder relativ sein. Muss auf "/" enden.
image root								res/sfgame/
//ingame currency								Mushrooms
ingame currency								Mushrooms
// Schriftart
font name									Gorilla Milkshake
font embedded							1
font size							22

// Dient der Unterscheidung zwischen Projekten beim Payment
gameid										1

// Die Sprachdatei
language file prefix			lang/papaya_
language file suffix			.txt


micropayment graphics	16453-AB5113DE2F
micropayment background	shakes1
micropayment backgroundcolor	000000
// Local Shared Object
// Hier wird die zuletzt gewählte Paymentmethode gespeichert.
lso name									papayaSF<$serverid>

// Abmessungen der benutzten Bildfläche
stage width								1000
stage height							700

icon font size						19
icon font color					0xFFFFFF
button font size					22
button font color				0xF5D174
button font color hover	0xF5D174
button font glow hover		1
popup font size					20
popup font color					0xF0C042
popup line color					0xF0C042
popup background color		0x000000
popup background alpha		0.6
popup margin left				4
popup margin right				4
popup margin top					4
popup margin bottom			0
savings font color			0x00FF00

// Vorausladen von Grafiken, die innerhalb von Buttontexten vorkommen
// z.B. für Ingame-Währungssymbol
preload image							if/icon_pilz.png

// Die Grafiken für die Buttons
button image idle				if/interface_basicbutton_idle.png
button image hover				if/interface_basicbutton_hover.png
button image down				if/interface_basicbutton_down.png

// Wobbleeffekteinstellungen
wobble speed				0.025
// wobble amount				0.5
// choice glow				0.5
// choice glow color				0xFFFFFF

// Die relative Verschiebung der Buttongrafik im gedrückten Zustand
button down shift x			1
button down shift y			2

// Der Klick-Sound
button click sound				sfx/click.mp3

icon image idle					scr/shops/payicon<%1>.png
icon image hover					scr/shops/payicon<%1>_hover.png

icon menu radius					250
icon menu x								500
icon menu y								330
icon label distance			-5

default background				scr/shops/dealer_old.jpg

// <%1>=Anzahl, <$2>=Preis mit Komma, <$3>=Preis mit Punkt, <$4>=Preis ohne Trennzeichen, 
// <$5>=Preis Hauptteil, <$6>=Preis Centanteil, <$7>=Währungssymbol der Bezahlmethode (obsolet), 
// <$8>=Währungs-Code, <$9>=Währungssymbol, <$10> Preis unformatiert

payment button text			<%1><*if/icon_pilz.png*><$9><$10>

////////////////////////////////////////
// Specials

// Specials sind "Dealer-Aktionen", also saisonale Sonderangebote.
// Die einzelnen Specials unterscheiden sich nur durch ihre grafische Ausgestaltung.
specials count						10
special										<%special>

special background				scr/shops/dealer_aktion<%1>_en.jpg

///////////////////////////////////////
// Click Areas

// "Schilder"

// Schild links
click area index					1
click area x							10
click area y							135
click area width					190
click area height				170
click area hint					Hallo
click area request				
click area link					http://google.it

// Schild rechts unten
click area index					2
click area x							800
click area y							420
click area width					190
click area height				170
click area hint					Welt
click area request				
click area link					http://internet-online.info

// durch / getrennte Auflistung der Clickareas, je nach Special
default click areas			
special 1 click areas		
special 2 click areas		
special 3 click areas		
special 4 click areas		
special 5 click areas		
special 6 click areas		
special 7 click areas		
special 8 click areas		
special 9 click areas		
special 10 click areas		
special 11 click areas		
special 12 click areas		
special 13 click areas		
special 14 click areas		
special 15 click areas		

/////////////////////////////////////////
// Zusatzgrafiken

// Definition der einzelnen Grafiken
// normale (transparente) Augen
image index								1
image file								scr/shops/pilzdealer_augen1.png
image x										325
image y										165

image index								2
image file								scr/shops/pilzdealer_augen2.png
image x										325
image y										165

image index								3
image file								scr/shops/pilzdealer_augen3.png
image x										325
image y										165

image index								4
image file								scr/shops/pilzdealer_augen4.png
image x										325
image y										165

// crazy Augen
image index								5
image file								scr/shops/pilzdealer_augen_crazy1.jpg
image x										315
image y										155

image index								6
image file								scr/shops/pilzdealer_augen_crazy2.jpg
image x										315
image y										155

image index								7
image file								scr/shops/pilzdealer_augen_crazy3.jpg
image x										315
image y										155

image index								8
image file								scr/shops/pilzdealer_augen_crazy4.jpg
image x										315
image y										155

//image index								9
//image file								scr/shops/pilzdealer_augen_crazy4.jpg
//image x										315
//image y										155

// Arme
image index								20
image file								scr/shops/pilzdealer_arm1.jpg
image x										175
image y										165

image index								21
image file								scr/shops/pilzdealer_arm2.jpg
image x										175
image y										165

image index								22
image file								scr/shops/pilzdealer_arm3.jpg
image x										175
image y										165

image index								23
image file								scr/shops/pilzdealer_arm4.jpg
image x										175
image y										165


// Durch / getrennte Auflistungen der zu setzenden Zusatzgrafiken je nach Special
default images						20/21/22/23/1/2/3/4
special 1 images					
//special 2 images					1/2/3/4
special 2 images					
special 3 images					1/2/3/4
special 4 images					
special 5 images					
special 6 images					
special 7 images					
special 8 images					
special 9 images					
special 10 images					
special 11 images					
special 12 images					
special 13 images					
special 14 images					
special 15 images					

// Zufällige Bilder anzeigen
randomize on click				1/2/3/4
//randomize on click				5/6/7/8
randomize on show				20/21/22/23
blink eyes								1/2/3/4/5/6/7/8

flag path	if/country_flags/flag_<$1>.png
flag position x	30
flag position y	660
flag distance x	10
flag distance y	0
flag select growth	1.5

available countries		

special bonus rate	1.2

wire transfer command	530

payment method name		Free
payment method index		9
payment method request		
payment method function		
payment method link		
payment method rate modifier		1.0
payment method amounts		

link button 9 text		ItemShop
link button 9 hint		ItemShop
link button 9 request		
link button 9 link		shop
link button 9 function		

payment methods de	9
default method de	9

