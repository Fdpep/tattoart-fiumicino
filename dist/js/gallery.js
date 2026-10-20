import {setupHeroSmoke} from './hero-smoke.js';
export function wrap(index, length) { return ((index % length) + length) % length; }
export function relativePosition(index, current, length) {
 let d = wrap(index - current, length);
 if (d > length / 2) d -= length;
 return d;
}
export function cardTransform(distance, viewport) {
 const mobile = viewport < 768;
 const spacing = mobile ? 155 : viewport >= 1600 ? 250 : 220;
 const a = Math.abs(distance);
 return {x: distance * spacing, y: 0, z: a * a * (mobile ? 9 : 25), rotation: -distance * 12, opacity: a > 3 ? 0 : 1};
}
export function setupGallery(photos) {
 const carousel = document.querySelector('#carousel');
 const board = document.querySelector('#board');
 const lightbox = document.querySelector('#lightbox');
 let current = 0, enlarged = 0, pointerStart = null, dragged = false;
 let navigatingToCard = false;
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
button.addEventListener('click', () => {
  if (dragged || navigatingToCard || arrowFrame) return;

  if (i === current) {
    open(i);
  } else {
    goToCard(i);
  }
});
  return button;
 });
 function render(dragOffset=0) {
  cards.forEach((card,i) => {
   const d = relativePosition(i,current,photos.length)+dragOffset; const t = cardTransform(d,window.innerWidth);
   const old=Number(card.dataset.distance);
    if (
    !dragOffset &&
    Number.isFinite(old) &&
    Math.abs(old - d) > photos.length / 2
    ) {
    // La fotografia esce da un lato e rientra dall'altro.

    const viewport = window.innerWidth;

    const previous = cardTransform(old, viewport);
    const outgoing = cardTransform(
        old + Math.sign(old),
        viewport
    );
    const incoming = cardTransform(
        d + Math.sign(d),
        viewport
    );

    card.style.transition = 'none';
    card.style.transform = transform(t);

    if (
        !reducedMotion.matches &&
        typeof card.animate === 'function'
    ) {
        // Copia visiva della fotografia in uscita.
        const ghost = card.cloneNode(true);

        ghost.setAttribute('aria-hidden', 'true');
        ghost.tabIndex = -1;
        ghost.style.pointerEvents = 'none';
        ghost.style.transition = 'none';
        ghost.style.transform = transform(previous);
        ghost.style.opacity = '1';

        carousel.append(ghost);

        const options = {
        duration: 650,
        easing: 'cubic-bezier(.22,.7,.2,1)',
        fill: 'both'
        };

        // Animazione di uscita.
        const exit = ghost.animate(
        [
            {
            transform: transform(previous),
            opacity: 1
            },
            {
            transform: transform(outgoing),
            opacity: 0
            }
        ],
        options
        );

        // Animazione di ingresso dal lato opposto.
        const entry = card.animate(
        [
            {
            transform: transform(incoming),
            opacity: 0
            },
            {
            transform: transform(t),
            opacity: 1
            }
        ],
        options
        );

        exit.onfinish = () => {
        exit.cancel();
        ghost.remove();
        };

        entry.onfinish = () => {
        entry.cancel();
        card.style.transition = '';
        };

    } else {
        requestAnimationFrame(() => {
        requestAnimationFrame(() => {
            card.style.transition = '';
        });
        });
    }

    } else {
    card.style.transform = transform(t);
    }
   if(!dragOffset)card.dataset.distance=String(d);
   card.style.zIndex = String(10-Math.round(Math.abs(d))); card.style.opacity = t.opacity;
   card.tabIndex = i === current ? 0 : -1;
   card.setAttribute('aria-hidden',String(!t.opacity)); card.style.pointerEvents = t.opacity ? 'auto' : 'none';
  });
  document.querySelector('#hero-count').textContent = `${String(current+1).padStart(2,'0')} / ${String(photos.length).padStart(2,'0')}`;
 }
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

    cards.forEach((card, i) => {
      const d = relativePosition(
        i,
        visualPosition,
        photos.length
      );

      const shape = cardTransform(
        d,
        window.innerWidth
      );

      // Dissolvenza ai margini del carosello:
      // evita che le card saltino visibilmente
      // da un'estremità all'altra.
      const edge = photos.length / 2;
      const fadeStart = Math.min(3, edge - 0.8);
      const fadeEnd = Math.min(3.8, edge - 0.15);

      const opacity = Math.max(
        0,
        Math.min(
          1,
          (fadeEnd - Math.abs(d)) /
          (fadeEnd - fadeStart)
        )
      );

      card.style.transform = transform(shape);
      card.style.opacity = String(opacity);
      card.style.zIndex = String(
        10 - Math.round(Math.abs(d))
      );
    });

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

