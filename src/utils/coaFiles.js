const IMAGE_PATTERN = /\.(jpe?g|png|webp|avif|gif)(\?.*)?$/i

export function isImageDocument(url) {
  return IMAGE_PATTERN.test(String(url || ''))
}

/** Hides the browser's PDF chrome so the certificate reads like a plain page. */
export function pdfViewerUrl(url) {
  return `${url}#toolbar=0&navpanes=0&scrollbar=0&statusbar=0&view=FitH`
}
