// frontend/src/components/JDInput.tsx
import React, { useState } from 'react';

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
    <div className="mb-8 bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-slate-800 dark:text-white">Job Description (Optional)</h3>
      <textarea
        className="w-full h-32 p-4 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent mb-4 text-sm text-slate-700 dark:text-slate-300 placeholder-slate-400 dark:placeholder-slate-500 transition-all outline-none"
        placeholder="Paste the job description here for a tailored interview..."
        value={pastedJD}
        onChange={(e) => {
          setPastedJD(e.target.value);
          onJDChange(e.target.value);
        }}
      />
      <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-600">
        <span className="text-xs font-medium text-slate-500 dark:text-slate-400">Or upload a PDF/Docx</span>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          disabled={loading}
          className="text-xs text-blue-600 dark:text-blue-400 cursor-pointer file:mr-4 file:py-1 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 dark:file:bg-blue-900/30 dark:file:text-blue-300"
        />
      </div>
      {loading && (
        <div className="flex items-center gap-2 text-xs text-blue-500 dark:text-blue-400 mt-3 animate-pulse">
          <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
          Parsing file...
        </div>
      )}
    </div>
  );
};
