// script.js

// Import Firebase modules
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, doc, deleteDoc, getDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Your web app's Firebase configuration
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
const db = getFirestore(app);

// Wait for the DOM to load
document.addEventListener('DOMContentLoaded', () => {

    // Elements
    const preOrderForm = document.getElementById('preOrderForm');
    const saveDataBtn = document.getElementById('saveDataBtn');
    const preOrderTableBody = document.querySelector('#preOrderTable tbody');
    const calculateBtn = document.getElementById('calculateBtn');
    const hargaBarangInput = document.getElementById('hargaBarang');
    const hasilPajakDiv = document.getElementById('hasilPajak');
    const exportExcelBtn = document.getElementById('exportExcel');
    const exportWordBtn = document.getElementById('exportWord');
    const exportPDFBtn = document.getElementById('exportPDF');
    const fab = document.getElementById('fab');
    const editModal = document.getElementById('editModal');
    const closeModalBtn = document.getElementById('closeModal');
    const updateDataBtn = document.getElementById('updateDataBtn');

    // Edit form elements
    const editForm = document.getElementById('editForm');
    const editIdInput = document.getElementById('editId');
    const editPeriodeInput = document.getElementById('editPeriode');
    const editNamaPTInput = document.getElementById('editNamaPT');
    const editSupplierInput = document.getElementById('editSupplier');
    const editPreOrderInput = document.getElementById('editPreOrder');
    const editInvoiceInput = document.getElementById('editInvoice');
    const editTglInvoiceInput = document.getElementById('editTglInvoice');
    const editTotalInput = document.getElementById('editTotal');
    const editKeteranganInput = document.getElementById('editKeterangan');
    const editFakturInput = document.getElementById('editFaktur');

    // Load and display data
    const loadData = async () => {
        preOrderTableBody.innerHTML = '';
        const querySnapshot = await getDocs(collection(db, "preOrderData"));
        let nomor = 1;
        querySnapshot.forEach((docSnap) => {
            const data = docSnap.data();
            const row = document.createElement('tr');
            row.classList.add('hover:bg-teal-50', 'transition-all');

            row.innerHTML = `
                <td class="py-4 px-6 border-b">${nomor}</td>
                <td class="py-4 px-6 border-b">${data.periode}</td>
                <td class="py-4 px-6 border-b">${data.namaPT}</td>
                <td class="py-4 px-6 border-b">${data.supplier}</td>
                <td class="py-4 px-6 border-b">${data.preOrder}</td>
                <td class="py-4 px-6 border-b">${data.invoice}</td>
                <td class="py-4 px-6 border-b">${data.tglInvoice}</td>
                <td class="py-4 px-6 border-b">Rp. ${formatCurrency(data.total)}</td>
                <td class="py-4 px-6 border-b">${data.keterangan || ''}</td>
                <td class="py-4 px-6 border-b">${data.faktur || ''}</td>
                <td class="py-4 px-6 border-b flex gap-3">
                    <button class="edit-btn bg-yellow-400 hover:bg-yellow-500 transition-all transform hover:scale-105" data-id="${docSnap.id}">Edit</button>
                    <button class="delete-btn bg-red-500 hover:bg-red-600 transition-all transform hover:scale-105" data-id="${docSnap.id}">Hapus</button>
                </td>
            `;

            preOrderTableBody.appendChild(row);
            nomor++;
        });

        // Add event listeners for edit and delete buttons
        const editButtons = document.querySelectorAll('.edit-btn');
        const deleteButtons = document.querySelectorAll('.delete-btn');

        editButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                openEditModal(id);
            });
        });

        deleteButtons.forEach(button => {
            button.addEventListener('click', (e) => {
                const id = e.target.getAttribute('data-id');
                deleteData(id);
            });
        });
    };

    // Format currency
    const formatCurrency = (value) => {
        return Number(value).toLocaleString('id-ID');
    };

    // Save data
    saveDataBtn.addEventListener('click', async () => {
        const periode = document.getElementById('periode').value;
        const namaPT = document.getElementById('namaPT').value;
        const supplier = document.getElementById('supplier').value;
        const preOrder = document.getElementById('preOrder').value;
        const invoice = document.getElementById('invoice').value;
        const tglInvoice = document.getElementById('tglInvoice').value;
        const total = document.getElementById('total').value;
        const keterangan = document.getElementById('keterangan').value;
        const faktur = document.getElementById('faktur').value;

        if (periode && namaPT && supplier && preOrder && invoice && tglInvoice && total) {
            try {
                await addDoc(collection(db, "preOrderData"), {
                    periode,
                    namaPT,
                    supplier,
                    preOrder,
                    invoice,
                    tglInvoice,
                    total: Number(total),
                    keterangan,
                    faktur
                });
                alert('Data berhasil disimpan');
                preOrderForm.reset();
                loadData();
            } catch (error) {
                console.error("Error adding document: ", error);
                alert('Gagal menyimpan data');
            }
        } else {
            alert('Harap lengkapi semua field yang diperlukan');
        }
    });

    // Calculate PPN
    calculateBtn.addEventListener('click', (e) => {
        e.preventDefault();
        const hargaBarang = hargaBarangInput.value;
        if (hargaBarang) {
            const hasilPajak = (hargaBarang / 1.1).toFixed(2);  // Formula: harga / 1.1
            hasilPajakDiv.innerHTML = `Hasil PPN: <span class="text-teal-600">Rp. ${formatCurrency(hasilPajak)}</span>`;
        } else {
            hasilPajakDiv.innerHTML = "Hasil PPN: Rp. 0,00";
        }
    });

    // Export to Excel
    exportExcelBtn.addEventListener('click', () => {
        exportTableToExcel('preOrderTable', 'PreOrderData');
    });

    // Export to Word
    exportWordBtn.addEventListener('click', () => {
        exportTableToWord('preOrderTable', 'PreOrderData');
    });

    // Export to PDF
    exportPDFBtn.addEventListener('click', () => {
        exportTableToPDF('preOrderTable', 'PreOrderData');
    });

    // Export functions
    const exportTableToExcel = (tableID, filename = '') => {
        const downloadLink = document.createElement('a');
        const dataType = 'application/vnd.ms-excel';
        const tableSelect = document.getElementById(tableID);
        const tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

        filename = filename ? `${filename}.xls` : 'PreOrderData.xls';

        downloadLink.href = `data:${dataType},${tableHTML}`;
        downloadLink.download = filename;

        downloadLink.click();
    };

    const exportTableToWord = (tableID, filename = '') => {
        const downloadLink = document.createElement('a');
        const dataType = 'application/vnd.ms-word';
        const tableSelect = document.getElementById(tableID);
        const tableHTML = tableSelect.outerHTML.replace(/ /g, '%20');

        filename = filename ? `${filename}.doc` : 'PreOrderData.doc';

        downloadLink.href = `data:${dataType},${tableHTML}`;
        downloadLink.download = filename;

        downloadLink.click();
    };

    const exportTableToPDF = () => {
        // Use jsPDF and autoTable
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF();

        const table = document.getElementById('preOrderTable');
        const headers = [];
        const data = [];

        // Get headers
        table.querySelectorAll('thead tr th').forEach(th => {
            headers.push(th.textContent.trim());
        });

        // Get rows
        table.querySelectorAll('tbody tr').forEach(tr => {
            const row = [];
            tr.querySelectorAll('td').forEach((td, index) => {
                // Skip the 'Aksi' column
                if (index < headers.length -1) {
                    row.push(td.textContent.trim());
                }
            });
            data.push(row);
        });

        // Add title
        doc.setFontSize(18);
        doc.text('Data PreOrder', 14, 22);

        // Add table
        doc.autoTable({
            startY: 30,
            head: [headers.slice(0, -1)], // Exclude 'Aksi'
            body: data,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [40, 167, 69] },
            theme: 'grid'
        });

        const filename = 'PreOrderData.pdf';
        doc.save(filename);
    };

    // Floating Action Button - Reset Form
    fab.addEventListener('click', () => {
        preOrderForm.reset();
        window.scrollTo({ top: 0, behavior: 'smooth' });
    });

    // Open Edit Modal
    const openEditModal = async (id) => {
        const docRef = doc(db, "preOrderData", id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            const data = docSnap.data();
            editIdInput.value = id;
            editPeriodeInput.value = data.periode;
            editNamaPTInput.value = data.namaPT;
            editSupplierInput.value = data.supplier;
            editPreOrderInput.value = data.preOrder;
            editInvoiceInput.value = data.invoice;
            editTglInvoiceInput.value = data.tglInvoice;
            editTotalInput.value = data.total;
            editKeteranganInput.value = data.keterangan;
            editFakturInput.value = data.faktur;
            editModal.classList.remove('hidden');
        } else {
            alert('Data tidak ditemukan');
        }
    };

    // Close Edit Modal
    closeModalBtn.addEventListener('click', () => {
        editModal.classList.add('hidden');
    });

    // Update Data
    updateDataBtn.addEventListener('click', async () => {
        const id = editIdInput.value;
        const periode = editPeriodeInput.value;
        const namaPT = editNamaPTInput.value;
        const supplier = editSupplierInput.value;
        const preOrder = editPreOrderInput.value;
        const invoice = editInvoiceInput.value;
        const tglInvoice = editTglInvoiceInput.value;
        const total = editTotalInput.value;
        const keterangan = editKeteranganInput.value;
        const faktur = editFakturInput.value;

        if (periode && namaPT && supplier && preOrder && invoice && tglInvoice && total) {
            try {
                const docRef = doc(db, "preOrderData", id);
                await updateDoc(docRef, {
                    periode,
                    namaPT,
                    supplier,
                    preOrder,
                    invoice,
                    tglInvoice,
                    total: Number(total),
                    keterangan,
                    faktur
                });
                alert('Data berhasil diperbarui');
                editModal.classList.add('hidden');
                loadData();
            } catch (error) {
                console.error("Error updating document: ", error);
                alert('Gagal memperbarui data');
            }
        } else {
            alert('Harap lengkapi semua field yang diperlukan');
        }
    });

    // Delete Data
    const deleteData = async (id) => {
        if (confirm('Apakah Anda yakin ingin menghapus data ini?')) {
            try {
                await deleteDoc(doc(db, "preOrderData", id));
                alert('Data berhasil dihapus');
                loadData();
            } catch (error) {
                console.error("Error deleting document: ", error);
                alert('Gagal menghapus data');
            }
        }
    };

    // Initial load
    loadData();

});
