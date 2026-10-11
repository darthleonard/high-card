import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideTranslateService, TranslateService } from '@ngx-translate/core';
import {
  LanguageService,
  LANGUAGE_STORAGE_KEY,
  AppLanguage,
} from './language.service';

describe('LanguageService', () => {
  let service: LanguageService;
  let translate: TranslateService;

  beforeEach(() => {
    localStorage.clear();

    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideTranslateService({
          fallbackLang: 'en-US',
        }),
        LanguageService,
      ],
    });

    service = TestBed.inject(LanguageService);
    translate = TestBed.inject(TranslateService);
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('device detection', () => {
    it('should detect Mexican Spanish if navigator.language starts with es', () => {
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['es-MX', 'es']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('es-MX');

      const detected = service.detectDeviceLanguage();
      expect(detected).toEqual('es-MX');
    });

    it('should detect Mexican Spanish for other Spanish locales (e.g. es-419)', () => {
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['es-419']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('es-419');

      const detected = service.detectDeviceLanguage();
      expect(detected).toEqual('es-MX');
    });

    it('should detect American English if navigator.language starts with en', () => {
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['en-US', 'en']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('en-US');

      const detected = service.detectDeviceLanguage();
      expect(detected).toEqual('en-US');
    });

    it('should fallback to American English for other languages', () => {
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['fr-FR', 'fr']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('fr-FR');

      const detected = service.detectDeviceLanguage();
      expect(detected).toEqual('en-US');
    });
  });

  describe('persistence and initLanguage', () => {
    it('should prioritize persisted language from localStorage if present', () => {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, 'es-MX');
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['en-US']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('en-US');

      const lang = service.initLanguage();
      expect(lang).toEqual('es-MX');
      expect(service.getCurrentLanguage()).toEqual('es-MX');
    });

    it('should fallback to device language when no selection is persisted', () => {
      spyOnProperty(navigator, 'languages', 'get').and.returnValue(['es-MX']);
      spyOnProperty(navigator, 'language', 'get').and.returnValue('es-MX');

      const lang = service.initLanguage();
      expect(lang).toEqual('es-MX');
      expect(service.getCurrentLanguage()).toEqual('es-MX');
    });

    it('should persist user language selection when setLanguage is called', () => {
      service.setLanguage('es-MX');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toEqual('es-MX');
      expect(service.getCurrentLanguage()).toEqual('es-MX');

      service.setLanguage('en-US');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toEqual('en-US');
      expect(service.getCurrentLanguage()).toEqual('en-US');
    });

    it('should toggle language back and forth and persist selection', () => {
      service.setLanguage('en-US');
      const toggled1 = service.toggleLanguage();
      expect(toggled1).toEqual('es-MX');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toEqual('es-MX');

      const toggled2 = service.toggleLanguage();
      expect(toggled2).toEqual('en-US');
      expect(localStorage.getItem(LANGUAGE_STORAGE_KEY)).toEqual('en-US');
    });
  });
});
