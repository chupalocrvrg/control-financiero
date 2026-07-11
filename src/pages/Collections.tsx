import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, Timestamp, query, orderBy, limit } from 'firebase/firestore';
import { Plus, Pencil, Trash2, Receipt, AlertCircle, Save, X, Calendar, User, DollarSign, FileText } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useNotification } from '../contexts/NotificationContext';
import { format } from 'date-fns';

interface Employee {
  id: string;
  name: string;
  lastName: string;
  role: 'vendedor' | 'cobrador' | 'ambos';
}

interface CollectionData {
  id: string;
  employeeId: string;
  initialDate: string;
  finalDate: string;
  noReceipt: boolean;
  initialReceipt: string | null;
  finalReceipt: string | null;
  totalCollected: number;
  depositsTransfers: number;
  cashFinal: number;
  createdAt: any;
  clientName?: string;
}

export default function Collections() {
  const [collections, setCollections] = useState<CollectionData[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { showToast, showConfirm } = useNotification();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCollection, setEditingCollection] = useState<CollectionData | null>(null);
  
  // Form State
  const [formData, setFormData] = useState({
    employeeId: '',
    initialDate: format(new Date(), 'yyyy-MM-dd'),
    finalDate: format(new Date(), 'yyyy-MM-dd'),
    noReceipt: false,
    initialReceipt: '',
    finalReceipt: '',
    totalCollected: '',
    depositsTransfers: '',
    clientName: '',
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastReceipt, setLastReceipt] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [, user]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [collSnap, empSnap] = await Promise.all([
        getDocs(query(collection(db, 'collections'), orderBy('createdAt', 'desc'))),
        getDocs(query(collection(db, 'employees'), orderBy('name')))
      ]);
      
      const colls = collSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CollectionData));
      setCollections(colls);
      setEmployees(empSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Employee)));
      
      // Find the last final receipt across all collections that have receipts
      let maxReceipt = null;
      for (const c of colls) {
        if (!c.noReceipt && c.finalReceipt) {
          maxReceipt = c.finalReceipt;
          break; // Since they are ordered by desc, first one found is the latest.
        }
      }
      setLastReceipt(maxReceipt);
      
    } catch (err: any) {
      console.error('Error fetching data:', err);
      setError('Error al cargar datos');
    } finally {
      setLoading(false);
    }
  };

  const calculateNextReceipt = (receipt: string): string => {
    // Extract numeric suffix
    const match = receipt.match(/^(.*?)(\d+)$/);
    if (!match) return receipt;
    const prefix = match[1];
    const numberStr = match[2];
    const number = parseInt(numberStr, 10);
    const nextNumber = number + 1;
    // Pad with leading zeros to match length
    const paddedNext = nextNumber.toString().padStart(numberStr.length, '0');
    return `${prefix}${paddedNext}`;
  };

  const handleOpenModal = (collectionData?: CollectionData) => {
    if (collectionData) {
      setEditingCollection(collectionData);
      setFormData({
        employeeId: collectionData.employeeId,
        initialDate: collectionData.initialDate,
        finalDate: collectionData.finalDate,
        noReceipt: collectionData.noReceipt,
        initialReceipt: collectionData.initialReceipt || '',
        finalReceipt: collectionData.finalReceipt || '',
        totalCollected: collectionData.totalCollected.toString(),
        depositsTransfers: collectionData.depositsTransfers.toString(),
        clientName: collectionData.clientName || '',
      });
    } else {
      setEditingCollection(null);
      setFormData({
        employeeId: employees.find(e => e.role === 'cobrador' || e.role === 'ambos')?.id || '',
        initialDate: format(new Date(), 'yyyy-MM-dd'),
        finalDate: format(new Date(), 'yyyy-MM-dd'),
        noReceipt: false,
        initialReceipt: lastReceipt ? calculateNextReceipt(lastReceipt) : '',
        finalReceipt: '',
        totalCollected: '',
        depositsTransfers: '',
        clientName: '',
      });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    try {
      setIsSubmitting(true);
      setError(null);
      
      const tCollected = parseFloat(formData.totalCollected) || 0;
      const dTransfers = parseFloat(formData.depositsTransfers) || 0;
      const cFinal = tCollected - dTransfers;
      
      if (cFinal < 0) {
        setError('El efectivo final no puede ser negativo.');
        setIsSubmitting(false);
        return;
      }
      
      const collData = {
        employeeId: formData.employeeId,
        initialDate: formData.initialDate,
        finalDate: formData.finalDate,
        noReceipt: formData.noReceipt,
        initialReceipt: formData.noReceipt ? null : formData.initialReceipt,
        finalReceipt: formData.noReceipt ? null : formData.finalReceipt,
        totalCollected: tCollected,
        depositsTransfers: dTransfers,
        cashFinal: cFinal,
        clientName: formData.noReceipt ? formData.clientName : null,
      };

      if (editingCollection) {
        await updateDoc(doc(db, 'collections', editingCollection.id), collData);
      } else {
        await addDoc(collection(db, 'collections'), {
          ...collData,
          createdAt: Timestamp.now()
        });
      }
      setIsModalOpen(false);
      fetchData();
    } catch (err: any) {
      console.error('Error saving collection:', err);
      setError('Error al guardar cobranza');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (await showConfirm('Eliminar Cobranza', '¿Está seguro de eliminar este registro?', { type: 'danger' })) {
      try {
        await deleteDoc(doc(db, 'collections', id));
        fetchData();
        showToast('Cobranza eliminada exitosamente', 'success');
      } catch (err: any) {
        console.error('Error deleting collection:', err);
        setError('Error al eliminar registro');
        showToast('Error al eliminar registro', 'error');
      }
    }
  };

  const getEmployeeName = (id: string) => {
    const emp = employees.find(e => e.id === id);
    return emp ? `${emp.name} ${emp.lastName}` : 'Desconocido';
  };

  const calculatedCashFinal = (parseFloat(formData.totalCollected) || 0) - (parseFloat(formData.depositsTransfers) || 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-50 flex items-center gap-2">
            <Receipt className="w-6 h-6 text-indigo-500" />
            Registro de Cobranzas
          </h1>
          <p className="text-neutral-500 dark:text-neutral-400 text-sm mt-1">Gestión de lotes de cobranza y control de recibos</p>
        </div>
        <button
          onClick={() => handleOpenModal()}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
        >
          <Plus className="w-4 h-4" />
          Nueva Cobranza
        </button>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-4 rounded-xl flex items-center gap-3">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <p className="text-sm font-medium">{error}</p>
        </div>
      )}

      <div className="bg-white dark:bg-neutral-900 rounded-2xl shadow-sm border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {loading ? (
          <div className="p-8 flex justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : collections.length === 0 ? (
          <div className="p-8 text-center text-neutral-500 dark:text-neutral-400">
            No hay cobranzas registradas.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left whitespace-nowrap">
              <thead className="bg-neutral-50 dark:bg-neutral-800/50 text-neutral-600 dark:text-neutral-400 font-medium">
                <tr>
                  <th className="px-6 py-4">Fechas</th>
                  <th className="px-6 py-4">Cobrador</th>
                  <th className="px-6 py-4">Recibos</th>
                  <th className="px-6 py-4 text-right">Total Cobrado</th>
                  <th className="px-6 py-4 text-right">Depósitos</th>
                  <th className="px-6 py-4 text-right">Efectivo</th>
                  <th className="px-6 py-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200 dark:divide-neutral-800">
                {collections.map((coll) => (
                  <tr key={coll.id} className="hover:bg-neutral-50 dark:hover:bg-neutral-800/50 transition-colors">
                    <td className="px-6 py-4 text-xs">
                      <div><span className="text-neutral-500">Del:</span> {coll.initialDate}</div>
                      <div><span className="text-neutral-500">Al:</span> {coll.finalDate}</div>
                    </td>
                    <td className="px-6 py-4 font-medium text-neutral-900 dark:text-neutral-100">
                      {getEmployeeName(coll.employeeId)}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs">
                      {coll.noReceipt ? (
                        <div className="flex flex-col gap-1.5">
                          <span className="text-amber-600 dark:text-amber-400 font-bold text-xs uppercase tracking-wide">Cobro en Agencia</span>
                          {coll.clientName ? (
                            <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/30 w-fit">
                              <User className="w-3.5 h-3.5 text-amber-500" />
                              <span>{coll.clientName}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-neutral-400 italic">Sin nombre de cliente</span>
                          )}
                        </div>
                      ) : (
                        <>
                          <div className="text-indigo-600 dark:text-indigo-400 font-bold">{coll.initialReceipt}</div>
                          <div className="text-neutral-500 dark:text-neutral-400">a {coll.finalReceipt}</div>
                        </>
                      )}
                    </td>
                    <td className="px-6 py-4 text-right font-medium">
                      ${coll.totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right text-neutral-500">
                      ${coll.depositsTransfers.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      ${coll.cashFinal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => handleOpenModal(coll)}
                          className="p-2 text-neutral-500 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(coll.id)}
                          className="p-2 text-neutral-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white dark:bg-neutral-900 rounded-2xl w-full max-w-2xl shadow-xl border border-neutral-200 dark:border-neutral-800 overflow-hidden animate-in zoom-in-95 duration-200 my-8">
            <div className="flex items-center justify-between p-6 border-b border-neutral-200 dark:border-neutral-800">
              <h2 className="text-xl font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Receipt className="w-5 h-5 text-indigo-500" />
                {editingCollection ? 'Editar Cobranza' : 'Registrar Cobranza'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" /> Cobrador Asignado
                  </label>
                  <select
                    required
                    value={formData.employeeId}
                    onChange={(e) => setFormData({...formData, employeeId: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                  >
                    <option value="" disabled>Seleccione...</option>
                    {employees.filter(e => e.role === 'cobrador' || e.role === 'ambos').map(emp => (
                      <option key={emp.id} value={emp.id}>{emp.name} {emp.lastName}</option>
                    ))}
                  </select>
                </div>
                
                <div className="flex items-end">
                  <label className="flex items-center gap-3 cursor-pointer h-10 px-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 rounded-xl w-full">
                    <input
                      type="checkbox"
                      checked={formData.noReceipt}
                      onChange={(e) => setFormData({...formData, noReceipt: e.target.checked})}
                      className="w-5 h-5 text-amber-600 rounded border-neutral-300 focus:ring-amber-500"
                    />
                    <span className="font-medium text-amber-800 dark:text-amber-400 text-sm">
                      Cobro en agencia (Sin recibo de talonario)
                    </span>
                  </label>
                </div>
              </div>
              
              {formData.noReceipt && (
                <div className="mb-6 bg-white dark:bg-neutral-900 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                    <User className="w-4 h-4 text-neutral-400" /> Nombre del Cliente
                  </label>
                  <input
                    type="text"
                    required={formData.noReceipt}
                    value={formData.clientName}
                    onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                    className="w-full px-4 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                    placeholder="Nombre del cliente al que se le cobró"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-50 dark:bg-neutral-800/30 p-4 rounded-xl border border-neutral-200 dark:border-neutral-800">
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-2">Datos Iniciales</h3>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-neutral-400" /> Fecha Inicial
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.initialDate}
                      onChange={(e) => setFormData({...formData, initialDate: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                    />
                  </div>
                  {!formData.noReceipt && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-neutral-400" /> Recibo Inicial
                      </label>
                      <input
                        type="text"
                        required={!formData.noReceipt}
                        value={formData.initialReceipt}
                        onChange={(e) => setFormData({...formData, initialReceipt: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white font-mono uppercase"
                        placeholder="Ej. XXX001"
                      />
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-200 dark:border-neutral-700 pb-2">Datos Finales</h3>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-neutral-400" /> Fecha Final
                    </label>
                    <input
                      type="date"
                      required
                      value={formData.finalDate}
                      onChange={(e) => setFormData({...formData, finalDate: e.target.value})}
                      className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white"
                    />
                  </div>
                  {!formData.noReceipt && (
                    <div>
                      <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1 flex items-center gap-1.5">
                        <FileText className="w-4 h-4 text-neutral-400" /> Recibo Final
                      </label>
                      <input
                        type="text"
                        required={!formData.noReceipt}
                        value={formData.finalReceipt}
                        onChange={(e) => setFormData({...formData, finalReceipt: e.target.value})}
                        className="w-full px-4 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none text-neutral-900 dark:text-white font-mono uppercase"
                        placeholder="Ej. XXX099"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-indigo-50/50 dark:bg-indigo-900/10 p-4 rounded-xl border border-indigo-100 dark:border-indigo-800/30">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Valor Total Cobrado
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.totalCollected}
                      onChange={(e) => setFormData({...formData, totalCollected: e.target.value})}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                    Depósitos / Transf.
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-500 font-medium">$</span>
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={formData.depositsTransfers}
                      onChange={(e) => setFormData({...formData, depositsTransfers: e.target.value})}
                      className="w-full pl-8 pr-3 py-2 bg-white dark:bg-neutral-900 border border-neutral-300 dark:border-neutral-700 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none"
                      placeholder="0.00"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-bold text-emerald-700 dark:text-emerald-400 mb-1">
                    Efectivo Final
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-600 dark:text-emerald-400 font-bold">$</span>
                    <input
                      type="text"
                      disabled
                      value={calculatedCashFinal.toFixed(2)}
                      className={`w-full pl-8 pr-3 py-2 bg-emerald-50 dark:bg-emerald-900/20 border font-bold rounded-xl outline-none ${
                        calculatedCashFinal < 0 
                          ? 'border-red-300 text-red-600' 
                          : 'border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      }`}
                    />
                  </div>
                </div>
              </div>
              
              <div className="pt-4 flex justify-end gap-3 border-t border-neutral-200 dark:border-neutral-800 mt-6">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-xl transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || calculatedCashFinal < 0}
                  className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-6 py-2 rounded-xl text-sm font-medium transition-colors disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Guardar Cobranza
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
