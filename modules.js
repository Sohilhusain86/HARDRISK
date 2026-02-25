/**
 * DATA MODULE
 * یہ آپ کی فائلوں کا مقامی ڈیٹا بیس ہے۔ 
 * تصاویر کی بنیاد پر فہرست تیار کی گئی ہے۔
 */

const DataModule = {
    items: [
        // Audios (Naats/Kalam from images)
        { id: 'a1', title: 'Aa Jaiye Akhtar Raza - Latest Kalam', type: 'audio', ext: '.mp3' },
        { id: 'a2', title: 'Aala Hazrat Hamari Jaan Hai', type: 'audio', ext: '.mp3' },
        { id: 'a3', title: 'Aap Par Lakho Darud', type: 'audio', ext: '.mp3' },
        { id: 'a4', title: 'Har Waqt Tasawar Main', type: 'audio', ext: '.mp3' },
        { id: 'a5', title: 'Kalam Mumtaz Qadri Full Janaza', type: 'audio', ext: '.mp3' },
        { id: 'a6', title: 'Pohchu dare sarkar sabir raza', type: 'audio', ext: '.mp3' },
        
        // PDFs (Books/Speeches from images)
        { id: 'p1', title: 'Kamalat e Mustafa', type: 'pdf', ext: '.pdf' },
        { id: 'p2', title: 'Momin-ki-Namaz-Urdu', type: 'pdf', ext: '.pdf' },
        { id: 'p3', title: 'آسان تقریریں (مکمل 4 حصہ)', type: 'pdf', ext: '.pdf' },
        { id: 'p4', title: 'اسلامی اخلاق و آداب (صدر الشریعہ)', type: 'pdf', ext: '.pdf' },
        { id: 'p5', title: 'دلچسپ معلومات سوالا جوابا', type: 'pdf', ext: '.pdf' },
        { id: 'p6', title: 'دور حاضر کی تقریریں', type: 'pdf', ext: '.pdf' },
        { id: 'p7', title: 'موت کیا ہے از جلال الدین سیوطی', type: 'pdf', ext: '.pdf' },
        { id: 'p8', title: 'jahannam-main-lay-janay-walay-amaal', type: 'pdf', ext: '.pdf' }
    ],

    // Function to filter data
    getFilteredData(filterType, searchQuery) {
        return this.items.filter(item => {
            const matchesType = filterType === 'all' || item.type === filterType;
            const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase());
            return matchesType && matchesSearch;
        });
    }
};
