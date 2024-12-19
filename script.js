import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyBoOpKPh1mBAG5ConIohxqT4SMtFwW6Nq8",
    authDomain: "tanda-terima-preorder-8c4d3.firebaseapp.com",
    projectId: "tanda-terima-preorder-8c4d3",
    storageBucket: "tanda-terima-preorder-8c4d3.appspot.com",
    messagingSenderId: "118639827128",
    appId: "1:118639827128:web:0567bd329c9fd38cf9fc4d",
    measurementId: "G-XV8ZERFB1N"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// DOM Elements
const form = document.getElementById("preOrderForm");
const tableBody = document.getElementById("tableBody");
const hargaBarangInput = document.getElementById("hargaBarang");
const hasilPajak = document.getElementById("hasilPajak");

// Add Data
document.getElementById("submitData").addEventListener("click", async () => {
    const data = {
        periode: form.periode.value,
        namaPT: form.namaPT.value,
        supplier: form.supplier.value,
        preOrder: form.preOrder.value,
        invoice: form.invoice.value,
        tglInvoice: form.tglInvoice.value,
        total: parseFloat(form.total.value),
        keterangan: form.keterangan.value,
        faktur: form.faktur.value
    };

    try {
        await addDoc(collection(db, "preOrderData"), data);
        alert("Data berhasil ditambahkan!");
        fetchData();
        form.reset();
    } catch (e) {
        console.error("Error adding document: ", e);
    }
});

// Fetch Data
async function fetchData() {
    const querySnapshot = await getDocs(collection(db, "preOrderData"));
    tableBody.innerHTML = "";
    let counter = 1;

    querySnapshot.forEach((doc) => {
        const data = doc.data();
        const row = `
            <tr>
                <td>${counter++}</td>
                <td>${data.periode}</td>
                <td>${data.namaPT}</td>
                <td>${data.supplier}</td>
                <td>${data.total.toLocaleString('id-ID', { style: 'currency', currency: 'IDR' })}</td>
                <td>
                    <button onclick="editData('${doc.id}')" class="bg-yellow-400 hover:bg-yellow-500 p-2 rounded">Edit</button>
                    <button onclick="deleteData('${doc.id}')" class="bg-red-500 hover:bg-red-600 p-2 rounded">Hapus</button>
                </td>
            </tr>`;
        tableBody.innerHTML += row;
    });
}

// Edit Data
window.editData = async (id) => {
    const docRef = doc(db, "preOrderData", id);
    const newData = prompt("Masukkan data baru (dalam format JSON):");
    if (newData) {
        try {
            await updateDoc(docRef, JSON.parse(newData));
            alert("Data berhasil diperbarui!");
            fetchData();
        } catch (e) {
            console.error("Error updating document: ", e);
        }
    }
};

// Delete Data
window.deleteData = async (id) => {
    if (confirm("Apakah Anda yakin ingin menghapus data ini?")) {
        try {
            await deleteDoc(doc(db, "preOrderData", id));
            alert("Data berhasil dihapus!");
            fetchData();
        } catch (e) {
            console.error("Error deleting document: ", e);
        }
    }
};

// Auto Calculate Tax
hargaBarangInput.addEventListener("input", () => {
    const value = parseFloat(hargaBarangInput.value.replace(/[^\d]/g, ""));
    if (!isNaN(value)) {
        const tax = (value / 1.11).toFixed(2);
        hasilPajak.innerHTML = `Hasil PPN: Rp. ${parseFloat(tax).toLocaleString("id-ID")}`;
    } else {
        hasilPajak.innerHTML = "Hasil PPN: Rp. 0,00";
    }
});

// Format Input as Currency
hargaBarangInput.addEventListener("keyup", (e) => {
    const value = hargaBarangInput.value.replace(/[^\d]/g, "");
    hargaBarangInput.value = new Intl.NumberFormat("id-ID", {
        style: "decimal",
        maximumFractionDigits: 0
    }).format(value);
});

// Fetch Data on Load
fetchData();

