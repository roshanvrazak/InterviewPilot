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
    <div className="surface-elevated rounded-2xl p-5">
      <div className="flex items-center gap-2 mb-3">
        <label className="text-[13px] font-semibold tracking-wide" style={{ color: 'var(--text-muted)' }}>
          JOB DESCRIPTION
        </label>
        <span className="text-[11px] font-medium px-2 py-0.5 rounded-full" style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-muted)' }}>
          Optional
        </span>
      </div>

      <textarea
        className="w-full h-28 p-3.5 rounded-xl text-[14px] outline-none transition-all duration-200 mb-3 resize-none"
        style={{
          backgroundColor: 'var(--bg-secondary)',
          border: '1.5px solid var(--border-primary)',
          color: 'var(--text-primary)',
        }}
        onFocus={(e) => {
          e.currentTarget.style.borderColor = 'var(--accent-primary)';
          e.currentTarget.style.boxShadow = '0 0 0 3px var(--accent-glow)';
        }}
        onBlur={(e) => {
          e.currentTarget.style.borderColor = 'var(--border-primary)';
          e.currentTarget.style.boxShadow = 'none';
        }}
        placeholder="Paste the job description here for tailored questions..."
        value={pastedJD}
        onChange={(e) => { setPastedJD(e.target.value); onJDChange(e.target.value); }}
      />

      <div
        className="flex items-center justify-between p-3 rounded-xl"
        style={{ backgroundColor: 'var(--bg-secondary)', border: '1.5px dashed var(--border-primary)' }}
      >
        <span className="text-[12px] font-medium" style={{ color: 'var(--text-muted)' }}>
          Or upload a PDF / DOCX
        </span>
        <label
          className="text-[12px] font-semibold px-3.5 py-1.5 rounded-lg cursor-pointer transition-all"
          style={{ backgroundColor: 'var(--accent-surface)', color: 'var(--accent-primary)' }}
          onMouseEnter={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-primary)'; e.currentTarget.style.color = '#fff'; }}
          onMouseLeave={(e) => { e.currentTarget.style.backgroundColor = 'var(--accent-surface)'; e.currentTarget.style.color = 'var(--accent-primary)'; }}
        >
          Choose File
          <input type="file" accept=".pdf,.docx" onChange={handleFileUpload} disabled={loading} className="hidden" />
        </label>
      </div>

      {loading && (
        <div className="flex items-center gap-2 text-[12px] mt-2.5 animate-fade-in" style={{ color: 'var(--accent-primary)' }}>
          <div className="w-3 h-3 rounded-full animate-spin" style={{ border: '2px solid var(--accent-surface)', borderTopColor: 'var(--accent-primary)' }} />
          Parsing file...
        </div>
      )}
    </div>
  );
};
