document.addEventListener('DOMContentLoaded', () => {
    const ebookUploadForm = document.getElementById('ebook-upload-form');
    const ebookList = document.getElementById('ebook-list');
    const UPI_ID = 'saso84035@okhdfcbank'; // User's UPI ID

    let ebooks = JSON.parse(localStorage.getItem('ebooks')) || [];

    function renderEbooks() {
        ebookList.innerHTML = '';
        if (ebooks.length === 0) {
            ebookList.innerHTML = '<p>No ebooks available yet. Upload one!</p>';
            return;
        }

        ebooks.forEach((ebook, index) => {
            const ebookItem = document.createElement('div');
            ebookItem.classList.add('ebook-item');

            const coverImage = document.createElement('img');
            coverImage.src = ebook.coverPage;
            coverImage.alt = ebook.title + ' Cover';
            ebookItem.appendChild(coverImage);

            const ebookDetails = document.createElement('div');
            ebookDetails.classList.add('ebook-details');

            const title = document.createElement('h3');
            title.textContent = ebook.title;
            ebookDetails.appendChild(title);

            const author = document.createElement('p');
            author.textContent = `Author: ${ebook.author}`;
            ebookDetails.appendChild(author);

            const description = document.createElement('p');
            description.textContent = ebook.description;
            ebookDetails.appendChild(description);

            const price = document.createElement('p');
            price.classList.add('price');
            if (ebook.originalPrice && ebook.price < ebook.originalPrice) {
                price.innerHTML = `<span class="original-price">₹${ebook.originalPrice.toFixed(2)}</span> ₹${ebook.price.toFixed(2)}`;
            } else {
                price.textContent = `Price: ₹${ebook.price.toFixed(2)}`;
            }
            ebookDetails.appendChild(price);

            const buyButton = document.createElement('button');
            buyButton.classList.add('buy-button');
            buyButton.textContent = 'Buy Now';
            buyButton.addEventListener('click', () => showPaymentOptions(ebook));
            ebookDetails.appendChild(buyButton);

            const deleteButton = document.createElement('button');
            deleteButton.classList.add('delete-button');
            deleteButton.textContent = 'Delete';
            deleteButton.addEventListener('click', () => deleteEbook(index));
            ebookDetails.appendChild(deleteButton);

            ebookItem.appendChild(ebookDetails);
            ebookList.appendChild(ebookItem);
        });
    }

    function deleteEbook(index) {
        console.log('Attempting to delete ebook at index:', index);
        if (confirm('Are you sure you want to delete this ebook?')) {
            const deletedEbook = ebooks.splice(index, 1);
            console.log('Ebook removed from array:', deletedEbook);
            localStorage.setItem('ebooks', JSON.stringify(ebooks));
            console.log('Local storage updated. Current ebooks:', JSON.parse(localStorage.getItem('ebooks')));
            renderEbooks();
            alert('Ebook deleted successfully!');
        } else {
            console.log('Ebook deletion cancelled.');
        }
    }

    function showPaymentOptions(ebook) {
        const paymentOptionsDiv = document.createElement('div');
        paymentOptionsDiv.classList.add('payment-options');
        paymentOptionsDiv.innerHTML = `
            <h4>Choose Payment Method for ${ebook.title}:</h4>
            <button class="payment-btn" data-app="gpay">Google Pay</button>
            <button class="payment-btn" data-app="phonepe">PhonePe</button>
            <button class="payment-btn" data-app="paytm">Paytm</button>
            <button class="payment-btn" data-app="qr">Scan QR</button>
        `;
        
        // Remove any existing payment options for other ebooks
        document.querySelectorAll('.payment-options').forEach(el => el.remove());
        
        // Append payment options below the ebook item
        const ebookItem = ebookList.querySelector(`.ebook-item:nth-child(${ebooks.indexOf(ebook) + 1})`);
        if (ebookItem) {
            ebookItem.appendChild(paymentOptionsDiv);
        }

        paymentOptionsDiv.querySelectorAll('.payment-btn').forEach(button => {
            button.addEventListener('click', (event) => {
                const app = event.target.dataset.app;
                initiatePayment(ebook, app);
            });
        });
    }

    function initiatePayment(ebook, app) {
        const amount = ebook.price.toFixed(2);
        const upiUrl = `upi://pay?pa=${UPI_ID}&pn=Ebook%20Store&am=${amount}&cu=INR&tn=Ebook%20Purchase`;

        if (app === 'qr') {
            const modal = document.getElementById('qr-code-modal');
            const qrCodeDiv = document.getElementById('qr-code');
            const qrTitle = document.getElementById('qr-title');
            const qrAmount = document.getElementById('qr-amount');
            const closeButton = document.querySelector('.close-button');

            qrCodeDiv.innerHTML = '';
            new QRCode(qrCodeDiv, {
                text: upiUrl,
                width: 256,
                height: 256,
            });

            qrTitle.textContent = `Scan to Pay`;
            qrAmount.textContent = `Amount: ₹${amount}`;
            modal.style.display = 'block';

            closeButton.onclick = function() {
                modal.style.display = 'none';
            }

            window.onclick = function(event) {
                if (event.target == modal) {
                    modal.style.display = 'none';
                }
            }
        } else {
            let url = '';
            switch (app) {
                case 'gpay':
                    url = `upi://pay?pa=${UPI_ID}&pn=Ebook%20Store&am=${amount}&cu=INR`;
                    break;
                case 'phonepe':
                    url = `phonepe://pay?pa=${UPI_ID}&pn=Ebook%20Store&am=${amount}&cu=INR`;
                    break;
                case 'paytm':
                    url = `paytmmp://pay?pa=${UPI_ID}&pn=Ebook%20Store&am=${amount}&cu=INR`;
                    break;
                default:
                    alert('Invalid payment app selected.');
                    return;
            }
            window.location.href = url;
        }
    }

    ebookUploadForm.addEventListener('submit', (event) => {
        event.preventDefault();

        const title = document.getElementById('title').value;
        const author = document.getElementById('author').value;
        const description = document.getElementById('description').value;
        const originalPrice = parseFloat(document.getElementById('original-price').value);
        const priceInput = document.getElementById('price');
        const price = priceInput.value ? parseFloat(priceInput.value) : originalPrice;
        const coverPageFile = document.getElementById('cover-page').files[0];
        const pdfFile = document.getElementById('pdf-file').files[0];

        if (pdfFile.size > 100 * 1024 * 1024) { // 100 MB limit
            alert('PDF file size exceeds 100 MB limit.');
            return;
        }

        const reader = new FileReader();
        reader.onload = (e) => {
            const coverPageBase64 = e.target.result;

            const newEbook = {
                title,
                author,
                description,
                originalPrice: originalPrice,
                price: price,
                coverPage: coverPageBase64,
                pdfFile: URL.createObjectURL(pdfFile) // Store as object URL for demonstration
            };

            ebooks.push(newEbook);
            localStorage.setItem('ebooks', JSON.stringify(ebooks));
            renderEbooks();
            ebookUploadForm.reset();
            alert('Ebook uploaded successfully!');
        };
        reader.readAsDataURL(coverPageFile);
    });

    renderEbooks();
});