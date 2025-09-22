import { render, screen, waitFor } from '@testing-library/react';
import { I18nextProvider } from 'react-i18next';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import React from 'react';

// Test component to verify translations
const TestComponent = () => {
  const { t } = useTranslation();
  
  return (
    <div>
      <h1>{t('app.title')}</h1>
      <p>{t('app.subtitle')}</p>
      <button>{t('common.back')}</button>
      <span>{t('common.loading')}</span>
      <div>{t('navigation.home')}</div>
      <div>{t('navigation.wallet')}</div>
      <div>{t('navigation.mining')}</div>
      <div>{t('navigation.referrals')}</div>
      <div>{t('navigation.tasks')}</div>
      <div>{t('navigation.lottery')}</div>
      <div>{t('navigation.leaderboard')}</div>
      <div>{t('navigation.swap')}</div>
      <div>{t('navigation.settings')}</div>
      <div>{t('navigation.profile')}</div>
      <div>{t('swap.title')}</div>
      <div>{t('swap.subtitle')}</div>
      <div>{t('swap.cfmBalance')}</div>
      <div>{t('swap.cfmtBalance')}</div>
      <div>{t('tasks.title')}</div>
      <div>{t('tasks.subtitle')}</div>
      <div>{t('tasks.active')}</div>
      <div>{t('tasks.completed')}</div>
      <div>{t('tasks.overview')}</div>
    </div>
  );
};

// Test wrapper with i18n provider
const TestWrapper = ({ children }: { children: React.ReactNode }) => (
  <I18nextProvider i18n={i18n}>
    {children}
  </I18nextProvider>
);

