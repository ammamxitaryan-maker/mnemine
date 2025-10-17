/**
 * Хук для работы с навигацией админ панели
 */

import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { ADMIN_NAVIGATION } from '@/config/adminConfig';
import { NavigationItem } from '@/config/adminConfig';

export const useAdminNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();

  // Получить все маршруты
  const allRoutes = useMemo(() => {
    return [...ADMIN_NAVIGATION.MAIN_ROUTES, ...ADMIN_NAVIGATION.LEGACY_ROUTES]
      .sort((a, b) => a.order - b.order);
  }, []);

  // Получить текущий маршрут
  const currentRoute = useMemo(() => {
    return allRoutes.find(route => {
      if (route.path === '/admin') {
        return location.pathname === '/admin';
      }
      return location.pathname.startsWith(route.path);
    });
  }, [location.pathname, allRoutes]);

  // Получить хлебные крошки
  const breadcrumbs = useMemo(() => {
    const crumbs = [
      { label: 'Admin', path: '/admin' }
    ];

    if (currentRoute && currentRoute.path !== '/admin') {
      crumbs.push({
        label: currentRoute.label,
        path: currentRoute.path
      });
    }

    return crumbs;
  }, [currentRoute]);

  // Получить заголовок страницы
  const pageTitle = useMemo(() => {
    if (currentRoute) {
      return currentRoute.label;
    }
    
    // Fallback для специальных случаев
    if (location.pathname.includes('/user/')) {
      return 'User Details';
    }
    
    return 'Admin Panel';
  }, [currentRoute, location.pathname]);

  // Получить описание страницы
  const pageDescription = useMemo(() => {
    return currentRoute?.description || 'Administrative panel';
  }, [currentRoute]);

  // Навигация
  const goTo = (path: string) => {
    navigate(path);
  };

  const goBack = () => {
    navigate(-1);
  };

  const goToDashboard = () => {
    navigate('/admin');
  };

  // Проверка активного маршрута
  const isActiveRoute = (path: string): boolean => {
    if (path === '/admin') {
      return location.pathname === '/admin';
    }
    return location.pathname.startsWith(path);
  };

  // Получить следующий/предыдущий маршрут
  const getAdjacentRoutes = () => {
    const currentIndex = allRoutes.findIndex(route => route.path === currentRoute?.path);
    
    return {
      previous: currentIndex > 0 ? allRoutes[currentIndex - 1] : null,
      next: currentIndex < allRoutes.length - 1 ? allRoutes[currentIndex + 1] : null,
    };
  };

  return {
    // Данные
    allRoutes,
    currentRoute,
    breadcrumbs,
    pageTitle,
    pageDescription,
    
    // Навигация
    goTo,
    goBack,
    goToDashboard,
    isActiveRoute,
    getAdjacentRoutes,
    
    // Утилиты
    location,
  };
};
