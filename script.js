class PDFConverter {
    constructor() {
        this.files = [];
        this.convertedFiles = [];
        this.initializeElements();
        this.bindEvents();
        this.initializeTheme();
        // this.initializeModal();
        this.checkLibraries();
    }

    initializeElements() {
        this.dropArea = document.getElementById('dropArea');
        this.fileInput = document.getElementById('fileInput');
        this.fileListContainer = document.getElementById('fileListContainer');
        this.convertBtn = document.getElementById('convertBtn');
        this.clearBtn = document.getElementById('clearBtn');
        this.mergeBtn = document.getElementById('mergeBtn');
        this.progressSection = document.getElementById('progressSection');
        this.progressFill = document.getElementById('progressFill');
        this.progressText = document.getElementById('progressText');
        this.resultsSection = document.getElementById('resultsSection');
        this.resultsContainer = document.getElementById('resultsContainer');
        this.toggleAdvanced = document.getElementById('toggleAdvanced');
        this.advancedSettings = document.getElementById('advancedSettings');
        this.themeToggle = document.getElementById('theme-icon');
        this.watermarkCheckbox = document.getElementById('addWatermark');
        this.watermarkText = document.getElementById('watermarkText');
    }

    initializeModal() {
        if (!document.getElementById('progressModal')) {
            const modal = document.createElement('div');
            modal.id = 'progressModal';
            modal.className = 'progress-modal';
            modal.innerHTML = `
                <div class="modal-content">
                    <button class="close-btn">&times;</button>
                    <h3>Processing Files</h3>
                    <div class="progress-bar">
                        <div id="modalProgressFill" class="progress-fill"></div>
                    </div>
                    <p id="modalProgressText">Converting...</p>
                </div>
            `;
            document.body.appendChild(modal);

            modal.addEventListener('click', (e) => {
                if (e.target === modal || e.target.classList.contains('close-btn')) {
                    modal.classList.remove('active');
                }
            });
        }
    }

    checkLibraries() {
        const missing = [];
        if (typeof window.jspdf === 'undefined') missing.push('jsPDF');
        if (typeof XLSX === 'undefined') missing.push('SheetJS');
        if (missing.length > 0) {
            console.warn('Missing libraries:', missing);
        }
    }

    bindEvents() {
        if (this.dropArea) {
            this.dropArea.addEventListener('click', () => this.fileInput.click());
            this.dropArea.addEventListener('dragover', (e) => this.handleDragOver(e));
            this.dropArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
            this.dropArea.addEventListener('drop', (e) => this.handleDrop(e));
        }

        if (this.fileInput) {
            this.fileInput.addEventListener('change', (e) => this.handleFileSelect(e));
        }

        if (this.convertBtn) {
            this.convertBtn.addEventListener('click', () => this.convertFiles());
        }

        if (this.clearBtn) {
            this.clearBtn.addEventListener('click', () => this.clearAllFiles());
        }

        if (this.mergeBtn) {
            this.mergeBtn.addEventListener('click', () => this.mergePDFs());
        }

        if (this.toggleAdvanced) {
            this.toggleAdvanced.addEventListener('click', () => this.toggleAdvancedSettings());
        }

        if (this.watermarkCheckbox && this.watermarkText) {
            this.watermarkCheckbox.addEventListener('change', (e) => {
                this.watermarkText.disabled = !e.target.checked;
            });
        }

        if (this.themeToggle) {
            this.themeToggle.addEventListener('click', () => this.toggleTheme());
        }
    }

    initializeTheme() {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            document.body.classList.add('dark-theme');
            if (this.themeToggle) {
                this.themeToggle.classList.remove('fa-moon');
                this.themeToggle.classList.add('fa-sun');
            }
        }
    }

    toggleTheme() {
        document.body.classList.toggle('dark-theme');
        if (document.body.classList.contains('dark-theme')) {
            this.themeToggle.classList.remove('fa-moon');
            this.themeToggle.classList.add('fa-sun');
            localStorage.setItem('theme', 'dark');
        } else {
            this.themeToggle.classList.remove('fa-sun');
            this.themeToggle.classList.add('fa-moon');
            localStorage.setItem('theme', 'light');
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.dropArea) this.dropArea.classList.add('drag-over');
    }

    handleDragLeave(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.dropArea) this.dropArea.classList.remove('drag-over');
    }

    handleDrop(e) {
        e.preventDefault();
        e.stopPropagation();
        if (this.dropArea) this.dropArea.classList.remove('drag-over');
        const files = e.dataTransfer.files;
        this.processFiles(files);
    }

    handleFileSelect(e) {
        const files = e.target.files;
        this.processFiles(files);
    }

    processFiles(files) {
        for (let file of files) {
            if (this.isValidFileType(file)) {
                this.addFile(file);
            } else {
                this.showError(`Unsupported file type: ${file.name}`);
            }
        }
        if (this.fileInput) this.fileInput.value = '';
    }

    isValidFileType(file) {
        const extension = file.name.split('.').pop().toLowerCase();
        const validExtensions = [
            'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx',
            'jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp',
            'txt', 'rtf', 'html', 'htm', 'csv', 'pdf'
        ];

        if (file.type && file.type !== 'application/octet-stream') {
            const validTypes = [
                'application/msword',
                'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                'application/vnd.ms-excel',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-powerpoint',
                'application/vnd.openxmlformats-officedocument.presentationml.presentation',
                'image/jpeg',
                'image/png',
                'image/gif',
                'image/bmp',
                'image/webp',
                'text/plain',
                'text/html',
                'text/rtf',
                'text/csv',
                'application/rtf',
                'application/pdf',
                'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                'application/vnd.ms-excel',
                'application/csv',
                'application/x-csv',
                'text/x-csv',
                'text/comma-separated-values',
                'text/x-comma-separated-values'
            ];

            if (validTypes.includes(file.type)) return true;
        }

        return validExtensions.includes(extension);
    }

    addFile(file) {
        const fileId = Date.now() + Math.random();
        this.files.push({
            id: fileId,
            file: file,
            name: file.name,
            type: file.type,
            size: this.formatFileSize(file.size),
            extension: file.name.split('.').pop().toLowerCase(),
            status: 'pending'
        });
        this.renderFileList();
    }

    formatFileSize(bytes) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    renderFileList() {
        if (!this.fileListContainer) return;

        this.fileListContainer.innerHTML = '';
        this.files.forEach((fileData, index) => {
            const fileElement = this.createFileElement(fileData, index);
            this.fileListContainer.appendChild(fileElement);
        });
    }

    createFileElement(fileData, index) {
        const div = document.createElement('div');
        div.className = 'file-item';
        div.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    ${this.getFileIcon(fileData)}
                </div>
                <div class="file-details">
                    <h4>${fileData.name}</h4>
                    <p>${fileData.size} • ${this.getFileTypeName(fileData)}</p>
                </div>
            </div>
            <div class="file-actions">
                <button class="file-action-btn" onclick="window.pdfConverter.removeFile(${index})" title="Remove">
                    <i class="fas fa-times"></i>
                </button>
            </div>
        `;
        return div;
    }

    getFileIcon(fileData) {
        const extension = fileData.extension;
        switch (extension) {
            case 'pdf': return '<i class="fas fa-file-pdf text-danger"></i>';
            case 'doc': case 'docx': return '<i class="fas fa-file-word text-primary"></i>';
            case 'xls': case 'xlsx': return '<i class="fas fa-file-excel text-success"></i>';
            case 'ppt': case 'pptx': return '<i class="fas fa-file-powerpoint text-warning"></i>';
            case 'jpg': case 'jpeg': case 'png': case 'gif': case 'bmp': case 'webp':
                return '<i class="fas fa-file-image text-info"></i>';
            case 'txt': case 'rtf': return '<i class="fas fa-file-alt text-secondary"></i>';
            case 'html': case 'htm': return '<i class="fas fa-code text-purple"></i>';
            case 'csv': return '<i class="fas fa-file-csv text-success"></i>';
            default: return '<i class="fas fa-file text-gray"></i>';
        }
    }

    getFileTypeName(fileData) {
        const extension = fileData.extension;
        switch (extension) {
            case 'pdf': return 'PDF Document';
            case 'doc': case 'docx': return 'Word Document';
            case 'xls': case 'xlsx': return 'Excel Spreadsheet';
            case 'ppt': case 'pptx': return 'PowerPoint Presentation';
            case 'jpg': case 'jpeg': return 'JPEG Image';
            case 'png': return 'PNG Image';
            case 'gif': return 'GIF Image';
            case 'bmp': return 'Bitmap Image';
            case 'webp': return 'WebP Image';
            case 'txt': return 'Text File';
            case 'rtf': return 'Rich Text File';
            case 'html': case 'htm': return 'HTML Document';
            case 'csv': return 'CSV File';
            default: return 'Document';
        }
    }

    removeFile(index) {
        this.files.splice(index, 1);
        this.renderFileList();
    }

    clearAllFiles() {
        this.files = [];
        this.convertedFiles = [];
        this.renderFileList();
        if (this.resultsSection) this.resultsSection.style.display = 'none';
        if (this.resultsContainer) this.resultsContainer.innerHTML = '';
    }

    async convertFiles() {
        if (this.files.length === 0) {
            this.showError('Please add files to convert first!');
            return;
        }

        // Show progress modal
        const modal = document.getElementById('progressModal');
        const modalProgressFill = document.getElementById('modalProgressFill');
        const modalProgressText = document.getElementById('modalProgressText');

        if (modal && modalProgressFill && modalProgressText) {
            modal.classList.add('active');
            modalProgressFill.style.width = '0%';
            modalProgressText.textContent = 'Starting conversion...';
        }

        if (this.progressSection) {
            this.progressSection.style.display = 'block';
            this.progressFill.style.width = '0%';
            this.progressText.textContent = 'Starting conversion...';
        }

        if (this.resultsSection) this.resultsSection.style.display = 'none';

        const settings = this.getConversionSettings();
        this.convertedFiles = [];

        try {
            for (let i = 0; i < this.files.length; i++) {
                const fileData = this.files[i];

                // Update progress
                const progress = ((i + 1) / this.files.length) * 100;
                const statusText = `Converting ${i + 1} of ${this.files.length}: ${fileData.name}`;

                if (modalProgressFill && modalProgressText) {
                    modalProgressFill.style.width = `${progress}%`;
                    modalProgressText.textContent = statusText;
                }

                if (this.progressFill && this.progressText) {
                    this.progressFill.style.width = `${progress}%`;
                    this.progressText.textContent = statusText;
                }

                try {
                    const pdfBlob = await this.convertFileToPDF(fileData, settings);
                    this.convertedFiles.push({
                        name: fileData.name.replace(/\.[^/.]+$/, "") + '.pdf',
                        blob: pdfBlob
                    });
                } catch (error) {
                    console.error(`Failed to convert ${fileData.name}:`, error);
                    this.showError(`Failed to convert ${fileData.name}: ${error.message}`);
                }
            }

            // Complete
            if (modalProgressText) modalProgressText.textContent = 'Conversion complete!';
            if (this.progressText) this.progressText.textContent = 'Conversion complete!';

            // Hide modal after delay
            setTimeout(() => {
                if (modal) modal.classList.remove('active');
                if (this.progressSection) this.progressSection.style.display = 'none';
                this.showResults();
            }, 1000);

        } catch (error) {
            console.error('Conversion process error:', error);
            this.showError(`Conversion failed: ${error.message}`);

            if (modal) modal.classList.remove('active');
            if (this.progressSection) this.progressSection.style.display = 'none';
        }
    }

    getConversionSettings() {
        return {
            pageSize: document.getElementById('pageSize')?.value || 'a4',
            orientation: document.getElementById('orientation')?.value || 'portrait',
            margin: document.getElementById('margin')?.value || 'normal',
            quality: document.getElementById('quality')?.value || 'high',
            compressImages: document.getElementById('compressImages')?.checked || false,
            addPageNumbers: document.getElementById('addPageNumbers')?.checked || false,
            addWatermark: document.getElementById('addWatermark')?.checked || false,
            watermarkText: document.getElementById('watermarkText')?.value || ''
        };
    }

    async convertFileToPDF(fileData, settings) {
        return new Promise(async (resolve, reject) => {
            try {
                const file = fileData.file;
                const extension = fileData.extension;

                if (extension === 'pdf') {
                    resolve(file);
                    return;
                }

                // Check if jsPDF is available
                if (typeof window.jspdf === 'undefined') {
                    throw new Error('PDF library not loaded. Please include jsPDF.');
                }

                // Get jsPDF from global namespace
                const { jsPDF } = window.jspdf;

                // Initialize PDF with settings
                const pdf = new jsPDF({
                    orientation: settings.orientation,
                    unit: 'mm',
                    format: settings.pageSize
                });

                // Set default font
                pdf.setFont("helvetica");

                if (extension === 'txt' || extension === 'rtf') {
                    await this.convertTextToPDF(file, pdf, settings);
                } else if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'].includes(extension)) {
                    await this.convertImageToPDF(file, pdf, settings);
                } else if (extension === 'csv') {
                    await this.convertCSVToPDF(file, pdf, settings);
                } else if (['xls', 'xlsx'].includes(extension)) {
                    await this.convertExcelToPDF(file, pdf, settings);
                } else if (extension === 'html' || extension === 'htm') {
                    await this.convertHTMLToPDF(file, pdf, settings);
                } else if (['doc', 'docx', 'ppt', 'pptx'].includes(extension)) {
                    await this.convertOfficeToPDF(file, pdf, settings, extension);
                } else {
                    await this.convertGenericToPDF(file, pdf, settings, fileData.name);
                }

                // Apply watermark if enabled
                if (settings.addWatermark && settings.watermarkText) {
                    this.addWatermarkToPDF(pdf, settings.watermarkText);
                }

                // Apply page numbers if enabled
                if (settings.addPageNumbers) {
                    this.addPageNumbersToPDF(pdf);
                }

                const pdfBlob = pdf.output('blob');
                resolve(pdfBlob);

            } catch (error) {
                reject(error);
            }
        });
    }

    async convertTextToPDF(file, pdf, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = e.target.result;
                    const margin = this.getMargin(settings.margin);
                    const pageWidth = pdf.internal.pageSize.getWidth();
                    const maxWidth = pageWidth - (margin * 2);

                    pdf.setFontSize(11);
                    const lines = pdf.splitTextToSize(text, maxWidth);

                    let y = margin;
                    const lineHeight = 5;

                    for (let line of lines) {
                        if (y > pdf.internal.pageSize.getHeight() - margin) {
                            pdf.addPage();
                            y = margin;
                        }
                        pdf.text(line, margin, y);
                        y += lineHeight;
                    }
                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async convertImageToPDF(file, pdf, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const img = new Image();
                    img.onload = () => {
                        try {
                            const margin = this.getMargin(settings.margin);
                            const pageWidth = pdf.internal.pageSize.getWidth();
                            const pageHeight = pdf.internal.pageSize.getHeight();
                            const maxWidth = pageWidth - (margin * 2);
                            const maxHeight = pageHeight - (margin * 2);

                            // Calculate image dimensions
                            const imgRatio = img.width / img.height;
                            let imgWidth = maxWidth;
                            let imgHeight = imgWidth / imgRatio;

                            if (imgHeight > maxHeight) {
                                imgHeight = maxHeight;
                                imgWidth = imgHeight * imgRatio;
                            }

                            // Center the image
                            const x = margin + (maxWidth - imgWidth) / 2;
                            const y = margin + (maxHeight - imgHeight) / 2;

                            pdf.addImage(img, 'JPEG', x, y, imgWidth, imgHeight);
                            resolve();
                        } catch (error) {
                            reject(error);
                        }
                    };
                    img.onerror = reject;
                    img.src = e.target.result;
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    async convertCSVToPDF(file, pdf, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const text = await file.text();

                    // Parse CSV
                    const lines = text.split('\n').filter(line => line.trim());
                    const data = [];

                    for (const line of lines) {
                        // Simple CSV parsing
                        const row = line.split(',').map(cell =>
                            cell.trim().replace(/^"|"$/g, '')
                        );
                        data.push(row);
                    }

                    if (data.length === 0) {
                        pdf.text('Empty CSV file', 20, 20);
                        resolve();
                        return;
                    }

                    const headers = data[0] || [];
                    const rows = data.slice(1);

                    const margin = this.getMargin(settings.margin);
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    let yPos = margin;

                    // Try using autotable if available
                    if (typeof pdf.autoTable === 'function') {
                        try {
                            pdf.autoTable({
                                head: [headers],
                                body: rows,
                                startY: yPos,
                                theme: 'grid',
                                headStyles: {
                                    fillColor: [41, 128, 185],
                                    textColor: 255,
                                    fontSize: 10
                                },
                                styles: {
                                    fontSize: 9,
                                    cellPadding: 3
                                },
                                margin: { left: margin, right: margin }
                            });
                            resolve();
                        } catch (autoTableError) {
                            console.warn('AutoTable failed:', autoTableError);
                            this.drawSimpleTable(pdf, headers, rows, margin, settings, 'CSV Data');
                            resolve();
                        }
                    } else {
                        this.drawSimpleTable(pdf, headers, rows, margin, settings, 'CSV Data');
                        resolve();
                    }

                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read CSV file'));
            reader.readAsText(file);
        });
    }

    async convertExcelToPDF(file, pdf, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    // Check if XLSX library is available
                    if (typeof XLSX === 'undefined') {
                        pdf.setFontSize(12);
                        pdf.text('Excel library not loaded', 20, 20);
                        pdf.text('Please include SheetJS library', 20, 30);
                        resolve();
                        return;
                    }

                    // Read Excel file
                    const workbook = XLSX.read(e.target.result, { type: "binary" });
                    const firstSheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[firstSheetName];

                    // Convert to array
                    const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (data.length === 0) {
                        pdf.text('Empty Excel file', 20, 20);
                        resolve();
                        return;
                    }

                    const headers = data[0] || [];
                    const rows = data.slice(1);

                    const margin = this.getMargin(settings.margin);
                    const pageHeight = pdf.internal.pageSize.getHeight();
                    let yPos = margin;

                    // Try using autotable if available
                    if (typeof pdf.autoTable === 'function') {
                        try {
                            pdf.autoTable({
                                head: [headers],
                                body: rows,
                                startY: yPos,
                                theme: 'grid',
                                headStyles: {
                                    fillColor: [39, 174, 96],
                                    textColor: 255,
                                    fontSize: 10
                                },
                                styles: {
                                    fontSize: 9,
                                    cellPadding: 3
                                },
                                margin: { left: margin, right: margin }
                            });
                            resolve();
                        } catch (autoTableError) {
                            console.warn('AutoTable failed:', autoTableError);
                            this.drawSimpleTable(pdf, headers, rows, margin, settings, 'Excel Data');
                            resolve();
                        }
                    } else {
                        this.drawSimpleTable(pdf, headers, rows, margin, settings, 'Excel Data');
                        resolve();
                    }

                } catch (error) {
                    console.error('Excel conversion error:', error);
                    // Fallback
                    pdf.setFontSize(12);
                    pdf.text('Excel File: ' + file.name, 20, 20);
                    pdf.text('Showing raw data', 20, 30);
                    resolve();
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsBinaryString(file);
        });
    }

    drawSimpleTable(pdf, headers, rows, margin, settings, title = 'Table Data') {
        try {
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            let y = margin;
            const colCount = Math.max(headers.length, 1);
            const colWidth = (pageWidth - (margin * 2)) / colCount;
            const rowHeight = 8;

            // Add title
            pdf.setFontSize(14);
            pdf.text(title, margin, y);
            y += 10;

            // Draw table header
            pdf.setFillColor(67, 97, 238);
            pdf.rect(margin, y - 5, pageWidth - (margin * 2), rowHeight + 2, 'F');
            pdf.setTextColor(255, 255, 255);
            pdf.setFont("helvetica", "bold");
            pdf.setFontSize(10);

            headers.forEach((header, i) => {
                const xPos = margin + (i * colWidth) + 2;
                const cellContent = String(header || `Column ${i + 1}`).substring(0, 20);
                pdf.text(cellContent, xPos, y);
            });

            y += rowHeight;
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(9);

            // Draw table rows
            rows.forEach((row, rowIndex) => {
                // Check if we need a new page
                if (y + rowHeight > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;

                    // Redraw header on new page
                    pdf.setFillColor(67, 97, 238);
                    pdf.rect(margin, y - 5, pageWidth - (margin * 2), rowHeight + 2, 'F');
                    pdf.setTextColor(255, 255, 255);
                    pdf.setFont("helvetica", "bold");

                    headers.forEach((header, i) => {
                        const xPos = margin + (i * colWidth) + 2;
                        const cellContent = String(header || `Column ${i + 1}`).substring(0, 20);
                        pdf.text(cellContent, xPos, y);
                    });

                    y += rowHeight;
                    pdf.setTextColor(0, 0, 0);
                    pdf.setFont("helvetica", "normal");
                }

                // Alternate row colors
                if (rowIndex % 2 === 0) {
                    pdf.setFillColor(245, 245, 245);
                    pdf.rect(margin, y - 4, pageWidth - (margin * 2), rowHeight, 'F');
                }

                // Draw row cells
                headers.forEach((header, i) => {
                    const xPos = margin + (i * colWidth) + 2;
                    const cellValue = i < row.length ? String(row[i] || '') : '';
                    const cellContent = cellValue.substring(0, 20);
                    pdf.text(cellContent, xPos, y);
                });

                y += rowHeight;
            });

            // Draw table borders
            pdf.setDrawColor(200, 200, 200);
            pdf.rect(margin, margin + 10, pageWidth - (margin * 2), y - margin - 10);

        } catch (error) {
            console.error('Error drawing simple table:', error);
            // Fallback to text
            pdf.setFontSize(12);
            pdf.text('Data:', margin, margin);
            let y = margin + 10;

            pdf.text('Headers: ' + headers.join(', '), margin, y);
            y += 10;

            rows.slice(0, 10).forEach((row, index) => {
                if (y > pageHeight - margin) {
                    pdf.addPage();
                    y = margin;
                }
                pdf.text(`Row ${index + 1}: ${row.join(', ')}`, margin, y);
                y += 8;
            });
        }
    }

    async convertHTMLToPDF(file, pdf, settings) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = async (e) => {
                try {
                    const htmlContent = e.target.result;

                    // Create temporary div
                    const tempDiv = document.createElement('div');
                    tempDiv.innerHTML = htmlContent;
                    tempDiv.style.width = '600px';
                    tempDiv.style.padding = '20px';
                    document.body.appendChild(tempDiv);

                    if (typeof html2canvas !== 'undefined') {
                        try {
                            const canvas = await html2canvas(tempDiv, {
                                scale: 2,
                                useCORS: true,
                                logging: false
                            });

                            document.body.removeChild(tempDiv);

                            const imgData = canvas.toDataURL('image/png');
                            const pageWidth = pdf.internal.pageSize.getWidth();

                            const imgWidth = pageWidth - 40;
                            const imgHeight = (canvas.height * imgWidth) / canvas.width;

                            pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight);
                            resolve();
                        } catch (canvasError) {
                            document.body.removeChild(tempDiv);
                            const text = tempDiv.textContent || tempDiv.innerText;
                            this.convertTextToPDF(new Blob([text]), pdf, settings);
                            resolve();
                        }
                    } else {
                        const text = tempDiv.textContent || tempDiv.innerText;
                        document.body.removeChild(tempDiv);
                        this.convertTextToPDF(new Blob([text]), pdf, settings);
                        resolve();
                    }
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsText(file);
        });
    }

    async convertOfficeToPDF(file, pdf, settings, extension) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    pdf.setFontSize(16);
                    pdf.text(`${extension.toUpperCase()} File`, 20, 20);

                    pdf.setFontSize(12);
                    pdf.text(`File: ${file.name}`, 20, 35);
                    pdf.text(`Type: ${this.getFileTypeName({ extension })}`, 20, 45);
                    pdf.text(`Size: ${this.formatFileSize(file.size)}`, 20, 55);

                    pdf.text('Note:', 20, 70);
                    pdf.text('For full office document conversion,', 20, 80);
                    pdf.text('please use specialized conversion tools.', 20, 90);

                    resolve();
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = reject;
            reader.readAsArrayBuffer(file);
        });
    }

    async convertGenericToPDF(file, pdf, settings, filename) {
        return new Promise((resolve) => {
            pdf.setFontSize(16);
            pdf.text('File Conversion', 20, 20);

            pdf.setFontSize(12);
            pdf.text(`File: ${filename}`, 20, 35);
            pdf.text('Converted on: ' + new Date().toLocaleString(), 20, 45);
            pdf.text('File converted to PDF format.', 20, 55);

            resolve();
        });
    }

    getMargin(margin) {
        const margins = {
            normal: 20,
            narrow: 10,
            wide: 30
        };
        return margins[margin] || 20;
    }

    addWatermarkToPDF(pdf, text) {
        try {
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setTextColor(150, 150, 150);
                pdf.setFontSize(40);
                pdf.setFont("helvetica", "italic");

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                pdf.saveGraphicsState();
                pdf.translate(pageWidth / 2, pageHeight / 2);
                pdf.rotate(-45);
                pdf.text(text, 0, 0, { align: 'center' });
                pdf.restoreGraphicsState();
            }
            pdf.setTextColor(0, 0, 0);
            pdf.setFont("helvetica", "normal");
        } catch (error) {
            console.warn('Could not add watermark:', error);
        }
    }

    addPageNumbersToPDF(pdf) {
        try {
            const pageCount = pdf.internal.getNumberOfPages();
            for (let i = 1; i <= pageCount; i++) {
                pdf.setPage(i);
                pdf.setFontSize(10);
                pdf.text(
                    `Page ${i} of ${pageCount}`,
                    pdf.internal.pageSize.getWidth() - 30,
                    pdf.internal.pageSize.getHeight() - 10
                );
            }
        } catch (error) {
            console.warn('Could not add page numbers:', error);
        }
    }

    showResults() {
        if (!this.resultsContainer) return;

        this.resultsContainer.innerHTML = '';

        if (this.convertedFiles.length === 0) {
            this.resultsContainer.innerHTML = '<p class="no-results">No files were converted successfully.</p>';
            if (this.resultsSection) this.resultsSection.style.display = 'block';
            return;
        }

        this.convertedFiles.forEach((pdfData, index) => {
            const resultItem = this.createResultElement(pdfData, index);
            this.resultsContainer.appendChild(resultItem);
        });

        if (this.resultsSection) this.resultsSection.style.display = 'block';
    }

    createResultElement(pdfData, index) {
        const div = document.createElement('div');
        div.className = 'result-item';
        div.innerHTML = `
            <div class="file-info">
                <div class="file-icon">
                    <i class="fas fa-file-pdf text-danger"></i>
                </div>
                <div class="file-details">
                    <h4>${pdfData.name}</h4>
                    <p>${this.formatFileSize(pdfData.blob.size)} • PDF Document</p>
                </div>
            </div>
            <div class="result-actions">
                <button class="preview-btn" onclick="window.pdfConverter.previewPDF(${index})">
                    <i class="fas fa-eye"></i> Preview
                </button>
                <button class="download-btn" onclick="window.pdfConverter.downloadPDF(${index})">
                    <i class="fas fa-download"></i> Download
                </button>
            </div>
        `;
        return div;
    }

    downloadPDF(index) {
        if (!this.convertedFiles[index]) return;

        const pdfData = this.convertedFiles[index];
        const url = URL.createObjectURL(pdfData.blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = pdfData.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        setTimeout(() => URL.revokeObjectURL(url), 100);
    }

    previewPDF(index) {
        if (!this.convertedFiles[index]) return;

        const pdfData = this.convertedFiles[index];
        const url = URL.createObjectURL(pdfData.blob);

        const previewWindow = window.open('', '_blank');
        if (previewWindow) {
            previewWindow.document.write(`
                <html>
                <head>
                    <title>Preview: ${pdfData.name}</title>
                    <style>
                        body { margin: 0; padding: 20px; background: #f5f5f5; }
                        .container { max-width: 800px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                        iframe { width: 100%; height: 600px; border: 1px solid #ddd; border-radius: 4px; }
                        .header { margin-bottom: 20px; display: flex; justify-content: space-between; align-items: center; }
                        .download-btn { padding: 8px 16px; background: #4361ee; color: white; border: none; border-radius: 4px; cursor: pointer; }
                    </style>
                </head>
                <body>
                    <div class="container">
                        <div class="header">
                            <h2>${pdfData.name}</h2>
                            <button class="download-btn" onclick="window.location.href='${url}'" download="${pdfData.name}">
                                Download PDF
                            </button>
                        </div>
                        <iframe src="${url}"></iframe>
                    </div>
                </body>
                </html>
            `);
            previewWindow.document.close();
        }
    }

    async mergePDFs() {
        if (this.convertedFiles.length < 2) {
            this.showError('You need to convert at least 2 files to PDF first before merging!');
            return;
        }

        this.showInfo('PDF merging requires additional libraries. Converting files individually for now.');

        this.convertedFiles.forEach((pdfData, index) => {
            setTimeout(() => {
                this.downloadPDF(index);
            }, index * 100);
        });
    }

    toggleAdvancedSettings() {
        if (!this.advancedSettings || !this.toggleAdvanced) return;

        this.advancedSettings.classList.toggle('show');
        const icon = this.toggleAdvanced.querySelector('i');
        if (this.advancedSettings.classList.contains('show')) {
            icon.classList.remove('fa-chevron-down');
            icon.classList.add('fa-chevron-up');
        } else {
            icon.classList.remove('fa-chevron-up');
            icon.classList.add('fa-chevron-down');
        }
    }

    showError(message) {
        this.showNotification(message, 'error');
    }

    showInfo(message) {
        this.showNotification(message, 'info');
    }

    showNotification(message, type) {
        const existingNotifications = document.querySelectorAll('.notification');
        existingNotifications.forEach(n => n.remove());

        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <i class="fas fa-${type === 'error' ? 'exclamation-circle' : 'info-circle'}"></i>
            <span>${message}</span>
            <button onclick="this.parentElement.remove()">
                <i class="fas fa-times"></i>
            </button>
        `;

        document.body.appendChild(notification);

        if (!document.querySelector('#notification-styles')) {
            const style = document.createElement('style');
            style.id = 'notification-styles';
            style.textContent = `
                .notification {
                    position: fixed;
                    top: 20px;
                    right: 20px;
                    background-color: white;
                    color: #333;
                    padding: 1rem 1.5rem;
                    border-radius: 12px;
                    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
                    display: flex;
                    align-items: center;
                    gap: 10px;
                    z-index: 9999;
                    animation: slideIn 0.3s ease;
                    border-left: 4px solid #4361ee;
                    max-width: 400px;
                }
                .dark-theme .notification {
                    background-color: #2d2d2d;
                    color: white;
                }
                .notification.error {
                    border-left-color: #ef4444;
                }
                .notification.info {
                    border-left-color: #4cc9f0;
                }
                .notification button {
                    background: none;
                    border: none;
                    cursor: pointer;
                    color: #6c757d;
                    margin-left: auto;
                }
                @keyframes slideIn {
                    from { transform: translateX(100%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
            `;
            document.head.appendChild(style);
        }

        setTimeout(() => {
            if (notification.parentElement) {
                notification.remove();
            }
        }, 5000);
    }
}

// Initialize the converter
document.addEventListener('DOMContentLoaded', () => {
    window.pdfConverter = new PDFConverter();
});