import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  withCredentials: true,
  timeout: 60000
})

export const generateInterviewReport = async ({ jobDescription, selfDescription, resumeFile }) => {
  const formData = new FormData()
  formData.append('jobDescription', jobDescription)
  formData.append('selfDescription', selfDescription || '')
  if (resumeFile) formData.append('resume', resumeFile)
  const response = await api.post('/api/interview/', formData)
  return response.data
}

export const getInterviewReportById = async interviewId => (await api.get(`/api/interview/report/${interviewId}`)).data
export const getAllInterviewReports = async () => (await api.get('/api/interview/')).data
export const generateResumePdf = async ({ interviewReportId }) => (await api.post(`/api/interview/resume/pdf/${interviewReportId}`, null, { responseType: 'blob' })).data
export const evaluatePracticeAnswer = async ({ interviewId, attemptId, questionIndex, selectedAnswer }) => (await api.post(`/api/interview/practice/${interviewId}/evaluate`, { attemptId, questionIndex, selectedAnswer })).data
export const generatePracticeQuestions = async interviewId => (await api.post(`/api/interview/practice/${interviewId}/questions`)).data
export const completePracticeAttempt = async ({ interviewId, attemptId }) => (await api.post(`/api/interview/practice/${interviewId}/attempt/${attemptId}/complete`)).data
export const getPracticeHistory = async interviewId => (await api.get('/api/interview/practice/history', { params: interviewId ? { interviewId } : {} })).data
export const getPracticeAttemptById = async attemptId => (await api.get(`/api/interview/practice/attempt/${attemptId}`)).data
