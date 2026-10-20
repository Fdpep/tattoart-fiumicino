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
 document.querySelectorAll('[data-book]').forEach(button=>button.addEventListener('click',()=>dialog.showModal()));
}
