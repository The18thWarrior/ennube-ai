// === page.tsx ===
// Created: 2025-09-15 12:00
// Purpose: Benchmark runner UI - loads prompts CSV, runs /api/benchmark sequentially,
// displays JSON results and exposes CSV download
// Exports: default React component for Next.js route
'use client'
import React, { useEffect, useMemo, useState } from 'react'

// Load prompts text from the bundled file
import { prompts as promptsText } from '../../benchmark/files/query_prompts'
import { Button, Card, JsonView } from '@/components/ui'
//import resultsJson from './results.json'

type PromptRow = {
  Category: string
  Question: string
  Result?: string
  AnswerScore?: string
  UseOfToolsScore?: string
}

type ResultRow = {
  question: string
  status: 'ok' | 'error'
  response?: any
  error?: string
}

interface BenchmarkResult {
  Question: string;
  Model: string;
  Response: string;
  TimeTakenMs: number;
  Summary: string;
  AnswerAccuracyScore: number;
  ToolUseScore: number;
}


function parseCsv(text: string): PromptRow[] {
  // simple CSV parser for the known format: header + comma-separated values
  const lines = text.split(/\r?\n/).filter(Boolean)
  if (lines.length === 0) return []
  const header = lines[0].split(',').map(h => h.trim())
  const rows: PromptRow[] = []
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',')
    if (cols.length < 2) continue
    rows.push({
      Category: cols[0]?.trim() ?? '',
      Question: cols[1]?.trim() ?? '',
      Result: cols[2]?.trim() ?? '',
      AnswerScore: cols[3]?.trim() ?? '',
      UseOfToolsScore: cols[4]?.trim() ?? ''
    })
  }
  return rows
}

function jsonToCsv(rows: BenchmarkResult[]) {
  const header = ['question','model','response','timeTakenMs','summary','answerAccuracyScore','toolUseScore']
  const lines = [header.join(',')]
  for (const r of rows) {
    const safe = (v: any) => {
      if (v === undefined || v === null) return ''
      const s = typeof v === 'string' ? v : JSON.stringify(v)
      // escape quotes and commas
      return '"' + s.replace(/"/g, '""') + '"'
    }
    lines.push([safe(r.Question), safe(r.Model), safe(r.Response), safe(r.TimeTakenMs), safe(r.Summary), safe(r.AnswerAccuracyScore), safe(r.ToolUseScore)].join(','))
  }
  return lines.join('\n')
}

export default function BenchmarkPage() {
  const prompts = useMemo(() => parseCsv(promptsText), [])

  const [running, setRunning] = useState(false)
  const [progress, setProgress] = useState({ current: 0, total: prompts.length })
  const [results, setResults] = useState<BenchmarkResult[]>([])

  const avgAnswerScore = useMemo(() => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.AnswerAccuracyScore || 0), 0)
    return total / results.length
  }, [results])

  const avgToolUseScore = useMemo(() => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.ToolUseScore || 0), 0)
    return total / results.length
  }, [results])
  
  const avgTimeTaken = useMemo(() => {
    if (results.length === 0) return 0
    const total = results.reduce((sum, r) => sum + (r.TimeTakenMs || 0), 0)
    return total / results.length
  }, [results])

  useEffect(() => {
    setProgress({ current: 0, total: prompts.length })
  }, [prompts.length])

  async function runAll() {
    setRunning(true)
    const out: BenchmarkResult[] = []
    const _prompts = [...prompts]; // capture current prompts
    for (let i = 0; i < _prompts.length; i++) {
      const p = _prompts[i]
      setProgress({ current: i + 1, total: _prompts.length })
      try {
        // call the api/benchmark endpoint with the question
        const resp = await fetch('/api/benchmark', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ question: p.Question})
        })
        if (!resp.ok) {
          const txt = await resp.text()
          const response = { Question: p.Question, Model: 'unknown', Response: txt, TimeTakenMs: 0, Summary: 'Error occurred', AnswerAccuracyScore: 0, ToolUseScore: 0 } as BenchmarkResult;
          out.push(response)
          setResults((prev) => [...prev, response])
        } else {
          const json = await resp.json()
          const response = { ...json } as BenchmarkResult;
          out.push(response)
          setResults((prev) => [...prev, response])
        }
      } catch (err: any) {
        console.log('catching error');
        const response = { Question: p.Question, Model: 'unknown', Response: String(err?.message ?? err), TimeTakenMs: 0, Summary: 'Error occurred', AnswerAccuracyScore: 0, ToolUseScore: 0 } as BenchmarkResult;
        out.push(response)
        setResults((prev) => [...prev, response])
      }
      // update incremental UI
      //setResults((prev) => [...prev, ...out])
      // small throttle to avoid hammering (optional)
      await new Promise(r => setTimeout(r, 200))
    }
    setRunning(false)
    setProgress({ current: prompts.length, total: prompts.length })
  }
  useEffect(() => {
    // reset results when prompts change
    console.log(`results`,results);
  }, [results])
  
  function downloadCsv() {
    const csv = jsonToCsv(results)
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark_results_${new Date().toISOString()}.csv`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  function downloadJson() {
    const json = JSON.stringify(results, null, 2)
    const blob = new Blob([json], { type: 'application/json;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `benchmark_results_${new Date().toISOString()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ padding: 20, fontFamily: 'system-ui, sans-serif' }}>
      <h1 className={'text-xl font-semibold py-2'} >Benchmark Runner</h1>
      <p>Prompts loaded: {prompts.length}</p>
      <div style={{ margin: '12px 0' }}>
        <Button onClick={runAll} disabled={running || prompts.length === 0} style={{ marginRight: 8 }}>
          {running ? `Running (${progress.current}/${progress.total})` : 'Run All Prompts'}
        </Button>
        <Button onClick={() => { setResults([]); setProgress({ current: 0, total: prompts.length }) }} disabled={running} style={{ marginRight: 8 }}>Clear</Button>
        {/* <Button onClick={downloadCsv} disabled={running || results.length === 0}>Download CSV</Button> */}
        <Button onClick={downloadJson} disabled={running || results.length === 0} style={{ marginLeft: 8 }}>Download JSON</Button>
      </div>
      {results.length > 0 &&
        <div className={'mb-4 flex gap-4 flex-wrap'}>
          <p className={'grow basis-full'}><strong>Average Answer Accuracy Score:</strong> {avgAnswerScore.toFixed(2)}</p>
          <p className={'grow basis-full'}><strong>Average Tool Use Score:</strong> {avgToolUseScore.toFixed(2)}</p>
          <p className={'grow basis-full'}><strong>Average Time Taken (ms):</strong> {avgTimeTaken.toFixed(0)}</p>
          <p className={'grow basis-full'}><strong>Overall Benchmark Score:</strong> {((avgAnswerScore + avgToolUseScore) / 2).toFixed(2)}</p>
        </div>
      }

      <section>
        <h2 className={'text-lg font-semibold py-2'}>Results (JSON)</h2>
        <Card className={'max-h-[60vh] overflow-auto p-4'}>
          {results.length === 0 ? <div className={''}><em>No results yet</em></div> : <JsonView data={results} />}
        </Card>
      </section>
    </div>
  )
}

/*
 * === page.tsx ===
 * Updated: 2025-09-15 12:00
 * Summary: UI page which sequentially executes /api/benchmark for each question in the bundled CSV and
 * exposes JSON results and CSV download.
 */
