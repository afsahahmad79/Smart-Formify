/**
 * Utility function to copy text to clipboard with fallback support
 * @param text - The text to copy to clipboard
 * @returns Promise that resolves to true if successful, false otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  // Check if clipboard API is available
  if (navigator.clipboard && window.isSecureContext) {
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy using clipboard API:', err)
      // Fall through to fallback method
    }
  }

  // Fallback method for browsers that don't support clipboard API
  try {
    const textArea = document.createElement('textarea')
    textArea.value = text
    textArea.style.position = 'fixed'
    textArea.style.left = '-999999px'
    textArea.style.top = '-999999px'
    document.body.appendChild(textArea)
    textArea.focus()
    textArea.select()
    
    const successful = document.execCommand('copy')
    document.body.removeChild(textArea)
    
    if (!successful) {
      throw new Error('execCommand copy failed')
    }
    
    return true
  } catch (err) {
    console.error('Failed to copy using fallback method:', err)
    return false
  }
}

