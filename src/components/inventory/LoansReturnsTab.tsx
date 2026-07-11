import React, { useState, useEffect, useRef } from 'react';
import { db } from '../../firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';
import { useAuth } from '../../contexts/AuthContext';
import { Warehouse, Article, WarehouseInventory, LoanReturn } from '../../types/inventory';
import { executeLoanReturn } from '../../lib/inventory-db';
import { ShoppingBag, AlertTriangle, Plus, Trash2, Calendar, FileText, Check, Search, User, ArrowUpRight, ArrowDownLeft } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '../../lib/utils';

interface LoanReturnItemRow {
  articleId: string;
  quantity: number;
}

export default function LoansReturnsTab() {
  const { user, profile } = useAuth();
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [inventories, setInventories] = useState<WarehouseInventory[]>([]);
  const [logs, setLogs] = useState<LoanReturn[]>([]);
  const [loading, setLoading] = useState(true);

  // Predictive Commercial House States
  const [predictiveHouses, setPredictiveHouses] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionRef = useRef<HTMLDivElement>(null);

  // Form states
  const [type, setType] = useState<'LOAN' | 'RETURN'>('LOAN');
  const [commercialHouse, setCommercialHouse] = useState('');
  const [warehouseId, setWarehouseId] = useState('');
  const [isDirectSale, setIsDirectSale] = useState(false);
  const [personName, setPersonName] = useState('');
  const [comment, setComment] = useState('');
  const [items, setItems] = useState<LoanReturnItemRow[]>([{ articleId: '', quantity: 1 }]);
  
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const currentEnterpriseId = profile?.role === 'BODEGUERO' ? profile?.enterpriseId : user?.uid;

  useEffect(() => {
    if (currentEnterpriseId) {
      fetchData();
    }
  }, [currentEnterpriseId]);

  // Click outside to close suggestions
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (suggestionRef.current && !suggestionRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Fetch warehouses
      const whQ = query(collection(db, 'warehouses'), where('userId', '==', currentEnterpriseId));
      const whSnap = await getDocs(whQ);
      const whList = whSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Warehouse));
      setWarehouses(whList);
      if (whList.length > 0 && !warehouseId) {
        setWarehouseId(whList[0].id);
      }

      // Fetch articles
      const artQ = query(collection(db, 'articles'), where('userId', '==', currentEnterpriseId));
      const artSnap = await getDocs(artQ);
      const artList = artSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
      setArticles(artList);

      // Fetch warehouse inventories (to validate returns stock)
      const invQ = query(collection(db, 'warehouse_inventory'), where('userId', '==', currentEnterpriseId));
      const invSnap = await getDocs(invQ);
      const invList = invSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as WarehouseInventory));
      setInventories(invList);

      // Fetch past loans & returns
      const lrQ = query(collection(db, 'loans_returns'), where('userId', '==', currentEnterpriseId));
      const lrSnap = await getDocs(lrQ);
      const lrList = lrSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          timestamp: data.timestamp?.toDate ? data.timestamp.toDate() : new Date(data.timestamp)
        } as unknown as LoanReturn;
      }).sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
      
      setLogs(lrList);

      // Build predictive list of commercial houses from past logs
      const uniqueHouses = Array.from(new Set(lrList.map(l => l.commercialHouse.trim())))
        .filter(name => name.length > 0)
        .sort();
      setPredictiveHouses(uniqueHouses);

    } catch (err: any) {
      console.error('Error loading loans/returns data:', err);
      setError('No se pudieron cargar los registros de préstamos y devoluciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddItemRow = () => {
    setItems([...items, { articleId: '', quantity: 1 }]);
  };

  const handleRemoveItemRow = (index: number) => {
    if (items.length === 1) return;
    setItems(items.filter((_, i) => i !== index));
  };

  const handleItemChange = (index: number, field: keyof LoanReturnItemRow, value: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: value };
    setItems(updated);
  };

  // Get current stock inselected warehouse for returns validation
  const getWarehouseStock = (articleId: string, whId: string): number => {
    if (!articleId || !whId) return 0;
    const inv = inventories.find(i => i.warehouseId === whId && i.articleId === articleId);
    return inv ? inv.quantity : 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!currentEnterpriseId) return;

    if (!commercialHouse.trim()) {
      setError('El nombre de la casa comercial es obligatorio.');
      return;
    }

    if (!isDirectSale && !warehouseId) {
      setError('Debe seleccionar una bodega de almacenamiento.');
      return;
    }

    if (!personName.trim()) {
      setError('El nombre de la persona responsable es obligatorio.');
      return;
    }

    // Validate articles list
    if (items.some(item => !item.articleId)) {
      setError('Por favor seleccione un artículo en cada fila.');
      return;
    }

    // Validate quantities and stock availability for RETURNS
    for (const item of items) {
      if (item.quantity <= 0) {
        setError('Las cantidades registradas deben ser mayores a 0.');
        return;
      }

      if (type === 'RETURN') {
        const available = getWarehouseStock(item.articleId, warehouseId);
        if (item.quantity > available) {
          const articleName = articles.find(a => a.id === item.articleId)?.name || 'Artículo';
          setError(`Stock insuficiente en bodega para devolver "${articleName}". Disponible: ${available} uds.`);
          return;
        }
      }
    }

    setSubmitting(true);

    try {
      await executeLoanReturn(
        currentEnterpriseId,
        type,
        commercialHouse.trim(),
        isDirectSale ? '' : warehouseId,
        isDirectSale,
        items,
        personName.trim(),
        comment.trim()
      );

      setSuccess(`¡${type === 'LOAN' ? 'Préstamo' : 'Devolución'} registrado correctamente!`);
      
      // Clear form
      setCommercialHouse('');
      setPersonName('');
      setComment('');
      setIsDirectSale(false);
      setItems([{ articleId: '', quantity: 1 }]);
      
      await fetchData();
    } catch (err: any) {
      console.error('Error saving loan/return log:', err);
      setError('Error al registrar la transacción. Intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredSuggestions = predictiveHouses.filter(house =>
    house.toLowerCase().includes(commercialHouse.toLowerCase()) &&
    house.toLowerCase() !== commercialHouse.toLowerCase()
  );

  const safeFormatDate = (date: any) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      return format(d, 'dd/MM/yyyy HH:mm');
    } catch (e) {
      return '';
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
      {/* Form Area */}
      <div className="lg:col-span-5 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm h-fit">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Préstamos y Devoluciones</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Gestión de mercancías con casas comerciales.</p>
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

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Action Selector */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-2">Tipo de Operación</label>
            <div className="grid grid-cols-2 gap-2 bg-neutral-100 dark:bg-neutral-800 p-1 rounded-2xl">
              <button
                type="button"
                onClick={() => {
                  setType('LOAN');
                  setError('');
                }}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                  type === 'LOAN'
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                )}
              >
                <ArrowDownLeft className="w-4 h-4 text-emerald-500" />
                Ingreso (Préstamo)
              </button>
              <button
                type="button"
                onClick={() => {
                  setType('RETURN');
                  setIsDirectSale(false); // return can't be direct sale, must pull from a warehouse
                  setError('');
                }}
                className={cn(
                  "py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5",
                  type === 'RETURN'
                    ? "bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-sm"
                    : "text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300"
                )}
              >
                <ArrowUpRight className="w-4 h-4 text-orange-500" />
                Egreso (Devolución)
              </button>
            </div>
          </div>

          {/* Searchable Commercial House */}
          <div className="relative" ref={suggestionRef}>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Casa Comercial (Buscador Predictivo) *</label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Escribe el nombre de la casa comercial..."
                value={commercialHouse}
                onChange={(e) => {
                  setCommercialHouse(e.target.value);
                  setShowSuggestions(true);
                }}
                onFocus={() => setShowSuggestions(true)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 uppercase font-bold"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>

            {showSuggestions && filteredSuggestions.length > 0 && (
              <div className="absolute left-0 right-0 mt-1 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg z-30 max-h-40 overflow-y-auto overflow-hidden divide-y divide-neutral-100 dark:divide-neutral-700">
                {filteredSuggestions.map((house, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setCommercialHouse(house);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-4 py-2.5 text-xs text-neutral-700 dark:text-neutral-300 hover:bg-indigo-50 dark:hover:bg-neutral-700/50 hover:text-indigo-600 dark:hover:text-white font-bold uppercase transition-all"
                  >
                    {house}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Direct Sale Toggle for LOAN */}
          {type === 'LOAN' && (
            <div className="flex items-center gap-3 p-4 bg-neutral-50 dark:bg-neutral-800/30 rounded-2xl border border-neutral-100 dark:border-neutral-800/50">
              <input
                type="checkbox"
                id="isDirectSale"
                checked={isDirectSale}
                onChange={(e) => setIsDirectSale(e.target.checked)}
                className="w-4 h-4 text-indigo-600 border-neutral-300 rounded focus:ring-indigo-500"
              />
              <label htmlFor="isDirectSale" className="text-xs font-bold text-neutral-700 dark:text-neutral-300 cursor-pointer">
                ¿Es Venta Directa? (No ingresa a bodega, se entrega directamente al cliente)
              </label>
            </div>
          )}

          {/* Warehouse Selection */}
          {!isDirectSale && (
            <div>
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
                {type === 'LOAN' ? 'Bodega de Ingreso *' : 'Bodega de Despacho (Devolución) *'}
              </label>
              <select
                value={warehouseId}
                onChange={(e) => setWarehouseId(e.target.value)}
                className="w-full px-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 font-bold"
              >
                {warehouses.map(wh => (
                  <option key={wh.id} value={wh.id}>{wh.name} (Resp: {wh.assignedPerson})</option>
                ))}
              </select>
            </div>
          )}

          {/* Person Delivering/Receiving */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">
              {type === 'LOAN' ? 'Persona que Entretga (Casa Comercial) *' : 'Persona que Recibe (Casa Comercial) *'}
            </label>
            <div className="relative">
              <input
                type="text"
                required
                placeholder="Ej. Carlos Mendoza"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-sm outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50 uppercase font-bold"
              />
              <User className="w-4 h-4 text-neutral-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* Multi-item selectors */}
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block">Artículos involucrados</label>
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
              {items.map((item, index) => {
                const available = getWarehouseStock(item.articleId, warehouseId);
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
                          const stock = getWarehouseStock(art.id, warehouseId);
                          return (
                            <option key={art.id} value={art.id} disabled={type === 'RETURN' && stock <= 0}>
                              {art.name} {art.series ? `(S/N: ${art.series})` : ''} {type === 'RETURN' ? `- (Dis: ${stock})` : ''}
                            </option>
                          );
                        })}
                      </select>
                      {type === 'RETURN' && item.articleId && (
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block px-1">
                          Disponible en bodega: <strong className="text-neutral-600 dark:text-neutral-300">{available} uds</strong>
                        </span>
                      )}
                    </div>

                    <div className="w-20">
                      <input
                        type="number"
                        min={1}
                        max={type === 'RETURN' ? available : undefined}
                        value={item.quantity}
                        onChange={(e) => handleItemChange(index, 'quantity', Math.max(1, parseInt(e.target.value) || 0))}
                        className="w-full px-3 py-2 bg-white dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs text-center outline-none focus:border-indigo-500 text-neutral-900 dark:text-neutral-50"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={() => handleRemoveItemRow(index)}
                      disabled={items.length === 1}
                      className="p-2 text-neutral-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded-xl transition-all disabled:opacity-30"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="text-[10px] font-black text-neutral-400 uppercase tracking-widest block mb-1.5">Comentario / Motivo del Movimiento *</label>
            <textarea
              required
              rows={3}
              placeholder="Ej. Solicitado temporalmente para demostración técnica al cliente..."
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
            {submitting ? 'Procesando Movimiento...' : `Confirmar ${type === 'LOAN' ? 'Ingreso' : 'Devolución'}`}
          </button>
        </form>
      </div>

      {/* History Log Panel */}
      <div className="lg:col-span-7 bg-white dark:bg-neutral-900 rounded-[2.5rem] border border-neutral-200 dark:border-neutral-800 p-8 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 bg-indigo-50 dark:bg-indigo-900/30 rounded-xl flex items-center justify-center text-indigo-600 dark:text-indigo-400">
            <FileText className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-extrabold text-neutral-900 dark:text-neutral-50 uppercase tracking-tight">Registro de Movimientos</h3>
            <p className="text-[10px] text-neutral-400 font-semibold uppercase">Préstamos recibidos y devoluciones entregadas históricas.</p>
          </div>
        </div>

        {loading ? (
          <div className="py-12 flex flex-col items-center justify-center">
            <div className="w-8 h-8 border-3 border-indigo-500/20 border-t-indigo-500 rounded-full animate-spin mb-3" />
            <p className="text-xs font-semibold text-neutral-500">Cargando registros...</p>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center text-neutral-400 italic text-sm">
            No se han registrado préstamos ni devoluciones aún.
          </div>
        ) : (
          <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
            {logs.map(log => (
              <div 
                key={log.id}
                className="bg-neutral-50 dark:bg-neutral-800/20 rounded-2xl border border-neutral-100 dark:border-neutral-800 p-5 space-y-4 shadow-sm"
              >
                {/* Meta Header */}
                <div className="flex flex-wrap justify-between items-start gap-2 border-b border-neutral-100 dark:border-neutral-800 pb-3">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest flex items-center gap-1",
                        log.type === 'LOAN'
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 dark:text-emerald-400"
                          : "bg-orange-50 dark:bg-orange-950/20 text-orange-600 dark:text-orange-400"
                      )}>
                        {log.type === 'LOAN' ? 'INGRESO (PRÉSTAMO)' : 'EGRESO (DEVOLUCIÓN)'}
                      </span>
                      {log.isDirectSale && (
                        <span className="px-2.5 py-0.5 text-[9px] font-black rounded-full uppercase tracking-widest bg-purple-50 dark:bg-purple-950/20 text-purple-600 dark:text-purple-400">
                          Venta Directa
                        </span>
                      )}
                      <span className="text-xs text-neutral-400 font-mono">ID: {log.id.substring(0, 8)}</span>
                    </div>
                    <div className="text-xs font-black text-neutral-900 dark:text-neutral-100 uppercase tracking-tight">
                      Casa Comercial: <strong className="text-indigo-600 dark:text-indigo-400">{log.commercialHouse}</strong>
                    </div>
                    <div className="text-[10px] font-bold text-neutral-500 dark:text-neutral-400 uppercase tracking-tight">
                      {log.isDirectSale ? 'Entregado directamente al cliente' : `Almacenamiento: ${log.warehouseName}`}
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-1 text-[10px] text-neutral-400 font-bold uppercase tracking-tight">
                    <Calendar className="w-3.5 h-3.5" />
                    {safeFormatDate(log.timestamp)}
                  </div>
                </div>

                {/* Articles List */}
                <div className="space-y-1.5">
                  <span className="text-[9px] font-black text-neutral-400 uppercase tracking-widest block">Artículos</span>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {log.articles.map((art, idx) => (
                      <div key={idx} className="flex items-center justify-between p-2.5 bg-white dark:bg-neutral-950 border border-neutral-100 dark:border-neutral-800 rounded-xl text-xs">
                        <div className="truncate pr-2">
                          <span className="font-bold text-neutral-800 dark:text-neutral-200 uppercase block truncate">{art.name}</span>
                          {art.series && <span className="text-[9px] font-mono text-neutral-400 uppercase">S/N: {art.series}</span>}
                        </div>
                        <span className={cn(
                          "px-2 py-1 font-black rounded-lg text-[10px]",
                          log.type === 'LOAN'
                            ? "bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400"
                            : "bg-orange-50 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400"
                        )}>
                          {art.quantity} uds
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Operator/Responsable */}
                <div className="flex justify-between items-center text-xs border-t border-neutral-100 dark:border-neutral-800 pt-3">
                  <span className="text-neutral-400 font-bold uppercase text-[9px]">Persona Responsable:</span>
                  <strong className="text-neutral-700 dark:text-neutral-200 uppercase">{log.personName}</strong>
                </div>

                {/* Comment Section */}
                <div className="p-3.5 bg-neutral-100 dark:bg-neutral-800/40 rounded-xl text-xs text-neutral-600 dark:text-neutral-300">
                  <p className="font-bold uppercase text-[9px] text-neutral-400 mb-1">Comentario / Motivo</p>
                  <p className="font-medium leading-relaxed">{log.comment}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
