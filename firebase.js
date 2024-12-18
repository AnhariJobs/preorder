// firebase.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-app.js";
import { getFirestore, collection, addDoc, onSnapshot, doc, getDoc, deleteDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.1.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyBoOpKPh1mBAG5ConIohxqT4SMtFwW6Nq8",
  authDomain: "tanda-terima-preorder-8c4d3.firebaseapp.com",
  projectId: "tanda-terima-preorder-8c4d3",
  storageBucket: "tanda-terima-preorder-8c4d3.firebasestorage.app",
  messagingSenderId: "118639827128",
  appId: "1:118639827128:web:0567bd329c9fd38cf9fc4d",
  measurementId: "G-XV8ZERFB1N"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const preOrderCollection = collection(db, 'preOrderData');

// Menangani pembaruan data pada tabel
onSnapshot(preOrderCollection, (snapshot) => {
  const tableBody = document.querySelector('tbody');
  tableBody.innerHTML = '';
  snapshot.forEach((doc, index) => {
    const data = doc.data();
    const row = document.createElement('tr');
    row.innerHTML = `
      <td class="py-2 px-4 border-b">${index + 1}</td>
      <td class="py-2 px-4 border-b">${data.periode}</td>
      <td class="py-2 px-4 border-b">${data.namaPT}</td>
      <td class="py-2 px-4 border-b">${data.supplier}</td>
      <td class="py-2 px-4 border-b">${data.total}</td>
      <td class="py-2 px-4 border-b">
        <button class="text-blue-500 hover:text-blue-700 editBtn" data-id="${doc.id}">Edit</button>
        <button class="text-red-500 hover:text-red-700 deleteBtn" data-id="${doc.id}">Hapus</button>
      </td>
    `;
    tableBody.appendChild(row);
  });
  
  handleEditAndDeleteButtons();
});

function handleEditAndDeleteButtons() {
  // Menangani tombol Edit dan Hapus
  const editBtns = document.querySelectorAll('.editBtn');
  const deleteBtns = document.querySelectorAll('.deleteBtn');
  
  editBtns.forEach(button => {
    button.addEventListener('click', (e) => {
      const docId = e.target.dataset.id;
      getDoc(doc(db, 'preOrderData', docId)).then(docSnap => {
        const data = docSnap.data();
        populateEditModal(data, docId);
      });
    });
  });

  deleteBtns.forEach(button => {
    button.addEventListener('click', (e) => {
      const docId = e.target.dataset.id;
      showDeleteModal(docId);
    });
  });
}

function populateEditModal(data, docId) {
  // Isi modal edit dengan data yang sesuai
  document.getElementById('editId').value = docId;
  document.getElementById('editPeriode').value = data.periode;
  document.getElementById('editNamaPT').value = data.namaPT;
  document.getElementById('editSupplier').value = data.supplier;
  document.getElementById('editPreOrder').value = data.preOrder;
  document.getElementById('editInvoice').value = data.invoice;
  document.getElementById('editTglInvoice').value = data.tglInvoice;
  document.getElementById('editTotal').value = data.total;
  document.getElementById('editKeterangan').value = data.keterangan;
  document.getElementById('editFaktur').value = data.faktur;
  document.getElementById('editModal').classList.remove('hidden');
}

function showDeleteModal(docId) {
  document.getElementById('deleteModal').classList.remove('hidden');
  document.getElementById('confirmDelete').onclick = () => {
    deleteDoc(doc(db, 'preOrderData', docId)).then(() => {
      document.getElementById('deleteModal').classList.add('hidden');
    });
  };
  document.getElementById('cancelDelete').onclick = () => {
    document.getElementById('deleteModal').classList.add('hidden');
  };
}
