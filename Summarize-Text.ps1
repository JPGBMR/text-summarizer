<#
.SYNOPSIS
    Simple text summarizer using word frequency tokenization.

.DESCRIPTION
    Extracts the most important sentences from text based on word frequency scoring.
    This is a simple extractive summarization approach:
    1. Tokenize text into sentences and words
    2. Calculate word frequencies (excluding common stop words)
    3. Score sentences based on word frequencies
    4. Return top N sentences as summary

.PARAMETER InputFile
    Path to the input text file to summarize

.PARAMETER Text
    Text string to summarize (alternative to InputFile)

.PARAMETER OutputFile
    Path to save the summary (optional, outputs to console if not specified)

.PARAMETER SentenceCount
    Number of sentences to include in the summary (default: 3)

.PARAMETER MinWordLength
    Minimum word length to consider (filters out short words, default: 4)

.EXAMPLE
    .\Summarize-Text.ps1 -InputFile "article.txt" -SentenceCount 5

.EXAMPLE
    .\Summarize-Text.ps1 -InputFile "article.txt" -OutputFile "summary.txt"

.EXAMPLE
    Get-Content "article.txt" | .\Summarize-Text.ps1 -SentenceCount 3

.NOTES
    Author: Text Summarizer PowerShell Edition
    Version: 1.0.0
#>

[CmdletBinding(DefaultParameterSetName = 'File')]
param(
    [Parameter(ParameterSetName = 'File', Mandatory = $true, Position = 0)]
    [ValidateScript({ Test-Path $_ -PathType Leaf })]
    [string]$InputFile,

    [Parameter(ParameterSetName = 'Text', Mandatory = $true, ValueFromPipeline = $true)]
    [string]$Text,

    [Parameter(Mandatory = $false)]
    [string]$OutputFile,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 100)]
    [int]$SentenceCount = 3,

    [Parameter(Mandatory = $false)]
    [ValidateRange(1, 10)]
    [int]$MinWordLength = 4
)

begin {
    # Common English stop words to exclude from frequency analysis
    $stopWords = @(
        'the', 'be', 'to', 'of', 'and', 'a', 'in', 'that', 'have', 'i',
        'it', 'for', 'not', 'on', 'with', 'he', 'as', 'you', 'do', 'at',
        'this', 'but', 'his', 'by', 'from', 'they', 'we', 'say', 'her', 'she',
        'or', 'an', 'will', 'my', 'one', 'all', 'would', 'there', 'their',
        'what', 'so', 'up', 'out', 'if', 'about', 'who', 'get', 'which', 'go',
        'me', 'when', 'make', 'can', 'like', 'time', 'no', 'just', 'him', 'know',
        'take', 'people', 'into', 'year', 'your', 'good', 'some', 'could', 'them',
        'see', 'other', 'than', 'then', 'now', 'look', 'only', 'come', 'its', 'over',
        'think', 'also', 'back', 'after', 'use', 'two', 'how', 'our', 'work',
        'first', 'well', 'way', 'even', 'new', 'want', 'because', 'any', 'these',
        'give', 'day', 'most', 'us', 'is', 'was', 'are', 'been', 'has', 'had',
        'were', 'said', 'did', 'having', 'may', 'should', 'could', 'would'
    )

    function Split-Sentences {
        param([string]$InputText)

        # Split on sentence boundaries (., !, ?)
        # Preserve the punctuation
        $sentences = $InputText -split '(?<=[.!?])\s+' | Where-Object { $_.Trim() -ne '' }
        return $sentences
    }

    function Get-WordFrequency {
        param(
            [string[]]$Sentences,
            [string[]]$StopWords,
            [int]$MinLength
        )

        $wordFreq = @{}

        foreach ($sentence in $Sentences) {
            # Tokenize: remove punctuation, convert to lowercase, split on whitespace
            $words = $sentence -replace '[^\w\s]', '' -split '\s+' |
                     Where-Object { $_ -ne '' }

            foreach ($word in $words) {
                $word = $word.ToLower()

                # Skip if it's a stop word or too short
                if ($StopWords -contains $word -or $word.Length -lt $MinLength) {
                    continue
                }

                if ($wordFreq.ContainsKey($word)) {
                    $wordFreq[$word]++
                } else {
                    $wordFreq[$word] = 1
                }
            }
        }

        return $wordFreq
    }

    function Get-SentenceScore {
        param(
            [string]$Sentence,
            [hashtable]$WordFrequency,
            [string[]]$StopWords,
            [int]$MinLength
        )

        $score = 0
        $wordCount = 0

        # Tokenize sentence
        $words = $Sentence -replace '[^\w\s]', '' -split '\s+' |
                 Where-Object { $_ -ne '' }

        foreach ($word in $words) {
            $word = $word.ToLower()

            if ($StopWords -contains $word -or $word.Length -lt $MinLength) {
                continue
            }

            if ($WordFrequency.ContainsKey($word)) {
                $score += $WordFrequency[$word]
                $wordCount++
            }
        }

        # Normalize by number of significant words to avoid bias toward longer sentences
        if ($wordCount -gt 0) {
            return $score / $wordCount
        } else {
            return 0
        }
    }
}

