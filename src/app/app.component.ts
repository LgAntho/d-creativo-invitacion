import { Component, signal, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent implements OnInit, OnDestroy, AfterViewInit {
  // Estado principal
  infoBoda = signal<any>(null);

  // Contadores
  dias = signal(0);
  horas = signal(0);
  minutos = signal(0);
  segundos = signal(0);
  private intervalo?: ReturnType<typeof setInterval>;
  isPlaying = signal(false);
  private observer?: IntersectionObserver;
  invitacionAbierta = signal(false);

  // Carrusel
  currentSlideIndex = signal(0);
  totalSlides = signal(5);
  slidesArray = [0, 1, 2, 3, 4];

  // Formulario RSVP
  enviando = signal(false);
  mensajeExito = signal(false);
  formularioAbierto = signal(true);

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.cargarDatos();

    // Lógica de cierre: El formulario se oculta después del 30 de abril de 2026 (23:59)
    const fechaLimite = new Date('2026-04-30T23:59:59').getTime();
    this.formularioAbierto.set(Date.now() <= fechaLimite);
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) entry.target.classList.add('in');
      });
    }, { threshold: 0.15 });
  }

  async cargarDatos() {
    try {
      const res = await fetch('/boda-data.json');
      const data = await res.json();
      this.infoBoda.set(data);

      if (data.fechaBoda) this.iniciarContador(data.fechaBoda);

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  iniciarContador(fechaDestino: string) {
    const targetDate = new Date(fechaDestino).getTime();

    this.intervalo = setInterval(() => {
      const distance = targetDate - Date.now();

      if (distance <= 0) {
        clearInterval(this.intervalo);
        return;
      }

      this.dias.set(Math.floor(distance / 86400000));
      this.horas.set(Math.floor((distance % 86400000) / 3600000));
      this.minutos.set(Math.floor((distance % 3600000) / 60000));
      this.segundos.set(Math.floor((distance % 60000) / 1000));
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
    this.observer?.disconnect();
  }

  // --- Animación de Inicio y Audio ---
  abrirInvitacion(audio: HTMLAudioElement) {
    this.invitacionAbierta.set(true); // Oculta el sobre y habilita el scroll
    this.isPlaying.set(true);

    // Inicia la música automáticamente
    audio.play().catch(e => console.error('Audio bloqueado:', e));

    // Arranca las animaciones de la página
    setTimeout(() => {
      this.el.nativeElement.querySelectorAll('.rv, .rv-l, .rv-r')
        .forEach((el: Element) => this.observer?.observe(el));
    }, 100);
  }

  toggleAudio(audio: HTMLAudioElement) {
    this.isPlaying() ? audio.pause() : audio.play().catch(e => console.error('Audio bloqueado:', e));
    this.isPlaying.set(!this.isPlaying());
  }

  // --- Carrusel ---
  setSlide(index: number) {
    if (index >= 0 && index < this.totalSlides()) {
      this.currentSlideIndex.set(index);
    }
  }

  nextSlide() {
    this.currentSlideIndex.set((this.currentSlideIndex() + 1) % this.totalSlides());
  }

  prevSlide() {
    this.currentSlideIndex.set((this.currentSlideIndex() - 1 + this.totalSlides()) % this.totalSlides());
  }

  // --- Portapapeles ---
  copyText(text: string, toastId: string) {
    navigator.clipboard.writeText(text).then(() => {
       const toast = document.getElementById(toastId);
       if(toast) {
         toast.classList.add('on');
         setTimeout(() => toast.classList.remove('on'), 2200);
       }
    });
  }

  // --- Formulario a Google Sheets ---
  async enviarFormulario(event: Event) {
    event.preventDefault();
    this.enviando.set(true);

    const form = event.target as HTMLFormElement;
    const formData = new FormData(form);
    const data = new URLSearchParams();
    formData.forEach((value, key) => {
      data.append(key, value.toString());
    });

    try {
      await fetch(this.infoBoda().rsvpEndpoint, {
        method: 'POST',
        body: data,
        mode: 'no-cors',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        }
      });

      this.enviando.set(false);
      this.mensajeExito.set(true);
      form.reset();

      setTimeout(() => this.mensajeExito.set(false), 4000);
    } catch (error) {
      console.error('Error al enviar:', error);
      alert('Hubo un problema al enviar la confirmación. Inténtalo de nuevo.');
      this.enviando.set(false);
    }
  }
}
