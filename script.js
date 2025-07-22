document.addEventListener('DOMContentLoaded', function () {
    // === গ্লোবাল ভ্যারিয়েবল ও স্টেট ===
    let allCashbooks = [], categories = [], currentCashbookId = null;

    // === HTML এলিমেন্টস ===
    const pageHome = document.getElementById('page-home'), pageDetails = document.getElementById('page-details'), pageCategories = document.getElementById('page-categories'), pageAbout = document.getElementById('page-about'), fab = document.getElementById('fab-add-cashbook'), addCashbookModal = new bootstrap.Modal(document.getElementById('addCashbookModal')), offcanvasEl = document.getElementById('offcanvasNavbar'), toastContainer = document.querySelector('.toast-container');

    // === নতুন Helper ফাংশন: Toast দেখানো ===
    function showToast(message, type = 'success') { const toastEl = document.createElement('div'); toastEl.className = `toast align-items-center text-white bg-${type} border-0`; toastEl.innerHTML = `<div class="d-flex"><div class="toast-body">${message}</div><button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast"></button></div>`; toastContainer.appendChild(toastEl); const toast = new bootstrap.Toast(toastEl, { delay: 2000 }); toast.show(); toastEl.addEventListener('hidden.bs.toast', () => toastEl.remove()); }
    
    // === অ্যাপ ইনিশিয়ালাইজেশন ===
    function init() { allCashbooks = JSON.parse(localStorage.getItem('cashbooks')) || []; const storedCategories = JSON.parse(localStorage.getItem('categories')); if (!storedCategories || storedCategories.length === 0) { categories = ['Salary', 'Food', 'Transport', 'Others']; saveData(); } else { categories = storedCategories; } offcanvasEl.addEventListener('show.bs.offcanvas', () => fab.style.display = 'none'); offcanvasEl.addEventListener('hide.bs.offcanvas', () => { if (pageHome.classList.contains('active')) fab.style.display = 'flex'; }); showPage('page-home'); }

    // === নেভিগেশন ও ডেটা ম্যানেজমেন্ট (অপরিবর্তিত) ===
    function showPage(pageId) { [pageHome, pageDetails, pageCategories, pageAbout].forEach(p => p.classList.remove('active')); const pageToShow = document.getElementById(pageId); if (pageToShow) pageToShow.classList.add('active'); fab.style.display = (pageId === 'page-home') ? 'flex' : 'none'; const offcanvas = bootstrap.Offcanvas.getInstance(offcanvasEl); if (offcanvas && offcanvas._isShown) offcanvas.hide(); if (pageId === 'page-home') loadCashbooks(); if (pageId === 'page-categories') loadAndDisplayCategories(); if (pageId === 'page-about') loadAboutPage(); }
    function saveData() { localStorage.setItem('cashbooks', JSON.stringify(allCashbooks)); localStorage.setItem('categories', JSON.stringify(categories)); }
    
    // === হোম পেজ ও ক্যাশমবুক তৈরি (অপরিবর্তিত) ===
    function loadCashbooks() { let content = ''; if (allCashbooks.length === 0) { content = `<div class="col-12 text-center mt-5"><p class="text-muted fs-4">কোনো ক্যাশবুক নেই।</p><p>শুরু করতে নিচের '+' বাটনে ক্লিক করুন।</p></div>`; } else { allCashbooks.forEach((book, index) => { const { totalIn, totalOut, balance } = calculateTotals(book.transactions); content += `<div class="col-md-6 col-lg-4"><div class="card card-link h-100" onclick="window.app.openCashbookDetailsPage(${index})"><div class="card-body"><h5 class="card-title text-primary">${book.name}</h5><p class="mb-1 text-success"><strong>Cash In:</strong> ${totalIn.toFixed(2)}</p><p class="mb-1 text-danger"><strong>Cash Out:</strong> ${totalOut.toFixed(2)}</p><hr><p class="mb-0 fs-5"><strong>অবশিষ্ট:</strong> <span class="fw-bold ${balance >= 0 ? 'text-success' : 'text-danger'}">${balance.toFixed(2)}</span></p></div></div></div>`; }); } pageHome.innerHTML = `<div class="row gy-4">${content}</div>`; }
    function createCashbook() { const input = document.getElementById('newCashbookNameInput'); const name = input.value.trim(); if (!name) return alert('অনুগ্রহ করে একটি নাম দিন।'); allCashbooks.push({ name, transactions: [] }); saveData(); loadCashbooks(); addCashbookModal.hide(); input.value = ''; }
    
    // === ক্যাটাগরি পেজ ===
    function loadAndDisplayCategories() { let listItems = ''; categories.forEach(cat => listItems += `<li class="list-group-item d-flex justify-content-between align-items-center">${cat}${cat !== 'Others' ? `<button class="btn btn-outline-danger btn-sm" onclick="window.app.removeCategory('${cat}')">Remove</button>` : `<span class="badge bg-secondary">Default</span>`}</li>`); pageCategories.innerHTML = `<h3>Manage Categories</h3><p class="text-muted">Add or remove categories for transactions.</p><div class="card mb-4"><div class="card-body"><h5 class="card-title">Add New Category</h5><div class="input-group"><input type="text" id="newCategoryNameInput" class="form-control" placeholder="Enter new category name"><button class="btn btn-primary" id="add-category-btn" onclick="window.app.addCategory()">Add Category</button></div></div></div><div class="card"><div class="card-header fw-bold">Existing Categories</div><ul class="list-group list-group-flush">${listItems}</ul></div>`; }
    function addCategory() { const btn = document.getElementById('add-category-btn'); const input = document.getElementById('newCategoryNameInput'); const name = input.value.trim(); if (!name) { showToast('Category name cannot be empty.', 'danger'); return; } if (categories.map(c => c.toLowerCase()).includes(name.toLowerCase())) { showToast('This category already exists.', 'danger'); return; } const originalText = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Adding...`; setTimeout(() => { categories.push(name); saveData(); loadAndDisplayCategories(); showToast('Category Added!', 'success'); }, 500); }
    function removeCategory(name) { if (name === 'Others') return alert('"Others" category cannot be deleted.'); if (confirm(`আপনি কি "${name}" ক্যাটাগরিটি ডিলেট করতে চান?`)) { categories = categories.filter(cat => cat !== name); saveData(); loadAndDisplayCategories(); showToast('Category Removed', 'warning'); } }

    // === ক্যাশবুক ডিটেইলস পেজ (অপরিবর্তিত) ===
    function openCashbookDetailsPage(id) { currentCashbookId = id; const book = allCashbooks[id]; let categoryOptions = `<option value="" disabled selected>Choose a category...</option>` + categories.map(cat => `<option value="${cat}">${cat}</option>`).join(''); pageDetails.innerHTML = `<div class="d-flex align-items-center mb-4"><button class="btn btn-outline-secondary me-3" onclick="window.app.showPage('page-home')"><i class="bi bi-arrow-left"></i></button><h2 class="fw-bold text-primary mb-0" id="cashbook-title">${book.name}</h2><div class="ms-auto"><div class="dropdown d-inline-block"><button class="btn btn-light border dropdown-toggle" type="button" data-bs-toggle="dropdown"><i class="bi bi-three-dots-vertical"></i></button><ul class="dropdown-menu dropdown-menu-end"><li><a class="dropdown-item" href="#" onclick="window.app.editCashbookName()"><i class="bi bi-pencil-fill me-2"></i>Edit Name</a></li><li><a class="dropdown-item" href="#" onclick="window.app.printCashbook()"><i class="bi bi-printer-fill me-2"></i>Print</a></li><li><hr class="dropdown-divider"></li><li><a class="dropdown-item text-danger" href="#" onclick="window.app.deleteCashbook()"><i class="bi bi-trash-fill me-2"></i>Delete</a></li></ul></div></div></div><div class="card mb-4"><div class="card-body p-4"><h5 class="card-title mb-3">Add New Transaction</h5><div class="transaction-switch mb-3" id="switch-container"><button class="btn btn-out" onclick="window.app.setTransactionType('out')">Cash Out</button><button class="btn btn-in" onclick="window.app.setTransactionType('in')">Cash In</button></div><input type="hidden" id="transactionType" value="out"><div class="mb-3"><input type="number" id="amount" class="form-control" placeholder="টাকার পরিমাণ"></div><div class="mb-3"><select id="category" class="form-select">${categoryOptions}</select></div><div class="mb-3"><input type="date" id="date" class="form-control"></div><div class="mb-3"><textarea id="notes" class="form-control" rows="2" placeholder="মন্তব্য (অপশনাল)"></textarea></div><button class="btn btn-primary w-100 py-2" id="save-transaction-btn" onclick="window.app.addTransaction()">Save Transaction</button></div></div><h5 class="fw-bold">Transaction History</h5><div class="table-responsive"><table class="table table-striped table-hover align-middle"><thead><tr><th>তারিখ</th><th>ক্যাটাগরি</th><th>ধরন</th><th class="text-end">পরিমাণ</th><th>মন্তব্য</th></tr></thead><tbody id="transaction-list"></tbody><tfoot id="transaction-summary" class="fw-bold"></tfoot></table></div>`; document.getElementById('date').valueAsDate = new Date(); setTransactionType('out'); renderTransactions(); showPage('page-details'); }
    function setTransactionType(type) { document.getElementById('transactionType').value = type; document.getElementById('switch-container').className = `transaction-switch mb-3 ${type}-active`; }
    function addTransaction() { const btn = document.getElementById('save-transaction-btn'); const category = document.getElementById('category').value; const amount = parseFloat(document.getElementById('amount').value); if (!category) { showToast('Please choose a category.', 'danger'); return; } if (isNaN(amount) || amount <= 0 || !document.getElementById('date').value) { showToast('Please enter a valid amount and date.', 'danger'); return; } const originalText = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner-border spinner-border-sm"></span> Saving...`; setTimeout(() => { allCashbooks[currentCashbookId].transactions.push({type: document.getElementById('transactionType').value, amount, category, date: document.getElementById('date').value, notes: document.getElementById('notes').value.trim()}); saveData(); renderTransactions(); document.getElementById('amount').value = ''; document.getElementById('notes').value = ''; btn.disabled = false; btn.innerHTML = originalText; showToast('Transaction Saved!', 'success'); }, 500); }
    function renderTransactions() { const list = document.getElementById('transaction-list'), summary = document.getElementById('transaction-summary'), book = allCashbooks[currentCashbookId]; list.innerHTML = book.transactions.length === 0 ? '<tr><td colspan="5" class="text-center p-4 text-muted">কোনো লেনদেন নেই।</td></tr>' : [...book.transactions].sort((a, b) => new Date(b.date) - new Date(a.date)).map(t => `<tr><td>${new Date(t.date).toLocaleDateString('bn-BD')}</td><td>${t.category}</td><td class="fw-bold ${t.type === 'in' ? 'text-success' : 'text-danger'}">${t.type === 'in' ? 'Cash In' : 'Cash Out'}</td><td class="text-end">${t.amount.toFixed(2)}</td><td>${t.notes || ''}</td></tr>`).join(''); const { totalIn, totalOut, balance } = calculateTotals(book.transactions); summary.innerHTML = `<tr><td colspan="3" class="text-end text-success">Total Cash In:</td><td class="text-end text-success">${totalIn.toFixed(2)}</td><td></td></tr><tr><td colspan="3" class="text-end text-danger">Total Cash Out:</td><td class="text-end text-danger">${totalOut.toFixed(2)}</td><td></td></tr><tr><td colspan="3" class="text-end border-top pt-2">Balance:</td><td class="text-end border-top pt-2 ${balance >= 0 ? 'text-success' : 'text-danger'}">${balance.toFixed(2)}</td><td></td></tr>`; }
    function calculateTotals(transactions) { const totalIn = transactions.filter(t => t.type === 'in').reduce((sum, t) => sum + t.amount, 0); const totalOut = transactions.filter(t => t.type === 'out').reduce((sum, t) => sum + t.amount, 0); return { totalIn, totalOut, balance: totalIn - totalOut }; }
    function editCashbookName() { const newName = prompt('Enter new name:', allCashbooks[currentCashbookId].name); if (newName && newName.trim()) { allCashbooks[currentCashbookId].name = newName.trim(); saveData(); document.getElementById('cashbook-title').textContent = newName.trim(); loadCashbooks(); } }
    function deleteCashbook() { if (confirm(`আপনি কি "${allCashbooks[currentCashbookId].name}" ক্যাশবুকটি ডিলেট করতে নিশ্চিত?`)) { allCashbooks.splice(currentCashbookId, 1); saveData(); showPage('page-home'); } }
    function loadAboutPage() { pageAbout.innerHTML = `<div class="card"><div class="card-body p-4 text-center"><img src="https://i.ibb.co/nLnSDB1/android-chrome-192x192.png" alt="Logo" style="width: 80px;" class="mb-3"><h2 class="card-title">My Cashbook</h2><p class="text-muted">Version 1.0.0</p><hr><p class="lead">This is a simple, client-side cashbook application built with Bootstrap and JavaScript.</p><p>It helps you manage your daily income and expenses efficiently. All your data is securely stored in your browser's local storage.</p><p class="mt-4"><strong>Developed by:</strong> Tnayem48</p></div></div>`; }

    // === নতুন এবং সম্পূর্ণ কার্যকরী প্রিন্ট ফাংশন ===
    function printCashbook() {
        const book = allCashbooks[currentCashbookId];
        const printContainer = document.getElementById('print-container');
        const { totalIn, totalOut, balance } = calculateTotals(book.transactions);
        
        const rows = [...book.transactions].sort((a, b) => new Date(a.date) - new Date(b.date))
            .map(t => `
                <tr>
                    <td>${new Date(t.date).toLocaleDateString('en-CA')}</td>
                    <td>${t.category}</td>
                    <td>${t.type === 'in' ? 'Cash In' : 'Cash Out'}</td>
                    <td style="text-align: right;">${t.amount.toFixed(2)}</td>
                </tr>
            `).join('');

        const reportHTML = `
            <div style="font-family: Arial, sans-serif;">
                <div style="text-align: center; border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px;">
                    <h1 style="margin: 0; color: #0d6efd;">CashBook</h1>
                    <h2 style="margin: 5px 0; color: #343a40;">${book.name}</h2>
                    <p style="color: #6c757d; font-size: 12px;">Report Generated on: ${new Date().toLocaleString('en-US')}</p>
                </div>
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Date</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Category</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: left; background-color: #f8f9fa;">Type</th>
                            <th style="padding: 8px; border: 1px solid #ddd; text-align: right; background-color: #f8f9fa;">Amount</th>
                        </tr>
                    </thead>
                    <tbody>${rows}</tbody>
                    <tfoot style="font-weight: bold;">
                        <tr><td colspan="3" style="text-align: right; padding: 8px; padding-top: 15px;">Total Cash In:</td><td style="text-align: right; color: green; padding: 8px; padding-top: 15px;">${totalIn.toFixed(2)}</td></tr>
                        <tr><td colspan="3" style="text-align: right; padding: 8px;">Total Cash Out:</td><td style="text-align: right; color: red; padding: 8px;">${totalOut.toFixed(2)}</td></tr>
                        <tr><td colspan="3" style="text-align: right; padding: 8px; border-top: 2px solid #343a40;">Balance:</td><td style="text-align: right; padding: 8px; border-top: 2px solid #343a40; color: ${balance >= 0 ? 'green' : 'red'};">${balance.toFixed(2)}</td></tr>
                    </tfoot>
                </table>
                <footer style="text-align: center; margin-top: 30px; padding-top: 15px; border-top: 1px solid #ddd; font-size: 12px;">
                    all Rights reserve © Tnayem48
                </footer>
            </div>
        `;
        
        printContainer.innerHTML = reportHTML;
        window.print();
        printContainer.innerHTML = '';
    }

    // === ফাংশনগুলোকে গ্লোবালি অ্যাক্সেসযোগ্য করা ===
    window.app = { showPage, createCashbook, openCashbookDetailsPage, editCashbookName, deleteCashbook, addTransaction, setTransactionType, addCategory, removeCategory, printCashbook };

    // অ্যাপ শুরু করুন
    init();
});