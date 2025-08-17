'use client';

import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/Button';
import { PrinterIcon, DocumentArrowDownIcon } from '@heroicons/react/24/outline';
import { format } from 'date-fns';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import QRCode from 'qrcode';

interface ReceiptProps {
  paymentData: any;
  feeItems?: any[];
  institutionData?: {
    name: string;
    logo?: string;
    address?: string;
    phone?: string;
    email?: string;
  };
}

export function Receipt({ paymentData, feeItems = [], institutionData }: ReceiptProps) {
  const receiptRef = useRef<HTMLDivElement>(null);
  const [generatingPDF, setGeneratingPDF] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  useEffect(() => {
    generateQRCode();
  }, [paymentData]);

  const generateQRCode = async () => {
    try {
      const qrData = JSON.stringify({
        receipt_number: paymentData.receipt_number,
        student_id: paymentData.student_id,
        amount: paymentData.paid_amount,
        date: paymentData.payment_date,
        institution_id: paymentData.institution_id
      });
      
      const qrCodeDataUrl = await QRCode.toDataURL(qrData, {
        width: 100,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });
      setQrCodeDataUrl(qrCodeDataUrl);
    } catch (error) {
      console.error('Error generating QR code:', error);
    }
  };

  const generatePDF = async () => {
    if (!receiptRef.current) return;
    
    setGeneratingPDF(true);
    try {
      // Method 1: Using html2canvas for exact visual representation
      const canvas = await html2canvas(receiptRef.current, {
        scale: 2,
        useCORS: true,
        allowTaint: true,
        backgroundColor: '#ffffff'
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const imgWidth = 210; // A4 width in mm
      const pageHeight = 295; // A4 height in mm
      const imgHeight = (canvas.height * imgWidth) / canvas.width;
      let heightLeft = imgHeight;

      let position = 0;

      pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
      heightLeft -= pageHeight;

      while (heightLeft >= 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
        heightLeft -= pageHeight;
      }

      pdf.save(`receipt-${paymentData.receipt_number}.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      // Fallback to programmatic PDF generation
      generateProgrammaticPDF();
    } finally {
      setGeneratingPDF(false);
    }
  };

  const generateProgrammaticPDF = () => {
    const doc = new jsPDF('p', 'mm', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 20;
    let yPos = margin;

    // Set up fonts
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(24);
    
    // Header
    doc.text('FEE RECEIPT', pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Receipt number and date
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`Receipt #${paymentData.receipt_number}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.text(`Date: ${format(new Date(paymentData.payment_date), 'PPP')}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 15;

    // Institution info (if available)
    if (institutionData?.name) {
      doc.setFontSize(14);
      doc.setFont('helvetica', 'bold');
      doc.text(institutionData.name, margin, yPos);
      yPos += 8;
      
      if (institutionData.address) {
        doc.setFontSize(10);
        doc.setFont('helvetica', 'normal');
        doc.text(institutionData.address, margin, yPos);
        yPos += 6;
      }
      
      if (institutionData.phone || institutionData.email) {
        const contactInfo = [];
        if (institutionData.phone) contactInfo.push(`Phone: ${institutionData.phone}`);
        if (institutionData.email) contactInfo.push(`Email: ${institutionData.email}`);
        doc.text(contactInfo.join(' | '), margin, yPos);
        yPos += 10;
      }
    }

    // Student Information
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Student Information', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text(`Name: ${paymentData.student_name}`, margin, yPos);
    yPos += 6;
    doc.text(`Admission Number: ${paymentData.student_admission}`, margin, yPos);
    yPos += 6;
    doc.text(`Class: ${paymentData.student_class}`, margin, yPos);
    yPos += 6;
    doc.text(`Payment Method: ${getPaymentMethodDisplay(paymentData.payment_method)}`, margin, yPos);
    yPos += 10;

    // Fee Items Table
    doc.setFontSize(14);
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Details', margin, yPos);
    yPos += 8;

    // Table header
    const tableStartX = margin;
    const itemColWidth = 80;
    const planColWidth = 60;
    const amountColWidth = 30;
    
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.text('Fee Item', tableStartX, yPos);
    doc.text('Plan', tableStartX + itemColWidth, yPos);
    doc.text('Amount', tableStartX + itemColWidth + planColWidth, yPos, { align: 'right' });
    yPos += 6;

    // Table content
    doc.setFont('helvetica', 'normal');
    feeItems.forEach((item) => {
      if (yPos > pageHeight - 60) {
        doc.addPage();
        yPos = margin;
      }
      
      doc.text(item.fee_item_name, tableStartX, yPos);
      doc.text(item.fee_plan_name, tableStartX + itemColWidth, yPos);
      doc.text(formatCurrency(item.paid_amount), tableStartX + itemColWidth + planColWidth, yPos, { align: 'right' });
      yPos += 6;
    });

    yPos += 5;

    // Payment Summary
    if (yPos > pageHeight - 80) {
      doc.addPage();
      yPos = margin;
    }

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Payment Summary', margin, yPos);
    yPos += 8;

    doc.setFontSize(10);
    doc.setFont('helvetica', 'normal');
    doc.text('Total Amount:', pageWidth - margin - 40, yPos, { align: 'right' });
    doc.text(formatCurrency(paymentData.total_amount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 6;

    if (paymentData.discount_amount > 0) {
      doc.setTextColor(0, 128, 0); // Green color for discount
      doc.text('Discount:', pageWidth - margin - 40, yPos, { align: 'right' });
      doc.text(`-${formatCurrency(paymentData.discount_amount)}`, pageWidth - margin, yPos, { align: 'right' });
      yPos += 6;
      doc.setTextColor(0, 0, 0); // Reset to black
    }

    doc.setFont('helvetica', 'bold');
    doc.text('Amount Paid:', pageWidth - margin - 40, yPos, { align: 'right' });
    doc.text(formatCurrency(paymentData.paid_amount), pageWidth - margin, yPos, { align: 'right' });
    yPos += 10;

    // Additional Information
    if (paymentData.reference_number || paymentData.notes || paymentData.discount_reason) {
      if (yPos > pageHeight - 100) {
        doc.addPage();
        yPos = margin;
      }

      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('Additional Information', margin, yPos);
      yPos += 8;

      doc.setFontSize(10);
      doc.setFont('helvetica', 'normal');
      
      if (paymentData.reference_number) {
        doc.text(`Reference Number: ${paymentData.reference_number}`, margin, yPos);
        yPos += 6;
      }
      
      if (paymentData.discount_reason) {
        doc.text(`Discount Reason: ${paymentData.discount_reason}`, margin, yPos);
        yPos += 6;
      }
      
      if (paymentData.notes) {
        doc.text(`Notes: ${paymentData.notes}`, margin, yPos);
        yPos += 6;
      }
    }

    // Footer
    if (yPos > pageHeight - 60) {
      doc.addPage();
      yPos = margin;
    }

    // QR Code (if available)
    if (qrCodeDataUrl) {
      try {
        doc.addImage(qrCodeDataUrl, 'PNG', pageWidth - margin - 30, yPos, 25, 25);
      } catch (error) {
        console.error('Error adding QR code to PDF:', error);
      }
    }

    // Footer text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(`Generated on: ${format(new Date(), 'PPP')}`, margin, pageHeight - 20);
    doc.text(`Status: ${paymentData.payment_status}`, pageWidth - margin, pageHeight - 20, { align: 'right' });
    
    doc.text('This is a computer generated receipt and does not require a signature.', pageWidth / 2, pageHeight - 15, { align: 'center' });
    doc.text('Thank you for your payment!', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`receipt-${paymentData.receipt_number}.pdf`);
  };

  const downloadPDF = async () => {
    await generatePDF();
  };

  const printReceipt = () => {
    window.print();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getPaymentMethodDisplay = (method: string) => {
    const methods: { [key: string]: string } = {
      'cash': 'Cash',
      'card': 'Card',
      'upi': 'UPI',
      'cheque': 'Cheque',
      'bank_transfer': 'Bank Transfer'
    };
    return methods[method] || method.toUpperCase();
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Receipt Actions */}
      <div className="mb-6 flex justify-end space-x-3 print:hidden">
        <Button 
          onClick={downloadPDF} 
          disabled={generatingPDF}
          className="flex items-center"
        >
          {generatingPDF ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Generating...
            </>
          ) : (
            <>
              <DocumentArrowDownIcon className="h-4 w-4 mr-2" />
              Download PDF
            </>
          )}
        </Button>
        <Button variant="outline" onClick={printReceipt}>
          <PrinterIcon className="h-4 w-4 mr-2" />
          Print Receipt
        </Button>
      </div>

      {/* Receipt Content */}
      <div 
        ref={receiptRef}
        className="bg-white border border-gray-200 rounded-lg shadow-sm p-8 max-w-2xl mx-auto print:shadow-none print:border-none"
      >
        {/* Header */}
        <div className="text-center border-b border-gray-200 pb-6 mb-6">
          {institutionData?.logo && (
            <div className="mb-4">
              <img 
                src={institutionData.logo} 
                alt="Institution Logo" 
                className="h-16 mx-auto"
              />
            </div>
          )}
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            FEE RECEIPT
          </h1>
          <p className="text-gray-600">
            Receipt #{paymentData.receipt_number}
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Date: {format(new Date(paymentData.payment_date), 'PPP')}
          </p>
        </div>

        {/* Institution Information */}
        {institutionData?.name && (
          <div className="mb-6 text-center">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">{institutionData.name}</h2>
            {institutionData.address && (
              <p className="text-sm text-gray-600 mb-1">{institutionData.address}</p>
            )}
            {(institutionData.phone || institutionData.email) && (
              <p className="text-sm text-gray-600">
                {institutionData.phone && `Phone: ${institutionData.phone}`}
                {institutionData.phone && institutionData.email && ' | '}
                {institutionData.email && `Email: ${institutionData.email}`}
              </p>
            )}
          </div>
        )}

        {/* Student Information */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Student Information</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Student Name</p>
              <p className="font-medium">{paymentData.student_name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Admission Number</p>
              <p className="font-medium">{paymentData.student_admission}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Class</p>
              <p className="font-medium">{paymentData.student_class}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Payment Method</p>
              <p className="font-medium">{getPaymentMethodDisplay(paymentData.payment_method)}</p>
            </div>
          </div>
        </div>

        {/* Fee Items */}
        <div className="mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Fee Details</h2>
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Fee Item</th>
                  <th className="px-4 py-3 text-left text-sm font-medium text-gray-900">Plan</th>
                  <th className="px-4 py-3 text-right text-sm font-medium text-gray-900">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {feeItems.map((item, index) => (
                  <tr key={index}>
                    <td className="px-4 py-3 text-sm text-gray-900">{item.fee_item_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-600">{item.fee_plan_name}</td>
                    <td className="px-4 py-3 text-sm text-gray-900 text-right">
                      {formatCurrency(item.paid_amount)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Payment Summary */}
        <div className="mb-6">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Total Amount:</span>
                <span className="font-medium">{formatCurrency(paymentData.total_amount)}</span>
              </div>
              {paymentData.discount_amount > 0 && (
                <div className="flex justify-between text-green-600">
                  <span>Discount:</span>
                  <span>-{formatCurrency(paymentData.discount_amount)}</span>
                </div>
              )}
              <div className="border-t border-gray-200 pt-2">
                <div className="flex justify-between text-lg font-semibold">
                  <span>Amount Paid:</span>
                  <span>{formatCurrency(paymentData.paid_amount)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Additional Information */}
        {(paymentData.reference_number || paymentData.notes || paymentData.discount_reason) && (
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">Additional Information</h2>
            <div className="space-y-3">
              {paymentData.reference_number && (
                <div>
                  <p className="text-sm text-gray-600">Reference Number</p>
                  <p className="font-medium">{paymentData.reference_number}</p>
                </div>
              )}
              {paymentData.discount_reason && (
                <div>
                  <p className="text-sm text-gray-600">Discount Reason</p>
                  <p className="font-medium">{paymentData.discount_reason}</p>
                </div>
              )}
              {paymentData.notes && (
                <div>
                  <p className="text-sm text-gray-600">Notes</p>
                  <p className="font-medium">{paymentData.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Footer */}
        <div className="border-t border-gray-200 pt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-sm text-gray-600">Generated On</p>
              <p className="font-medium">{format(new Date(), 'PPP')}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-gray-600">Status</p>
              <p className="font-medium capitalize">{paymentData.payment_status}</p>
            </div>
          </div>
          
          {/* QR Code */}
          {qrCodeDataUrl && (
            <div className="mt-6 text-center">
              <img 
                src={qrCodeDataUrl} 
                alt="Receipt QR Code" 
                className="mx-auto h-20 w-20"
              />
              <p className="text-xs text-gray-500 mt-2">Scan for digital verification</p>
            </div>
          )}
          
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-500">
              This is a computer generated receipt and does not require a signature.
            </p>
            <p className="text-xs text-gray-400 mt-2">
              Thank you for your payment!
            </p>
          </div>
        </div>
      </div>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          @page {
            margin: 1in;
            size: A4;
          }
          
          body {
            -webkit-print-color-adjust: exact;
            color-adjust: exact;
          }
          
          .print\\:hidden {
            display: none !important;
          }
          
          .print\\:shadow-none {
            box-shadow: none !important;
          }
          
          .print\\:border-none {
            border: none !important;
          }
        }
      `}</style>
    </div>
  );
}
