import React, { useEffect, useState } from 'react'
import { useRouter } from 'next/router'
import Layout from '../../components/layout/Layout'
import Chat from '../../components/chat/Chat'
import { useSelector } from 'react-redux'
import { RootState } from '../../redux/store'
import socketService from '../../utils/socket'
import toast from 'react-hot-toast'
import { X, Send, Eye, Edit2, XCircle, FileText } from 'lucide-react'
import { IMaskInput } from 'react-imask'

const AgentChatPage: React.FC = () => {
  const router = useRouter()
  const { room } = router.query as { room?: string }
  const reduxRooms = useSelector((s: RootState) => s.chat.rooms)
  const user = useSelector((s: RootState) => s.auth.user)
  const [rooms, setRooms] = useState<any[]>([])
  const [filteredRooms, setFilteredRooms] = useState<any[]>([])
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [pageInput, setPageInput] = useState('')
  const [loading, setLoading] = useState(true)
  const [routerReady, setRouterReady] = useState(false)
  const [applicationData, setApplicationData] = useState<any>(null)
  const [showDetailsModal, setShowDetailsModal] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  const [editFormData, setEditFormData] = useState<any>({})
  const [sendingToCommercial, setSendingToCommercial] = useState(false)
  const [cancelling, setCancelling] = useState(false)
  const [shows, setShows] = useState<any[]>([])
  const [sendingContract, setSendingContract] = useState(false)
  const itemsPerPage = 7

  // Helper to get status text in Russian
  const getStatusText = (status: string) => {
    switch (status) {
      case 'pending': return 'Ожидает агента'
      case 'in_progress': return 'В работе'
      case 'sent_to_commercial': return 'В ком. отделе'
      case 'approved': return 'Одобрена'
      case 'rejected': return 'Отклонена'
      default: return 'Неизвестно'
    }
  }

  // Helper to get status badge color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-neutral-200 text-neutral-700'
      case 'in_progress': return 'bg-primary-100 text-primary-700'
      case 'sent_to_commercial': return 'bg-primary-200 text-primary-800'
      case 'approved': return 'bg-primary-100 text-primary-700'
      case 'rejected': return 'bg-neutral-200 text-neutral-700'
      default: return 'bg-neutral-100 text-neutral-600'
    }
  }

  // Wait for router to be ready
  useEffect(() => {
    if (router.isReady) {
      setRouterReady(true)
    }
  }, [router.isReady])

  // Fetch applications once on mount
  useEffect(() => {
    ;(async () => {
      setLoading(true)
      try {
        // Load shows
        const showsResp = await fetch('/api/shows', { credentials: 'same-origin' })
        const showsData = await showsResp.json()
        setShows(showsData || [])

        const resp = await (await fetch('/api/applications', { credentials: 'same-origin' })).json()
        const apps: any[] = resp || []

        // Check and auto-reject expired applications
        const checkPromises = apps.map(app => checkAndRejectExpiredApplication(app))
        await Promise.all(checkPromises)
        
        // Reload applications after potential auto-rejections
        const updatedResp = await (await fetch('/api/applications', { credentials: 'same-origin' })).json()
        const updatedApps: any[] = updatedResp || []

        // Filter out only pending applications (no chat exists yet)
        // Keep in_progress, sent_to_commercial, approved, rejected for chat history
        const appsWithChats = updatedApps.filter(a => a.status !== 'pending')

        // Build list of customer chats (by application)
        const customerChats = appsWithChats.map(a => {
          const rawId = a.id || ''
          const roomId = rawId.startsWith('application-') ? rawId : `application-${rawId}`
          const reduxRoom = reduxRooms.find(rr => rr.id === roomId)
          
          // Show customer name
          const customerDisplayName = a.customerName || a.customer_name || (reduxRoom && reduxRoom.name) || 'Клиент'
          
          // Build subtitle with show name and cost if available
          const showInfo = a.show || a.show_name ? ` • ${a.show || a.show_name}` : ''
          const costInfo = a.cost ? ` • ${a.cost}₽` : ''
          
          return {
            id: roomId,
            name: customerDisplayName,
            subtitle: `#${(a.id || '').slice(-8)}${showInfo}${costInfo}`,
            unread: reduxRoom ? reduxRoom.unreadCount : 0,
            status: a.status,
            raw: a,
          }
        })
        
        setRooms([...customerChats])
      } catch (e) {
        console.error('Failed to load applications:', e)
      } finally {
        setLoading(false)
      }
    })()
  }, [])

  // Filter rooms by status
  useEffect(() => {
    if (statusFilter === 'all') {
      setFilteredRooms(rooms)
    } else {
      const filtered = rooms.filter(r => r.status === statusFilter)
      
      // If current room is not in filtered list, add it to keep chat open
      if (room && !filtered.find(r => r.id === room)) {
        const currentRoom = rooms.find(r => r.id === room)
        if (currentRoom) {
          setFilteredRooms([currentRoom, ...filtered])
        } else {
          setFilteredRooms(filtered)
        }
      } else {
        setFilteredRooms(filtered)
      }
    }
    setCurrentPage(1) // Reset to page 1 when filter changes
  }, [rooms, statusFilter, room])

  // No need to auto-join commercial chats since they're not displayed

  // Get counts for each status
  const getStatusCount = (status: string) => {
    if (status === 'all') return rooms.length
    return rooms.filter(r => r.status === status).length
  }

  // Pagination helpers
  const totalPages = Math.ceil(filteredRooms.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentRooms = filteredRooms.slice(startIndex, endIndex)

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const handleQuickJump = (e: React.FormEvent) => {
    e.preventDefault()
    const page = parseInt(pageInput)
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      setCurrentPage(page)
      setPageInput('')
    }
  }

  // Check if application date has passed and auto-reject
  const checkAndRejectExpiredApplication = async (app: any) => {
    if (!app || !app.scheduled_at) return false
    
    const scheduledDate = new Date(app.scheduled_at)
    const now = new Date()
    
    // Check if scheduled date is in the past
    if (scheduledDate < now && (app.status === 'pending' || app.status === 'in_progress')) {
      try {
        const response = await fetch(`/api/applications/${app.id}`, {
          method: 'PUT',
          credentials: 'same-origin',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            status: 'rejected'
          })
        })
        
        if (response.ok) {
          toast.error(`Заявка #${app.id.slice(-8)} автоматически отклонена - дата показа прошла`)
          return true
        }
      } catch (error) {
        console.error('Failed to auto-reject expired application:', error)
      }
    }
    return false
  }

  // Handle send to commercial
  const handleSendToCommercial = async () => {
    if (!appId || !applicationData) return
    
    if (!confirm('Отправить заявку в коммерческий отдел?')) return
    
    setSendingToCommercial(true)
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          status: 'sent_to_commercial',
          createCommercialChat: true 
        })
      })
      
      if (response.ok) {
        toast.success('Заявка отправлена в коммерческий отдел')
        // Reload application data
        const updatedApp = await response.json()
        setApplicationData(updatedApp)
        // Update rooms list
        setRooms(prevRooms => 
          prevRooms.map(r => 
            r.id === room ? { ...r, raw: updatedApp, status: updatedApp.status } : r
          )
        )
      } else {
        const error = await response.json()
        toast.error(error.message || 'Ошибка при отправке в коммерческий отдел')
      }
    } catch (error) {
      toast.error('Ошибка при отправке в коммерческий отдел')
    } finally {
      setSendingToCommercial(false)
    }
  }

  // Handle cancel application
  const handleCancelApplication = async () => {
    if (!appId) return
    
    if (!confirm('Вы уверены, что хотите отменить эту заявку?')) return
    
    setCancelling(true)
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'DELETE',
        credentials: 'same-origin'
      })
      
      if (response.ok) {
        toast.success('Заявка отменена')
        // Redirect to chat list
        router.push('/agent/chat')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Ошибка при отмене заявки')
      }
    } catch (error) {
      toast.error('Ошибка при отмене заявки')
    } finally {
      setCancelling(false)
    }
  }

  // Handle send contract
  const handleSendContract = async () => {
    if (!appId || !applicationData) return
    
    if (!confirm('Отправить договор клиенту?')) return
    
    setSendingContract(true)
    try {
      // Check if contract already exists
      const checkResponse = await fetch(`/api/contracts?customerId=${applicationData.customer_id}`, {
        credentials: 'same-origin'
      })
      const existingContracts = await checkResponse.json()
      const hasContract = existingContracts.some((c: any) => c.application_id === appId)
      
      if (hasContract) {
        toast.error('Договор для этой заявки уже создан')
        setSendingContract(false)
        return
      }

      // Get show name from shows list or applicationData
      let showName = applicationData.show_name || ''
      if (!showName && applicationData.show_id) {
        const show = shows.find(s => s.id === applicationData.show_id)
        showName = show?.name || ''
      }

      // Create contract
      const response = await fetch('/api/contracts', {
        method: 'POST',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          application_id: appId,
          customer_id: applicationData.customer_id,
          agent_id: user?.id,
          show_name: showName,
          scheduled_at: applicationData.scheduled_at,
          duration_seconds: applicationData.duration_seconds,
          cost: applicationData.cost,
          customer_name: applicationData.customer_name || applicationData.customerName || '',
          customer_email: applicationData.customer_email || '',
          customer_phone: applicationData.customer_phone || applicationData.contact_phone || applicationData.phone || '',
          description: applicationData.description || '',
          company_name: 'ТВ Компания X'
        })
      })
      
      if (response.ok) {
        const contract = await response.json()
        toast.success(`Договор ${contract.contract_number} успешно отправлен клиенту`)
        
        // Send notification to customer via socket
        socketService.emit('send_notification', {
          userId: applicationData.customer_id,
          type: 'contract_sent',
          message: `Вам отправлен договор ${contract.contract_number}`,
          data: { contractId: contract.id, applicationId: appId }
        })
      } else {
        const error = await response.json()
        toast.error(error.error || 'Ошибка при создании договора')
      }
    } catch (error) {
      console.error('Error sending contract:', error)
      toast.error('Ошибка при отправке договора')
    } finally {
      setSendingContract(false)
    }
  }

  // Handle view details
  const handleViewDetails = () => {
    if (!applicationData) return
    setShowDetailsModal(true)
  }

  // Handle edit
  const handleEdit = () => {
    if (!applicationData) return
    setEditFormData({
      description: applicationData.description || '',
      contact_phone: applicationData.contact_phone || '',
      cost: applicationData.cost || 0,
      duration_seconds: applicationData.duration_seconds || 0,
      show_id: applicationData.show_id || '',
      scheduled_at: applicationData.scheduled_at || ''
    })
    setShowEditModal(true)
  }

  // Handle save edit
  const handleSaveEdit = async () => {
    if (!appId) return
    
    try {
      const response = await fetch(`/api/applications/${appId}`, {
        method: 'PUT',
        credentials: 'same-origin',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editFormData)
      })
      
      if (response.ok) {
        const updatedApp = await response.json()
        setApplicationData(updatedApp)
        setRooms(prevRooms => 
          prevRooms.map(r => 
            r.id === room ? { ...r, raw: updatedApp } : r
          )
        )
        setShowEditModal(false)
        toast.success('Заявка обновлена')
      } else {
        const error = await response.json()
        toast.error(error.message || 'Ошибка при обновлении заявки')
      }
    } catch (error) {
      toast.error('Ошибка при обновлении заявки')
    }
  }

  // If ?room= is provided, render single room with both chats; otherwise show default panels
  const selectedRoom = rooms.find(r => r.id === (room as string))
  const isCustomerChat = room && (room as string).startsWith('application-')
  
  // Extract application ID from room
  let appId = ''
  if (isCustomerChat) {
    appId = (room as string).replace('application-', '')
  }

  // Update applicationData when room changes or appId changes
  useEffect(() => {
    const loadData = async () => {
      if (appId) {
        try {
          console.log('[Agent Chat] Fetching fresh application data for:', appId)
          const response = await fetch(`/api/applications/${appId}`, {
            credentials: 'same-origin',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (response.ok) {
            const data = await response.json()
            console.log('[Agent Chat] Loaded fresh application data:', data)
            console.log('[Agent Chat] commercial_id value:', data.commercial_id, 'type:', typeof data.commercial_id)
            
            // Check if application date has passed and auto-reject
            const wasRejected = await checkAndRejectExpiredApplication(data)
            if (wasRejected) {
              // Reload data after auto-rejection
              const updatedResponse = await fetch(`/api/applications/${appId}`, {
                credentials: 'same-origin',
                headers: { 'Cache-Control': 'no-cache' }
              })
              if (updatedResponse.ok) {
                const updatedData = await updatedResponse.json()
                setApplicationData(updatedData)
              }
            } else {
              setApplicationData(data)
            }
          } else {
            console.error('[Agent Chat] Failed to load application, status:', response.status)
          }
        } catch (error) {
          console.error('[Agent Chat] Failed to load application:', error)
        }
      } else if (selectedRoom?.raw) {
        console.log('[Agent Chat] Setting application data from selectedRoom:', selectedRoom.raw)
        
        // Check if application date has passed
        const wasRejected = await checkAndRejectExpiredApplication(selectedRoom.raw)
        if (!wasRejected) {
          setApplicationData(selectedRoom.raw)
        }
      }
    }
    
    loadData()
  }, [appId, selectedRoom])

  // Listen for application updates via socket
  useEffect(() => {
    if (!appId) return

    const handleApplicationUpdate = async (data: any) => {
      if (data.applicationId === appId) {
        // Reload full application data from server to get all fields
        try {
          const response = await fetch(`/api/applications/${appId}`, {
            credentials: 'same-origin',
            headers: {
              'Cache-Control': 'no-cache'
            }
          })
          if (response.ok) {
            const fullData = await response.json()
            
            // Force update by creating new object reference
            setApplicationData({ ...fullData })
            
            // Also update in rooms list
            setRooms(prevRooms => 
              prevRooms.map(r => 
                r.id === room ? { ...r, raw: fullData, status: fullData.status } : r
              )
            )
            
            // Show toast notification
            if (fullData.commercial_id && !applicationData?.commercial_id) {
              toast.success('Коммерческий отдел принял заявку в работу')
            }
          }
        } catch (error) {
          console.error('[Agent Chat] Failed to reload application after socket event:', error)
        }
      }
    }

    socketService.on('application:updated', handleApplicationUpdate)

    return () => {
      socketService.off('application:updated', handleApplicationUpdate)
    }
  }, [appId, room, applicationData])

  // Monitor commercial_id changes for debugging
  useEffect(() => {
    if (applicationData) {
      console.log('[Agent Chat] applicationData updated:', {
        id: applicationData.id?.slice(-8),
        status: applicationData.status,
        commercial_id: applicationData.commercial_id,
        commercial_id_type: typeof applicationData.commercial_id,
        hasCommercialId: !!applicationData.commercial_id
      })
    }
  }, [applicationData?.commercial_id, applicationData?.status])
  
  return (
    <Layout role="agent">
      <div className="grid grid-cols-4 gap-4" style={{height: 'calc(100vh - 100px)'}}>
        <aside className="col-span-1 bg-gradient-to-b from-neutral-50 to-white rounded-xl shadow-lg border border-neutral-200 p-4 flex flex-col h-full">
          {/* Header */}
          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-900 mb-1">Чаты</h3>
            <p className="text-xs text-neutral-500">Активные диалоги с клиентами</p>
          </div>
          
          {/* Status filter */}
          <div className="mb-4 flex-shrink-0">
            <div className="relative">
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)}
                className="w-full appearance-none px-3 py-2.5 bg-white border border-neutral-200 rounded-lg text-sm font-medium text-neutral-700 hover:bg-neutral-50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all cursor-pointer shadow-sm"
              >
                <option value="all">Все заявки ({getStatusCount('all')})</option>
                <option value="in_progress">В работе ({getStatusCount('in_progress')})</option>
                <option value="sent_to_commercial">В ком. отделе ({getStatusCount('sent_to_commercial')})</option>
                <option value="approved">Одобрена ({getStatusCount('approved')})</option>
                <option value="rejected">Отклонена ({getStatusCount('rejected')})</option>
              </select>
              <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                <svg className="h-4 w-4 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>

          <div className="space-y-2 flex-1 overflow-y-auto mb-4 pr-1" style={{maxHeight: 'calc(100% - 150px)'}}>
            {filteredRooms.length === 0 ? (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 bg-neutral-100 rounded-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-neutral-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                  </svg>
                </div>
                <p className="text-sm font-medium text-neutral-700">Нет заявок</p>
                {statusFilter !== 'all' && (
                  <p className="text-xs text-neutral-500 mt-1">Попробуйте другой фильтр</p>
                )}
              </div>
            ) : (
              currentRooms.map(r => {
                const roomIdStr = r.id
                const unread = r.unread || 0
                const title = r.name || 'Клиент'
                const isActive = room === roomIdStr
                return (
                  <button 
                    key={roomIdStr}
                    onClick={() => router.push(`/agent/chat?room=${encodeURIComponent(roomIdStr)}`)}
                    className={`w-full p-3 rounded-lg text-left transition-all duration-200 ${
                      isActive 
                        ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-lg scale-[1.02]' 
                        : 'bg-white hover:bg-neutral-50 border border-neutral-200 hover:border-primary-200 hover:shadow-md'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className={`text-sm font-semibold truncate mb-1 ${
                          isActive ? 'text-white' : 'text-neutral-900'
                        }`}>
                          {title}
                        </div>
                        <div className={`text-xs truncate mb-2 ${
                          isActive ? 'text-primary-100' : 'text-neutral-500'
                        }`}>
                          {r.subtitle}
                        </div>
                        {r.status && (
                          <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${
                            isActive 
                              ? 'bg-white/20 text-white' 
                              : getStatusColor(r.status)
                          }`}>
                            {getStatusText(r.status)}
                          </span>
                        )}
                      </div>
                      {unread > 0 && (
                        <div className={`flex-shrink-0 ${
                          isActive ? 'bg-white text-primary-600' : 'bg-primary-500 text-white'
                        } h-6 min-w-[24px] px-1.5 rounded-full flex items-center justify-center text-xs font-bold shadow-sm`}>
                          {unread}
                        </div>
                      )}
                    </div>
                  </button>
                )
              })
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex flex-col gap-2 flex-shrink-0 border-t border-neutral-200 pt-3">
              <div className="text-xs text-neutral-600 text-center font-medium">
                {startIndex + 1}-{Math.min(endIndex, filteredRooms.length)} из {filteredRooms.length}
              </div>
              
              <div className="flex items-center justify-center gap-1.5">
                <button
                  onClick={() => handlePageChange(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="p-1.5 text-xs rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
                
                {totalPages <= 5 ? (
                  Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`min-w-[32px] px-2 py-1.5 text-xs font-medium rounded-lg transition-all shadow-sm ${
                        currentPage === page
                          ? 'bg-gradient-to-r from-primary-500 to-primary-600 text-white shadow-md'
                          : 'bg-white border border-neutral-200 text-neutral-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700'
                      }`}
                    >
                      {page}
                    </button>
                  ))
                ) : (
                  <form onSubmit={handleQuickJump} className="flex items-center gap-1.5">
                    <input
                      type="number"
                      min="1"
                      max={totalPages}
                      value={pageInput}
                      onChange={(e) => setPageInput(e.target.value)}
                      placeholder={currentPage.toString()}
                      className="w-12 px-2 py-1.5 border border-neutral-200 rounded-lg text-center text-xs font-medium focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent shadow-sm"
                    />
                    <span className="text-xs text-neutral-600 font-medium">/{totalPages}</span>
                  </form>
                )}
                
                <button
                  onClick={() => handlePageChange(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="p-1.5 text-xs rounded-lg bg-white border border-neutral-200 text-neutral-700 hover:bg-primary-50 hover:border-primary-300 hover:text-primary-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all shadow-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          )}
        </aside>
        <main className="col-span-3 bg-gradient-to-br from-white to-neutral-50 rounded-xl shadow-lg border border-neutral-200 p-4 h-full flex flex-col">
          {loading || !routerReady ? (
            // Show loading state while data loads OR router is not ready
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 rounded-full border-4 border-neutral-200"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary-600 border-t-transparent animate-spin"></div>
                </div>
                <p className="text-neutral-600 font-medium">Загрузка чатов...</p>
                <p className="text-xs text-neutral-500 mt-1">Пожалуйста, подождите</p>
              </div>
            </div>
          ) : isCustomerChat && room ? (
            // Show customer chat and commercial chat side by side
            <div className="grid grid-cols-2 gap-3 -m-4" style={{ height: 'calc(100vh - 100px)' }}>
              {/* Customer Chat */}
              <div className="bg-white rounded-l-xl border-r border-neutral-200 flex flex-col overflow-hidden">
                <div className="border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-primary-600 to-primary-700 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 flex-1 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white font-bold text-lg">
                        {selectedRoom?.name?.charAt(0) || '👤'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-white text-sm truncate">
                          {selectedRoom?.name || 'Клиент'}
                        </h3>
                        <p className="text-xs text-primary-100 truncate">
                          {selectedRoom?.subtitle || 'Загрузка...'}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  {/* Action Buttons - show for in_progress and sent_to_commercial */}
                  {applicationData && (applicationData.status === 'in_progress' || applicationData.status === 'sent_to_commercial') && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleViewDetails}
                        className="flex-1 px-3 py-2 bg-white/90 hover:bg-white text-primary-700 border border-white/50 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                        title="Посмотреть детали"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Детали</span>
                      </button>
                      <button
                        onClick={handleEdit}
                        className="flex-1 px-3 py-2 bg-white/90 hover:bg-white text-primary-700 border border-white/50 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                        title="Редактировать"
                      >
                        <Edit2 className="h-4 w-4" />
                        <span>Изменить</span>
                      </button>
                      {applicationData.status === 'in_progress' && (
                        <button
                          onClick={handleSendToCommercial}
                          disabled={sendingToCommercial}
                          className="flex-1 px-3 py-2 bg-white text-primary-700 border border-white/50 rounded-lg text-xs font-medium hover:bg-white hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                          title="В коммерческий отдел"
                        >
                          <Send className="h-4 w-4" />
                          <span>{sendingToCommercial ? 'Отправка...' : 'В отдел'}</span>
                        </button>
                      )}
                      <button
                        onClick={handleCancelApplication}
                        disabled={cancelling}
                        className="px-3 py-2 bg-white/90 hover:bg-white text-white border border-white/50 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center justify-center disabled:opacity-50"
                        title="Отменить заявку"
                      >
                        <XCircle className="h-4 w-4 text-neutral-600" />
                      </button>
                    </div>
                  )}
                  
                  {/* Send Contract Button - show only for approved applications */}
                  {applicationData && applicationData.status === 'approved' && (
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={handleViewDetails}
                        className="flex-1 px-3 py-2 bg-white/90 hover:bg-white text-primary-700 border border-white/50 rounded-lg text-xs font-medium hover:shadow-md transition-all flex items-center justify-center gap-1.5"
                        title="Посмотреть детали"
                      >
                        <Eye className="h-4 w-4" />
                        <span>Детали</span>
                      </button>
                      <button
                        onClick={handleSendContract}
                        disabled={sendingContract}
                        className="flex-1 px-3 py-2 bg-white text-primary-700 border border-white/50 rounded-lg text-xs font-medium hover:bg-white hover:shadow-md transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
                        title="Отправить договор"
                      >
                        <FileText className="h-4 w-4" />
                        <span>{sendingContract ? 'Отправка...' : 'Договор'}</span>
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex-1 overflow-hidden min-h-0">
                  <Chat 
                    roomId={room as string} 
                    roomName={selectedRoom?.name || 'Клиент'} 
                    subtitle={selectedRoom?.subtitle || ''}
                  />
                </div>
              </div>

              {/* Commercial Department Chat - Only when status is sent_to_commercial */}
              {applicationData && applicationData.status === 'sent_to_commercial' ? (
                <div className="bg-white rounded-r-xl flex flex-col overflow-hidden">\n                  <div className="border-b border-neutral-200 px-4 py-3 bg-gradient-to-r from-primary-500 to-primary-600 flex-shrink-0">\n                    <div className="flex items-center gap-3">\n                      <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">\n                        <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">\n                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />\n                        </svg>\n                      </div>\n                      <div className="flex-1 min-w-0">\n                        <h3 className="font-bold text-white text-sm">\n                          Коммерческий отдел\n                        </h3>\n                        <p className="text-xs text-primary-100">\n                          Обсуждение деталей заявки\n                        </p>\n                      </div>\n                    </div>\n                  </div>
                  <div className="border-b px-2 py-1.5 bg-gradient-to-r from-purple-50 to-purple-100 flex-shrink-0">
                    <h3 className="font-semibold text-purple-900 flex items-center gap-1 text-xs">
                      <span className="text-sm">🏢</span>
                      <span>Ком. отдел</span>
                    </h3>
                    <p className="text-[10px] text-purple-700 truncate">
                      {applicationData.commercial_id 
                        ? `Принято (ID: ${applicationData.commercial_id.slice(0, 8)}...)`
                        : 'Ожидает принятия'}
                    </p>
                  </div>
                  
                  <div className="flex-1 overflow-hidden min-h-0">
                    {!applicationData.commercial_id || applicationData.commercial_id === null ? (
                      // Waiting state - более компактный
                      <div className="h-full flex flex-col items-center justify-center p-4">
                        <div className="text-4xl mb-2 animate-pulse">⏳</div>
                        <div className="text-center max-w-xs">
                          <p className="text-gray-700 font-medium text-sm mb-1">Ожидает принятия</p>
                          <p className="text-xs text-gray-600 mb-2">
                            После принятия коммерческим отделом чат станет активным
                          </p>
                          <div className="inline-flex items-center space-x-1 px-2 py-1 bg-purple-50 rounded-full text-purple-700 text-[10px]">
                            <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
                              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            <span>Обновление...</span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      // Active chat
                      <Chat
                        roomId={`commercial-agent-${user?.id}-app-${appId}`}
                        roomName="Коммерческий отдел"
                        subtitle="Обсуждение деталей"
                      />
                    )}
                  </div>
                </div>
              ) : (
                // Placeholder when no commercial chat needed
                <div className="bg-white rounded-r-lg flex items-center justify-center overflow-hidden">
                  <div className="text-center text-gray-400 max-w-md px-6">
                    <div className="text-6xl mb-4">📋</div>
                    <p className="text-lg font-medium text-gray-600 mb-2">
                      {applicationData?.status === 'in_progress' 
                        ? 'Работа с клиентом' 
                        : 'Коммерческий отдел не задействован'}
                    </p>
                    <p className="text-sm text-gray-500 mb-4">
                      {applicationData?.status === 'in_progress' 
                        ? 'Заявка находится в работе. Чат с коммерческим отделом появится после отправки заявки в коммерческий отдел.' 
                        : 'Для работы с коммерческим отделом измените статус заявки на "В коммерческий отдел".'}
                    </p>
                    {applicationData?.status === 'in_progress' && (
                      <div className="inline-flex items-center space-x-2 px-4 py-2 bg-primary-50 rounded-full text-primary-700 text-sm">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        <span>Активная работа с клиентом</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ) : (
            // Default view when no room selected
            <div className="h-[70vh] card">
              {
                (() => {
                  const name = selectedRoom ? selectedRoom.name : 'Чат с клиентами'
                  const subtitle = selectedRoom ? selectedRoom.subtitle : ''
                  const roomIdToUse = (room as string) || 'agent-customers'
                  return <Chat roomId={roomIdToUse} roomName={name} subtitle={subtitle} />
                })()
              }
            </div>
          )}
        </main>
      </div>

      {/* Details Modal */}
      {showDetailsModal && applicationData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-hidden">
            {/* Header */}
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Eye className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Детали заявки</h3>
                  <p className="text-sm text-primary-100">ID: #{applicationData.id.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowDetailsModal(false)}
                className="text-white hover:bg-white/20 transition-colors p-2 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6 overflow-y-auto max-h-[calc(90vh-100px)]">
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-primary-50 to-primary-100 p-5 rounded-xl border border-primary-200">
                  <p className="text-sm font-medium text-primary-700 mb-2">Статус заявки</p>
                  <span className={`inline-flex px-4 py-2 text-sm font-bold rounded-lg shadow-sm ${getStatusColor(applicationData.status)}`}>
                    {getStatusText(applicationData.status)}
                  </span>
                </div>
                <div className="bg-gradient-to-br from-neutral-50 to-neutral-100 p-5 rounded-xl border border-neutral-200">
                  <p className="text-sm font-medium text-neutral-600 mb-2">Дата создания</p>
                  <p className="text-lg font-bold text-neutral-900">
                    {new Date(applicationData.created_at).toLocaleDateString('ru-RU')}
                  </p>
                </div>
              </div>

              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 p-5 rounded-xl border border-blue-200">
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  <p className="text-sm font-semibold text-blue-700">Программа</p>
                </div>
                <p className="text-xl font-bold text-blue-900">{applicationData.show_name || 'Не указано'}</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gradient-to-br from-green-50 to-emerald-50 p-5 rounded-xl border border-green-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-sm font-semibold text-green-700">Дата показа</p>
                  </div>
                  <p className="text-gray-900">
                    {applicationData.scheduled_at 
                      ? new Date(applicationData.scheduled_at).toLocaleString('ru-RU', {
                          day: 'numeric',
                          month: 'long',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })
                      : 'Не указано'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-2">⏱️ Длительность</p>
                  <p className="text-gray-900">{applicationData.duration_seconds || 0} сек</p>
                </div>
              </div>

              <div className="bg-primary-50 border border-primary-200 p-4 rounded-lg">
                <p className="text-sm font-medium text-green-700 mb-2">💰 Стоимость</p>
                <p className="text-2xl font-bold text-green-600">
                  {(applicationData.cost || 0).toLocaleString('ru-RU')} ₽
                </p>
              </div>

              {applicationData.description && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-2">📝 Описание</p>
                  <p className="text-gray-900 whitespace-pre-wrap">{applicationData.description}</p>
                </div>
              )}

              {applicationData.contact_phone && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-2">📞 Контактный телефон</p>
                  <p className="text-lg font-semibold text-gray-900">{applicationData.contact_phone}</p>
                </div>
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-2">📅 Дата подачи</p>
                  <p className="text-sm text-gray-900">
                    {applicationData.created_at 
                      ? new Date(applicationData.created_at).toLocaleString('ru-RU')
                      : '—'}
                  </p>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <p className="text-sm font-medium text-gray-500 mb-2">🔄 Обновлено</p>
                  <p className="text-sm text-gray-900">
                    {applicationData.updated_at 
                      ? new Date(applicationData.updated_at).toLocaleString('ru-RU')
                      : '—'}
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 px-6 py-4 bg-gradient-to-r from-neutral-50 to-white flex justify-end gap-3">
              <button
                onClick={() => setShowDetailsModal(false)}
                className="px-5 py-2.5 bg-white border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all font-medium"
              >
                Закрыть
              </button>
              <button
                onClick={() => {
                  setShowDetailsModal(false)
                  handleEdit()
                }}
                className="px-5 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg transition-all flex items-center gap-2 font-medium"
              >
                <Edit2 className="h-4 w-4" />
                Редактировать
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && applicationData && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="sticky top-0 bg-gradient-to-r from-primary-600 to-primary-700 px-6 py-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center">
                  <Edit2 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-bold text-white">Редактировать заявку</h3>
                  <p className="text-sm text-primary-100">ID: {appId?.slice(-8)}</p>
                </div>
              </div>
              <button
                onClick={() => setShowEditModal(false)}
                className="text-white hover:bg-white/20 transition-colors p-2 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Выбор шоу */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                    </svg>
                    <span>Шоу</span>
                  </label>
                  <select
                    value={editFormData.show_id || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, show_id: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-neutral-900 hover:bg-white"
                  >
                    <option value="">Выберите шоу</option>
                    {shows.map(show => (
                      <option key={show.id} value={show.id}>
                        {show.name} {show.show_type ? `(${show.show_type})` : ''}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Дата показа */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <span>Дата и время показа</span>
                  </label>
                  <input
                    type="datetime-local"
                    value={editFormData.scheduled_at ? new Date(editFormData.scheduled_at).toISOString().slice(0, 16) : ''}
                    onChange={(e) => setEditFormData({ ...editFormData, scheduled_at: e.target.value })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-neutral-900 hover:bg-white"
                  />
                </div>

                {/* Длительность */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Длительность (секунды)</span>
                  </label>
                  <input
                    type="number"
                    value={editFormData.duration_seconds || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, duration_seconds: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-neutral-900 hover:bg-white"
                    min="0"
                    step="1"
                  />
                  {editFormData.duration_seconds > 0 && (
                    <p className="text-xs text-neutral-500 mt-1.5 font-medium">
                      ≈ {Math.floor(editFormData.duration_seconds / 60)} мин {editFormData.duration_seconds % 60} сек
                    </p>
                  )}
                </div>

                {/* Контактный телефон */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                    </svg>
                    <span>Контактный телефон</span>
                  </label>
                  <IMaskInput
                    mask="+{7} (000) 000 00-00"
                    value={editFormData.contact_phone || ''}
                    unmask={false}
                    onAccept={(value) => setEditFormData({ ...editFormData, contact_phone: value })}
                    placeholder="+7 (900) 000 00-00"
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-neutral-900 hover:bg-white"
                  />
                </div>

                {/* Стоимость */}
                <div>
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>Стоимость (₽)</span>
                  </label>
                  <input
                    type="number"
                    value={editFormData.cost || 0}
                    onChange={(e) => setEditFormData({ ...editFormData, cost: Number(e.target.value) })}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all font-medium text-neutral-900 hover:bg-white"
                    min="0"
                    step="100"
                  />
                </div>

                {/* Описание */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-semibold text-neutral-700 mb-2 flex items-center gap-2">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>Описание</span>
                  </label>
                  <textarea
                    value={editFormData.description || ''}
                    onChange={(e) => setEditFormData({ ...editFormData, description: e.target.value })}
                    rows={5}
                    className="w-full px-4 py-3 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all resize-none font-medium text-neutral-900 hover:bg-white"
                    placeholder="Подробное описание заявки..."
                  />
                  <p className="text-xs text-neutral-600 mt-1.5 font-medium">
                    {editFormData.description?.length || 0} символов
                  </p>
                </div>
              </div>
            </div>

            <div className="border-t border-neutral-200 bg-gradient-to-r from-neutral-50 to-white px-6 py-4 flex justify-end gap-3">
              <button
                onClick={() => setShowEditModal(false)}
                className="px-6 py-2.5 bg-white border-2 border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 hover:border-neutral-400 transition-all font-medium"
              >
                Отменить
              </button>
              <button
                onClick={handleSaveEdit}
                className="px-6 py-2.5 bg-gradient-to-r from-primary-600 to-primary-700 text-white rounded-lg hover:shadow-lg hover:from-primary-700 hover:to-primary-800 transition-all font-medium flex items-center gap-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                </svg>
                Сохранить изменения
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

export default AgentChatPage

