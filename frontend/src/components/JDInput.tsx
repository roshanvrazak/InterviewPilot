import React, { useState } from 'react';
import { Upload, FileText, Database } from 'lucide-react';

interface JDInputProps {
  onJDChange: (jd: string) => void;
}

export const JDInput: React.FC<JDInputProps> = ({ onJDChange }) => {
  const [pastedJD, setPastedJD] = useState('');
  const [loading, setLoading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await fetch('http://localhost:8000/api/parse-jd', {
        method: 'POST',
        body: formData,
      });
      const data = await response.json();
      setPastedJD(data.text);
      onJDChange(data.text);
    } catch (error) {
      console.error('Error parsing file:', error);
      alert('Failed to parse file. Please paste the JD manually.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border border-[var(--border-subtle)] bg-black p-8 font-mono">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3 text-[var(--border-primary)]">
           <Database size={16} />
           <label className="text-[11px] font-bold uppercase tracking-[0.25em]">
             Data_Input: JOB_DESCRIPTION
           </label>
        </div>
        <span className="text-[10px] font-bold px-2 py-0.5 border border-[var(--border-subtle)] text-[var(--text-muted)] uppercase tracking-widest">
          OPTIONAL_FIELD
        </span>
      </div>

      <div className="relative mb-6">
          <textarea
            className="w-full h-40 p-5 bg-[var(--bg-secondary)] border border-[var(--border-primary)] text-[13px] outline-none transition-all duration-200 resize-none text-white focus:bg-black"
            placeholder="[ PASTE_RAW_TEXT_HERE_FOR_TAILORED_DIAGNOSTICS ]"
            value={pastedJD}
            onChange={(e) => { setPastedJD(e.target.value); onJDChange(e.target.value); }}
          />
          {/* Decorative corner */}
          <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-[var(--border-primary)] opacity-50" />
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 p-4 border border-[var(--border-subtle)] bg-[var(--bg-secondary)]">
        <div className="flex items-center gap-3 text-[var(--text-muted)]">
          <FileText size={16} />
          <span className="text-[11px] font-bold uppercase tracking-widest">
            EXTERNAL_DOC_UPLOAD
          </span>
        </div>
        
        <label className="group flex items-center gap-3 px-6 py-2 border border-[var(--border-primary)] text-[var(--border-primary)] hover:bg-[var(--border-primary)] hover:text-black transition-all cursor-pointer">
          <Upload size={14} />
          <span className="text-[11px] font-bold uppercase tracking-tighter">
            [ EXECUTE: FILE_IMPORT ]
          </span>
          <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={loading} className="hidden" />
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-[11px] font-bold mt-6 text-[var(--border-primary)] animate-pulse uppercase tracking-[0.2em]">
          <div className="w-2 h-2 bg-[var(--border-primary)]" />
          SYSTEM_BUSY: PARSING_DATA_STREAM...
        </div>
      )}
    </div>
  );
};