process {
    # Read input text
    if ($PSCmdlet.ParameterSetName -eq 'File') {
        Write-Verbose "Reading from file: $InputFile"
        $inputText = Get-Content -Path $InputFile -Raw -Encoding UTF8
    } else {
        $inputText = $Text
    }

    # Validate input
    if ([string]::IsNullOrWhiteSpace($inputText)) {
        Write-Error "Input text is empty"
        return
    }

    # Split into sentences
    Write-Verbose "Tokenizing text into sentences..."
    $sentences = Split-Sentences -InputText $inputText

    if ($sentences.Count -eq 0) {
        Write-Error "No sentences found in input text"
        return
    }

    # If text has fewer sentences than requested, return all
    if ($sentences.Count -le $SentenceCount) {
        Write-Warning "Text has only $($sentences.Count) sentence(s). Returning all."
        $summary = $inputText
    } else {
        Write-Verbose "Calculating word frequencies..."
        $wordFreq = Get-WordFrequency -Sentences $sentences -StopWords $stopWords -MinLength $MinWordLength

        # Score each sentence
        Write-Verbose "Scoring sentences..."
        $scoredSentences = @()
        for ($i = 0; $i -lt $sentences.Count; $i++) {
            $score = Get-SentenceScore -Sentence $sentences[$i] -WordFrequency $wordFreq -StopWords $stopWords -MinLength $MinWordLength

            $scoredSentences += [PSCustomObject]@{
                Index    = $i
                Sentence = $sentences[$i]
                Score    = $score
            }
        }

        # Select top N sentences and sort by original order
        Write-Verbose "Selecting top $SentenceCount sentences..."
        $topSentences = $scoredSentences |
                        Sort-Object -Property Score -Descending |
                        Select-Object -First $SentenceCount |
                        Sort-Object -Property Index

        # Combine into summary
        $summary = ($topSentences | ForEach-Object { $_.Sentence }) -join ' '
    }

    # Output results
    if ($OutputFile) {
        $summary | Out-File -FilePath $OutputFile -Encoding UTF8
        Write-Host "✅ Summary saved to: $OutputFile" -ForegroundColor Green

        # Show statistics
        $originalWords = ($inputText -split '\s+').Count
        $summaryWords = ($summary -split '\s+').Count
        Write-Host "`nOriginal: $originalWords words" -ForegroundColor Cyan
        Write-Host "Summary: $summaryWords words" -ForegroundColor Cyan
        Write-Host "Reduction: $([math]::Round((1 - $summaryWords / $originalWords) * 100, 1))%" -ForegroundColor Cyan
    } else {
        # Output to console
        Write-Host "`n$('=' * 50)" -ForegroundColor Yellow
        Write-Host "SUMMARY" -ForegroundColor Yellow
        Write-Host "$('=' * 50)" -ForegroundColor Yellow
        Write-Host $summary
        Write-Host "$('=' * 50)" -ForegroundColor Yellow

        # Show statistics
        $originalWords = ($inputText -split '\s+').Count
        $summaryWords = ($summary -split '\s+').Count
        Write-Host "`nOriginal: $originalWords words" -ForegroundColor Cyan
        Write-Host "Summary: $summaryWords words" -ForegroundColor Cyan
        Write-Host "Reduction: $([math]::Round((1 - $summaryWords / $originalWords) * 100, 1))%" -ForegroundColor Cyan
    }
}
