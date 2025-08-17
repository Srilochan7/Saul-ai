"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Copy, Download, ArrowLeft, CheckCircle, AlertTriangle, Info, Loader2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface CriticalClause {
  type: 'warning' | 'info'
  title: string
  content: string
}

interface AnalysisResult {
  title?: string
  documentType?: string
  document_type?: string
  keyPoints?: string[]
  key_points?: string[]
  criticalClauses?: CriticalClause[] | Record<string, string>
  critical_clauses?: CriticalClause[] | Record<string, string>
  recommendations?: string[]
  recommendation?: string | string[]
  fullSummary?: string
  full_summary?: string
  summary?: string
  originalFileName?: string
  original_file_name?: string
  uploadedAt?: string
  uploaded_at?: string
  [key: string]: any
}

export default function ResultsPage() {
  const router = useRouter()
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [analysisData, setAnalysisData] = useState<AnalysisResult | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Helper function to safely extract array data
  const extractArray = (data: any, ...keys: string[]): string[] => {
    for (const key of keys) {
      const value = data?.[key]
      if (Array.isArray(value)) {
        return value.filter(item => typeof item === 'string' && item.trim() !== '')
      }
      if (typeof value === 'string' && value.trim() !== '') {
        return [value]
      }
    }
    return []
  }

  // Helper function to safely extract string data
  const extractString = (data: any, ...keys: string[]): string => {
    for (const key of keys) {
      const value = data?.[key]
      if (typeof value === 'string' && value.trim() !== '') {
        return value
      }
    }
    return ''
  }

  // Helper function to extract critical clauses - handles both formats
  const extractCriticalClauses = (data: any): CriticalClause[] => {
    const keys = ['criticalClauses', 'critical_clauses', 'clauses']
    
    for (const key of keys) {
      const value = data?.[key]
      
      // If it's already an array of objects
      if (Array.isArray(value)) {
        return value.filter(clause => clause && clause.title && clause.content)
      }
      
      // If it's an object with key-value pairs (like from your backend)
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return Object.entries(value).map(([title, content]) => ({
          type: (title.toLowerCase().includes('non-compete') || 
                 title.toLowerCase().includes('termination') || 
                 title.toLowerCase().includes('liability')) ? 'warning' as const : 'info' as const,
          title: title,
          content: content as string
        }))
      }
    }
    return []
  }

  useEffect(() => {
    const storedResult = sessionStorage.getItem('analysisResult')
    
    if (!storedResult) {
      router.push('/')
      return
    }

    try {
      const parsedResult = JSON.parse(storedResult)
      console.log('Parsed analysis result:', parsedResult)
      setAnalysisData(parsedResult)
    } catch (error) {
      console.error('Error parsing analysis result:', error)
      router.push('/')
      return
    } finally {
      setIsLoading(false)
    }
  }, [router])

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (error) {
      console.error('Failed to copy text:', error)
    }
  }

  const handleDownload = () => {
    if (!analysisData) return

    const documentTitle = extractString(analysisData, 'title', 'originalFileName', 'original_file_name') || 'Legal Document'
    const documentType = extractString(analysisData, 'documentType', 'document_type') || 'Legal Document'
    const keyPoints = extractArray(analysisData, 'keyPoints', 'key_points')
    const criticalClauses = extractCriticalClauses(analysisData)
    const recommendations = extractArray(analysisData, 'recommendations', 'recommendation')
    const fullSummary = extractString(analysisData, 'fullSummary', 'full_summary', 'summary')
    const uploadedAt = extractString(analysisData, 'uploadedAt', 'uploaded_at')

    const content = `
LEGAL DOCUMENT ANALYSIS
=======================

Document: ${documentTitle}
Type: ${documentType}
Analyzed: ${uploadedAt ? new Date(uploadedAt).toLocaleString() : new Date().toLocaleString()}

KEY POINTS:
${keyPoints.length > 0 ? keyPoints.map(point => `• ${point}`).join('\n') : '• No key points available'}

CRITICAL CLAUSES:
${criticalClauses.length > 0 ? 
  criticalClauses.map(clause => `${clause.type.toUpperCase()}: ${clause.title}\n${clause.content}`).join('\n\n') : 
  'No critical clauses identified'}

RECOMMENDATIONS:
${recommendations.length > 0 ? recommendations.map(rec => `• ${rec}`).join('\n') : '• No recommendations available'}

FULL SUMMARY:
${fullSummary || 'No summary available'}

Generated by Saul-ai Legal Document Analyzer
    `.trim()

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-analysis.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleAnalyzeAnother = () => {
    sessionStorage.removeItem('analysisResult')
    router.push('/')
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="w-8 h-8 animate-spin text-secondary mx-auto" />
          <p className="text-muted-foreground">Loading analysis results...</p>
        </div>
      </div>
    )
  }

  if (!analysisData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <AlertTriangle className="w-12 h-12 text-destructive mx-auto" />
          <h2 className="text-xl font-semibold text-foreground">No Analysis Data Found</h2>
          <p className="text-muted-foreground">Please upload a document first.</p>
          <Button onClick={() => router.push('/')} className="bg-secondary hover:bg-secondary/90">
            Go Back to Upload
          </Button>
        </div>
      </div>
    )
  }

  // Extract data using helper functions
  const documentTitle = extractString(analysisData, 'title', 'originalFileName', 'original_file_name') || 'Legal Document Analysis'
  const documentType = extractString(analysisData, 'documentType', 'document_type') || 'Legal Document'
  const keyPoints = extractArray(analysisData, 'keyPoints', 'key_points')
  const criticalClauses = extractCriticalClauses(analysisData)
  const recommendations = extractArray(analysisData, 'recommendations', 'recommendation')
  const fullSummary = extractString(analysisData, 'fullSummary', 'full_summary', 'summary')
  const uploadedAt = extractString(analysisData, 'uploadedAt', 'uploaded_at')
  const originalFileName = extractString(analysisData, 'originalFileName', 'original_file_name')

  // Check if we have meaningful data to display
  const hasData = keyPoints.length > 0 || criticalClauses.length > 0 || recommendations.length > 0 || fullSummary

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={handleAnalyzeAnother}
                className="hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Analyze Another
              </Button>
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary-foreground" />
                </div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
                  Saul-ai
                </h1>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="hover:bg-card transition-colors bg-transparent"
                onClick={handleDownload}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Summary
              </Button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Document Header */}
        <div className="mb-8 animate-fade-in-up">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-12 h-12 bg-secondary/20 rounded-lg flex items-center justify-center">
              <FileText className="w-6 h-6 text-secondary" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{documentTitle}</h1>
              <div className="flex items-center space-x-4 text-muted-foreground">
                <span>{documentType}</span>
                {uploadedAt && (
                  <span className="text-sm">
                    Analyzed on {new Date(uploadedAt).toLocaleDateString()}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Show message if no data found */}
        {!hasData && (
          <Card className="mb-6 border-yellow-500/50">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2 text-yellow-600">
                <AlertTriangle className="w-5 h-5" />
                <span>Unable to Extract Analysis Data</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground mb-4">
                The document was processed but no structured analysis data was found. This could mean:
              </p>
              <ul className="list-disc pl-6 space-y-2 text-sm text-muted-foreground">
                <li>The document format is not supported</li>
                <li>The document doesn't contain recognizable legal content</li>
                <li>There was an issue with the analysis process</li>
              </ul>
              <div className="mt-4">
                <Button onClick={handleAnalyzeAnother} variant="outline">
                  Try Another Document
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Points */}
            {keyPoints.length > 0 && (
              <Card
                className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
                style={{ animationDelay: "0.1s" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-secondary" />
                      <span>Key Points ({keyPoints.length})</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(keyPoints.join("\n• "), "keyPoints")}
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      {copiedSection === "keyPoints" ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {keyPoints.map((point, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-foreground leading-relaxed">{point}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Critical Clauses */}
            {criticalClauses.length > 0 && (
              <Card
                className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
                style={{ animationDelay: "0.2s" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <AlertTriangle className="w-5 h-5 text-destructive" />
                    <span>Critical Clauses ({criticalClauses.length})</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {criticalClauses.map((clause, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        clause.type === "warning"
                          ? "bg-destructive/5 border-l-destructive"
                          : "bg-secondary/5 border-l-secondary"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-semibold text-foreground flex items-center space-x-2">
                          {clause.type === "warning" ? (
                            <AlertTriangle className="w-4 h-4 text-destructive" />
                          ) : (
                            <Info className="w-4 h-4 text-secondary" />
                          )}
                          <span>{clause.title}</span>
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleCopy(clause.content, `clause-${index}`)}
                          className="hover:bg-background/50 transition-colors"
                        >
                          {copiedSection === `clause-${index}` ? (
                            <CheckCircle className="w-4 h-4 text-secondary" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </Button>
                      </div>
                      <p className="text-muted-foreground leading-relaxed">{clause.content}</p>
                    </div>
                  ))}
                </CardContent>
              </Card>
            )}

            {/* Full Summary */}
            {fullSummary && (
              <Card
                className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
                style={{ animationDelay: "0.3s" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>Document Summary</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(fullSummary, "fullSummary")}
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      {copiedSection === "fullSummary" ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {fullSummary.split('\n\n').map((paragraph, index) => (
                      <p key={index} className="text-foreground leading-relaxed mb-4 last:mb-0">
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Card
                className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
                style={{ animationDelay: "0.4s" }}
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="flex items-center space-x-2">
                      <Info className="w-5 h-5 text-secondary" />
                      <span>Recommendations ({recommendations.length})</span>
                    </span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleCopy(recommendations.join("\n• "), "recommendations")}
                      className="hover:bg-secondary/10 transition-colors"
                    >
                      {copiedSection === "recommendations" ? (
                        <CheckCircle className="w-4 h-4 text-secondary" />
                      ) : (
                        <Copy className="w-4 h-4" />
                      )}
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-3">
                    {recommendations.map((rec, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-foreground leading-relaxed text-sm">{rec}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Actions */}
            <Card
              className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
              style={{ animationDelay: "0.5s" }}
            >
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-300 hover:scale-105"
                  onClick={handleDownload}
                  disabled={!hasData}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-card transition-colors bg-transparent"
                  onClick={handleAnalyzeAnother}
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Another Document
                </Button>
              </CardContent>
            </Card>

            {/* Analysis Info */}
            <Card className="animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
              <CardHeader>
                <CardTitle className="text-sm">Analysis Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2 text-sm text-muted-foreground">
                {originalFileName && (
                  <div>
                    <strong>Original File:</strong> {originalFileName}
                  </div>
                )}
                <div>
                  <strong>Analyzed:</strong> {uploadedAt ? new Date(uploadedAt).toLocaleString() : 'Just now'}
                </div>
                <div>
                  <strong>Data Found:</strong> 
                  <span className={hasData ? "text-green-600 ml-1" : "text-yellow-600 ml-1"}>
                    {hasData ? "✓ Complete" : "⚠ Limited"}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}