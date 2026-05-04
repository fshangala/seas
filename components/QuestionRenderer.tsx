'use client'

import React from 'react'
import Image from 'next/image'
import Card from '@/components/Card';
import { IDBResponse } from '../lib/idb'

export type Option = {
  id: string
  content: string
}

export type Question = {
  id: string
  question_type: 'mcq' | 'short_answer' | 'paragraph' | 'essay' | 'image_upload' | string | null
  content: string
  options?: Option[]
}

type Props = {
  question: Question
  response?: IDBResponse
  onResponse: (value: Partial<IDBResponse>) => void
}

export function QuestionRenderer({ question, response, onResponse }: Props) {
  const { question_type, content, options, id } = question

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement | HTMLInputElement>) => {
    const now = Date.now()
    onResponse({ 
      text_value: e.target.value, 
      synced: false, 
      updated_at: now 
    })
  }

  const handleOptionChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const now = Date.now()
    onResponse({ 
      selected_option_id: e.target.value, 
      synced: false, 
      updated_at: now 
    })
  }

  return (
    <Card className="flex flex-col gap-4 md:gap-6 animate-in fade-in slide-in-from-bottom-4 duration-500 p-6 md:p-10">
      <div className="text-lg md:text-xl font-semibold text-slate-800 leading-relaxed">
        {content}
      </div>

      {question_type === 'mcq' && options && (
        <div className="flex flex-col gap-2 md:gap-3">
          {options.map((opt) => (
            <label 
              key={opt.id}
              className={`flex items-center gap-3 md:gap-4 p-4 rounded-2xl border-2 cursor-pointer transition-all ${
                response?.selected_option_id === opt.id 
                  ? 'border-teal-500 bg-teal-50 text-teal-700' 
                  : 'border-slate-100 hover:border-slate-200 bg-slate-50'
              }`}
            >
              <input 
                type="radio" 
                name={id} 
                value={opt.id}
                className="w-5 h-5 accent-teal-600 shrink-0"
                checked={response?.selected_option_id === opt.id}
                onChange={handleOptionChange}
              />
              <span className="font-medium text-sm md:text-base">{opt.content}</span>
            </label>
          ))}
        </div>
      )}

      {(question_type === 'short_answer') && (
        <input 
          type="text"
          className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all bg-slate-50 font-medium text-sm md:text-base"
          placeholder="Type your answer here..."
          value={response?.text_value || ''}
          onChange={handleChange}
        />
      )}

      {(question_type === 'paragraph' || question_type === 'essay') && (
        <textarea 
          rows={question_type === 'essay' ? 12 : 6}
          className="w-full p-4 rounded-2xl border-2 border-slate-100 focus:border-teal-500 focus:ring-4 focus:ring-teal-500/10 outline-hidden transition-all bg-slate-50 font-medium resize-none leading-relaxed text-sm md:text-base"
          placeholder="Start writing your response..."
          value={response?.text_value || ''}
          onChange={handleChange}
        />
      )}

      {question_type === 'image_upload' && (
        <div className="flex flex-col gap-4">
          <div className="border-4 border-dashed border-slate-100 rounded-2xl p-12 flex flex-col items-center justify-center text-slate-400 bg-slate-50 hover:bg-slate-100 hover:border-slate-200 transition-all cursor-pointer">
            <input type="file" className="hidden" accept="image/*" />
            <p className="font-medium text-lg">Click or Drag to Upload Handwritten Work</p>
            <p className="text-sm mt-2">(Supports PNG, JPG, JPEG)</p>
          </div>
          {response?.image_response_url && (
            <div className="relative w-full h-64">
              <Image 
                src={response.image_response_url} 
                alt="Response" 
                fill
                className="rounded-2xl shadow-lg border border-slate-200 object-contain"
                unoptimized
              />
            </div>
          )}
        </div>
      )}
    </Card>
  )
}
