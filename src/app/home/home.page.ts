import { Component } from '@angular/core';
import { ToastController } from '@ionic/angular';
import { Card } from './card';

@Component({
  selector: 'app-home',
  templateUrl: 'home.page.html',
})
export class HomePage {
  private cards: Card[];

  constructor(private toastController: ToastController) {
    this.cards = [];

    let value = 14;
    for (let i = 1; i <= 52; i++) {
      this.cards.push({ value: value, image: i });
      value = value == 14 ? 2 : value + 1;
    }
  }

  players: {
    playerName: string;
    card: Card;
  }[] = [];

  cardsInGame: Card[] = [];

  async onAdd() {
    if (this.players.length < 52) {
      this.players.push({
        playerName: '',
        card: { value: 0, image: 0 },
      });
      return;
    }

    const toast = await this.toastController.create({
      message: 'Max players reached!',
      duration: 1500,
      position: 'bottom',
      color: 'danger',
    });

    await toast.present();
  }

  onDelete(index: number) {
    this.players.splice(index, 1);
  }

  onRun() {
    this.cardsInGame = [];
    this.cards.forEach((c) => this.cardsInGame.push(c));
    this.players.forEach((p) => this.setCard(p));
    this.players.sort((a, b) => b.card.value - a.card.value);
  }

  private setCard(player: any) {
    const n = this.getRandom(0, this.cardsInGame.length - 1);
    const card = this.cardsInGame[n];
    player.card = card;
    this.cardsInGame.splice(n, 1);
  }

  private getRandom(min, max) {
    return min + Math.floor(Math.random() * (max - min + 1));
  }
}
