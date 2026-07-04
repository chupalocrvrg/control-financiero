const fs = require('fs');
let code = fs.readFileSync('src/pages/Dashboard.tsx', 'utf8');

const newReportLogic = `
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

      const startMonthStr = reportStartDate.substring(0, 7);
      const endMonthStr = reportEndDate.substring(0, 7);
      const budgetQ = query(collection(db, 'budgets'), where('month', '>=', startMonthStr), where('month', '<=', endMonthStr));
      const budgetSnap = await getDocs(budgetQ);
      const budgetsData = budgetSnap.docs.map(d => d.data());

      // Summarize
      let totalArticulosContado = 0;
      let totalArticulosCredito = 0;
      
      let totalMotosContadoUds = 0;
      let totalMotosCreditoUds = 0;
      let totalMotosContadoVal = 0;
      let totalMotosCreditoVal = 0;
      
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
            totalMotosContadoUds += 1;
            totalMotosContadoVal += val;
            empSummary[s.employeeId].motosContUds += 1;
            empSummary[s.employeeId].motosContVal += val;
          } else {
            totalMotosCreditoUds += 1;
            totalMotosCreditoVal += val;
            empSummary[s.employeeId].motosCredUds += 1;
            empSummary[s.employeeId].motosCredVal += val;
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

      const totalArticulosAll = totalArticulosContado + totalArticulosCredito;
      const totalMotosValAll = totalMotosContadoVal + totalMotosCreditoVal;
      const totalMotosUdsAll = totalMotosContadoUds + totalMotosCreditoUds;
      
      const pctGlobalSales = globalSalesBudget > 0 ? ((totalArticulosAll / globalSalesBudget) * 100).toFixed(1) + '%' : '0%';
      const pctGlobalColl = globalCollBudget > 0 ? ((totalCollections / globalCollBudget) * 100).toFixed(1) + '%' : '0%';

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
          head: [["Concepto", "Unidades", "Total ($)", "Presupuesto ($)", "% Cump."]],
          body: [
            ["Artículos Contado", "-", totalArticulosContado.toFixed(2), "-", "-"],
            ["Artículos Crédito", "-", totalArticulosCredito.toFixed(2), "-", "-"],
            ["Total Ventas Artículos", "-", totalArticulosAll.toFixed(2), globalSalesBudget.toFixed(2), pctGlobalSales],
            ["Motos Contado", totalMotosContadoUds.toString(), totalMotosContadoVal.toFixed(2), "-", "-"],
            ["Motos Crédito", totalMotosCreditoUds.toString(), totalMotosCreditoVal.toFixed(2), "-", "-"],
            ["Total Ventas Motos", totalMotosUdsAll.toString(), totalMotosValAll.toFixed(2), "-", "-"],
            ["Total Cobranzas", "-", totalCollections.toFixed(2), globalCollBudget.toFixed(2), pctGlobalColl],
          ],
          theme: 'grid'
        });

        doc.addPage();
        doc.setFontSize(14);
        doc.text("Desglose por Empleado", 14, 20);
        
        const empRows = Object.values(empSummary).filter(e => e.artContado > 0 || e.artCredito > 0 || e.motosContVal > 0 || e.motosCredVal > 0 || e.collections > 0 || e.salesBudget > 0 || e.collBudget > 0).map(e => {
          const tArt = e.artContado + e.artCredito;
          const pctS = e.salesBudget > 0 ? ((tArt / e.salesBudget) * 100).toFixed(1) + '%' : '0%';
          const pctC = e.collBudget > 0 ? ((e.collections / e.collBudget) * 100).toFixed(1) + '%' : '0%';
          return [
            e.name,
            \`\${e.artContado.toFixed(2)} / \${e.artCredito.toFixed(2)}\`,
            \`\${tArt.toFixed(2)} (\${pctS})\`,
            \`\${e.motosContVal.toFixed(2)} (\${e.motosContUds}) / \${e.motosCredVal.toFixed(2)} (\${e.motosCredUds})\`,
            \`\${e.collections.toFixed(2)} (\${pctC})\`
          ];
        });

        autoTable(doc, {
          startY: 25,
          head: [["Empleado", "Art. Contado / Crédito", "Total Art. (% Pres.)", "Motos Cont(u) / Cred(u)", "Cobranzas (% Pres.)"]],
          body: empRows,
          theme: 'grid',
          styles: { fontSize: 8 },
          headStyles: { fillColor: [79, 70, 229] }
        });

        if (filteredChecks.length > 0) {
          doc.addPage();
          doc.setFontSize(14);
          doc.text("Cheques del Mes (Pagos/Pendientes)", 14, 20);
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
            theme: 'grid',
            headStyles: { fillColor: [79, 70, 229] }
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
          ["Concepto", "Unidades", "Total ($)", "Presupuesto ($)", "% Cumplimiento"],
          ["Artículos Contado", "", totalArticulosContado, "", ""],
          ["Artículos Crédito", "", totalArticulosCredito, "", ""],
          ["Total Ventas Artículos", "", totalArticulosAll, globalSalesBudget, pctGlobalSales],
          ["Motos Contado", totalMotosContadoUds, totalMotosContadoVal, "", ""],
          ["Motos Crédito", totalMotosCreditoUds, totalMotosCreditoVal, "", ""],
          ["Total Ventas Motos", totalMotosUdsAll, totalMotosValAll, "", ""],
          ["Total Cobranzas", "", totalCollections, globalCollBudget, pctGlobalColl]
        ]);
        XLSX.utils.book_append_sheet(wb, wsGlobal, "Resumen Global");

        const empData = Object.values(empSummary).filter(e => e.artContado > 0 || e.artCredito > 0 || e.motosContVal > 0 || e.motosCredVal > 0 || e.collections > 0 || e.salesBudget > 0 || e.collBudget > 0).map(e => {
          const tArt = e.artContado + e.artCredito;
          const pctS = e.salesBudget > 0 ? (tArt / e.salesBudget) : 0;
          const pctC = e.collBudget > 0 ? (e.collections / e.collBudget) : 0;
          return {
            Empleado: e.name,
            "Artículos Contado ($)": e.artContado,
            "Artículos Crédito ($)": e.artCredito,
            "Total Artículos ($)": tArt,
            "Presupuesto Artículos ($)": e.salesBudget,
            "% Cump. Artículos": pctS,
            "Motos Contado (uds)": e.motosContUds,
            "Motos Contado ($)": e.motosContVal,
            "Motos Crédito (uds)": e.motosCredUds,
            "Motos Crédito ($)": e.motosCredVal,
            "Cobranzas ($)": e.collections,
            "Presupuesto Cobranzas ($)": e.collBudget,
            "% Cump. Cobranzas": pctC
          };
        });
        if (empData.length > 0) {
          const wsEmp = XLSX.utils.json_to_sheet(empData);
          XLSX.utils.book_append_sheet(wb, wsEmp, "Detalle Empleados");
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
  };
`;

code = code.replace(
  /  const handleGenerateAdvancedReport = async \(reportType: 'pdf' \| 'excel'\) => \{[\s\S]*?XLSX\.writeFile\(wb, \`Reporte_Avanzado_\$\{reportStartDate\}_\$\{reportEndDate\}\.xlsx\`\);\n      \}\n    \} catch \(e\) \{\n      console\.error\(e\);\n      alert\('Error generando el reporte\.'\);\n    \} finally \{\n      setLoading\(false\);\n    \}\n  \};/,
  newReportLogic.trim()
);

fs.writeFileSync('src/pages/Dashboard.tsx', code);
console.log('Patched handleGenerateAdvancedReport in Dashboard.tsx');
