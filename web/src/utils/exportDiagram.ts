import type { RefObject } from 'react'
import { jsPDF } from 'jspdf'
import * as htmlToImage from 'html-to-image'

export async function exportDiagramPng(el: HTMLElement, pixelRatio = 3): Promise<Blob> {
  const dataUrl = await htmlToImage.toPng(el, {
    pixelRatio,
    cacheBust: true,
    backgroundColor: '#ffffff',
    filter: (node) => {
      const cls = (node as HTMLElement).classList
      return !(cls && cls.contains('react-flow__minimap'))
    },
  })
  const res = await fetch(dataUrl)
  return await res.blob()
}

export async function exportDiagramPdf(
  containerRef: RefObject<HTMLElement | null>,
  opts?: { title?: string },
): Promise<Blob> {
  const el = containerRef.current
  if (!el) throw new Error('Diagram container missing.')
  const pngBlob = await exportDiagramPng(el)
  const bitmap = await createImageBitmap(pngBlob)
  const orientation = bitmap.width >= bitmap.height ? 'landscape' : 'portrait'
  const pdf = new jsPDF({ orientation, unit: 'pt', format: 'letter' })
  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 36
  const maxW = pageWidth - margin * 2
  const maxH = pageHeight - margin * 2
  const scale = Math.min(maxW / bitmap.width, maxH / bitmap.height)
  const drawW = bitmap.width * scale
  const drawH = bitmap.height * scale
  const offsetX = (pageWidth - drawW) / 2
  const imgTop = margin + 24
  const canvas = document.createElement('canvas')
  canvas.width = bitmap.width
  canvas.height = bitmap.height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unsupported.')
  ctx.drawImage(bitmap, 0, 0)
  const imgData = canvas.toDataURL('image/png')
  const header = opts?.title ?? 'BioBank NN Builder diagram'
  pdf.text(header, margin, margin)
  pdf.addImage(imgData, 'PNG', offsetX, imgTop, drawW, drawH)
  const blob = pdf.output('blob')
  return blob as Blob
}
