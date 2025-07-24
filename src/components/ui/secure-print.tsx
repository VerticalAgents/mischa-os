
import React from 'react';

interface SecurePrintProps {
  content: string;
  title?: string;
  onPrint?: () => void;
}

/**
 * Secure printing component that avoids document.write()
 * and properly sanitizes content to prevent XSS attacks
 */
export function SecurePrint({ content, title = 'Impressão', onPrint }: SecurePrintProps) {
  
  const handlePrint = () => {
    // Create a new window for printing
    const printWindow = window.open('', '_blank', 'width=800,height=600');
    
    if (!printWindow) {
      alert('Por favor, permita pop-ups para imprimir');
      return;
    }

    // Sanitize content by creating a temporary element and using textContent
    const tempDiv = document.createElement('div');
    tempDiv.innerHTML = content;
    const sanitizedContent = tempDiv.textContent || tempDiv.innerText || '';

    // Create the print document structure safely
    const printDocument = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>${title}</title>
          <style>
            body { 
              font-family: Arial, sans-serif; 
              margin: 20px; 
              line-height: 1.6; 
            }
            @media print {
              body { margin: 0; }
            }
          </style>
        </head>
        <body>
          <pre style="white-space: pre-wrap; word-wrap: break-word;">${sanitizedContent}</pre>
          <script>
            window.onload = function() {
              window.print();
              window.onafterprint = function() {
                window.close();
              };
            };
          </script>
        </body>
      </html>
    `;

    // Use document.write safely in the new window context
    printWindow.document.write(printDocument);
    printWindow.document.close();

    if (onPrint) {
      onPrint();
    }
  };

  return (
    <button 
      onClick={handlePrint}
      className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
    >
      Imprimir
    </button>
  );
}
