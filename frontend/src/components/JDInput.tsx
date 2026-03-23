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
    <div className="mb-8 bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
      <h3 className="text-lg font-bold mb-4 text-gray-800">Job Description (Optional)</h3>
      <textarea
        className="w-full h-32 p-3 border rounded-lg focus:ring-2 focus:ring-blue-500 mb-4 text-sm"
        placeholder="Paste the job description here for a tailored interview..."
        value={pastedJD}
        onChange={(e) => {
          setPastedJD(e.target.value);
          onJDChange(e.target.value);
        }}
      />
      <div className="flex items-center justify-between">
        <span className="text-xs text-gray-500">Or upload a PDF/Docx</span>
        <input
          type="file"
          accept=".pdf,.docx"
          onChange={handleFileUpload}
          disabled={loading}
          className="text-xs text-blue-600 cursor-pointer"
        />
      </div>
      {loading && <div className="text-xs text-blue-500 mt-2">Parsing file...</div>}
    </div>
  );
};
