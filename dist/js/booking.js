import {studio,booking} from './data.js';
export function createBookingUrl(serviceId) {
 const service=booking.services.find(s=>s.id===serviceId)||booking.services[0];
 return `${studio.whatsapp}?text=${encodeURIComponent(service.message)}`;
}
export function setupBooking(){
 const dialog=document.querySelector('#booking-dialog');
 const options=document.createElement('div');options.className='service-options';
 booking.services.forEach((service,i)=>{const label=document.createElement('label');const radio=document.createElement('input');radio.type='radio';radio.name='service';radio.value=service.id;radio.checked=i===0;const span=document.createElement('span');span.textContent=service.label;label.append(radio,span);options.append(label);radio.addEventListener('change',()=>document.querySelector('#booking-whatsapp').href=createBookingUrl(service.id));});
 document.querySelector('#booking-services').append(options);
 document.querySelector('#booking-whatsapp').href=createBookingUrl(booking.services[0].id);

 const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
 let isClosing = false;
 function openBooking() {
  if (dialog.open || isClosing) return;
  dialog.showModal();
  requestAnimationFrame(() => requestAnimationFrame(() => {
   if (dialog.open && !isClosing) dialog.classList.add('is-visible');
  }));
 }
 function closeBooking() {
  if (!dialog.open || isClosing) return;
  isClosing = true;
  dialog.classList.remove('is-visible');
  setTimeout(() => {
   if (dialog.open) dialog.close();
   isClosing = false;
  }, reducedMotion.matches ? 0 : 300);
 }
 dialog.querySelector('[data-close]').addEventListener('click', closeBooking);
 dialog.addEventListener('cancel', event => {
  event.preventDefault();
  closeBooking();
 });
 dialog.addEventListener('click', event => {
  if (event.target !== dialog) return;
  const rect = dialog.getBoundingClientRect();
  if (event.clientX < rect.left || event.clientX > rect.right ||
      event.clientY < rect.top || event.clientY > rect.bottom) closeBooking();
 });
 document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',openBooking));
}
