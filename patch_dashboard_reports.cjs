const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

// Import XLSX
code = code.replace(
  `import autoTable from "jspdf-autotable";`,
  `import autoTable from "jspdf-autotable";\nimport * as XLSX from "xlsx";`
);

// We need to add the new report generation function right before the return statement of Dashboard
const reportFunction = `
  const handleGenerateAdvancedReport = async (reportType: 'pdf' | 'excel') => {
    setLoading(true);
    try {
      const start = startOfDay(parseISO(reportStartDate));
      const end = startOfDay(parseISO(reportEndDate));
      
      const filteredChecks = checks.filter(c => {
        const d = startOfDay(parseISO(c.dueDate));
        return d >= start && d <= end;
      }).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

      // Fetch Sales and Collections for range
      const salesQ = query(collection(db, 'sales'), where('date', '>=', reportStartDate), where('date', '<=', reportEndDate));
      const salesSnap = await getDocs(salesQ);
      const salesData = salesSnap.docs.map(d => d.data());

      const collQ = query(collection(db, 'collections'), where('initialDate', '>=', reportStartDate));
      const collSnap = await getDocs(collQ);
      const collsData = collSnap.docs.map(d => d.data()).filter(c => c.initialDate <= reportEndDate);

      const empQ = query(collection(db, 'employees'));
      const empSnap = await getDocs(empQ);
      const employees = empSnap.docs.map(d => ({id: d.id, ...d.data()}));

      // Summarize
      let totalSalesContado = 0;
      let totalSalesCredito = 0;
      let totalSalesMoto = 0;
      let totalCollections = 0;

      const empSummary: Record<string, any> = {};
      employees.forEach((emp: any) => {
        empSummary[emp.id] = { name: emp.name + ' ' + emp.lastName, contado: 0, credito: 0, moto: 0, collections: 0 };
      });

      salesData.forEach(s => {
        if (!empSummary[s.employeeId]) return;
        const val = s.totalValue || 0;
        if (s.isMoto) {
          totalSalesMoto += val;
          empSummary[s.employeeId].moto += val;
        } else if (s.type === 'contado') {
          totalSalesContado += val;
          empSummary[s.employeeId].contado += val;
        } else if (s.type === 'credito') {
          totalSalesCredito += val;
          empSummary[s.employeeId].credito += val;
        }
      });

      collsData.forEach(c => {
        if (!empSummary[c.employeeId]) return;
        const val = c.totalCollected || 0;
        totalCollections += val;
        empSummary[c.employeeId].collections += val;
      });

      const totalSalesAll = totalSalesContado + totalSalesCredito + totalSalesMoto;

      if (reportType === 'pdf') {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text("Reporte Comercial Avanzado", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(11);
        doc.text(\`Periodo: \${reportStartDate} a \${reportEndDate}\`, pageWidth / 2, 28, { align: "center" });
        
        doc.setFontSize(14);
        doc.text("Resumen Global", 14, 40);
        autoTable(doc, {
          startY: 45,
          head: [["Concepto", "Total ($)"]],
          body: [
            ["Ventas Contado", totalSalesContado.toFixed(2)],
            ["Ventas Crédito", totalSalesCredito.toFixed(2)],
            ["Ventas Motos", totalSalesMoto.toFixed(2)],
            ["Total Ventas", totalSalesAll.toFixed(2)],
            ["Total Cobranzas", totalCollections.toFixed(2)],
          ],
          theme: 'grid'
        });

        doc.addPage();
        doc.setFontSize(14);
        doc.text("Desglose por Empleado", 14, 20);
        
        const empRows = Object.values(empSummary).filter(e => e.contado > 0 || e.credito > 0 || e.moto > 0 || e.collections > 0).map(e => [
          e.name,
          e.contado.toFixed(2),
          e.credito.toFixed(2),
          e.moto.toFixed(2),
          e.collections.toFixed(2)
        ]);

        autoTable(doc, {
          startY: 25,
          head: [["Empleado", "Ventas Contado ($)", "Ventas Crédito ($)", "Ventas Motos ($)", "Cobranzas ($)"]],
          body: empRows,
          theme: 'grid'
        });

        if (filteredChecks.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text("Cheques Pagados / Pendientes del Periodo", 14, 20);
          autoTable(doc, {
            startY: 25,
            head: [["Vencimiento", "Titular", "Banco", "Monto ($)", "Estado"]],
            body: filteredChecks.map(c => [
              c.dueDate,
              c.accountHolder,
              c.bank,
              c.amount.toFixed(2),
              c.status === "PAID" ? "PAGADO" : "PENDIENTE"
            ]),
            theme: 'grid'
          });
        }

        doc.save(\`Reporte_Avanzado_\${reportStartDate}_\${reportEndDate}.pdf\`);
      } else {
        // EXCEL
        const wb = XLSX.utils.book_new();
        
        // Sheet 1: Resumen Global
        const wsGlobal = XLSX.utils.aoa_to_sheet([
          ["Reporte Comercial Avanzado"],
          [\`Periodo: \${reportStartDate} a \${reportEndDate}\`],
          [],
          ["Concepto", "Total ($)"],
          ["Ventas Contado", totalSalesContado],
          ["Ventas Crédito", totalSalesCredito],
          ["Ventas Motos", totalSalesMoto],
          ["Total Ventas", totalSalesAll],
          ["Total Cobranzas", totalCollections]
        ]);
        XLSX.utils.book_append_sheet(wb, wsGlobal, "Resumen Global");

        // Sheet 2: Empleados
        const empData = Object.values(empSummary).filter(e => e.contado > 0 || e.credito > 0 || e.moto > 0 || e.collections > 0).map(e => ({
          Empleado: e.name,
          "Ventas Contado ($)": e.contado,
          "Ventas Crédito ($)": e.credito,
          "Ventas Motos ($)": e.moto,
          "Cobranzas ($)": e.collections
        }));
        if (empData.length > 0) {
          const wsEmp = XLSX.utils.json_to_sheet(empData);
          XLSX.utils.book_append_sheet(wb, wsEmp, "Detalle Empleados");
        }

        // Sheet 3: Cheques
        if (filteredChecks.length > 0) {
          const chkData = filteredChecks.map(c => ({
            Vencimiento: c.dueDate,
            Titular: c.accountHolder,
            Banco: c.bank,
            "Monto ($)": c.amount,
            Estado: c.status === "PAID" ? "PAGADO" : "PENDIENTE"
          }));
          const wsChk = XLSX.utils.json_to_sheet(chkData);
          XLSX.utils.book_append_sheet(wb, wsChk, "Cheques");
        }

        XLSX.writeFile(wb, \`Reporte_Avanzado_\${reportStartDate}_\${reportEndDate}.xlsx\`);
      }
    } catch (e) {
      console.error(e);
      alert('Error generando el reporte.');
    } finally {
      setLoading(false);
    }
  };
`;

code = code.replace(
  `  const generateCustomReportPdf = (filteredChecks: Check[]) => {`,
  reportFunction + `\n  const generateCustomReportPdf = (filteredChecks: Check[]) => {`
);

// Update Modal Buttons
const modalButtonsReplacement = `
                            <div className="flex gap-4">
                <button 
                  onClick={() => handleGenerateAdvancedReport('pdf')}
                  className="w-full py-4 bg-indigo-600 text-white font-black rounded-2xl shadow-lg hover:bg-indigo-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Descargar PDF
                </button>
                <button 
                  onClick={() => handleGenerateAdvancedReport('excel')}
                  className="w-full py-4 bg-emerald-600 text-white font-black rounded-2xl shadow-lg hover:bg-emerald-700 transition-all hover:-translate-y-0.5 active:translate-y-0"
                >
                  Descargar Excel
                </button>
              </div>
`;

code = code.replace(
  /<button\s+onClick=\{\(\) => \{\s+try \{\s+const start = startOfDay[\s\S]*?Generar PDF y Descargar\s+<\/button>/,
  modalButtonsReplacement.trim()
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched Dashboard.tsx for reports');
