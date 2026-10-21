import {studio,navigation,reviews} from './data.js';
import {setupGallery,wrap} from './gallery.js?v=3';
import {setupBooking} from './booking.js?v=2';
import {photos} from './photos.js';
const $=selector=>document.querySelector(selector);
document.querySelectorAll('[data-link]').forEach(a=>{a.href=studio[a.dataset.link];});
document.querySelectorAll('[data-text]').forEach(el=>{el.textContent=studio[el.dataset.text];});
$('#year').textContent=new Date().getFullYear();
navigation.forEach(([label,id])=>{const a=document.createElement('a');a.href=`#${id}`;a.textContent=label;$('#navigation').append(a);});
const menu=$('.menu-toggle');function closeMenu(){menu.setAttribute('aria-expanded','false');$('#navigation').classList.remove('is-open');menu.setAttribute('aria-label','Apri menu');}
menu.addEventListener('click',()=>{const open=menu.getAttribute('aria-expanded')!=='true';menu.setAttribute('aria-expanded',String(open));menu.setAttribute('aria-label',open?'Chiudi menu':'Apri menu');$('#navigation').classList.toggle('is-open',open);});
$('#navigation').addEventListener('click',e=>{if(e.target.closest('a'))closeMenu();});
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&menu.getAttribute('aria-expanded')==='true'){closeMenu();menu.focus();}});
document.addEventListener('click',e=>{if(!e.target.closest('.site-header'))closeMenu();});
studio.bio.forEach(text=>{const p=document.createElement('p');p.textContent=text;$('#bio').append(p);});
function assignPhoto(selector,filename){const p=photos.find(p=>p.filename===filename);const img=$(selector);img.src=p.path;img.alt=`${p.description_it} Fotografia illustrativa, non dello studio Tattooart.`;}
const artistMain = document.querySelector('#artist-main');

artistMain.src = 'assets/christian.jpg';
artistMain.alt = 'Christian Giammarino, tatuatore di Tattooart Fiumicino';

assignPhoto('#artist-detail', 'process-detail.webp');
setupBooking();setupGallery(photos.filter(p=>p.hero!==false));
document.querySelectorAll('dialog:not(#flash-lightbox):not(#lightbox):not(#booking-dialog)').forEach(dialog=>{dialog.querySelector('[data-close]').addEventListener('click',()=>dialog.close());dialog.addEventListener('click',e=>{const r=dialog.getBoundingClientRect();if(e.target===dialog&&(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom))dialog.close();});});
let reviewIndex=0;
function renderReview(){const r=reviews[reviewIndex];$('#review-text').textContent=`“${r.text}…”`;$('#review-author').textContent=r.author;$('#review-stars').textContent='★'.repeat(r.rating);$('#review-stars').setAttribute('aria-label',`${r.rating} su 5 stelle`);$('#review-source').href=r.source;$('#review-count').textContent=`${String(reviewIndex+1).padStart(2,'0')} / ${String(reviews.length).padStart(2,'0')}`;const stage=$('.review-stage');stage.classList.remove('changing');requestAnimationFrame(()=>stage.classList.add('changing'));}
$('#review-prev').addEventListener('click',()=>{reviewIndex=wrap(reviewIndex-1,reviews.length);renderReview();});$('#review-next').addEventListener('click',()=>{reviewIndex=wrap(reviewIndex+1,reviews.length);renderReview();});renderReview();


/* =========================================
   MAPPA CONTATTI — CARICAMENTO SU CLICK
   ========================================= */

const mapPanel = document.querySelector('#map-panel');
const mapIntro = document.querySelector('#map-intro');
const loadMapButton = document.querySelector('#load-map');
const unloadMapButton = document.querySelector('#unload-map');

if (mapPanel && mapIntro && loadMapButton && unloadMapButton) {

  loadMapButton.addEventListener('click', () => {

    // Evita di creare due iframe.
    if (mapPanel.querySelector('iframe')) return;

    const iframe = document.createElement('iframe');

    iframe.src = studio.mapEmbed;
    iframe.title = 'Google Maps — Tattooart Fiumicino, Via Coni Zugna 83/A';
    iframe.loading = 'lazy';
    iframe.referrerPolicy = 'no-referrer-when-downgrade';
    iframe.allowFullscreen = true;

    mapIntro.hidden = true;
    mapPanel.append(iframe);

    unloadMapButton.hidden = false;
  });

  unloadMapButton.addEventListener('click', () => {

    mapPanel.querySelector('iframe')?.remove();

    mapIntro.hidden = false;
    unloadMapButton.hidden = true;

    loadMapButton.focus();
  });

}


// No tracking, external font requests, localStorage or direct booking data collection.
if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
 const observer=new IntersectionObserver(entries=>entries.forEach(entry=>{if(entry.isIntersecting){entry.target.animate([{opacity:.35,translate:'0 18px'},{opacity:1,translate:'0 0'}],{duration:650,easing:'ease-out'});observer.unobserve(entry.target);}}),{threshold:.12});
