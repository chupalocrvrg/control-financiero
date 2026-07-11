import React, { useState, useEffect } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Warehouse, Article, WarehouseInventory, Transfer } from '../../types/inventory';
import { executeTransfer } from '../../lib/inventory-db';
import { ArrowLeftRight, AlertTriangle, Plus, Trash2, Calendar, FileText, Check, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface TransferItemRow {
  articleId: string;
  quantity: number;
}

export default function TransfersTab() {
  const { user, profile } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [inventories, setInventories] = useState<WarehouseInventory[]>([]);
  const [transfers, setTransfers] = useState<Transfer[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [fromWarehouseId, setFromWarehouseId] = useState('');
  const [toWarehouseId, setToWarehouseId] = useState('');
  const [reason, setReason] = useState('TRASLADO');
  const [comment, setComment] = useState('');
  const [transferItems, setTransferItems] = useState<TransferItemRow[]>([{ articleId: '', quantity: 1 }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentEnterpriseId = profile?.role === 'BODEGUERO' ? profile?.enterpriseId : user?.uid;

  useEffect(() => {
    if (currentEnterpriseId) {
      fetchData();
    }
  }, [currentEnterpriseId]);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch warehouses
      const whQ = query(collection(db, 'warehouses'), where('userId', '==', currentEnterpriseId));
      const whSnap = await getDocs(whQ);
      const whList = whSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
      setWarehouses(whList);

      // Fetch articles
      const artQ = query(collection(db, 'articles'), where('userId', '==', currentEnterpriseId));
      const artSnap = await getDocs(artQ);
      const artList = artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(artList);

      // Fetch warehouse inventories
      const invQ = query(collection(db, 'warehouse_inventory'), where('userId', '==', currentEnterpriseId));
      const invSnap = await getDocs(invQ);
      const invList = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseInventory));
      setInventories(invList);

      // Fetch past transfers
      const transQ = query(collection(db, 'transfers'), where('userId', '==', currentEnterpriseId));
      const transSnap = await getDocs(transQ);
      const transList = transSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
        } as unknown as Transfer;
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setTransfers(transList);

      // Set defaults for form
      if (whList.length > 1) {
        setFromWarehouseId(whList[0].id);
        setToWarehouseId(whList[1].id);
      } else if (whList.length > 0) {
        setFromWarehouseId(whList[0].id);
      }
    } catch (err: any) {
      console.error('Error loading transfer data:', err);
      setError('No se pudieron cargar los datos de transferencias.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setTransferItems([...transferItems, { articleId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (transferItems.length === 1) return;
    setTransferItems(transferItems.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof TransferItemRow, value: any) => {
    const updated = [...transferItems];
    updated[index] = { ...updated[index], [field]: value };
    setTransferItems(updated);
  };

  // Get current stock for an article in the selected source warehouse
  const getAvailableStock = (articleId: string, warehouseId: string): number => {
    if (!articleId || !warehouseId) return 0;
    const inv = inventories.find(i => i.warehouseId === warehouseId && i.articleId === articleId);
    return inv ? inv.quantity : 0;
  };

  const handleTransferSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentEnterpriseId) return;

    if (!fromWarehouseId || !toWarehouseId) {
      setError('Debe seleccionar la bodega de origen y la bodega de destino.');
      return;
    }

    if (fromWarehouseId === toWarehouseId) {
      setError('La bodega de origen y destino no pueden ser la misma.');
      return;
    }

    // Validate articles list
    if (transferItems.some(item => !item.articleId)) {
      setError('Por favor seleccione un artículo en cada fila.');
      return;
    }

    // Validate quantities and stock availability
    for (const item of transferItems) {
      if (item.quantity <= 0) {
        setError('Las cantidades a transferir deben ser mayores a 0.');
        return;
      }

      const available = getAvailableStock(item.articleId, fromWarehouseId);
      if (item.quantity > available) {
        const articleName = articles.find(a => a.id === item.articleId)?.name || 'Artículo';
        setError(`Stock insuficiente para "${articleName}". Disponible en bodega de origen: ${available} uds.`);
        return;
      }
    }

    setSubmitting(true);

    try {
      await executeTransfer(
        currentEnterpriseId,
        fromWarehouseId,
        toWarehouseId,
        transferItems,
        reason,
        comment.trim()
      );

      setSuccess('¡Transferencia ejecutada de manera exitosa!');
      setComment('');
      setTransferItems([{ articleId: '', quantity: 1 }]);
      
      // Refresh data
      await fetchData();
    } catch (err: any) {
      console.error('Error processing transfer:', err);
      setError('Hubo un error al realizar la transferencia. Intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const safeFormatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return format(d, 'dd/MM/yyyy HH:mm:ss');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Transfer execution form */}
      <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ArrowLeftRight className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Nueva Transferencia</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Mueve stock de forma inmediata entre bodegas.</p>
          </div>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900/50 rounded-2xl text-red-600 dark:text-red-400 text-xs font-semibold flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-6 p-4 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/50 rounded-2xl text-emerald-600 dark:text-emerald-400 text-xs font-semibold flex items-center gap-2">
            <Check className="w-4 h-4 flex-shrink-0" />
            <span>{success}</span>
          </div>
        )}

        {warehouses.length < 2 ? (
          <div className="p-6 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-900/50 rounded-2xl text-yellow-800 dark:text-yellow-400 text-xs font-medium space-y-2">
            <p className="font-bold uppercase tracking-wider">Se requieren al menos 2 bodegas</p>
            <p>Para poder realizar transferencias, necesitas crear por lo menos dos bodegas activas en el sistema.</p>
          </div>
        ) : (
          <form onSubmit={handleTransferSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Bodega de Origen</label>
                <select
                  value={fromWarehouseId}
                  onChange={(e) => setFromWarehouseId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-neutral-900 dark:text-neutral-50 transition-all font-bold"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.assignedPerson})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Bodega de Destino</label>
                <select
                  value={toWarehouseId}
                  onChange={(e) => setToWarehouseId(e.target.value)}
                  className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-neutral-900 dark:text-neutral-50 transition-all font-bold"
                >
                  {warehouses.map(wh => (
                    <option key={wh.id} value={wh.id}>{wh.name} ({wh.assignedPerson})</option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Razón de la Transferencia</label>
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-neutral-900 dark:text-neutral-50 transition-all font-black uppercase tracking-wider"
              >
                <option value="TRASLADO">TRASLADO DE STOCK</option>
                <option value="PRÉSTAMO">PRÉSTAMO INTERNO</option>
                <option value="DEVOLUCIÓN">DEVOLUCIÓN DE ARTÍCULOS</option>
                <option value="REPOSICIÓN">REPOSICIÓN DE STOCK</option>
                <option value="OTRO">OTRA RAZÓN</option>
              </select>
            </div>

            {/* Articles List */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Artículos a transferir</label>
                <button
                  type="button"
                  onClick={handleAddItemRow}
                  className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-600 dark:text-indigo-400 hover:underline"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Añadir Artículo
                </button>
              </div>

              <div className="space-y-3">
                {transferItems.map((item, index) => {
                  const available = getAvailableStock(item.articleId, fromWarehouseId);
                  return (
                    <div key={index} className="flex gap-2 items-start bg-neutral-50 dark:bg-neutral-800/30 p-3 rounded-2xl border border-neutral-100 dark:border-neutral-800/50">
                      <div className="flex-1 space-y-1">
                        <select
                          value={item.articleId}
                          onChange={(e) => handleItemChange(index, 'articleId', e.target.value)}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                        >
                          <option value="">-- Seleccionar Artículo --</option>
                          {articles.map(art => {
                            const stock = getAvailableStock(art.id, fromWarehouseId);
                            return (
                              <option key={art.id} value={art.id} disabled={stock <= 0}>
                                {art.name} {art.series ? `(S/N: ${art.series})` : ''} - (Disp: {stock})
                              </option>
                            );
                          })}
                        </select>
                        {item.articleId && (
                          <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                            Stock Disponible: <strong className="text-neutral-600 dark:text-neutral-300">{available} uds</strong>
                          </span>
                        )}
                      </div>

                      <div className="w-20">
                        <input
                          type="number"
                          min={1}
                          max={available || 1}
                          value={item.quantity}
                          onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                          className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={() => handleRemoveItemRow(index)}
                        disabled={transferItems.length === 1}
                        className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all disabled:opacity-30"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>

            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Comentario / Justificación *</label>
              <textarea
                required
                rows={3}
                placeholder="Explique detalladamente la razón de este movimiento de mercancías..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/10 text-neutral-900 dark:text-neutral-50 transition-all resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-md hover:shadow-indigo-500/15 transition-all disabled:opacity-50"
            >
              {submitting ? 'Procesando Transferencia...' : 'Confirmar Transferencia'}
            </button>
          </form>
        )}
      </div>

      {/* Transfer History / Report */}
      <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Historial de Transferencias</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Registro detallado y firmas temporales para auditorías.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-neutral-500">Cargando registros...</p>
          </div>
        ) : transfers.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 italic text-sm">
            No se han registrado transferencias de mercancías todavía.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {transfers.map(trans => (
              <div 
                key={trans.id}
                className="bg-neutral-50 dark:bg-neutral-800/20 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4 shadow-sm"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest",
                        trans.reason === 'PRÉSTAMO' ? "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400" :
                        trans.reason === 'DEVOLUCIÓN' ? "bg-yellow-50 dark:bg-yellow-950/20 text-yellow-600 dark:text-yellow-400" :
                        "bg-indigo-50 dark:bg-indigo-950/20 text-indigo-600 dark:text-indigo-400"
                      )}>
                        {trans.reason}
                      </span>
                      <span className="text-xs text-neutral-400 font-mono">ID: {trans.id.substring(0, 8)}</span>
                    </div>
                    <div className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                      De: <strong className="text-indigo-600 dark:text-indigo-400">{trans.fromWarehouseName}</strong> → A: <strong className="text-indigo-600 dark:text-indigo-400">{trans.toWarehouseName}</strong>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeFormatDate(trans.timestamp)}
                  </div>
                </div>

                {/* Articles List */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Artículos Movilizados</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {trans.articles.map((art, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase block truncate">{art.name}</span>
                          {art.series && <span className="text-[9px] font-mono text-neutral-400 uppercase">S/N: {art.series}</span>}
                        </div>
                        <span className="px-2 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-black rounded-lg text-[10px]">
                          {art.quantity} uds
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Comment Section */}
                <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl text-xs text-neutral-600 dark:text-neutral-300">
                  <p className="font-bold uppercase text-[9px] text-neutral-400 mb-1">Comentarios</p>
                  <p className="font-medium leading-relaxed">{trans.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
