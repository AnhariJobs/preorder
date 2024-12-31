// Import Firebase SDK
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, updateDoc, deleteDoc, doc, query, onSnapshot, serverTimestamp, orderBy, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-analytics.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBoOpKPh1mBAG5ConIohxqT4SMtFwW6Nq8",
    authDomain: "tanda-terima-preorder-8c4d3.firebaseapp.com",
    projectId: "tanda-terima-preorder-8c4d3",
    storageBucket: "tanda-terima-preorder-8c4d3.firebasestorage.app",
    messagingSenderId: "118639827128",
    appId: "1:118639827128:web:0567bd329c9fd38cf9fc4d",
    measurementId: "G-XV8ZERFB1N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
const db = getFirestore(app);

// References to DOM Elements
const preOrderForm = document.getElementById('preOrderForm');
const submitBtn = document.getElementById('submitBtn');
const hargaBarangInput = document.getElementById('hargaBarang');
const hasilPajakDiv = document.getElementById('hasilPajak');
const preOrderTableBody = document.getElementById('preOrderTbody');
const exportExcelBtn = document.getElementById('exportExcel');
const exportWordBtn = document.getElementById('exportWord');
const exportPDFBtn = document.getElementById('exportPDF');
const searchNamaPT = document.getElementById('searchNamaPT');
const searchPeriode = document.getElementById('searchPeriode');
const clearFiltersBtn = document.getElementById('clearFilters');

// Pagination Elements
const prevPageBtn = document.getElementById('prevPage');
const nextPageBtn = document.getElementById('nextPage');
const currentPageSpan = document.getElementById('currentPage');

// Modal Elements
const editModal = document.getElementById('editModal');
const editForm = document.getElementById('editForm');
const cancelEditBtn = document.getElementById('cancelEdit');

// Notification Elements
const notification = document.getElementById('notification');
const notificationMessage = document.getElementById('notificationMessage');
const closeNotificationBtn = document.getElementById('closeNotification');

// Current Editing Document ID and Original Data
let currentEditId = null;
let originalEditData = null;

// Data Storage
let allData = []; // All fetched data
let filteredData = []; // Data after filtering
let currentPage = 1;
const rowsPerPage = 10;

// Function to format number to Rupiah with '.' as thousand separator and ',' as decimal separator
function formatRupiah(value, withDecimal = false) {
    let number = Number(value);
    if (isNaN(number)) return 'Rp.0' + (withDecimal ? ',00' : '');
    if (withDecimal) {
        return 'Rp.' + number.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        return 'Rp.' + number.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
}

// Auto-calculate PPN when 'hargaBarang' changes
hargaBarangInput.addEventListener('input', calculateTax);

// Function to calculate PPN
function calculateTax() {
    const hargaBarang = Number(hargaBarangInput.value);
    if (!isNaN(hargaBarang) && hargaBarang > 0) {
        const hasilPajak = (hargaBarang / 1.11).toFixed(2); // Formula: harga / 1.11
        hasilPajakDiv.innerHTML = `Hasil PPN: <span class="text-teal-600">${formatRupiah(hasilPajak, true)}</span>`;
    } else {
        hasilPajakDiv.innerHTML = "Hasil PPN: <span class='text-teal-600'>Rp.0,00</span>";
    }
}

// Function to show notification
function showNotification(message, type = 'success') {
    notificationMessage.textContent = message;
    if (type === 'success') {
        notification.firstElementChild.classList.remove('bg-red-500');
        notification.firstElementChild.classList.add('bg-green-500');
    } else if (type === 'error') {
        notification.firstElementChild.classList.remove('bg-green-500');
        notification.firstElementChild.classList.add('bg-red-500');
    }
    notification.classList.remove('hidden');
    // Restart the timeout if the notification is already visible
    clearTimeout(notification.timeout);
    notification.timeout = setTimeout(() => {
        notification.classList.add('hidden');
    }, 3000);
}

// Close notification manually
closeNotificationBtn.addEventListener('click', () => {
    notification.classList.add('hidden');
});

// Function to clear form
function clearForm() {
    preOrderForm.reset();
    hasilPajakDiv.innerHTML = "Hasil PPN: <span class='text-teal-600'>Rp.0,00</span>";
}

// Function to add data to Firestore
submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    const periode = preOrderForm.periode.value;
    const namaPT = preOrderForm.namaPT.value.trim();
    const supplier = preOrderForm.supplier.value.trim();
    const preOrder = preOrderForm.preOrder.value.trim();
    const invoice = preOrderForm.invoice.value.trim();
    const tglInvoice = preOrderForm.tglInvoice.value;
    const total = Number(preOrderForm.total.value);
    const keterangan = preOrderForm.keterangan.value.trim();
    const faktur = preOrderForm.faktur.value.trim();
    const tanggalInput = serverTimestamp();

    // Validasi di JavaScript untuk memastikan semua field terisi
    if (!periode || !namaPT || !supplier || !preOrder || !invoice || !tglInvoice || isNaN(total) || total < 0 || !keterangan || !faktur) {
        showNotification('Silakan isi semua field dengan benar sebelum menyimpan data.', 'error');
        return;
    }

    try {
        await addDoc(collection(db, "preOrderData"), {
            periode,
            namaPT,
            supplier,
            preOrder,
            invoice,
            tglInvoice,
            total,
            keterangan,
            faktur,
            tanggalInput
        });
        clearForm();
        showNotification('Data berhasil disimpan.', 'success');
    } catch (error) {
        console.error("Error adding document: ", error);
        showNotification('Gagal menyimpan data.', 'error');
    }
});