document.querySelectorAll('.artist-layout,.portfolio-heading,.flash-stencils-head,.visit-layout').forEach(el=>observer.observe(el));
}


/* =========================================
   FLASH STENCILS SLIDER
   ========================================= */

const flashSlider = document.querySelector('[data-flash-slider]');

if (flashSlider) {
  const track = flashSlider.querySelector('[data-flash-track]');
  const items = [...track.querySelectorAll('.flash-stencil-item')];
  const prevBtn = flashSlider.querySelector('[data-flash-prev]');
  const nextBtn = flashSlider.querySelector('[data-flash-next]');
  const dotsWrap = document.querySelector('[data-flash-dots]');

  let index = 0;

  function getVisibleCount() {
  return window.innerWidth <= 1024 ? 2 : 4;
}

  function getMaxIndex() {
    return Math.max(0, items.length - getVisibleCount());
  }

  function buildDots() {
    dotsWrap.innerHTML = '';
    const pages = getMaxIndex() + 1;

    for (let i = 0; i < pages; i++) {
      const dot = document.createElement('button');
      dot.type = 'button';
      dot.setAttribute('aria-label', `Vai alla slide ${i + 1}`);
      if (i === index) dot.classList.add('is-active');
      dot.addEventListener('click', () => {
        index = i;
        updateFlashSlider();
      });
      dotsWrap.append(dot);
    }
  }

function updateDots() {
  [...dotsWrap.children].forEach((dot, i) => {
    dot.classList.toggle('is-active', i === index);
  });

  // Disabilita le frecce quando non ci sono
  // altre fotografie nella direzione scelta.
  prevBtn.disabled = index === 0;
  nextBtn.disabled = index >= getMaxIndex();
}

function updateFlashSlider() {
  if (items.length < 2) return;

  // Calcola la distanza reale tra due fotografie.
  // Funziona anche quando cambiano le dimensioni dello schermo.
  const distance =
    items[1].offsetLeft - items[0].offsetLeft;

  const max = getMaxIndex();
  index = Math.max(0, Math.min(index, max));

  track.style.transform =
    `translate3d(${-index * distance}px, 0, 0)`;

  updateDots();
}

prevBtn.addEventListener('click', () => {
  if (index <= 0) return;

  index--;
  updateFlashSlider();
});

nextBtn.addEventListener('click', () => {
  if (index >= getMaxIndex()) return;

  index++;
  updateFlashSlider();
});

  window.addEventListener('resize', () => {
    const max = getMaxIndex();
    if (index > max) index = max;
    buildDots();
    updateFlashSlider();
  });

  buildDots();
  updateFlashSlider();


/* =========================================
   FLASH TATTOOS — MODALE
   ========================================= */

const flashLightbox =
  document.querySelector('#flash-lightbox');

const flashLightboxImg =
  document.querySelector('#flash-lightbox-img');

const flashLightboxCaption =
  document.querySelector('#flash-lightbox-caption');

const flashCloseButton =
  flashLightbox.querySelector('.flash-lightbox-close');

const flashReducedMotion =
  window.matchMedia('(prefers-reduced-motion: reduce)');

let flashIsClosing = false;


// APERTURA CON FADE-IN

function openFlashLightbox(image) {
  if (flashLightbox.open || flashIsClosing) return;

  flashLightboxImg.src = image.currentSrc || image.src;
  flashLightboxImg.alt = image.alt;

  flashLightboxCaption.textContent = image.alt;

  flashLightbox.showModal();

  // Lascia al browser un frame per applicare
  // lo stato iniziale prima dell'animazione.
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (flashLightbox.open && !flashIsClosing) {
        flashLightbox.classList.add('is-visible');
      }
    });
  });
}


// CHIUSURA CON FADE-OUT

function closeFlashLightbox() {
  if (!flashLightbox.open || flashIsClosing) return;

  flashIsClosing = true;

  flashLightbox.classList.remove('is-visible');

  const duration = flashReducedMotion.matches
    ? 0
    : 300;

  setTimeout(() => {
    if (flashLightbox.open) {
      flashLightbox.close();
    }

    flashLightboxImg.removeAttribute('src');
    flashIsClosing = false;
  }, duration);
}


// CLICK SULLE FOTOGRAFIE

items.forEach(item => {
  item.addEventListener('click', event => {
    event.preventDefault();

    const image = item.querySelector('img');

    if (!image) return;

    openFlashLightbox(image);
  });
});


// CHIUSURA TRAMITE X

flashCloseButton.addEventListener(
  'click',
  closeFlashLightbox
);


// CHIUSURA TRAMITE ESC

flashLightbox.addEventListener('cancel', event => {
  event.preventDefault();
  closeFlashLightbox();
});


// CHIUSURA CLICCANDO FUORI

flashLightbox.addEventListener('click', event => {
  if (event.target !== flashLightbox) return;

  const rect = flashLightbox.getBoundingClientRect();

  const outside =
    event.clientX < rect.left ||
    event.clientX > rect.right ||
    event.clientY < rect.top ||
    event.clientY > rect.bottom;

  if (outside) {
    closeFlashLightbox();
  }
});


}