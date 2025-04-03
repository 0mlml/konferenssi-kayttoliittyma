### Työkalut
- Node v22.14.0
- Angular CLI v19.2.5
- VSC "Angular Language Service" ja "GitHub Copilot" laajennukset
  - Löysin että GitHub Copilot ja muut tekoälyt ei oiken tykänneet modernista Angular syntaxista jota luin [angular.dev](https://angular.dev):istä
- Claude

### Prosessi

Lähdin ratkaisemaan tehtävää ensiksi sillä että latasin angular työkalut `$ sudo npm install -g @angular/cli` komennolla. Sitten docs:ejen mukaan löin uuden työtilan `$ ng new konferenssi-kayttoliittyma` komenolla. Laitoin heti 'dev' palvelimen päälle taustalle. 

Ensimmäiseksi kirjoitin käyttöliittymän componentin joka on sovelluksen luuranko. 
Tein tässä vaiheessa kaikki lopulliset design-ratkaisut sivusta ja totesin suunilleen miltä mun data rakenteet näyttää.

Ensin ratkasin miten tuun käsittelemään interaktiot, ts. "näydyt" työpajat ja osallistujat, koska tää oli ongelman ydin. 
Käytän kahta taulukkoa jossa on settejä (`Set<number>[]`). Tällä helposti pääsee kattomaan että kuka on "nähnyt" mitä.
Esimerkiksi: Jos haluaa tietää että onko osallistuja 2 käynyt työpajassa 3, niin voi tarkistaa tämän näin: `seenWorkshops[2].has(3);`.
Algoritmi perustuu siihen että ensimmäisellä kierroksella kuin kukaan ei ole vielä käynyt missään tai näynyt ketään, 
algoritmi levittää kaikki tasaisesti. Sitten jatkuvilla kierrkoksilla yksinkertaisesti yritetään laittaa kaikki sopiviin työpajoihin.
Algoritmissä on pari optimisaatioa luomaan paremman tuloksen: 
se yrittää täyttää tyhjät työpajat ekaks ja aloittaa täyttämään osallistujilla ketkä ovat osallistuneet vähiten.
Joskus on mahdollista että osallistuja jää kierrokselta pois.
Lopun tietää helposti tarkistamalla että "nähtyjen" työpajojen taulukossa kaikki setit ovat saman kokosia kuin määrä työpajoja.

Angular:in käyttö oli hyvin yksinkertaista tässä projektissa kuin pää komponentti on vain 70 viivaa pitkä. Luulen että tässä on paljon ylijäämä tästä syystä koska aloiten Angular:in mallilla

Kun olin tyytyväinen tulokseen annoin Claude:ille `app.component.html`:n ja pyysin sen luomaan `app.component.scss`:n