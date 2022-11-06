import { CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { TestBed, waitForAsync } from '@angular/core/testing';

import { HomePage } from './home.page';

// https://enappd.com/blog/beginners-guide-to-ionic-angular-unit-testing-part-1/151/
describe('Home', () => {

  beforeEach(waitForAsync(() => {

    TestBed.configureTestingModule({
      declarations: [HomePage],
      schemas: [CUSTOM_ELEMENTS_SCHEMA],
    }).compileComponents();
  }));

  it('add players', waitForAsync(() => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.debugElement.componentInstance;

    component.onAdd();
    component.onAdd();
    component.onAdd();

    expect(component.players.length).toEqual(3);
  }));

  it('remove players', waitForAsync(() => {
    const fixture = TestBed.createComponent(HomePage);
    const component = fixture.debugElement.componentInstance;
    
    component.onAdd();
    component.onAdd();
    component.onAdd();
    component.onAdd();
    component.onDelete(1);
    component.onDelete(2);

    expect(component.players.length).toEqual(2);
  }));

  it('max 52 players', waitForAsync(() => {
    const component = TestBed.createComponent(HomePage).debugElement.componentInstance;
    for(let i = 0; i < 60; i++) {
        component.onAdd();
    }

    expect(component.players.length).toEqual(52);
  }));

  it('cards should not repeat', waitForAsync(() => {
    const component = TestBed.createComponent(HomePage).debugElement.componentInstance;
    for(let i = 0; i < 60; i++) {
        component.onAdd();
    }
    component.onRun();

    const cardImageIndexes = component.players.map(p => p.card.image).sort();
    const toFindDuplicates = arry => arry.filter((item, index) => cardImageIndexes.indexOf(item) !== index);
    const duplicatedCards = toFindDuplicates(cardImageIndexes);

    expect(duplicatedCards.length).toEqual(0);
  }));
});
