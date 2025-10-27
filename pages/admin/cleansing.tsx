'use client';

import { useState, useEffect, ChangeEvent, FormEvent } from 'react';
import MainLayout from '../../components/MainLayout';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { auth, db } from '@/lib/firebase';
import { onAuthStateChanged } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

export default function UploadExcelPage() {
  const [fileName, setFileName] = useState('');
  const [data, setData] = useState<string[][] | null>(null);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [progress, setProgress] = useState(0);
  const rowsPerPage = 10;

  // Realtime listener untuk progress upload
  useEffect(() => {
    let unsubscribe: (() => void) | undefined;

    const unsubAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        const progressRef = doc(db, 'upload_progress', user.uid);
        unsubscribe = onSnapshot(progressRef, (snapshot) => {
          if (snapshot.exists()) {
            const prog = snapshot.data()?.progress ?? 0;
            setProgress(prog);
          }
        });
      }
    });

    return () => {
      if (unsubscribe) unsubscribe();
      unsubAuth();
    };
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    setFileName(e.target.files[0].name);
    setData(null);
    setCurrentPage(1);
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector('input[type=file]') as HTMLInputElement;
    if (!input.files || input.files.length === 0) {
      toast.error('Pilih file dulu ya!');
      return;
    }

    const file = input.files[0];
    setLoading(true);
    setProgress(0);

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || 'Upload gagal');
      }

      const json = await res.json();
      setData(json.data);
      toast.success('File berhasil diupload dan diparsing!');
    } catch (error: unknown) {
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error('Unknown error.');
      }
    } finally {
      setLoading(false);
    }
  };

  // Update header kolom
  const handleHeaderChange = (idx: number, newVal: string) => {
    if (!data) return;
    const newData = [...data];
    newData[0] = [...newData[0]];
    newData[0][idx] = newVal;
    setData(newData);
  };

  // Hapus kolom
  const handleDeleteColumn = (colIdx: number) => {
    if (!data) return;
    const newData = data.map((row) => {
      const newRow = [...row];
      newRow.splice(colIdx, 1);
      return newRow;
    });
    setData(newData);
  };

  const paginatedData = data
    ? [data[0], ...data.slice(1).slice((currentPage - 1) * rowsPerPage, currentPage * rowsPerPage)]
    : null;

  const totalPages = data ? Math.ceil((data.length - 1) / rowsPerPage) : 0;

  return (
    <MainLayout title="Upload File Excel">
      <h1 className="text-3xl font-bold mb-6">Upload File Excel (.xlsx)</h1>

      <form onSubmit={handleSubmit} className="bg-white p-6 rounded shadow max-w-xl mx-auto">
        <input
          type="file"
          accept=".xls,.xlsx"
          onChange={handleFileChange}
          className="mb-4 border border-gray-300 px-4 py-2 rounded w-full"
          disabled={loading}
          required
        />

        {fileName && (
          <p className="mb-4 text-gray-700">
            File terpilih: <strong>{fileName}</strong>
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 transition disabled:opacity-50 flex justify-center items-center"
        >
          {loading ? (
            <>
              <svg
                className="animate-spin h-5 w-5 mr-2 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8v8H4z"
                />
              </svg>
              Memproses...
            </>
          ) : (
            'Upload & Parse'
          )}
        </button>

        {loading && (
          <div className="mt-4">
            <p className="mb-1 text-gray-600">Progress: {progress}%</p>
            <div className="w-full bg-gray-200 rounded h-3">
              <div
                className="bg-green-600 h-3 rounded transition-all duration-300 ease-in-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}
      </form>

      {paginatedData && (
        <>
          <div className="overflow-auto w-full max-h-[70vh] mt-8 rounded border border-gray-300 bg-white p-4">
            <table className="min-w-full text-base text-left border-collapse border border-gray-300">
              <thead className="sticky top-0 bg-gray-100">
                <tr>
                  {paginatedData[0].map((col, idx) => (
                    <th
                      key={idx}
                      className="border border-gray-300 px-4 py-2 text-center font-semibold relative"
                    >
                      <input
                        type="text"
                        value={col}
                        onChange={(e) => handleHeaderChange(idx, e.target.value)}
                        className="w-full px-2 py-1 border border-gray-400 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder={`Kolom ${idx + 1}`}
                      />
                      <button
                        type="button"
                        onClick={() => handleDeleteColumn(idx)}
                        className="absolute top-1 right-1 text-red-500 hover:text-red-700 font-bold text-lg"
                        title="Hapus kolom"
                      >
                        &times;
                      </button>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {paginatedData.slice(1).map((row, rowIdx) => (
                  <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-gray-50' : 'bg-white'}>
                    {row.map((cell, cellIdx) => (
                      <td key={cellIdx} className="border border-gray-300 px-6 py-3">
                        {cell || ''}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex justify-center items-center mt-4 space-x-4">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Prev
            </button>
            <span>
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 disabled:opacity-50"
            >
              Next
            </button>
          </div>
        </>
      )}

      <ToastContainer position="top-right" autoClose={3000} />
    </MainLayout>
  );
}
