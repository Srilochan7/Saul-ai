"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FileText, Copy, Download, ArrowLeft, CheckCircle, AlertTriangle, Info } from "lucide-react"
import { useRouter } from "next/navigation"
import { ThemeToggle } from "@/components/theme-toggle"

export default function ResultsPage() {
  const router = useRouter()
  const [copiedSection, setCopiedSection] = useState<string | null>(null)

  const handleCopy = async (text: string, section: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedSection(section)
    setTimeout(() => setCopiedSection(null), 2000)
  }

  const mockSummary = {
    title: "Employment Agreement - Software Developer",
    documentType: "Employment Contract",
    keyPoints: [
      "Full-time employment position as Senior Software Developer",
      "Annual salary of $95,000 with quarterly performance reviews",
      "Standard benefits package including health, dental, and 401(k)",
      "90-day probationary period with at-will employment thereafter",
      "Intellectual property assignment clause for work-related inventions",
    ],
    criticalClauses: [
      {
        type: "warning",
        title: "Non-Compete Agreement",
        content:
          "Employee agrees not to work for competing companies within 50 miles for 12 months after termination. This may limit future employment opportunities.",
      },
      {
        type: "info",
        title: "Confidentiality Agreement",
        content:
          "Standard confidentiality clause requiring protection of company trade secrets and proprietary information during and after employment.",
      },
    ],
    recommendations: [
      "Consider negotiating the non-compete radius and duration",
      "Clarify what constitutes 'competing companies'",
      "Request written clarification on intellectual property ownership for personal projects",
      "Ensure termination notice period is mutual (both employer and employee)",
    ],
    fullSummary: `This employment agreement establishes a full-time Senior Software Developer position with competitive compensation and standard benefits. The contract includes several important provisions that require careful consideration.

The compensation package offers an annual salary of $95,000 with quarterly performance reviews, suggesting opportunities for advancement. Benefits include comprehensive health coverage, dental insurance, and 401(k) retirement planning.

Key concerns include a restrictive non-compete clause that prevents employment with competing companies within a 50-mile radius for 12 months post-termination. This could significantly impact future career opportunities and should be negotiated.

The intellectual property clause assigns all work-related inventions to the company, which is standard but may affect personal projects. Consider requesting clarification on what constitutes "work-related" inventions.

Overall, this is a fairly standard employment agreement with some restrictive clauses that warrant discussion before signing.`,
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
              <Button variant="outline" size="sm" className="hover:bg-card transition-colors bg-transparent">
                <Download className="w-4 h-4 mr-2" />
                Export PDF
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
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">{mockSummary.title}</h1>
              <p className="text-muted-foreground">{mockSummary.documentType}</p>
            </div>
          </div>
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
                    onClick={() => handleCopy(mockSummary.keyPoints.join("\n• "), "keyPoints")}
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
                  {mockSummary.keyPoints.map((point, index) => (
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
                {mockSummary.criticalClauses.map((clause, index) => (
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
                    onClick={() => handleCopy(mockSummary.fullSummary, "fullSummary")}
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
                  {mockSummary.fullSummary.split("\n\n").map((paragraph, index) => (
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
                    onClick={() => handleCopy(mockSummary.recommendations.join("\n• "), "recommendations")}
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
                  {mockSummary.recommendations.map((rec, index) => (
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
                <Button className="w-full bg-secondary hover:bg-secondary/90 text-secondary-foreground transition-all duration-300 hover:scale-105">
                  <Download className="w-4 h-4 mr-2" />
                  Download Summary
                </Button>
                <Button variant="outline" className="w-full hover:bg-card transition-colors bg-transparent">
                  <FileText className="w-4 h-4 mr-2" />
                  Analyze Another Document
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
}
