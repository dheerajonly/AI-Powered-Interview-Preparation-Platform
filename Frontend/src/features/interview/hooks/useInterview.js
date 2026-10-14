import { getAllInterviewReports, generateInterviewReport, getInterviewReportById, generateResumePdf } from '../services/interview.api'
import { useContext, useEffect } from 'react'
import { InterviewContext } from '../interview.context'
import { useParams } from 'react-router'

export const useInterview = () => {
  const context = useContext(InterviewContext)
  const { interviewId } = useParams()
  if (!context) throw new Error('useInterview must be used within an InterviewProvider')
  const { loading, setLoading, report, setReport, reports, setReports, loadError, setLoadError } = context

  const generateReport = async payload => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await generateInterviewReport(payload)
      setReport(response.interviewReport)
      setReports(current => [response.interviewReport, ...current.filter(item => item._id !== response.interviewReport?._id)])
      return response.interviewReport
    } finally { setLoading(false) }
  }

  const getReportById = async id => {
    setLoading(true)
    setLoadError('')
    setReport(null)
    try {
      const response = await getInterviewReportById(id)
      setReport(response.interviewReport)
      return response.interviewReport
    } catch (error) {
      console.error('Get interview report error:', error)
      setLoadError(error.response?.data?.message || 'Unable to load this interview plan. Please return to your dashboard and try again.')
      return null
    } finally { setLoading(false) }
  }

  const getReports = async () => {
    setLoading(true)
    setLoadError('')
    try {
      const response = await getAllInterviewReports()
      setReports(response.interviewReports || [])
      return response.interviewReports || []
    } catch (error) {
      console.error('Get interview reports error:', error)
      setLoadError(error.response?.data?.message || 'Unable to load your interview plans right now.')
      return []
    } finally { setLoading(false) }
  }

  const getResumePdf = async interviewReportId => {
    setLoading(true)
    try {
      const response = await generateResumePdf({ interviewReportId })
      const blob = new Blob([response], { type: 'application/pdf' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `tailored_resume_${interviewReportId}.pdf`
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.setTimeout(() => window.URL.revokeObjectURL(url), 1000)
    } catch (error) {
      console.error('Generate resume PDF error:', error)
      throw error
    } finally { setLoading(false) }
  }

  useEffect(() => {
    if (interviewId) getReportById(interviewId).catch(() => {})
    else getReports().catch(() => {})
  }, [interviewId])

  return { loading, report, reports, loadError, generateReport, getReportById, getReports, getResumePdf }
}
