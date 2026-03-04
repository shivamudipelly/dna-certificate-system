import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import { toast } from 'react-hot-toast';

export const generateAndDownloadPDF = async (elementId: string, filename: string) => {
    const element = document.getElementById(elementId);
    if (!element) {
        toast.error('Could not find the certificate element.');
        return;
    }

    const toastId = toast.loading('Generating high-quality PDF...');

    try {
        // High scale for crisp text and QR code
        const canvas = await html2canvas(element, {
            scale: 3,
            useCORS: true,
            logging: false,
            backgroundColor: '#ffffff'
        });

        const imgData = canvas.toDataURL('image/png');

        // A4 paper dimensions in mm (Portrait)
        const pdf = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });

        const pdfWidth = pdf.internal.pageSize.getWidth();
        const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

        pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
        pdf.save(`${filename}.pdf`);

        toast.success('PDF downloaded successfully!', { id: toastId });
    } catch (error) {
        console.error('PDF Generation Error:', error);
        toast.error('Failed to generate PDF.', { id: toastId });
    }
};