// Usa la stessa spaziatura del carosello 3D.
function dragSpacing() {
  const width = window.innerWidth;
  return width < 768 ? 155 : width >= 1600 ? 285 : 250;
}

// Disegna le fotografie lungo un percorso continuo,
// senza limiti di inizio o fine.
function renderDrag(position) {
  cards.forEach((card, i) => {
    const d = relativePosition(
      i,
      position,
      photos.length
    );

    const t = cardTransform(d, window.innerWidth);  

    // Le fotografie scompaiono dolcemente ai margini
    // e rientrano dal lato opposto senza salti visibili.
    const edge = photos.length / 2;

    const fadeStart = Math.min(
    3.05,
    edge - 0.45
    );

    const fadeEnd = edge - 0.08;

    const opacity = Math.max(
    0,
    Math.min(
        1,
        (fadeEnd - Math.abs(d)) /
        (fadeEnd - fadeStart)
    )
    );

    card.style.transform = transform(t);
    card.style.opacity = String(opacity);
    card.style.zIndex = String(
      10 - Math.round(Math.abs(d))
    );
    card.style.pointerEvents =
      opacity > 0 ? 'auto' : 'none';
  });

  const activeIndex = wrap(
    Math.round(position),
    photos.length
  );

  document.querySelector('#hero-count').textContent =
    `${String(activeIndex + 1).padStart(2, '0')} / ` +
    `${String(photos.length).padStart(2, '0')}`;
}

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
  dragPosition =
    current - dx / dragSpacing();

  renderDrag(dragPosition);
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
 function showLarge(i){enlarged=wrap(i,photos.length);const p=photos[enlarged];const img=document.querySelector('#lightbox-img');img.src=imagePath(p);img.alt=photoName(p);document.querySelector('#lightbox-caption').textContent = photoName(p);}
 function open(i){showLarge(i);lightbox.showModal();}
 document.querySelector('#lightbox-prev').addEventListener('click',()=>showLarge(enlarged-1));document.querySelector('#lightbox-next').addEventListener('click',()=>showLarge(enlarged+1));
 lightbox.addEventListener('keydown',e=>{if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();showLarge(enlarged+(e.key==='ArrowRight'?1:-1));}});
 render();
 setupHeroSmoke();
 // The reference reveals the outside pair first, then the inside pair,
 // with the center photograph settling last. No repeating page-load animation.
 if(!reducedMotion.matches && typeof cards[0]?.animate==='function'){
  document.querySelector('.hero').classList.add('hero-entering');
  cards.forEach((card,i)=>{
   const d=relativePosition(i,current,photos.length),a=Math.abs(d),t=cardTransform(d,window.innerWidth);
   const start={...t,x:t.x+(d===0?0:Math.sign(d)*(100+(3-a)*45)),z:t.z-260,rotation:t.rotation+(d===0?0:Math.sign(d)*45)};
   entrance.push(card.animate([{transform:transform(start),opacity:0},{transform:transform(t),opacity:1}],{duration:1050,delay:(3-a)*360,easing:'cubic-bezier(.18,.72,.2,1)',fill:'backwards'}));
  });
  reducedMotion.addEventListener('change',()=>{if(reducedMotion.matches)finishEntrance();});
 }
}
