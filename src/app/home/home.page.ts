import { Component, OnInit, OnDestroy } from '@angular/core';
import { ToastController, AlertController } from '@ionic/angular';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs';
import { Card, Player, createDeck, UNREVEALED_CARD } from './card';
import { LanguageService, AppLanguage, LanguageOption } from '../services/language.service';

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
export class HomePage implements OnInit, OnDestroy {
  cards: Card[];
  players: Player[] = [];
  cardsInGame: Card[] = [];

  newPlayerName = '';
  isDealing = false;
  hasDealt = false;
  soundEnabled = true;
  showPresetsModal = false;
  tieBrokenMessage: string | null = null;

  private langSub?: Subscription;

  constructor(
    private toastController: ToastController,
    private alertController: AlertController,
    public languageService: LanguageService,
    private translate: TranslateService
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

    this.langSub = this.translate.onLangChange.subscribe(() => {
      if (this.tieBrokenMessage) {
        this.updateTieBreakerMessage();
      }
    });
  }

  ngOnDestroy() {
    this.langSub?.unsubscribe();
  }

  get currentLanguageOption(): LanguageOption {
    return this.languageService.getCurrentLanguageOption();
  }

  get quickPresets(): PresetCategory[] {
    return [
      {
        label: this.translate.instant('PRESETS.LUNCH_DINNER.LABEL'),
        icon: 'restaurant-outline',
        items: [
          this.translate.instant('PRESETS.LUNCH_DINNER.ITEM_1'),
          this.translate.instant('PRESETS.LUNCH_DINNER.ITEM_2'),
          this.translate.instant('PRESETS.LUNCH_DINNER.ITEM_3'),
          this.translate.instant('PRESETS.LUNCH_DINNER.ITEM_4'),
          this.translate.instant('PRESETS.LUNCH_DINNER.ITEM_5'),
        ],
      },
      {
        label: this.translate.instant('PRESETS.SIMPLE_CHOICE.LABEL'),
        icon: 'git-commit-outline',
        items: [
          this.translate.instant('PRESETS.SIMPLE_CHOICE.ITEM_1'),
          this.translate.instant('PRESETS.SIMPLE_CHOICE.ITEM_2'),
        ],
      },
      {
        label: this.translate.instant('PRESETS.WHO_GOES_FIRST.LABEL'),
        icon: 'people-outline',
        items: [
          this.translate.instant('PRESETS.WHO_GOES_FIRST.ITEM_1'),
          this.translate.instant('PRESETS.WHO_GOES_FIRST.ITEM_2'),
          this.translate.instant('PRESETS.WHO_GOES_FIRST.ITEM_3'),
          this.translate.instant('PRESETS.WHO_GOES_FIRST.ITEM_4'),
        ],
      },
      {
        label: this.translate.instant('PRESETS.MOVIE_NIGHT.LABEL'),
        icon: 'film-outline',
        items: [
          this.translate.instant('PRESETS.MOVIE_NIGHT.ITEM_1'),
          this.translate.instant('PRESETS.MOVIE_NIGHT.ITEM_2'),
          this.translate.instant('PRESETS.MOVIE_NIGHT.ITEM_3'),
          this.translate.instant('PRESETS.MOVIE_NIGHT.ITEM_4'),
        ],
      },
      {
        label: this.translate.instant('PRESETS.WEEKEND_GETAWAY.LABEL'),
        icon: 'airplane-outline',
        items: [
          this.translate.instant('PRESETS.WEEKEND_GETAWAY.ITEM_1'),
          this.translate.instant('PRESETS.WEEKEND_GETAWAY.ITEM_2'),
          this.translate.instant('PRESETS.WEEKEND_GETAWAY.ITEM_3'),
          this.translate.instant('PRESETS.WEEKEND_GETAWAY.ITEM_4'),
        ],
      },
      {
        label: this.translate.instant('PRESETS.CHORE_DUTY.LABEL'),
        icon: 'sparkles-outline',
        items: [
          this.translate.instant('PRESETS.CHORE_DUTY.ITEM_1'),
          this.translate.instant('PRESETS.CHORE_DUTY.ITEM_2'),
          this.translate.instant('PRESETS.CHORE_DUTY.ITEM_3'),
          this.translate.instant('PRESETS.CHORE_DUTY.ITEM_4'),
        ],
      },
    ];
  }

  async openLanguageSelector() {
    const current = this.languageService.getCurrentLanguage();
    const alert = await this.alertController.create({
      header: this.translate.instant('LANGUAGE_MODAL.TITLE'),
      subHeader: this.translate.instant('LANGUAGE_MODAL.SUBTITLE'),
      inputs: [
        {
          type: 'radio',
          label: '🇺🇸 English (US)',
          value: 'en-US',
          checked: current === 'en-US',
        },
        {
          type: 'radio',
          label: '🇲🇽 Español (México)',
          value: 'es-MX',
          checked: current === 'es-MX',
        },
      ],
      buttons: [
        { text: this.translate.instant('ALERTS.CANCEL'), role: 'cancel' },
        {
          text: 'OK',
          handler: (lang: AppLanguage) => {
            if (lang && lang !== current) {
              this.languageService.setLanguage(lang);
            }
          },
        },
      ],
    });
    await alert.present();
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
      message: this.translate.instant('ALERTS.MAX_LIMIT'),
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
      header: this.translate.instant('ALERTS.CLEAR_TITLE'),
      message: this.translate.instant('ALERTS.CLEAR_MESSAGE'),
      buttons: [
        { text: this.translate.instant('ALERTS.CANCEL'), role: 'cancel' },
        {
          text: this.translate.instant('ALERTS.CLEAR_CONFIRM'),
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
      this.updateTieBreakerMessage();
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

  getCardDisplayName(card: Card): string {
    if (!card) return '';
    if (card.image === 0 || card.rankKey === 'CARDS.MYSTERY') {
      return this.translate.instant('CARDS.MYSTERY');
    }
    const rank = card.rankKey ? this.translate.instant(card.rankKey) : (card.rankName || '');
    const suit = card.suitKey ? this.translate.instant(card.suitKey) : (card.suitName || '');
    const ofWord = this.translate.instant('CARDS.OF');
    return `${rank} ${ofWord} ${suit}`;
  }

  getCardRankName(card: Card): string {
    if (!card) return '';
    if (card.rankKey) {
      return this.translate.instant(card.rankKey);
    }
    return card.rankName || '';
  }

  private updateTieBreakerMessage() {
    if (this.players.length >= 2 && this.players[0].card.value === this.players[1].card.value) {
      const p1 = this.players[0];
      const p2 = this.players[1];
      const p1Suit = p1.card.suitKey ? this.translate.instant(p1.card.suitKey) : (p1.card.suitName || '');
      const p2Suit = p2.card.suitKey ? this.translate.instant(p2.card.suitKey) : (p2.card.suitName || '');
      this.tieBrokenMessage = this.translate.instant('WINNER.TIE_BREAKER', {
        winner: p1.playerName || this.translate.instant('WINNER.FALLBACK_NAME'),
        winnerSuit: p1Suit,
        winnerSymbol: p1.card.suitSymbol || '',
        loserSuit: p2Suit,
        loserSymbol: p2.card.suitSymbol || '',
      });
    }
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