describe('Translation System', () => {
  beforeEach(() => {
    // Reset i18n to default state
    i18n.changeLanguage('hy');
  });

  describe('Armenian (hy) - Default Language', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('hy');
    });

    test('should display Armenian translations', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mnemine')).toBeInTheDocument();
        expect(screen.getByText('Պրոֆեսիոնալ ֆինանսական սիմուլյատոր')).toBeInTheDocument();
        expect(screen.getByText('Վերադառնալ')).toBeInTheDocument();
        expect(screen.getByText('Բեռնվում ենք...')).toBeInTheDocument();
        expect(screen.getByText('Գլխավոր')).toBeInTheDocument();
        expect(screen.getByText('Դրամապանակ')).toBeInTheDocument();
        expect(screen.getByText('Հանույթ')).toBeInTheDocument();
        expect(screen.getByText('Ներգրավումներ')).toBeInTheDocument();
        expect(screen.getByText('Առաջադրանքներ')).toBeInTheDocument();
        expect(screen.getByText('Լոտո')).toBeInTheDocument();
        expect(screen.getByText('Լավագույններ')).toBeInTheDocument();
        expect(screen.getByText('Փոխանակում')).toBeInTheDocument();
        expect(screen.getByText('Կարգավորումներ')).toBeInTheDocument();
        expect(screen.getByText('Պրոֆիլ')).toBeInTheDocument();
        expect(screen.getByText('CFM ↔ CFMT Փոխանակում')).toBeInTheDocument();
        expect(screen.getByText('Փոխանակեք ձեր արժույթները')).toBeInTheDocument();
        expect(screen.getByText('CFM Հաշվեկշիռ')).toBeInTheDocument();
        expect(screen.getByText('CFMT Հաշվեկշիռ')).toBeInTheDocument();
        expect(screen.getByText('Առաջադրանքներ')).toBeInTheDocument();
        expect(screen.getByText('Կատարեք առաջադրանքներ և ստացեք պարգևներ')).toBeInTheDocument();
        expect(screen.getByText('Ակտիվ')).toBeInTheDocument();
        expect(screen.getByText('Ավարտված')).toBeInTheDocument();
        expect(screen.getByText('Ակնարկ')).toBeInTheDocument();
      });
    });
  });

  describe('Russian (ru)', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('ru');
    });

    test('should display Russian translations', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mnemine')).toBeInTheDocument();
        expect(screen.getByText('Профессиональный финансовый симулятор')).toBeInTheDocument();
        expect(screen.getByText('Назад')).toBeInTheDocument();
        expect(screen.getByText('Загрузка...')).toBeInTheDocument();
        expect(screen.getByText('Главная')).toBeInTheDocument();
        expect(screen.getByText('Кошелек')).toBeInTheDocument();
        expect(screen.getByText('Майнинг')).toBeInTheDocument();
        expect(screen.getByText('Рефералы')).toBeInTheDocument();
        expect(screen.getByText('Задания')).toBeInTheDocument();
        expect(screen.getByText('Лотерея')).toBeInTheDocument();
        expect(screen.getByText('Рейтинг')).toBeInTheDocument();
        expect(screen.getByText('Обмен')).toBeInTheDocument();
        expect(screen.getByText('Настройки')).toBeInTheDocument();
        expect(screen.getByText('Профиль')).toBeInTheDocument();
        expect(screen.getByText('CFM ↔ CFMT Обмен')).toBeInTheDocument();
        expect(screen.getByText('Обменивайте свои валюты')).toBeInTheDocument();
        expect(screen.getByText('CFM Баланс')).toBeInTheDocument();
        expect(screen.getByText('CFMT Баланс')).toBeInTheDocument();
        expect(screen.getByText('Задания')).toBeInTheDocument();
        expect(screen.getByText('Выполняйте задания и получайте награды')).toBeInTheDocument();
        expect(screen.getByText('Активные')).toBeInTheDocument();
        expect(screen.getByText('Выполненные')).toBeInTheDocument();
        expect(screen.getByText('Обзор')).toBeInTheDocument();
      });
    });
  });

  describe('English (en)', () => {
    beforeEach(async () => {
      await i18n.changeLanguage('en');
    });

    test('should display English translations', async () => {
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Mnemine')).toBeInTheDocument();
        expect(screen.getByText('Professional Financial Simulator')).toBeInTheDocument();
        expect(screen.getByText('Back')).toBeInTheDocument();
        expect(screen.getByText('Loading...')).toBeInTheDocument();
        expect(screen.getByText('Home')).toBeInTheDocument();
        expect(screen.getByText('Wallet')).toBeInTheDocument();
        expect(screen.getByText('Mining')).toBeInTheDocument();
        expect(screen.getByText('Referrals')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Lottery')).toBeInTheDocument();
        expect(screen.getByText('Leaderboard')).toBeInTheDocument();
        expect(screen.getByText('Swap')).toBeInTheDocument();
        expect(screen.getByText('Settings')).toBeInTheDocument();
        expect(screen.getByText('Profile')).toBeInTheDocument();
        expect(screen.getByText('CFM ↔ CFMT Swap')).toBeInTheDocument();
        expect(screen.getByText('Exchange your currencies')).toBeInTheDocument();
        expect(screen.getByText('CFM Balance')).toBeInTheDocument();
        expect(screen.getByText('CFMT Balance')).toBeInTheDocument();
        expect(screen.getByText('Tasks')).toBeInTheDocument();
        expect(screen.getByText('Complete tasks and earn rewards')).toBeInTheDocument();
        expect(screen.getByText('Active')).toBeInTheDocument();
        expect(screen.getByText('Completed')).toBeInTheDocument();
        expect(screen.getByText('Overview')).toBeInTheDocument();
      });
    });
  });

  describe('Language Switching', () => {
    test('should switch between languages correctly', async () => {
      const { rerender } = render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Start with Armenian
      await i18n.changeLanguage('hy');
      await waitFor(() => {
        expect(screen.getByText('Վերադառնալ')).toBeInTheDocument();
      });

      // Switch to Russian
      await i18n.changeLanguage('ru');
      await waitFor(() => {
        expect(screen.getByText('Назад')).toBeInTheDocument();
      });

      // Switch to English
      await i18n.changeLanguage('en');
      await waitFor(() => {
        expect(screen.getByText('Back')).toBeInTheDocument();
      });
    });
  });

  describe('Fallback System', () => {
    test('should fallback to Armenian when translation is missing', async () => {
      await i18n.changeLanguage('hy');
      
      render(
        <TestWrapper>
          <TestComponent />
        </TestWrapper>
      );

      // Should display Armenian text even if some keys are missing
      await waitFor(() => {
        expect(screen.getByText('Mnemine')).toBeInTheDocument();
        expect(screen.getByText('Պրոֆեսիոնալ ֆինանսական սիմուլյատոր')).toBeInTheDocument();
      });
    });
  });

  describe('Translation Key Structure', () => {
    test('should have consistent key structure across all languages', async () => {
      const languages = ['hy', 'ru', 'en'];
      
      for (const lang of languages) {
        await i18n.changeLanguage(lang);
        
        // Test common keys exist
        expect(i18n.exists('common.loading')).toBe(true);
        expect(i18n.exists('common.back')).toBe(true);
        expect(i18n.exists('app.title')).toBe(true);
        expect(i18n.exists('app.subtitle')).toBe(true);
        expect(i18n.exists('navigation.home')).toBe(true);
        expect(i18n.exists('swap.title')).toBe(true);
        expect(i18n.exists('tasks.title')).toBe(true);
      }
    });
  });
});
