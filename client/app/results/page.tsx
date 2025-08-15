"use client"

import type React from "react"
import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, Zap, Shield, ArrowRight, CheckCircle, AlertCircle, Download } from "lucide-react"
import { useRouter } from "next/navigation"
import { Alert, AlertDescription } from "@/components/ui/alert"

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

interface SummaryResponse {
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

// Error response interface
interface ErrorResponse {
  detail: string | {
    message: string
    suggestion?: string
    supported_types?: string[]
    confidence_score?: number
  }
}

export default function HomePage() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [processingStage, setProcessingStage] = useState<string>("")
  const router = useRouter()

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragOver(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload([files[0]]) // Only take the first file
    }
  }, [])

  const validateFile = (file: File): string | null => {
    // Check file size (10MB limit)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      return "File size must be less than 10MB"
    }

    // Check file type
    const allowedTypes = ['.pdf', '.docx', '.txt']
    const fileExtension = '.' + file.name.split('.').pop()?.toLowerCase()
    if (!allowedTypes.includes(fileExtension)) {
      return "Only PDF, DOCX, and TXT files are supported"
    }

    return null
  }

  // Helper function to extract error message
  const extractErrorMessage = (errorData: ErrorResponse): string => {
    if (typeof errorData.detail === 'string') {
      return errorData.detail
    } else if (typeof errorData.detail === 'object' && errorData.detail?.message) {
      return errorData.detail.message
    } else {
      return 'An unexpected error occurred'
    }
  }

  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return

    const file = files[0]
    setError(null)
    setUploadedFile(file)

    // Validate file
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setIsProcessing(true)
    setProcessingStage("Uploading document...")

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      setProcessingStage("Analyzing document with AI...")

      // Make API call to summarize endpoint
      const response = await fetch(`${API_BASE_URL}/summarize`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = `HTTP error! status: ${response.status}`
        
        try {
          const errorData: ErrorResponse = await response.json()
          errorMessage = extractErrorMessage(errorData)
        } catch (parseError) {
          // If JSON parsing fails, use the default error message
          console.error('Failed to parse error response:', parseError)
        }
        
        throw new Error(errorMessage)
      }

      const result: SummaryResponse = await response.json()
      
      setProcessingStage("Preparing results...")

      // Store results in sessionStorage for the results page
      sessionStorage.setItem('summaryResults', JSON.stringify(result))
      sessionStorage.setItem('originalFileName', file.name)

      // Navigate to results page
      setTimeout(() => {
        router.push("/results")
      }, 500)

    } catch (err) {
      console.error('Error processing document:', err)
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred'
      setError(errorMessage)
      setIsProcessing(false)
      setProcessingStage("")
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    if (files.length > 0) {
      handleFileUpload(files)
    }
  }

  const downloadDocxSummary = async () => {
    if (!uploadedFile) return

    try {
      const formData = new FormData()
      formData.append('file', uploadedFile)

      const response = await fetch(`${API_BASE_URL}/summarize/docx`, {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        let errorMessage = 'Failed to generate DOCX summary'
        
        try {
          const errorData: ErrorResponse = await response.json()
          errorMessage = extractErrorMessage(errorData)
        } catch (parseError) {
          // Use default error message if JSON parsing fails
          console.error('Failed to parse DOCX error response:', parseError)
        }
        
        throw new Error(errorMessage)
      }

      // Handle file download
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${uploadedFile.name.split('.')[0]}_summary.docx`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to download DOCX summary'
      setError(errorMessage)
    }
  }

  const resetUpload = () => {
    setIsProcessing(false)
    setError(null)
    setUploadedFile(null)
    setProcessingStage("")
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-card to-background">
      {/* Header */}
      <header className="border-b border-border/50 backdrop-blur-sm bg-background/80 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                <FileText className="w-5 h-5 text-secondary-foreground" />
              </div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-foreground to-secondary bg-clip-text text-transparent">
                Saul-ai
              </h1>
            </div>
            <nav className="hidden md:flex items-center space-x-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                Features
              </a>
              <a href="#how-it-works" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                How it Works
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                About
              </a>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-accent/5 animate-pulse-glow"></div>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-in-up">
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Legal Documents
              <br />
              <span className="text-secondary">Simplified</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform complex legal documents into clear, actionable summaries with our advanced AI technology. Free,
              secure, and professional.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-16">
              <Button
                size="lg"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isProcessing}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg"
              >
                Get Started Free
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="px-8 py-4 text-lg font-semibold rounded-lg border-2 hover:bg-card transition-all duration-300 bg-transparent"
              >
                Watch Demo
              </Button>
            </div>
          </div>

          {/* File Upload Area */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            {/* Error Alert */}
            {error && (
              <Alert className="mb-4 border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-900/20">
                <AlertCircle className="h-4 w-4 text-red-600 dark:text-red-400" />
                <AlertDescription className="text-red-800 dark:text-red-200">
                  {error}
                </AlertDescription>
              </Alert>
            )}

            <Card
              className={`relative overflow-hidden transition-all duration-300 ${
                isDragOver ? "border-secondary shadow-lg scale-105" : "border-border hover:border-secondary/50"
              } ${isProcessing ? "animate-pulse-glow" : ""}`}
            >
              <CardContent className="p-8">
                <div
                  className="border-2 border-dashed border-border rounded-lg p-12 text-center transition-all duration-300 hover:border-secondary/50 hover:bg-card/50"
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  {isProcessing ? (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center animate-float">
                        <Zap className="w-8 h-8 text-secondary animate-pulse" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Processing Document...</h3>
                      <p className="text-muted-foreground">{processingStage}</p>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div className="bg-secondary h-full rounded-full animate-pulse" style={{ width: "70%" }}></div>
                      </div>
                      <Button
                        variant="outline"
                        onClick={resetUpload}
                        className="mt-4"
                        size="sm"
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center">
                        <Upload className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Upload Your Legal Document</h3>
                      <p className="text-muted-foreground">
                        Drag and drop your PDF, DOCX, or TXT file here, or click to browse
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Maximum file size: 10MB • Supported formats: PDF, DOCX, TXT
                      </p>
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf,.docx,.txt"
                        onChange={handleFileSelect}
                      />
                      <div className="flex flex-col sm:flex-row gap-2 justify-center">
                        <Button
                          onClick={() => document.getElementById("file-upload")?.click()}
                          variant="outline"
                          className="hover:bg-secondary hover:text-secondary-foreground transition-all duration-300"
                        >
                          Choose Files
                        </Button>
                        {uploadedFile && (
                          <Button
                            onClick={downloadDocxSummary}
                            variant="outline"
                            className="hover:bg-accent hover:text-accent-foreground transition-all duration-300"
                          >
                            <Download className="w-4 h-4 mr-2" />
                            Download DOCX
                          </Button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Three simple steps to get clear, actionable summaries of your legal documents
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-secondary-foreground">
                1
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Upload Document</h3>
              <p className="text-muted-foreground leading-relaxed">
                Simply drag and drop your legal document or click to browse and select your file.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-secondary-foreground">
                2
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">AI Analysis</h3>
              <p className="text-muted-foreground leading-relaxed">
                Our advanced AI processes your document, identifying key points, terms, and legal implications.
              </p>
            </div>

            <div className="text-center">
              <div className="w-20 h-20 mx-auto bg-gradient-to-br from-secondary to-accent rounded-full flex items-center justify-center mb-6 text-2xl font-bold text-secondary-foreground">
                3
              </div>
              <h3 className="text-xl font-semibold mb-4 text-foreground">Get Summary</h3>
              <p className="text-muted-foreground leading-relaxed">
                Receive a clear, structured summary with key insights and actionable recommendations.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="col-span-2">
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-secondary to-accent rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary-foreground" />
                </div>
                <h3 className="text-xl font-bold text-foreground">Saul-ai</h3>
              </div>
              <p className="text-muted-foreground leading-relaxed mb-4">
                Making legal documents accessible to everyone through advanced AI technology.
              </p>
              <p className="text-sm text-muted-foreground">© 2024 Saul-ai. All rights reserved.</p>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Product</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Features
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Pricing
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    API
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-foreground mb-4">Support</h4>
              <ul className="space-y-2 text-muted-foreground">
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Help Center
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a href="#" className="hover:text-foreground transition-colors">
                    Terms of Service
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}