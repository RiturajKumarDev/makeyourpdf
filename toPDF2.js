const { jsPDF } = window.jspdf;
const PAGE_SIZES_MM = { a4: { w: 210, h: 297 } };
const DEFAULT_DPI = 96;

document.getElementById("convertBtn").addEventListener("click", async () => {
    const input = document.getElementById("inputFile");
    const files = Array.from(input.files);
    const status = document.getElementById("status");
    const preview = document.getElementById("preview");
    preview.innerHTML = '';
    status.textContent = '';

    if (!files.length) {
        status.innerText = "Please select at least one file.";
        alert("Please select at least one file.");
        return;
    }

    const pageSize = PAGE_SIZES_MM.a4;
    const pdf = new jsPDF({ unit: "mm", format: [pageSize.w, pageSize.h] });
    const margin = 10;
    let yPos = margin;
    const pageHeight = pageSize.h;
    const lineHeight = 7;
    const textMargin = 15;

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        status.textContent = `Processing ${i + 1} of ${files.length}: ${file.name}`;

        try {
            // CSV FILE
            if (file.name.endsWith(".csv")) {
                const text = await file.text();
                const data = text.split("\n").map(row => row.split(","));
                const headers = data[0];
                const rows = data.slice(1);

                pdf.autoTable({
                    head: [headers],
                    body: rows,
                    startY: yPos,
                    theme: 'grid',
                    headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                    styles: { fontSize: 10 }
                });
                yPos = pdf.lastAutoTable.finalY + margin;
                if (yPos > pageHeight - margin) { pdf.addPage(); yPos = margin; }
            }
            // XLSX FILE
            else if (file.name.endsWith(".xlsx")) {
                const reader = new FileReader();
                await new Promise((resolve) => {
                    reader.onload = (e) => {
                        const workbook = XLSX.read(e.target.result, { type: "binary" });
                        const firstSheetName = workbook.SheetNames[0];
                        const worksheet = workbook.Sheets[firstSheetName];
                        const data = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
                        const headers = data[0];
                        const rows = data.slice(1);

                        pdf.autoTable({
                            head: [headers],
                            body: rows,
                            startY: yPos,
                            theme: 'grid',
                            headStyles: { fillColor: [41, 128, 185], textColor: 255 },
                            styles: { fontSize: 10 }
                        });
                        yPos = pdf.lastAutoTable.finalY + margin;
                        if (yPos > pageHeight - margin) { pdf.addPage(); yPos = margin; }
                        resolve();
                    };
                    reader.readAsBinaryString(file);
                });
            }
            // IMAGE FILE
            else if (file.type.startsWith("image/")) {
                const img = await loadImageFromFile(file);

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeight = pdf.internal.pageSize.getHeight();

                const imgRatio = img.naturalWidth / img.naturalHeight;

                let imgW = pageWidth;       // start with full page width
                let imgH = imgW / imgRatio; // height based on aspect ratio

                // If height exceeds page height, scale down
                if (imgH > pageHeight) {
                    imgH = pageHeight;
                    imgW = imgH * imgRatio;
                }

                // Initialize yPos if not already
                if (typeof yPos === "undefined") yPos = 0;

                // Add a new page if current yPos + imgH > pageHeight
                if (yPos + imgH > pageHeight) {
                    pdf.addPage();
                    yPos = 0;
                }

                // Center horizontally
                const xPos = (pageWidth - imgW) / 2;

                pdf.addImage(img, "JPEG", xPos, yPos, imgW, imgH);

                yPos += imgH; // update yPos
            }
            // TEXT FILE
            else if (file.type === "text/plain") {
                const text = await file.text();
                const lines = pdf.splitTextToSize(text, pageSize.w - 2 * textMargin);
                for (let line of lines) {
                    if (yPos + lineHeight > pageHeight - margin) { pdf.addPage(); yPos = textMargin; }
                    pdf.text(line, textMargin, yPos);
                    yPos += lineHeight;
                }
                yPos += lineHeight;
            }
            // DOC / DOCX FILE
            else if (
                file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
                file.type === "application/msword"
            ) {
                const arrayBuffer = await file.arrayBuffer();
                const result = await mammoth.convertToHtml({ arrayBuffer });
                preview.innerHTML = result.value;
                preview.style.fontSize = "15pt";
                preview.style.lineHeight = "1.4";

                const canvas = await html2canvas(preview, {
                    scale: 1, useCORS: true, letterRendering: true,
                    windowWidth: preview.scrollWidth
                });

                const pageWidth = pdf.internal.pageSize.getWidth();
                const pageHeightPt = pdf.internal.pageSize.getHeight();
                const marginLeft = 10, marginRight = 10, marginTop = 15, marginBottom = 15;
                const usableWidth = pageWidth - marginLeft - marginRight;
                const usableHeight = pageHeightPt - marginTop - marginBottom;
                const imgWidth = usableWidth;
                const imgHeight = (canvas.height * imgWidth) / canvas.width;

                let renderedHeight = 0;
                while (renderedHeight < imgHeight) {
                    const remainingHeight = imgHeight - renderedHeight;
                    const drawHeight = Math.min(remainingHeight, usableHeight);

                    const tempCanvas = document.createElement("canvas");
                    tempCanvas.width = canvas.width;
                    tempCanvas.height = (drawHeight * canvas.width) / imgWidth;
                    const ctx = tempCanvas.getContext("2d");
                    ctx.drawImage(
                        canvas,
                        0, (renderedHeight * canvas.width) / imgWidth,
                        canvas.width, tempCanvas.height,
                        0, 0, tempCanvas.width, tempCanvas.height
                    );

                    if (renderedHeight > 0) pdf.addPage([pageWidth, pageHeightPt]);
                    pdf.addImage(tempCanvas.toDataURL("image/png"), "PNG", marginLeft, marginTop, imgWidth, drawHeight);
                    renderedHeight += drawHeight;
                }
                yPos = marginTop;
            }
            else {
                console.warn(`Skipping unsupported file: ${file.name}`);
            }
        } catch (err) {
            console.error("Error processing", file.name, err);
            status.innerHTML += `<p style="color:red;">Error processing ${file.name}: ${err.message}</p>`;
        }
    }

    const outName = "merged_files.pdf";
    pdf.save(outName);
    status.innerHTML = `<p>✅ Done! Downloaded <b>${outName}</b></p>`;
    input.value = "";
    preview.innerHTML = "";
    document.getElementById("filesNames").innerHTML = "";
});

// Helper to load image files
function loadImageFromFile(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const img = new Image();
            img.onload = () => resolve(img);
            img.onerror = () => reject(new Error("Invalid image or unsupported format"));
            img.src = reader.result;
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        reader.readAsDataURL(file);
    });
}

// toPDF2.js में जोड़ें

// File upload होने पर
document.getElementById('inputFile').addEventListener('change', function(e) {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    
    // DataLayer में event push करें
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({
      'event': 'file_upload',
      'file_type': file.type,
      'file_name': file.name,
      'file_size': file.size
    });
  }
});

// Conversion successful होने पर
function onConversionSuccess() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'pdf_conversion',
    'conversion_type': 'success',
    'timestamp': new Date().toISOString()
  });
}

// Download click पर
function onDownloadClick() {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    'event': 'pdf_download',
    'action': 'download_click'
  });
}