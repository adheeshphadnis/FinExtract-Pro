import React, { useState, useRef, useCallback } from 'react';
import { extractTablesFromPdf } from './services/geminiService';
import { generateExcel } from './services/excelService';
import { TableData, AppStatus } from './types';
import { UploadIcon, FileIcon, ExcelIcon, DownloadIcon, TableListIcon, ErrorIcon, CloseIcon, SuccessIcon } from './components/Icons';
import { ProcessingStep } from './components/ProcessingStep';

const App: React.FC = () => {
  const [status, setStatus] = useState<AppStatus>(AppStatus.IDLE);
  const [tables, setTables] = useState<TableData[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Processing stages for visual feedback
  const [uploadStep, setUploadStep] = useState<'waiting' | 'active' | 'done'>('waiting');
  const [analysisStep, setAnalysisStep] = useState<'waiting' | 'active' | 'done'>('waiting');
  const [formattingStep, setFormattingStep] = useState<'waiting' | 'active' | 'done'>('waiting');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setStatus(AppStatus.IDLE);
    setTables([]);
    setSelectedFile(null);
    setErrorMsg(null);
    setUploadStep('waiting');
    setAnalysisStep('waiting');
    setFormattingStep('waiting');
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const validateAndSetFile = (file: File) => {
    const validTypes = ['application/pdf'];
    // 20MB limit
    const maxSize = 20 * 1024 * 1024; 

    if (!validTypes.includes(file.type)) {
      setErrorMsg("Please upload a valid PDF file.");
      return;
    }
    if (file.size > maxSize) {
      setErrorMsg("File is too large (Max 20MB).");
      return;
    }

    setErrorMsg(null);
    setSelectedFile(file);
    startProcessing(file);
  };

  const startProcessing = async (file: File) => {
    setStatus(AppStatus.PROCESSING);
    
    // Step 1: Upload/Read
    setUploadStep('active');
    await new Promise(r => setTimeout(r, 800)); // Fake visual delay for smoothness
    setUploadStep('done');

    // Step 2: AI Analysis
    setAnalysisStep('active');
    try {
      const extractedTables = await extractTablesFromPdf(file);
      
      if (extractedTables.length === 0) {
        throw new Error("No tables were found in this document.");
      }

      setTables(extractedTables);
      setAnalysisStep('done');

      // Step 3: Finalizing
      setFormattingStep('active');
      await new Promise(r => setTimeout(r, 600)); 
      setFormattingStep('done');

      setStatus(AppStatus.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "An unexpected error occurred.");
      setStatus(AppStatus.ERROR);
      setAnalysisStep('waiting'); // Reset visual indicators on error
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) {
      validateAndSetFile(file);
    }
  };

  const handleDownload = () => {
    if (tables.length > 0) {
      const filename = selectedFile ? 
        selectedFile.name.replace('.pdf', '_Tables.xlsx') : 
        'Extracted_Report.xlsx';
      generateExcel(tables, filename);
    }
  };

  return (
    <div className="flex-grow flex flex-col items-center justify-center p-4 sm:p-8 animate-fade-in">
      {/* Header */}
      <div className="text-center mb-10 max-w-2xl">
        <div className="inline-flex items-center justify-center p-3 bg-corporate-800 rounded-xl shadow-lg mb-6">
          <ExcelIcon />
          <span className="ml-2 text-white font-bold tracking-wide">FinExtract Pro</span>
        </div>
        <h1 className="text-4xl sm:text-5xl font-extrabold text-corporate-900 mb-4 tracking-tight">
          Financial Reports to Excel
        </h1>
        <p className="text-lg text-corporate-500 leading-relaxed">
          Instantly convert Annual Reports (10-K) and Quarterly Reports (10-Q) into formatted Excel spreadsheets using advanced AI analysis.
        </p>
      </div>

      {/* Main Card */}
      <div className="w-full max-w-2xl bg-white rounded-2xl shadow-xl border border-corporate-100 overflow-hidden transition-all duration-300">
        
        {/* State: IDLE / Drag & Drop */}
        {status === AppStatus.IDLE && (
          <div 
            className={`p-12 text-center border-2 border-dashed transition-colors duration-200 cursor-pointer
              ${isDragging ? 'border-brand bg-blue-50' : 'border-corporate-200 hover:border-corporate-400 hover:bg-corporate-50'}
            `}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <input 
              type="file" 
              ref={fileInputRef} 
              className="hidden" 
              accept=".pdf" 
              onChange={handleFileChange}
            />
            <div className="flex justify-center mb-6">
              <div className="p-4 bg-corporate-50 rounded-full">
                <UploadIcon />
              </div>
            </div>
            <h3 className="text-xl font-semibold text-corporate-800 mb-2">
              Upload Financial Report
            </h3>
            <p className="text-corporate-400 mb-6">
              Drag & drop your PDF file here, or click to browse
            </p>
            <div className="text-xs text-corporate-300 uppercase tracking-widest font-semibold">
              Max Size: 20MB • PDF Only
            </div>
          </div>
        )}

        {/* State: PROCESSING / ERROR */}
        {(status === AppStatus.PROCESSING || status === AppStatus.ERROR) && (
          <div className="p-10">
            <div className="flex items-center mb-8">
              <div className="p-3 bg-corporate-100 rounded-lg mr-4">
                <FileIcon />
              </div>
              <div className="flex-1 overflow-hidden">
                <h3 className="font-semibold text-corporate-900 truncate">
                  {selectedFile?.name || "Processing..."}
                </h3>
                <p className="text-sm text-corporate-500">
                  {(selectedFile?.size || 0) / 1024 / 1024 < 1 
                    ? `${((selectedFile?.size || 0) / 1024).toFixed(0)} KB` 
                    : `${((selectedFile?.size || 0) / 1024 / 1024).toFixed(2)} MB`}
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <ProcessingStep label="Reading Document" status={uploadStep} />
              <ProcessingStep label="Extracting Financial Tables" status={analysisStep} />
              <ProcessingStep label="Formatting Excel Workbook" status={formattingStep} />
            </div>

            {status === AppStatus.ERROR && (
              <div className="mt-8 p-4 bg-red-50 border border-red-100 rounded-lg flex items-start gap-3 animate-slide-up">
                <ErrorIcon />
                <div className="flex-1">
                  <h4 className="text-red-800 font-semibold mb-1">Extraction Failed</h4>
                  <p className="text-red-600 text-sm">{errorMsg}</p>
                  <button 
                    onClick={resetState}
                    className="mt-3 text-sm font-medium text-red-700 hover:text-red-900 underline"
                  >
                    Try Another File
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* State: COMPLETE */}
        {status === AppStatus.COMPLETE && (
          <div className="flex flex-col h-full animate-slide-up">
            <div className="p-6 border-b border-corporate-100 bg-green-50/50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-2 rounded-full">
                  <SuccessIcon />
                </div>
                <div>
                  <h3 className="font-bold text-corporate-900">Analysis Complete</h3>
                  <p className="text-sm text-corporate-600">Successfully extracted {tables.length} tables</p>
                </div>
              </div>
              <button onClick={resetState} className="p-2 hover:bg-corporate-100 rounded-full transition-colors text-corporate-400">
                <CloseIcon />
              </button>
            </div>

            <div className="p-6 bg-corporate-50 max-h-60 overflow-y-auto custom-scrollbar border-b border-corporate-100">
              <h4 className="text-xs font-bold text-corporate-400 uppercase tracking-wider mb-3">Extracted Sheets</h4>
              <div className="grid gap-2">
                {tables.map((table, idx) => (
                  <div key={idx} className="flex items-center gap-3 p-3 bg-white rounded border border-corporate-100 shadow-sm">
                    <TableListIcon />
                    <span className="text-sm font-medium text-corporate-700 truncate flex-1">{table.sheetName}</span>
                    <span className="text-xs text-corporate-400 bg-corporate-50 px-2 py-1 rounded">
                      {table.rows.length} rows
                    </span>
                  </div>
                ))}
              </div>
            </div>

            <div className="p-8 bg-white text-center">
              <button 
                onClick={handleDownload}
                className="w-full sm:w-auto px-8 py-3 bg-corporate-900 hover:bg-corporate-800 text-white rounded-lg font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <DownloadIcon />
                Download Excel Report
              </button>
              <p className="mt-4 text-xs text-corporate-400">
                Generated compatible with Microsoft Excel, Google Sheets, and Numbers.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="mt-12 text-center text-corporate-400 text-sm">
        <p>&copy; {new Date().getFullYear()} FinExtract Pro. Powered by Gemini 3 Pro.</p>
      </div>
    </div>
  );
};

export default App;