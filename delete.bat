@echo off
echo ======================================
echo Удаление папки node_modules...
echo ======================================

:: Останавливаем процессы Node (чтобы файлы не были заняты)
taskkill /f /im node.exe >nul 2>&1
taskkill /f /im npm.exe >nul 2>&1

:: Проверяем, существует ли папка
if exist node_modules (
    echo Найдена папка node_modules, удаляю...
    rmdir /s /q node_modules
) else (
    echo Папка node_modules не найдена.
)

echo.
echo ✅ Готово!
pause
