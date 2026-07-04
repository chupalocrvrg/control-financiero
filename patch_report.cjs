const fs = require('fs');
let lines = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8').split('\n');

const startIndex = lines.findIndex(l => l.includes("const handleGenerateAdvancedReport = async"));
const endIndex = lines.findIndex((l, i) => i > startIndex && l.trim() === "};" && lines[i-1].includes("setLoading(false);"));

const newFunction = `const handleGenerateAdvancedReport = async (reportType: 'pdf' | 'excel') => {
    setLoading(true);
    try {
      const start = startOfDay(parseISO(reportStartDate));
      const end = startOfDay(parseISO(reportEndDate));
      
      const checksQ = query(collection(db, 'checks'), where('dueDate', '>=', reportStartDate), where('dueDate', '<=', reportEndDate), where('status', 'in', ['PENDING', 'PAID']));
      const checksSnap = await getDocs(checksQ);
      const filteredChecks = checksSnap.docs.map(d => ({ id: d.id, ...d.data() }) as any).sort((a, b) => parseISO(a.dueDate).getTime() - parseISO(b.dueDate).getTime());

      const salesQ = query(collection(db, 'sales'), where('date', '>=', reportStartDate), where('date', '<=', reportEndDate));
      const salesSnap = await getDocs(salesQ);
      const salesData = salesSnap.docs.map(d => d.data());

      const collQ = query(collection(db, 'collections'), where('initialDate', '>=', reportStartDate));
      const collSnap = await getDocs(collQ);
      const collsData = collSnap.docs.map(d => d.data()).filter(c => c.initialDate <= reportEndDate);

      const empQ = query(collection(db, 'employees'));
      const empSnap = await getDocs(empQ);
      const employees = empSnap.docs.map(d => ({id: d.id, ...d.data()}));

      const startMonthStr = reportStartDate.substring(0, 7);
      const endMonthStr = reportEndDate.substring(0, 7);
      const budgetQ = query(collection(db, 'budgets'), where('month', '>=', startMonthStr), where('month', '<=', endMonthStr));
      const budgetSnap = await getDocs(budgetQ);
      const budgetsData = budgetSnap.docs.map(d => d.data());

      // Variables Globales
      let totalArticulosContado = 0;
      let totalArticulosCredito = 0;
      let totalMotosContadoVal = 0;
      let totalMotosCreditoVal = 0;
      let totalMotosContadoUds = 0;
      let totalMotosCreditoUds = 0;
      let totalCollections = 0;
      let globalSalesBudget = 0;
      let globalCollBudget = 0;

      const empSummary: Record<string, any> = {};
      employees.forEach((emp: any) => {
        empSummary[emp.id] = { 
          name: emp.name + ' ' + emp.lastName, 
          artContado: 0, artCredito: 0,
          motosContUds: 0, motosCredUds: 0, motosContVal: 0, motosCredVal: 0,
          collections: 0, 
          salesBudget: 0, collBudget: 0 
        };
      });

      budgetsData.forEach(b => {
        if (!empSummary[b.employeeId]) return;
        empSummary[b.employeeId].salesBudget += (b.salesBudget || 0);
        empSummary[b.employeeId].collBudget += (b.collectionsBudget || 0);
        globalSalesBudget += (b.salesBudget || 0);
        globalCollBudget += (b.collectionsBudget || 0);
      });

      salesData.forEach(s => {
        if (!empSummary[s.employeeId]) return;
        const val = s.totalValue || 0;
        if (s.isMoto) {
          if (s.type === 'contado') {
            totalMotosContadoVal += val;
            totalMotosContadoUds += 1;
            empSummary[s.employeeId].motosContVal += val;
            empSummary[s.employeeId].motosContUds += 1;
          } else {
            totalMotosCreditoVal += val;
            totalMotosCreditoUds += 1;
            empSummary[s.employeeId].motosCredVal += val;
            empSummary[s.employeeId].motosCredUds += 1;
          }
        } else {
          if (s.type === 'contado') {
            totalArticulosContado += val;
            empSummary[s.employeeId].artContado += val;
          } else {
            totalArticulosCredito += val;
            empSummary[s.employeeId].artCredito += val;
          }
        }
      });

      collsData.forEach(c => {
        if (!empSummary[c.employeeId]) return;
        const val = c.totalCollected || 0;
        totalCollections += val;
        empSummary[c.employeeId].collections += val;
      });

      // Cálculos Hoja 1 - Cuadro 1 (Flujo de Caja General)
      const totalVentasEfectivo = totalArticulosContado + totalMotosContadoVal;
      const totalIngresosEfectivoCobros = totalCollections;
      const pagosChequesRealizados = filteredChecks.filter(c => c.status === 'PAID').reduce((acc, curr) => acc + curr.amount, 0);
      const balanceFinal = totalVentasEfectivo + totalIngresosEfectivoCobros - pagosChequesRealizados;

      // Cálculos Hoja 1 - Cuadro 2 (Reporte General de Ventas)
      const totalArticulosAll = totalArticulosContado + totalArticulosCredito;
      const pctGlobalSales = globalSalesBudget > 0 ? ((totalArticulosAll / globalSalesBudget) * 100).toFixed(1) + '%' : '0%';

      if (reportType === 'pdf') {
        const doc = new jsPDF();
        const pageWidth = doc.internal.pageSize.getWidth();
        doc.setFontSize(18);
        doc.text("Reporte Comercial Avanzado", pageWidth / 2, 20, { align: "center" });
        doc.setFontSize(11);
        doc.text(\`Periodo: \${reportStartDate} a \${reportEndDate}\`, pageWidth / 2, 28, { align: "center" });
        
        doc.setFontSize(14);
        doc.text("Cuadro 1: Balance General", 14, 40);
        autoTable(doc, {
          startY: 45,
          head: [["Concepto", "Monto ($)"]],
          body: [
            ["Ventas Totales en Efectivo (Motos + Artículos)", totalVentasEfectivo.toFixed(2)],
            ["Cobros Totales", totalIngresosEfectivoCobros.toFixed(2)],
            ["Pagos de Cheques Realizados", \`-\${pagosChequesRealizados.toFixed(2)}\`],
            ["Balance Final", balanceFinal.toFixed(2)],
          ],
          theme: 'grid',
          headStyles: { fillColor: [46, 204, 113] }
        });

        doc.text("Cuadro 2: Reporte General de Ventas", 14, doc.lastAutoTable.finalY + 15);
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Concepto", "Motos (Uds)", "Monto ($)", "Presupuesto ($)", "% Cump."]],
          body: [
            ["Ventas Contado (Artículos)", "-", totalArticulosContado.toFixed(2), "-", "-"],
            ["Ventas Contado (Motos)", totalMotosContadoUds.toString(), totalMotosContadoVal.toFixed(2), "-", "-"],
            ["Ventas Crédito (Artículos)", "-", totalArticulosCredito.toFixed(2), "-", "-"],
            ["Ventas Crédito (Motos)", totalMotosCreditoUds.toString(), totalMotosCreditoVal.toFixed(2), "-", "-"],
            ["Total Ventas Artículos", "-", totalArticulosAll.toFixed(2), globalSalesBudget.toFixed(2), pctGlobalSales],
          ],
          theme: 'grid'
        });

        doc.addPage();
        doc.setFontSize(14);
        doc.text("Balance de Ventas por Vendedor", 14, 20);
        
        const empVentas = Object.values(empSummary).filter(e => e.artContado > 0 || e.artCredito > 0 || e.motosContVal > 0 || e.motosCredVal > 0 || e.salesBudget > 0).map(e => {
          const tArt = e.artContado + e.artCredito;
          const pctS = e.salesBudget > 0 ? ((tArt / e.salesBudget) * 100).toFixed(1) + '%' : '0%';
          const totalMotosUds = e.motosContUds + e.motosCredUds;
          return [
            e.name,
            totalMotosUds.toString(),
            tArt.toFixed(2),
            e.salesBudget.toFixed(2),
            pctS
          ];
        });

        autoTable(doc, {
          startY: 25,
          head: [["Vendedor", "Motos (uds)", "Total Artículos ($)", "Presupuesto ($)", "% Cump."]],
          body: empVentas,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] }
        });

        doc.text("Balance de Cobranzas por Cobrador", 14, doc.lastAutoTable.finalY + 15);
        const empCobros = Object.values(empSummary).filter(e => e.collections > 0 || e.collBudget > 0).map(e => {
          const pctC = e.collBudget > 0 ? ((e.collections / e.collBudget) * 100).toFixed(1) + '%' : '0%';
          return [
            e.name,
            e.collections.toFixed(2),
            e.collBudget.toFixed(2),
            pctC
          ];
        });
        
        autoTable(doc, {
          startY: doc.lastAutoTable.finalY + 20,
          head: [["Cobrador", "Total Cobrado ($)", "Presupuesto ($)", "% Cump."]],
          body: empCobros,
          theme: 'grid',
          headStyles: { fillColor: [79, 70, 229] }
        });

        if (filteredChecks.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text("Cheques Pagados / Pendientes", 14, 20);
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
        
        const wsGlobal = XLSX.utils.aoa_to_sheet([
          ["Reporte Comercial Avanzado"],
          [\`Periodo: \${reportStartDate} a \${reportEndDate}\`],
          [],
          ["Cuadro 1: Balance General"],
          ["Concepto", "Monto ($)"],
          ["Ventas Totales en Efectivo (Motos + Artículos)", totalVentasEfectivo],
          ["Cobros Totales", totalIngresosEfectivoCobros],
          ["Pagos de Cheques Realizados", -pagosChequesRealizados],
          ["Balance Final", balanceFinal],
          [],
          ["Cuadro 2: Reporte General de Ventas"],
          ["Concepto", "Motos (Uds)", "Monto ($)", "Presupuesto ($)", "% Cumplimiento"],
          ["Ventas Contado (Artículos)", "", totalArticulosContado, "", ""],
          ["Ventas Contado (Motos)", totalMotosContadoUds, totalMotosContadoVal, "", ""],
          ["Ventas Crédito (Artículos)", "", totalArticulosCredito, "", ""],
          ["Ventas Crédito (Motos)", totalMotosCreditoUds, totalMotosCreditoVal, "", ""],
          ["Total Ventas Artículos", "", totalArticulosAll, globalSalesBudget, pctGlobalSales]
        ]);
        XLSX.utils.book_append_sheet(wb, wsGlobal, "Reporte General");

        const empVentasData = Object.values(empSummary).filter(e => e.artContado > 0 || e.artCredito > 0 || e.motosContVal > 0 || e.motosCredVal > 0 || e.salesBudget > 0).map(e => {
          const tArt = e.artContado + e.artCredito;
          const pctS = e.salesBudget > 0 ? (tArt / e.salesBudget) : 0;
          return {
            Vendedor: e.name,
            "Motos (uds)": e.motosContUds + e.motosCredUds,
            "Total Artículos ($)": tArt,
            "Presupuesto ($)": e.salesBudget,
            "% Cump.": pctS
          };
        });
        if (empVentasData.length > 0) {
          const wsEmpV = XLSX.utils.json_to_sheet(empVentasData);
          XLSX.utils.book_append_sheet(wb, wsEmpV, "Balance Vendedores");
        }

        const empCobrosData = Object.values(empSummary).filter(e => e.collections > 0 || e.collBudget > 0).map(e => {
          const pctC = e.collBudget > 0 ? (e.collections / e.collBudget) : 0;
          return {
            Cobrador: e.name,
            "Total Cobrado ($)": e.collections,
            "Presupuesto ($)": e.collBudget,
            "% Cump.": pctC
          };
        });
        if (empCobrosData.length > 0) {
          const wsEmpC = XLSX.utils.json_to_sheet(empCobrosData);
          XLSX.utils.book_append_sheet(wb, wsEmpC, "Balance Cobradores");
        }

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
      setShowCustomReportModal(false);
    } catch (e) {
      console.error(e);
      alert('Error generando el reporte.');
    } finally {
      setLoading(false);
    }
  };`;

lines.splice(startIndex, endIndex - startIndex + 1, newFunction);
fs.writeFileSync('src/pages/Dashboard.tsx', lines.join('\n'));
console.log('Successfully updated Dashboard.tsx!');
