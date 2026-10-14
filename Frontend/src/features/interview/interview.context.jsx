import { createContext, useState } from 'react'

export const InterviewContext = createContext()

export const InterviewProvider = ({ children }) => {
  const [loading, setLoading] = useState(false)
  const [report, setReport] = useState(null)
  const [reports, setReports] = useState([])
  const [loadError, setLoadError] = useState('')

  return <InterviewContext.Provider value={{ loading, setLoading, report, setReport, reports, setReports, loadError, setLoadError }}>{children}</InterviewContext.Provider>
}
