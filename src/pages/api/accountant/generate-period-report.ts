import { NextApiRequest, NextApiResponse } from 'next'
import { db } from '../../../lib/database'
import jwt from 'jsonwebtoken'
import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

// Transliterate Cyrillic to Latin
const transliterate = (text: string): string => {
  if (!text) return text
  const map: Record<string, string> = {
    'а': 'a', 'б': 'b', 'в': 'v', 'г': 'g', 'д': 'd', 'е': 'e', 'ё': 'yo', 'ж': 'zh',
    'з': 'z', 'и': 'i', 'й': 'y', 'к': 'k', 'л': 'l', 'м': 'm', 'н': 'n', 'о': 'o',
    'п': 'p', 'р': 'r', 'с': 's', 'т': 't', 'у': 'u', 'ф': 'f', 'х': 'h', 'ц': 'ts',
    'ч': 'ch', 'ш': 'sh', 'щ': 'sch', 'ъ': '', 'ы': 'y', 'ь': '', 'э': 'e', 'ю': 'yu',
    'я': 'ya', 'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ё': 'Yo',
    'Ж': 'Zh', 'З': 'Z', 'И': 'I', 'Й': 'Y', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N',
    'О': 'O', 'П': 'P', 'Р': 'R', 'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'H',
    'Ц': 'Ts', 'Ч': 'Ch', 'Ш': 'Sh', 'Щ': 'Sch', 'Ъ': '', 'Ы': 'Y', 'Ь': '', 'Э': 'E',
    'Ю': 'Yu', 'Я': 'Ya'
  }
  return text.split('').map(char => map[char] || char).join('')
}

const addFont = (doc: jsPDF) => {
  doc.setFont('helvetica')
}

// Helper to calculate period dates
const calculatePeriod = (periodType: string, customStart?: string, customEnd?: string) => {
  const now = new Date()
  let startDate: Date
  let endDate: Date = now

  switch (periodType) {
    case 'day':
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate())
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      break
    case 'week':
      const dayOfWeek = now.getDay()
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1 // Monday as first day
      startDate = new Date(now)
      startDate.setDate(now.getDate() - diff)
      startDate.setHours(0, 0, 0, 0)
      endDate = new Date(startDate)
      endDate.setDate(startDate.getDate() + 6)
      endDate.setHours(23, 59, 59)
      break
    case 'month':
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59)
      break
    case 'quarter':
      const quarter = Math.floor(now.getMonth() / 3)
      startDate = new Date(now.getFullYear(), quarter * 3, 1)
      endDate = new Date(now.getFullYear(), quarter * 3 + 3, 0, 23, 59, 59)
      break
    case 'year':
      startDate = new Date(now.getFullYear(), 0, 1)
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59)
      break
    case 'custom':
      if (!customStart || !customEnd) {
        throw new Error('Custom period requires start_date and end_date')
      }
      startDate = new Date(customStart)
      endDate = new Date(customEnd)
      endDate.setHours(23, 59, 59)
      break
    default:
      throw new Error('Invalid period type')
  }

  return { startDate, endDate }
}