// Function to fetch and listen to data with real-time updates
function fetchData() {
    const q = query(collection(db, "preOrderData"), orderBy("tanggalInput", "desc"));
    onSnapshot(q, (snapshot) => {
        allData = [];
        snapshot.forEach((doc) => {
            allData.push({ id: doc.id, ...doc.data() });
        });
        applyFilters();
    });
}

// Function to render table based on current page
function renderTable() {
    preOrderTableBody.innerHTML = "";
    const start = (currentPage - 1) * rowsPerPage;
    const end = start + rowsPerPage;
    const pageData = filteredData.slice(start, end);
    let nomor = start + 1;

    pageData.forEach((data) => {
        const tr = document.createElement('tr');
        tr.classList.add('hover:bg-teal-50', 'transition-all');
        tr.innerHTML = `
            <td class="py-4 px-6 border-b">${nomor}</td>
            <td class="py-4 px-6 border-b">${data.periode}</td>
            <td class="py-4 px-6 border-b">${data.namaPT}</td>
            <td class="py-4 px-6 border-b">${data.supplier}</td>
            <td class="py-4 px-6 border-b">${data.preOrder}</td>
            <td class="py-4 px-6 border-b">${data.invoice}</td>
            <td class="py-4 px-6 border-b">${data.tglInvoice}</td>
            <td class="py-4 px-6 border-b">${formatRupiah(data.total.toString(), true)}</td>
            <td class="py-4 px-6 border-b">${data.keterangan || '-'}</td>
            <td class="py-4 px-6 border-b">${data.faktur || '-'}</td>
            <td class="py-4 px-6 border-b flex gap-3">
                <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 transition-all transform hover:scale-105 px-3 py-1 rounded">Edit</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 transition-all transform hover:scale-105 px-3 py-1 rounded">Hapus</button>
            </td>
        `;
        preOrderTableBody.appendChild(tr);
        nomor++;
    });

    // Update pagination buttons
    currentPageSpan.textContent = `Halaman ${currentPage}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === Math.ceil(filteredData.length / rowsPerPage);

    // Style disabled buttons
    if (prevPageBtn.disabled) {
        prevPageBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        prevPageBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    if (nextPageBtn.disabled) {
        nextPageBtn.classList.add('opacity-50', 'cursor-not-allowed');
    } else {
        nextPageBtn.classList.remove('opacity-50', 'cursor-not-allowed');
    }

    // Attach event listeners to Edit and Delete buttons
    const editButtons = document.querySelectorAll('.edit-btn');
    const deleteButtons = document.querySelectorAll('.delete-btn');

    editButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const data = pageData[index];
            openEditModal(data.id, data);
        });
    });

    deleteButtons.forEach((button, index) => {
        button.addEventListener('click', () => {
            const data = pageData[index];
            deleteData(data.id);
        });
    });
}

// Pagination Controls
prevPageBtn.addEventListener('click', () => {
    if (currentPage > 1) {
        currentPage--;
        renderTable();
    }
});

nextPageBtn.addEventListener('click', () => {
    if (currentPage < Math.ceil(filteredData.length / rowsPerPage)) {
        currentPage++;
        renderTable();
    }
});

// Function to apply filters
function applyFilters() {
    const namaPT = searchNamaPT.value.trim().toLowerCase();
    const periode = searchPeriode.value;

    filteredData = allData.filter((data) => {
        const matchesNamaPT = namaPT ? data.namaPT.toLowerCase().includes(namaPT) : true;
        const matchesPeriode = periode ? data.periode === periode : true;
        return matchesNamaPT && matchesPeriode;
    });

    currentPage = 1;
    renderTable();
}

// Function to clear filters
clearFiltersBtn.addEventListener('click', () => {
    searchNamaPT.value = '';
    searchPeriode.value = '';
    applyFilters();
    showNotification('Filter telah dihapus.', 'success');
});

// Export to Excel (.xlsx) menggunakan ExcelJS
exportExcelBtn.addEventListener('click', async () => {
    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PreOrderData');

        // Definisikan kolom dengan header dan lebar sesuai print-excel.html
        worksheet.columns = [
            { header: 'No', key: 'no', width: 5 },
            { header: 'Periode', key: 'periode', width: 10 },
            { header: 'PT', key: 'pt', width: 20 },
            { header: 'Supplier', key: 'supplier', width: 25 },
            { header: 'No. Po', key: 'po', width: 25 },
            { header: 'No. Inv', key: 'inv', width: 20 },
            { header: 'Tgl Inv', key: 'tglInv', width: 15 },
            { header: 'Total (Rp)', key: 'total', width: 15 },
            { header: 'KET', key: 'ket', width: 15 },
            { header: 'FP', key: 'fp', width: 20 },
        ];

        // Tambahkan header style
        const headerRow = worksheet.getRow(1);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center' };
        // Tambahkan border pada header
        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thin' },
                left: { style: 'thin' },
                bottom: { style: 'thin' },
                right: { style: 'thin' }
            };
        });

        // Mengelompokkan data berdasarkan supplier
        const groupedData = {};
        filteredData.forEach((data) => {
            if (!groupedData[data.supplier]) {
                groupedData[data.supplier] = [];
            }
            groupedData[data.supplier].push(data);
        });

        let serialNo = 1;
        let grandTotal = 0;

        // Iterasi melalui setiap grup supplier
        for (const [supplier, dataGroup] of Object.entries(groupedData)) {
            let subtotal = 0;

            dataGroup.forEach((data) => {
                const row = worksheet.addRow({
                    no: serialNo++,
                    periode: formatPeriode(data.periode),
                    pt: data.namaPT,
                    supplier: data.supplier,
                    po: data.preOrder,
                    inv: data.invoice,
                    tglInv: formatTanggal(data.tglInvoice),
                    total: Number(data.total),
                    ket: data.keterangan || '',
                    fp: data.faktur || ''
                });
            });

            // Hitung subtotal setelah menambahkan semua data untuk supplier ini
            subtotal = dataGroup.reduce((acc, curr) => acc + curr.total, 0);

            // Tambahkan baris subtotal per supplier (hanya di kolom 'Total (Rp)')
            const subtotalRow = worksheet.addRow({
                no: '',
                periode: '',
                pt: '',
                supplier: '',
                po: '',
                inv: '',
                tglInv: '',
                total: subtotal,
                ket: '',
                fp: ''
            });
            subtotalRow.font = { bold: true };
            subtotalRow.getCell('total').numFmt = '#,##0';
            subtotalRow.getCell('total').alignment = { horizontal: 'right' };

            // Tambahkan border bawah pada cell 'total' untuk subtotal
            subtotalRow.getCell('total').border = {
                bottom: { style: 'thin' }
            };

            grandTotal += subtotal;
        }

        // Tambahkan beberapa baris kosong sebelum footer
        worksheet.addRow({});
        worksheet.addRow({});

        // Tambahkan tanggal di kolom 'FP'
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth()+1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        const dateRow = worksheet.addRow({
            no: '',
            periode: '',
            pt: '',
            supplier: '',
            po: '',
            inv: '',
            tglInv: '',
            total: '',
            ket: '',
            fp: `Pekanbaru, ${formattedDate}`
        });
        dateRow.alignment = { horizontal: 'right' };

        // Tambahkan row untuk label tanda tangan dengan jarak 1 kolom antar label
        const signatureLabelsRow = worksheet.addRow({
            no: '',
            periode: '',
            pt: '',
            supplier: '',
            po: '',
            inv: 'Diterima Oleh,',
            tglInv: '', // Gap column
            total: 'TT Faktur Pajak,',
            ket: '', // Gap column
            fp: 'Diserahkan Oleh,'
        });
        signatureLabelsRow.font = { bold: true };
        signatureLabelsRow.alignment = { horizontal: 'center' };

        // Tambahkan 4 baris kosong sebelum nama penandatangan
        worksheet.addRow({});
        worksheet.addRow({});
        worksheet.addRow({});
        worksheet.addRow({});

        // Tambahkan row dengan nama penanda tangan dengan jarak 1 kolom antar nama
        const signatureNamesRow = worksheet.addRow({
            no: '',
            periode: '',
            pt: '',
            supplier: '',
            po: '',
            inv: 'Qodari',
            tglInv: '', // Gap column
            total: 'Dina',
            ket: '', // Gap column
            fp: 'Kantthi'
        });
        signatureNamesRow.alignment = { horizontal: 'center' };

        // Format kolom 'Total (Rp)' ke format Rupiah dan selaraskan ke kanan
        worksheet.getColumn('total').numFmt = '#,##0';
        worksheet.getColumn('total').alignment = { horizontal: 'right' };

        // Simpan workbook ke buffer
        const buffer = await workbook.xlsx.writeBuffer();

        // Buat Blob dan trigger download
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'preOrderData.xlsx';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        showNotification('Data berhasil diekspor ke Excel.', 'success');
    } catch (error) {
        console.error("Error exporting to Excel: ", error);
        showNotification('Gagal mengekspor data ke Excel.', 'error');
    }
});

// Fungsi untuk memformat periode sesuai dengan contoh print-excel.html (e.g., "Nov'24")
function formatPeriode(periode) {
    const date = new Date(periode);
    const bulan = date.toLocaleString('default', { month: 'short', year: '2-digit' });
    return `${bulan}`;
}

// Fungsi untuk memformat tanggal invoice sesuai dengan contoh print-excel.html (e.g., "05/11/2024")
function formatTanggal(tglInvoice) {
    const date = new Date(tglInvoice);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Bulan dimulai dari 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Export to Word (.docx)
exportWordBtn.addEventListener('click', () => {
    try {
        // Prepare table HTML
        let tableContent = `
            <table border="1" cellspacing="0" cellpadding="5">
                <tr>
                    <th>Nomor</th>
                    <th>Periode</th>
                    <th>Nama PT</th>
                    <th>Supplier</th>
                    <th>PreOrder</th>
                    <th>Invoice</th>
                    <th>Tanggal Invoice</th>
                    <th>Total (Rp)</th>
                    <th>Keterangan</th>
                    <th>Faktur</th>
                </tr>
        `;

        // Mengelompokkan data berdasarkan supplier
        const groupedData = {};
        filteredData.forEach((data) => {
            if (!groupedData[data.supplier]) {
                groupedData[data.supplier] = [];
            }
            groupedData[data.supplier].push(data);
        });

        // Iterasi melalui setiap grup supplier
        for (const [supplier, dataGroup] of Object.entries(groupedData)) {
            let subtotal = 0;

            dataGroup.forEach((data, index) => {
                tableContent += `
                    <tr>
                        <td>${index + 1}</td>
                        <td>${formatPeriode(data.periode)}</td>
                        <td>${data.namaPT}</td>
                        <td>${data.supplier}</td>
                        <td>${data.preOrder}</td>
                        <td>${data.invoice}</td>
                        <td>${formatTanggal(data.tglInvoice)}</td>
                        <td>${formatRupiah(data.total.toString(), true)}</td>
                        <td>${data.keterangan || '-'}</td>
                        <td>${data.faktur || '-'}</td>
                    </tr>
                `;
                subtotal += data.total;
            });

            // Tambahkan baris subtotal per supplier (hanya di kolom 'Total (Rp)')
            tableContent += `
                <tr>
                    <td colspan="7"></td>
                    <td><strong>${formatRupiah(subtotal.toString(), true)}</strong></td>
                    <td colspan="2"></td>
                </tr>
            `;
        }

        tableContent += `</table>`;

        // Tambahkan footer tanda tangan
        tableContent += `
            <br/><br/>
            <table style="width: 100%; text-align: center;">
                <tr>
                    <td>Pekanbaru, ${new Date().toLocaleDateString('id-ID')}</td>
                </tr>
                <tr>
                    <td>Diterima Oleh,</td>
                    <td></td> <!-- Gap column -->
                    <td>TT Faktur Pajak,</td>
                    <td></td> <!-- Gap column -->
                    <td>Diserahkan Oleh,</td>
                </tr>
                <tr>
                    <td style="height: 80px;"></td>
                    <td></td>
                    <td style="height: 80px;"></td>
                    <td></td>
                    <td style="height: 80px;"></td>
                </tr>
                <tr>
                    <td>Qodari</td>
                    <td></td>
                    <td>Dina</td>
                    <td></td>
                    <td>Kantthi</td>
                </tr>
            </table>
        `;

        // Create Blob
        const blob = new Blob(['\ufeff', tableContent], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
        const url = URL.createObjectURL(blob);

        // Create link and trigger download
        const link = document.createElement("a");
        link.href = url;
        link.download = "preOrderData.docx";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        showNotification('Data berhasil diekspor ke Word.', 'success');
    } catch (error) {
        console.error("Error exporting to Word: ", error);
        showNotification('Gagal mengekspor data ke Word.', 'error');
    }
});

// Export to PDF (.pdf)
exportPDFBtn.addEventListener('click', () => {
    try {
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        // Prepare data
        const rows = [];

        // Mengelompokkan data berdasarkan supplier
        const groupedData = {};
        filteredData.forEach((data) => {
            if (!groupedData[data.supplier]) {
                groupedData[data.supplier] = [];
            }
            groupedData[data.supplier].push(data);
        });

        let grandTotal = 0;

        // Iterasi melalui setiap grup supplier
        for (const [supplier, dataGroup] of Object.entries(groupedData)) {
            let subtotal = 0;

            dataGroup.forEach((data, index) => {
                rows.push([
                    index + 1,
                    formatPeriode(data.periode),
                    data.namaPT,
                    data.supplier,
                    data.preOrder,
                    data.invoice,
                    formatTanggal(data.tglInvoice),
                    formatRupiah(data.total.toString(), true),
                    data.keterangan || '-',
                    data.faktur || '-'
                ]);
                subtotal += data.total;
            });

            // Tambahkan baris subtotal per supplier (hanya di kolom 'Total (Rp)')
            rows.push([
                '',
                '',
                '',
                '',
                '',
                '',
                '',
                formatRupiah(subtotal.toString(), true),
                '',
                ''
            ]);

            grandTotal += subtotal;
        }

        // Add title
        doc.setFontSize(15);
        doc.text("Data PreOrder", 14, 16);

        // Add table
        doc.autoTable({
            head: [['Nomor', 'Periode', 'Nama PT', 'Supplier', 'PreOrder', 'Invoice', 'Tgl Inv', 'Total (Rp)', 'Keterangan', 'Faktur']],
            body: rows,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [40, 167, 69] },
            theme: 'striped'
        });

        // Tambahkan footer tanda tangan
        const finalY = doc.lastAutoTable.finalY + 10;
        doc.text(`Pekanbaru, ${new Date().toLocaleDateString('id-ID')}`, 14, finalY);

        doc.autoTable({
            startY: finalY + 10,
            body: [
                ['Diterima Oleh,', '', 'TT Faktur Pajak,', '', 'Diserahkan Oleh,'],
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['', '', '', '', ''],
                ['Qodari', '', 'Dina', '', 'Kantthi']
            ],
            styles: { halign: 'center', valign: 'middle' },
            tableWidth: '100%',
            columnStyles: {
                0: { cellWidth: '20%' },
                1: { cellWidth: '10%' },
                2: { cellWidth: '20%' },
                3: { cellWidth: '10%' },
                4: { cellWidth: '20%' }
            },
            head: [['', '', '', '', '']],
            foot: [['', '', '', '', '']]
        });

        // Save PDF
        doc.save('preOrderData.pdf');
        showNotification('Data berhasil diekspor ke PDF.', 'success');
    } catch (error) {
        console.error("Error exporting to PDF: ", error);
        showNotification('Gagal mengekspor data ke PDF.', 'error');
    }
});

// Function to delete data
async function deleteData(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        try {
            await deleteDoc(doc(db, "preOrderData", id));
            showNotification('Data berhasil dihapus.', 'success');
        } catch (error) {
            console.error("Error deleting document: ", error);
            showNotification('Gagal menghapus data.', 'error');
        }
    }
}

// Function to open edit modal
async function openEditModal(id, data) {
    currentEditId = id;

    // Fetch original data from Firestore to ensure up-to-date data
    try {
        const docRef = doc(db, "preOrderData", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            originalEditData = docSnap.data();
        } else {
            showNotification('Data tidak ditemukan.', 'error');
            return;
        }
    } catch (error) {
        console.error("Error fetching document: ", error);
        showNotification('Gagal mengambil data asli.', 'error');
        return;
    }

    document.getElementById('editPeriode').value = data.periode;
    document.getElementById('editNamaPT').value = data.namaPT;
    document.getElementById('editSupplier').value = data.supplier;
    document.getElementById('editPreOrder').value = data.preOrder;
    document.getElementById('editInvoice').value = data.invoice;
    document.getElementById('editTglInvoice').value = data.tglInvoice;
    document.getElementById('editTotal').value = data.total;
    document.getElementById('editKeterangan').value = data.keterangan || '';
    document.getElementById('editFaktur').value = data.faktur || '';
    editModal.classList.remove('hidden');
}

// Function to close edit modal
cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editForm.reset();
    originalEditData = null;
});

// Handle edit form submission
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentEditId) {
        showNotification('Tidak ada data yang dipilih untuk diedit.', 'error');
        return;
    }

    const periode = editForm.editPeriode.value;
    const namaPT = editForm.editNamaPT.value.trim();
    const supplier = editForm.editSupplier.value.trim();
    const preOrder = editForm.editPreOrder.value.trim();
    const invoice = editForm.editInvoice.value.trim();
    const tglInvoice = editForm.editTglInvoice.value;
    const total = Number(editForm.editTotal.value);
    const keterangan = editForm.editKeterangan.value.trim();
    const faktur = editForm.editFaktur.value.trim();

    // Validasi di JavaScript untuk memastikan semua field terisi
    if (!periode || !namaPT || !supplier || !preOrder || !invoice || !tglInvoice || isNaN(total) || total < 0 || !keterangan || !faktur) {
        showNotification('Silakan isi semua field dengan benar sebelum memperbarui data.', 'error');
        return;
    }

    // Cek apakah ada perubahan data
    const isDataChanged = (
        periode !== originalEditData.periode ||
        namaPT !== originalEditData.namaPT ||
        supplier !== originalEditData.supplier ||
        preOrder !== originalEditData.preOrder ||
        invoice !== originalEditData.invoice ||
        tglInvoice !== originalEditData.tglInvoice ||
        total !== originalEditData.total ||
        keterangan !== originalEditData.keterangan ||
        faktur !== originalEditData.faktur
    );

    if (!isDataChanged) {
        showNotification('Tidak ada perubahan data yang dilakukan.', 'error');
        return;
    }

    try {
        const docRef = doc(db, "preOrderData", currentEditId);
        await updateDoc(docRef, {
            periode,
            namaPT,
            supplier,
            preOrder,
            invoice,
            tglInvoice,
            total,
            keterangan,
            faktur
        });
        editModal.classList.add('hidden');
        editForm.reset();
        originalEditData = null;
        showNotification('Data berhasil diperbarui.', 'success');
    } catch (error) {
        console.error("Error updating document: ", error);
        showNotification('Gagal memperbarui data.', 'error');
    }
});

// Search Filters with Debounce
let debounceTimer;
function debounce(func, delay) {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(func, delay);
}

searchNamaPT.addEventListener('input', () => {
    debounce(applyFilters, 300);
});
searchPeriode.addEventListener('change', applyFilters);

// Fetch data on load
fetchData();
