import { Injectable } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Observable } from 'rxjs';

export type AppLanguage = 'en-US' | 'es-MX';

export interface LanguageOption {
  code: AppLanguage;
  label: string;
  flag: string;
  shortLabel: string;
}

export const AVAILABLE_LANGUAGES: LanguageOption[] = [
  { code: 'en-US', label: 'English (US)', flag: '🇺🇸', shortLabel: 'EN' },
  { code: 'es-MX', label: 'Español (México)', flag: '🇲🇽', shortLabel: 'ES' },
];

export const LANGUAGE_STORAGE_KEY = 'high_card_selected_language';

@Injectable({
  providedIn: 'root',
})
export class LanguageService {
  private currentLanguageSubject = new BehaviorSubject<AppLanguage>('en-US');
  public currentLanguage$: Observable<AppLanguage> = this.currentLanguageSubject.asObservable();

  constructor(private translate: TranslateService) {}

  /**
   * Initializes the language settings:
   * 1. Checks if the user has previously selected a language (persisted in localStorage).
   * 2. If no persisted language, detects the default language from the device/browser.
   * 3. Configures ngx-translate fallback and activates the appropriate language.
   */
  public initLanguage(): AppLanguage {
    this.translate.addLangs(['en-US', 'es-MX']);
    this.translate.setFallbackLang('en-US');

    const persisted = this.getPersistedLanguage();
    if (persisted) {
      this.applyLanguage(persisted);
      return persisted;
    }

    const deviceLang = this.detectDeviceLanguage();
    this.applyLanguage(deviceLang);
    return deviceLang;
  }

  /**
   * Gets the currently active language code.
   */
  public getCurrentLanguage(): AppLanguage {
    return this.currentLanguageSubject.value;
  }

  /**
   * Returns details for the active language.
   */
  public getCurrentLanguageOption(): LanguageOption {
    const current = this.getCurrentLanguage();
    return (
      AVAILABLE_LANGUAGES.find((opt) => opt.code === current) ||
      AVAILABLE_LANGUAGES[0]
    );
  }

  /**
   * User selection: Sets and persists the selected language.
   */
  public setLanguage(lang: AppLanguage): void {
    try {
      localStorage.setItem(LANGUAGE_STORAGE_KEY, lang);
    } catch {
      // Handle storage quota or private mode restrictions safely
    }
    this.applyLanguage(lang);
  }

  /**
   * Toggles between English (US) and Mexican Spanish.
   */
  public toggleLanguage(): AppLanguage {
    const next: AppLanguage =
      this.getCurrentLanguage() === 'es-MX' ? 'en-US' : 'es-MX';
    this.setLanguage(next);
    return next;
  }

  /**
   * Reads persisted user selection from localStorage.
   */
  public getPersistedLanguage(): AppLanguage | null {
    try {
      const saved = localStorage.getItem(LANGUAGE_STORAGE_KEY);
      if (saved === 'es-MX' || saved === 'en-US') {
        return saved;
      }
    } catch {
      // LocalStorage might be inaccessible
    }
    return null;
  }

  /**
   * Detects language from the device / browser.
   * Mexican Spanish ('es-MX') if device locale begins with 'es'.
   * American English ('en-US') otherwise.
   */
  public detectDeviceLanguage(): AppLanguage {
    try {
      const candidates: string[] = [];

      if (typeof navigator !== 'undefined') {
        if (Array.isArray(navigator.languages) && navigator.languages.length > 0) {
          candidates.push(...navigator.languages);
        }
        if (navigator.language) {
          candidates.push(navigator.language);
        }
      }

      for (const raw of candidates) {
        if (!raw) continue;
        const normalized = raw.toLowerCase().trim();
        // Specifically check if it matches Spanish locales (es-mx, es-419, es-es, es-us, es)
        if (normalized.startsWith('es')) {
          return 'es-MX';
        }
        if (normalized.startsWith('en')) {
          return 'en-US';
        }
      }
    } catch {
      // Fallback
    }

    return 'en-US';
  }

  private applyLanguage(lang: AppLanguage): void {
    this.translate.use(lang);
    this.currentLanguageSubject.next(lang);
    if (typeof document !== 'undefined' && document.documentElement) {
      document.documentElement.lang = lang;
    }
  }
}
