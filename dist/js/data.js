export const studio = {
 name: 'Tattooart Fiumicino', artist: 'Christian Giammarino', address: 'Via Coni Zugna, 83/A', locality: 'Isola Sacra · 00054 Fiumicino (RM)',
 phone: '+39 338 702 3834', phoneHref: 'tel:+393387023834', studioPhone: '06 6502 5334', studioPhoneHref: 'tel:+390665025334',
 whatsapp: 'https://wa.me/393387023834', instagram: 'https://www.instagram.com/tattooartfiumicino/',
 maps: 'https://maps.app.goo.gl/mRBrQePE4BEtHWvHA',
 mapEmbed: 'https://maps.google.com/maps?cid=121891793189483244&output=embed',
 bio: ['Mi chiamo Christian Giammarino e sono il tatuatore di Tattooart, a Fiumicino.', 'Per vedere i miei lavori, trovi il profilo Instagram dello studio qui sotto.', 'Se hai un’idea in mente, scrivimi indicando il soggetto, la zona del corpo e le dimensioni.']
};
export const navigation = [
  ['Home', 'home'],
  ['Christian', 'christian'],
  ['Lavori', 'lavori'],
  ['Flash', 'flash'],
  ['Recensioni', 'recensioni'],
  ['Contatti', 'contatti']
];
export const booking = {
 provider: 'whatsapp', // Extension point: replace createBookingUrl in booking.js for a future provider.
 services: [
  {id:'tattoo',label:'Tatuaggio',message:'Ciao Christian, vorrei informazioni per un tatuaggio.'},
  {id:'consultation',label:'Consulenza',message:'Ciao Christian, vorrei concordare una consulenza.'},
  {id:'piercing',label:'Piercing',message:'Ciao Christian, vorrei informazioni su un piercing.'}
 ]
};
// Short excerpts (24 quoted words total), verified on the source below on 2026-10-19.
export const reviewSource = 'https://esteticavicino.com/studi-di-tatuaggi/fiumicino/tattoo-artist-christian/';
export const reviews = [
 {author:'Mich',rating:5,text:'Studio bello e molto pulito, il Titolare un vero professionista',source:reviewSource,verified:'2026-10-19'},
 {author:'Sabrina Loddo',rating:5,text:'Bellissima esperienza!!',source:reviewSource,verified:'2026-10-19'},
 {author:'gessica sarpi',rating:5,text:'Lo studio bellissimo il Tatuatore che conosco da molti anni professionale',source:reviewSource,verified:'2026-10-19'}
];
export const faqs = [
 ['Come posso richiedere un tatuaggio?','Puoi contattare Christian su WhatsApp e descrivere la tua idea, indicando soggetto, posizione e dimensioni indicative.'],
 ['Come viene definito il preventivo?','Il preventivo dipende dal progetto. Una descrizione e un’immagine di riferimento possono aiutare a valutarlo.'],
 ['Posso inviare immagini di riferimento?','Sì, puoi inviare fotografie o disegni per spiegare meglio il risultato che desideri.'],
 ['Posso richiedere informazioni sui piercing?','Sì, puoi contattare direttamente lo studio per informazioni e disponibilità.'],
 ['Come posso concordare un appuntamento?','Puoi scrivere a Christian su WhatsApp oppure telefonare allo studio.']
];
export const flash = []; // Future verified designs only; no bookable stock images.
