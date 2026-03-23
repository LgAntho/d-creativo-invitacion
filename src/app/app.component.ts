import { Component, signal, OnInit, OnDestroy, AfterViewInit, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgxParticlesModule } from '@tsparticles/angular';
import { loadSlim } from '@tsparticles/slim';
import { Engine, ISourceOptions } from '@tsparticles/engine';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, NgxParticlesModule],
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

  particlesOptions: ISourceOptions = {
    fullScreen: { enable: true, zIndex: -1 },
    background: { color: { value: "transparent" } },
    fpsLimit: 60,
    interactivity: {
      events: {
        onHover: { enable: true, mode: "slow" }
      },
      modes: { slow: { factor: 3, radius: 200 } }
    },
    particles: {
      color: { value: ["#D4AF37", "#ffffff", "#b5952f"] },
      move: {
        direction: "none",
        enable: true,
        outModes: { default: "out" },
        random: true,
        speed: 0.6,
        straight: false
      },
      number: { density: { enable: true, width: 800, height: 800 }, value: 450 },
      opacity: {
        value: { min: 0.1, max: 0.6 },
        animation: { enable: true, speed: 1, sync: false }
      },
      shape: { type: "circle" },
      size: { value: { min: 1, max: 2 } }
    },
    detectRetina: true
  };

  constructor(private el: ElementRef) {}

  async particlesInit(engine: Engine): Promise<void> {
    await loadSlim(engine);
  }

  ngOnInit() { this.cargarDatos(); }

  ngAfterViewInit() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
        }
      });
    }, { threshold: 0.15 });
  }

  async cargarDatos() {
    try {
      const response = await fetch('/boda-data.json');
      const data = await response.json();
      this.infoBoda.set(data);
      if (data.fechaBoda) this.iniciarContador(data.fechaBoda);

      setTimeout(() => {
        const elements = this.el.nativeElement.querySelectorAll('.fade-in-section');
        elements.forEach((el: Element) => this.observer?.observe(el));
      }, 100);

    } catch (error) { console.error('Error en D-Creativo:', error); }
  }

  iniciarContador(fechaDestino: string) {
    const targetDate = new Date(fechaDestino).getTime();
    this.intervalo = setInterval(() => {
      const now = new Date().getTime();
      const distance = targetDate - now;
      if (distance < 0) { clearInterval(this.intervalo); return; }
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
}
