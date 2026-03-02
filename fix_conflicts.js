const fs = require('fs');

const files = [
    "frontend/src/pages/BookingInfoPage.tsx",
    "frontend/src/pages/MyBookingsPage.tsx",
    "frontend/src/pages/PaymentPage.tsx"
];

for (const relPath of files) {
    if (fs.existsSync(relPath)) {
        let content = fs.readFileSync(relPath, 'utf8');
        content = content.replace(/<<<<<<< HEAD\r?\n([\s\S]*?)=======\r?\n[\s\S]*?>>>>>>> [a-f0-9]+[^\n]*\r?\n/g, '$1');
        fs.writeFileSync(relPath, content);
        console.log(`Fixed ${relPath}`);
    } else {
        console.log(`File not found: ${relPath}`);
    }
}
