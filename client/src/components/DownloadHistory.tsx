import { useState, useEffect } from 'react';
import { FolderOpen, FileText, Calendar, ExternalLink } from 'lucide-react';

interface DownloadRecord {
  fileName: string;
  filePath: string;
  downloadedAt: string;
  email: string;
  size?: number;
}

export function DownloadHistory() {
  const [downloads, setDownloads] = useState<DownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Mock data for now - in real app would fetch from API
    const mockDownloads: DownloadRecord[] = [
      {
        fileName: 'trustyapartment@gmail.com.csv',
        filePath: 'C:\\Users\\nguye\\OneDrive\\Máy tính\\Projects\\CompanyProject\\AgentCursor\\download\\trustyapartment@gmail.com.csv',
        downloadedAt: '2026-01-29T08:16:22.020Z',
        email: 'trustyapartment@gmail.com',
        size: 179979216
      }
    ];
    
    setDownloads(mockDownloads);
    setLoading(false);
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const openDownloadFolder = () => {
    // This would need to be implemented with Electron or a backend endpoint
    alert('Mở thư mục: C:\\Users\\nguye\\OneDrive\\Máy tính\\Projects\\CompanyProject\\AgentCursor\\download\\');
  };

  if (loading) {
    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-4 bg-gray-200 rounded"></div>
            <div className="h-4 bg-gray-200 rounded w-5/6"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Download History
        </h3>
        <button
          onClick={openDownloadFolder}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
        >
          <FolderOpen className="w-4 h-4" />
          Open Folder
        </button>
      </div>

      {downloads.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-4 text-gray-300" />
          <p>No downloads yet</p>
        </div>
      ) : (
        <div className="space-y-3">
          {downloads.map((download, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-lg">
                  <FileText className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">{download.fileName}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-500">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {formatDate(download.downloadedAt)}
                    </span>
                    {download.size && (
                      <span>{formatFileSize(download.size)}</span>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => navigator.clipboard.writeText(download.filePath)}
                  className="p-2 text-gray-400 hover:text-gray-600 hover:bg-white rounded-lg transition-colors"
                  title="Copy file path"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
        <p className="text-sm text-blue-800">
          <strong>📁 Download Location:</strong><br />
          <code className="text-xs bg-blue-100 px-2 py-1 rounded">
            C:\Users\nguye\OneDrive\Máy tính\Projects\CompanyProject\AgentCursor\download\
          </code>
        </p>
      </div>
    </div>
  );
}

export default DownloadHistory;
