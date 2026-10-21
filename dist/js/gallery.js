import {setupHeroSmoke} from './hero-smoke.js?v=fix-fumo-1';
export function wrap(index, length) { return ((index % length) + length) % length; }
export function relativePosition(index, current, length) {
 let d = wrap(index - current, length);
 if (d > length / 2) d -= length;
 return d;
}
function orbitRadius(viewport) {
 return viewport < 768
  ? Math.min(310, Math.max(250, viewport * .8))
  : Math.min(740, Math.max(420, viewport * .5));
}
export function cardTransform(distance, viewport) {
 const mobile = viewport < 768;
 const angle = distance * (mobile ? .63 : .39);
 // Ellisse 3D reale: la card centrale esce verso l'utente;
 // quelle ai lati ruotano e rientrano in profondità.
 return {
  x: orbitRadius(viewport) * Math.sin(angle),
  y: Math.min(Math.abs(distance), 3) * (mobile ? 3 : 7),
  z: (mobile ? 40 : 75) - (mobile ? 220 : 525) * (1 - Math.cos(angle)),
  rotation: -angle * (mobile ? .8 : .9) * 180 / Math.PI
 };
}
export function setupGallery(photos) {
 const carousel = document.querySelector('#carousel');
 const board = document.querySelector('#board');
 const lightbox = document.querySelector('#lightbox');
 let current = 0, enlarged = 0, pointerStart = null, dragged = false;
 let navigatingToCard = false;
 let lastDragEnd = -1000;
 const reducedMotion=window.matchMedia('(prefers-reduced-motion: reduce)');
 let entrance=[];
 function finishEntrance(){entrance.forEach(a=>a.cancel());entrance=[];document.querySelector('.hero').classList.remove('hero-entering');}
 const transform=t=>`translate(-50%, 0) translate3d(${t.x}px, ${t.y}px, ${t.z}px) rotateY(${t.rotation}deg)`;
 const photoName = p => p.description_it;
 const imagePath = p => p.path || `assets/photos/${p.filename}`;
 const cards = photos.map((p, i) => {
  const button = document.createElement('button'); button.className = 'carousel-card';
  button.setAttribute('aria-label', `Ingrandisci: ${photoName(p)}`);
  const img = document.createElement('img'); img.src = imagePath(p); img.alt = photoName(p); img.draggable = false; img.width = 600; img.height = 850;
  img.loading = 'eager';
  img.decoding = 'async'; if (i === 0) img.fetchPriority = 'high';
  const label = document.createElement('span'); label.className = 'photo-index'; label.textContent = `${String(i+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
  button.append(img,label); carousel.append(button);
button.addEventListener('click', event => {
  if (dragged || navigatingToCard || arrowFrame ||
      (event.detail !== 0 && performance.now() - lastDragEnd < 320)) return;

  if (i === current) {
    open(i);
  } else {
    goToCard(i);
  }
});
  return button;
 });
 // A fine orbita le card spariscono prima del riciclo sul lato opposto.
 function orbitOpacity(distance) {
  const edge = photos.length / 2;
  const start = Math.min(edge - .55, window.innerWidth < 768 ? 1.5 : 2.35);
  const end = Math.max(start + .05, edge - .16);
  const t = Math.max(0, Math.min(1, (end - Math.abs(distance)) / (end - start)));
  return t * t * (3 - 2 * t);
 }

 function paintOrbit(position, settled = false) {
  const viewport = window.innerWidth;
  const active = wrap(Math.round(position), photos.length);
  cards.forEach((card, i) => {
   const d = relativePosition(i, position, photos.length);
   const opacity = orbitOpacity(d);
   card.style.transform = transform(cardTransform(d, viewport));
   card.style.opacity = String(opacity);
   card.style.zIndex = String(100 - Math.round(Math.abs(d) * 10));
   card.style.pointerEvents = opacity > .12 ? 'auto' : 'none';
   if (settled) {
    card.dataset.distance = String(d);
    card.tabIndex = i === active ? 0 : -1;
    card.setAttribute('aria-hidden', String(opacity < .12));
   }
  });
  document.querySelector('#hero-count').textContent =
   `${String(active + 1).padStart(2, '0')} / ${String(photos.length).padStart(2, '0')}`;
 }
 function render() { paintOrbit(current, true); }
// Scorre fino alla fotografia selezionata,
// passando attraverso tutte le posizioni intermedie.


function goToCard(target) {
  if (navigatingToCard || target === current) return;

  navigatingToCard = true;
  finishEntrance();

  const from = current;
  const distance = relativePosition(
    target,
    from,
    photos.length
  );

  // Un'unica animazione, anche per più fotografie.
  const duration = Math.min(
    950,
    450 + Math.abs(distance) * 120
  );

  const savedTransitions = cards.map(
    card => card.style.transition
  );

  // Disattiva le transizioni CSS mentre
  // gestiamo il movimento continuo.
  cards.forEach(card => {
    card.style.transition = 'none';
    card.style.pointerEvents = 'none';
  });

  function finish() {
    current = target;

    // Allinea tutte le card alla posizione finale.
    cards.forEach((card, i) => {
      card.dataset.distance = String(
        relativePosition(i, current, photos.length)
      );
    });

    render();

    cards.forEach((card, i) => {
      card.style.transition = savedTransitions[i];
    });

    navigatingToCard = false;
  }

  if (reducedMotion.matches) {
    finish();
    return;
  }

  let started;

  function animateFrame(time) {
    if (started === undefined) started = time;

    const progress = Math.min(
      1,
      (time - started) / duration
    );

    // Accelerazione e decelerazione morbide,
    // senza soste fra una foto e l'altra.
    const eased =
      progress * progress * (3 - 2 * progress);

    // Posizione continua, anche oltre
    // la prima e l'ultima fotografia.
    const visualPosition =
      from + distance * eased;

    renderDrag(visualPosition);

    if (progress < 1) {
      requestAnimationFrame(animateFrame);
    } else {
      finish();
    }
  }

  requestAnimationFrame(animateFrame);
}



// Movimento singolo tramite frecce e swipe.


/* =========================================
   FRECCE HERO — MOVIMENTO CONTINUO
   ========================================= */

let arrowFrame = 0;
let arrowPosition = current;
let arrowTarget = current;
let arrowLastTime = 0;

function animateArrow(time) {
  const dt = arrowLastTime
    ? Math.min(time - arrowLastTime, 50)
    : 16;

  arrowLastTime = time;

  // La destinazione può cambiare mentre
  // l'animazione è già in corso.
  const remaining = arrowTarget - arrowPosition;

  const easing = 1 - Math.exp(-dt / 145);

  arrowPosition += remaining * easing;

  if (Math.abs(arrowTarget - arrowPosition) < 0.01) {
    arrowPosition = arrowTarget;
  }

  // Usa il movimento Infinity già presente
  // nel tuo file, senza creare animazioni ghost.
  renderDrag(arrowPosition);

  if (arrowPosition !== arrowTarget) {
    arrowFrame = requestAnimationFrame(animateArrow);
    return;
  }

  // Movimento completato.
  arrowFrame = 0;

  current = wrap(
    Math.round(arrowTarget),
    photos.length
  );

  // Evita che render() interpreti la chiusura
  // del giro come un salto da animare.
  cards.forEach((card, i) => {
    card.dataset.distance = String(
      relativePosition(i, current, photos.length)
    );
  });

  render();

  carousel.classList.remove('is-dragging');

  cards.forEach(card => {
    card.style.transition = '';
  });

  arrowPosition = current;
  arrowTarget = current;
  arrowLastTime = 0;
}

function step(n) {
  if (navigatingToCard || pointerStart) return;

  finishEntrance();

  if (!arrowFrame) {
    arrowPosition = current;
    arrowTarget = current;
    arrowLastTime = 0;

    // Blocca le transizioni CSS durante
    // il movimento controllato dal JavaScript.
    carousel.classList.add('is-dragging');

    cards.forEach(card => {
      card.getAnimations().forEach(animation => {
        animation.cancel();
      });

      card.style.transition = 'none';
    });

    // Rimuove eventuali copie temporanee
    // rimaste da vecchie animazioni Infinity.
    carousel
      .querySelectorAll('.carousel-card')
      .forEach(card => {
        if (!cards.includes(card)) {
          card.remove();
        }
      });
  }

  // Ogni click aggiunge una posizione
  // alla destinazione, senza riavviare
  // o bloccare l'animazione in corso.
  arrowTarget += n;

  if (!arrowFrame) {
    arrowFrame = requestAnimationFrame(animateArrow);
  }
}

 document.querySelector('#hero-prev').addEventListener('click',()=>step(-1));
 document.querySelector('#hero-next').addEventListener('click',()=>step(1));
 carousel.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();step(e.key==='ArrowLeft'?-1:1);}else if((e.key==='Enter'||e.key===' ')&&e.target===carousel){e.preventDefault();open(current);}});

/* =========================================
   DRAG & SWIPE — INFINITY CONTINUO
   Mouse + Touch
   ========================================= */

let dragPosition = current;
let dragFrame = 0;

// Usa la stessa spaziatura del carosello 3D.
function dragSpacing() {
  const width = window.innerWidth;
  return orbitRadius(width) * Math.sin(width < 768 ? .63 : .39);
}

// Disegna le fotografie lungo un percorso continuo,
// senza limiti di inizio o fine.
function renderDrag(position) { paintOrbit(position, false); }

// Quando lasci il mouse o il dito,
// il carosello si assesta sulla foto più vicina.
function settleDrag(target) {
  const from = dragPosition;
  navigatingToCard = true;

  function finish() {
    dragPosition = target;
    current = wrap(target, photos.length);

    // Sincronizza le posizioni per evitare
    // animazioni di ritorno indesiderate.
    cards.forEach((card, i) => {
      card.dataset.distance = String(
        relativePosition(i, current, photos.length)
      );
      card.style.transition = '';
    });

    carousel.classList.remove('is-dragging');
    render();

    navigatingToCard = false;
  }

  if (
    reducedMotion.matches ||
    Math.abs(target - from) < 0.001
  ) {
    finish();
    return;
  }

  const duration = Math.min(
    420,
    200 + Math.abs(target - from) * 130
  );

  let startTime = null;

  function frame(time) {
    if (startTime === null) startTime = time;

    const progress = Math.min(
      1,
      (time - startTime) / duration
    );

    const eased = 1 - Math.pow(1 - progress, 3);

    dragPosition = from + (target - from) * eased;

    renderDrag(dragPosition);

    if (progress < 1) {
      requestAnimationFrame(frame);
    } else {
      finish();
    }
  }

  requestAnimationFrame(frame);
}

// INIZIO TRASCINAMENTO
carousel.addEventListener('pointerdown', e => {
    if (
    e.button !== 0 ||
    navigatingToCard ||
    arrowFrame ||
    pointerStart
    ) return;

  finishEntrance();

  dragPosition = current;

  pointerStart = {
    id: e.pointerId,
    x: e.clientX,
    y: e.clientY,
    lastX: e.clientX,
    lastTime: performance.now(),
    velocity: 0
  };

  dragged = false;
});

// MOVIMENTO LIBERO E INFINITO
carousel.addEventListener('pointermove', e => {
  if (
    !pointerStart ||
    e.pointerId !== pointerStart.id
  ) return;

  const dx = e.clientX - pointerStart.x;
  const dy = e.clientY - pointerStart.y;

  if (!dragged) {
    // Non ostacola lo scroll verticale della pagina.
    if (
      Math.abs(dx) < 10 ||
      Math.abs(dx) <= Math.abs(dy)
    ) return;

    dragged = true;

    carousel.classList.add('is-dragging');

    // Evita conflitti con le vecchie transizioni.
    cards.forEach(card => {
      card.getAnimations().forEach(a => a.cancel());
      card.style.transition = 'none';
    });

    try {
      carousel.setPointerCapture(e.pointerId);
    } catch (error) {
      // Il browser può aver già rilasciato il puntatore.
    }
  }

  const now = performance.now();
  const elapsed = now - pointerStart.lastTime;

  if (elapsed > 0) {
    pointerStart.velocity =
      (e.clientX - pointerStart.lastX) / elapsed;
  }

  pointerStart.lastX = e.clientX;
  pointerStart.lastTime = now;

  // NESSUN BLOCCO a 0.9 fotografie.
  // La posizione può aumentare o diminuire
  // indefinitamente durante il trascinamento.
  dragPosition = current - dx / dragSpacing();
  // Aggiorna al massimo una volta per frame, anche con touch a 120 Hz.
  if (!dragFrame) {
   dragFrame = requestAnimationFrame(() => {
    dragFrame = 0;
    renderDrag(dragPosition);
   });
  }
});

// RILASCIO DEL MOUSE O DEL DITO
carousel.addEventListener('pointerup', e => {
  if (
    !pointerStart ||
    e.pointerId !== pointerStart.id
  ) return;

  const gesture = pointerStart;
  pointerStart = null;

  if (carousel.hasPointerCapture(e.pointerId)) {
    carousel.releasePointerCapture(e.pointerId);
  }

  if (dragged) {
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    renderDrag(dragPosition);
    lastDragEnd = performance.now();

    // Piccola inerzia naturale sugli swipe veloci.
    const recentlyMoved =
      performance.now() - gesture.lastTime < 90;

    const velocity = recentlyMoved
      ? Math.max(-1.2, Math.min(1.2, gesture.velocity))
      : 0;

    const projected =
      dragPosition - velocity * 110 / dragSpacing();

    settleDrag(Math.round(projected));
  }

  // Impedisce che un drag apra una fotografia.
  setTimeout(() => {
    dragged = false;
  }, 0);
});

// GESTIONE INTERRUZIONI TOUCH
carousel.addEventListener('pointercancel', e => {
  if (
    !pointerStart ||
    e.pointerId !== pointerStart.id
  ) return;

  pointerStart = null;

  if (dragged) {
    if (dragFrame) cancelAnimationFrame(dragFrame);
    dragFrame = 0;
    renderDrag(dragPosition);
    lastDragEnd = performance.now();
    settleDrag(Math.round(dragPosition));
  } else {
    carousel.classList.remove('is-dragging');
  }

  setTimeout(() => {
    dragged = false;
  }, 0);
});

 window.addEventListener('resize',()=>{finishEntrance();render();},{passive:true});
 photos.filter(p=>p.board!==false).slice(0,6).forEach((p,j)=>{
  const i=photos.indexOf(p);const button=document.createElement('button');button.className='print';button.style.setProperty('--angle',`${[-6,4,7,3,-5,5][j]}deg`);button.setAttribute('aria-label',`Ingrandisci: ${photoName(p)}`);
  const img=document.createElement('img');img.src=imagePath(p);img.alt=photoName(p);img.loading='lazy';img.width=600;img.height=800;
  const label=document.createElement('span');label.className='print-label';const category=document.createElement('span');category.textContent=p.category;const status=document.createElement('span');status.textContent='Apri ↗';label.append(category,status);button.append(img,label);button.addEventListener('click',()=>open(i));board.append(button);
 });
 const note=document.createElement('span');note.className='board-note';note.textContent='Linee, forme, dettagli.';note.setAttribute('aria-hidden','true');board.append(note);
 function showLarge(i) {
  enlarged = wrap(i, photos.length);
  const p = photos[enlarged];
  const img = document.querySelector('#lightbox-img');
  img.src = imagePath(p);
  img.alt = photoName(p);
  document.querySelector('#lightbox-caption').textContent = photoName(p);
 }
 let photoIsClosing = false;
 function open(i) {
  if (lightbox.open || photoIsClosing) return;
  showLarge(i);
  lightbox.showModal();
  requestAnimationFrame(() => requestAnimationFrame(() => {
   if (lightbox.open && !photoIsClosing) lightbox.classList.add('is-visible');
  }));
 }
 function closePhotoLightbox() {
  if (!lightbox.open || photoIsClosing) return;
  photoIsClosing = true;
  lightbox.classList.remove('is-visible');
  setTimeout(() => {
   if (lightbox.open) lightbox.close();
   photoIsClosing = false;
  }, reducedMotion.matches ? 0 : 300);
 }
 lightbox.querySelector('[data-close]').addEventListener('click',closePhotoLightbox);
 lightbox.addEventListener('cancel',e=>{e.preventDefault();closePhotoLightbox();});
 lightbox.addEventListener('click',e=>{
  if(e.target!==lightbox)return;
  const r=lightbox.getBoundingClientRect();
  if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)closePhotoLightbox();
 });
 document.querySelector('#lightbox-prev').addEventListener('click',()=>showLarge(enlarged-1));
 document.querySelector('#lightbox-next').addEventListener('click',()=>showLarge(enlarged+1));
 lightbox.addEventListener('keydown',e=>{
  if(e.key==='ArrowLeft'||e.key==='ArrowRight'){
   e.preventDefault();showLarge(enlarged+(e.key==='ArrowRight'?1:-1));
  }
 });
 render();
 setupHeroSmoke();
 // The reference reveals the outside pair first, then the inside pair,
 // with the center photograph settling last. No repeating page-load animation.
 if(!reducedMotion.matches && typeof cards[0]?.animate==='function'){
  document.querySelector('.hero').classList.add('hero-entering');
  cards.forEach((card,i)=>{
   const d=relativePosition(i,current,photos.length),a=Math.abs(d),t=cardTransform(d,window.innerWidth);
   const start={...t,x:t.x+(d===0?0:Math.sign(d)*(100+(3-a)*45)),z:t.z-260,rotation:t.rotation+(d===0?0:Math.sign(d)*45)};
   entrance.push(card.animate([{transform:transform(start),opacity:0},{transform:transform(t),opacity:orbitOpacity(d)}],{duration:1050,delay:(3-a)*360,easing:'cubic-bezier(.18,.72,.2,1)',fill:'backwards'}));
  });
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)finishEntrance();});
 }
}
