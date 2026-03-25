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
  infoBoda = signal<any>(null);
  dias = signal<number>(0);
  horas = signal<number>(0);
  minutos = signal<number>(0);
  segundos = signal<number>(0);
  intervalo: ReturnType<typeof setInterval> | undefined;
  isPlaying = signal<boolean>(false);
  private observer: IntersectionObserver | undefined;

  currentSlideIndex = signal<number>(0);
  totalSlides = signal<number>(3);
  slidesArray = [0, 1, 2];

  constructor(private el: ElementRef) {}

  ngOnInit() {
    this.cargarDatos();
  }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('in');
        }
      });
    }, { threshold: 0.15 });
  }

  async cargarDatos() {
    try {
      const response = await fetch('/boda-data.json');
      const data = await response.json();
      this.infoBoda.set(data);

      if (data.fechaBoda) {
        this.iniciarContador(data.fechaBoda);
      }

      setTimeout(() => {
        const elements = this.el.nativeElement.querySelectorAll('.rv, .rv-l, .rv-r');
        elements.forEach((el: Element) => this.observer?.observe(el));
      }, 100);

    } catch (error) {
      console.error('Error cargando datos:', error);
    }
  }

  iniciarContador(fechaDestino: string) {
    const targetDate = new Date(fechaDestino).getTime();
    this.intervalo = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance < 0) {
        clearInterval(this.intervalo);
        return;
      }

      this.dias.set(Math.floor(distance / (1000 * 60 * 60 * 24)));
      this.horas.set(Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)));
      this.minutos.set(Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)));
      this.segundos.set(Math.floor((distance % (1000 * 60)) / 1000));
    }, 1000);
  }

  ngOnDestroy() {
    if (this.intervalo) clearInterval(this.intervalo);
    if (this.observer) this.observer.disconnect();
  }

  toggleAudio(audioElement: HTMLAudioElement) {
    if (this.isPlaying()) {
      audioElement.pause();
    } else {
      audioElement.play().catch(error => {
        console.error('El navegador bloqueó el audio:', error);
      });
    }
    this.isPlaying.set(!this.isPlaying());
  }

  setSlide(index: number) {
    if (index >= 0 && index < this.totalSlides()) {
      this.currentSlideIndex.set(index);
    }
  }

  nextSlide() {
    let nextIndex = this.currentSlideIndex() + 1;
    if (nextIndex >= this.totalSlides()) {
      nextIndex = 0;
    }
    this.currentSlideIndex.set(nextIndex);
  }

  prevSlide() {
    let prevIndex = this.currentSlideIndex() - 1;
    if (prevIndex < 0) {
      prevIndex = this.totalSlides() - 1;
    }
    this.currentSlideIndex.set(prevIndex);
  }

  copyAcc() {
    navigator.clipboard.writeText('5579 0701 1952 9355').then(() => {
       const toast = document.getElementById('t1');
       if(toast) {
         toast.classList.add('on');
         setTimeout(() => toast.classList.remove('on'), 2200);
       }
    });
  }

  copyCode() {
     navigator.clipboard.writeText('BODA-M&C').then(() => {
       const toast = document.getElementById('t2');
       if(toast) {
         toast.classList.add('on');
         setTimeout(() => toast.classList.remove('on'), 2200);
       }
     });
  }
}
