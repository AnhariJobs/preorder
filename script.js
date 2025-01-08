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
const searchNamaPT = document.getElementById('searchNamaPT');
const searchPeriode = document.getElementById('searchPeriode');
const clearFiltersBtn = document.getElementById('clearFilters');
const headerCheckbox = document.getElementById('headerCheckbox');
const selectAllBtn = document.getElementById('selectAll');

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
let allData = [];
let filteredData = [];
let selectedRows = new Set();
let currentPage = 1;
const rowsPerPage = 10;

// Function to format number to Rupiah
function formatRupiah(value, withDecimal = false) {
    let number = Number(value);
    if (isNaN(number)) return 'Rp.0' + (withDecimal ? ',00' : '');
    if (withDecimal) {
        return 'Rp.' + number.toLocaleString('id-ID', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
    } else {
        return 'Rp.' + number.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
    }
}

// Function to format periode
function formatPeriode(periode) {
    const date = new Date(periode);
    const bulan = date.toLocaleString('default', { month: 'short' });
    const tahun = date.getFullYear().toString().slice(-2);
    return `${bulan}'${tahun}`;
}

// Function to format tanggal
function formatTanggal(tglInvoice) {
    const date = new Date(tglInvoice);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
}

// Auto-calculate PPN when 'hargaBarang' changes
hargaBarangInput.addEventListener('input', calculateTax);

// Function to calculate PPN
function calculateTax() {
    const hargaBarang = Number(hargaBarangInput.value);
    if (!isNaN(hargaBarang) && hargaBarang > 0) {
        const hasilPajak = (hargaBarang / 1.11).toFixed(2);
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

// Function to validate form data
function validateFormData(data) {
    const required = ['periode', 'namaPT', 'supplier', 'preOrder', 'invoice', 'tglInvoice'];
    for (const field of required) {
        if (!data[field]?.trim()) return false;
    }
    if (isNaN(data.total) || data.total < 0) return false;
    return true;
}

// Function to add data to Firestore
submitBtn.addEventListener('click', async (e) => {
    e.preventDefault();
    
    const formData = {
        periode: preOrderForm.periode.value,
        namaPT: preOrderForm.namaPT.value.trim(),
        supplier: preOrderForm.supplier.value.trim(),
        preOrder: preOrderForm.preOrder.value.trim(),
        invoice: preOrderForm.invoice.value.trim(),
        tglInvoice: preOrderForm.tglInvoice.value,
        total: Number(preOrderForm.total.value),
        keterangan: preOrderForm.keterangan.value.trim(),
        faktur: preOrderForm.faktur.value.trim()
    };

    if (!validateFormData(formData)) {
        showNotification('Silakan isi semua field dengan benar sebelum menyimpan data.', 'error');
        return;
    }

    try {
        await addDoc(collection(db, "preOrderData"), {
            ...formData,
            tanggalInput: serverTimestamp()
        });
        clearForm();
        showNotification('Data berhasil disimpan.', 'success');
    } catch (error) {
        console.error("Error adding document: ", error);
        showNotification('Gagal menyimpan data: ' + error.message, 'error');
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
            <td class="py-4 px-6 border-b">
                <input type="checkbox" class="row-checkbox form-checkbox h-4 w-4 text-teal-600 transition duration-150 ease-in-out" 
                       data-id="${data.id}" ${selectedRows.has(data.id) ? 'checked' : ''}>
            </td>
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
                <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 text-white transition-all transform hover:scale-105 px-3 py-1 rounded">Edit</button>
                <button class="delete-btn bg-red-500 hover:bg-red-600 text-white transition-all transform hover:scale-105 px-3 py-1 rounded">Hapus</button>
            </td>
        `;
        preOrderTableBody.appendChild(tr);
        nomor++;
    });

    // Update pagination buttons
    currentPageSpan.textContent = `Halaman ${currentPage}`;
    prevPageBtn.disabled = currentPage === 1;
    nextPageBtn.disabled = currentPage === Math.ceil(filteredData.length / rowsPerPage);

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

    // Attach event listeners
    attachCheckboxListeners();
    attachEditDeleteListeners(pageData);
}

// Function to attach checkbox event listeners
function attachCheckboxListeners() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.addEventListener('change', (e) => {
            const id = e.target.dataset.id;
            if (e.target.checked) {
                selectedRows.add(id);
            } else {
                selectedRows.delete(id);
            }
            updateHeaderCheckbox();
        });
    });
}

// Function to attach edit and delete event listeners
function attachEditDeleteListeners(pageData) {
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

// Function to update header checkbox state
function updateHeaderCheckbox() {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    const checkedCount = document.querySelectorAll('.row-checkbox:checked').length;
    headerCheckbox.checked = checkedCount === checkboxes.length;
    headerCheckbox.indeterminate = checkedCount > 0 && checkedCount < checkboxes.length;
}

// Header checkbox event listener
headerCheckbox.addEventListener('change', (e) => {
    const checkboxes = document.querySelectorAll('.row-checkbox');
    checkboxes.forEach(checkbox => {
        checkbox.checked = e.target.checked;
        const id = checkbox.dataset.id;
        if (e.target.checked) {
            selectedRows.add(id);
        } else {
            selectedRows.delete(id);
        }
    });
});

// Select All button event listener
selectAllBtn.addEventListener('click', () => {
    selectedRows = new Set(filteredData.map(data => data.id));
    renderTable();
    updateHeaderCheckbox();
});

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

// Export to Excel (.xlsx) with selected rows
exportExcelBtn.addEventListener('click', async () => {
    if (selectedRows.size === 0) {
        showNotification('Pilih setidaknya satu data untuk diekspor.', 'error');
        return;
    }

    try {
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('PreOrderData');

        // Add title rows
        worksheet.addRow(['']);
        const titleRow = worksheet.addRow(['TANDA TERIMA PREORDER']);
        worksheet.mergeCells('A2:J2');
        titleRow.getCell(1).font = { size: 16, bold: true };
        titleRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

        // Add header row
        const headerRow = worksheet.addRow(['No', 'Periode', 'PT', 'Supplier', 'No. Po', 'No. Inv', 'Tgl Inv', 'Total (Rp)', 'KET', 'FP']);
        headerRow.font = { bold: true };
        headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
        headerRow.eachCell((cell) => {
            cell.border = {
                top: { style: 'thick', color: { argb: '000000' } },
                bottom: { style: 'thick', color: { argb: '000000' } },
                left: { style: 'none' },
                right: { style: 'none' }
            };
            cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFE0F2F1' }
            };
            cell.font = { color: { argb: 'FF00695C' }, bold: true };
        });

        // Filter and sort selected data
        const selectedData = filteredData.filter(data => selectedRows.has(data.id));

        // Group data by PT and Supplier
        const groupedData = {};
        selectedData.forEach((data) => {
            const key = `${data.namaPT}|${data.supplier}`;
            if (!groupedData[key]) {
                groupedData[key] = [];
            }
            groupedData[key].push(data);
        });

        let grandTotal = 0;

        // Add data rows by group
        for (const [key, dataGroup] of Object.entries(groupedData)) {
            const [namaPT, supplier] = key.split('|');
            let subtotal = 0;

            dataGroup.forEach((data, index) => {
                const rowValues = [
                    index === 0 ? 1 : '',
                    formatPeriode(data.periode),
                    index === 0 ? namaPT : '',
                    index === 0 ? supplier : '',
                    data.preOrder,
                    data.invoice,
                    formatTanggal(data.tglInvoice),
                    Number(data.total),
                    data.keterangan || '',
                    data.faktur || ''
                ];

                const row = worksheet.addRow(rowValues);
                row.eachCell((cell) => {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                });

                subtotal += data.total;
            });

            // Add subtotal row
            const subtotalRow = worksheet.addRow(['', '', '', '', '', '', '', subtotal, '', '']);
            subtotalRow.font = { bold: true };
            subtotalRow.getCell(8).numFmt = '#,##0';
            subtotalRow.getCell(8).alignment = { horizontal: 'right', vertical: 'middle' };
            subtotalRow.getCell(8).border = {
                bottom: { style: 'thick', color: { argb: '000000' } }
            };

            grandTotal += subtotal;
        }

        // Add signature section
        worksheet.addRow(['']);
        worksheet.addRow(['']);

        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}-${(today.getMonth() + 1).toString().padStart(2, '0')}-${today.getFullYear()}`;
        const dateRow = worksheet.addRow(['', '', '', '', '', '', '', '', '', `Pekanbaru, ${formattedDate}`]);
        dateRow.alignment = { horizontal: 'center', vertical: 'middle' };

        const signatureLabelsRow = worksheet.addRow(['', '', '', '', '', 'Diterima Oleh,', '', 'TT Faktur Pajak,', '', 'Diserahkan Oleh,']);
        signatureLabelsRow.font = { bold: true };
        signatureLabelsRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Add signature spaces
        for (let i = 0; i < 4; i++) {
            worksheet.addRow(['', '', '', '', '', '', '', '', '', '']);
        }

        const signatureNamesRow = worksheet.addRow(['', '', '', '', '', 'Qodari', '', 'Dina', '', 'Kantthi']);
        signatureNamesRow.alignment = { horizontal: 'center', vertical: 'middle' };

        // Adjust column widths
        worksheet.columns.forEach(column => {
            let maxLength = 0;
            column.eachCell({ includeEmpty: true }, cell => {
                const cellValue = cell.value ? cell.value.toString() : '';
                const columnLength = cellValue.length;
                if (columnLength > maxLength) {
                    maxLength = columnLength;
                }
            });
            column.width = maxLength < 10 ? 10 : maxLength + 2;
        });

        // Save workbook
        const buffer = await workbook.xlsx.writeBuffer();
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

// Function to delete data
async function deleteData(id) {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        try {
            await deleteDoc(doc(db, "preOrderData", id));
            selectedRows.delete(id);
            showNotification('Data berhasil dihapus.', 'success');
        } catch (error) {
            console.error("Error deleting document: ", error);
            showNotification('Gagal menghapus data: ' + error.message, 'error');
        }
    }
}

// Function to open edit modal
async function openEditModal(id, data) {
    currentEditId = id;

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
        showNotification('Gagal mengambil data asli: ' + error.message, 'error');
        return;
    }

    // Populate edit form
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

// Function to handle edit form submission
editForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    if (!currentEditId) {
        showNotification('Tidak ada data yang dipilih untuk diedit.', 'error');
        return;
    }

    const editedData = {
        periode: editForm.editPeriode.value,
        namaPT: editForm.editNamaPT.value.trim(),
        supplier: editForm.editSupplier.value.trim(),
        preOrder: editForm.editPreOrder.value.trim(),
        invoice: editForm.editInvoice.value.trim(),
        tglInvoice: editForm.editTglInvoice.value,
        total: Number(editForm.editTotal.value),
        keterangan: editForm.editKeterangan.value.trim(),
        faktur: editForm.editFaktur.value.trim()
    };

    if (!validateFormData(editedData)) {
        showNotification('Silakan isi semua field dengan benar sebelum memperbarui data.', 'error');
        return;
    }

    // Check for changes
    const isDataChanged = Object.keys(editedData).some(key => 
        editedData[key] !== originalEditData[key]
    );

    if (!isDataChanged) {
        showNotification('Tidak ada perubahan data yang dilakukan.', 'error');
        return;
    }

    try {
        const docRef = doc(db, "preOrderData", currentEditId);
        await updateDoc(docRef, editedData);
        editModal.classList.add('hidden');
        editForm.reset();
        originalEditData = null;
        showNotification('Data berhasil diperbarui.', 'success');
    } catch (error) {
        console.error("Error updating document: ", error);
        showNotification('Gagal memperbarui data: ' + error.message, 'error');
    }
});

// Cancel edit button handler
cancelEditBtn.addEventListener('click', () => {
    editModal.classList.add('hidden');
    editForm.reset();
    originalEditData = null;
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

// Initialize data fetch
fetchData();
