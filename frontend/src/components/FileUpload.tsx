/**
 * Компонент загрузки файлов CSV/Excel
 */

import { useState, useRef } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Upload, FileSpreadsheet, X, CheckCircle, AlertCircle } from 'lucide-react'
import type { UploadResult } from '@/types'

interface FileUploadProps {
  onUpload: (file: File) => Promise<UploadResult>
  loading?: boolean
}

export function FileUpload({ onUpload, loading }: FileUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [result, setResult] = useState<UploadResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = (file: File) => {
    const validTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ]
    const validExtensions = ['.csv', '.xlsx', '.xls']

    const isValidType = validTypes.includes(file.type)
    const isValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext))

    if (!isValidType && !isValidExtension) {
      setError('Поддерживаются только файлы CSV и Excel (.xlsx, .xls)')
      return
    }

    setSelectedFile(file)
    setResult(null)
    setError(null)
  }

  const handleUpload = async () => {
    if (!selectedFile) return

    try {
      setError(null)
      const uploadResult = await onUpload(selectedFile)
      setResult(uploadResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Ошибка загрузки файла')
    }
  }

  const handleClear = () => {
    setSelectedFile(null)
    setResult(null)
    setError(null)
    if (inputRef.current) {
      inputRef.current.value = ''
    }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5" />
          Загрузка данных из файла
        </CardTitle>
      </CardHeader>
      <CardContent>
        {/* Зона перетаскивания */}
        <div
          className={`
            border-2 border-dashed rounded-lg p-8 text-center transition-colors
            ${dragActive
              ? 'border-blue-500 bg-blue-50 dark:bg-blue-950'
              : 'border-[hsl(var(--border))] hover:border-blue-400'
            }
          `}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
        >
          <input
            ref={inputRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            onChange={handleChange}
            className="hidden"
            id="file-upload"
          />

          {selectedFile ? (
            <div className="space-y-3">
              <FileSpreadsheet className="h-12 w-12 mx-auto text-green-500" />
              <div className="flex items-center justify-center gap-2">
                <span className="font-medium">{selectedFile.name}</span>
                <button
                  onClick={handleClear}
                  className="text-[hsl(var(--muted-foreground))] hover:text-red-500"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                {(selectedFile.size / 1024).toFixed(1)} КБ
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              <Upload className="h-12 w-12 mx-auto text-[hsl(var(--muted-foreground))]" />
              <div>
                <label
                  htmlFor="file-upload"
                  className="cursor-pointer text-blue-500 hover:text-blue-600 font-medium"
                >
                  Выберите файл
                </label>
                <span className="text-[hsl(var(--muted-foreground))]"> или перетащите сюда</span>
              </div>
              <p className="text-sm text-[hsl(var(--muted-foreground))]">
                Поддерживаются CSV и Excel файлы
              </p>
            </div>
          )}
        </div>

        {/* Сообщение об ошибке */}
        {error && (
          <div className="mt-4 p-3 rounded-lg bg-red-50 dark:bg-red-950 text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <span className="text-sm">{error}</span>
          </div>
        )}

        {/* Результат загрузки */}
        {result && (
          <div className="mt-4 p-3 rounded-lg bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="h-5 w-5" />
              <span className="font-medium">{result.message}</span>
            </div>
            {result.results && result.results.length > 0 && (
              <div className="text-sm space-y-1">
                <p>Обработано записей: {result.results.length}</p>
                <div className="flex gap-4 flex-wrap">
                  <span>
                    Низкий: {result.results.filter(r => r.danger_level === 'low').length}
                  </span>
                  <span>
                    Средний: {result.results.filter(r => r.danger_level === 'medium').length}
                  </span>
                  <span>
                    Высокий: {result.results.filter(r => r.danger_level === 'high').length}
                  </span>
                  <span>
                    Чрезвычайный: {result.results.filter(r => r.danger_level === 'extreme').length}
                  </span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Кнопка загрузки */}
        {selectedFile && !result && (
          <Button
            className="w-full mt-4"
            onClick={handleUpload}
            disabled={loading}
          >
            {loading ? 'Обработка...' : 'Загрузить и обработать'}
          </Button>
        )}

        {/* Инструкция */}
        <div className="mt-4 p-3 rounded-lg bg-[hsl(var(--muted))] text-sm">
          <p className="font-medium mb-2">Формат файла:</p>
          <p className="text-[hsl(var(--muted-foreground))]">
            Обязательные колонки: <code className="bg-[hsl(var(--background))] px-1 rounded">temperature</code>,{' '}
            <code className="bg-[hsl(var(--background))] px-1 rounded">humidity</code>,{' '}
            <code className="bg-[hsl(var(--background))] px-1 rounded">wind_speed</code>,{' '}
            <code className="bg-[hsl(var(--background))] px-1 rounded">precipitation</code>
          </p>
          <p className="text-[hsl(var(--muted-foreground))] mt-1">
            Опциональные: wind_direction, soil_moisture, vegetation_moisture, vegetation_type, location_name, latitude, longitude
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
