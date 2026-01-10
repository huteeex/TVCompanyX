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

// Add font support for Cyrillic (Russian)
const addFont = (doc: jsPDF) => {
  // jsPDF by default doesn't support Cyrillic well, so we'll use standard font
  doc.setFont('helvetica')
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

    const { customer_id, search_query, start_date, end_date } = req.body

    // Fetch all applications
    let applications = await db.getApplications()

    // Filter by customer - support search by email, phone, or name
    if (search_query) {
      const query = search_query.toLowerCase().trim()
      
      // Normalize phone number (remove +, spaces, dashes and convert 8 to 7)
      const normalizePhone = (phone: string) => {
        if (!phone) return ''
        let normalized = phone.replace(/[\s\-\+\(\)]/g, '')
        // Convert 8XXXXXXXXXX to 7XXXXXXXXXX for comparison
        if (normalized.startsWith('8') && normalized.length === 11) {
          normalized = '7' + normalized.substring(1)
        }
        return normalized
      }

      const searchPhone = normalizePhone(query)

      applications = applications.filter((app: any) => {
        const email = (app.customer_email || '').toLowerCase()
        const name = (app.customer_name || '').toLowerCase()
        const phone = normalizePhone(app.customer_phone || '')
        
        return email.includes(query) || 
               name.includes(query) || 
               (searchPhone && phone.includes(searchPhone))
      })
    } else if (customer_id) {
      applications = applications.filter((app: any) => app.customer_id === customer_id)
    } else {
      return res.status(400).json({ error: 'customer_id or search_query is required' })
    }

    // Filter by approved status
    applications = applications.filter((app: any) => app.status === 'approved')

    // Filter by date range if specified
    if (start_date && end_date) {
      const start = new Date(start_date)
      const end = new Date(end_date)
      
      applications = applications.filter((app: any) => {
        const appDate = new Date(app.created_at)
        return appDate >= start && appDate <= end
      })
    }

    if (applications.length === 0) {
      return res.status(404).json({ error: 'No approved applications found for this customer' })
    }

    // Get customer info from first application
    const customerName = transliterate(applications[0].customer_name || 'Unknown')
    const customerEmail = applications[0].customer_email || 'Unknown'

    // Calculate totals
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
    doc.text('CLIENT REPORT', 105, 20, { align: 'center' })

    // Customer info
    doc.setFontSize(12)
    doc.text(`Client: ${customerName}`, 20, 35)
    doc.text(`Email: ${customerEmail}`, 20, 42)
    
    if (start_date && end_date) {
      doc.text(`Period: ${new Date(start_date).toLocaleDateString('en-US')} - ${new Date(end_date).toLocaleDateString('en-US')}`, 20, 49)
    } else {
      doc.text('Period: All time', 20, 49)
    }

    doc.text(`Report date: ${new Date().toLocaleDateString('en-US')}`, 20, 56)

    // Summary statistics
    doc.setFontSize(14)
    doc.text('STATISTICS:', 20, 68)
    
    doc.setFontSize(11)
    doc.text(`Total applications: ${applications.length}`, 20, 76)
    doc.text(`Total cost: ${totalCost.toFixed(2)} RUB`, 20, 83)
    doc.text(`Total duration: ${Math.floor(totalDuration / 60)} min ${totalDuration % 60} sec`, 20, 90)
    doc.text(`Average cost: ${(totalCost / applications.length).toFixed(2)} RUB`, 20, 97)

    // Applications table
    const tableData = applications.map((app: any, index: number) => [
      (index + 1).toString(),
      transliterate(app.show_name || 'N/A'),
      new Date(app.scheduled_at || app.created_at).toLocaleDateString('en-US'),
      app.time_slot || 'N/A',
      `${Math.floor(app.duration_seconds / 60)}:${(app.duration_seconds % 60).toString().padStart(2, '0')}`,
      `${parseFloat(app.cost || 0).toFixed(2)} RUB`,
    ])

    autoTable(doc, {
      head: [['#', 'Show', 'Date', 'Time', 'Duration', 'Cost']],
      body: tableData,
      startY: 105,
      theme: 'grid',
      headStyles: { fillColor: [66, 139, 202] },
      styles: { fontSize: 9, font: 'helvetica' },
    })

    // Footer
    const finalY = (doc as any).lastAutoTable.finalY || 105
    doc.setFontSize(10)
    doc.text('___________________________', 20, finalY + 20)
    doc.text('Podpis buhgaltera', 20, finalY + 27)

    // Convert PDF to buffer
    const pdfBuffer = Buffer.from(doc.output('arraybuffer'))

    // Set response headers
    res.setHeader('Content-Type', 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="client-report-${customer_id}-${Date.now()}.pdf"`)
    
    return res.status(200).send(pdfBuffer)

  } catch (error: any) {
    console.error('Generate client report error:', error)
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ error: 'Invalid token' })
    }
    
    return res.status(500).json({ error: 'Failed to generate report' })
  }
}
