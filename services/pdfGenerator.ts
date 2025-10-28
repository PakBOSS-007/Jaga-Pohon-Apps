
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import html2canvas from 'html2canvas';
import type { TreeData } from '../types';

export const generatePdfReport = async (trees: TreeData[], chartContainerSelector: string) => {
  const doc = new jsPDF();
  const pageHeight = doc.internal.pageSize.height || doc.internal.pageSize.getHeight();
  const pageWidth = doc.internal.pageSize.width || doc.internal.pageSize.getWidth();
  let yPos = 0; // Start at 0 for header background

  // Halaman 1: Header dan Judul Utama
  doc.setFillColor(240, 253, 244); // Tailwind green-50
  doc.rect(0, 0, pageWidth, 50, 'F'); // Latar belakang header
  
  yPos = 25;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(22);
  doc.setTextColor(22, 163, 74); // Tailwind green-600
  doc.text('Laporan Inventaris Pohon & Jasa Ekosistem', pageWidth / 2, yPos, { align: 'center' });
  
  yPos += 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Laporan dibuat pada: ${new Date().toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}`, pageWidth / 2, yPos, { align: 'center' });
  yPos = 60; // Posisi awal setelah header

  // Ringkasan Statistik
  const totalTrees = trees.length;
  const totalCO2 = trees.reduce((sum, tree) => sum + tree.carbon.co2Sequestrated, 0);
  const totalStormwater = trees.reduce((sum, tree) => sum + tree.ecosystemServices.stormwaterInterceptedLiters, 0);
  const totalPollution = trees.reduce((sum, tree) => sum + tree.ecosystemServices.airPollutionRemovedGrams, 0);
  const totalValue = trees.reduce((sum, tree) => sum + tree.ecosystemServices.annualMonetaryValue.total, 0);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(60);
  doc.text('Ringkasan Keseluruhan', 14, yPos);
  yPos += 8;

  autoTable(doc, {
    body: [
      ['Total Pohon Diinventaris', totalTrees.toString()],
      ['Total CO₂ Tersekap', `${(totalCO2 / 1000).toFixed(2)} ton/thn`],
      ['Total Air Hujan Dicegah', `${(totalStormwater / 1000).toFixed(2)} kL/thn`],
      ['Total Polutan Dihilangkan', `${(totalPollution / 1000).toFixed(2)} kg/thn`],
      ['Total Estimasi Nilai Tahunan', `Rp ${totalValue.toLocaleString('id-ID', { maximumFractionDigits: 0 })} /thn`],
    ],
    startY: yPos,
    theme: 'plain',
    styles: { fontSize: 11, cellPadding: 2, font: 'helvetica' },
    columnStyles: { 0: { fontStyle: 'bold' } },
  });

  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  // Grafik Distribusi Spesies
  const chartElement = document.querySelector(chartContainerSelector) as HTMLElement;
  if (chartElement && trees.length > 0) {
    try {
        const canvas = await html2canvas(chartElement, { backgroundColor: '#ffffff', scale: 2 });
        const imgData = canvas.toDataURL('image/png');
        const imgProps = doc.getImageProperties(imgData);
        const imgWidth = pageWidth - 28;
        const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

        if (yPos + imgHeight > pageHeight - 25) {
            doc.addPage();
            yPos = 20;
        }

        doc.setFont('helvetica', 'bold');
        doc.setFontSize(16);
        doc.setTextColor(60);
        doc.text('Distribusi Spesies', 14, yPos);
        yPos += 8;
        doc.addImage(imgData, 'PNG', 14, yPos, imgWidth, imgHeight);
        yPos += imgHeight + 15;
    } catch (e) {
        console.error("Gagal menangkap grafik untuk PDF:", e);
    }
  }

  // Tabel Data Rinci
  if (yPos > pageHeight - 40) {
      doc.addPage();
      yPos = 20;
  }
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(60);
  doc.text('Data Inventaris Rinci', 14, yPos);
  yPos += 8;

  const tableColumn = ["Spesies", "DBH (cm)", "CO₂ (kg)", "Air Hujan (L)", "Polusi (g)", "Nilai (Rp)"];
  const tableRows = trees.map(tree => [
    tree.species,
    tree.dbh,
    tree.carbon.co2Sequestrated.toFixed(2),
    tree.ecosystemServices.stormwaterInterceptedLiters.toFixed(0),
    tree.ecosystemServices.airPollutionRemovedGrams.toFixed(2),
    tree.ecosystemServices.annualMonetaryValue.total.toLocaleString('id-ID', { maximumFractionDigits: 0 }),
  ]);

  autoTable(doc, {
    head: [tableColumn],
    body: tableRows,
    startY: yPos,
    theme: 'grid',
    headStyles: { fillColor: [22, 163, 74], textColor: 255, font: 'helvetica', fontStyle: 'bold' },
    styles: { fontSize: 9, font: 'helvetica' },
    margin: { top: 30 } 
  });

  // Tambahkan Header dan Footer ke semua halaman
  const totalPages = (doc as any).internal.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(150);
    doc.text(`Halaman ${i} dari ${totalPages}`, pageWidth - 14, pageHeight - 10, { align: 'right' });

    if (i > 1) {
        doc.setFontSize(12);
        doc.setTextColor(60);
        doc.text('Laporan Inventaris Pohon & Jasa Ekosistem', 14, 15);
        doc.setLineWidth(0.2);
        doc.line(14, 18, pageWidth - 14, 18);
    }
  }

  doc.save('laporan_jasa_ekosistem_pohon.pdf');
};
