"use client";

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { api } from '@/lib/api';
import {
  BarChart3,
  Bell,
  CreditCard,
  Database,
  Download,
  Edit,
  Eye,
  XCircle,
  EyeOff,
  FileText,
  Globe,
  Mail,
  Palette,
  Plus,
  RefreshCw,
  Save,
  Server,
  Settings,
  Shield,
  Trash2,
  Upload,
  Users
} from 'lucide-react';
import { useEffect, useState } from 'react';

interface SystemSetting {
  id: string;
  key: string;
  value: any;
  type: 'string' | 'number' | 'boolean' | 'json' | 'array';
  category: string;
  description: string;
  isPublic: boolean;
  isRequired: boolean;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
    options?: string[];
  };
  lastModified: string;
  modifiedBy: string;
}

interface SettingCategory {
  id: string;
  name: string;
  description: string;
  icon: string;
  settings: SystemSetting[];
}

interface BackupConfig {
  id: string;
  name: string;
  description: string;
  schedule: string;
  isActive: boolean;
  lastBackup?: string;
  nextBackup?: string;
  retention: number; // days
  size: number; // bytes
}

const SettingsManagement = () => {
  const [categories, setCategories] = useState<SettingCategory[]>([]);
  const [backups, setBackups] = useState<BackupConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('general');
  const [modifiedSettings, setModifiedSettings] = useState<Map<string, any>>(new Map());
  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const [settingsRes, backupsRes] = await Promise.all([
        api.get('/admin/settings'),
        api.get('/admin/settings/backups')
      ]);

      setCategories(settingsRes.data.data || []);
      setBackups(backupsRes.data.data || []);
    } catch (error) {
      console.error('Error fetching settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateSetting = async (settingId: string, value: any) => {
    try {
      setSaving(true);
      await api.put(`/admin/settings/${settingId}`, { value });
      setModifiedSettings(prev => {
        const newMap = new Map(prev);
        newMap.delete(settingId);
        return newMap;
      });
    } catch (error) {
      console.error('Error updating setting:', error);
    } finally {
      setSaving(false);
    }
  };

  const saveAllSettings = async () => {
    try {
      setSaving(true);
      const updates = Array.from(modifiedSettings.entries()).map(([id, value]) => ({
        id,
        value
      }));

      await api.put('/admin/settings/bulk', { updates });
      setModifiedSettings(new Map());
      fetchSettings();
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  };

  const resetToDefault = async (settingId: string) => {
    try {
      await api.post(`/admin/settings/${settingId}/reset`);
      fetchSettings();
    } catch (error) {
      console.error('Error resetting setting:', error);
    }
  };

  const exportSettings = async () => {
    try {
      const response = await api.get('/admin/settings/export', {
        responseType: 'blob'
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings_backup_${new Date().toISOString().split('T')[0]}.json`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exporting settings:', error);
    }
  };

  const importSettings = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      await api.post('/admin/settings/import', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      fetchSettings();
    } catch (error) {
      console.error('Error importing settings:', error);
    }
  };

  const createBackup = async () => {
    try {
      await api.post('/admin/settings/backups');
      fetchSettings();
    } catch (error) {
      console.error('Error creating backup:', error);
    }
  };

  const getCategoryIcon = (categoryId: string) => {
    switch (categoryId) {
      case 'general': return <Settings className="h-5 w-5" />;
      case 'security': return <Shield className="h-5 w-5" />;
      case 'database': return <Database className="h-5 w-5" />;
      case 'email': return <Mail className="h-5 w-5" />;
      case 'notifications': return <Bell className="h-5 w-5" />;
      case 'payments': return <CreditCard className="h-5 w-5" />;
      case 'users': return <Users className="h-5 w-5" />;
      case 'system': return <Server className="h-5 w-5" />;
      case 'ui': return <Palette className="h-5 w-5" />;
      case 'localization': return <Globe className="h-5 w-5" />;
      default: return <Settings className="h-5 w-5" />;
    }
  };

  const renderSettingInput = (setting: SystemSetting) => {
    const currentValue = modifiedSettings.get(setting.id) ?? setting.value;

    switch (setting.type) {
      case 'boolean':
        return (
          <Switch
            checked={currentValue}
            onCheckedChange={(checked) => {
              setModifiedSettings(prev => new Map(prev).set(setting.id, checked));
            }}
          />
        );

      case 'number':
        return (
          <Input
            type="number"
            value={currentValue}
            onChange={(e) => {
              setModifiedSettings(prev => new Map(prev).set(setting.id, Number(e.target.value)));
            }}
            className="bg-gray-800 border-gray-600 text-white"
            min={setting.validation?.min}
            max={setting.validation?.max}
          />
        );

      case 'json':
        return (
          <Textarea
            value={typeof currentValue === 'string' ? currentValue : JSON.stringify(currentValue, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                setModifiedSettings(prev => new Map(prev).set(setting.id, parsed));
              } catch {
                setModifiedSettings(prev => new Map(prev).set(setting.id, e.target.value));
              }
            }}
            className="bg-gray-800 border-gray-600 text-white min-h-[100px] font-mono text-sm"
          />
        );

      case 'array':
        return (
          <div className="space-y-2">
            {Array.isArray(currentValue) ? currentValue.map((item, index) => (
              <div key={index} className="flex items-center space-x-2">
                <Input
                  value={item}
                  onChange={(e) => {
                    const newArray = [...currentValue];
                    newArray[index] = e.target.value;
                    setModifiedSettings(prev => new Map(prev).set(setting.id, newArray));
                  }}
                  className="bg-gray-800 border-gray-600 text-white"
                />
                <Button
                  onClick={() => {
                    const newArray = currentValue.filter((_, i) => i !== index);
                    setModifiedSettings(prev => new Map(prev).set(setting.id, newArray));
                  }}
                  size="sm"
                  variant="outline"
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            )) : null}
            <Button
              onClick={() => {
                const newArray = [...(currentValue || []), ''];
                setModifiedSettings(prev => new Map(prev).set(setting.id, newArray));
              }}
              size="sm"
              variant="outline"
              className="border-gray-600 text-gray-300"
            >
              <Plus className="h-4 w-4 mr-2" />
              Добавить элемент
            </Button>
          </div>
        );

      default:
        if (setting.validation?.options) {
          return (
            <Select
              value={currentValue}
              onValueChange={(value) => {
                setModifiedSettings(prev => new Map(prev).set(setting.id, value));
              }}
            >
              <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {setting.validation.options.map(option => (
                  <SelectItem key={option} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          );
        }

        return (
          <Input
            type={setting.key.toLowerCase().includes('password') ? 'password' : 'text'}
            value={currentValue}
            onChange={(e) => {
              setModifiedSettings(prev => new Map(prev).set(setting.id, e.target.value));
            }}
            className="bg-gray-800 border-gray-600 text-white"
            placeholder={setting.description}
          />
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Заголовок и управление */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between space-y-3 sm:space-y-0">
        <div className="flex items-center space-x-3">
          <Settings className="h-6 w-6 text-blue-400" />
          <div>
            <h2 className="text-xl font-bold text-white">⚙️ Управление настройками системы</h2>
            <p className="text-gray-400 text-sm">Конфигурация всех параметров системы и приложения</p>
          </div>
        </div>
        <div className="flex space-x-2">
          {modifiedSettings.size > 0 && (
            <Button
              onClick={saveAllSettings}
              disabled={saving}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Сохранение...' : `Сохранить (${modifiedSettings.size})`}
            </Button>
          )}
          <Button
            onClick={exportSettings}
            variant="outline"
            size="sm"
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            Экспорт
          </Button>
          <Button
            onClick={fetchSettings}
            variant="outline"
            size="sm"
            disabled={loading}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Обновить
          </Button>
        </div>
      </div>

      {/* Статистика */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Всего настроек</div>
                <div className="text-2xl font-bold text-white">
                  {categories.reduce((sum, cat) => sum + cat.settings.length, 0)}
                </div>
              </div>
              <Settings className="h-8 w-8 text-blue-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Изменено</div>
                <div className="text-2xl font-bold text-yellow-400">{modifiedSettings.size}</div>
              </div>
              <Edit className="h-8 w-8 text-yellow-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Резервные копии</div>
                <div className="text-2xl font-bold text-green-400">{backups.length}</div>
              </div>
              <FileText className="h-8 w-8 text-green-400" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gray-900 border-gray-700">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-400">Категории</div>
                <div className="text-2xl font-bold text-purple-400">{categories.length}</div>
              </div>
              <BarChart3 className="h-8 w-8 text-purple-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Основной контент */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-gray-800">
          <TabsTrigger value="settings" className="data-[state=active]:bg-blue-600">
            <Settings className="h-4 w-4 mr-2" />
            Настройки
          </TabsTrigger>
          <TabsTrigger value="backups" className="data-[state=active]:bg-blue-600">
            <FileText className="h-4 w-4 mr-2" />
            Резервные копии
          </TabsTrigger>
          <TabsTrigger value="import-export" className="data-[state=active]:bg-blue-600">
            <Upload className="h-4 w-4 mr-2" />
            Импорт/Экспорт
          </TabsTrigger>
        </TabsList>

        <TabsContent value="settings" className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Button
                onClick={() => setShowAdvanced(!showAdvanced)}
                variant="outline"
                size="sm"
                className="border-gray-600 text-gray-300"
              >
                {showAdvanced ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                {showAdvanced ? 'Скрыть' : 'Показать'} расширенные
              </Button>
            </div>
          </div>

          {loading ? (
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4 text-gray-400" />
                <p className="text-gray-400">Загрузка настроек...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {categories.map((category) => (
                <Card key={category.id} className="bg-gray-900 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      {getCategoryIcon(category.id)}
                      <span>{category.name}</span>
                      <Badge className="bg-blue-600 text-white">
                        {category.settings.length}
                      </Badge>
                    </CardTitle>
                    <p className="text-sm text-gray-400">{category.description}</p>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-6">
                      {category.settings.map((setting) => (
                        <div key={setting.id} className="grid grid-cols-1 lg:grid-cols-3 gap-4 p-4 bg-gray-800 rounded-lg">
                          <div className="lg:col-span-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <Label className="text-white font-medium">{setting.key}</Label>
                              {setting.isRequired && (
                                <Badge className="bg-red-600 text-white text-xs">Обязательно</Badge>
                              )}
                              {setting.isPublic && (
                                <Badge className="bg-green-600 text-white text-xs">Публичное</Badge>
                              )}
                              {modifiedSettings.has(setting.id) && (
                                <Badge className="bg-yellow-600 text-white text-xs">Изменено</Badge>
                              )}
                            </div>
                            <p className="text-sm text-gray-400">{setting.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <span className="text-xs text-gray-500">Тип: {setting.type}</span>
                              <span className="text-xs text-gray-500">
                                Изменено: {new Date(setting.lastModified).toLocaleDateString()}
                              </span>
                            </div>
                          </div>

                          <div className="lg:col-span-2">
                            <div className="space-y-2">
                              {renderSettingInput(setting)}
                              <div className="flex items-center space-x-2">
                                <Button
                                  onClick={() => updateSetting(setting.id, modifiedSettings.get(setting.id) ?? setting.value)}
                                  size="sm"
                                  variant="outline"
                                  className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                                >
                                  <Save className="h-4 w-4 mr-1" />
                                  Сохранить
                                </Button>
                                <Button
                                  onClick={() => resetToDefault(setting.id)}
                                  size="sm"
                                  variant="outline"
                                  className="border-yellow-600 text-yellow-400 hover:bg-yellow-600 hover:text-white"
                                >
                                  <RefreshCw className="h-4 w-4 mr-1" />
                                  Сбросить
                                </Button>
                                <Button
                                  onClick={() => {
                                    setModifiedSettings(prev => {
                                      const newMap = new Map(prev);
                                      newMap.delete(setting.id);
                                      return newMap;
                                    });
                                  }}
                                  size="sm"
                                  variant="outline"
                                  className="border-gray-600 text-gray-300 hover:bg-gray-700"
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Отменить
                                </Button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="backups" className="space-y-4">
          <Card className="bg-gray-900 border-gray-700">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Резервные копии настроек</span>
                <Button
                  onClick={createBackup}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Создать копию
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {backups.map((backup) => (
                  <div key={backup.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <h3 className="font-medium text-white">{backup.name}</h3>
                          <Badge className={backup.isActive ? 'bg-green-600' : 'bg-gray-600'}>
                            {backup.isActive ? 'Активен' : 'Неактивен'}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-300 mb-2">{backup.description}</p>
                        <div className="flex items-center space-x-4 text-xs text-gray-400">
                          <span>Расписание: {backup.schedule}</span>
                          <span>Размер: {(backup.size / 1024).toFixed(1)} KB</span>
                          <span>Хранение: {backup.retention} дней</span>
                          {backup.lastBackup && (
                            <span>Последняя: {new Date(backup.lastBackup).toLocaleString()}</span>
                          )}
                          {backup.nextBackup && (
                            <span>Следующая: {new Date(backup.nextBackup).toLocaleString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-green-600 text-green-400 hover:bg-green-600 hover:text-white"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="import-export" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="h-5 w-5 text-green-400" />
                  <span>Экспорт настроек</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Экспортируйте все настройки системы в JSON файл для резервного копирования или миграции.
                  </p>
                  <Button
                    onClick={exportSettings}
                    className="w-full bg-green-600 hover:bg-green-700 text-white"
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Экспортировать настройки
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-900 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Upload className="h-5 w-5 text-blue-400" />
                  <span>Импорт настроек</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-gray-400">
                    Импортируйте настройки из JSON файла. Будьте осторожны - это перезапишет существующие настройки.
                  </p>
                  <div className="border-2 border-dashed border-gray-600 rounded-lg p-6 text-center">
                    <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                    <p className="text-sm text-gray-400 mb-2">Перетащите JSON файл сюда или</p>
                    <input
                      type="file"
                      accept=".json"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) importSettings(file);
                      }}
                      className="hidden"
                      id="import-file"
                    />
                    <Button
                      onClick={() => document.getElementById('import-file')?.click()}
                      variant="outline"
                      className="border-gray-600 text-gray-300"
                    >
                      Выбрать файл
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SettingsManagement;
