"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Copy, Download, ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

interface SummaryData {
  full_summary: string
  key_points: string[]
  critical_clauses: Array<{
    title: string
    description: string
  }>
  recommendations: string[]
  validation?: {
    is_legal_document: boolean
    confidence_score: number
    validation_message: string
  }
}

export default function ResultsPage() {
  const router = useRouter()
  const [copiedSection, setCopiedSection] = useState<string | null>(null)
  const [summaryData, setSummaryData] = useState<SummaryData | null>(null)
  const [fileName, setFileName] = useState<string>("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Load data from sessionStorage
    try {
      const storedResults = sessionStorage.getItem('summaryResults')
      const storedFileName = sessionStorage.getItem('originalFileName')
      
      if (storedResults) {
        const parsedData = JSON.parse(storedResults) as SummaryData
        setSummaryData(parsedData)
        setFileName(storedFileName || "Document")
      } else {
        setError("No summary data found. Please upload a document first.")
      }
    } catch (err) {
      setError("Failed to load summary data.")
    } finally {
      setLoading(false)
    }
  }, [])

  const handleCopy = async (text: string, section: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedSection(section)
      setTimeout(() => setCopiedSection(null), 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }

  const downloadSummary = () => {
    if (!summaryData) return

    const content = `
LEGAL DOCUMENT SUMMARY
======================

Document: ${fileName}
Generated: ${new Date().toLocaleDateString()}

KEY POINTS:
${summaryData.key_points.map(point => `• ${point}`).join('\n')}

CRITICAL CLAUSES:
${summaryData.critical_clauses.map(clause => `
${clause.title}:
${clause.description}
`).join('\n')}

RECOMMENDATIONS:
${summaryData.recommendations.map(rec => `• ${rec}`).join('\n')}

FULL SUMMARY:
${summaryData.full_summary}

---
DISCLAIMER: This is an AI-generated legal summary. It is not legal advice and should not be relied upon for legal decisions. Please consult with a qualified attorney for legal matters.
    `

    const blob = new Blob([content], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${fileName}_summary.txt`
    document.body.appendChild(a)
    a.click()
    URL.revokeObjectURL(url)
    document.body.removeChild(a)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center animate-pulse mb-4">
            <FileText className="w-8 h-8 text-secondary" />
          </div>
          <p className="text-muted-foreground">Loading summary...</p>
        </div>
      </div>
    )
  }

  if (error || !summaryData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-card to-background flex items-center justify-center">
        <div className="max-w-md w-full mx-auto px-4">
          <Alert className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>{error || "No summary data available"}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push("/")} className="w-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Upload
          </Button>
        </div>
      </div>
    )
  }

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
                onClick={() => router.push("/")}
                className="hover:bg-card transition-colors"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Upload
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
                onClick={downloadSummary}
                className="hover:bg-card transition-colors bg-transparent"
              >
                <Download className="w-4 h-4 mr-2" />
                Export Summary
              </Button>
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{fileName}</h1>
              <p className="text-muted-foreground">Legal Document Summary</p>
            </div>
          </div>
          
          {/* Validation Badge */}
          {summaryData.validation && (
            <div className="flex items-center space-x-2 text-sm">
              <CheckCircle className="w-4 h-4 text-secondary" />
              <span className="text-muted-foreground">
                Legal document validated with {(summaryData.validation.confidence_score * 100).toFixed(1)}% confidence
              </span>
            </div>
          )}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Key Points */}
            <Card
              className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
              style={{ animationDelay: "0.1s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <CheckCircle className="w-5 h-5 text-secondary" />
                    <span>Key Points</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(summaryData.key_points.join("\n• "), "keyPoints")}
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
                  {summaryData.key_points.map((point, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-foreground leading-relaxed">{point}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

            {/* Critical Clauses */}
            <Card
              className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
              style={{ animationDelay: "0.2s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <span>Critical Clauses</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {summaryData.critical_clauses.map((clause, index) => (
                  <div
                    key={index}
                    className="p-4 rounded-lg border-l-4 bg-secondary/5 border-l-secondary"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <h4 className="font-semibold text-foreground flex items-center space-x-2">
                        <Info className="w-4 h-4 text-secondary" />
                        <span>{clause.title}</span>
                      </h4>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleCopy(clause.description, `clause-${index}`)}
                        className="hover:bg-background/50 transition-colors"
                      >
                        {copiedSection === `clause-${index}` ? (
                          <CheckCircle className="w-4 h-4 text-secondary" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-muted-foreground leading-relaxed">{clause.description}</p>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* Full Summary */}
            <Card
              className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
              style={{ animationDelay: "0.3s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Full Summary</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(summaryData.full_summary, "fullSummary")}
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
                  {summaryData.full_summary.split("\n\n").map((paragraph, index) => (
                    <p key={index} className="text-foreground leading-relaxed mb-4">
                      {paragraph}
                    </p>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recommendations */}
            <Card
              className="animate-fade-in-up border-border hover:border-secondary/50 transition-all duration-300"
              style={{ animationDelay: "0.4s" }}
            >
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="flex items-center space-x-2">
                    <Info className="w-5 h-5 text-secondary" />
                    <span>Recommendations</span>
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopy(summaryData.recommendations.join("\n• "), "recommendations")}
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
                  {summaryData.recommendations.map((rec, index) => (
                    <li key={index} className="flex items-start space-x-3">
                      <div className="w-2 h-2 bg-secondary rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-foreground leading-relaxed text-sm">{rec}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>

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
                  onClick={downloadSummary}
                  className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-300 hover:scale-105"
                >
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => router.push("/")}
                  className="w-full hover:bg-card transition-colors bg-transparent"
                >
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Another Document
                </Button>
              </CardContent>
            </Card>

            {/* Disclaimer */}
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="text-sm">
                <strong>Disclaimer:</strong> This is an AI-generated summary. It is not legal advice and should not be relied upon for legal decisions. Please consult with a qualified attorney.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </div>
  )
}