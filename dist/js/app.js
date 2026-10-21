import {studio,navigation,reviews} from './data.js';
import {setupGallery,wrap} from './gallery.js?v=5';
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
     FLASH — SWIPE MOBILE RAF
     Drag libero col dito, snap morbido e nessun click involontario.
     Il movimento verticale della pagina resta nativo.
     ========================================= */
  const flashViewport = flashSlider.querySelector('.flash-stencils-viewport');
  const flashMobile = window.matchMedia('(max-width: 767px)');
  let flashGesture = null;
  let flashAnimationFrame = 0;
  let ignoreFlashClickUntil = 0;

  const findFlashTouch = (touches, id) =>
    Array.from(touches).find(touch => touch.identifier === id);

  function endFlashGesture(event, cancelled = false) {
    const gesture = flashGesture;
    if (!gesture) return;
    const finger = findFlashTouch(event.changedTouches, gesture.id);
    if (!finger) return;

    flashGesture = null;
    if (flashAnimationFrame) cancelAnimationFrame(flashAnimationFrame);
    flashAnimationFrame = 0;
    if (!gesture.dragging) return;

    const max = getMaxIndex();
    const dx = finger.clientX - gesture.startX;
    const startIndex = Math.max(0, Math.min(max,
      Math.round(-gesture.base / gesture.distance)));

    let target = startIndex;

    if (!cancelled) {
      // Una sola proiezione d'inerzia, limitata a circa una card.
      const recentlyMoved = performance.now() - gesture.lastTime < 110;
      const inertia = recentlyMoved
        ? Math.max(-gesture.distance * .85,
            Math.min(gesture.distance * .85, gesture.velocity * 110))
        : 0;
      target = Math.round(-(gesture.base + dx + inertia) / gesture.distance);
      target = Math.max(0, Math.min(max, target));

      // Swipe deliberato corto: avanza di uno stencil anche
      // quando non supera la metà della distanza fra le card.
      if (target === startIndex && Math.abs(dx) >= 34) {
        target = Math.max(0, Math.min(max, startIndex + (dx < 0 ? 1 : -1)));
      }
    }

    index = target;

    // Fissa il punto di rilascio e riattiva la transizione una
    // sola volta, evitando salti e layout ripetuti durante lo swipe.
    track.style.transform = `translate3d(${gesture.offset}px,0,0)`;
    void track.offsetWidth;
    track.classList.remove('is-touch-dragging');
    updateFlashSlider();

    // Lo swipe non deve aprire accidentalmente la foto ingrandita.
    ignoreFlashClickUntil = performance.now() + 350;
  }

  flashViewport.addEventListener('touchstart', event => {
    if (!flashMobile.matches || event.touches.length !== 1 || flashGesture) return;
    const finger = event.touches[0];
    flashGesture = {
      id: finger.identifier,
      startX: finger.clientX,
      startY: finger.clientY,
      lastX: finger.clientX,
      lastTime: performance.now(),
      velocity: 0,
      dragging: false,
      distance: 0,
      base: 0,
      offset: 0
    };
  }, { passive: true });

  flashViewport.addEventListener('touchmove', event => {
    const gesture = flashGesture;
    if (!gesture) return;
    const finger = findFlashTouch(event.touches, gesture.id);
    if (!finger) return;

    const dx = finger.clientX - gesture.startX;
    const dy = finger.clientY - gesture.startY;

    if (!gesture.dragging) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) < 8) return;
      if (Math.abs(dy) > Math.abs(dx)) {
        flashGesture = null; // scroll verticale normale
        return;
      }

      const step = items.length > 1
        ? items[1].offsetLeft - items[0].offsetLeft
        : 0;
      if (!step) {
        flashGesture = null;
        return;
      }

      // Se il dito arriva mentre è ancora in corso uno snap,
      // riparti dalla posizione visiva, senza salti.
      const matrix = getComputedStyle(track).transform;
      let base = -index * step;
      if (matrix && matrix !== 'none') {
        const start = matrix.indexOf('(');
        if (start >= 0 && matrix.endsWith(')')) {
          const values = matrix.slice(start + 1, -1).split(',').map(Number);
          const position = values.length === 16 ? values[12] : values[4];
          if (Number.isFinite(position)) base = position;
        }
      }

      gesture.base = base;
      gesture.offset = base;
      gesture.distance = step;
      gesture.dragging = true;
      track.classList.add('is-touch-dragging');
      track.style.transform = `translate3d(${base}px,0,0)`;
    }

    if (event.cancelable) event.preventDefault();

    const now = performance.now();
    const elapsed = now - gesture.lastTime;
    if (elapsed > 0) {
      const instantaneous = (finger.clientX - gesture.lastX) / elapsed;
      gesture.velocity = gesture.velocity * .4 + instantaneous * .6;
    }
    gesture.lastX = finger.clientX;
    gesture.lastTime = now;

    const end = -getMaxIndex() * gesture.distance;
    let offset = gesture.base + dx;

    // Piccola resistenza elastica solo oltre la prima/ultima card.
    if (offset > 0) offset = Math.min(22, offset * .18);
    if (offset < end) offset = Math.max(end - 22, end + (offset - end) * .18);

    gesture.offset = offset;

    // Al massimo una scrittura CSS per frame, anche con touch a 120 Hz.
    if (!flashAnimationFrame) {
      flashAnimationFrame = requestAnimationFrame(() => {
        flashAnimationFrame = 0;
        if (flashGesture?.dragging) {
          track.style.transform =
            `translate3d(${flashGesture.offset}px,0,0)`;
        }
      });
    }
  }, { passive: false });

  flashViewport.addEventListener('touchend', event => endFlashGesture(event));
  flashViewport.addEventListener('touchcancel', event =>
    endFlashGesture(event, true));

  flashViewport.addEventListener('click', event => {
    if (event.detail === 0 || performance.now() >= ignoreFlashClickUntil) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    ignoreFlashClickUntil = 0;
  }, true);


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