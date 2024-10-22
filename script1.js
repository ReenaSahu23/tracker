// Utility function to safely get data from localStorage
function getLocalStorageItem(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value ? JSON.parse(value) : defaultValue;
}

function getLocalStorageNumber(key, defaultValue) {
    const value = localStorage.getItem(key);
    return value ? parseFloat(value) : defaultValue;
}

// Initialize totals and transactions from localStorage
let transactions = getLocalStorageItem('transactions', []);
let totalIncome = getLocalStorageNumber('totalIncome', 0);
let totalExpenses = getLocalStorageNumber('totalExpenses', 0);
let monthlyExpenses = getLocalStorageItem('monthlyExpenses', {});

const incomeDisplay = document.getElementById('total-income');
const expensesDisplay = document.getElementById('total-expenses');
const balanceDisplay = document.getElementById('balance');
const transactionList = document.getElementById('transaction-list');

// Handle adding a new transaction
document.getElementById('expense-form').addEventListener('submit', function (e) {
    e.preventDefault();

    const type = document.getElementById('transaction-type').value;
    const title = document.getElementById('title').value;
    const category = document.getElementById('category').value.toLowerCase();
    const amount = parseFloat(document.getElementById('amount').value);
    const date = document.getElementById('date').value;

    // Basic validation
    if (!title || !category || isNaN(amount) || amount <= 0 || !date) {
        alert('Please fill all fields correctly with valid values.');
        return;
    }

    // Add transaction to array
    const transaction = { type, title, category, amount, date };
    transactions.push(transaction);

    // Update totals
    if (type === 'expense') {
        totalExpenses += amount;
        updateMonthlyExpenses(date, amount);
    } else {
        totalIncome += amount;
    }

    // Save to localStorage and update UI
    saveToLocalStorage();
    updateUI();
    document.getElementById('expense-form').reset();
});

// Function to track monthly expenses
function updateMonthlyExpenses(date, amount) {
    const month = new Date(date).toLocaleString('default', { month: 'long' });

    // Validate month input
    if (typeof month !== 'string' || !/^[a-zA-Z]+$/.test(month)) {
        throw new Error('Invalid month value');
    }

    if (!monthlyExpenses[month]) {
        monthlyExpenses[month] = 0;
        
    }
    monthlyExpenses[month] = Math.max(0, monthlyExpenses[month] + amount);

    saveToLocalStorage();
}

// Update the UI after a new transaction
function updateUI() {
    incomeDisplay.innerText = `₹${totalIncome.toFixed(2)}`;
    expensesDisplay.innerText = `₹${totalExpenses.toFixed(2)}`;
    balanceDisplay.innerText = `₹${(totalIncome - totalExpenses).toFixed(2)}`;

    transactionList.innerHTML = ''; // Clear the transaction list
    transactions.forEach((transaction, index) => {
        const row = document.createElement('tr');

        const dateCell = document.createElement('td');
        dateCell.textContent = transaction.date;

        const titleCell = document.createElement('td');
        titleCell.textContent = transaction.title;

        const categoryCell = document.createElement('td');
        categoryCell.textContent = transaction.category;

        const amountCell = document.createElement('td');
        amountCell.style.color = transaction.type === 'expense' ? 'red' : 'green';
        amountCell.textContent = `₹${transaction.amount}`;

        const typeCell = document.createElement('td');
        typeCell.textContent = transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1);

        const actionCell = document.createElement('td');
        const editBtn = document.createElement('span');
        editBtn.textContent = 'Edit';
        editBtn.className = 'edit';
        editBtn.onclick = () => editTransaction(index);

        const deleteBtn = document.createElement('span');
        deleteBtn.textContent = 'Delete';
        deleteBtn.className = 'delete';
        deleteBtn.onclick = () => deleteTransaction(index);

        actionCell.append(editBtn, ' / ', deleteBtn);

        row.append(dateCell, titleCell, categoryCell, amountCell, typeCell, actionCell);
        transactionList.appendChild(row);
    });

    // Update charts
    updateCharts();
}

// Edit a transaction
function editTransaction(index) {
    const transaction = transactions[index];
    document.getElementById('transaction-type').value = transaction.type;
    document.getElementById('title').value = transaction.title;
    document.getElementById('category').value = transaction.category;
    document.getElementById('amount').value = transaction.amount;
    document.getElementById('date').value = transaction.date;

    // Remove the transaction being edited
    deleteTransaction(index);
}

// Delete a transaction
function deleteTransaction(index) {
    const transaction = transactions[index];

    // Update totals based on the type of transaction being deleted
    if (transaction.type === 'expense') {
        totalExpenses -= transaction.amount;
        updateMonthlyExpenses(transaction.date, -transaction.amount);
    } else {
        totalIncome -= transaction.amount;
    }

    // Remove the transaction from the array
    transactions.splice(index, 1);
    saveToLocalStorage(); // Save changes after deleting

    // Update UI
    updateUI();
}

// Save data to localStorage
function saveToLocalStorage() {
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('totalIncome', totalIncome.toString());
    localStorage.setItem('totalExpenses', totalExpenses.toString());
    localStorage.setItem('monthlyExpenses', JSON.stringify(monthlyExpenses));
}

// Initialize Charts (use Chart.js)
const pieCtx = document.getElementById('expensePieChart').getContext('2d');
const barCtx = document.getElementById('expenseBarChart').getContext('2d');

let pieChart = new Chart(pieCtx, {
    type: 'pie',
    data: {
        labels: ['Food', 'Rent', 'Transportation'],
        datasets: [{
            data: [0, 0, 0],
            backgroundColor: ['#27ae60', '#E74C3C', '#F39C12']
        }]
    }
});

let barChart = new Chart(barCtx, {
    type: 'bar',
    data: {
        labels: [], // Month labels will be updated dynamically
        datasets: [{
            label: 'Expenses',
            data: [], // Expense data will be updated dynamically
            backgroundColor: '#1B3A4B'
        }]
    }
});

// Update charts dynamically
function updateCharts() {
    const categorySums = { food: 0, rent: 0, transportation: 0 };

    transactions.forEach(transaction => {
        if (transaction.type === 'expense' && categorySums[transaction.category] !== undefined) {
            categorySums[transaction.category] += transaction.amount;
        }
    });

    // Update pie chart
    pieChart.data.datasets[0].data = [
        categorySums.food,
        categorySums.rent,
        categorySums.transportation
    ];
    pieChart.update();

    // Update bar chart with monthly data
    const months = Object.keys(monthlyExpenses);
    const expensesByMonth = Object.values(monthlyExpenses);

    barChart.data.labels = months;
    barChart.data.datasets[0].data = expensesByMonth;
    barChart.update();
}

// Load UI on page refresh
updateUI();

// Reset data functionality
document.querySelector('.reset').addEventListener('click', function() {
    // Clear variables and localStorage
    transactions = [];
    totalIncome = totalExpenses = 0;
    monthlyExpenses = {};
    localStorage.clear();

    // Update UI and reset charts
    updateUI();
    pieChart.data.datasets[0].data = [0, 0, 0];
    barChart.data.labels = [];
    barChart.data.datasets[0].data = [];
    pieChart.update();
    barChart.update();
});
