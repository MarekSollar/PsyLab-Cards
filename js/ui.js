const UI = {
    showToast: function(msg, type = 'success') {
        const toast = document.createElement('div');
        const icon = type === 'success' ? 'check-circle' : 'alert-circle';
        const color = type === 'success' ? 'text-green-400' : 'text-red-400';
        
        toast.className = 'fixed bottom-8 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-6 py-3 rounded-2xl shadow-xl z-50 flex items-center gap-2 animate-slide-up';
        toast.innerHTML = `<i data-feather="${icon}" class="w-5 h-5 ${color}"></i><span>${msg}</span>`;
        document.body.appendChild(toast);
        feather.replace();
        setTimeout(() => toast.remove(), 2000);
    },
    
    showConfirm: function(title, message, onConfirm) {
        document.getElementById('confirmTitle').innerText = title;
        document.getElementById('confirmMessage').innerHTML = message;
        document.getElementById('confirmModal').style.display = 'flex';
        
        window.confirmCallback = onConfirm;
    },
    
    closeConfirm: function() {
        document.getElementById('confirmModal').style.display = 'none';
        window.confirmCallback = null;
    },
    
    formatDate: function(dateString) {
        const date = new Date(dateString);
        return date.toLocaleDateString('cs-CZ', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    }
};

window.executeConfirmedAction = function() {
    if (window.confirmCallback) {
        window.confirmCallback();
        UI.closeConfirm();
    }
};

window.closeConfirmModal = UI.closeConfirm;