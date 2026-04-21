import React, { useState, useEffect, useRef } from 'react';
import { FileText, Upload, Download, Trash2, Share2, PenTool } from 'lucide-react';
import { Card, CardHeader, CardBody } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Badge } from '../../components/ui/Badge';
import toast from 'react-hot-toast';
import api from '../../services/api';
import { Document, Page, pdfjs } from 'react-pdf';
import SignatureCanvas from 'react-signature-canvas';
import 'react-pdf/dist/esm/Page/AnnotationLayer.css';
import 'react-pdf/dist/esm/Page/TextLayer.css';

// Set up PDF worker
pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${pdfjs.version}/build/pdf.worker.min.js`;

export const DocumentsPage: React.FC = () => {
  const [documents, setDocuments] = useState<any[]>([]);
  const [uploading, setUploading] = useState(false);
  
  // Selection & Preview
  const [selectedDoc, setSelectedDoc] = useState<any>(null);
  const [numPages, setNumPages] = useState<number>();
  const [pageNumber, setPageNumber] = useState<number>(1);

  // E-Signature
  const [signingModal, setSigningModal] = useState(false);
  const sigCanvas = useRef<SignatureCanvas>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      const { data } = await api.get('/documents');
      setDocuments(data);
    } catch {
      toast.error('Failed to load documents');
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    setUploading(true);
    try {
      await api.post('/documents/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      toast.success('Document uploaded!');
      fetchDocuments();
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.delete(`/documents/${id}`);
      toast.success('Document deleted');
      if (selectedDoc?.id === id) setSelectedDoc(null);
      fetchDocuments();
    } catch {
      toast.error('Failed to delete document');
    }
  };

  const onDocumentLoadSuccess = ({ numPages }: { numPages: number }) => {
    setNumPages(numPages);
    setPageNumber(1); // Reset page on new doc
  };

  const saveSignature = async () => {
    if (!sigCanvas.current || sigCanvas.current.isEmpty()) {
      toast.error('Please provide a signature');
      return;
    }

    if (!selectedDoc) return;

    try {
      const signatureData = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      await api.post(`/documents/${selectedDoc.id}/sign`, { signatureData });
      toast.success('Document signed successfully!');
      setSigningModal(false);
      fetchDocuments();
      setSelectedDoc({ ...selectedDoc, signatureData }); // Update local preview
    } catch {
      toast.error('Failed to sign document');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in relative z-0">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Documents</h1>
          <p className="text-gray-600">Secure File Vault & E-Signatures</p>
        </div>
        
        <div>
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={handleFileUpload}
            disabled={uploading}
          />
          <label htmlFor="file-upload">
            <Button as="span" leftIcon={<Upload size={18} />} disabled={uploading}>
              {uploading ? 'Uploading...' : 'Upload Document'}
            </Button>
          </label>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        
        <div className="lg:col-span-1 border-r border-gray-100 pr-4">
          <h2 className="font-semibold text-lg mb-4">Your Files</h2>
          <div className="space-y-2">
            {documents.length === 0 && <p className="text-sm text-gray-500">No documents found.</p>}
            {documents.map(doc => (
              <div
                key={doc.id}
                onClick={() => setSelectedDoc(doc)}
                className={`p-3 rounded-lg border cursor-pointer transition ${selectedDoc?.id === doc.id ? 'border-primary-500 bg-primary-50' : 'border-gray-200 hover:bg-gray-50'}`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="text-primary-600 flex-shrink-0" size={20} />
                    <span className="font-medium text-sm truncate">{doc.name}</span>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-2 flex justify-between">
                  <span>{doc.size}</span>
                  {doc.signatureData && <Badge variant="success" size="sm">Signed</Badge>}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-3">
          {selectedDoc ? (
            <Card className="h-full">
              <CardHeader className="flex justify-between items-center border-b">
                <h2 className="text-lg font-medium text-gray-900 truncate pr-4">{selectedDoc.name}</h2>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <Button variant="outline" size="sm" onClick={() => setSigningModal(true)} leftIcon={<PenTool size={16} />}>
                    E-Sign
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    className="text-error-600 hover:text-error-700"
                    onClick={() => handleDelete(selectedDoc.id)}
                    leftIcon={<Trash2 size={16} />}
                  >
                    Delete
                  </Button>
                </div>
              </CardHeader>
              <CardBody className="bg-gray-100 p-4 h-[70vh] overflow-y-auto w-full relative">
                 <div className="mx-auto flex flex-col items-center relative z-0">
                    {selectedDoc.type === 'PDF' && (
                        <div className="bg-white shadow p-2 ring-1 ring-gray-200">
                          <Document
                            file={`http://localhost:5000${selectedDoc.fileUrl}`}
                            onLoadSuccess={onDocumentLoadSuccess}
                            className="bg-white"
                          >
                            <Page pageNumber={pageNumber} width={700} renderTextLayer={false} renderAnnotationLayer={false} />
                          </Document>
                          
                          <div className="flex justify-between mt-4">
                            <Button disabled={pageNumber <= 1} onClick={() => setPageNumber(p => p - 1)}>Prev</Button>
                            <p>Page {pageNumber} of {numPages}</p>
                            <Button disabled={pageNumber >= (numPages || 1)} onClick={() => setPageNumber(p => p + 1)}>Next</Button>
                          </div>
                        </div>
                    )}
                    
                    {selectedDoc.type !== 'PDF' && (
                       <div className="bg-white rounded p-12 text-center shadow">
                          <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                          <p className="text-gray-600">Preview not supported for this file type.</p>
                          <a href={`http://localhost:5000${selectedDoc.fileUrl}`} target="_blank" rel="noreferrer" className="text-primary-600 block mt-4 font-medium hover:underline">Download / View Raw</a>
                       </div>
                    )}

                    {/* eSignature stamp overlay */}
                    {selectedDoc.signatureData && (
                      <div className="mt-8 bg-white p-4 drop-shadow rounded-lg border-2 border-yellow-200 w-[500px]">
                        <p className="text-xs text-gray-500 uppercase tracking-widest font-semibold border-b pb-2 mb-4">Digitally Signed Document</p>
                        <img src={selectedDoc.signatureData} alt="Digital Signature" className="h-[100px] object-contain mx-auto mix-blend-multiply" />
                      </div>
                    )}
                 </div>
              </CardBody>
            </Card>
          ) : (
             <div className="h-full flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg bg-gray-50 p-12 text-center">
                <div>
                   <FileText size={48} className="mx-auto text-gray-400 mb-4" />
                   <h3 className="text-lg font-medium text-gray-900">No document selected</h3>
                   <p className="text-gray-500 mt-2">Select a document from the left, or upload a new one.</p>
                </div>
             </div>
          )}
        </div>
      </div>

      {/* Signing Modal */}
      {signingModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100]">
          <div className="bg-white p-6 rounded-lg shadow-xl w-[600px]">
            <h2 className="text-xl mb-4 font-bold">E-Signature Chamber</h2>
            <p className="text-sm text-gray-600 mb-4">Draw your signature below to authorize this document.</p>
            
            <div className="border-2 border-gray-300 border-dashed rounded-lg bg-gray-50 mb-6 cursor-crosshair">
              <SignatureCanvas 
                ref={sigCanvas} 
                penColor="black"
                canvasProps={{width: 550, height: 200, className: 'sigCanvas'}}
              />
            </div>
            
            <div className="flex justify-between">
              <Button variant="ghost" onClick={() => sigCanvas.current?.clear()}>Clear Drawing</Button>
              <div className="space-x-3">
                <Button variant="outline" onClick={() => setSigningModal(false)}>Cancel</Button>
                <Button onClick={saveSignature} variant="primary">Apply Signature</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};