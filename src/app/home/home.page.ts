import { Component, OnInit } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { Card, Player, createDeck, UNREVEALED_CARD } from './card';

export interface PresetCategory {
  label: string;
  icon: string;
  items: string[];
}

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
  styleUrls: ['home.page.scss'],
})
export class HomePage implements OnInit {
  cards: Card[];
  players: Player[] = [];
  cardsInGame: Card[] = [];

  newPlayerName = '';
  isDealing = false;
  hasDealt = false;
  soundEnabled = true;
  showPresetsModal = false;
  tieBrokenMessage: string | null = null;

  readonly quickPresets: PresetCategory[] = [
    {
      label: '🍕 Lunch & Dinner',
      icon: 'restaurant-outline',
      items: ['Pizza', 'Sushi', 'Tacos', 'Burgers', 'Thai Noodles'],
    },
    {
      label: '🪙 Simple Choice',
      icon: 'git-commit-outline',
      items: ['Option A', 'Option B'],
    },
    {
      label: '👥 Who Goes First?',
      icon: 'people-outline',
      items: ['Player 1', 'Player 2', 'Player 3', 'Player 4'],
    },
    {
      label: '🍿 Movie Night',
      icon: 'film-outline',
      items: ['Sci-Fi', 'Comedy', 'Psychological Thriller', 'Animation'],
    },
    {
      label: '✈️ Weekend Getaway',
      icon: 'airplane-outline',
      items: ['Beachside', 'Mountain Cabin', 'Historic City', 'Lake Resort'],
    },
    {
      label: '🧹 Chore Duty',
      icon: 'sparkles-outline',
      items: ['Kitchen & Dishes', 'Trash & Recycle', 'Vacuuming', 'Grocery Run'],
    },
  ];

  constructor(
    private toastController: ToastController,
    private alertController: AlertController
  ) {
    this.cards = createDeck();
  }

  ngOnInit() {
    // Load saved sound preference if available
    try {
      const savedSound = localStorage.getItem('high_card_sound');
      if (savedSound !== null) {
        this.soundEnabled = savedSound === 'true';
      }
    } catch {
      // Ignore localStorage restrictions
    }
  }

  get winner(): Player | null {
    return this.players.length > 0 && this.hasDealt ? this.players[0] : null;
  }

  toggleSound() {
    this.soundEnabled = !this.soundEnabled;
    try {
      localStorage.setItem('high_card_sound', String(this.soundEnabled));
    } catch {
      // Ignore
    }
  }

  async onAdd(initialName = '') {
    if (this.players.length < 52) {
      this.players.push({
        playerName: initialName,
        card: { ...UNREVEALED_CARD },
        isWinner: false,
        isFlipping: false,
      });
      // If adding after dealing, mark hasDealt as false so they know a new draw is needed
      if (this.hasDealt) {
        this.resetDealState();
      }
      return;
    }

    const toast = await this.toastController.create({
      message: 'Maximum limit of 52 options reached (full card deck)!',
      duration: 2000,
      position: 'bottom',
      color: 'warning',
    });
    await toast.present();
  }

  onQuickAdd() {
    const trimmed = this.newPlayerName.trim();
    if (!trimmed) {
      this.onAdd();
      return;
    }

    this.onAdd(trimmed);
    this.newPlayerName = '';
  }

  onDelete(index: number) {
    this.players.splice(index, 1);
    if (this.players.length === 0) {
      this.resetDealState();
    } else if (this.hasDealt) {
      this.recalculateRanks();
    }
  }

  async confirmClearAll() {
    if (this.players.length === 0) return;
    const alert = await this.alertController.create({
      header: 'Start Fresh?',
      message: 'Clear all options and reset the table?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Clear All',
          role: 'destructive',
          handler: () => {
            this.players = [];
            this.resetDealState();
          },
        },
      ],
    });
    await alert.present();
  }

  loadPreset(preset: PresetCategory) {
    this.players = preset.items.map((name) => ({
      playerName: name,
      card: { ...UNREVEALED_CARD },
      isWinner: false,
      isFlipping: false,
    }));
    this.resetDealState();
    this.showPresetsModal = false;
  }

  resetDealState() {
    this.hasDealt = false;
    this.isDealing = false;
    this.tieBrokenMessage = null;
    this.players.forEach((p) => {
      p.card = { ...UNREVEALED_CARD };
      p.isWinner = false;
      p.rank = undefined;
      p.isFlipping = false;
    });
  }

  onRun() {
    if (this.players.length === 0) return;

    // Reset game deck and copy full deck
    this.cardsInGame = [];
    this.cards.forEach((c) => this.cardsInGame.push({ ...c }));

    this.isDealing = true;
    this.playCardDealSound();

    // Assign unique random cards to each player
    this.players.forEach((p) => this.setCard(p));

    // Sort descending: by value first (Ace=14, King=13...), then suitValue (Spades=4 > Hearts=3 > Diamonds=2 > Clubs=1)
    let tieBroken = false;
    this.players.sort((a, b) => {
      const diff = b.card.value - a.card.value;
      if (diff !== 0) return diff;
      // Tie breaker by suit!
      const suitDiff = (b.card.suitValue || 0) - (a.card.suitValue || 0);
      if (suitDiff !== 0) {
        tieBroken = true;
      }
      return suitDiff;
    });

    if (tieBroken && this.players.length >= 2 && this.players[0].card.value === this.players[1].card.value) {
      this.tieBrokenMessage = `Tie-breaker: ${this.players[0].playerName || '1st'} wins via ${this.players[0].card.suitName} (${this.players[0].card.suitSymbol}) over ${this.players[1].card.suitName} (${this.players[1].card.suitSymbol})!`;
    } else {
      this.tieBrokenMessage = null;
    }

    // Trigger visual flip animation and ranking
    setTimeout(() => {
      this.isDealing = false;
      this.hasDealt = true;
      this.recalculateRanks();
      this.playWinnerChime();
    }, 350);
  }

  private recalculateRanks() {
    this.players.forEach((player, idx) => {
      player.rank = idx + 1;
      player.isWinner = idx === 0;
      player.isFlipping = true;
    });
  }

  private setCard(player: Player) {
    const n = this.getRandom(0, this.cardsInGame.length - 1);
    const card = this.cardsInGame[n];
    player.card = card;
    this.cardsInGame.splice(n, 1);
  }

  private getRandom(min: number, max: number): number {
    return min + Math.floor(Math.random() * (max - min + 1));
  }

  /* Soft Audio Feedback using Web Audio API */
  private playCardDealSound() {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      
      // Card flutter effect (2 quick clicks)
      [0, 0.05, 0.1].forEach((delay) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(320, ctx.currentTime + delay);
        osc.frequency.exponentialRampToValueAtTime(120, ctx.currentTime + delay + 0.04);
        gain.gain.setValueAtTime(0.08, ctx.currentTime + delay);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.04);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + delay);
        osc.stop(ctx.currentTime + delay + 0.045);
      });
    } catch {
      // Audio might be muted or context restricted
    }
  }

  private playWinnerChime() {
    if (!this.soundEnabled || typeof window === 'undefined') return;
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.07);
        gain.gain.setValueAtTime(0.06, ctx.currentTime + idx * 0.07);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.07 + 0.32);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(ctx.currentTime + idx * 0.07);
        osc.stop(ctx.currentTime + idx * 0.07 + 0.33);
      });
    } catch {
      // Audio context restricted
    }
  }
}
