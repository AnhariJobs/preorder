// app.js

// Fungsi kalkulasi PPN
function calculateTax() {
  const hargaBarang = document.getElementById("hargaBarang").value;
  if (hargaBarang) {
    const hasilPajak = (hargaBarang / 1.11).toFixed(2);  // Formula: harga / 1.11
    document.getElementById("hasilPajak").textContent = `Hasil PPN: Rp. ${formatCurrency(hasilPajak)}`;
  } else {
    document.getElementById("hasilPajak").textContent = "Hasil PPN: Rp. 0,00";
  }
}

// Fungsi untuk format nilai mata uang
function formatCurrency(value) {
  return parseFloat(value).toLocaleString('id-ID', {
    style: 'currency',
    currency: 'IDR'
  });
}

// Menangani form input data PreOrder
document.getElementById('preOrderForm').addEventListener('submit', (e) => {
  e.preventDefault();
  
  const formData = {
    periode: document.getElementById('periode').value,
    namaPT: document.getElementById('namaPT').value,
    supplier: document.getElementById('supplier').value,
    preOrder: document.getElementById('preOrder').value,
    invoice: document.getElementById('invoice').value,
    tglInvoice: document.getElementById('tglInvoice').value,
    total: document.getElementById('total').value,
    keterangan: document.getElementById('keterangan').value,
    faktur: document.getElementById('faktur').value
  };
  
  addDoc(preOrderCollection, formData).then(() => {
    document.getElementById('preOrderForm').reset();
  });
});

// Fungsi ekspor ke Excel
document.getElementById('exportExcel').addEventListener('click', () => {
  const data = getTableData();
  const worksheet = XLSX.utils.aoa_to_sheet([["Nomor", "Periode", "Nama PT", "Supplier", "Total"], ...data]);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Data PreOrder");
  XLSX.writeFile(workbook, "PreOrderData.xlsx");
});

// Fungsi ekspor ke Word
document.getElementById('exportWord').addEventListener('click', () => {
  const data = getTableData();
  let docContent = `<h1>Data PreOrder</h1><table border="1" style="width: 100%; border-collapse: collapse;">`;
  docContent += "<tr><th>Nomor</th><th>Periode</th><th>Nama PT</th><th>Supplier</th><th>Total</th></tr>";

  data.forEach(row => {
    docContent += `<tr>${row.map(cell => `<td>${cell}</td>`).join("")}</tr>`;
  });

  docContent += "</table>";

  const blob = new Blob(['\ufeff', docContent], { type: 'application/msword' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'PreOrderData.doc';
  link.click();
});

// Fungsi ekspor ke PDF
document.getElementById('exportPDF').addEventListener('
