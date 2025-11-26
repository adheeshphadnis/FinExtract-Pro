import React from 'react';
import { 
  UploadCloud, 
  FileText, 
  CheckCircle, 
  AlertCircle, 
  Loader2, 
  FileSpreadsheet, 
  Download,
  Table as TableIcon,
  X
} from 'lucide-react';

export const UploadIcon = () => <UploadCloud className="w-12 h-12 text-corporate-400" />;
export const FileIcon = () => <FileText className="w-8 h-8 text-corporate-600" />;
export const SuccessIcon = () => <CheckCircle className="w-6 h-6 text-green-500" />;
export const ErrorIcon = () => <AlertCircle className="w-6 h-6 text-red-500" />;
export const SpinnerIcon = () => <Loader2 className="w-8 h-8 text-corporate-600 animate-spin" />;
export const ExcelIcon = () => <FileSpreadsheet className="w-5 h-5" />;
export const DownloadIcon = () => <Download className="w-5 h-5" />;
export const TableListIcon = () => <TableIcon className="w-5 h-5 text-corporate-500" />;
export const CloseIcon = () => <X className="w-5 h-5" />;
