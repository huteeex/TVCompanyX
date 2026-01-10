import React, { useState } from 'react';
import Layout from '../../components/layout/Layout';
import axios from 'axios';
import toast from 'react-hot-toast';
import { DocumentArrowDownIcon, CalendarIcon, ChartBarIcon } from '@heroicons/react/24/outline';

type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year' | 'custom';

const AccountantReportsPage: React.FC = () => {
  const [selectedPeriod, setSelectedPeriod] = useState<PeriodType>('month');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [generating, setGenerating] = useState(false);
  const [clientSearch, setClientSearch] = useState('');
  const [generatingClientReport, setGeneratingClientReport] = useState(false);

  const handleGeneratePeriodReport = async () => {
    if (selectedPeriod === 'custom' && (!startDate || !endDate)) {
      toast.error('Укажите начальную и конечную дату для произвольного периода');
      return;
    }

    setGenerating(true);
    try {
      const response = await axios.post('/api/accountant/generate-period-report', {
        period_type: selectedPeriod,
        start_date: selectedPeriod === 'custom' ? startDate : undefined,
        end_date: selectedPeriod === 'custom' ? endDate : undefined,
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `otchet-${selectedPeriod}-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF отчет успешно сгенерирован');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Ошибка генерации отчета');
    } finally {
      setGenerating(false);
    }
  };

  const handleGenerateClientReport = async () => {
    if (!clientSearch.trim()) {
      toast.error('Введите email, телефон или имя клиента');
      return;
    }

    setGeneratingClientReport(true);
    try {
      const response = await axios.post('/api/accountant/generate-client-report', {
        search_query: clientSearch.trim(),
      }, { responseType: 'blob' });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `otchet-client-${Date.now()}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();

      toast.success('PDF отчет по клиенту успешно сгенерирован');
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Клиент не найден или нет одобренных заявок');
    } finally {
      setGeneratingClientReport(false);
    }
  };

  const periodOptions = [
    { value: 'day', label: 'Сегодня', icon: CalendarIcon },
    { value: 'week', label: 'Текущая неделя', icon: CalendarIcon },
    { value: 'month', label: 'Текущий месяц', icon: CalendarIcon },
    { value: 'quarter', label: 'Текущий квартал', icon: ChartBarIcon },
    { value: 'year', label: 'Текущий год', icon: ChartBarIcon },
    { value: 'custom', label: 'Произвольный период', icon: CalendarIcon },
  ];

  return (
    <Layout role="accountant">
      <div className="space-y-6">
        <div><h1 className="text-2xl font-bold text-neutral-900">Отчеты</h1><p className="text-neutral-600">Генерация PDF отчетов по клиентам и за различные периоды</p></div>
        
        {/* Client Report Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-neutral-200">
            <h2 className="text-lg font-semibold text-neutral-900">Отчет по клиенту</h2>
            <p className="text-sm text-neutral-600">Введите email, телефон (8/7 формат) или имя клиента для генерации персонального отчета</p>
          </div>
          <div className="p-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-neutral-700 mb-2">
                Email, телефон или имя клиента
              </label>
              <input
                type="text"
                value={clientSearch}
                onChange={(e) => setClientSearch(e.target.value)}
                placeholder="example@mail.com или 89123456789 или Иван Иванов"
                className="w-full px-4 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                onKeyPress={(e) => e.key === 'Enter' && handleGenerateClientReport()}
              />
              <p className="mt-1 text-xs text-neutral-500">
                Телефон можно вводить в формате 8XXXXXXXXXX или 7XXXXXXXXXX
              </p>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleGenerateClientReport}
                disabled={generatingClientReport || !clientSearch.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                <DocumentArrowDownIcon className="h-5 w-5 mr-2" />
                {generatingClientReport ? 'Генерация...' : 'Сгенерировать отчет по клиенту'}
              </button>
            </div>
          </div>
        </div>

        {/* Period Report Section */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-neutral-200"><h2 className="text-lg font-semibold text-neutral-900">Отчет за период</h2><p className="text-sm text-neutral-600">Выберите период и сгенерируйте сводный отчет по всем одобренным заявкам</p></div>
          <div className="p-6 space-y-6">
            <div><label className="block text-sm font-medium text-neutral-700 mb-3">Выберите период</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">{periodOptions.map((option) => { const Icon = option.icon; return (<button key={option.value} onClick={() => setSelectedPeriod(option.value as PeriodType)} className={`flex items-center p-4 border-2 rounded-lg transition-all ${selectedPeriod === option.value ? 'border-primary-500 bg-primary-50 text-primary-700' : 'border-neutral-200 hover:border-neutral-300 text-neutral-700'}`}><Icon className="h-5 w-5 mr-3" /><span className="font-medium">{option.label}</span></button>); })}</div>
            </div>
            {selectedPeriod === 'custom' && (
              <div className="bg-neutral-50 p-4 rounded-lg"><h3 className="text-sm font-medium text-neutral-900 mb-3">Укажите даты</h3>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <div><label className="block text-sm font-medium text-neutral-700 mb-2">Начальная дата</label><input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                  <div><label className="block text-sm font-medium text-neutral-700 mb-2">Конечная дата</label><input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full px-3 py-2 border border-neutral-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500" /></div>
                </div>
              </div>
            )}
            <div className="flex justify-end"><button onClick={handleGeneratePeriodReport} disabled={generating} className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:bg-gray-400 disabled:cursor-not-allowed"><DocumentArrowDownIcon className="h-5 w-5 mr-2" />{generating ? 'Генерация...' : 'Сгенерировать PDF отчет'}</button></div>
          </div>
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-6"><div className="flex items-start"><ChartBarIcon className="h-6 w-6 text-blue-600 mt-1" /><div className="ml-4"><h3 className="text-lg font-semibold text-blue-900 mb-2">Что включено в отчет</h3><ul className="text-sm text-blue-800 space-y-1"><li>• Общая статистика по заявкам</li><li>• Разбивка по клиентам</li><li>• Сумма доходов за период</li><li>• Детальная таблица всех одобренных заявок</li><li>• Количество уникальных клиентов</li></ul></div></div></div>
          <div className="bg-green-50 border border-green-200 rounded-lg p-6"><div className="flex items-start"><DocumentArrowDownIcon className="h-6 w-6 text-green-600 mt-1" /><div className="ml-4"><h3 className="text-lg font-semibold text-green-900 mb-2">Формат отчета</h3><ul className="text-sm text-green-800 space-y-1"><li>• Формат: PDF</li><li>• Автоматическое скачивание после генерации</li><li>• Включает подпись бухгалтера</li><li>• Готов для печати и архивирования</li><li>• Содержит дату составления</li></ul></div></div></div>
        </div>
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4"><div className="flex"><div className="flex-shrink-0"><svg className="h-5 w-5 text-yellow-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor"><path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" /></svg></div><div className="ml-3"><p className="text-sm text-yellow-700"><strong>Примечание:</strong> В отчет включаются только заявки со статусом "Одобрена". Для просмотра и генерации отчетов по конкретным клиентам, перейдите на страницу <a href="/accountant/applications" className="font-semibold underline ml-1">Одобренные заявки</a>.</p></div></div></div>
      </div>
    </Layout>
  );
};

export default AccountantReportsPage;
