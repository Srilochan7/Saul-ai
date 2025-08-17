"use client"

import type React from "react"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Upload, FileText, Zap, Shield, ArrowRight, CheckCircle, AlertCircle, X } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

interface UploadError {
  message: string
  type: 'error' | 'warning'
}

export default function HomePage() {
  const [isDragOver, setIsDragOver] = useState(false)
  const [isProcessing, setIsProcessing] = useState(false)
  const [uploadError, setUploadError] = useState<UploadError | null>(null)
  const [progress, setProgress] = useState(0)
  const router = useRouter()

  // Your FastAPI server URL - update this to match your server
  const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://saul-ai.onrender.com"

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
      handleFileUpload(files[0]) // Only take the first file
    }
  }, [])

  const handleFileUpload = async (file: File) => {
    // Reset previous states
    setUploadError(null)
    setProgress(0)

    // Validate file type
    if (!file.name.toLowerCase().endsWith('.pdf')) {
      setUploadError({
        message: 'Only PDF files are supported. Please select a PDF document.',
        type: 'error'
      })
      return
    }

    // Validate file size (10MB limit)
    const maxSize = 10 * 1024 * 1024 // 10MB
    if (file.size > maxSize) {
      setUploadError({
        message: 'File size too large. Please select a file smaller than 10MB.',
        type: 'error'
      })
      return
    }

    setIsProcessing(true)

    try {
      // Create FormData
      const formData = new FormData()
      formData.append('file', file)

      // Simulate progress for better UX
      const progressInterval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval)
            return 90
          }
          return prev + 10
        })
      }, 200)

      // Upload to FastAPI server
      const response = await fetch(`${API_BASE_URL}/upload/`, {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setProgress(100)

      if (!response.ok) {
        const errorData = await response.json().catch(() => null)
        
        if (response.status === 422) {
          // Document validation error (not a legal document)
          setUploadError({
            message: errorData?.detail || 'This document does not appear to be a legal document. Please upload contracts, agreements, or other legal documents.',
            type: 'warning'
          })
        } else if (response.status === 400) {
          // Bad request (file format, etc.)
          setUploadError({
            message: errorData?.detail || 'Invalid file format. Please upload a valid PDF document.',
            type: 'error'
          })
        } else {
          // Server error
          setUploadError({
            message: 'Server error occurred. Please try again later.',
            type: 'error'
          })
        }
        return
      }

      // Parse the response
      const analysisResult = await response.json()
      
      // Store result in sessionStorage for the results page
      sessionStorage.setItem('analysisResult', JSON.stringify({
        ...analysisResult,
        originalFileName: file.name,
        uploadedAt: new Date().toISOString()
      }))

      // Navigate to results page
      router.push('/results')

    } catch (error) {
      console.error('Upload error:', error)
      setUploadError({
        message: 'Network error. Please check your connection and try again.',
        type: 'error'
      })
    } finally {
      setIsProcessing(false)
      setTimeout(() => setProgress(0), 1000)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFileUpload(files[0])
    }
  }

  const dismissError = () => {
    setUploadError(null)
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
              <a
                href="#features"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                Features
              </a>
              <a
                href="#how-it-works"
                className="text-muted-foreground hover:text-foreground transition-colors duration-200"
              >
                How it Works
              </a>
              <a href="#about" className="text-muted-foreground hover:text-foreground transition-colors duration-200">
                About
              </a>
              <a
                href="https://github.com/Srilochan7/Saul-ai"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center justify-center space-x-2 rounded-lg border border-muted-foreground/30 bg-transparent px-4 py-2 text-sm font-medium text-muted-foreground shadow-sm transition-all duration-200 ease-in-out hover:-translate-y-0.5 hover:border-foreground hover:bg-muted/50 hover:text-foreground hover:shadow-md active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="transition-colors group-hover:fill-yellow-400/80 group-hover:stroke-yellow-500"
                  aria-hidden="true"
                >
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
                </svg>
                <span>GitHub</span>
              </a>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-secondary/5 to-accent/5 animate-pulse-glow"></div>
        <div className="absolute top-20 left-10 w-32 h-32 bg-secondary/10 rounded-full blur-xl animate-float"></div>
        <div
          className="absolute bottom-20 right-10 w-24 h-24 bg-accent/10 rounded-full blur-lg animate-float"
          style={{ animationDelay: "1s" }}
        ></div>
        <div
          className="absolute top-1/2 left-1/4 w-16 h-16 bg-secondary/5 rounded-full blur-md animate-float"
          style={{ animationDelay: "2s" }}
        ></div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="text-center animate-fade-in-up">
            <div className="inline-flex items-center px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-6">
              <Shield className="w-4 h-4 text-secondary mr-2" />
              <span className="text-sm font-medium text-secondary">Quality of Legal Professionals</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 bg-gradient-to-r from-foreground via-secondary to-accent bg-clip-text text-transparent leading-tight">
              Legal Documents
              <br />
              <span className="text-secondary relative">
                Simplified
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-secondary to-accent rounded-full opacity-60"></div>
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
              Transform complex legal documents into clear, actionable summaries with our advanced AI technology.
              <span className="text-secondary font-semibold"> Free, secure, and professional.</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Button
                size="lg"
                onClick={() => document.getElementById("file-upload")?.click()}
                disabled={isProcessing}
                className="bg-secondary hover:bg-secondary/90 text-secondary-foreground px-8 py-4 text-lg font-semibold rounded-lg transition-all duration-300 hover:scale-105 hover:shadow-lg group disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                {isProcessing ? "Processing..." : "Get Started Free"}
                <ArrowRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>
            </div>

            <div className="flex flex-wrap justify-center gap-8 mb-16 text-sm text-muted-foreground">
              <div className="flex items-center">
                <CheckCircle className="w-4 h-4 text-secondary mr-2" />
                <span>High accuracy</span>
              </div>
              <div className="flex items-center">
                <Zap className="w-4 h-4 text-secondary mr-2" />
                <span>Seconds processing</span>
              </div>
              <div className="flex items-center">
                <Shield className="w-4 h-4 text-secondary mr-2" />
                <span>Highly secured</span>
              </div>
            </div>
          </div>

          {/* Error Message */}
          {uploadError && (
            <div className="max-w-2xl mx-auto mb-6 animate-fade-in-up">
              <div className={`flex items-center gap-3 p-4 rounded-lg border ${
                uploadError.type === 'error' 
                  ? 'bg-destructive/10 border-destructive/30 text-destructive' 
                  : 'bg-yellow-500/10 border-yellow-500/30 text-yellow-700 dark:text-yellow-400'
              }`}>
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <p className="flex-1 text-sm font-medium">{uploadError.message}</p>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={dismissError}
                  className="p-1 h-auto hover:bg-transparent"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          )}

          {/* File Upload Area */}
          <div className="max-w-2xl mx-auto animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
            <Card
              className={`relative overflow-hidden transition-all duration-300 ${
                isDragOver 
                  ? "border-secondary shadow-lg scale-105" 
                  : "border-border hover:border-secondary/50"
              } ${isProcessing ? "animate-pulse-glow" : ""}`}
            >
              <div className="absolute inset-0 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-lg blur-sm opacity-0 hover:opacity-100 transition-opacity duration-300"></div>
              <CardContent className="p-8 relative">
                <div
                  className={`border-2 border-dashed rounded-lg p-12 text-center transition-all duration-300 relative overflow-hidden ${
                    isDragOver 
                      ? "border-secondary/80 bg-secondary/5" 
                      : "border-border hover:border-secondary/50 hover:bg-card/50"
                  }`}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                >
                  <div className="absolute inset-0 opacity-5">
                    <div className="absolute top-4 left-4 w-2 h-2 bg-secondary rounded-full animate-ping"></div>
                    <div
                      className="absolute top-8 right-8 w-1 h-1 bg-accent rounded-full animate-ping"
                      style={{ animationDelay: "0.5s" }}
                    ></div>
                    <div
                      className="absolute bottom-6 left-8 w-1.5 h-1.5 bg-secondary rounded-full animate-ping"
                      style={{ animationDelay: "1s" }}
                    ></div>
                  </div>

                  {isProcessing ? (
                    <div className="space-y-4 relative">
                      <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center animate-float">
                        <Zap className="w-8 h-8 text-secondary animate-pulse" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Processing Document...</h3>
                      <p className="text-muted-foreground">Our AI is analyzing your legal document</p>
                      <div className="w-full bg-muted rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-gradient-to-r from-secondary to-accent h-full rounded-full transition-all duration-300 ease-out"
                          style={{ width: `${progress}%` }}
                        ></div>
                      </div>
                      <p className="text-sm text-muted-foreground">{progress}% complete</p>
                    </div>
                  ) : (
                    <div className="space-y-4 relative">
                      <div className="w-16 h-16 mx-auto bg-gradient-to-br from-secondary/20 to-accent/20 rounded-full flex items-center justify-center hover:scale-110 transition-transform duration-300">
                        <Upload className="w-8 h-8 text-secondary" />
                      </div>
                      <h3 className="text-xl font-semibold text-foreground">Upload Your Legal Document</h3>
                      <p className="text-muted-foreground">
                        Drag and drop your PDF file here, or click to browse
                      </p>
                      <div className="flex justify-center gap-2 text-xs text-muted-foreground/70">
                        <span className="px-2 py-1 bg-muted rounded">PDF Only</span>
                        <span className="px-2 py-1 bg-muted rounded">Max 10MB</span>
                      </div>
                      
                      <input
                        type="file"
                        id="file-upload"
                        className="hidden"
                        accept=".pdf"
                        onChange={handleFileSelect}
                        disabled={isProcessing}
                      />
                      
                      <Button
                        onClick={() => document.getElementById("file-upload")?.click()}
                        disabled={isProcessing}
                        className="mt-4 border border-border bg-card text-card-foreground 
                                   hover:bg-accent hover:text-accent-foreground 
                                   transition-all duration-300 hover:scale-105 
                                   disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
                      >
                        Choose PDF File
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Features Section - Rest of your existing code remains the same */}
      <section id="features" className="py-20 bg-card/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">Why Choose Saul-ai?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Professional-grade AI technology designed specifically for legal document analysis
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border hover:border-secondary/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary/30 transition-colors duration-300">
                  <Zap className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Lightning Fast</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get comprehensive summaries in seconds, not hours. Our AI processes complex legal documents instantly.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border hover:border-secondary/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary/30 transition-colors duration-300">
                  <Shield className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Secure & Private</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Your documents are processed securely and never stored. Complete privacy and confidentiality
                  guaranteed.
                </p>
              </CardContent>
            </Card>

            <Card className="group hover:shadow-lg transition-all duration-300 hover:-translate-y-2 border-border hover:border-secondary/50">
              <CardContent className="p-8 text-center">
                <div className="w-16 h-16 mx-auto bg-secondary/20 rounded-full flex items-center justify-center mb-6 group-hover:bg-secondary/30 transition-colors duration-300">
                  <CheckCircle className="w-8 h-8 text-secondary" />
                </div>
                <h3 className="text-xl font-semibold mb-4 text-foreground">Accurate Analysis</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Trained on legal documents, our AI understands context, terminology, and key legal concepts.
                </p>
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
              <p className="text-sm text-muted-foreground">© 2025 Saul-ai. All rights reserved.</p>
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