const getPeriodName = (periodType: string, startDate: Date, endDate: Date): string => {
  const locale = 'en-US'
  
  switch (periodType) {
    case 'day':
      return `Day: ${startDate.toLocaleDateString(locale)}`
    case 'week':
      return `Week: ${startDate.toLocaleDateString(locale)} - ${endDate.toLocaleDateString(locale)}`
    case 'month':
      return `Month: ${startDate.toLocaleDateString(locale, { month: 'long', year: 'numeric' })}`
    case 'quarter':
      const quarter = Math.floor(startDate.getMonth() / 3) + 1
      return `Quarter ${quarter}, ${startDate.getFullYear()}`
    case 'year':
      return `Year: ${startDate.getFullYear()}`
    case 'custom':
      return `Period: ${startDate.toLocaleDateString(locale)} - ${endDate.toLocaleDateString(locale)}`
    default:
      return 'Unknown period'
  }
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  try {
    // Verify JWT token
    const token = req.cookies.token
    if (!token) {
      return res.status(401).json({ error: 'Unauthorized' })
    }

    const decoded = jwt.verify(token, JWT_SECRET) as any
    
    // Check if user is accountant
    if (decoded.role !== 'accountant') {
      return res.status(403).json({ error: 'Access denied. Accountant role required.' })
    }

    const { period_type, start_date, end_date } = req.body

    if (!period_type) {
      return res.status(400).json({ error: 'period_type is required (day|week|month|quarter|year|custom)' })
    }

    // Calculate period
    const { startDate, endDate } = calculatePeriod(period_type, start_date, end_date)

    // Fetch all applications
    let applications = await db.getApplications()

    // Filter by approved status
    applications = applications.filter((app: any) => app.status === 'approved')

    // Filter by date range
    applications = applications.filter((app: any) => {
      const appDate = new Date(app.created_at)
      return appDate >= startDate && appDate <= endDate
    })

    // Group by customer
    const customerGroups: { [key: string]: any[] } = {}
    applications.forEach((app: any) => {
      const customerId = app.customer_id
      if (!customerGroups[customerId]) {
        customerGroups[customerId] = []
      }
      customerGroups[customerId].push(app)
    })

    // Calculate statistics
    const totalCost = applications.reduce((sum: number, app: any) => {
      return sum + (parseFloat(app.cost) || 0)
    }, 0)

    const totalDuration = applications.reduce((sum: number, app: any) => {
      return sum + (parseInt(app.duration_seconds) || 0)
    }, 0)

    // Create PDF
    const doc = new jsPDF()
    addFont(doc)

    // Title
    doc.setFontSize(18)
    doc.text('PERIOD REPORT', 105, 20, { align: 'center' })

    // Period info
    doc.setFontSize(12)
    const periodName = getPeriodName(period_type, startDate, endDate)
    doc.text(periodName, 20, 35)
    doc.text(`Report date: ${new Date().toLocaleDateString('en-US')}`, 20, 42)

    // Summary statistics
    doc.setFontSize(14)
    doc.text('OVERALL STATISTICS:', 20, 54)
    
    doc.setFontSize(11)
    doc.text(`Total applications: ${applications.length}`, 20, 62)
    doc.text(`Number of clients: ${Object.keys(customerGroups).length}`, 20, 69)
    doc.text(`Total cost: ${totalCost.toFixed(2)} RUB`, 20, 76)
    doc.text(`Total duration: ${Math.floor(totalDuration / 60)} min ${totalDuration % 60} sec`, 20, 83)
    if (applications.length > 0) {
      doc.text(`Average cost per application: ${(totalCost / applications.length).toFixed(2)} RUB`, 20, 90)
    }

    // Customer breakdown table
    const customerTableData = Object.entries(customerGroups).map(([customerId, apps]) => {
      const customerName = transliterate(apps[0].customer_name || 'Unknown')
      const customerTotal = apps.reduce((sum: number, app: any) => sum + (parseFloat(app.cost) || 0), 0)
      return [
        customerName,
        apps.length.toString(),
        `${customerTotal.toFixed(2)} RUB`,
      ]
    })

    // Sort by total cost descending
    customerTableData.sort((a, b) => {
      const costA = parseFloat(a[2].replace(' RUB', ''))
      const costB = parseFloat(b[2].replace(' RUB', ''))
      return costB - costA
    })

    doc.setFontSize(14)
    doc.text('CLIENT BREAKDOWN:', 20, 102)

    autoTable(doc, {
      head: [['Client', 'Applications', 'Total cost']],
      body: customerTableData,
      startY: 107,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 10, font: 'helvetica' },
    })

    // Detailed applications table
    let detailY = (doc as any).lastAutoTable.finalY + 15

    // Check if we need a new page
    if (detailY > 250) {
      doc.addPage()
      detailY = 20
    }

    doc.setFontSize(14)
    doc.text('DETAILED DATA:', 20, detailY)

    const detailedTableData = applications.map((app: any, index: number) => [
      (index + 1).toString(),
      transliterate(app.customer_name || 'N/A'),
      transliterate(app.show_name || 'N/A'),
      new Date(app.scheduled_at || app.created_at).toLocaleDateString('en-US'),
      `${Math.floor(app.duration_seconds / 60)}:${(app.duration_seconds % 60).toString().padStart(2, '0')}`,
      `${parseFloat(app.cost || 0).toFixed(2)} RUB`,
    ])

    autoTable(doc, {
      head: [['#', 'Client', 'Show', 'Date', 'Duration', 'Cost']],
      body: detailedTableData,
      startY: detailY + 5,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 8, font: 'helvetica' },
      pageBreak: 'auto',
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || detailY + 5
    
    // Check if we need a new page for footer
    if (finalY > 260) {
      doc.addPage()
      doc.setFontSize(10)
      doc.text('___________________________', 20, 20)
      doc.text('Accountant signature', 20, 27)
    } else {
      doc.setFontSize(10)
      doc.text('___________________________', 20, finalY + 20)
      doc.text('Accountant signature', 20, finalY + 27)
    }

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Set response headers
    const filename = `period-report-${period_type}-${Date.now()}.pdf`
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`)
    
    return res.status(200).send(pdfBuffer)

  } catch (error: any) {
    console.error('Generate period report error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    return res.status(500).json({ error: error.message || 'Failed to generate report' })
  }
}
