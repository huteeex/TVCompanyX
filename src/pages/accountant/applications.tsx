import React, { useState, useEffect } from 'react';
import axios from 'axios';
import Layout from '../../components/layout/Layout';
import toast from 'react-hot-toast';
import { ClipboardDocumentListIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';

interface Application {
  id: string;
  customer_name: string;
  customer_email: string;
  show_name: string;
  scheduled_at: string;
  cost: number;
}

const AccountantApplicationsPage: React.FC = () => {
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  useEffect(() => {
    loadApplications();
  }, []);

  const loadApplications = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/accountant/applications');
      setApplications(response.data.applications || []);
      setCurrentPage(1); // Reset to first page when loading
    } catch (error: any) {
      toast.error('Ошибка загрузки заявок');
    } finally {
      setLoading(false);
    }
  };

  // Пагинация
  const totalPages = Math.ceil(applications.length / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentApplications = applications.slice(indexOfFirstItem, indexOfLastItem);

  const handlePageChange = (pageNumber: number) => {
    setCurrentPage(pageNumber);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleGenerateReport = async (customerId: string, customerName: string) => {
    try {
      const response = await axios.post('/api/accountant/generate-client-report', 
        { customer_id: customerId }, 
        { responseType: 'blob' }
      );
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.download = `report-${customerName}.pdf`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('PDF отчет сгенерирован');
    } catch (error) {
      toast.error('Ошибка генерации отчета');
    }
  };

  return (
    <Layout role="accountant">
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold">Одобренные заявки</h1>
          <div className="text-sm text-neutral-600">
            Всего заявок: {applications.length}
          </div>
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : applications.length === 0 ? (
          <div className="bg-white shadow rounded-lg p-6">
            <div className="text-center py-8">
              <ClipboardDocumentListIcon className="h-12 w-12 text-neutral-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-neutral-900 mb-2">
                Заявки не найдены
              </h3>
              <p className="text-neutral-600">
                Нет одобренных заявок
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-neutral-200">
                <thead className="bg-neutral-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Клиент</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Email</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Шоу</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Дата</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">Стоимость</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-neutral-200">
                  {currentApplications.map(app => (
                    <tr key={app.id} className="hover:bg-neutral-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{app.customer_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{app.customer_email}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{app.show_name}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-neutral-500">{new Date(app.scheduled_at).toLocaleDateString('ru-RU')}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-neutral-900">{app.cost.toLocaleString('ru-RU')} ₽</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-6 py-4 flex items-center justify-between border-t border-neutral-200">
                <div className="text-sm text-neutral-600">
                  Показаны {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, applications.length)} из {applications.length} заявок
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handlePageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === 1
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    Назад
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-3 py-1 rounded-md text-sm font-medium ${
                        currentPage === page
                          ? 'bg-primary-600 text-white'
                          : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => handlePageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${
                      currentPage === totalPages
                        ? 'bg-neutral-100 text-neutral-400 cursor-not-allowed'
                        : 'bg-white text-neutral-700 border border-neutral-300 hover:bg-neutral-50'
                    }`}
                  >
                    Вперед
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default AccountantApplicationsPage;
