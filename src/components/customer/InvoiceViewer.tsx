import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Printer, Download, Loader2 } from 'lucide-react';
import { QRCodeSVG } from 'qrcode.react';
import { useBrandLogo } from '@/hooks/useBrandLogo';
import jsPDF from 'jspdf';

import { toast } from '@/hooks/use-toast';

interface InvoiceViewerProps {
  invoice: any | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const InvoiceViewer = ({ invoice, open, onOpenChange }: InvoiceViewerProps) => {
  const { logoUrl } = useBrandLogo();
  const [generating, setGenerating] = useState(false);
  if (!invoice) return null;

  const svgToPngDataUrl = (svg: SVGSVGElement, size = 240): Promise<string | null> =>
    new Promise((resolve) => {
      try {
        const xml = new XMLSerializer().serializeToString(svg);
        const url = 'data:image/svg+xml;base64,' + btoa(unescape(encodeURIComponent(xml)));
        const img = new Image();
        img.onload = () => {
          const c = document.createElement('canvas');
          c.width = size;
          c.height = size;
          const ctx = c.getContext('2d');
          if (!ctx) return resolve(null);
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          resolve(c.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = url;
      } catch {
        resolve(null);
      }
    });

  const handleDownloadPdf = async () => {
    setGenerating(true);
    try {
      const itemsList: any[] = Array.isArray(invoice.line_items) ? invoice.line_items : [];
      const money = (n: number) => Number(n || 0).toFixed(2);
      const cur = invoice.currency || 'SAR';
      const date = new Date(invoice.issue_date || invoice.created_at);

      const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const m = 14;
      let y = m;

      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(16);
      pdf.text(String(invoice.seller_name || 'Tejaraa'), m, y + 4);
      pdf.setFontSize(14);
      pdf.text('TAX INVOICE', pageWidth - m, y + 4, { align: 'right' });

      y += 10;
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      const sellerLines = pdf.splitTextToSize(
        `${invoice.seller_address || ''}\nCR: ${invoice.seller_cr_number || '-'}  |  VAT: ${invoice.seller_vat_number || '-'}`,
        (pageWidth - m * 2) * 0.55,
      );
      pdf.text(sellerLines, m, y);
      pdf.text(
        [
          `No: ${invoice.invoice_number || invoice.id || '-'}`,
          `Date: ${isNaN(date.getTime()) ? '-' : date.toLocaleDateString()}`,
          `Type: ${invoice.invoice_type || '-'}`,
        ],
        pageWidth - m,
        y,
        { align: 'right' },
      );
      y += Math.max(sellerLines.length * 4, 12) + 4;
      pdf.setDrawColor(20);
      pdf.setLineWidth(0.5);
      pdf.line(m, y, pageWidth - m, y);
      y += 8;

      // Parties
      const colW = (pageWidth - m * 2) / 2 - 4;
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(9);
      pdf.text('SELLER', m, y);
      pdf.text('BUYER', m + colW + 8, y);
      pdf.setFont('helvetica', 'normal');
      const sellerBlock = pdf.splitTextToSize(
        `${invoice.seller_name || ''}\n${invoice.seller_address || ''}\nVAT: ${invoice.seller_vat_number || '-'}`,
        colW,
      );
      const buyerBlock = pdf.splitTextToSize(
        `${invoice.buyer_name || ''}\n${invoice.buyer_address || ''}\n${invoice.buyer_vat_number ? 'VAT: ' + invoice.buyer_vat_number : ''}`.trim(),
        colW,
      );
      pdf.text(sellerBlock, m, y + 5);
      pdf.text(buyerBlock, m + colW + 8, y + 5);
      y += Math.max(sellerBlock.length, buyerBlock.length) * 4.2 + 10;

      // Table
      const cols = [
        { label: '#', x: m, w: 8, align: 'left' as const },
        { label: 'Description', x: m + 8, w: 74, align: 'left' as const },
        { label: 'Qty', x: m + 82, w: 14, align: 'right' as const },
        { label: 'Unit (excl)', x: m + 96, w: 26, align: 'right' as const },
        { label: 'VAT 15%', x: m + 122, w: 24, align: 'right' as const },
        { label: 'Total', x: m + 146, w: pageWidth - m * 2 - 146, align: 'right' as const },
      ];
      const drawHeader = () => {
        pdf.setFillColor(240, 242, 245);
        pdf.rect(m, y - 4.5, pageWidth - m * 2, 7, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(8.5);
        cols.forEach((c) =>
          pdf.text(c.label, c.align === 'right' ? c.x + c.w : c.x + 1, y, { align: c.align }),
        );
        pdf.setFont('helvetica', 'normal');
        y += 6;
      };
      drawHeader();

      itemsList.forEach((it, idx) => {
        const qty = Number(it.quantity || it.qty || 1);
        const unitInc = Number(it.price || it.unit_price || 0);
        const unitEx = unitInc / 1.15;
        const lineTotalInc = unitInc * qty;
        const lineVat = lineTotalInc - unitEx * qty;
        const nameRaw = `${it.name || it.product_name || 'Item'}${it.sku ? ` (${it.sku})` : ''}`;
        const nameLines = pdf.splitTextToSize(nameRaw, cols[1].w - 2);
        const rowH = Math.max(nameLines.length * 4, 6);

        if (y + rowH > pageHeight - m - 10) {
          pdf.addPage();
          y = m + 6;
          drawHeader();
        }

        pdf.setFontSize(8.5);
        pdf.text(String(idx + 1), cols[0].x + 1, y);
        pdf.text(nameLines, cols[1].x + 1, y);
        pdf.text(String(qty), cols[2].x + cols[2].w, y, { align: 'right' });
        pdf.text(money(unitEx), cols[3].x + cols[3].w, y, { align: 'right' });
        pdf.text(money(lineVat), cols[4].x + cols[4].w, y, { align: 'right' });
        pdf.text(money(lineTotalInc), cols[5].x + cols[5].w, y, { align: 'right' });
        y += rowH;
        pdf.setDrawColor(225);
        pdf.setLineWidth(0.1);
        pdf.line(m, y - 2.5, pageWidth - m, y - 2.5);
      });

      if (itemsList.length === 0) {
        pdf.setFontSize(9);
        pdf.text('No line items', m + 1, y);
        y += 6;
      }

      y += 6;
      if (y > pageHeight - 60) {
        pdf.addPage();
        y = m + 6;
      }

      // QR
      const svg = document.querySelector('#invoice-print svg') as SVGSVGElement | null;
      const qrData = svg ? await svgToPngDataUrl(svg) : null;
      const qrTop = y;
      if (qrData) {
        pdf.setFontSize(8);
        pdf.text('ZATCA QR', m, qrTop);
        pdf.addImage(qrData, 'PNG', m, qrTop + 2, 32, 32);
      }

      // Totals
      const tx = pageWidth - m;
      let ty = qrTop + 4;
      pdf.setFontSize(9.5);
      const totalRow = (label: string, value: string, bold = false) => {
        pdf.setFont('helvetica', bold ? 'bold' : 'normal');
        pdf.text(label, tx - 60, ty);
        pdf.text(value, tx, ty, { align: 'right' });
        ty += 6;
      };
      totalRow('Subtotal (excl VAT)', `${money(invoice.subtotal)} ${cur}`);
      totalRow(`VAT (${invoice.vat_rate ?? 15}%)`, `${money(invoice.vat_amount)} ${cur}`);
      pdf.setDrawColor(20);
      pdf.setLineWidth(0.4);
      pdf.line(tx - 60, ty - 4, tx, ty - 4);
      totalRow('Total', `${money(invoice.amount)} ${cur}`, true);
      pdf.setFontSize(8);
      totalRow('Payment Method', String(invoice.payment_method || '-'));
      totalRow('Status', String(invoice.status || '-'));

      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(7.5);
      pdf.setTextColor(120);
      pdf.text(
        'This is a ZATCA Phase 1 compliant tax invoice',
        pageWidth / 2,
        pageHeight - 10,
        { align: 'center' },
      );

      pdf.save(`Invoice-${invoice.invoice_number || invoice.id}.pdf`);
    } catch (err: any) {
      toast({ title: 'PDF failed', description: err?.message || 'Could not generate PDF', variant: 'destructive' });
    } finally {
      setGenerating(false);
    }
  };


  const handlePrint = () => {
    const el = document.getElementById('invoice-print');
    if (!el) return;
    const win = window.open('', '_blank', 'width=900,height=1000');
    if (!win) {
      toast({ title: 'Print blocked', description: 'Please allow pop-ups to print this invoice.', variant: 'destructive' });
      return;
    }
    const styles = Array.from(document.querySelectorAll('link[rel="stylesheet"], style'))
      .map(node => node.outerHTML)
      .join('\n');
    win.document.write(`<!doctype html><html><head><title>Invoice ${invoice.invoice_number || ''}</title>${styles}<style>
      @page { size: A4; margin: 12mm; }
      body { margin: 0; background: #fff; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    </style></head><body>${el.outerHTML}</body></html>`);
    win.document.close();
    const trigger = () => {
      win.focus();
      win.print();
      setTimeout(() => win.close(), 300);
    };
    if (win.document.readyState === 'complete') {
      setTimeout(trigger, 500);
    } else {
      win.addEventListener('load', () => setTimeout(trigger, 300));
    }
  };

  const items: any[] = Array.isArray(invoice.line_items) ? invoice.line_items : [];
  const fmt = (n: number) => Number(n || 0).toFixed(2);
  const issueDate = new Date(invoice.issue_date || invoice.created_at);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[95vw] max-w-4xl max-h-[90vh] overflow-y-auto p-0">
        <style>{`
          @media print {
            body * { visibility: hidden; }
            #invoice-print, #invoice-print * { visibility: visible; }
            #invoice-print { position: absolute; left: 0; top: 0; width: 100%; padding: 24px; }
            .no-print { display: none !important; }
          }
        `}</style>

        <DialogHeader className="px-4 sm:px-6 pt-4 sm:pt-6 pb-2 no-print flex-row items-start sm:items-center justify-between space-y-0 gap-3">
          <DialogTitle className="text-base">Tax Invoice</DialogTitle>
          <div className="flex flex-wrap items-center justify-end gap-2">
            <Badge variant="secondary" className="text-xs">ZATCA Phase 1</Badge>
            <Button size="sm" onClick={handleDownloadPdf} disabled={generating} className="h-8 px-2.5 text-xs">
              {generating ? <Loader2 className="h-4 w-4 sm:mr-1.5 animate-spin" /> : <Download className="h-4 w-4 sm:mr-1.5" />}
              <span className="hidden sm:inline">{generating ? 'Generating…' : 'Download PDF'}</span>
            </Button>
            <Button size="sm" variant="outline" onClick={handlePrint} className="h-8 px-2.5 text-xs">
              <Printer className="h-4 w-4 sm:mr-1.5" /> <span className="hidden sm:inline">Print</span>
            </Button>
          </div>
        </DialogHeader>

        <div id="invoice-print" className="px-4 py-4 sm:px-8 sm:py-6 bg-white text-slate-900">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 border-b-2 border-slate-900 pb-4 mb-6">
            <div className="min-w-0">
              {logoUrl ? (
                <img src={logoUrl} alt="Logo" className="h-10 sm:h-12 mb-2" />
              ) : (
                <h2 className="text-xl sm:text-2xl font-bold">{invoice.seller_name}</h2>
              )}
              <p className="text-xs text-slate-600 break-words">{invoice.seller_address}</p>
              <p className="text-xs text-slate-600 break-words">CR: {invoice.seller_cr_number} • VAT: {invoice.seller_vat_number}</p>
            </div>
            <div className="sm:text-right min-w-0">
              <h1 className="text-lg sm:text-xl font-bold">TAX INVOICE</h1>
              <p className="text-sm font-semibold" dir="rtl">فاتورة ضريبية</p>
              <p className="text-xs mt-2"><span className="font-semibold">No:</span> {invoice.invoice_number}</p>
              <p className="text-xs"><span className="font-semibold">Date:</span> {issueDate.toLocaleDateString()}</p>
              <p className="text-xs"><span className="font-semibold">Type:</span> {invoice.invoice_type}</p>
            </div>
          </div>

          {/* Parties */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 mb-6">
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Seller / البائع</p>
              <p className="text-sm font-bold break-words">{invoice.seller_name}</p>
              <p className="text-xs break-words">{invoice.seller_address}</p>
              <p className="text-xs break-words">VAT: {invoice.seller_vat_number}</p>
            </div>
            <div className="min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-1">Buyer / المشتري</p>
              <p className="text-sm font-bold break-words">{invoice.buyer_name}</p>
              {invoice.buyer_address && <p className="text-xs break-words">{invoice.buyer_address}</p>}
              {invoice.buyer_vat_number && <p className="text-xs break-words">VAT: {invoice.buyer_vat_number}</p>}
            </div>
          </div>

          {/* Line Items */}
          <div className="overflow-x-auto -mx-4 sm:mx-0 mb-6">
            <table className="min-w-full text-xs border border-slate-300">
              <thead className="bg-slate-100">
                <tr>
                  <th className="text-left px-2 py-2 border-b border-slate-300 whitespace-nowrap">#</th>
                  <th className="text-left px-2 py-2 border-b border-slate-300 whitespace-nowrap">Description / الوصف</th>
                  <th className="text-right px-2 py-2 border-b border-slate-300 whitespace-nowrap">Qty</th>
                  <th className="text-right px-2 py-2 border-b border-slate-300 whitespace-nowrap">Unit (excl)</th>
                  <th className="text-right px-2 py-2 border-b border-slate-300 whitespace-nowrap">VAT 15%</th>
                  <th className="text-right px-2 py-2 border-b border-slate-300 whitespace-nowrap">Total</th>
                </tr>
              </thead>
              <tbody>
                {items.length === 0 ? (
                  <tr><td colSpan={6} className="px-2 py-4 text-center text-slate-400">No line items</td></tr>
                ) : items.map((it, idx) => {
                  const qty = Number(it.quantity || it.qty || 1);
                  const unitInc = Number(it.price || it.unit_price || 0);
                  const unitEx = unitInc / 1.15;
                  const lineTotalInc = unitInc * qty;
                  const lineVat = lineTotalInc - (unitEx * qty);
                  return (
                    <tr key={idx} className="border-b border-slate-200">
                      <td className="px-2 py-1.5 whitespace-nowrap">{idx + 1}</td>
                      <td className="px-2 py-1.5 min-w-[160px] max-w-[260px] break-words">{it.name || it.product_name || 'Item'}{it.sku ? ` (${it.sku})` : ''}</td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap">{qty}</td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap">{fmt(unitEx)}</td>
                      <td className="px-2 py-1.5 text-right whitespace-nowrap">{fmt(lineVat)}</td>
                      <td className="px-2 py-1.5 text-right font-semibold whitespace-nowrap">{fmt(lineTotalInc)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Totals + QR */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6 items-start sm:items-end">
            <div className="flex flex-col items-start min-w-0">
              <p className="text-[10px] uppercase tracking-wider font-semibold text-slate-500 mb-2">ZATCA QR / رمز الاستجابة</p>
              {invoice.qr_code ? (
                <div className="p-2 bg-white border border-slate-300 rounded">
                  <QRCodeSVG value={invoice.qr_code} size={100} level="M" className="sm:w-[120px] sm:h-[120px]" />
                </div>
              ) : (
                <div className="text-xs text-slate-400">QR not available</div>
              )}
            </div>
            <div className="space-y-1.5 text-sm min-w-0">
              <div className="flex justify-between gap-2"><span>Subtotal (excl VAT)</span><span className="font-mono whitespace-nowrap">{fmt(invoice.subtotal)} {invoice.currency}</span></div>
              <div className="flex justify-between gap-2"><span>VAT ({invoice.vat_rate}%)</span><span className="font-mono whitespace-nowrap">{fmt(invoice.vat_amount)} {invoice.currency}</span></div>
              <div className="flex justify-between gap-2 border-t-2 border-slate-900 pt-2 text-base font-bold"><span>Total</span><span className="font-mono whitespace-nowrap">{fmt(invoice.amount)} {invoice.currency}</span></div>
              <div className="flex justify-between gap-2 text-xs text-slate-500 pt-2"><span>Payment Method</span><span className="capitalize whitespace-nowrap">{invoice.payment_method}</span></div>
              <div className="flex justify-between gap-2 text-xs"><span>Status</span><Badge variant={invoice.status === 'paid' ? 'default' : 'secondary'} className="text-[10px] capitalize">{invoice.status}</Badge></div>
            </div>
          </div>

          <div className="mt-6 sm:mt-8 pt-4 border-t border-slate-200 text-center text-[10px] text-slate-500">
            <p className="break-words">This is a ZATCA Phase 1 compliant tax invoice • هذه فاتورة ضريبية متوافقة مع المرحلة الأولى من زاتكا</p>
            <p className="break-words mt-1">Generated electronically by {invoice.seller_name} • {issueDate.toISOString()}</p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
