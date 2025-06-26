import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { FiUpload, FiX } from 'react-icons/fi'

interface FileUploadProps {
  onUpload: (files: File[]) => Promise<void>
  maxFiles?: number
  maxSize?: number
  value?: string[]
  onRemove?: (index: number) => void
}

export default function FileUpload({ 
  onUpload, 
  maxFiles = 5, 
  maxSize = 4 * 1024 * 1024, // 4MB
  value = [],
  onRemove
}: FileUploadProps) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState<{[key: string]: number}>({})

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length + value.length > maxFiles) {
      alert(`You can only upload up to ${maxFiles} files`)
      return
    }

    setUploading(true)
    try {
      await onUpload(acceptedFiles)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload files. Please try again.')
    } finally {
      setUploading(false)
      setUploadProgress({})
    }
  }, [maxFiles, onUpload, value.length])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif']
    },
    maxSize,
    maxFiles: maxFiles - value.length,
    disabled: uploading
  })

  return (
    <div className="space-y-4">
      <div 
        {...getRootProps()} 
        className={`
          border-2 border-dashed rounded-lg p-8
          flex flex-col items-center justify-center
          cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-300'}
          ${uploading ? 'opacity-50 cursor-not-allowed' : ''}
        `}
      >
        <input {...getInputProps()} />
        <FiUpload className="w-8 h-8 mb-4 text-gray-400" />
        <p className="text-sm font-medium">Drag & drop images here</p>
        <p className="text-xs text-gray-500">
          Or click to browse (max {maxFiles} files, up to {maxSize / 1024 / 1024}MB each)
        </p>
        {uploading && <p className="mt-2 text-sm text-blue-500">Uploading...</p>}
      </div>

      {value.length > 0 && (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4">
          {value.map((url, index) => (
            <div key={url} className="relative group">
              <img
                src={url}
                alt={`Upload ${index + 1}`}
                className="w-full h-32 object-cover rounded-lg"
              />
              {onRemove && (
                <button
                  onClick={() => onRemove(index)}
                  className="absolute top-2 right-2 p-1 rounded-full bg-black/50 text-white
                           opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="w-4 h-4" />
                </button>
              )}
              {uploadProgress[url] !== undefined && (
                <div className="absolute bottom-0 left-0 right-0 h-1 bg-gray-200">
                  <div 
                    className="h-full bg-blue-500 transition-all duration-300"
                    style={{ width: `${uploadProgress[url]}%` }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 